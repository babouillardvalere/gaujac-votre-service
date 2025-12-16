import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronRight } from "lucide-react";
import { createPageUrl } from "../utils";
import Logo from "../components/Logo";

const normalize = (str) => str?.toLowerCase().trim() || "";

export default function ClientSuiviSearch() {
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const nomN = useMemo(() => normalize(nom), [nom]);
  const prenomN = useMemo(() => normalize(prenom), [prenom]);

  /* =========================
     RECHERCHE ARRIVÉES
  ========================= */
  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ["client-suivi-arrivee", nomN, prenomN, searchTriggered],
    enabled: searchTriggered && !!nomN && !!prenomN,
    queryFn: async () => {
      const all = await base44.entities.FicheArrivee.list(
        "-date_validation",
        200
      );

      return all.filter(
        (f) =>
          normalize(f.client_nom) === nomN &&
          normalize(f.client_prenom) === prenomN &&
          f.stay_id
      );
    },
  });

  /* =========================
     NAVIGATION
  ========================= */
  const openSuiviArrivee = (stayId) => {
    navigate(
      `${createPageUrl("ClientSuiviDetail")}?type=ARRIVEE&stay_id=${stayId}`
    );
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">

        <Logo className="h-14 mx-auto" />

        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom"
            />
            <Input
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Prénom"
            />
            <Button
              className="bg-[#00AEEF]"
              onClick={() => setSearchTriggered(true)}
            >
              Rechercher
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <Loader2 className="animate-spin mx-auto" />
        ) : fiches.length === 0 ? (
          <p className="text-center text-gray-500">
            Aucun suivi trouvé
          </p>
        ) : (
          fiches.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {f.client_prenom} {f.client_nom}
                  </p>
                  <p className="text-sm text-gray-600">
                    Logement {f.numero_logement}
                  </p>
                  <p className="text-xs text-gray-500">
                    {f.date_arrivee} → {f.date_depart}
                  </p>
                </div>

                <Button
                  className="bg-[#00AEEF]"
                  onClick={() => openSuiviArrivee(f.stay_id)}
                >
                  Ouvrir
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}