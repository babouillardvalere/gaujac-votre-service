import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "../utils";
import Logo from "../components/Logo";
import { useTranslation } from "../components/translations";

export default function ClientSuiviSearch() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();

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
        "-created_date",
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
        
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-heading">{t('retour')}</span>
        </button>

        <Logo className="h-16 mb-4" />

        <h1 className="text-2xl font-bold text-[#0077A8] font-handwritten">
          📋 {lang === 'fr' ? 'Suivi des interventions' : 'Track interventions'}
        </h1>

        {/* FORMULAIRE */}
        <Card className="border-2 border-[#00AEEF]/30">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{lang === 'fr' ? 'Nom' : 'Last name'}</Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>

            <div>
              <Label>{lang === 'fr' ? 'Prénom' : 'First name'}</Label>
              <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>

            <div>
              <Label>{lang === 'fr' ? "Date d'arrivée" : 'Arrival date'}</Label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            <div>
              <Label>{lang === 'fr' ? 'Date de départ' : 'Departure date'}</Label>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Button
                onClick={handleSearch}
                className="w-full bg-[#00AEEF] hover:bg-[#0077A8]"
              >
                <Search className="w-4 h-4 mr-2" />
                {lang === 'fr' ? 'Rechercher' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RÉSULTATS */}
        <Card className="border-2 border-[#00AEEF]/30">
          <CardContent className="p-4">
            {isLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin w-6 h-6 text-[#00AEEF]" />
              </div>
            )}

            {!isLoading && search && interventions.length === 0 && (
              <p className="text-center text-gray-500">
                {lang === 'fr' ? 'Aucun résultat trouvé' : 'No results found'}
              </p>
            )}

            {!isLoading && !search && (
              <p className="text-center text-gray-500">
                {lang === 'fr' ? 'Veuillez effectuer une recherche' : 'Please search'}
              </p>
            )}

            {!isLoading && interventions.length > 0 && (
              <div className="space-y-3">
                {interventions.map((intervention) => (
                  <Card
                    key={intervention.id}
                    className="cursor-pointer hover:shadow-md transition border-2 border-gray-200 hover:border-[#00AEEF]"
                    onClick={() =>
                      navigate(createPageUrl('ClientSuiviDetail') + `?id=${intervention.id}`)
                    }
                  >
                    <CardContent className="p-4 space-y-1">
                      <p className="font-semibold text-[#0077A8]">
                        {intervention.client_prenom} {intervention.client_nom}
                      </p>

                      <p className="text-sm text-gray-600">
                        {lang === 'fr' ? 'Logement' : 'Accommodation'} : {intervention.logement_numero} — {intervention.categorie_logement}
                      </p>

                      <p className="text-sm text-gray-500">
                        {lang === 'fr' ? 'Séjour' : 'Stay'} :{" "}
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