import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { createPageUrl } from '../../utils';
import errorLogger from './ErrorLogger';

// Indicateur compact de santé système (visible uniquement pour admin)
export default function QAHealthIndicator({ compact = true }) {
  const navigate = useNavigate();
  const [health, setHealth] = useState({ critical: 0, high: 0, status: 'ok' });

  useEffect(() => {
    updateHealth();

    // Mise à jour lors de nouveaux logs
    const interval = setInterval(updateHealth, 10000); // Check toutes les 10s
    
    return () => clearInterval(interval);
  }, []);

  const updateHealth = () => {
    const logs = errorLogger.getLogs();
    const critical = logs.filter(l => l.severity === 'CRITICAL').length;
    const high = logs.filter(l => l.severity === 'HIGH').length;

    setHealth({
      critical,
      high,
      status: critical > 0 ? 'critical' : high > 0 ? 'warning' : 'ok'
    });
  };

  if (compact) {
    return (
      <button
        onClick={() => navigate(createPageUrl('QASante'))}
        className={`fixed bottom-4 right-4 z-50 rounded-full p-3 shadow-lg transition-all hover:scale-105 ${
          health.status === 'critical' ? 'bg-red-600 animate-pulse' :
          health.status === 'warning' ? 'bg-orange-500' :
          'bg-green-500'
        }`}
        title="Santé du système"
      >
        {health.status === 'critical' && <XCircle className="w-6 h-6 text-white" />}
        {health.status === 'warning' && <AlertCircle className="w-6 h-6 text-white" />}
        {health.status === 'ok' && <CheckCircle className="w-6 h-6 text-white" />}
        
        {health.critical > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-white text-red-600 font-bold">
            {health.critical}
          </Badge>
        )}
      </button>
    );
  }

  return (
    <div
      onClick={() => navigate(createPageUrl('QASante'))}
      className={`cursor-pointer p-4 rounded-lg border-2 ${
        health.status === 'critical' ? 'border-red-500 bg-red-50' :
        health.status === 'warning' ? 'border-orange-500 bg-orange-50' :
        'border-green-500 bg-green-50'
      }`}
    >
      <div className="flex items-center gap-3">
        {health.status === 'critical' && <XCircle className="w-6 h-6 text-red-600" />}
        {health.status === 'warning' && <AlertCircle className="w-6 h-6 text-orange-600" />}
        {health.status === 'ok' && <CheckCircle className="w-6 h-6 text-green-600" />}
        
        <div>
          <p className="font-semibold">
            {health.status === 'critical' && '🚨 Application non exploitable'}
            {health.status === 'warning' && '⚠️ Surveillance recommandée'}
            {health.status === 'ok' && '✅ Système opérationnel'}
          </p>
          <p className="text-sm text-gray-600">
            {health.critical > 0 && `${health.critical} erreur(s) CRITICAL`}
            {health.critical === 0 && health.high > 0 && `${health.high} erreur(s) HIGH`}
            {health.critical === 0 && health.high === 0 && 'Aucune erreur critique'}
          </p>
        </div>
      </div>
    </div>
  );
}