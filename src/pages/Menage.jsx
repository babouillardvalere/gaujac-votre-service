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

import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  Loader2,
  Camera
} from "lucide-react";

/* ============================================================
   MENAGE – INTERVENTIONS
============================================================ */

export default function Menage() {
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
    queryKey: ["incidents-menage"],
    queryFn: () =>
      base44.entities.Incident.filter(
        { type: "menage" },
        "-date_saisie",
        200
      ),
    refetchInterval: 30000
  });

  /* =======================
     CLIENT EVENT
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
      type,
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
      queryClient.invalidateQueries({ queryKey: ["incidents-menage"] });
    }
  });

  const updateSuiviMenage = async (incident, statut) => {
    if (!incident.fiche_arrivee_id) return;
    await base44.entities.SuiviInventaire.updateByFicheArrivee({
      fiche_arrivee_id: incident.fiche_arrivee_id,
      statut_menage: statut
    });
  };

  /* =======================
     ACTIONS
  ======================= */

  const prendreEnCharge = async (incident) => {
    if (!collaborateurNom.trim()) {
      toast.error("Nom obligatoire");
      return;
    }

    const now = new Date();
    const delai = differenceInMinutes(now, new Date(incident.date_saisie));

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: "prise_en_charge",
      horodatage: now.toISOString(),
      utilisateur: collaborateurNom
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
      message: "L’équipe ménage est en cours d’intervention."
    });

    await updateSuiviMenage(incident, "en_cours");

    toast.success("Intervention prise en charge");
    setSelectedIncident(null);
  };

  const terminer = async (incident) => {
    const now = new Date();
    const total = differenceInMinutes(now, new Date(incident.date_saisie));

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: "resolu",
      horodatage: now.toISOString(),
      utilisateur: incident.pris_par
    });

    await updateIncident.mutateAsync({
      id: incident.id,
      data: {
        statut: "resolu",
        date_resolution: now.toISOString(),
        commentaire_interne: commentaire,
        temps_total_intervention: total
      }
    });

    await pushClientEvent({
      incident,
      type: "TERMINEE",
      message: "L’intervention ménage est terminée."
    });

    await updateSuiviMenage(incident, "resolu");

    toast.success("Intervention terminée");
    setCommentaire("");
    setSelectedIncident(null);
  };

  const mettreEnAttente = async (data) => {
    await updateIncident.mutateAsync({
      id: incidentToWait.id,
      data: {
        statut: "en_attente_materiel",
        attente_raison: data.raison,
        attente_delai: data.delai
      }
    });

    await pushClientEvent({
      incident: incidentToWait,
      type: "EN_ATTENTE",
      message: "Intervention ménage en attente.",
      attenteRaison: data.raison,
      delaiEstime: data.delai
    });

    await updateSuiviMenage(incidentToWait, "en_attente");

    toast.success("Intervention mise en attente");
    setShowAttenteDialog(false);
    setIncidentToWait(null);
  };

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineBanner />

      <header className="bg-yellow-400 px-4 py-4 flex justify-between items-center">
        <Logo />
        <CollaborateurNotificationBell />
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {isLoading ? (
          <Loader2 className="animate-spin mx-auto" />
        ) : (
          incidents.map((incident) => (
            <Card
              key={incident.id}
              className="mb-4 cursor-pointer"
              onClick={() => setSelectedIncident(incident)}
            >
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold">Logement {incident.logement}</p>
                    <p className="text-sm text-gray-600">
                      {incident.client_prenom} {incident.client_nom}
                    </p>
                  </div>
                  <Badge>
                    {incident.statut === "en_attente"
                      ? "⏳ En attente"
                      : incident.statut === "en_cours"
                      ? "▶️ En cours"
                      : "✅ Terminé"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* MODAL DETAIL */}
      <Dialog
        open={!!selectedIncident}
        onOpenChange={() => setSelectedIncident(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Intervention ménage – {selectedIncident?.logement}
            </DialogTitle>
          </DialogHeader>

          {selectedIncident?.statut === "en_attente" && (
            <>
              <Input
                placeholder="Votre nom"
                value={collaborateurNom}
                onChange={(e) => setCollaborateurNom(e.target.value)}
              />
              <Button onClick={() => prendreEnCharge(selectedIncident)}>
                <Play className="mr-2" /> Prendre en charge
              </Button>
            </>
          )}

          {selectedIncident?.statut === "en_cours" && (
            <>
              <InterventionTimer startTime={selectedIncident.date_debut} />
              <Textarea
                placeholder="Commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIncidentToWait(selectedIncident);
                    setShowAttenteDialog(true);
                  }}
                >
                  <Pause className="mr-2" /> Attente
                </Button>
                <Button onClick={() => terminer(selectedIncident)}>
                  <CheckCircle className="mr-2" /> Terminer
                </Button>
              </div>
            </>
          )}

          {selectedIncident?.statut === "resolu" && (
            <p className="text-green-600">
              Intervention terminée le{" "}
              {format(
                new Date(selectedIncident.date_resolution),
                "dd/MM/yyyy HH:mm",
                { locale: fr }
              )}
            </p>
          )}
        </DialogContent>
      </Dialog>

      <MettreEnAttenteDialog
        open={showAttenteDialog}
        onOpenChange={setShowAttenteDialog}
        onConfirm={mettreEnAttente}
      />
    </div>
  );
}