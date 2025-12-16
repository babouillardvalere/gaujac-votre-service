import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "../utils";
import Logo from "../components/Logo";
import { useTranslation } from "../components/translations";

export default function ClientSuiviDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const interventionId = searchParams.get("id");
  const { t, lang } = useTranslation();

  const { data: intervention, isLoading } = useQuery({
    queryKey: ["intervention-detail", interventionId],
    enabled: !!interventionId,
    queryFn: async () => {
      const interventions = await base44.entities.Intervention.list();
      return interventions.find(i => i.id === interventionId);
    }
  });

  const { data: events = [] } = useQuery({
    queryKey: ["intervention-events", interventionId],
    enabled: !!interventionId,
    queryFn: async () => {
      const allEvents = await base44.entities.InterventionEvent.list();
      return allEvents
        .filter(e => e.intervention_id === interventionId)
        .sort((a, b) => new Date(a.at) - new Date(b.at));
    }
  });

  const getStatutConfig = (statut) => {
    const configs = {
      OUVERTE: {
        icon: Clock,
        color: 'bg-orange-100 text-orange-700',
        label: lang === 'fr' ? 'Ouverte' : 'Open'
      },
      EN_COURS: {
        icon: Loader2,
        color: 'bg-blue-100 text-blue-700',
        label: lang === 'fr' ? 'En cours' : 'In progress'
      },
      EN_ATTENTE: {
        icon: AlertCircle,
        color: 'bg-yellow-100 text-yellow-700',
        label: lang === 'fr' ? 'En attente' : 'On hold'
      },
      TERMINEE: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700',
        label: lang === 'fr' ? 'Terminée' : 'Completed'
      }
    };
    return configs[statut] || configs.OUVERTE;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="min-h-screen px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-gray-500">
            {lang === 'fr' ? 'Intervention introuvable' : 'Intervention not found'}
          </p>
          <Button
            onClick={() => navigate(createPageUrl('ClientSuiviSearch'))}
            className="mt-4 bg-[#00AEEF]"
          >
            {t('retour')}
          </Button>
        </div>
      </div>
    );
  }

  const menageConfig = getStatutConfig(intervention.menage_statut);
  const techniqueConfig = getStatutConfig(intervention.technique_statut);
  const MenageIcon = menageConfig.icon;
  const TechniqueIcon = techniqueConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <button
          onClick={() => navigate(createPageUrl('ClientSuiviSearch'))}
          className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-heading">{t('retour')}</span>
        </button>

        <Logo className="h-16 mb-4" />

        <h1 className="text-2xl font-bold text-[#0077A8] font-handwritten">
          📋 {lang === 'fr' ? 'Détail de l\'intervention' : 'Intervention details'}
        </h1>

        {/* INFO CLIENT */}
        <Card className="border-2 border-[#00AEEF]/30">
          <CardContent className="p-6 space-y-3">
            <div>
              <p className="text-sm text-gray-500">{lang === 'fr' ? 'Client' : 'Guest'}</p>
              <p className="font-semibold text-lg">{intervention.client_prenom} {intervention.client_nom}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{lang === 'fr' ? 'Logement' : 'Accommodation'}</p>
              <p className="font-semibold">{intervention.logement_numero} — {intervention.categorie_logement}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{lang === 'fr' ? 'Dates de séjour' : 'Stay dates'}</p>
              <p className="font-semibold">
                {format(new Date(intervention.date_arrivee), "dd MMMM yyyy", { locale: fr })} → {format(new Date(intervention.date_depart), "dd MMMM yyyy", { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{lang === 'fr' ? 'Contexte' : 'Context'}</p>
              <Badge className="bg-[#FFD700] text-[#0077A8]">{intervention.contexte}</Badge>
            </div>
            {intervention.urgent && (
              <Badge className="bg-red-100 text-red-700">
                {lang === 'fr' ? '🚨 Urgent' : '🚨 Urgent'}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* STATUTS SERVICES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MenageIcon className={`w-5 h-5 ${intervention.menage_statut === 'EN_COURS' ? 'animate-spin' : ''}`} />
                <h3 className="font-heading text-lg">🧹 {lang === 'fr' ? 'Ménage' : 'Housekeeping'}</h3>
              </div>
              <Badge className={menageConfig.color}>{menageConfig.label}</Badge>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TechniqueIcon className={`w-5 h-5 ${intervention.technique_statut === 'EN_COURS' ? 'animate-spin' : ''}`} />
                <h3 className="font-heading text-lg">🔧 {lang === 'fr' ? 'Technique' : 'Technical'}</h3>
              </div>
              <Badge className={techniqueConfig.color}>{techniqueConfig.label}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* TIMELINE */}
        <Card className="border-2 border-[#00AEEF]/30">
          <CardContent className="p-6">
            <h3 className="font-heading text-lg text-[#0077A8] mb-4">
              📅 {lang === 'fr' ? 'Historique' : 'Timeline'}
            </h3>
            {events.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {lang === 'fr' ? 'Aucun événement enregistré' : 'No events recorded'}
              </p>
            ) : (
              <div className="space-y-4">
                {events.map((event, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00AEEF]/20 flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-[#00AEEF]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#0077A8]">{event.type}</p>
                      <p className="text-sm text-gray-600">{event.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(event.at), "dd/MM/yyyy à HH:mm", { locale: fr })} — {event.auteur}
                      </p>
                      {event.attente_raison && (
                        <Badge className="mt-2 bg-yellow-100 text-yellow-700">
                          {event.attente_raison}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={() => navigate(createPageUrl('ClientSuiviSearch'))}
          variant="outline"
          className="w-full border-2 border-[#00AEEF] text-[#00AEEF]"
        >
          {t('retour')}
        </Button>

      </div>
    </div>
  );
}