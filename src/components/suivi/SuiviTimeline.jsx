import React from 'react';
import { useTranslation } from '../translations';

// Statuts normalisés avec icônes et couleurs
const STATUS_CONFIG = {
  'demande_recue': {
    label: { fr: 'Demande reçue', en: 'Request received' },
    emoji: '📨',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700'
  },
  'prise_en_charge': {
    label: { fr: 'Prise en charge', en: 'Taken in charge' },
    emoji: '👤',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700'
  },
  'en_cours': {
    label: { fr: 'Intervention en cours', en: 'Intervention in progress' },
    emoji: '🔧',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700'
  },
  'en_attente': {
    label: { fr: 'En attente', en: 'On hold' },
    emoji: '⏸️',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700'
  },
  'reprise': {
    label: { fr: 'Reprise de l\'intervention', en: 'Intervention resumed' },
    emoji: '▶️',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700'
  },
  'termine': {
    label: { fr: 'Problème résolu', en: 'Problem solved' },
    emoji: '✅',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700'
  },
  'resolu': {
    label: { fr: 'Problème résolu', en: 'Problem solved' },
    emoji: '✅',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700'
  },
  // Fallback pour anciens statuts
  'cree': {
    label: { fr: 'Demande reçue', en: 'Request received' },
    emoji: '📨',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700'
  },
  'notification': {
    label: { fr: 'Notification envoyée', en: 'Notification sent' },
    emoji: '🔔',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700'
  }
};

export default function SuiviTimeline({ events }) {
  const { lang } = useTranslation();

  const getStatusConfig = (status) => {
    const statusKey = status?.toLowerCase().replace(/\s+/g, '_');
    return STATUS_CONFIG[statusKey] || {
      label: { fr: status, en: status },
      emoji: '🔵',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700'
    };
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic mt-2">
        {lang === 'fr' ? 'Aucun événement enregistré' : 'No events recorded'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event, idx) => {
        const config = getStatusConfig(event.status);
        const isLast = idx === events.length - 1;
        
        return (
          <div key={idx} className="flex gap-3">
            {/* Ligne verticale */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center text-lg flex-shrink-0`}>
                {config.emoji}
              </div>
              {!isLast && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
            </div>
            
            {/* Contenu */}
            <div className="flex-1 pb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`font-heading ${config.textColor}`}>
                  {config.label[lang] || config.label.fr}
                </span>
                <span className="text-xs text-gray-500">
                  {event.time}
                </span>
              </div>
              
              {event.utilisateur && (
                <p className="text-xs text-gray-600 mb-1">
                  👤 {event.utilisateur}
                </p>
              )}
              
              {event.detail && (
                <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  💬 {event.detail}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}