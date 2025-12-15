import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "../utils";
import { Link, useLocation } from "react-router-dom";
import { getIntervention } from "../components/interventionService";
import type { Intervention, ServiceIntervention } from "../components/interventionTypes";
import ServiceTimeline from "../components/ServiceTimeline";
import Logo from "../components/Logo";
import { ArrowLeft } from "lucide-react";

function useQueryParam(name: string) {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(name), [search, name]);
}

export default function ClientSuiviDetail() {
  const id = useQueryParam("id") || "";
  const [service, setService] = useState<ServiceIntervention>("MENAGE");

  const { data, isLoading } = useQuery({
    queryKey: ["suivi-detail", id],
    queryFn: async () => (await getIntervention(id)) as Intervention,
    enabled: !!id
  });

  if (!id) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Card><CardContent className="p-6">ID intervention manquant.</CardContent></Card>
        <Link to={createPageUrl("ClientSuiviSearch")}><Button className="mt-4 w-full">Retour</Button></Link>
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="p-6 max-w-2xl mx-auto">Chargement…</div>;
  }

  const suiviClientAutorise = data.contexte !== "DEPART";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <Link to={createPageUrl("ClientSuiviSearch")} className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-heading">Retour</span>
      </Link>

      <Logo className="h-16 mb-4" />

      <Card>
        <CardContent className="p-5 space-y-2">
          <h1 className="text-xl font-semibold">📌 {data.logement_numero}</h1>
          <p className="text-sm text-gray-600">{data.categorie_logement} · {data.contexte}</p>
          <p className="text-sm text-gray-600">
            Séjour : {data.date_arrivee} → {data.date_depart}
          </p>

          <div className="mt-3 flex gap-2">
            <Button
              className={`flex-1 ${service === "MENAGE" ? "" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
              onClick={() => setService("MENAGE")}
              disabled={!suiviClientAutorise}
            >
              🧹 Ménage
            </Button>
            <Button
              className={`flex-1 ${service === "TECHNIQUE" ? "" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
              onClick={() => setService("TECHNIQUE")}
              disabled={!suiviClientAutorise}
            >
              🔧 Technique
            </Button>
          </div>

          {!suiviClientAutorise && (
            <p className="text-sm text-gray-600 mt-2">
              ℹ️ Au départ, le suivi est réservé aux équipes internes.
            </p>
          )}
        </CardContent>
      </Card>

      {suiviClientAutorise && (
        <Card>
          <CardContent className="p-5">
            <ServiceTimeline interventionId={data.id} service={service} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link to={createPageUrl("ClientSuiviSearch")}>
          <Button variant="outline" className="w-full">⬅️ Retour recherche</Button>
        </Link>
        <Link to={createPageUrl("Home")}>
          <Button className="w-full">🏠 Accueil</Button>
        </Link>
      </div>
    </div>
  );
}