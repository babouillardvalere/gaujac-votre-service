import React, { useMemo, useRef, useState } from "react";
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
  Broom,
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

  const { data: intervention, isLoading } = useQuery({
    queryKey: ["client-intervention", interventionId],
    enabled: !!interventionId,
    queryFn: () => base44.entities.Intervention.get(interventionId)
  });

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

  const statusMap = useMemo(() => ({
    OUVERTE: { icon: Clock, label: "Demande envoyée", color: "bg-orange-100 text-orange-700" },
    EN_COURS: { icon: Loader2, label: "En cours", color: "bg-blue-100 text-blue-700" },
    EN_ATTENTE: { icon: AlertCircle, label: "En attente", color: "bg-yellow-100 text-yellow-700" },
    TERMINEE: { icon: CheckCircle, label: "Terminée", color: "bg-green-100 text-green-700" }
  }), []);

  const exportPdf = () => {
    const content = pageRef.current.innerHTML;
    const original = document.body.innerHTML;

    document.body.innerHTML = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 24px; }
            .pdf-header { display:flex; gap:16px; align-items:center; border-bottom:2px solid #00AEEF; padding-bottom:12px; }
            .pdf-logo { height:60px; }
          </style>
        </head>
        <body>
          <div class="pdf-header">
            <img src="/logo-camping.png" class="pdf-logo"/>
            <h2>Suivi de votre intervention</h2>
          </div>
          ${content}
        </body>
      </html>
    `;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  if (isLoading || !intervention) {
    return <Loader2 className="animate-spin mx-auto mt-20" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">

        <button
          onClick={() => navigate(createPageUrl("ClientSuiviSearch"))}
          className="flex items-center gap-2 text-[#0077A8]"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("retour")}
        </button>

        <div className="flex justify-between items-center">
          <Logo className="h-14" />
          <Button variant="outline" onClick={exportPdf}>
            <FileDown className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>

        <div ref={pageRef}>
          <Card>
            <CardContent className="p-4">
              <p className="font-bold">{intervention.client_prenom} {intervention.client_nom}</p>
              <p>{intervention.logement_numero} — {intervention.categorie_logement}</p>
              <p>
                {format(new Date(intervention.date_arrivee), "dd/MM/yyyy")} →{" "}
                {format(new Date(intervention.date_depart), "dd/MM/yyyy")}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card><CardContent>
              <Broom /> <Badge className={statusMap[intervention.menage_statut]?.color}>
                {statusMap[intervention.menage_statut]?.label}
              </Badge>
            </CardContent></Card>

            <Card><CardContent>
              <Wrench /> <Badge className={statusMap[intervention.technique_statut]?.color}>
                {statusMap[intervention.technique_statut]?.label}
              </Badge>
            </CardContent></Card>
          </div>

          <Card>
            <CardContent>
              <h3>Historique</h3>
              {events.map(e => (
                <div key={e.id}>
                  <p className="font-semibold">{e.titre_client}</p>
                  <p>{e.message_client}</p>
                  <p className="text-xs">
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