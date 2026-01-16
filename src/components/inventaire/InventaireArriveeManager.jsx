import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../../api/base44Client";
import { createPageUrl } from "../../utils";
import { useTranslation } from "../translations";
import Logo from "../Logo";
import SignaturePad from "../SignaturePad";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { Send, Loader2, Smile, Meh, Frown, Download, Home, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import errorLogger from "../qa/ErrorLogger";

export default function InventaireArriveeManager({ 
  inventaireData, 
  categorieLogement,
  typeLogement = "mobilhome" 
}) {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  const nom = sessionStorage.getItem("arrivee_nom");
  const prenom = sessionStorage.getItem("arrivee_prenom");
  const dateArrivee = sessionStorage.getItem("arrivee_date_arrivee");
  const dateDepart = sessionStorage.getItem("arrivee_date_depart");
  const mh = sessionStorage.getItem("arrivee_numero");

  const [quantities, setQuantities] = useState({});
  const [urgencies, setUrgencies] = useState({});
  const [noteGlobale, setNoteGlobale] = useState("");
  const [commentaireGlobal, setCommentaireGlobal] = useState("");
  const [signature, setSignature] = useState("");
  const [autorisationAcces, setAutorisationAcces] = useState("");
  const [plagesHoraires, setPlagesHoraires] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    if (!nom || !prenom || !mh || !dateArrivee || !dateDepart) {
      navigate(createPageUrl("ClientArriveeIdentite"));
    }
  }, [nom, prenom, mh, dateArrivee, dateDepart, navigate]);

  const allItems = useMemo(() => {
    return Object.values(inventaireData).flat();
  }, [inventaireData]);

  const handleQuantityChange = (id, value) => {
    setQuantities(prev => ({ ...prev, [id]: parseInt(value, 10) }));
  };

  const toggleUrgency = (id) => {
    setUrgencies(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const analyzeAnomalies = () => {
    const menage = [];
    const technique = [];

    allItems.forEach(item => {
      const declared = quantities[item.id];
      if (declared !== undefined && declared < item.qty) {
        const manquant = item.qty - declared;
        const obj = {
          id: item.id,
          label: item.label,
          emoji: item.emoji,
          qtyAttendue: item.qty,
          qtyDeclaree: declared,
          qtyManquante: manquant,
          urgent: urgencies[item.id] || false
        };
        
        if (item.service === 'TECHNIQUE') {
          technique.push(obj);
        } else {
          menage.push(obj);
        }
      }
    });

    return { menage, technique };
  };

  const handlePrepareSubmit = () => {
    if (!noteGlobale) {
      toast.error(lang === "fr" ? "Veuillez donner votre ressenti global" : "Please rate your overall impression");
      return;
    }

    if (!autorisationAcces) {
      toast.error(lang === "fr" ? "Veuillez indiquer l'autorisation d'accès" : "Please indicate access authorization");
      return;
    }

    if (autorisationAcces === "non" && plagesHoraires.length === 0) {
      toast.error(lang === "fr" ? "Veuillez sélectionner au moins une plage horaire" : "Please select at least one time slot");
      return;
    }

    const { menage, technique } = analyzeAnomalies();
    const hasAnomalies = menage.length > 0 || technique.length > 0;

    if (hasAnomalies && !signature) {
      toast.error(lang === "fr" ? "Signature obligatoire en cas d'anomalie" : "Signature required");
      return;
    }

    setShowRecap(true);
  };

  const createIntervention = async ({ service, items, ficheId }) => {
    if (!items || items.length === 0) return;

    const hasUrgent = items.some(i => i.urgent);
    const description = items.map(i => `${i.emoji} ${i.label}: ${i.qtyManquante} manquant(s)`).join('\n');

    // Log action utilisateur
    errorLogger.logUserAction('Création intervention depuis inventaire arrivée', {
      service,
      itemsCount: items.length,
      hasUrgent,
      ficheId
    });

    const incident = await base44.entities.Incident.create({
      stay_id: `ARR-${mh}-${dateArrivee.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8)}`,
      type: service === 'MENAGE' ? 'menage' : 'technique',
      categorie: service === 'MENAGE' ? 'nettoyage' : 'divers_technique',
      description,
      urgent: hasUrgent,
      client_nom: nom,
      client_prenom: prenom,
      date_arrivee: dateArrivee,
      date_depart: dateDepart,
      logement: mh,
      statut: 'en_attente',
      date_saisie: new Date().toISOString(),
      origine: 'arrivee',
      fiche_arrivee_id: ficheId,
      autorisation_acces: autorisationAcces,
      plage_horaire_client: autorisationAcces === 'non' ? plagesHoraires.join(', ') : null
    });

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: 'creation',
      horodatage: new Date().toISOString(),
      utilisateur: `${prenom} ${nom}`,
      utilisateur_role: 'client',
      commentaire: `Inventaire arrivée - ${items.length} anomalie(s) détectée(s)`
    });

    await base44.entities.Notification.create({
      type: hasUrgent ? 'INCIDENT_URGENT' : 'NOUVEAU_INCIDENT',
      titre: `${hasUrgent ? '🔴 URGENT - ' : ''}${service} - ${categorieLogement} ${mh}`,
      message: `Arrivée - ${nom} ${prenom} - ${items.length} élément(s) manquant(s)`,
      destinataire_role: 'RECEPTION',
      statut: 'non_lu'
    });
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const { menage, technique } = analyzeAnomalies();

      const fiche = await base44.entities.FicheArrivee.create({
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        numero_logement: mh,
        type_logement: typeLogement,
        categorie_logement: categorieLogement,
        inventaire_objets_manquants: [...menage, ...technique].map(i => ({
          id: i.id,
          label: i.label,
          manquant: i.qtyManquante,
          urgent: i.urgent
        })),
        evaluation_proprete: noteGlobale,
        commentaire_proprete: commentaireGlobal,
        signature_url: signature,
        autorisation_acces: autorisationAcces,
        plage_horaire_client: autorisationAcces === 'non' ? plagesHoraires.join(', ') : null,
        date_validation: new Date().toISOString()
      });

      await Promise.all([
        createIntervention({ service: "MENAGE", items: menage, ficheId: fiche.id }),
        createIntervention({ service: "TECHNIQUE", items: technique, ficheId: fiche.id })
      ]);

      toast.success(lang === "fr" ? "Inventaire envoyé avec succès ✅" : "Inventory sent successfully ✅");
      setShowRecap(false);
      setShowSuccess(true);
    } catch (e) {
      console.error("Erreur soumission inventaire:", e);
      toast.error(lang === "fr" ? "Erreur lors de l'envoi" : "Error while sending");
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-6">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-[#0077A8]">
            {lang === "fr" 
              ? `Merci ${prenom} ${nom} ! Nous vous souhaitons un excellent séjour chez nous.`
              : `Thank you ${prenom} ${nom}! We wish you an excellent stay.`
            }
          </h2>
          <Button onClick={() => navigate(createPageUrl("ClientMenu"))} className="w-full bg-[#00AEEF]">
            <Home className="mr-2" />
            {lang === "fr" ? "Retour menu principal" : "Back to menu"}
          </Button>
        </div>
      </div>
    );
  }

  const ItemRow = ({ item }) => {
    const declared = quantities[item.id];
    const isAnomaly = declared !== undefined && declared < item.qty;

    return (
      <div className={`p-3 border rounded-lg transition-all ${isAnomaly ? 'bg-orange-50 border-orange-500' : 'border-gray-200 hover:border-gray-300'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{item.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-gray-500">
                {lang === "fr" ? "Attendu" : "Expected"}: {item.qty}
              </p>
            </div>
          </div>
          {!isAnomaly ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuantityChange(item.id, item.qty - 1)}
            >
              {lang === "fr" ? "Signaler" : "Report"}
            </Button>
          ) : (
            <select
              value={declared}
              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
              className="border rounded px-2 py-1 text-sm min-w-[60px]"
            >
              {Array.from({ length: item.qty + 1 }, (_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          )}
        </div>

        {isAnomaly && (
          <div className="mt-2 pt-2 border-t border-orange-300">
            <p className="text-xs text-red-600 mb-2 font-semibold">
              ⚠️ Manquant: {item.qty - declared}
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={urgencies[item.id] || false}
                onCheckedChange={() => toggleUrgency(item.id)}
                className="data-[state=checked]:bg-red-500"
              />
              <span className="text-xs text-gray-700">
                {lang === "fr" ? "🆘 Urgent (empêche l'installation)" : "🆘 Urgent (prevents installation)"}
              </span>
            </label>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-8">
      <Logo className="h-16 mb-4" />

      <h1 className="text-2xl font-bold text-center mb-2">
        {lang === "fr" ? "Contrôle inventaire" : "Inventory check"}
      </h1>
      <p className="text-center text-gray-600 mb-6">
        {categorieLogement} {mh} • {nom} {prenom}
      </p>

      {Object.entries(inventaireData).map(([section, items]) => (
        <Card key={section} className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-[#0077A8] mb-3 capitalize">
              {section}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map(item => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="mb-6 border-2 border-[#FFA500]">
        <CardContent className="p-6">
          <h3 className="font-semibold text-[#0077A8] mb-3 flex items-center gap-2">
            🔐 {lang === "fr" ? "Autorisation d'accès *" : "Access authorization *"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {lang === "fr" 
              ? "Autorisez-vous notre intervenant à entrer dans votre hébergement en votre absence ?"
              : "Do you authorize our staff to enter your accommodation in your absence?"}
          </p>
          <div className="space-y-3">
            <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${autorisationAcces === 'oui' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-300'}`}>
              <input
                type="radio"
                name="autorisation"
                value="oui"
                checked={autorisationAcces === 'oui'}
                onChange={(e) => {
                  setAutorisationAcces(e.target.value);
                  setPlagesHoraires([]);
                }}
                className="w-5 h-5"
              />
              <span className="font-medium">✔ {lang === "fr" ? "Oui" : "Yes"}</span>
            </label>
            <label className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${autorisationAcces === 'non' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-300'}`}>
              <input
                type="radio"
                name="autorisation"
                value="non"
                checked={autorisationAcces === 'non'}
                onChange={(e) => setAutorisationAcces(e.target.value)}
                className="w-5 h-5"
              />
              <span className="font-medium">✖ {lang === "fr" ? "Non" : "No"}</span>
            </label>
          </div>

          {autorisationAcces === "non" && (
            <div className="mt-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
              <h4 className="font-semibold text-orange-800 mb-3">
                ⏰ {lang === "fr" ? "Plages horaires possibles:" : "Available time slots:"}
              </h4>
              <div className="space-y-2">
                {['09h - 12h', '14h - 16h', '17h - 19h'].map(plage => (
                  <label key={plage} className="flex items-center space-x-3 p-2 hover:bg-orange-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plagesHoraires.includes(plage)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlagesHoraires([...plagesHoraires, plage]);
                        } else {
                          setPlagesHoraires(plagesHoraires.filter(p => p !== plage));
                        }
                      }}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">{plage}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="font-semibold text-[#0077A8] mb-3">
            {lang === "fr" ? "Note globale hébergement *" : "Overall accommodation rating *"}
          </h3>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              variant={noteGlobale === "pas_content" ? "default" : "outline"}
              onClick={() => setNoteGlobale("pas_content")}
              className={noteGlobale === "pas_content" ? "bg-red-500" : ""}
            >
              <Frown className="w-5 h-5 mr-2" />
              {lang === "fr" ? "Pas content" : "Not happy"}
            </Button>
            <Button
              variant={noteGlobale === "neutre" ? "default" : "outline"}
              onClick={() => setNoteGlobale("neutre")}
              className={noteGlobale === "neutre" ? "bg-gray-500" : ""}
            >
              <Meh className="w-5 h-5 mr-2" />
              {lang === "fr" ? "Neutre" : "Neutral"}
            </Button>
            <Button
              variant={noteGlobale === "ravi" ? "default" : "outline"}
              onClick={() => setNoteGlobale("ravi")}
              className={noteGlobale === "ravi" ? "bg-green-500" : ""}
            >
              <Smile className="w-5 h-5 mr-2" />
              {lang === "fr" ? "Ravi" : "Happy"}
            </Button>
          </div>

          {noteGlobale && (
            <Textarea
              value={commentaireGlobal}
              onChange={(e) => setCommentaireGlobal(e.target.value)}
              placeholder={lang === "fr" ? "Commentaire libre (facultatif)" : "Free comment (optional)"}
              className="mt-3"
            />
          )}
        </CardContent>
      </Card>

      <SignaturePad onSave={setSignature} disabled={submitting} lang={lang} />

      <Button 
        onClick={handlePrepareSubmit} 
        className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] mt-6 font-semibold" 
        disabled={submitting}
      >
        <Send className="mr-2" />
        {lang === "fr" ? "Valider l'inventaire" : "Validate inventory"}
      </Button>

      <Dialog open={showRecap} onOpenChange={setShowRecap}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang === "fr" ? "Récapitulatif" : "Summary"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>{lang === "fr" ? "Hébergement" : "Accommodation"}:</strong> {categorieLogement} {mh}</p>
              <p><strong>{lang === "fr" ? "Client" : "Guest"}:</strong> {prenom} {nom}</p>
              <p><strong>{lang === "fr" ? "Arrivée" : "Arrival"}:</strong> {dateArrivee} → {dateDepart}</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-400">
              <p className="font-bold text-orange-800">
                🔐 {lang === "fr" ? "Autorisation d'accès" : "Access authorization"}: {autorisationAcces === 'oui' ? '✅ Oui' : '❌ Non'}
              </p>
              {autorisationAcces === 'non' && plagesHoraires.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-orange-700 font-semibold mb-1">
                    {lang === "fr" ? "Plages horaires:" : "Time slots:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {plagesHoraires.map(plage => (
                      <span key={plage} className="px-2 py-1 bg-orange-200 text-orange-900 text-xs rounded">
                        {plage}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(() => {
              const { menage, technique } = analyzeAnomalies();
              return (
                <>
                  {menage.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">🧹 {lang === "fr" ? "Interventions Ménage" : "Housekeeping"}</h3>
                      {menage.map(m => (
                        <div key={m.id} className="text-sm p-2 bg-yellow-50 rounded mb-1">
                          {m.emoji} {m.label}: {m.qtyManquante} manquant(s)
                          {m.urgent && <span className="ml-2 text-red-600 font-bold">🔴 URGENT</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {technique.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">🔧 {lang === "fr" ? "Interventions Technique" : "Technical"}</h3>
                      {technique.map(t => (
                        <div key={t.id} className="text-sm p-2 bg-blue-50 rounded mb-1">
                          {t.emoji} {t.label}: {t.qtyManquante} manquant(s)
                          {t.urgent && <span className="ml-2 text-red-600 font-bold">🔴 URGENT</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {menage.length === 0 && technique.length === 0 && (
                    <p className="text-center text-green-600">✅ {lang === "fr" ? "Aucune anomalie signalée" : "No anomalies"}</p>
                  )}
                </>
              );
            })()}

            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>{lang === "fr" ? "Note globale" : "Rating"}:</strong> {
                noteGlobale === "pas_content" ? "😡" :
                noteGlobale === "neutre" ? "😐" :
                noteGlobale === "ravi" ? "😄" : ""
              }</p>
              {commentaireGlobal && <p className="text-sm text-gray-600 mt-2">{commentaireGlobal}</p>}
            </div>

            {signature && (
              <div>
                <p className="font-semibold mb-2">{lang === "fr" ? "Signature" : "Signature"}:</p>
                <img src={signature} alt="Signature" className="border rounded max-w-full" />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRecap(false)} className="flex-1">
              {lang === "fr" ? "Modifier" : "Edit"}
            </Button>
            <Button onClick={handleFinalSubmit} disabled={submitting} className="flex-1 bg-[#00AEEF]">
              {submitting && <Loader2 className="animate-spin mr-2" />}
              {lang === "fr" ? "Confirmer" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}