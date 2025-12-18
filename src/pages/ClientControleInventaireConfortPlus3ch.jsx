import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../api/base44Client";
import { createPageUrl } from "../utils";
import { useTranslation } from "../components/translations";
import Logo from "../components/Logo";
import SignaturePad from "../components/SignaturePad";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { Send, Loader2, Smile, Meh, Frown, Download, Home, CheckCircle } from "lucide-react";
import { toast } from "sonner";

/* ============================================================
   MH CONFORT+ 3CH - INVENTAIRE COMPLET (T01 à T06)
============================================================ */

const INVENTAIRE_CONFORT_PLUS_3CH = {
  vaisselle: [
    { id: 'assiettes_creuses', emoji: '🍽️', label: 'Assiettes creuses', qty: 8, service: 'MENAGE' },
    { id: 'assiettes_dessert', emoji: '🍰', label: 'Assiettes à dessert', qty: 8, service: 'MENAGE' },
    { id: 'assiettes_plates', emoji: '🍽️', label: 'Assiettes plates', qty: 8, service: 'MENAGE' },
    { id: 'plat', emoji: '🍲', label: 'Plat', qty: 1, service: 'MENAGE' },
    { id: 'bols', emoji: '🥣', label: 'Bols', qty: 8, service: 'MENAGE' },
    { id: 'saladiers', emoji: '🥗', label: 'Saladiers', qty: 2, service: 'MENAGE' },
    { id: 'tasses', emoji: '☕', label: 'Tasses', qty: 8, service: 'MENAGE' },
    { id: 'verres_vin', emoji: '🍷', label: 'Verres à vin', qty: 8, service: 'MENAGE' },
    { id: 'verres_eau', emoji: '🥛', label: 'Verres à eau', qty: 8, service: 'MENAGE' },
    { id: 'pichet', emoji: '🍶', label: 'Pichet / carafe', qty: 1, service: 'MENAGE' }
  ],
  couverts: [
    { id: 'fourchettes', emoji: '🍴', label: 'Fourchettes', qty: 8, service: 'MENAGE' },
    { id: 'cuilleres_soupe', emoji: '🥄', label: 'Cuillères à soupe', qty: 8, service: 'MENAGE' },
    { id: 'cuilleres_cafe', emoji: '🥄', label: 'Cuillères à café', qty: 8, service: 'MENAGE' },
    { id: 'couteau_decouper', emoji: '🔪', label: 'Couteau à découper', qty: 1, service: 'MENAGE' },
    { id: 'couteau_pain', emoji: '🔪', label: 'Couteau à pain', qty: 1, service: 'MENAGE' },
    { id: 'couteau_office', emoji: '🔪', label: 'Couteau office', qty: 1, service: 'MENAGE' },
    { id: 'couteaux', emoji: '🔪', label: 'Couteaux', qty: 8, service: 'MENAGE' },
    { id: 'cendrier', emoji: '🚬', label: 'Cendrier', qty: 1, service: 'MENAGE' },
    { id: 'couverts_salade', emoji: '🥗', label: 'Couverts à salade', qty: 1, service: 'MENAGE' },
    { id: 'spatule_bois', emoji: '🥄', label: 'Spatule en bois', qty: 1, service: 'MENAGE' },
    { id: 'eplucheur', emoji: '🥕', label: 'Éplucheur', qty: 1, service: 'MENAGE' },
    { id: 'louche', emoji: '🍜', label: 'Louche', qty: 1, service: 'MENAGE' },
    { id: 'ecumoire', emoji: '🥄', label: 'Écumoire', qty: 1, service: 'MENAGE' },
    { id: 'planche_decouper', emoji: '🔪', label: 'Planche à découper', qty: 1, service: 'MENAGE' },
    { id: 'dessous_plat', emoji: '🧤', label: 'Dessous de plat', qty: 1, service: 'MENAGE' },
    { id: 'passoire', emoji: '🥛', label: 'Passoire', qty: 1, service: 'MENAGE' },
    { id: 'essoreuse_salade', emoji: '🥬', label: 'Essoreuse à salade', qty: 1, service: 'MENAGE' },
    { id: 'tire_bouchon', emoji: '🍷', label: 'Tire-bouchon', qty: 1, service: 'MENAGE' },
    { id: 'ouvre_boite', emoji: '🥫', label: 'Ouvre-boîte', qty: 1, service: 'MENAGE' },
    { id: 'range_couverts', emoji: '🍴', label: 'Range-couverts', qty: 1, service: 'MENAGE' },
    { id: 'plateau', emoji: '🍱', label: 'Plateau', qty: 1, service: 'MENAGE' },
    { id: 'corbeille_pain', emoji: '🍞', label: 'Corbeille à pain', qty: 1, service: 'MENAGE' },
    { id: 'plat_four', emoji: '🍛', label: 'Plat à four rond', qty: 1, service: 'MENAGE' }
  ],
  batterie: [
    { id: 'cloche_micro_ondes', emoji: '🥤', label: 'Cloche micro-ondes', qty: 1, service: 'MENAGE' },
    { id: 'bac_glacons', emoji: '🧊', label: 'Bac à glaçons', qty: 1, service: 'MENAGE' },
    { id: 'casseroles', emoji: '🍲', label: 'Casseroles', qty: 3, service: 'MENAGE' },
    { id: 'poeles', emoji: '🍳', label: 'Poêles', qty: 2, service: 'MENAGE' },
    { id: 'faitout', emoji: '🍲', label: 'Faitout + couvercle', qty: 1, service: 'MENAGE' },
    { id: 'couvercle', emoji: '🔥', label: 'Couvercle', qty: 1, service: 'MENAGE' }
  ],
  appareils: [
    { id: 'cafetiere', emoji: '☕', label: 'Cafetière électrique', qty: 1, service: 'TECHNIQUE' },
    { id: 'micro_ondes', emoji: '📡', label: 'Micro-ondes', qty: 1, service: 'TECHNIQUE' },
    { id: 'tv', emoji: '📺', label: 'TV', qty: 1, service: 'TECHNIQUE' },
    { id: 'telecommande_tv', emoji: '🎛️', label: 'Télécommande TV', qty: 1, service: 'TECHNIQUE' },
    { id: 'telecommande_clim', emoji: '❄️', label: 'Télécommande climatisation', qty: 1, service: 'TECHNIQUE' },
    { id: 'refrigerateur', emoji: '🧊', label: 'Réfrigérateur', qty: 1, service: 'TECHNIQUE' },
    { id: 'plaques_cuisson', emoji: '🔥', label: 'Plaques de cuisson', qty: 1, service: 'TECHNIQUE' }
  ],
  sanitaires: [
    { id: 'lavabo', emoji: '🚰', label: 'Lavabo', qty: 1, service: 'TECHNIQUE' },
    { id: 'wc', emoji: '🚽', label: 'WC', qty: 1, service: 'TECHNIQUE' },
    { id: 'douche', emoji: '🚿', label: 'Douche', qty: 1, service: 'TECHNIQUE' }
  ],
  menage: [
    { id: 'seau', emoji: '🪣', label: 'Seau', qty: 1, service: 'MENAGE' },
    { id: 'bassine', emoji: '🧴', label: 'Bassine', qty: 1, service: 'MENAGE' },
    { id: 'balai', emoji: '🧹', label: 'Balai', qty: 1, service: 'MENAGE' },
    { id: 'balai_brosse', emoji: '🧼', label: 'Balai brosse', qty: 1, service: 'MENAGE' },
    { id: 'pelle_balayette', emoji: '🧽', label: 'Pelle + balayette', qty: 1, service: 'MENAGE' },
    { id: 'serpilliere', emoji: '🪣', label: 'Serpillière', qty: 1, service: 'MENAGE' },
    { id: 'sechoir_linge', emoji: '👕', label: 'Séchoir à linge', qty: 1, service: 'MENAGE' },
    { id: 'pinces_linge', emoji: '🧷', label: 'Pinces à linge', qty: 8, service: 'MENAGE' },
    { id: 'poubelles', emoji: '🗑️', label: 'Poubelles', qty: 2, service: 'MENAGE' },
    { id: 'detecteur_fumee', emoji: '🚨', label: 'Détecteur de fumée', qty: 1, service: 'MENAGE' }
  ],
  literie: [
    { id: 'couette_double', emoji: '🛏️', label: 'Couette double', qty: 1, service: 'MENAGE' },
    { id: 'couettes_simples', emoji: '🛏️', label: 'Couettes simples', qty: 4, service: 'MENAGE' },
    { id: 'oreillers', emoji: '🛏️', label: 'Oreillers', qty: 6, service: 'MENAGE' },
    { id: 'cintres', emoji: '👗', label: 'Cintres', qty: 10, service: 'MENAGE' }
  ],
  exterieur: [
    { id: 'cle_locative', emoji: '🗝️', label: 'Clé locative', qty: 1, service: 'TECHNIQUE' },
    { id: 'carte_barriere', emoji: '🪪', label: 'Carte barrière', qty: 1, service: 'TECHNIQUE' },
    { id: 'chaises_interieur', emoji: '🪑', label: 'Chaises intérieur', qty: 4, service: 'TECHNIQUE' },
    { id: 'table_jardin', emoji: '🍽️', label: 'Table de jardin', qty: 1, service: 'TECHNIQUE' },
    { id: 'chaises_jardin', emoji: '🪑', label: 'Chaises de jardin', qty: 6, service: 'TECHNIQUE' }
  ]
};

export default function ClientControleInventaireConfortPlus3ch() {
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
  const [submitting, setSubmitting] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    if (!nom || !prenom || !mh || !dateArrivee || !dateDepart) {
      navigate(createPageUrl("ClientArriveeIdentite"));
    }
  }, []);

  const allItems = useMemo(() => {
    return [
      ...INVENTAIRE_CONFORT_PLUS_3CH.vaisselle,
      ...INVENTAIRE_CONFORT_PLUS_3CH.couverts,
      ...INVENTAIRE_CONFORT_PLUS_3CH.batterie,
      ...INVENTAIRE_CONFORT_PLUS_3CH.appareils,
      ...INVENTAIRE_CONFORT_PLUS_3CH.sanitaires,
      ...INVENTAIRE_CONFORT_PLUS_3CH.menage,
      ...INVENTAIRE_CONFORT_PLUS_3CH.literie,
      ...INVENTAIRE_CONFORT_PLUS_3CH.exterieur
    ];
  }, []);

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

    const { menage, technique } = analyzeAnomalies();
    const hasAnomalies = menage.length > 0 || technique.length > 0;

    if (hasAnomalies && !signature) {
      toast.error(lang === "fr" ? "Signature obligatoire en cas d'anomalie" : "Signature required");
      return;
    }

    setShowRecap(true);
  };

  const createInterventionConfortPlus = async ({ service, items, ficheId }) => {
    if (!items || items.length === 0) return;

    const hasUrgent = items.some(i => i.urgent);

    const intervention = await base44.entities.Intervention.create({
      sejour_id: `ARR-${mh}-${dateArrivee.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8)}`,
      date_arrivee: dateArrivee,
      date_depart: dateDepart,
      client_nom: nom,
      client_prenom: prenom,
      logement_numero: mh,
      categorie_logement: "MH Confort+ 3 chambres",
      contexte: "ARRIVEE",
      urgent: hasUrgent,
      menage_statut: service === "MENAGE" ? "OUVERTE" : null,
      technique_statut: service === "TECHNIQUE" ? "OUVERTE" : null
    });

    await base44.entities.InterventionEvent.create({
      intervention_id: intervention.id,
      service,
      type: "DEMANDE_RECUE",
      at: new Date().toISOString(),
      auteur: "Système",
      message: `Inventaire arrivée - ${items.length} anomalie(s) détectée(s)`
    });

    await base44.entities.Notification.create({
      type: hasUrgent ? 'INCIDENT_URGENT' : 'NOUVEAU_INCIDENT',
      titre: `${hasUrgent ? '🔴 URGENT - ' : ''}Intervention ${service} - MH ${mh}`,
      message: `Arrivée inventaire - ${nom} ${prenom} - ${items.length} élément(s)`,
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
        type_logement: "mobilhome",
        categorie_logement: "MH Confort+ 3 chambres",
        inventaire_objets_manquants: [...menage, ...technique].map(i => ({
          id: i.id,
          label: i.label,
          manquant: i.qtyManquante
        })),
        evaluation_proprete: noteGlobale,
        commentaire_proprete: commentaireGlobal,
        signature_url: signature
      });

      await createInterventionConfortPlus({ service: "MENAGE", items: menage, ficheId: fiche.id });
      await createInterventionConfortPlus({ service: "TECHNIQUE", items: technique, ficheId: fiche.id });

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
              ? `Nous vous remercions du retour de votre hébergement et vous souhaitons un excellent séjour chez nous ${nom} ${prenom}.`
              : `Thank you for your feedback and we wish you an excellent stay ${nom} ${prenom}.`
            }
          </h2>
          <div className="space-y-3">
            <Button onClick={() => navigate(createPageUrl("ClientMenu"))} className="w-full bg-[#00AEEF]">
              <Home className="mr-2" />
              {lang === "fr" ? "Retour menu principal" : "Back to menu"}
            </Button>
            {pdfUrl && (
              <Button variant="outline" onClick={() => window.open(pdfUrl, '_blank')} className="w-full">
                <Download className="mr-2" />
                {lang === "fr" ? "Télécharger le contrôle inventaire (PDF)" : "Download inventory check (PDF)"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const ItemRow = ({ item }) => {
    const declared = quantities[item.id];
    const isAnomaly = declared !== undefined && declared < item.qty;

    return (
      <div className={`p-3 border rounded-lg ${isAnomaly ? 'bg-orange-50 border-orange-500' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.emoji}</span>
            <div>
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
              className="border rounded px-2 py-1 text-sm"
            >
              {Array.from({ length: item.qty + 1 }, (_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          )}
        </div>

        {isAnomaly && (
          <div className="mt-2 pt-2 border-t border-orange-300">
            <p className="text-xs text-red-600 mb-2">
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
        MH Confort+ 3ch {mh} • {nom} {prenom}
      </p>

      {Object.entries(INVENTAIRE_CONFORT_PLUS_3CH).map(([section, items]) => (
        <Card key={section} className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-[#0077A8] mb-3 capitalize">
              {lang === "fr" 
                ? section === 'vaisselle' ? '🍽️ Vaisselle' 
                  : section === 'couverts' ? '🍴 Couverts & Ustensiles'
                  : section === 'batterie' ? '🍳 Batterie & Accessoires'
                  : section === 'appareils' ? '🔌 Appareils'
                  : section === 'sanitaires' ? '🚿 Sanitaires'
                  : section === 'menage' ? '🧹 Ménage'
                  : section === 'literie' ? '🛏️ Literie & Rangement'
                  : section === 'exterieur' ? '🌳 Extérieur & Mobilier'
                  : section
                : section
              }
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map(item => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="mb-6">
        <CardContent className="p-4">
          <h3 className="font-semibold text-[#0077A8] mb-3">
            {lang === "fr" ? "Note globale hébergement *" : "Overall accommodation rating *"}
          </h3>
          <div className="flex gap-4 justify-center">
            <Button
              variant={noteGlobale === "pas_content" ? "default" : "outline"}
              onClick={() => setNoteGlobale("pas_content")}
              className={noteGlobale === "pas_content" ? "bg-red-500" : ""}
            >
              <Frown className="w-5 h-5 mr-2" />
              {lang === "fr" ? "😡 Pas content" : "😡 Not happy"}
            </Button>
            <Button
              variant={noteGlobale === "neutre" ? "default" : "outline"}
              onClick={() => setNoteGlobale("neutre")}
              className={noteGlobale === "neutre" ? "bg-gray-500" : ""}
            >
              <Meh className="w-5 h-5 mr-2" />
              {lang === "fr" ? "😐 Neutre" : "😐 Neutral"}
            </Button>
            <Button
              variant={noteGlobale === "ravi" ? "default" : "outline"}
              onClick={() => setNoteGlobale("ravi")}
              className={noteGlobale === "ravi" ? "bg-green-500" : ""}
            >
              <Smile className="w-5 h-5 mr-2" />
              {lang === "fr" ? "😄 Ravi" : "😄 Happy"}
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

      <SignaturePad onSave={setSignature} disabled={submitting} />

      <Button onClick={handlePrepareSubmit} className="w-full h-14 bg-[#00AEEF] mt-6" disabled={submitting}>
        <Send className="mr-2" />
        {lang === "fr" ? "Envoyer" : "Send"}
      </Button>

      <Dialog open={showRecap} onOpenChange={setShowRecap}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang === "fr" ? "Récapitulatif" : "Summary"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Mobil-home:</strong> {mh}</p>
              <p><strong>{lang === "fr" ? "Client" : "Guest"}:</strong> {prenom} {nom}</p>
              <p><strong>{lang === "fr" ? "Arrivée" : "Arrival"}:</strong> {dateArrivee} → {dateDepart}</p>
            </div>

            {(() => {
              const { menage, technique } = analyzeAnomalies();
              return (
                <>
                  {menage.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">🧹 {lang === "fr" ? "Interventions Ménage" : "Housekeeping Interventions"}</h3>
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
                      <h3 className="font-semibold mb-2">🔧 {lang === "fr" ? "Interventions Technique" : "Technical Interventions"}</h3>
                      {technique.map(t => (
                        <div key={t.id} className="text-sm p-2 bg-blue-50 rounded mb-1">
                          {t.emoji} {t.label}: {t.qtyManquante} manquant(s)
                          {t.urgent && <span className="ml-2 text-red-600 font-bold">🔴 URGENT</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {menage.length === 0 && technique.length === 0 && (
                    <p className="text-center text-green-600">✅ {lang === "fr" ? "Aucune anomalie signalée" : "No anomalies reported"}</p>
                  )}
                </>
              );
            })()}

            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>{lang === "fr" ? "Note globale" : "Overall rating"}:</strong> {
                noteGlobale === "pas_content" ? "😡 Pas content" :
                noteGlobale === "neutre" ? "😐 Neutre" :
                noteGlobale === "ravi" ? "😄 Ravi" : ""
              }</p>
              {commentaireGlobal && <p className="text-sm text-gray-600 mt-2">{commentaireGlobal}</p>}
            </div>

            {signature && (
              <div>
                <p className="font-semibold mb-2">{lang === "fr" ? "Signature" : "Signature"}:</p>
                <img src={signature} alt="Signature" className="border rounded" />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRecap(false)} className="flex-1">
              {lang === "fr" ? "Retour modifier" : "Back to edit"}
            </Button>
            <Button onClick={handleFinalSubmit} disabled={submitting} className="flex-1 bg-[#00AEEF]">
              {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
              {lang === "fr" ? "Confirmer et envoyer" : "Confirm and send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}