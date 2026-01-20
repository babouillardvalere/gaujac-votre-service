import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Clock, PlayCircle, PauseCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../translations';

/**
 * 🔒 COMPOSANT TIMELINE UNIQUE - SuiviEvent
 * 
 * Affiche la chronologie complète d'un WorkItem basée sur SuiviEvent
 * Ordre: DESC par timestamp (plus récent en haut)
 */

const ACTION_CONFIG = {
  CREATION: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    labelFr: 'Demande créée',
    labelEn: 'Request created'
  },
  PRISE_EN_CHARGE: {
    icon: PlayCircle,
    color: 'text-green-600',
    bg: 'bg-green-100',
    labelFr: 'Prise en charge',
    labelEn: 'Taken over'
  },
  EN_COURS: {
    icon: PlayCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    labelFr: 'En cours',
    labelEn: 'In progress'
  },
  MISE_EN_ATTENTE: {
    icon: PauseCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    labelFr: 'Mise en attente',
    labelEn: 'On hold'
  },
  REPRISE: {
    icon: PlayCircle,
    color: 'text-green-600',
    bg: 'bg-green-100',
    labelFr: 'Reprise',
    labelEn: 'Resumed'
  },
  TERMINEE: {
    icon: CheckCircle,
    color: 'text-green-700',
    bg: 'bg-green-200',
    labelFr: 'Terminée',
    labelEn: 'Completed'
  },
  ANNULEE: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    labelFr: 'Annulée',
    labelEn: 'Cancelled'
  }
};

const SERVICE_LABELS = {
  MENAGE: { fr: 'Ménage', en: 'Housekeeping' },
  TECHNIQUE: { fr: 'Technique', en: 'Technical' },
  RECEPTION: { fr: 'Réception', en: 'Reception' },
  DIRECTION: { fr: 'Direction', en: 'Management' },
  SYSTEM: { fr: 'Système', en: 'System' }
};

export default function TimelineSuiviEvent({ workItemId, preloadedEvents = null }) {
  const { t, lang } = useTranslation();
  
  // Fetch SuiviEvent pour ce WorkItem (ou utiliser preloadedEvents si fourni)
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['suiviEvents', workItemId],
    queryFn: async () => {
      const results = await base44.entities.SuiviEvent.filter(
        { workitem_id: workItemId },
        '-timestamp',
        100
      );
      return results;
    },
    enabled: !!workItemId && !preloadedEvents,
    refetchInterval: preloadedEvents ? false : 5000,
    initialData: preloadedEvents || undefined
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AEEF]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">Erreur lors du chargement de la timeline</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">
          {lang === 'fr' 
            ? 'Aucun événement de suivi disponible'
            : 'No tracking events available'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => {
        const config = ACTION_CONFIG[event.action] || {
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          labelFr: event.action,
          labelEn: event.action
        };
        
        const Icon = config.icon;
        const label = lang === 'fr' ? config.labelFr : config.labelEn;
        const serviceLabel = SERVICE_LABELS[event.service]?.[lang] || event.service;
        
        return (
          <div 
            key={event.id}
            className={`border-l-4 ${config.color.replace('text-', 'border-')} pl-4 py-3 ${
              index === 0 ? 'bg-blue-50/30' : 'bg-white'
            } rounded-r-lg`}
          >
            <div className="flex items-start gap-3">
              <div className={`${config.bg} p-2 rounded-full flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {label}
                  </h4>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-1">
                  {event.message}
                </p>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                    {serviceLabel}
                  </span>
                  
                  {event.collaborateur && (
                    <span className="text-gray-600">
                      • {event.collaborateur}
                    </span>
                  )}
                </div>
                
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {event.metadata.raison_attente && (
                      <p>Raison: {event.metadata.raison_attente}</p>
                    )}
                    {event.metadata.delai_estime && (
                      <p>Délai estimé: {event.metadata.delai_estime}</p>
                    )}
                    {event.metadata.duree_minutes && (
                      <p>Durée: {event.metadata.duree_minutes} min</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}