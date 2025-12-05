import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Truck } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';

const translations = {
  fr: {
    eta_title: 'Temps estimé',
    arriving_soon: 'Arrivée imminente',
    minutes: 'min',
    based_on: 'Basé sur interventions similaires',
    in_progress: 'En intervention',
    waiting_assignment: 'En attente d\'assignation',
    less_than: 'Moins de',
    about: 'Environ',
    under_way: 'En route'
  },
  en: {
    eta_title: 'Estimated time',
    arriving_soon: 'Arriving soon',
    minutes: 'min',
    based_on: 'Based on similar interventions',
    in_progress: 'In progress',
    waiting_assignment: 'Waiting for assignment',
    less_than: 'Less than',
    about: 'About',
    under_way: 'On the way'
  }
};

export default function ETAEstimation({ incident }) {
  const lang = sessionStorage.getItem('user_language') || 'fr';
  const t = (key) => translations[lang]?.[key] || translations['fr'][key];

  // Récupérer les interventions passées similaires pour estimation
  const { data: pastIncidents = [] } = useQuery({
    queryKey: ['eta-estimation', incident.categorie],
    queryFn: async () => {
      const resolved = await base44.entities.Incident.filter(
        { 
          categorie: incident.categorie, 
          statut: 'resolu' 
        }, 
        '-date_resolution', 
        50
      );
      return resolved.filter(i => i.temps_prise_en_charge);
    },
    enabled: incident.statut === 'en_attente'
  });

  // Calculer le temps moyen de prise en charge pour cette catégorie
  const calculateAverageWaitTime = () => {
    if (pastIncidents.length === 0) return null;
    
    const validTimes = pastIncidents
      .map(i => i.temps_prise_en_charge)
      .filter(t => t > 0 && t < 480); // Max 8h
    
    if (validTimes.length === 0) return null;
    
    const avg = Math.round(validTimes.reduce((a, b) => a + b, 0) / validTimes.length);
    return avg;
  };

  // Temps écoulé depuis la demande
  const getElapsedTime = () => {
    if (!incident.date_saisie) return 0;
    return differenceInMinutes(new Date(), new Date(incident.date_saisie));
  };

  // Temps restant estimé
  const getEstimatedRemaining = () => {
    const avgWait = calculateAverageWaitTime();
    if (!avgWait) return null;
    
    const elapsed = getElapsedTime();
    const remaining = avgWait - elapsed;
    
    return Math.max(0, remaining);
  };

  // En attente - afficher estimation
  if (incident.statut === 'en_attente') {
    const remaining = getEstimatedRemaining();
    const avgWait = calculateAverageWaitTime();

    return (
      <div className="bg-[#FFD700]/20 rounded-xl p-3 border border-[#FFD700]/30">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-[#FFA500]" />
          <span className="font-heading text-sm text-[#0077A8]">{t('eta_title')}</span>
        </div>
        
        {remaining !== null ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#FFA500] text-white text-lg px-3 py-1">
                {remaining <= 5 ? (
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4 animate-pulse" />
                    {t('arriving_soon')}
                  </span>
                ) : remaining <= 15 ? (
                  `${t('less_than')} 15 ${t('minutes')}`
                ) : remaining <= 30 ? (
                  `${t('about')} 30 ${t('minutes')}`
                ) : remaining <= 60 ? (
                  `${t('about')} 1h`
                ) : (
                  `${t('about')} ${Math.round(remaining / 60)}h`
                )}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              📊 {t('based_on')} ({pastIncidents.length})
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">{t('waiting_assignment')}</p>
        )}
      </div>
    );
  }

  // En cours - afficher que le technicien est en route ou sur place
  if (incident.statut === 'en_cours') {
    const elapsedIntervention = incident.date_debut 
      ? differenceInMinutes(new Date(), new Date(incident.date_debut))
      : 0;

    return (
      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-heading text-sm text-blue-700">{t('in_progress')}</span>
            <p className="text-xs text-blue-600">
              {incident.pris_par} • {elapsedIntervention} {t('minutes')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}