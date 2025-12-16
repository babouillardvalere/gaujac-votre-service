import React, { useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Wrench,
  Sparkles,
  FileDown,
  Camera
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "../utils";
import Logo from "../components/Logo";
import { useTranslation } from "../components/translations";

/* ======================================================
   MAPPING STATUTS → CLIENT
====================================================== */
const STATUS_LABELS = {
  PRISE_EN_CHARGE: {
    icon: Clock,
    label: "Demande enregistrée",
    color: "bg-orange-100 text-orange-700"
  },
  EN_COURS: {
    icon: PlayCircle,
    label: "Intervention en cours",
    color: "bg-blue-100 text-blue-700"
  },
  EN_ATTENTE: {
    icon: PauseCircle,
    label: "En attente",
    color: "bg-yellow-100 text-yellow-700"
  },
  TERMINEE: {
    icon: CheckCircle,
    label: "Intervention terminée",
    color: "bg-green-100 text-green-700"
  }
};

/* ======================================================
   MOTIFS D’ATTENTE (CLIENT-FRIENDLY)
====================================================== */
const WAITING_REASONS = {
  MATERIEL: "Attente de matériel",
  FOURNISSEUR: "Attente du fournisseur",
  CLIENT_ABSENT: "Client absent",
  PIECE_SPECIFIQUE: "Besoin d’une pièce spécifique",
  SECOND_TECHNICIEN: "Besoin d’un second technicien"
};

export default function ClientSuiviDetail() {
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const pageRef = useRef(null);
  const [params] = useSearchParams();

  const stayId = params.get("stay_id");
  const type = params.get("type"); // ARRIVEE | SEJOUR
  const date = params.get("date"); // optionnel pour séjour

  /* ======================================================
     CHARGEMENT DES DONNÉES
  ====================================================== */
  const { data, isLoading } = useQuery({
    queryKey: ["client-suivi-detail", stayId, type, date],
    enabled: !!stayId,
    queryFn: async () => {
      const interventions = await base44.entities.Intervention.filter({
        stay_id: stayId,
        origine: type,
        ...(date ? { date_signalement: date } : {})
      });

      const timeline = await base44.entities.InterventionEvent.filter(
        {
          stay_id: stayId,
          origine: type,
          visible_client: true
        },
        "at",
        100
      );

      return { interventions, timeline };
    }
  });

  /* ======================================================
     EXPORT PDF
  ====================================================== */
  const exportPdf = () => {
    const content = pageRef.current.innerHTML;
    const original = document.body.innerHTML;

    document.body.innerHTML = `
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Suivi client</title>
          <style>
            body { font-family: Arial; padding: 24px; }
            .header {
              display: flex;
              align-items: center;
              gap: 16px;
              border-bottom: 2px solid #00AEEF;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            img { height: 60px; }
            .card { border: 1px solid #ddd; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo-camping.png" />
            <h2>Suivi de votre ${type === "ARRIVEE" ? "arrivée" : "séjour"}</h2>
          </div>
          ${content}
        </body>
      </html>
    `;

    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  /* ======================================================
     ÉTATS
  ====================================================== */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  if (!data || data.interventions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">
          Aucune intervention trouvée pour ce séjour.
        </p>
        <Button onClick={() => navigate(createPageUrl("ClientSuiviSearch"))}>
          Retour
        </Button>
      </div>
    );
  }

  const intervention = data.interventions[0];

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* RETOUR */}
        <button
          onClick={() => navigate(createPageUrl("ClientSuiviSearch"))}
          className="flex items-center gap-2 text-[#0077A8]"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <Logo className="h-14" />
          <Button variant="outline" onClick={exportPdf}>
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>

        <div ref={pageRef} className="space-y-6">

          {/* INFOS CLIENT */}
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="font-semibold text-lg">
                {intervention.client_prenom} {intervention.client_nom}
              </p>
              <p className="text-gray-600">
                Logement {intervention.logement}
              </p>
              <p className="text-gray-500">
                {type === "ARRIVEE"
                  ? "Suivi du contrôle inventaire"
                  : "Suivi pendant votre séjour"}
              </p>
            </CardContent>
          </Card>

          {/* STATUT GLOBAL */}
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              {intervention.type === "menage" ? (
                <Sparkles className="w-6 h-6" />
              ) : (
                <Wrench className="w-6 h-6" />
              )}
              <Badge className={STATUS_LABELS[intervention.statut].color}>
                {STATUS_LABELS[intervention.statut].label}
              </Badge>
            </CardContent>
          </Card>

          {/* TIMELINE */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-[#0077A8]">
                📅 Historique de votre demande
              </h3>

              {data.timeline.map((event) => {
                const status = STATUS_LABELS[event.type];
                const Icon = status.icon;

                return (
                  <div
                    key={event.id}
                    className="relative pl-6 border-l-2 border-[#00AEEF]"
                  >
                    <div className="absolute -left-[9px] top-1 bg-white rounded-full">
                      <Icon className="w-4 h-4 text-[#00AEEF]" />
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold">{status.label}</p>
                      <p className="text-sm text-gray-700">
                        {event.message_client}
                      </p>

                      {event.attente_raison && (
                        <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                          ⏸ {WAITING_REASONS[event.attente_raison]}
                          {event.delai_estime && (
                            <> — délai estimé : {event.delai_estime}</>
                          )}
                        </div>
                      )}

                      {event.photos?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {event.photos.map((p, i) => (
                            <img
                              key={i}
                              src={p}
                              alt="preuve"
                              className="w-20 h-20 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        {format(new Date(event.at), "dd/MM/yyyy HH:mm", {
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}