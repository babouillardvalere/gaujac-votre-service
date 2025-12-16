import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";

export default function ClientSuiviSearch() {
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [search, setSearch] = useState(false);

  const { data: interventions = [], isLoading } = useQuery({
    queryKey: ["client-suivi-search", nom, prenom, dateDebut, dateFin],
    enabled: search,
    queryFn: async () => {
      const filters = {};

      if (nom) filters.client_nom = nom;
      if (prenom) filters.client_prenom = prenom;

      if (dateDebut) {
        filters.date_arrivee = { $gte: dateDebut };
      }

      if (dateFin) {
        filters.date_depart = { $lte: dateFin };
      }

      return await base44.entities.Intervention.filter(
        filters,
        "-date_creation",
        50
      );
    }
  });

  const handleSearch = () => {
    setSearch(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-[#0077A8]">
          📋 Suivi des interventions
        </h1>

        {/* FORMULAIRE */}
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nom</Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>

            <div>
              <Label>Prénom</Label>
              <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>

            <div>
              <Label>Date d’arrivée</Label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            <div>
              <Label>Date de départ</Label>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Button
                onClick={handleSearch}
                className="w-full bg-[#00AEEF]"
              >
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RÉSULTATS */}
        <Card>
          <CardContent className="p-4">
            {isLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin w-6 h-6 text-[#00AEEF]" />
              </div>
            )}

            {!isLoading && search && interventions.length === 0 && (
              <p className="text-center text-gray-500">
                Aucun résultat trouvé
              </p>
            )}

            {!isLoading && interventions.length > 0 && (
              <div className="space-y-3">
                {interventions.map((intervention) => (
                  <Card
                    key={intervention.id}
                    className="cursor-pointer hover:shadow-md transition"
                    onClick={() =>
                      navigate(`/client/suivi/${intervention.id}`)
                    }
                  >
                    <CardContent className="p-4 space-y-1">
                      <p className="font-semibold">
                        {intervention.client_prenom} {intervention.client_nom}
                      </p>

                      <p className="text-sm text-gray-600">
                        Logement : {intervention.logement} — {intervention.categorie}
                      </p>

                      <p className="text-sm text-gray-500">
                        Séjour :{" "}
                        {format(new Date(intervention.date_arrivee), "dd/MM/yyyy")} →{" "}
                        {format(new Date(intervention.date_depart), "dd/MM/yyyy")}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}