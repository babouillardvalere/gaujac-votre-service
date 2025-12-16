import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench,
  Broom
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "../utils";
import Logo from "../components/Logo";
import { useTranslation } from "../components/translations";

export default function ClientSuiviDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const interventionId = searchParams.get("id");
  const { t, lang } = useTranslation();

  /* =========================
     INTERVENTION
  ========================= */
  const { data: intervention, isLoading } = useQuery({
    queryKey: ["client-intervention", interventionId],
    enabled: !!interventionId,
    queryFn: async () => {
      return await base44.entities.Intervention.get(interventionId);
    }
  });

  /* =========================
     EVENTS (CLIENT SAFE)
  ========================= */
  const { data: events = [] } = useQuery({
    queryKey: ["client-intervention-events", interventionId],
    enabled: !!interventionId,
    queryFn: async () => {
      return await base44.entities.InterventionEvent.filter(
        {
          intervention_id: interventionId,
          visible_client: true
        },
        "at",
        100
      );
    }
  });

  /* =========================
     STATUS CONFIG
  ========================= */
  const statusConfig = {
    OUVERTE: {
      icon: Clock,
      color: "bg-orange-100 text-orange-700",
      label: lang === "fr" ? "Demande envoyée" : "Request sent"
    },
    EN_COURS: {
      icon: Loader2,
      color: "bg-blue-100 text-blue-700",
      label: lang === "fr" ? "En cours" : "In progress"
    },
    EN_ATTENTE: {
      icon: AlertCircle,
      color: "bg-yellow-100 text-yellow-700",
      label: lang === "fr" ? "En attente" : "On hold"
    },
    TERMINEE: {
      icon: CheckCircle,
      color: "bg-green-100 text-green-700",
      label: lang === "fr" ? "Terminée" : "Completed"
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="min-h-screen px-4 py-6 text-center">
        <p className="text-gray-500">
          {lang === "fr"
            ? "Intervention introuvable"
            : "Intervention not found"}
        </p>
        <Button
          className="mt-4 bg-[#00AEEF]"
          onClick={() => navigate(createPageUrl("ClientSuiviSearch"))}
        >
          {t("retour")}
        </Button>
      </div>
    );
  }

  const menage = statusConfig[intervention.menage_statut] || statusConfig.OUVERTE;
  const technique =
    statusConfig[intervention.technique_statut] ||
    statusConfig.OUVERTE;

  const MenageIcon = menage.icon;
  const TechniqueIcon = technique.icon;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Retour */}
        <button
          onClick={() => navigate(createPageUrl("ClientSuiviSearch"))}
          className="flex items-center gap-2 text-[#0077A8]"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("retour")}
        </button>

        <Logo className="h-16" />

        <h1 className="text-2xl font-bold text-[#0077A8] font-handwritten">
          📋 {lang === "fr" ? "Suivi de votre intervention" : "Intervention tracking"}
        </h1>

        {/* INFO CLIENT */}
        <Card>
          <CardContent className="p-6 space-y-2">
            <p className="font-semibold">
              {intervention.client_prenom} {intervention.client_nom}
            </p>
            <p className="text-sm text-gray-600">
              {intervention.logement_numero} — {intervention.categorie_logement}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(intervention.date_arrivee), "dd MMMM yyyy", { locale: fr })}
              {" → "}
              {format(new Date(intervention.date_depart), "dd MMMM yyyy", { locale: fr })}
            </p>
          </CardContent>
        </Card>

        {/* STATUTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Broom className="w-5 h-5" />
                🧹 {lang === "fr" ? "Ménage" : "Housekeeping"}
              </div>
              <Badge className={menage.color}>{menage.label}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-5 h-5" />
                🔧 {lang === "fr" ? "Technique" : "Technical"}
              </div>
              <Badge className={technique.color}>{technique.label}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* TIMELINE */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">
              📅 {lang === "fr" ? "Historique" : "Timeline"}
            </h3>

            {events.length === 0 ? (
              <p className="text-sm text-gray-500">
                {lang === "fr"
                  ? "Aucune mise à jour pour le moment"
                  : "No updates yet"}
              </p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="w-3 h-3 mt-2 bg-[#00AEEF] rounded-full" />
                    <div>
                      <p className="font-semibold">{event.titre_client}</p>
                      <p className="text-sm text-gray-600">{event.message_client}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(event.at), "dd/MM/yyyy à HH:mm", {
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full border-[#00AEEF] text-[#00AEEF]"
          onClick={() => navigate(createPageUrl("ClientSuiviSearch"))}
        >
          {t("retour")}
        </Button>

      </div>
    </div>
  );
}