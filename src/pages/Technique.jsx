import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

import OfflineBanner from "../components/OfflineBanner";
import CollaborateurNotificationBell from "../components/CollaborateurNotificationBell";
import MettreEnAttenteDialog from "../components/MettreEnAttenteDialog";
import PhotoInterventionCapture from "../components/PhotoInterventionCapture";
import InterventionHistorique from "../components/interventions/InterventionHistorique";
import InterventionDocuments from "../components/interventions/InterventionDocuments";
import InterventionTimer from "../components/InterventionTimer";
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
  Clock,
  User,
  CheckCircle,
  Play,
  Pause,
  Loader2,
  Camera,
  Home,
  Wrench,
} from "lucide-react";

import { format, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

/* ============================================================
   TECHNIQUE – PAGE COLLABORATEUR
============================================================ */

export default function Technique() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  /* ======================= STATES ======================= */
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [collaborateurNom, setCollaborateurNom] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [filter, setFilter] = useState("en_attente");

  const [incidentForPhoto, setIncidentForPhoto] = useState(null);
  const [showPhotoAvant, setShowPhotoAvant] = useState(false);
  const [showPhotoApres, setShowPhotoApres] = useState(false);

  const [showAttenteDialog, setShowAttenteDialog] = useState(false);
  const [incidentToWait, setIncidentToWait] = useState(null);

  /* ======================= AUTH ======================= */
  useEffect(() => {
    const auth = sessionStorage.getItem("collaborateur_authenticated");
    if (auth !== "true") {
      navigate(createPageUrl("Collaborateur"));
    }
  }, [navigate]);

  /* ======================= DATA ======================= */
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
    enabled: !!selectedIncident,
    queryFn: () =>
      base44.entities.InterventionLog.filter(
        { incident_id: selectedIncident.id },
        "-horodatage",
        50
      ),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["documents-tech", selectedIncident?.id],
    enabled: !!selectedIncident,
    queryFn: () =>
      base44.entities.InterventionDocument.filter(
        { incident_id: selectedIncident.id },
        "-created_date",
        50
      ),
  });

  /* ======================= MUTATIONS ======================= */
  const updateIncident = useMutation({
    mutationFn: ({ id, data }) =>
      base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["incidents-technique"],
      });
      toast.success("Intervention mise à jour");
      setSelectedIncident(null);
    },
  });

  /* ======================= ACTIONS ======================= */

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
      utilisateur: collaborateurNom,
      horodatage: now.toISOString(),
      commentaire: "Intervention prise en charge",
    });

    updateIncident.mutate({
      id: incident.id,
      data: {
        pris_par: collaborateurNom,
        statut: "en_cours",
        date_debut: now.toISOString(),
        temps_prise_en_charge: delai,
      },
    });
  };

  const terminerIntervention = async (incident) => {
    const now = new Date();
    const total = incident.date_saisie
      ? differenceInMinutes(now, new Date(incident.date_saisie))
      : 0;

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: "resolu",
      utilisateur: incident.pris_par || collaborateurNom,
      horodatage: now.toISOString(),
      commentaire: "Intervention résolue",
    });

    updateIncident.mutate({
      id: incident.id,
      data: {
        statut: "resolu",
        date_resolution: now.toISOString(),
        commentaire_interne: commentaire,
        temps_total_intervention: total,
      },
    });

    setCommentaire("");
  };

  const confirmerAttente = (formData) => {
    updateIncident.mutate({
      id: incidentToWait.id,
      data: {
        statut: "en_attente_materiel",
        motif_attente: formData.motifAttente,
        attente_materiel_detail: formData.materielDetail,
        attente_delai: formData.delai,
        attente_commentaire: formData.commentaire,
        attente_date: new Date().toISOString(),
      },
    });
    setShowAttenteDialog(false);
    setIncidentToWait(null);
  };

  /* ======================= HELPERS ======================= */

  const badgeStatut = (statut) => {
    switch (statut) {
      case "en_attente":
        return <Badge className="bg-orange-500 text-white">En attente</Badge>;
      case "en_cours":
        return <Badge className="bg-blue-500 text-white">En cours</Badge>;
      case "en_attente_materiel":
        return <Badge className="bg-gray-500 text-white">En attente</Badge>;
      case "resolu":
        return <Badge className="bg-green-500 text-white">Résolu</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const filtered = incidents.filter((i) =>
    filter === "tous" ? true : i.statut === filter
  );

  /* ======================= RENDER ======================= */

  return (
    <div className="min-h-screen pb-8">
      <OfflineBanner />

      {/* HEADER */}
      <div className="bg-[#0077A8] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wrench />
            <h1 className="text-xl font-bold">Technique</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(createPageUrl("MenuCollaborateur"))}
            >
              <Home />
            </button>
            <CollaborateurNotificationBell />
          </div>
        </div>
      </div>

      {/* LISTE */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          filtered.map((incident) => (
            <Card
              key={incident.id}
              className="border-2 cursor-pointer"
              onClick={() => setSelectedIncident(incident)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="font-semibold">
                    {incident.logement || incident.emplacement}
                  </div>
                  {badgeStatut(incident.statut)}
                </div>

                <p className="text-sm text-gray-700">
                  {incident.description}
                </p>

                <div className="text-xs text-gray-500 flex justify-between">
                  <span>
                    <User className="inline w-3 h-3 mr-1" />
                    {incident.client_prenom} {incident.client_nom}
                  </span>
                  <span>
                    <Clock className="inline w-3 h-3 mr-1" />
                    {incident.date_saisie &&
                      format(
                        new Date(incident.date_saisie),
                        "dd/MM HH:mm",
                        { locale: fr }
                      )}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* DIALOG DETAIL */}
      <Dialog
        open={!!selectedIncident}
        onOpenChange={() => setSelectedIncident(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Intervention technique</DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <p>{selectedIncident.description}</p>

              <InterventionDocuments
                incidentId={selectedIncident.id}
                documents={documents}
                canAdd
              />

              <InterventionHistorique logs={logs} />

              {selectedIncident.statut === "en_attente" && (
                <>
                  <Input
                    placeholder="Votre nom"
                    value={collaborateurNom}
                    onChange={(e) => setCollaborateurNom(e.target.value)}
                  />
                  <Button
                    onClick={() => prendreEnCharge(selectedIncident)}
                  >
                    <Play className="mr-2" />
                    Prendre en charge
                  </Button>
                </>
              )}

              {selectedIncident.statut === "en_cours" && (
                <>
                  <InterventionTimer
                    startTime={selectedIncident.date_debut}
                    isActive
                  />
                  <Textarea
                    placeholder="Commentaire"
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
                      <Pause className="mr-2" />
                      Mettre en attente
                    </Button>
                    <Button
                      className="bg-green-600"
                      onClick={() => terminerIntervention(selectedIncident)}
                    >
                      <CheckCircle className="mr-2" />
                      Terminer
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MettreEnAttenteDialog
        open={showAttenteDialog}
        onOpenChange={setShowAttenteDialog}
        onConfirm={confirmerAttente}
        isLoading={updateIncident.isPending}
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