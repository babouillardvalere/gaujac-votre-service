import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { base44 } from "../api/base44Client";
import { createPageUrl } from "../utils";
import { useTranslation } from "../components/translations";

import Logo from "../components/Logo";
import SignaturePad from "../components/SignaturePad";
import ArriveeProgressBar from "../components/ArriveeProgressBar";
import LazyInventaire from "../components/LazyInventaire";
import { clearInventaireCache } from "../components/inventaireCache";
import { getInventaireParCategorie } from "../components/categoryCodeMapping";

import { uploadCompressedImage } from "../components/imageCompression";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

import { Smile, Meh, Frown, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

/* ============================================================
   CLIENT – CONTRÔLE INVENTAIRE ARRIVÉE
============================================================ */

export default function ClientControleInventaire() {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  /* =======================
     DONNÉES SESSION
  ======================= */
  const nom = sessionStorage.getItem("arrivee_nom");
  const prenom = sessionStorage.getItem("arrivee_prenom");
  const dateArrivee = sessionStorage.getItem("arrivee_date_arrivee");
  const dateDepart = sessionStorage.getItem("arrivee_date_depart");
  const categorie = sessionStorage.getItem("arrivee_categorie");
  const numero = sessionStorage.getItem("arrivee_numero");

  /* =======================
     STATES
  ======================= */
  const [objetsCoches, setObjetsCoches] = useState({});
  const [photosObjets, setPhotosObjets] = useState({});
  const [evaluationProprete, setEvaluationProprete] = useState("");
  const [commentaireProprete, setCommentaireProprete] = useState("");
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [interventionsPreview, setInterventionsPreview] = useState({ menage: [], technique: [] });
  const [urgentDeclaration, setUrgentDeclaration] = useState(false);

  /* =======================
     OBJETS CRITIQUES
  ======================= */
  const CRITICAL_ITEMS = useMemo(
    () => ["tv", "refrigerateur", "micro_ondes", "chauffage", "plaque_cuisson", "chauffe_eau", "wc", "douche"],
    []
  );

  /* =======================
     INVENTAIRE
  ======================= */
  const inventaire = useMemo(() => getInventaireParCategorie(categorie, lang), [categorie, lang]);
  const items = inventaire?.objets || [];

  /* =======================
     INIT
  ======================= */
  useEffect(() => {
    if (!nom || !prenom || !categorie || !numero || !dateArrivee || !dateDepart) {
      navigate(createPageUrl("ClientArriveeIdentite"));
      return;
    }
    clearInventaireCache();
  }, []);

  useEffect(() => {
    const init = {};
    items.forEach((i) => (init[i.id] = false));
    setObjetsCoches(init);
  }, [items.length]);

  /* =======================
     HELPERS
  ======================= */
  const toggleObjet = (id) => {
    setObjetsCoches((p) => ({ ...p, [id]: !p[id] }));
  };

  const handleUploadPhoto = async (id, file) => {
    if (!file) return;
    try {
      const res = await uploadCompressedImage(file, (c) =>
        base44.integrations.Core.UploadFile({ file: c })
      );
      setPhotosObjets((p) => ({ ...p, [id]: res.file_url }));
      toast.success("Photo ajoutée");
    } catch {
      toast.error("Erreur upload photo");
    }
  };

  const analyzeInterventions = () => {
    const menage = [];
    const technique = [];

    items.forEach((item) => {
      if (objetsCoches[item.id]) {
        (CRITICAL_ITEMS.includes(item.id) ? technique : menage).push({
          objet: item.label,
          icon: item.icon,
          photo: photosObjets[item.id] || null
        });
      }
    });

    if (evaluationProprete === "pas_satisfaisant") {
      menage.push({ objet: "Propreté du logement", icon: "🧼", photo: null });
    }

    return { menage, technique };
  };

  /* =======================
     VALIDATION
  ======================= */
  const handlePrepareSubmit = () => {
    if (!evaluationProprete) {
      toast.error("Veuillez évaluer la propreté");
      return;
    }

    const hasIssue = Object.values(objetsCoches).some(Boolean) || evaluationProprete === "pas_satisfaisant";
    if (hasIssue && !signature) {
      toast.error("Signature obligatoire en cas de problème");
      return;
    }

    setInterventionsPreview(analyzeInterventions());
    setShowRecap(true);
  };

  /* =======================
     INTERVENTION + EVENT
  ======================= */
  const createInterventionAndFirstEvent = async ({ type, items, ficheId }) => {
    if (!items.length) return;

    const intervention = await base44.entities.Intervention.create({
      type,
      statut: "OUVERTE",
      logement: numero,
      client_nom: nom,
      client_prenom: prenom,
      fiche_arrivee_id: ficheId,
      origine: "ARRIVEE",
      source: "INVENTAIRE_ARRIVEE",
      urgent: urgentDeclaration,
      description: `Intervention ${type} - Inventaire arrivée`
    });

    await base44.entities.InterventionEvent.create({
      intervention_id: intervention.id,
      fiche_arrivee_id: ficheId,
      type: "DEMANDE_RECUE",
      message_client: "Votre demande a bien été enregistrée et transmise à nos équipes.",
      visible_client: true,
      at: new Date().toISOString(),
      auteur: "Système"
    });

    // Notification bureau
    await base44.entities.Notification.create({
      type: urgentDeclaration ? 'INCIDENT_URGENT' : 'NOUVEAU_INCIDENT',
      titre: `${urgentDeclaration ? '🔴 URGENT - ' : ''}Intervention ${type} - ${nom} ${prenom}`,
      message: `Arrivée inventaire - ${numero} - ${items.length} élément(s)`,
      destinataire_role: 'RECEPTION',
      statut: 'non_lu'
    });
  };

  /* =======================
     ENVOI FINAL
  ======================= */
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const { menage, technique } = interventionsPreview;

      const fiche = await base44.entities.FicheArrivee.create({
        client_nom: nom,
        client_prenom: prenom,
        logement: numero,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        inventaire_objets_manquants: Object.keys(objetsCoches).filter((k) => objetsCoches[k]),
        evaluation_proprete: evaluationProprete,
        commentaire_proprete: commentaireProprete,
        signature_url: signature
      });

      await createInterventionAndFirstEvent({ type: "menage", items: menage, ficheId: fiche.id });
      await createInterventionAndFirstEvent({ type: "technique", items: technique, ficheId: fiche.id });

      await base44.entities.SuiviInventaire.create({
        client_nom: nom,
        client_prenom: prenom,
        logement: numero,
        type_inventaire: "ARRIVEE",
        items_menage: menage,
        items_technique: technique,
        statut_menage: menage.length ? "en_attente" : "non_requis",
        statut_technique: technique.length ? "en_attente" : "non_requis",
        message_client: "Votre inventaire a été enregistré. Nos équipes prennent en charge votre demande.",
        fiche_arrivee_id: fiche.id,
        pdf_autorise: true
      });

      toast.success("Inventaire envoyé");
      navigate(createPageUrl("ClientResume"));
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l’envoi");
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="min-h-screen max-w-2xl mx-auto px-6 py-8">
      <Logo className="h-16 mb-4" />

      <Card className="mb-6">
        <CardContent>
          <ArriveeProgressBar etapeActuelle={3} lang={lang} />
        </CardContent>
      </Card>

      <LazyInventaire>
        <Card className="mb-6">
          <CardContent className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleObjet(item.id)}
                className={`p-4 border rounded-lg ${objetsCoches[item.id] ? "bg-orange-50 border-orange-500" : ""}`}
              >
                <div className="text-3xl">{item.icon}</div>
                <div className="font-semibold">{item.label}</div>
                {objetsCoches[item.id] && (
                  <input type="file" accept="image/*" onChange={(e) => handleUploadPhoto(item.id, e.target.files[0])} />
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      </LazyInventaire>

      {/* Bouton Urgence */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-700 mb-1">
                {lang === "fr" ? "Ce problème empêche-t-il votre installation immédiate ?" : "Does this prevent your immediate installation?"}
              </p>
              <p className="text-xs text-gray-500">
                {lang === "fr" ? "À cocher uniquement si l'hébergement n'est pas utilisable" : "Check only if accommodation is not usable"}
              </p>
            </div>
            <Button
              variant={urgentDeclaration ? "default" : "outline"}
              className={urgentDeclaration ? "bg-red-500 hover:bg-red-600" : ""}
              onClick={() => setUrgentDeclaration(!urgentDeclaration)}
            >
              {urgentDeclaration ? "🔴 URGENT" : "⚪ Non"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SignaturePad onSave={setSignature} disabled={submitting} />

      <Button className="w-full mt-6" onClick={handlePrepareSubmit}>
        <Send className="mr-2" /> Envoyer
      </Button>

      <Dialog open={showRecap}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Récapitulatif</DialogTitle>
          </DialogHeader>
          <Button onClick={handleFinalSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : "Valider"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}