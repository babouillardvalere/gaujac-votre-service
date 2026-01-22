import React from 'react';
import { CheckCircle, Play, Pause, Send } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const stateConfig = {
  en_attente: { 
    emoji: '📋', 
    label: 'À faire',
    color: 'bg-gray-100 border-gray-300',
    dotColor: 'bg-yellow-500',
    textColor: 'text-gray-700'
  },
  en_cours: { 
    emoji: '⚡', 
    label: 'En cours',
    color: 'bg-blue-100 border-blue-300',
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-700'
  },
  en_attente_materiel: { 
    emoji: '⏳', 
    label: 'Reporté',
    color: 'bg-orange-100 border-orange-300',
    dotColor: 'bg-orange-500',
    textColor: 'text-orange-700'
  },
  resolu: { 
    emoji: '✅', 
    label: 'Résolue',
    color: 'bg-green-100 border-green-300',
    dotColor: 'bg-green-500',
    textColor: 'text-green-700'
  }
};

const allStates = ['en_attente', 'en_cours', 'en_attente_materiel', 'resolu'];

/**
 * Timeline chronologique d'une intervention
 * Affiche les 4 états: à faire → en cours → reporté → résolue
 */
export default function InterventionTimeline({ incident }) {
  if (!incident) return null;

  const currentStateIndex = allStates.indexOf(incident.statut);
  
  return (
    <div className="my-4 px-2">
      {/* Titre et état courant */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          {incident.description_operationnelle?.substring(0, 80) || incident.description?.substring(0, 80) || '📋 Intervention'}
        </h3>
      </div>

      {/* Timeline horizontale avec états */}
      <div className="relative">
        {/* Ligne de progression */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300 rounded-full z-0" />
        <div 
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-yellow-500 via-blue-500 to-green-500 rounded-full z-0 transition-all"
          style={{ 
            width: currentStateIndex === -1 ? '0%' : `${((currentStateIndex + 1) / allStates.length) * 100}%`
          }}
        />

        {/* États */}
        <div className="relative z-10 flex justify-between">
          {allStates.map((state, idx) => {
            const config = stateConfig[state];
            const isCompleted = idx < currentStateIndex;
            const isCurrent = idx === currentStateIndex;
            
            return (
              <div key={state} className="flex flex-col items-center">
                {/* Point de la timeline */}
                <div className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300 mb-2
                  ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                  ${isCompleted ? 'bg-green-500 border-green-600' : 
                    isCurrent ? 'bg-blue-500 border-blue-600' : 
                    'bg-gray-200 border-gray-400'}
                `}>
                  <span className={`text-lg ${isCompleted ? 'text-white' : isCurrent ? 'text-white' : 'text-gray-600'}`}>
                    {isCompleted ? '✓' : config.emoji}
                  </span>
                </div>

                {/* Label de l'état */}
                <p className={`text-xs font-semibold text-center ${
                  isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {config.label}
                </p>

                {/* Timestamp si disponible */}
                {isCurrent && incident.date_debut && (
                  <p className="text-xs text-blue-600 mt-1">
                    {format(new Date(incident.date_debut), 'dd/MM HH:mm', { locale: fr })}
                  </p>
                )}
                {isCompleted && state === 'en_cours' && incident.date_debut && (
                  <p className="text-xs text-green-600 mt-1">
                    {format(new Date(incident.date_debut), 'dd/MM', { locale: fr })}
                  </p>
                )}
                {isCompleted && state === 'resolu' && incident.date_resolution && (
                  <p className="text-xs text-green-600 mt-1">
                    {format(new Date(incident.date_resolution), 'dd/MM', { locale: fr })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* État courant avec détails */}
      <div className="mt-6 p-3 rounded-lg border-2" style={{
        borderColor: stateConfig[incident.statut].borderColor || '#e5e7eb',
        backgroundColor: stateConfig[incident.statut].color
      }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{stateConfig[incident.statut].emoji}</span>
          <p className={`font-semibold ${stateConfig[incident.statut].textColor}`}>
            {stateConfig[incident.statut].label}
          </p>
        </div>

        {/* Détails selon l'état */}
        {incident.statut === 'en_attente' && (
          <p className="text-xs text-gray-600 mt-2">
            📅 Signalée le {format(new Date(incident.date_saisie), 'dd/MM/yyyy à HH:mm', { locale: fr })}
          </p>
        )}

        {incident.statut === 'en_cours' && incident.pris_par && (
          <div className="text-xs text-blue-700 mt-2 space-y-1">
            <p>👤 Pris en charge par: <strong>{incident.pris_par}</strong></p>
            {incident.date_debut && (
              <p>⏱️ Depuis: {format(new Date(incident.date_debut), 'dd/MM HH:mm', { locale: fr })}</p>
            )}
          </div>
        )}

        {incident.statut === 'en_attente_materiel' && (
          <div className="text-xs text-orange-700 mt-2 space-y-1">
            <p>⏳ <strong>En attente:</strong> {incident.motif_attente || incident.attente_raison || 'Raison non spécifiée'}</p>
            {incident.attente_delai && (
              <p>📅 Délai estimé: {incident.attente_delai}</p>
            )}
          </div>
        )}

        {incident.statut === 'resolu' && (
          <div className="text-xs text-green-700 mt-2 space-y-1">
            <p>✅ <strong>Clôturée</strong> le {format(new Date(incident.date_resolution || new Date()), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
            {incident.pris_par && <p>👤 Par: <strong>{incident.pris_par}</strong></p>}
          </div>
        )}
      </div>
    </div>
  );
}