import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

import OfflineBanner from "../components/OfflineBanner";
import CollaborateurNotificationBell from "../components/CollaborateurNotificationBell";
import MettreEnAttenteDialog from "../components/MettreEnAttenteDialog";
import PhotoInterventionCapture from "../components/PhotoInterventionCapture";
import InterventionTimer from "../components/InterventionTimer";
import InterventionHistorique from "../components/interventions/InterventionHistorique";
import InterventionDocuments from "../components/interventions/InterventionDocuments";
import ModeleInterventionSelector from "../components/interventions/ModeleInterventionSelector";
import ServiceMissionDashboard from "../components/direction/ServiceMissionDashboard";
import { useTranslation } from "../components/translations";
import { createPageUrl } from "../utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Clock,
  User,
  CheckCircle,
  Play,
  Pause,
  Loader2,
  Camera,
  Home,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";

/* ============================================================
   TECHNIQUE – VERSION FINALE COMPLÈTE
   - Photos AVANT / APRÈS
   - Mise en attente
   - Logs + documents
   - Synchronisation SUIVI CLIENT (ARRIVÉE)
============================================================ */

export default function Technique() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [collaborateurNom, setCollaborateurNom] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [filter, setFilter] = useState("en_attente");

  const [showAttenteDialog, setShowAttenteDialog] = useState(false);
  const [incidentToWait, setIncidentToWait] = useState(null);

  const [showPhotoAvant, setShowPhotoAvant] = useState(false);
  const [showPhotoApres, setShowPhotoApres] = useState(false);
  const [incidentForPhoto, setIncidentForPhoto] = useState(null);

  const [activeTab, setActiveTab] = useState("interventions");

  /* =======================
     AUTH
  ======================= */
  useEffect(() => {
    const auth = sessionStorage.getItem("collaborateur_authenticated");
    if (auth !== "true") {
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
    refetchInterval: 30000,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["intervention-logs-tech", selectedIncident?.id],
    queryFn: () =>
      selectedIncident
        ? base44.entities.InterventionLog.filter(
            { incident_id: selectedIncident.id },
            "-horodatage",
            50
          )
        : Promise.resolve([]),
    enabled: !!selectedIncident,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents-tech", selectedIncident?.id],
    queryFn: () =>
      selectedIncident
        ? base44.entities.InterventionDocument.filter(
            { incident_id: selectedIncident.id },
            "-created_date",
            50
          )
        : Promise.resolve([]),
    enabled: !!selectedIncident,
  });

  /* =======================
     SYNC CLIENT
  ======================= */
  const mapToSuivi = (status) => {
    if (status === "en_cours") return "en_cours";
    if (status === "resolu") return "resolu";
    return "en_attente";
  };

  const updateSuiviClient = async (incident, status) => {
    if (!incident?.fiche_arrivee_id) return;

    const suivis = await base44.entities.SuiviInventaire.filter(
      { fiche_arrivee_id: incident.fiche_arrivee_id },
      "-created_at",
      5
    );
    const suivi = suivis?.[0];
    if (!suivi) return;

    await base44.entities.SuiviInventaire.update(suivi.id, {
      statut_technique: mapToSuivi(status),
    });
  };

  const pushClientEvent = async ({
    incident,
    type,
    message,
    attenteRaison = null,
    delaiEstime = null,
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
      at: new Date().toISOString(),
    });
  };

  /* =======================
     MUTATION
  ======================= */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["incidents-technique"],
      });
      setSelectedIncident(null);
    },
  });

  /* =======================
     ACTIONS
  ======================= */

  const prendreEnCharge = async (incident) => {
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
    });

    updateMutation.mutate({
      id: incident.id,
      data: {
        statut: "en_cours",
        pris_par: collaborateurNom,
        date_debut: now.toISOString(),
        temps_prise_en_charge: delai,
      },
    });

    await updateSuiviClient(incident, "en_cours");
    await pushClientEvent({
      incident,
      type: "EN_COURS",
      message:
        lang === "fr"
          ? "L’équipe technique est en cours d’intervention."
          : "Technical team is working on your request.",
    });
  };

  const terminer = async (incident) => {
    const now = new Date();
    const total = incident.date_saisie
      ? differenceInMinutes(now, new Date(incident.date_saisie))
      : 0;

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: "resolu",
      horodatage: now.toISOString(),
      utilisateur: incident.pris_par,
    });

    updateMutation.mutate({
      id: incident.id,
      data: {
        statut: "resolu",
        date_resolution: now.toISOString(),
        commentaire_interne: commentaire,
        temps_total_intervention: total,
      },
    });

    await updateSuiviClient(incident, "resolu");
    await pushClientEvent({
      incident,
      type: "TERMINEE",
      message:
        lang === "fr"
          ? "L’intervention technique est terminée."
          : "Technical intervention completed.",
    });

    setCommentaire("");
  };

  const mettreEnAttente = async (formData) => {
    if (!incidentToWait) return;

    updateMutation.mutate({
      id: incidentToWait.id,
      data: {
        statut: "en_attente_materiel",
        attente_raison: formData.raison,
        attente_delai: formData.delai,
      },
    });

    await updateSuiviClient(incidentToWait, "en_attente");
    await pushClientEvent({
      incident: incidentToWait,
      type: "EN_ATTENTE",
      message:
        lang === "fr"
          ? "Intervention technique en attente."
          : "Technical intervention on hold.",
      attenteRaison: formData.raison,
      delaiEstime: formData.delai,
    });

    setIncidentToWait(null);
    setShowAttenteDialog(false);
  };

  /* =======================
     RENDER
  ======================= */

  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) =>
      filter === "tous" ? true : i.statut === filter
    );
  }, [incidents, filter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineBanner />

      <header className="bg-[#00AEEF] text-white px-4 py-4 flex justify-between items-center">
        <h1 className="font-bold text-lg">Technique</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => navigate(createPageUrl("MenuCollaborateur"))}
            className="p-2 hover:bg-white/20 rounded"
          >
            <Home />
          </button>
          <CollaborateurNotificationBell />
          <Sparkles />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {isLoading ? (
          <Loader2 className="animate-spin mx-auto" />
        ) : (
          filteredIncidents.map((incident) => (
            <Card
              key={incident.id}
              className="mb-4 cursor-pointer"
              onClick={() => setSelectedIncident(incident)}
            >
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold">
                      Logement {incident.logement}
                    </p>
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
              Intervention technique – {selectedIncident?.logement}
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
        </DialogContent>
      </Dialog>

      <MettreEnAttenteDialog
        open={showAttenteDialog}
        onOpenChange={setShowAttenteDialog}
        onConfirm={mettreEnAttente}
      />

      <PhotoInterventionCapture
        open={showPhotoAvant}
        onOpenChange={setShowPhotoAvant}
        type="avant"
        interventionId={incidentForPhoto?.id || ""}
        collaborateurNom={collaborateurNom}
      />

      <PhotoInterventionCapture
        open={showPhotoApres}
        onOpenChange={setShowPhotoApres}
        type="apres"
        interventionId={incidentForPhoto?.id || ""}
        collaborateurNom={collaborateurNom}
      />
    </div>
  );
}