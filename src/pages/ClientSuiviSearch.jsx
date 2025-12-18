import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronRight, Search } from "lucide-react";
import { createPageUrl } from "../utils";
import Logo from "../components/Logo";

/* Normalisation robuste (accents, espaces, casse) */
const normalize = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export default function ClientSuiviSearch() {
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const nomN = useMemo(() => normalize(nom), [nom]);
  const prenomN = useMemo(() => normalize(prenom), [prenom]);

  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ["client-suivi-fiches", nomN, prenomN, searchTriggered],
    enabled: searchTriggered && !!nomN && !!prenomN,
    queryFn: async () => {
      // On liste les fiches (tri non critique)
      const all = await base44.entities.FicheArrivee.list("-created_at", 300);

      // Match robuste sur les champs que tu utilises déjà
      const matches = all.filter((f) => {
        const fNom = normalize(f.client_nom);
        const fPrenom = normalize(f.client_prenom);
        return fNom === nomN && fPrenom === prenomN;
      });

      // Déduplication simple (même fiche)
      const byId = new Map();
      matches.forEach((f) => byId.set(f.id, f));
      return Array.from(byId.values());
    },
  });

  const openArrivee = (ficheId) => {
    navigate(`${createPageUrl("ClientSuiviDetail")}?type=ARRIVEE&fiche_id=${encodeURIComponent(ficheId)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">

        <Logo className="h-14 mx-auto" />

        <Card>
          <CardContent className="p-4 space-y-3">
            <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
            <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" />
            <Button
              className="bg-[#00AEEF] hover:bg-[#0077A8]"
              onClick={() => {
                if (!nomN || !prenomN) return;
                setSearchTriggered(true);
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-7 h-7 animate-spin text-[#00AEEF]" />
          </div>
        ) : !searchTriggered ? (
          <p className="text-center text-gray-500">
            Entrez votre nom et prénom puis lancez la recherche.
          </p>
        ) : fiches.length === 0 ? (
          <p className="text-center text-gray-500">
            Aucun suivi trouvé (aucune fiche d'arrivée à ce nom/prénom).
          </p>
        ) : (
          <div className="space-y-3">
            {fiches.map((f) => (
              <Card key={f.id} className="border-2 border-[#00AEEF]/20 rounded-xl">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {f.client_prenom} {f.client_nom}
                    </p>
                    <p className="text-sm text-gray-600">
                      Logement {f.logement || f.numero_logement || "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(f.date_arrivee || "—")} → {(f.date_depart || "—")}
                    </p>
                  </div>

                  <Button
                    onClick={() => openArrivee(f.id)}
                    className="bg-[#00AEEF] hover:bg-[#0077A8]"
                  >
                    Ouvrir
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}