import React, { useMemo, useRef } from "react";
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
  Sparkles,
  Wrench,
  FileDown
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
  const pageRef = useRef(null);

  /* =========================
     CHARGEMENT INTERVENTION
  ========================= */
  const { data: intervention, isLoading } = useQuery({
    queryKey: ["client-intervention", interventionId],
    enabled: !!interventionId,
    queryFn: () => base44.entities.Intervention.get(interventionId)
  });

  /* =========================
     EVENTS CLIENT-SAFE
  ========================= */
  const { data: events = [] } = useQuery({
    queryKey: ["client-intervention-events", interventionId],
    enabled: !!interventionId,
    queryFn: () =>
      base44.entities.InterventionEvent.filter(
        { intervention_id: interventionId, visible_client: true },
        "at",
        100
      )
  });

  /* =========================
     STATUTS CLIENT
  ========================= */
  const statusMap = useMemo(
    () => ({
      OUVERTE: {
        icon: Clock,
        label: lang === "fr" ? "Demande envoyée" : "Request sent",
        color: "bg-orange-100 text-orange-700"
      },
      EN_COURS: {
        icon: Loader2,
        label: lang === "fr" ? "En cours" : "In progress",
        color: "bg-blue-100 text-blue-700"
      },
      EN_ATTENTE: {
        icon: AlertCircle,
        label: lang === "fr" ? "En attente" : "On hold",
        color: "bg-yellow-100 text-yellow-700"
      },
      TERMINEE: {
        icon: CheckCircle,
        label: lang === "fr" ? "Terminée" : "Completed",
        color: "bg-green-100 text-green-700"
      }
    }),
    [lang]
  );

  /* =========================
     EXPORT PDF AVEC LOGO
  ========================= */
  const exportPdf = () => {
    const content = pageRef.current?.innerHTML || "";
    const original = document.body.innerHTML;

    document.body.innerHTML = `
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Suivi intervention</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            .pdf-header {
              display: flex;
              align-items: center;
              gap: 16px;
              border-bottom: 2px solid #00AEEF;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            .pdf-logo { height: 60px; }
            .card {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 16px;
            }
            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 999px;
              font-size: 12px;
              border: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="pdf-header">
            <img src="/logo-camping.png" class="pdf-logo" />
            <h2>${lang === "fr" ? "Suivi de votre intervention" : "Intervention tracking"}</h2>
          </div>
          ${content}
        </body>
      </html>
    `;

    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  /* =========================
     ÉTATS
  ========================= */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">
          {lang === "fr" ? "Intervention introuvable" : "Intervention not found"}
        </p>
        <Button onClick={() => navigate(createPageUrl("ClientSuiviSearch"))}>
          {t("retour")}
        </Button>
      </div>
    );
  }

  const menage = statusMap[intervention.menage_statut] || statusMap.OUVERTE;
  const technique = statusMap[intervention.technique_statut] || statusMap.OUVERTE;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* RETOUR */}
        <button
          onClick={() => navigate(createPageUrl("ClientSuiviSearch"))}
          className="flex items-center gap-2 text-[#0077A8]"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("retour")}
        </button>

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <Logo className="h-14" />
          <Button variant="outline" onClick={exportPdf}>
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>

        <div ref={pageRef}>

          {/* INFO CLIENT */}
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="font-semibold text-lg">
                {intervention.client_prenom} {intervention.client_nom}
              </p>
              <p className="text-gray-600">
                {intervention.logement_numero} — {intervention.categorie_logement}
              </p>
              <p className="text-gray-500">
                {format(new Date(intervention.date_arrivee), "dd/MM/yyyy", { locale: fr })}
                {" → "}
                {format(new Date(intervention.date_depart), "dd/MM/yyyy", { locale: fr })}
              </p>
            </CardContent>
          </Card>

          {/* STATUTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span>🧹 {lang === "fr" ? "Ménage" : "Housekeeping"}</span>
                </div>
                <Badge className={menage.color}>{menage.label}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-5 h-5" />
                  <span>🔧 {lang === "fr" ? "Technique" : "Technical"}</span>
                </div>
                <Badge className={technique.color}>{technique.label}</Badge>
              </CardContent>
            </Card>
          </div>

          {/* TIMELINE */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-[#0077A8]">
                📅 {lang === "fr" ? "Historique" : "Timeline"}
              </h3>

              {events.length === 0 && (
                <p className="text-sm text-gray-500">
                  {lang === "fr"
                    ? "Aucune mise à jour pour le moment."
                    : "No updates yet."}
                </p>
              )}

              {events.map((e) => (
                <div key={e.id} className="border-l-2 pl-3 border-[#00AEEF]">
                  <p className="font-semibold">{e.titre_client}</p>
                  <p className="text-sm text-gray-700">{e.message_client}</p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(e.at), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}