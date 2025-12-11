import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Loader2, Bell } from 'lucide-react';
import { useTranslation } from '../translations';

export default function SuiviTimeline({ events }) {
  const { lang } = useTranslation();

  const getEventIcon = (status) => {
    switch (status) {
      case 'cree':
      case 'Créé':
        return <Bell className="w-4 h-4 text-blue-500" />;
      case 'notification':
      case 'Notification envoyée':
        return <Bell className="w-4 h-4 text-purple-500" />;
      case 'en_cours':
      case 'En cours':
        return <Loader2 className="w-4 h-4 text-blue-500" />;
      case 'en_attente':
      case 'En attente':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'termine':
      case 'Terminé':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic mt-2">
        {lang === 'fr' ? 'Aucun événement enregistré' : 'No events recorded'}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {events.map((event, idx) => (
        <div key={idx} className="flex items-start gap-3 text-sm">
          <div className="mt-0.5">
            {getEventIcon(event.status)}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-500">{event.time}</span>
              <span className="font-medium text-gray-700">{event.status}</span>
            </div>
            {event.detail && (
              <p className="text-xs text-gray-600 mt-0.5">{event.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}