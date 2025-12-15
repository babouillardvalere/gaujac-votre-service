import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { listEvents } from "../services/interventionService";
import type { InterventionEvent, ServiceIntervention, TimelineType } from "../services/types";
import { format } from "date-fns";
import jsPDF from "jspdf";

const ICONS: Record<TimelineType, string> = {
  DEMANDE_RECUE: "📩",
  PRISE_EN_CHARGE: "👤",
  ARRIVEE_SUR_SITE: "🚗",
  EN_COURS: "🔧",
  MISE_EN_ATTENTE: "⏸",
  REPRISE: "▶️",
  TERMINEE: "✅",
  DEPART_SERVICE: "🚶"
};

export default function ServiceTimeline(props: { 
  interventionId: string; 
  service: ServiceIntervention;
}) {
  const { interventionId, service } = props;

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["timeline", interventionId, service],
    queryFn: async () => (await listEvents(interventionId, service)) as InterventionEvent[],
    enabled: !!interventionId
  });

  const sorted = useMemo(() => 
    [...events].sort((a, b) => (a.at || "").localeCompare(b.at || "")), 
    [events]
  );

  const downloadPdf = async () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Suivi intervention - ${service === "MENAGE" ? "Ménage" : "Technique"}`, 10, 12);

    doc.setFontSize(10);
    let y = 22;

    sorted.forEach((ev) => {
      const line1 = `${ICONS[ev.type]} ${format(new Date(ev.at), "dd/MM/yyyy HH:mm")} — ${ev.type}`;
      const line2 = `${ev.auteur || "Système"} : ${ev.message || ""}`;

      doc.text(line1, 10, y); y += 6;
      doc.text(line2, 10, y); y += 6;

      if (ev.type === "MISE_EN_ATTENTE") {
        const wait = `Attente: ${ev.attente_raison || ""} · ${ev.attente_delai || ""} · ${ev.attente_motif || ""}`;
        doc.text(wait, 10, y); y += 6;
      }

      if (ev.photo_url) {
        doc.text(`Photo: ${ev.photo_url}`, 10, y); y += 6;
      }

      y += 2;
      if (y > 275) { doc.addPage(); y = 15; }
    });

    doc.save(`suivi-${service.toLowerCase()}-${interventionId}.pdf`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">
          {service === "MENAGE" ? "🧹 Chronologie Ménage" : "🔧 Chronologie Technique"}
        </h2>
        <Button variant="outline" onClick={downloadPdf}>
          📄 PDF
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-600">Chargement timeline…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-gray-600">Aucun évènement pour ce service.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((ev) => (
            <div key={ev.id} className="border rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-2">
                  <div className="text-xl">{ICONS[ev.type]}</div>
                  <div>
                    <div className="font-medium">{ev.type}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(ev.at), "dd/MM HH:mm")} · 👤 {ev.auteur || "Système"}
                    </div>
                    <div className="text-sm mt-1">{ev.message}</div>

                    {ev.type === "MISE_EN_ATTENTE" && (
                      <div className="mt-2 text-sm bg-amber-50 border border-amber-200 rounded p-2">
                        <div>⏳ Motif : {ev.attente_motif}</div>
                        <div>📌 Raison : {ev.attente_raison}</div>
                        <div>🕒 Délai : {ev.attente_delai}</div>
                      </div>
                    )}

                    {ev.photo_url && (
                      <div className="mt-2">
                        <img 
                          src={ev.photo_url} 
                          alt="photo" 
                          className="w-full max-w-sm rounded border" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}