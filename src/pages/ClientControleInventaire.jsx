import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../api/base44Client";
import { createPageUrl } from "../utils";
import { useTranslation } from "../components/translations";
import Logo from "../components/Logo";
import SignaturePad from "../components/SignaturePad";
import ArriveeProgressBar from "../components/ArriveeProgressBar";
import { getInventaireParCategorie } from "../components/categoryCodeMapping";
import InventaireItemRow from "../components/InventaireItemRow";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Smile, Meh, Frown, Send, Loader2, Home, Download, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ClientControleInventaire() {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  const nom = sessionStorage.getItem("arrivee_nom");
  const prenom = sessionStorage.getItem("arrivee_prenom");
  const dateArrivee = sessionStorage.getItem("arrivee_date_arrivee");
  const dateDepart = sessionStorage.getItem("arrivee_date_depart");
  const categorie = sessionStorage.getItem("arrivee_categorie");
  const numero = sessionStorage.getItem("arrivee_numero");

  const [quantities, setQuantities] = useState({});
  const [photos, setPhotos] = useState({});
  const [remarques, setRemarques] = useState({});
  const [urgencies, setUrgencies] = useState({});
  const [problemesTechniques, setProblemesTechniques] = useState({});
  const [autorisationAcces, setAutorisationAcces] = useState("");
  const [evaluationProprete, setEvaluationProprete] = useState("");
  const [commentaireProprete, setCommentaireProprete] = useState("");
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const inventaire = useMemo(() => getInventaireParCategorie(categorie, lang), [categorie, lang]);
  const items = inventaire?.objets || [];

  useEffect(() => {
    if (!nom || !prenom || !categorie || !numero || !dateArrivee || !dateDepart) {
      navigate(createPageUrl("ClientArriveeIdentite"));
    }
  }, []);

  const handleQuantityChange = (id, value) => {
    setQuantities(prev => ({ ...prev, [id]: value }));
  };

  const handlePhotosChange = (id, photoArray) => {
    setPhotos(prev => ({ ...prev, [id]: photoArray }));
  };

  const handleRemarqueChange = (id, text) => {
    setRemarques(prev => ({ ...prev, [id]: text }));
  };

  const handleUrgencyChange = (id, value) => {
    setUrgencies(prev => ({ ...prev, [id]: value }));
  };

  const handleProblemeTechnique = (id, value) => {
    setProblemesTechniques(prev => ({ ...prev, [id]: value }));
  };

  const analyzeAnomalies = () => {
    const menage = [];
    const technique = [];
    const reception = [];

    const ARTICLES_TECHNIQUES = [
      'tv', 'refrigerateur', 'micro_ondes', 'chauffage', 'plaques_cuisson', 'plaque_cuisson',
      'chauffe_eau', 'wc', 'douche', 'lavabo', 'feux_gaz', 'telecommande_clim', 'climatisation',
      'lave_vaisselle', 'congelateur', 'evier', 'cafetiere', 'hotte', 'cumulus', 'chauffe_eau_gaz',
      'seche_serviette', 'seche_cheveux', 'extincteur', 'detecteur_fumee'
    ];

    const ARTICLES_RECEPTION = [
      'cle_locatif', 'cle_locative', 'carte_barriere', 'badge', 'table_jardin', 'chaises_jardin',
      'salon_jardin', 'bancs_jardin', 'table_interieur', 'chaises_interieur'
    ];

    items.forEach(item => {
      const declared = quantities[item.id] !== undefined ? quantities[item.id] : item.quantity;
      const hasProblemeTechnique = problemesTechniques[item.id] || false;
      const hasAnomaly = declared < item.quantity || hasProblemeTechnique;

      if (hasAnomaly) {
        const obj = {
          id: item.id,
          label: item.label,
          emoji: item.icon,
          qtyAttendue: item.quantity,
          qtyDeclaree: declared,
          qtyManquante: item.quantity - declared,
          problemeTechnique: hasProblemeTechnique,
          urgent: urgencies[item.id] || false,
          photos: photos[item.id] || [],
          remarque: remarques[item.id] || ''
        };

        // Logique d'orientation automatique
        if (ARTICLES_TECHNIQUES.includes(item.id)) {
          technique.push(obj);
        } else if (ARTICLES_RECEPTION.includes(item.id)) {
          reception.push(obj);
        } else {
          menage.push(obj);
        }
      }
    });

    return { menage, technique, reception };
  };

  const handlePrepareSubmit = () => {
    if (!evaluationProprete) {
      toast.error(lang === "fr" ? "Veuillez évaluer la propreté" : "Please rate cleanliness");
      return;
    }

    if (!autorisationAcces) {
      toast.error(lang === "fr" ? "Veuillez indiquer l'autorisation d'accès" : "Please indicate access authorization");
      return;
    }

    const { menage, technique, reception } = analyzeAnomalies();
    const hasAnomalies = menage.length > 0 || technique.length > 0 || reception.length > 0 || evaluationProprete === "pas_satisfaisant";

    if (hasAnomalies && !signature) {
      toast.error(lang === "fr" ? "Signature obligatoire en cas d'anomalie" : "Signature required");
      return;
    }

    setShowRecap(true);
  };

  const createIntervention = async ({ service, items, ficheId }) => {
    if (!items || items.length === 0) return null;

    const hasUrgent = items.some(i => i.urgent);
    const allPhotos = items.flatMap(i => i.photos);

    // Description détaillée pour l'intervention avec remarques
    const descriptionComplete = items.map(i => {
      let desc = `${i.emoji} ${i.label}`;
      if (i.problemeTechnique) {
        desc += `: Défectueux / Ne fonctionne pas`;
      } else if (i.qtyManquante > 0) {
        desc += `: ${i.qtyManquante} manquant(s)`;
      }
      if (i.remarque) {
        desc += `\n  💬 ${i.remarque}`;
      }
      if (i.urgent) {
        desc += ' 🔴 URGENT';
      }
      return desc;
    }).join('\n\n');

    const incident = await base44.entities.Incident.create({
      stay_id: `ARR-${numero}-${dateArrivee.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8)}`,
      type: service === "MENAGE" ? "menage" : "technique",
      categorie: service === "MENAGE" ? "nettoyage" : service === "RECEPTION" ? "autre" : "divers_technique",
      description: descriptionComplete,
      urgent: hasUrgent,
      autorisation_acces: autorisationAcces,
      client_nom: nom,
      client_prenom: prenom,
      date_arrivee: dateArrivee,
      date_depart: dateDepart,
      logement: numero,
      photo_url: allPhotos[0] || null,
      statut: "en_attente",
      origine: "arrivee",
      fiche_arrivee_id: ficheId
    });

    // Notification unique regroupée par service
    const detailsItems = items.map(i => {
      let line = `• ${i.emoji} ${i.label}`;
      if (i.problemeTechnique) {
        line += `: ⚠️ Défectueux`;
      } else if (i.qtyManquante > 0) {
        line += `: ${i.qtyManquante} manquant(s)`;
      }
      if (i.remarque) {
        line += `\n  💬 ${i.remarque}`;
      }
      if (i.urgent) {
        line += ' 🔴';
      }
      return line;
    }).join('\n');

    const serviceLabel = service === 'MENAGE' ? '🧹 Ménage' : 
                         service === 'TECHNIQUE' ? '🔧 Technique' : 
                         '🏠 Réception';

    const messageNotif = `📍 Hébergement: ${categorie} ${numero}
👤 Client: ${prenom} ${nom}
📅 Séjour: ${dateArrivee} → ${dateDepart}
🔐 Accès: ${autorisationAcces === 'oui' ? '✅ Autorisé en absence' : '❌ Présence client requise'}

📋 ${items.length} anomalie(s) ${service}:
${detailsItems}

${allPhotos.length > 0 ? `📸 ${allPhotos.length} photo(s) jointe(s)` : ''}

📄 Voir la fiche complète pour le PDF du contrôle inventaire`;

    await base44.entities.Notification.create({
      type: hasUrgent ? 'INCIDENT_URGENT' : 'NOUVEAU_INCIDENT',
      titre: `${hasUrgent ? '🔴 URGENT - ' : ''}${serviceLabel} - ${numero}`,
      message: messageNotif,
      destinataire_role: 'RECEPTION',
      statut: 'non_lu'
    });

    return incident;
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const { menage, technique, reception } = analyzeAnomalies();

      const allPhotos = {};
      Object.keys(photos).forEach(key => {
        if (photos[key]?.length > 0) {
          allPhotos[key] = photos[key];
        }
      });

      const fiche = await base44.entities.FicheArrivee.create({
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        numero_logement: numero,
        categorie_logement: categorie,
        type_logement: "mobilhome",
        inventaire_objets_manquants: [...menage, ...technique],
        evaluation_proprete: evaluationProprete,
        commentaire_proprete: commentaireProprete,
        signature_url: signature,
        photos_pieces: allPhotos,
        date_validation: new Date().toISOString()
      });

      // Créer les interventions regroupées
      const interventionMenage = await createIntervention({ service: "MENAGE", items: menage, ficheId: fiche.id });
      const interventionTechnique = await createIntervention({ service: "TECHNIQUE", items: technique, ficheId: fiche.id });

      // Notification globale RÉCEPTION (vision consolidée multi-services)
      if (menage.length > 0 || technique.length > 0 || reception.length > 0) {
        const totalAnomalies = menage.length + technique.length + reception.length;
        const totalUrgent = [...menage, ...technique, ...reception].filter(i => i.urgent).length;
        const totalPhotos = [...menage, ...technique, ...reception].flatMap(i => i.photos).length;

        const resumeServices = [];
        if (technique.length > 0) resumeServices.push(`🔧 ${technique.length} technique`);
        if (menage.length > 0) resumeServices.push(`🧹 ${menage.length} ménage`);
        if (reception.length > 0) resumeServices.push(`🏠 ${reception.length} réception`);

        const messageReception = `📋 CONTRÔLE INVENTAIRE VALIDÉ

📍 Hébergement: ${categorie} ${numero}
👤 Client: ${prenom} ${nom}
📅 Séjour: ${dateArrivee} → ${dateDepart}

⚠️ ${totalAnomalies} anomalie(s) détectée(s):
${resumeServices.join(' • ')}
${totalUrgent > 0 ? `🔴 ${totalUrgent} URGENT(S)` : ''}

🔐 Accès: ${autorisationAcces === 'oui' ? '✅ Autorisé en absence client' : '❌ Présence client REQUISE'}
${totalPhotos > 0 ? `📸 ${totalPhotos} photo(s) transmise(s)` : ''}

📄 PDF complet disponible dans la fiche d'arrivée`;

        await base44.entities.Notification.create({
          type: totalUrgent > 0 ? 'INCIDENT_URGENT' : 'NOUVEAU_INCIDENT',
          titre: `${totalUrgent > 0 ? '🔴 ' : ''}📋 Contrôle Inventaire - ${numero}`,
          message: messageReception,
          destinataire_role: 'RECEPTION',
          statut: 'non_lu'
        });
      }

      const dossierId = sessionStorage.getItem('arrivee_dossier_id');
      if (dossierId) {
        await base44.entities.DossierArrivee.update(dossierId, {
          etape_4_terminee: true,
          inventaire_termine: true,
          fiche_arrivee_id: fiche.id,
          statut: 'termine'
        });
      }

      toast.success(lang === "fr" ? "Inventaire envoyé avec succès" : "Inventory sent successfully");
      setShowRecap(false);
      setShowSuccess(true);
    } catch (e) {
      console.error(e);
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
              ? `Nous vous remercions pour le retour concernant votre hébergement. Nous vous souhaitons un excellent séjour au Camping Paradis Domaine de Gaujac.`
              : `Thank you for your feedback. We wish you an excellent stay at Camping Paradis Domaine de Gaujac.`
            }
          </h2>
          <div className="space-y-3">
            <Button onClick={() => navigate(createPageUrl("ClientMenu"))} className="w-full bg-[#00AEEF]">
              <Home className="mr-2" />
              {lang === "fr" ? "Retour menu principal" : "Back to main menu"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-8">
      <Logo className="h-16 mb-4" />

      <Card className="mb-6">
        <CardContent className="p-4">
          <ArriveeProgressBar etapeActuelle={4} lang={lang} />
        </CardContent>
      </Card>

      <h1 className="text-2xl font-bold text-center mb-2">
        {lang === "fr" ? "Contrôle inventaire" : "Inventory check"}
      </h1>
      <p className="text-center text-gray-600 mb-6">
        {categorie} {numero} • {nom} {prenom}
      </p>

      <Card className="mb-6">
        <CardContent className="p-6 space-y-3">
          {items.map(item => (
            <InventaireItemRow
              key={item.id}
              item={{ ...item, emoji: item.icon, qty: item.quantity }}
              quantity={quantities[item.id]}
              photos={photos[item.id] || []}
              remarque={remarques[item.id] || ''}
              onQuantityChange={handleQuantityChange}
              onPhotosChange={handlePhotosChange}
              onRemarqueChange={handleRemarqueChange}
              onUrgencyChange={handleUrgencyChange}
              onProblemeTechnique={handleProblemeTechnique}
              urgent={urgencies[item.id]}
              problemeTechniqueSignale={problemesTechniques[item.id]}
              lang={lang}
            />
          ))}
        </CardContent>
      </Card>

      {/* Autorisation d'accès */}
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
          <RadioGroup value={autorisationAcces} onValueChange={setAutorisationAcces}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="oui" id="acces-oui" />
              <Label htmlFor="acces-oui" className="cursor-pointer flex-1">
                ✔ {lang === "fr" ? "Oui" : "Yes"}
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="non" id="acces-non" />
              <Label htmlFor="acces-non" className="cursor-pointer flex-1">
                ✖ {lang === "fr" ? "Non" : "No"}
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Évaluation globale */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold text-[#0077A8] mb-3">
            {lang === "fr" ? "😊 Appréciation globale de la propreté *" : "😊 Overall cleanliness rating *"}
          </h3>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              variant={evaluationProprete === "pas_satisfaisant" ? "default" : "outline"}
              onClick={() => setEvaluationProprete("pas_satisfaisant")}
              className={evaluationProprete === "pas_satisfaisant" ? "bg-red-500" : ""}
            >
              <Frown className="w-5 h-5 mr-2" />
              {lang === "fr" ? "😠 Insatisfaisant" : "😠 Unsatisfactory"}
            </Button>
            <Button
              variant={evaluationProprete === "correct" ? "default" : "outline"}
              onClick={() => setEvaluationProprete("correct")}
              className={evaluationProprete === "correct" ? "bg-gray-500" : ""}
            >
              <Meh className="w-5 h-5 mr-2" />
              {lang === "fr" ? "😐 Correct" : "😐 Correct"}
            </Button>
            <Button
              variant={evaluationProprete === "tres_propre" ? "default" : "outline"}
              onClick={() => setEvaluationProprete("tres_propre")}
              className={evaluationProprete === "tres_propre" ? "bg-green-500" : ""}
            >
              <Smile className="w-5 h-5 mr-2" />
              {lang === "fr" ? "😄 Très propre" : "😄 Very clean"}
            </Button>
          </div>

          {evaluationProprete && (
            <Textarea
              value={commentaireProprete}
              onChange={(e) => setCommentaireProprete(e.target.value)}
              placeholder={lang === "fr" ? "Commentaire libre (facultatif)" : "Free comment (optional)"}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      <SignaturePad onSave={setSignature} disabled={submitting} lang={lang} />

      <Button onClick={handlePrepareSubmit} className="w-full h-14 bg-[#00AEEF] mt-6" disabled={submitting}>
        <Send className="mr-2" />
        {lang === "fr" ? "Valider le contrôle inventaire" : "Confirm inventory check"}
      </Button>

      {/* Dialog Récapitulatif */}
      <Dialog open={showRecap} onOpenChange={setShowRecap}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang === "fr" ? "Récapitulatif du contrôle inventaire" : "Inventory check summary"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>{lang === "fr" ? "Hébergement" : "Accommodation"}:</strong> {categorie} {numero}</p>
              <p><strong>{lang === "fr" ? "Client" : "Guest"}:</strong> {prenom} {nom}</p>
              <p><strong>{lang === "fr" ? "Arrivée" : "Arrival"}:</strong> {dateArrivee} → {dateDepart}</p>
            </div>

            {(() => {
              const { menage, technique, reception } = analyzeAnomalies();
              const renderItems = (items, bgColor) => items.map(m => (
                <div key={m.id} className={`text-sm p-3 ${bgColor} rounded mb-2 border`}>
                  <p className="font-semibold">
                    {m.emoji} {m.label}
                    {m.urgent && <span className="ml-2 text-red-600 font-bold">🔴 URGENT</span>}
                  </p>
                  {m.problemeTechnique && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ {lang === "fr" ? "Équipement défectueux" : "Defective equipment"}</p>
                  )}
                  {m.qtyManquante > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      {lang === "fr" ? "Manquant" : "Missing"}: {m.qtyManquante}
                    </p>
                  )}
                  {m.remarque && (
                    <p className="text-xs text-gray-700 mt-2 italic bg-white/50 p-2 rounded">
                      💬 {m.remarque}
                    </p>
                  )}
                  {m.photos?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {m.photos.map((p, idx) => (
                        <img key={idx} src={p} alt={`Photo ${idx + 1}`} className="w-16 h-16 object-cover rounded border-2 border-white" />
                      ))}
                    </div>
                  )}
                </div>
              ));

              return (
                <>
                  {technique.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-blue-700">🔧 {lang === "fr" ? "Interventions Technique" : "Technical"} ({technique.length})</h3>
                      {renderItems(technique, 'bg-blue-50')}
                    </div>
                  )}

                  {menage.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-yellow-700">🧹 {lang === "fr" ? "Interventions Ménage" : "Housekeeping"} ({menage.length})</h3>
                      {renderItems(menage, 'bg-yellow-50')}
                    </div>
                  )}

                  {reception.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-green-700">🏠 {lang === "fr" ? "Réception / Logistique" : "Reception / Logistics"} ({reception.length})</h3>
                      {renderItems(reception, 'bg-green-50')}
                    </div>
                  )}

                  {menage.length === 0 && technique.length === 0 && reception.length === 0 && (
                    <p className="text-center text-green-600">✅ {lang === "fr" ? "Aucune anomalie signalée" : "No anomalies reported"}</p>
                  )}
                </>
              );
            })()}

            <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-400">
              <p className="font-bold text-orange-800">
                🔐 {lang === "fr" ? "Autorisation d'accès" : "Access authorization"}: {autorisationAcces === 'oui' ? '✅ Oui' : '❌ Non'}
              </p>
              {autorisationAcces === 'non' && (
                <p className="text-xs text-orange-700 mt-1">
                  {lang === "fr" 
                    ? "Le client doit être présent lors de l'intervention"
                    : "Client must be present during intervention"}
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>{lang === "fr" ? "Appréciation globale" : "Overall rating"}:</strong> {
                evaluationProprete === "pas_satisfaisant" ? "😠 Insatisfaisant" :
                evaluationProprete === "correct" ? "😐 Correct" :
                evaluationProprete === "tres_propre" ? "😄 Très propre" : ""
              }</p>
              {commentaireProprete && <p className="text-sm text-gray-600 mt-2">{commentaireProprete}</p>}
            </div>

            {signature && (
              <div>
                <p className="font-semibold mb-2">{lang === "fr" ? "Signature" : "Signature"}:</p>
                <img src={signature} alt="Signature" className="border rounded max-h-32" />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRecap(false)} className="flex-1">
              {lang === "fr" ? "Modifier" : "Edit"}
            </Button>
            <Button onClick={handleFinalSubmit} disabled={submitting} className="flex-1 bg-[#00AEEF]">
              {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
              {lang === "fr" ? "Valider définitivement" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}