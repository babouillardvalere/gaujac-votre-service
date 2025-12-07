import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from './translations';
import { useRealtimeNotifications } from './RealtimeNotificationProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { Bell, Wrench, Sparkles, Package, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import RealtimeIndicator from './RealtimeIndicator';

const categoryEmojis = {
  gaz: '🔥', eau: '💧', electricite: '⚡', plomberie: '🔧',
  espace_vert: '🌿', divers_technique: '🛠', mobilier: '🧰', structurel: '🏚',
  souris: '🐭', guepes: '🐝', frelons: '🐝', fourmis: '🐜', moustiques: '🦟',
  literie: '🛏', nettoyage: '🧽', vaisselle: '🍽', poubelle: '🗑', produit_manquant: '🧴',
  menage: '🧹'
};

export default function CollaborateurNotificationBell() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const { isConnected } = useRealtimeNotifications();

  // Polling optimisé géré par RealtimeNotificationProvider (5s pour urgents, 10s pour normaux)
  const { data: incidents = [] } = useQuery({
    queryKey: ['collab-notif-incidents'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente' }, '-date_saisie', 100),
    refetchInterval: 10000, // 10 secondes (géré par le provider en temps réel)
    enabled: isConnected
  });

  const { data: incidentsUrgents = [] } = useQuery({
    queryKey: ['collab-notif-urgents'],
    queryFn: () => base44.entities.Incident.filter({ urgent: true, statut: 'en_attente' }, '-date_saisie', 50),
    refetchInterval: 5000, // 5 secondes pour les urgents (temps réel critique)
    enabled: isConnected
  });

  const { data: stockAlerts = [] } = useQuery({
    queryKey: ['collab-notif-stock'],
    queryFn: async () => {
      const stock = await base44.entities.Stock.list();
      return stock.filter(s => s.quantite <= s.seuil_alerte);
    },
    refetchInterval: 60000, // 60 secondes pour le stock
    enabled: isConnected
  });

  // Compter les urgences critiques (eau, gaz, électricité)
  const criticalIncidents = incidents.filter(i => {
    const categorie = i.categorie?.toLowerCase() || '';
    return ['eau', 'gaz', 'electricite', 'eau_plomberie'].includes(categorie);
  });
  
  const hasCritical = criticalIncidents.length > 0;
  const hasUrgent = incidentsUrgents.length > 0;

  const totalNotifications = incidents.length + stockAlerts.length;

  // Trier : 1️⃣ CRITIQUES (eau/gaz/élec), 2️⃣ urgents, 3️⃣ service (technique/ménage), 4️⃣ date
  const sortedIncidents = [...incidents].sort((a, b) => {
    // 1️⃣ Urgences CRITIQUES
    const categA = a.categorie?.toLowerCase() || '';
    const categB = b.categorie?.toLowerCase();
    const criticalCategories = ['eau', 'gaz', 'electricite', 'eau_plomberie'];
    const isCriticalA = criticalCategories.includes(categA);
    const isCriticalB = criticalCategories.includes(categB);
    
    if (isCriticalA && !isCriticalB) return -1;
    if (!isCriticalA && isCriticalB) return 1;
    
    // 2️⃣ Urgence
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    
    // 3️⃣ Service (technique avant ménage)
    if (a.type !== b.type) {
      return a.type === 'technique' ? -1 : 1;
    }
    
    // 4️⃣ Date d'émission (plus récent en premier)
    return new Date(b.date_saisie) - new Date(a.date_saisie);
  });



  const handleClick = () => {
    navigate(createPageUrl('Notifications'));
  };

  return (
    <div className="flex items-center gap-2">
      <RealtimeIndicator isConnected={isConnected} showPulse={hasUrgent || hasCritical} />
      
      <button
        onClick={handleClick}
        className="relative p-2 hover:bg-white/20 rounded-lg transition-colors"
        aria-label={`${totalNotifications} ${lang === 'fr' ? 'notifications' : 'notifications'}`}
      >
        <Bell 
          className={`w-6 h-6 ${
            hasCritical ? 'text-red-400 animate-pulse' :
            hasUrgent ? 'text-orange-300 animate-pulse' : 
            'text-white'
          }`} 
        />
        {totalNotifications > 0 && (
          <span 
            className={`absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full px-1.5 text-white shadow-lg ${
              hasCritical ? 'bg-red-600 animate-pulse' :
              hasUrgent ? 'bg-orange-500 animate-pulse' :
              'bg-[#00AEEF]'
            }`}
          >
            {totalNotifications > 99 ? '99+' : totalNotifications}
          </span>
        )}
      </button>
    </div>
  );
}