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
     SESSION
  ======================= */
  const nom = sessionStorage.getItem("arrivee_nom");
  const prenom = sessionStorage.getItem("arrivee_prenom");
  const dateArrivee = sessionStorage.getItem("arrivee_date_arrivee");
  const dateDepart = sessionStorage.getItem("arrivee_date_depart");
  const categorie = sessionStorage.getItem("arrivee_categorie");
  const numero = sessionStorage.getItem("arrivee_numero");

  /* =======================
     STATE
  ======================= */
  const [objetsCoches, setObjetsCoches] = useState({});
  const [photosObjets, setPhotosObjets] = useState({});
  const [evaluationProprete, setEvaluationProprete] = useState("");
  const [commentaireProprete, setCommentaireProprete] = useState("");
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [interventionsPreview, setInterventionsPreview] = useState({
    menage: [],
    technique: []
  });

  /* =======================
     OBJETS CRITIQUES
  ======================= */
  const CRITICAL_ITEMS = useMemo(
    () => [
      "tv",
      "refrigerateur",
      "micro_ondes",
      "chauffage",
      "plaque_cuisson",
      "chauffe_eau",
      "wc",
      "douche"
    ],
    []
  );

  /* =======================
     INVENTAIRE
  ======================= */
  const inventaire = useMemo(
    () => getInventaireParCategorie(categorie, lang),
    [categorie, lang]
  );

  const items = inventaire?.objets || [];

  /* =======================
     INIT
  ======================= */
  useEffect(() => {
    if (!nom || !categorie || !numero || !dateArrivee || !dateDepart) {
      navigate(createPageUrl("ClientArriveeIdentite"));
      return;
    }
    clearInventaireCache();
  }, [navigate, nom, categorie, numero, dateArrivee, dateDepart]);

  useEffect(() => {
    const init = {};
    items.forEach((item) => {
      init[item.id] = false;
    });
    setObjetsCoches(init);
  }, [items]);

  /* =======================
     HELPERS
  ======================= */
  const toggleObjet = (id) => {
    setObjetsCoches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUploadPhoto = async (id, file) => {
    if (!file) return;
    try {
      const result = await uploadCompressedImage(file, (compressed) =>
        base44.integrations.Core.UploadFile({ file: compressed })
      );
      setPhotosObjets((p) => ({ ...p, [id]: result.file_url }));
      toast.success("Photo ajoutée");
    } catch (e) {
      console.error(e);
      toast.error("Erreur upload photo");
    }
  };

  const analyzeInterventions = () => {
    const menage = [];
    const technique = [];

    items.forEach((item) => {
      if (objetsCoches[item.id]) {
        const target = CRITICAL_ITEMS.includes(item.id) ? technique : menage;
        target.push({
          objet: item.label,
          icon: item.icon,
          photo: photosObjets[item.id] || null
        });
      }
    });

    if (evaluationProprete === "pas_satisfaisant") {
      menage.push({
        objet: lang === "fr" ? "Propreté du logement" : "Cleanliness issue",
        icon: "🧼",
        photo: null
      });
    }

    return { menage, technique };
  };

  /* =======================
     VALIDATION AVANT ENVOI
  ======================= */
  const handlePrepareSubmit = () => {
    if (!evaluationProprete) {
      toast.error(lang === "fr" ? "Veuillez évaluer la propreté" : "Please rate cleanliness");
      return;
    }

    const hasIssue =
      Object.values(objetsCoches).some((v) => v) ||
      evaluationProprete === "pas_satisfaisant";

    if (hasIssue && !signature) {
      toast.error(lang === "fr" ? "Signature obligatoire en cas de problème" : "Signature required");
      return;
    }

    setInterventionsPreview(analyzeInterventions());
    setShowRecap(true);
  };

  /* =======================
     CREATION INTERVENTION + EVENT
  ======================= */
  const createInterventionAndFirstEvent = async ({ type, itemsList, ficheId }) => {
    if (!itemsList || itemsList.length === 0) return;

    const intervention = await base44.entities.Intervention.create({
      type,
      statut: "PRISE_EN_CHARGE",
      logement: numero,
      client_nom: nom,
      client_prenom: prenom,
      fiche_arrivee_id: ficheId,
      origine: "ARRIVEE",
      source: "INVENTAIRE_ARRIVEE",
      description:
        type === "menage"
          ? "Objets signalés (ménage) lors du contrôle d'arrivée"
          : "Objets signalés (technique) lors du contrôle d'arrivée"
    });

    await base44.entities.InterventionEvent.create({
      intervention_id: intervention.id,
      type: "PRISE_EN_CHARGE",
      message_client:
        lang === "fr"
          ? "Votre demande a bien été enregistrée et transmise à nos équipes."
          : "Your request has been registered and forwarded to our teams.",
      visible_client: true,
      at: new Date().toISOString()
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
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        logement: numero,
        inventaire_objets_manquants: Object.keys(objetsCoches).filter((k) => objetsCoches[k]),
        evaluation_proprete: evaluationProprete,
        commentaire_proprete: commentaireProprete,
        signature_url: signature
      });

      await createInterventionAndFirstEvent({ type: "menage", itemsList: menage, ficheId: fiche.id });
      await createInterventionAndFirstEvent({ type: "technique", itemsList: technique, ficheId: fiche.id });

      await base44.entities.SuiviInventaire.create({
        client_nom: nom,
        client_prenom: prenom,
        logement: numero,
        type_inventaire: "ARRIVEE",
        items_menage: menage,
        items_technique: technique,
        statut_menage: menage.length ? "en_attente" : "non_requis",
        statut_technique: technique.length ? "en_attente" : "non_requis",
        fiche_arrivee_id: fiche.id,
        pdf_autorise: true,
        nom_camping: "Camping Paradis",
        logo_camping_url: "/assets/logo-camping.png"
      });

      toast.success(lang === "fr" ? "Inventaire envoyé avec succès" : "Inventory sent successfully");
      setShowRecap(false);
      navigate(createPageUrl("ClientResume"));
    } catch (e) {
      console.error(e);
      toast.error(lang === "fr" ? "Erreur lors de l’envoi" : "Error while sending");
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

      <h1 className="text-2xl font-bold text-center mb-6">
        {lang === "fr" ? "Contrôle inventaire" : "Inventory check"} – {nom} {prenom}
      </h1>

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
                className={`p-4 border rounded-lg text-left ${
                  objetsCoches[item.id]
                    ? "bg-orange-50 border-orange-500"
                    : "border-gray-300"
                }`}
                disabled={submitting}
              >
                <div className="text-3xl mb-1">{item.icon}</div>
                <div className="text-sm font-semibold">{item.label}</div>

                {objetsCoches[item.id] && (
                  <label className="mt-2 block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadPhoto(item.id, e.target.files?.[0])}
                      disabled={submitting}
                    />
                    <span className="text-xs text-blue-600 cursor-pointer">
                      {photosObjets[item.id]
                        ? lang === "fr"
                          ? "✅ Photo ajoutée (modifier)"
                          : "✅ Photo added (change)"
                        : lang === "fr"
                        ? "📸 Ajouter photo"
                        : "📸 Add photo"}
                    </span>
                  </label>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      </LazyInventaire>

      <SignaturePad onSave={setSignature} disabled={submitting} />

      <Button onClick={handlePrepareSubmit} className="w-full h-14 mt-6" disabled={submitting}>
        <Send className="mr-2" />
        {lang === "fr" ? "Envoyer" : "Send"}
      </Button>

      <Dialog open={showRecap} onOpenChange={setShowRecap}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "fr" ? "Récapitulatif" : "Summary"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div>
              <b>Ménage :</b>{" "}
              {interventionsPreview.menage.length
                ? `${interventionsPreview.menage.length} élément(s)`
                : "Aucun"}
            </div>
            <div>
              <b>Technique :</b>{" "}
              {interventionsPreview.technique.length
                ? `${interventionsPreview.technique.length} élément(s)`
                : "Aucun"}
            </div>
          </div>

          <Button onClick={handleFinalSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="animate-spin" /> : "Valider"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}