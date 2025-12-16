import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ArrowLeft, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "../utils";
import Logo from "../components/Logo";
import { useTranslation } from "../components/translations";

export default function ClientSuiviSearch() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [search, setSearch] = useState(false);

  const { data: interventions = [], isLoading } = useQuery({
    queryKey: ["client-suivi-search", nom, prenom],
    enabled: search,
    queryFn: async () => {
      const filters = {};
      if (nom) filters.client_nom = { $contains: nom };
      if (prenom) filters.client_prenom = { $contains: prenom };

      return await base44.entities.Intervention.filter(
        filters,
        "-created_date",
        50
      );
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Retour accueil */}
        <button
          onClick={() => navigate(createPageUrl("Home"))}
          className="flex items-center gap-2 text-[#0077A8]"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("retour")}
        </button>

        <Logo className="h-16" />

        <h1 className="text-2xl font-bold text-[#0077A8] font-handwritten">
          📋 {lang === "fr" ? "Suivi des interventions" : "Track interventions"}
        </h1>

        {/* FORMULAIRE */}
        <Card className="border-2 border-[#00AEEF]/30">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{lang === "fr" ? "Nom" : "Last name"}</Label>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>

            <div>
              <Label>{lang === "fr" ? "Prénom" : "First name"}</Label>
              <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <Button
                onClick={() => setSearch(true)}
                className="w-full bg-[#00AEEF]"
              >
                <Search className="w-4 h-4 mr-2" />
                {lang === "fr" ? "Rechercher" : "Search"}
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
              <div className="text-center space-y-3">
                <p className="text-gray-500">
                  {lang === "fr"
                    ? "Aucune intervention n’a encore été créée."
                    : "No intervention created yet."}
                </p>

                <Button
                  variant="outline"
                  className="border-2 border-[#00AEEF] text-[#00AEEF]"
                  onClick={() => navigate(createPageUrl("ClientMenu"))}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  {lang === "fr" ? "Signaler un problème" : "Report an issue"}
                </Button>
              </div>
            )}

            {!isLoading && interventions.length > 0 && (
              <div className="space-y-3">
                {interventions.map((intervention) => (
                  <Card
                    key={intervention.id}
                    className="cursor-pointer border-2 hover:border-[#00AEEF]"
                    onClick={() =>
                      navigate(
                        createPageUrl("ClientSuiviDetail") +
                          `?id=${intervention.id}`
                      )
                    }
                  >
                    <CardContent className="p-4">
                      <p className="font-semibold text-[#0077A8]">
                        {intervention.client_prenom} {intervention.client_nom}
                      </p>
                      <p className="text-sm text-gray-600">
                        {intervention.logement_numero} — {intervention.categorie_logement}
                      </p>
                      <p className="text-sm text-gray-500">
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