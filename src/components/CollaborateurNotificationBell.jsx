import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from './translations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { Bell, Wrench, Sparkles, Package, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

  const { data: incidents = [] } = useQuery({
    queryKey: ['collab-notif-incidents'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente' }, '-date_saisie', 100),
    refetchInterval: 10000
  });

  const { data: incidentsUrgents = [] } = useQuery({
    queryKey: ['collab-notif-urgents'],
    queryFn: () => base44.entities.Incident.filter({ urgent: true, statut: 'en_attente' }, '-date_saisie', 50),
    refetchInterval: 10000
  });

  const { data: stockAlerts = [] } = useQuery({
    queryKey: ['collab-notif-stock'],
    queryFn: async () => {
      const stock = await base44.entities.Stock.list();
      return stock.filter(s => s.quantite <= s.seuil_alerte);
    },
    refetchInterval: 30000
  });

  const totalNotifications = incidents.length + stockAlerts.length;

  // Trier : 1️⃣ urgents, 2️⃣ service (technique/ménage), 3️⃣ date
  const sortedIncidents = [...incidents].sort((a, b) => {
    // 1️⃣ Urgence
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    
    // 2️⃣ Service (technique avant ménage)
    if (a.type !== b.type) {
      return a.type === 'technique' ? -1 : 1;
    }
    
    // 3️⃣ Date d'émission (plus récent en premier)
    return new Date(b.date_saisie) - new Date(a.date_saisie);
  });



  const handleClick = () => {
    navigate(createPageUrl('Notifications'));
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 hover:bg-white/20 rounded-lg transition-colors"
      aria-label={`${totalNotifications} ${lang === 'fr' ? 'notifications' : 'notifications'}`}
    >
      <Bell className="w-6 h-6 text-white" />
      <span className={`absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-red-500 text-white shadow-lg ${totalNotifications > 0 ? 'animate-pulse' : ''}`}>
        {totalNotifications}
      </span>
    </button>
  );
}