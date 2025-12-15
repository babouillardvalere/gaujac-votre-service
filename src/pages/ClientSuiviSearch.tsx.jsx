import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { searchInterventionsBySejour } from "../components/interventionService";
import type { Intervention } from "../components/interventionTypes";
import Logo from "../components/Logo";
import { ArrowLeft } from "lucide-react";

export default function ClientSuiviSearch() {
  const navigate = useNavigate();
  const sejourId = sessionStorage.getItem("sejour_id") || "";

  const defaultNom = sessionStorage.getItem("user_nom") || "";
  const defaultPrenom = sessionStorage.getItem("user_prenom") || "";
  const defaultArr = sessionStorage.getItem("user_date_arrivee") || "";
  const defaultDep = sessionStorage.getItem("user_date_depart") || "";

  const [nom, setNom] = useState(defaultNom);
  const [prenom, setPrenom] = useState(defaultPrenom);
  const [dateArrivee, setDateArrivee] = useState(defaultArr);
  const [dateDepart, setDateDepart] = useState(defaultDep);

  const enabled = useMemo(() => !!sejourId, [sejourId]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["suivi-search", sejourId, nom, prenom, dateArrivee, dateDepart],
    queryFn: async () => {
      return (await searchInterventionsBySejour({
        sejourId,
        clientNom: nom || undefined,
        clientPrenom: prenom || undefined,
        dateArrivee: dateArrivee || undefined,
        dateDepart: dateDepart || undefined
      })) as Intervention[];
    },
    enabled
  });

  if (!sejourId) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Accès impossible</h2>
            <p className="text-sm text-gray-600 mt-2">
              Identifiant de séjour manquant. Reprenez le parcours Arrivée / Séjour.
            </p>
            <Link to={createPageUrl("Home")}>
              <Button className="mt-4 w-full">Retour accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => navigate(createPageUrl("Home"))}
        className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-heading">Retour</span>
      </button>

      <Logo className="h-16 mb-4" />

      <Card>
        <CardContent className="p-5 space-y-3">
          <h1 className="text-xl font-semibold">📋 Suivi des interventions</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Nom</label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Prénom</label>
              <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Date d'arrivée</label>
              <Input type="date" value={dateArrivee} onChange={(e) => setDateArrivee(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Date de départ</label>
              <Input type="date" value={dateDepart} onChange={(e) => setDateDepart(e.target.value)} />
            </div>
          </div>

          <Button className="w-full" onClick={() => refetch()}>
            Rechercher
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <p className="text-sm text-gray-600">Chargement…</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                {(data?.length || 0)} résultat(s)
              </p>

              <div className="space-y-3">
                {(data || []).map((it) => (
                  <Link key={it.id} to={`${createPageUrl("ClientSuiviDetail")}?id=${it.id}`}>
                    <Card className="hover:shadow-sm transition">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">📌 {it.logement_numero}</p>
                            <p className="text-sm text-gray-600">
                              {it.categorie_logement} · {it.contexte}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {it.date_arrivee} → {it.date_depart}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {it.updated_date ? format(new Date(it.updated_date), "dd/MM HH:mm") : ""}
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2 flex-wrap text-xs">
                          <span className="px-2 py-1 rounded bg-blue-50">🧹 {it.menage_statut}</span>
                          <span className="px-2 py-1 rounded bg-orange-50">🔧 {it.technique_statut}</span>
                          {it.urgent && <span className="px-2 py-1 rounded bg-red-50">🚨 Urgent</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}

                {(!data || data.length === 0) && (
                  <p className="text-sm text-gray-600">
                    Aucun résultat trouvé.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Link to={createPageUrl("Home")}>
        <Button variant="outline" className="w-full">Retour accueil</Button>
      </Link>
    </div>
  );
}