import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import Logo from "../components/Logo";
import { useTranslation } from "../components/translations";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Search,
  ArrowLeft,
  Loader2,
  Sparkles,
  Wrench,
  CalendarDays,
  ChevronRight,
  AlertCircle
} from "lucide-react";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

/* =========================
   Helpers
========================= */
const normalize = (s) =>
  (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const STATUT_LABEL = {
  en_attente: { label: "Demande enregistrée", color: "bg-orange-100 text-orange-700" },
  en_cours: { label: "En cours", color: "bg-blue-100 text-blue-700" },
  en_attente_materiel: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  resolu: { label: "Terminée", color: "bg-green-100 text-green-700" }
};

const ServiceIcon = ({ type }) =>
  type === "menage" ? (
    <Sparkles className="w-5 h-5" />
  ) : (
    <Wrench className="w-5 h-5" />
  );

export default function ClientSuiviSearch() {
  const navigate = useNavigate();
  const { lang } = useTranslation();

  const [tab, setTab] = useState("arrivee"); // arrivee | sejour
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateSejour, setDateSejour] = useState(""); // YYYY-MM-DD (optionnel)
  const [searchTriggered, setSearchTriggered] = useState(false);

  const nomN = useMemo(() => normalize(nom), [nom]);
  const prenomN = useMemo(() => normalize(prenom), [prenom]);

  /* ======================================================
     1) Recherche de stays (pour retrouver stay_id)
     - on s'appuie sur FicheArrivee (plus fiable que Incident)
====================================================== */
  const { data: stays = [], isLoading: loadingStays } = useQuery({
    queryKey: ["client-suivi-stays", tab, nomN, prenomN, searchTriggered],
    enabled: searchTriggered && !!nomN && !!prenomN,
    queryFn: async () => {
      // On récupère des fiches d'arrivée récentes (ajuste le 200 si besoin)
      const fiches = await base44.entities.FicheArrivee.list("-date_validation", 200);

      // Filtre client-side robuste (accents/majuscules)
      const matches = fiches.filter((f) => {
        const fNom = normalize(f.client_nom);
        const fPrenom = normalize(f.client_prenom);
        return fNom === nomN && fPrenom === prenomN;
      });

      // Dédupliquer par stay_id si présent (sinon fallback sur fiche.id)
      const byKey = new Map();
      matches.forEach((f) => {
        const key = f.stay_id || `fiche_${f.id}`;
        if (!byKey.has(key)) byKey.set(key, f);
      });

      return Array.from(byKey.values());
    }
  });

  /* ======================================================
     2) Recherche d'interventions pour l'onglet SÉJOUR
     - via Incident (tes interventions pendant le séjour)
====================================================== */
  const selectedStayId = useMemo(() => {
    // Si plusieurs séjours, on affichera un choix; par défaut 1er
    return stays?.[0]?.stay_id || null;
  }, [stays]);

  const { data: sejourIncidents = [], isLoading: loadingIncidents } = useQuery({
    queryKey: ["client-suivi-sejour-incidents", selectedStayId, dateSejour, tab, searchTriggered],
    enabled: tab === "sejour" && searchTriggered && !!selectedStayId,
    queryFn: async () => {
      // Récupérer incidents du séjour
      const all = await base44.entities.Incident.filter(
        { stay_id: selectedStayId },
        "-date_saisie",
        200
      );

      // Ne garder que les incidents "séjour" (si tu as le champ origine)
      const onlySejour = all.filter((i) => (i.origine || "").toLowerCase() === "sejour");

      // Si date choisie, filtrer le jour (date_saisie)
      if (dateSejour) {
        const start = new Date(`${dateSejour}T00:00:00`);
        const end = new Date(`${dateSejour}T23:59:59`);
        return onlySejour.filter((i) => {
          if (!i.date_saisie) return false;
          const d = new Date(i.date_saisie);
          return d >= start && d <= end;
        });
      }

      return onlySejour;
    }
  });

  /* ======================================================
     Actions
====================================================== */
  const triggerSearch = () => {
    if (!nom.trim() || !prenom.trim()) return;
    setSearchTriggered(true);
  };

  const reset = () => {
    setSearchTriggered(false);
    setDateSejour("");
  };

  const openArrivee = (stayId) => {
    navigate(
      `${createPageUrl("ClientSuiviDetail")}?stay_id=${encodeURIComponent(
        stayId
      )}&type=ARRIVEE`
    );
  };

  const openSejour = (stayId, dateOpt) => {
    const qs = new URLSearchParams();
    qs.set("stay_id", stayId);
    qs.set("type", "SEJOUR");
    if (dateOpt) qs.set("date", dateOpt);
    navigate(`${createPageUrl("ClientSuiviDetail")}?${qs.toString()}`);
  };

  /* ======================================================
     UI
====================================================== */
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl("Home"))}
            className="flex items-center gap-2 text-[#0077A8]"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <Logo className="h-12" />
        </div>

        {/* Titre */}
        <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
          <CardContent className="p-5 space-y-2">
            <h1 className="font-heading text-xl text-[#0077A8] flex items-center gap-2">
              <Search className="w-5 h-5" />
              {lang === "fr" ? "Suivi de vos demandes" : "Track your requests"}
            </h1>
            <p className="text-sm text-gray-600">
              {lang === "fr"
                ? "Entrez votre nom et prénom, puis choisissez Arrivée ou Séjour."
                : "Enter your name, then choose Arrival or Stay."}
            </p>
          </CardContent>
        </Card>

        {/* Form recherche */}
        <Card className="rounded-xl">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Nom</p>
                <Input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex : Dupont"
                  className="border-2"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Prénom</p>
                <Input
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ex : Julie"
                  className="border-2"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={triggerSearch}
                className="bg-[#00AEEF] hover:bg-[#0077A8]"
              >
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>

              {searchTriggered && (
                <Button variant="outline" onClick={reset}>
                  Réinitialiser
                </Button>
              )}
            </div>

            {!nom.trim() || !prenom.trim() ? (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Renseignez votre nom et prénom pour lancer la recherche.
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Tabs Arrivée / Séjour */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full bg-[#e6f7ff] p-1 rounded-xl border border-[#00AEEF]/30">
            <TabsTrigger
              value="arrivee"
              className="flex-1 rounded-lg font-heading data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white"
            >
              Arrivée
            </TabsTrigger>
            <TabsTrigger
              value="sejour"
              className="flex-1 rounded-lg font-heading data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white"
            >
              Séjour
            </TabsTrigger>
          </TabsList>

          {/* =======================
              ONGLET ARRIVÉE
          ======================= */}
          <TabsContent value="arrivee" className="space-y-4 mt-4">
            {loadingStays ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 animate-spin text-[#00AEEF]" />
              </div>
            ) : !searchTriggered ? (
              <Card className="rounded-xl">
                <CardContent className="p-5 text-sm text-gray-600">
                  Lancez une recherche pour afficher votre suivi d’arrivée.
                </CardContent>
              </Card>
            ) : stays.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-5 text-sm text-gray-600">
                  Aucun séjour trouvé pour ce nom/prénom.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {stays.map((s) => (
                  <Card key={s.id} className="rounded-xl border-2 border-[#00AEEF]/20">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-800">
                          {s.client_prenom} {s.client_nom}
                        </p>
                        <p className="text-sm text-gray-600">
                          Logement {s.numero_logement} — {s.categorie_logement}
                        </p>
                        <p className="text-xs text-gray-500">
                          {s.date_arrivee && s.date_depart
                            ? `${format(new Date(s.date_arrivee), "dd/MM/yyyy", { locale: fr })} → ${format(
                                new Date(s.date_depart),
                                "dd/MM/yyyy",
                                { locale: fr }
                              )}`
                            : "Dates non disponibles"}
                        </p>
                      </div>

                      <Button
                        onClick={() => openArrivee(s.stay_id)}
                        className="bg-[#00AEEF] hover:bg-[#0077A8]"
                        disabled={!s.stay_id}
                      >
                        Ouvrir
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* =======================
              ONGLET SÉJOUR
          ======================= */}
          <TabsContent value="sejour" className="space-y-4 mt-4">
            {loadingStays ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 animate-spin text-[#00AEEF]" />
              </div>
            ) : !searchTriggered ? (
              <Card className="rounded-xl">
                <CardContent className="p-5 text-sm text-gray-600">
                  Lancez une recherche, puis choisissez une date (optionnel).
                </CardContent>
              </Card>
            ) : stays.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-5 text-sm text-gray-600">
                  Aucun séjour trouvé pour ce nom/prénom.
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Choix date */}
                <Card className="rounded-xl">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-[#0077A8] font-semibold">
                      <CalendarDays className="w-5 h-5" />
                      Voir une journée précise (facultatif)
                    </div>

                    <Input
                      type="date"
                      value={dateSejour}
                      onChange={(e) => setDateSejour(e.target.value)}
                      className="border-2"
                    />

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => openSejour(selectedStayId, dateSejour || null)}
                        disabled={!selectedStayId}
                      >
                        Ouvrir la chronologie {dateSejour ? "du jour" : "du séjour"}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500">
                      Astuce : si vous choisissez une date, vous voyez uniquement les demandes de cette journée.
                    </p>
                  </CardContent>
                </Card>

                {/* Liste interventions du jour (si date) */}
                {dateSejour && (
                  <Card className="rounded-xl">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-800">
                          Interventions du {format(new Date(dateSejour), "dd/MM/yyyy", { locale: fr })}
                        </p>
                        <Badge className="bg-gray-100 text-gray-700">
                          {sejourIncidents.length}
                        </Badge>
                      </div>

                      {loadingIncidents ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="w-6 h-6 animate-spin text-[#00AEEF]" />
                        </div>
                      ) : sejourIncidents.length === 0 ? (
                        <p className="text-sm text-gray-600">
                          Aucune demande trouvée ce jour-là.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {sejourIncidents.map((i) => {
                            const conf = STATUT_LABEL[i.statut] || STATUT_LABEL.en_attente;
                            return (
                              <button
                                key={i.id}
                                onClick={() => {
                                  // On ouvre la page de suivi en mode SEJOUR, filtrée par date
                                  openSejour(i.stay_id, dateSejour);
                                }}
                                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 flex items-center justify-between"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                    <ServiceIcon type={i.type} />
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="font-semibold text-gray-800">
                                      {i.type === "menage" ? "Ménage" : "Technique"}
                                    </p>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {i.description || "Demande enregistrée"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className={conf.color}>{conf.label}</Badge>
                                      {i.photo_avant_url || i.photo_apres_url ? (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <Camera className="w-3.5 h-3.5" />
                                          Photos
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}