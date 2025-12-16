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
  const [interventionsPreview, setInterventionsPreview] = useState({
    menage: [],
    technique: []
  });

  /* =======================
     OBJETS CRITIQUES
     (=> plutôt technique)
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
  const inventaire = useMemo(() => getInventaireParCategorie(categorie, lang), [categorie, lang]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const init = {};
    items.forEach((item) => {
      init[item.id] = false;
    });
    setObjetsCoches(init);
  }, [items.length]);

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
      Object.values(objetsCoches).some((v) => v) || evaluationProprete === "pas_satisfaisant";

    if (hasIssue && !signature) {
      toast.error(lang === "fr" ? "Signature obligatoire en cas de problème" : "Signature required");
      return;
    }

    setInterventionsPreview(analyzeInterventions());
    setShowRecap(true);
  };

  /* =======================
     CREATION INTERVENTION + EVENT
     (clé : chronologie visible client)
  ======================= */
  const createInterventionAndFirstEvent = async ({ type, itemsList, ficheId }) => {
    if (!itemsList || itemsList.length === 0) return null;

    // Ajuste si ton modèle attend "menage"/"technique" OU "MENAGE"/"TECHNIQUE"
    const intervention = await base44.entities.Intervention.create({
      type, // "menage" | "technique"
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
      visible_client: true
    });

    return intervention;
  };

  /* =======================
     ENVOI FINAL — CORRIGÉ
  ======================= */
  const handleFinalSubmit = async () => {
    setSubmitting(true);

    try {
      const { menage, technique } = interventionsPreview;

      /* 1) FICHE ARRIVÉE */
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

      /* 2) INTERVENTIONS + PREMIER EVENT (chronologie) */
      await createInterventionAndFirstEvent({
        type: "menage",
        itemsList: menage,
        ficheId: fiche.id
      });

      await createInterventionAndFirstEvent({
        type: "technique",
        itemsList: technique,
        ficheId: fiche.id
      });

      /* 3) SUIVI INVENTAIRE CLIENT (l’écran résumé client) */
      const messageClient =
        menage.length && technique.length
          ? lang === "fr"
            ? "Votre inventaire a été enregistré. Les équipes ménage et technique prennent en charge votre demande."
            : "Your inventory has been recorded. Housekeeping and technical teams are handling it."
          : menage.length
          ? lang === "fr"
            ? "Votre inventaire a été enregistré. L’équipe ménage prend en charge votre demande."
            : "Your inventory has been recorded. Housekeeping is handling it."
          : technique.length
          ? lang === "fr"
            ? "Votre inventaire a été enregistré. L’équipe technique prend en charge votre demande."
            : "Your inventory has been recorded. Technical team is handling it."
          : lang === "fr"
          ? "Votre inventaire a été enregistré."
          : "Your inventory has been recorded.";

      await base44.entities.SuiviInventaire.create({
        client_nom: nom,
        client_prenom: prenom,
        logement: numero,
        type_inventaire: "ARRIVEE",

        items_menage: menage,
        items_technique: technique,

        statut_menage: menage.length ? "en_attente" : "non_requis",
        statut_technique: technique.length ? "en_attente" : "non_requis",

        message_client: messageClient,

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
          <div className="mt-3 text-sm text-gray-600">
            {lang === "fr" ? (
              <>
                Logement <b>{numero}</b> — Arrivée <b>{dateArrivee}</b> → Départ <b>{dateDepart}</b>
              </>
            ) : (
              <>
                Accommodation <b>{numero}</b> — Check-in <b>{dateArrivee}</b> → Check-out <b>{dateDepart}</b>
              </>
            )}
          </div>
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
                  objetsCoches[item.id] ? "bg-orange-50 border-orange-500" : "border-gray-300"
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

      <Card className="mb-6">
        <CardContent>
          <h2 className="font-bold mb-2">{lang === "fr" ? "Propreté" : "Cleanliness"}</h2>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setEvaluationProprete("pas_satisfaisant")}
              className={`p-3 border rounded-lg flex justify-center ${
                evaluationProprete === "pas_satisfaisant" ? "border-orange-500 bg-orange-50" : "border-gray-300"
              }`}
              disabled={submitting}
            >
              <Frown />
            </button>

            <button
              type="button"
              onClick={() => setEvaluationProprete("correct")}
              className={`p-3 border rounded-lg flex justify-center ${
                evaluationProprete === "correct" ? "border-orange-500 bg-orange-50" : "border-gray-300"
              }`}
              disabled={submitting}
            >
              <Meh />
            </button>

            <button
              type="button"
              onClick={() => setEvaluationProprete("tres_propre")}
              className={`p-3 border rounded-lg flex justify-center ${
                evaluationProprete === "tres_propre" ? "border-orange-500 bg-orange-50" : "border-gray-300"
              }`}
              disabled={submitting}
            >
              <Smile />
            </button>
          </div>

          {(evaluationProprete === "pas_satisfaisant" || evaluationProprete === "correct") && (
            <Textarea
              className="mt-3"
              placeholder={lang === "fr" ? "Commentaire (facultatif)" : "Comment (optional)"}
              value={commentaireProprete}
              onChange={(e) => setCommentaireProprete(e.target.value)}
              disabled={submitting}
            />
          )}
        </CardContent>
      </Card>

      <SignaturePad onSave={setSignature} disabled={submitting} />

      <Button onClick={handlePrepareSubmit} className="w-full h-14 mt-6" disabled={submitting}>
        <Send className="mr-2" />
        {lang === "fr" ? "Envoyer" : "Send"}
      </Button>

      {/* RÉCAPITULATIF */}
      <Dialog open={showRecap} onOpenChange={setShowRecap}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{lang === "fr" ? "Récapitulatif" : "Summary"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div>
              <b>{lang === "fr" ? "Ménage" : "Housekeeping"} :</b>{" "}
              {interventionsPreview.menage.length
                ? `${interventionsPreview.menage.length} élément(s)`
                : lang === "fr"
                ? "Aucun"
                : "None"}
            </div>

            <div>
              <b>{lang === "fr" ? "Technique" : "Technical"} :</b>{" "}
              {interventionsPreview.technique.length
                ? `${interventionsPreview.technique.length} élément(s)`
                : lang === "fr"
                ? "Aucun"
                : "None"}
            </div>

            <div>
              <b>{lang === "fr" ? "Propreté" : "Cleanliness"} :</b> {evaluationProprete || "—"}
            </div>

            <div className="text-xs text-gray-500">
              {lang === "fr"
                ? "En validant, vos demandes seront transmises automatiquement aux équipes concernées et la chronologie apparaîtra dans le suivi."
                : "By confirming, your requests will be automatically sent to the relevant teams and the timeline will appear in tracking."}
            </div>
          </div>

          <Button onClick={handleFinalSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="animate-spin" /> : lang === "fr" ? "Valider" : "Confirm"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}