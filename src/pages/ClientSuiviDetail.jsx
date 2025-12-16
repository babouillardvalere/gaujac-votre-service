import React, { useRef } from "react";
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
  PauseCircle,
  PlayCircle,
  FileDown,
  Sparkles,
  Wrench
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "../utils";
import Logo from "../components/Logo";

/* Statuts affichés au client */
const STATUS = {
  PRISE_EN_CHARGE: { label: "Demande enregistrée", icon: Clock, color: "bg-orange-100 text-orange-700" },
  EN_COURS: { label: "Intervention en cours", icon: PlayCircle, color: "bg-blue-100 text-blue-700" },
  EN_ATTENTE: { label: "En attente", icon: PauseCircle, color: "bg-yellow-100 text-yellow-700" },
  TERMINEE: { label: "Intervention terminée", icon: CheckCircle, color: "bg-green-100 text-green-700" }
};

const WAITING_REASON = {
  MATERIEL: "Attente de matériel",
  FOURNISSEUR: "Attente du fournisseur",
  CLIENT_ABSENT: "Client absent",
  PIECE_SPECIFIQUE: "Besoin d’une pièce spécifique",
  SECOND_TECHNICIEN: "Besoin d’un second technicien"
};

export default function ClientSuiviDetail() {
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const [params] = useSearchParams();

  const type = params.get("type"); // ARRIVEE | SEJOUR
  const ficheId = params.get("fiche_id");

  const { data, isLoading } = useQuery({
    queryKey: ["client-suivi-detail", type, ficheId],
    enabled: type === "ARRIVEE" && !!ficheId,
    queryFn: async () => {
      const fiche = await base44.entities.FicheArrivee.get(ficheId);

      // Suivi inventaire (celui que tu crées à l’envoi)
      const suivis = await base44.entities.SuiviInventaire.filter(
        { fiche_arrivee_id: ficheId },
        "-created_at",
        10
      );

      // Events client-safe (créés par tes équipes / sync)
      const events = await base44.entities.InterventionEvent.filter(
        { fiche_arrivee_id: ficheId, visible_client: true },
        "at",
        200
      );

      return { fiche, suivi: suivis?.[0] || null, events };
    }
  });

  const exportPdf = () => {
    const content = pageRef.current?.innerHTML || "";
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
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/assets/logo-camping.png" />
            <h2>Suivi de votre arrivée</h2>
          </div>
          ${content}
        </body>
      </html>
    `;

    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  if (!data || !data.fiche) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Aucune information disponible.</p>
        <Button onClick={() => navigate(createPageUrl("ClientSuiviSearch"))}>
          Retour
        </Button>
      </div>
    );
  }

  const { fiche, suivi, events } = data;

  // Statuts globaux (si tu as déjà les champs dans SuiviInventaire)
  const statutMenage = suivi?.statut_menage || null;      // ex: en_attente / en_cours / resolu...
  const statutTech = suivi?.statut_technique || null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">

        <button
          onClick={() => navigate(createPageUrl("ClientSuiviSearch"))}
          className="flex items-center gap-2 text-[#0077A8]"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

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
                {fiche.client_prenom} {fiche.client_nom}
              </p>
              <p className="text-gray-600">
                Logement {fiche.logement || fiche.numero_logement || "—"}
              </p>
              <p className="text-gray-500">
                {fiche.date_arrivee || "—"} → {fiche.date_depart || "—"}
              </p>
            </CardContent>
          </Card>

          {/* MESSAGE CLIENT (si présent dans SuiviInventaire) */}
          {suivi?.message_client && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-700">{suivi.message_client}</p>
              </CardContent>
            </Card>
          )}

          {/* STATUTS MENAGE / TECH (si tu les as) */}
          {(statutMenage || statutTech) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statutMenage && (
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-semibold">Ménage</span>
                    </div>
                    <Badge className="bg-gray-100 text-gray-700">
                      {statutMenage}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              {statutTech && (
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      <span className="font-semibold">Technique</span>
                    </div>
                    <Badge className="bg-gray-100 text-gray-700">
                      {statutTech}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* TIMELINE */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-[#0077A8]">
                📅 Historique de votre demande
              </h3>

              {events.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Aucune mise à jour pour le moment.
                </p>
              ) : (
                events.map((e) => {
                  const conf = STATUS[e.type] || STATUS.PRISE_EN_CHARGE;
                  const Icon = conf.icon;

                  return (
                    <div
                      key={e.id}
                      className="relative pl-6 border-l-2 border-[#00AEEF]"
                    >
                      <div className="absolute -left-[9px] top-1 bg-white rounded-full">
                        <Icon className="w-4 h-4 text-[#00AEEF]" />
                      </div>

                      <p className="font-semibold">{conf.label}</p>
                      <p className="text-sm text-gray-700">{e.message_client}</p>

                      {e.attente_raison && (
                        <div className="mt-1 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                          ⏸ {WAITING_REASON[e.attente_raison] || "En attente"}
                          {e.delai_estime && <> — délai estimé : {e.delai_estime}</>}
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-1">
                        {e.at
                          ? format(new Date(e.at), "dd/MM/yyyy HH:mm", { locale: fr })
                          : ""}
                      </p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}