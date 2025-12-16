import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import Logo from "../components/Logo";
import OfflineBanner from "../components/OfflineBanner";
import CollaborateurNotificationBell from "../components/CollaborateurNotificationBell";
import InterventionTimer from "../components/InterventionTimer";
import MettreEnAttenteDialog from "../components/MettreEnAttenteDialog";
import PhotoInterventionCapture from "../components/PhotoInterventionCapture";
import { useTranslation } from "../components/translations";
import { createPageUrl } from "../utils";

import {
  Button,
  Card,
  CardContent,
  Badge,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui";

import { Play, Pause, CheckCircle, Loader2 } from "lucide-react";

/* ============================================================
   TECHNIQUE – INTERVENTIONS (SYNC SUIVI + TIMELINE CLIENT)
============================================================ */

export default function Technique() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [collaborateurNom, setCollaborateurNom] = useState("");
  const [commentaire, setCommentaire] = useState("");

  const [incidentToWait, setIncidentToWait] = useState(null);
  const [showAttenteDialog, setShowAttenteDialog] = useState(false);

  const [showPhotoAvant, setShowPhotoAvant] = useState(false);
  const [showPhotoApres, setShowPhotoApres] = useState(false);
  const [incidentForPhoto, setIncidentForPhoto] = useState(null);

  /* =======================
     AUTH
  ======================= */
  useEffect(() => {
    if (sessionStorage.getItem("collaborateur_authenticated") !== "true") {
      navigate(createPageUrl("Collaborateur"));
    }
  }, [navigate]);

  /* =======================
     DATA
  ======================= */
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents-technique"],
    queryFn: () =>
      base44.entities.Incident.filter(
        { type: "technique" },
        "-date_saisie",
        200
      ),
    refetchInterval: 30000
  });

  /* =======================
     CLIENT EVENT (Timeline ClientSuiviDetail)
  ======================= */
  const pushClientEvent = async ({
    incident,
    type,
    message,
    attenteRaison = null,
    delaiEstime = null
  }) => {
    if (!incident?.intervention_id) return;

    await base44.entities.InterventionEvent.create({
      intervention_id: incident.intervention_id,
      fiche_arrivee_id: incident.fiche_arrivee_id,
      type, // "PRISE_EN_CHARGE" | "EN_COURS" | "EN_ATTENTE" | "TERMINEE"
      message_client: message,
      attente_raison: attenteRaison,
      delai_estime: delaiEstime,
      visible_client: true,
      at: new Date().toISOString()
    });
  };

  /* =======================
     MUTATION
  ======================= */
  const updateIncident = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents-technique"] });
    }
  });

  /**
   * Sync SuiviInventaire (statut_technique)
   * IMPORTANT :
   * - si ton Base44 n’a pas "updateByFicheArrivee", remplace par :
   *   - filter({ fiche_arrivee_id }) puis update(suivi.id, {...})
   */
  const updateSuiviTechnique = async (incident, statut) => {
    if (!incident?.fiche_arrivee_id) return;

    // Option A (si tu as une méthode custom)
    if (base44.entities.SuiviInventaire.updateByFicheArrivee) {
      await base44.entities.SuiviInventaire.updateByFicheArrivee({
        fiche_arrivee_id: incident.fiche_arrivee_id,
        statut_technique: statut
      });
      return;
    }

    // Option B (fallback standard)
    const suivis = await base44.entities.SuiviInventaire.filter(
      { fiche_arrivee_id: incident.fiche_arrivee_id },
      "-created_at",
      1
    );
    if (suivis?.[0]?.id) {
      await base44.entities.SuiviInventaire.update(suivis[0].id, {
        statut_technique: statut
      });
    }
  };

  /* ============================================================
     ACTIONS : PRISE EN CHARGE / PHOTOS / ATTENTE / TERMINE
  ============================================================ */

  const prendreEnChargeSansPhoto = async (incident) => {
    if (!collaborateurNom.trim()) {
      toast.error("Nom obligatoire");
      return;
    }

    const now = new Date();
    const delai = incident.date_saisie
      ? differenceInMinutes(now, new Date(incident.date_saisie))
      : 0;

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: "prise_en_charge",
      horodatage: now.toISOString(),
      utilisateur: collaborateurNom,
      commentaire: "Intervention prise en charge"
    });

    await updateIncident.mutateAsync({
      id: incident.id,
      data: {
        statut: "en_cours",
        pris_par: collaborateurNom,
        date_debut: now.toISOString(),
        temps_prise_en_charge: delai
      }
    });

    await pushClientEvent({
      incident,
      type: "EN_COURS",
      message: "L’équipe technique est en cours d’intervention."
    });

    await updateSuiviTechnique(incident, "en_cours");

    toast.success("Intervention prise en charge");
    setSelectedIncident(null);
  };

  const handlePhotoAvantUploaded = async (photoData) => {
    if (!incidentForPhoto) return;

    const now = new Date();
    const delai = incidentForPhoto.date_saisie
      ? differenceInMinutes(now, new Date(incidentForPhoto.date_saisie))
      : 0;

    await base44.entities.InterventionLog.create({
      incident_id: incidentForPhoto.id,
      action: "prise_en_charge",
      horodatage: now.toISOString(),
      utilisateur: collaborateurNom,
      commentaire: "Intervention prise en charge avec photo AVANT"
    });

    await updateIncident.mutateAsync({
      id: incidentForPhoto.id,
      data: {
        statut: "en_cours",
        pris_par: collaborateurNom,
        date_debut: now.toISOString(),
        temps_prise_en_charge: delai,
        photo_avant_url: photoData.url,
        photo_avant_timestamp: photoData.timestamp,
        photo_avant_hash: photoData.hash
      }
    });

    await pushClientEvent({
      incident: incidentForPhoto,
      type: "EN_COURS",
      message: "L’équipe technique est en cours d’intervention."
    });

    await updateSuiviTechnique(incidentForPhoto, "en_cours");

    toast.success("Intervention prise en charge (avec photo avant)");
    setIncidentForPhoto(null);
    setShowPhotoAvant(false);
    setSelectedIncident(null);
  };

  const terminerSansPhoto = async (incident) => {
    const now = new Date();
    const total = incident.date_saisie
      ? differenceInMinutes(now, new Date(incident.date_saisie))
      : 0;

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: "resolu",
      horodatage: now.toISOString(),
      utilisateur: incident.pris_par || collaborateurNom,
      commentaire: "Intervention résolue"
    });

    await updateIncident.mutateAsync({
      id: incident.id,
      data: {
        statut: "resolu",
        date_resolution: now.toISOString(),
        commentaire_interne: commentaire || incident.commentaire_interne,
        temps_total_intervention: total
      }
    });

    await pushClientEvent({
      incident,
      type: "TERMINEE",
      message: "L’intervention technique est terminée."
    });

    await updateSuiviTechnique(incident, "resolu");

    toast.success("Intervention terminée");
    setCommentaire("");
    setSelectedIncident(null);
  };

  const handlePhotoApresUploaded = async (photoData) => {
    if (!incidentForPhoto) return;

    const now = new Date();
    const total = incidentForPhoto.date_saisie
      ? differenceInMinutes(now, new Date(incidentForPhoto.date_saisie))
      : 0;

    await base44.entities.InterventionLog.create({
      incident_id: incidentForPhoto.id,
      action: "resolu",
      horodatage: now.toISOString(),
      utilisateur: incidentForPhoto.pris_par || collaborateurNom,
      commentaire: "Intervention résolue avec photo APRES"
    });

    await updateIncident.mutateAsync({
      id: incidentForPhoto.id,
      data: {
        statut: "resolu",
        date_resolution: now.toISOString(),
        commentaire_interne: commentaire || incidentForPhoto.commentaire_interne,
        temps_total_intervention: total,
        photo_apres_url: photoData.url,
        photo_apres_timestamp: photoData.timestamp,
        photo_apres_hash: photoData.hash
      }
    });

    await pushClientEvent({
      incident: incidentForPhoto,
      type: "TERMINEE",
      message: "L’intervention technique est terminée."
    });

    await updateSuiviTechnique(incidentForPhoto, "resolu");

    toast.success("Intervention terminée (avec photo après)");
    setIncidentForPhoto(null);
    setShowPhotoApres(false);
    setCommentaire("");
    setSelectedIncident(null);
  };

  const mettreEnAttente = async (data) => {
    if (!incidentToWait?.id) return;

    await updateIncident.mutateAsync({
      id: incidentToWait.id,
      data: {
        statut: "en_attente_materiel",
        attente_raison: data.raison,
        attente_delai: data.delai,
        motif_attente: data.motifAttente,
        attente_materiel: data.materiel,
        attente_materiel_detail: data.materielDetail,
        attente_commentaire: data.commentaire,
        attente_date: new Date().toISOString()
      }
    });

    await pushClientEvent({
      incident: incidentToWait,
      type: "EN_ATTENTE",
      message: "Intervention technique en attente.",
      attenteRaison: data.raison,
      delaiEstime: data.delai
    });

    await updateSuiviTechnique(incidentToWait, "en_attente");

    toast.success("Intervention mise en attente");
    setShowAttenteDialog(false);
    setIncidentToWait(null);
    setSelectedIncident(null);
  };

  const reprendre = async (incident) => {
    const now = new Date();

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: "reprise",
      horodatage: now.toISOString(),
      utilisateur: incident.pris_par || collaborateurNom,
      commentaire: "Intervention reprise"
    });

    await updateIncident.mutateAsync({
      id: incident.id,
      data: { statut: "en_cours" }
    });

    await pushClientEvent({
      incident,
      type: "EN_COURS",
      message: "L’équipe technique a repris l’intervention."
    });

    await updateSuiviTechnique(incident, "en_cours");

    toast.success("Intervention reprise");
    queryClient.invalidateQueries({ queryKey: ["incidents-technique"] });
  };

  /* =======================
     UI HELPERS
  ======================= */
  const statutLabel = (s) => {
    if (s === "en_attente") return "⏳ En attente";
    if (s === "en_cours") return "▶️ En cours";
    if (s === "en_attente_materiel") return "⏸ En attente";
    if (s === "resolu") return "✅ Terminé";
    return s || "—";
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineBanner />

      <header className="bg-[#00AEEF] text-white px-4 py-4 flex justify-between items-center">
        <Logo />
        <CollaborateurNotificationBell />
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
          </div>
        ) : incidents.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            Aucune intervention technique.
          </p>
        ) : (
          incidents.map((incident) => (
            <Card
              key={incident.id}
              className="mb-4 cursor-pointer border-2 border-[#00AEEF]/20 rounded-xl"
              onClick={() => setSelectedIncident(incident)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      Logement {incident.logement || incident.emplacement || "—"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {incident.client_prenom} {incident.client_nom}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {incident.date_saisie
                        ? format(new Date(incident.date_saisie), "dd/MM HH:mm", {
                            locale: fr
                          })
                        : ""}
                    </p>
                  </div>

                  <Badge>{statutLabel(incident.statut)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* =======================
          MODAL DETAIL
      ======================= */}
      <Dialog
        open={!!selectedIncident}
        onOpenChange={() => setSelectedIncident(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Intervention technique –{" "}
              {selectedIncident?.logement || selectedIncident?.emplacement || "—"}
            </DialogTitle>
          </DialogHeader>

          {!!selectedIncident && (
            <div className="space-y-4">
              <div className="bg-[#e6f7ff] rounded-xl p-4 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Client</span>
                  <span className="font-semibold">
                    {selectedIncident.client_prenom} {selectedIncident.client_nom}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Signalée</span>
                  <span>
                    {selectedIncident.date_saisie
                      ? format(new Date(selectedIncident.date_saisie), "dd/MM/yyyy HH:mm", { locale: fr })
                      : "—"}
                  </span>
                </div>
              </div>

              {selectedIncident.description && (
                <div>
                  <p className="font-semibold">Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                    {selectedIncident.description}
                  </p>
                </div>
              )}

              {selectedIncident.photo_avant_url && (
                <div>
                  <p className="font-semibold">📸 Photo AVANT</p>
                  <img
                    src={selectedIncident.photo_avant_url}
                    alt="Avant"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                </div>
              )}

              {selectedIncident.photo_apres_url && (
                <div>
                  <p className="font-semibold">📸 Photo APRÈS</p>
                  <img
                    src={selectedIncident.photo_apres_url}
                    alt="Après"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                </div>
              )}

              {/* =======================
                  ACTIONS PAR STATUT
              ======================= */}

              {selectedIncident.statut === "en_attente" && (
                <div className="space-y-3 pt-3 border-t">
                  <Input
                    placeholder="Votre nom"
                    value={collaborateurNom}
                    onChange={(e) => setCollaborateurNom(e.target.value)}
                  />

                  <Button
                    className="w-full bg-[#00AEEF] hover:bg-[#0077A8]"
                    onClick={() => prendreEnChargeSansPhoto(selectedIncident)}
                    disabled={!collaborateurNom.trim()}
                  >
                    <Play className="w-4 h-4 mr-2" /> Prendre en charge
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIncidentForPhoto(selectedIncident);
                      setShowPhotoAvant(true);
                    }}
                    disabled={!collaborateurNom.trim()}
                  >
                    Prendre en charge avec photo avant
                  </Button>
                </div>
              )}

              {selectedIncident.statut === "en_cours" && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#0077A8]">
                      Pris en charge par : <b>{selectedIncident.pris_par}</b>
                    </p>
                    {selectedIncident.date_debut && (
                      <InterventionTimer startTime={selectedIncident.date_debut} />
                    )}
                  </div>

                  <Textarea
                    placeholder="Commentaire interne (optionnel)"
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIncidentToWait(selectedIncident);
                        setShowAttenteDialog(true);
                      }}
                    >
                      <Pause className="w-4 h-4 mr-2" /> Attente
                    </Button>

                    <Button
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => terminerSansPhoto(selectedIncident)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Terminer
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIncidentForPhoto(selectedIncident);
                      setShowPhotoApres(true);
                    }}
                  >
                    Terminer avec photo après
                  </Button>
                </div>
              )}

              {selectedIncident.statut === "en_attente_materiel" && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-sm">
                    <p className="font-semibold">⏸ Intervention en attente</p>
                    {selectedIncident.motif_attente && (
                      <p className="mt-1">
                        <b>Motif :</b> {selectedIncident.motif_attente}
                      </p>
                    )}
                    {selectedIncident.attente_delai && (
                      <p className="mt-1">
                        <b>Délai :</b> {selectedIncident.attente_delai}
                      </p>
                    )}
                    {selectedIncident.attente_materiel_detail && (
                      <p className="mt-1">
                        <b>Matériel :</b> {selectedIncident.attente_materiel_detail}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="bg-[#00AEEF] hover:bg-[#0077A8]"
                      onClick={() => reprendre(selectedIncident)}
                    >
                      <Play className="w-4 h-4 mr-2" /> Reprendre
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setIncidentToWait(selectedIncident);
                        setShowAttenteDialog(true);
                      }}
                    >
                      Modifier motif
                    </Button>
                  </div>

                  <Button
                    className="w-full bg-green-500 hover:bg-green-600"
                    onClick={() => terminerSansPhoto(selectedIncident)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Passer terminé
                  </Button>
                </div>
              )}

              {selectedIncident.statut === "resolu" && (
                <div className="pt-3 border-t">
                  <p className="text-green-700 text-sm">
                    ✅ Intervention terminée{" "}
                    {selectedIncident.date_resolution
                      ? `le ${format(new Date(selectedIncident.date_resolution), "dd/MM/yyyy HH:mm", { locale: fr })}`
                      : ""}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =======================
          DIALOGS
      ======================= */}
      <MettreEnAttenteDialog
        open={showAttenteDialog}
        onOpenChange={setShowAttenteDialog}
        onConfirm={mettreEnAttente}
        isLoading={updateIncident.isPending}
      />

      <PhotoInterventionCapture
        open={showPhotoAvant}
        onOpenChange={(open) => {
          setShowPhotoAvant(open);
          if (!open) setIncidentForPhoto(null);
        }}
        type="avant"
        interventionId={incidentForPhoto?.id || ""}
        collaborateurNom={collaborateurNom}
        onPhotoUploaded={handlePhotoAvantUploaded}
      />

      <PhotoInterventionCapture
        open={showPhotoApres}
        onOpenChange={(open) => {
          setShowPhotoApres(open);
          if (!open) setIncidentForPhoto(null);
        }}
        type="apres"
        interventionId={incidentForPhoto?.id || ""}
        collaborateurNom={incidentForPhoto?.pris_par || collaborateurNom}
        onPhotoUploaded={handlePhotoApresUploaded}
      />
    </div>
  );
}