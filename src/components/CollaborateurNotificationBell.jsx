import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from './translations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const [open, setOpen] = useState(false);

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

  const handleIncidentClick = (incident) => {
    setOpen(false);
    if (incident.type === 'technique') {
      navigate(createPageUrl('Technique'));
    } else {
      navigate(createPageUrl('Menage'));
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label={`${totalNotifications} ${lang === 'fr' ? 'notifications' : 'notifications'}`}
        >
          <Bell className="w-6 h-6 text-white" />
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-red-500 text-white shadow-lg animate-pulse">
              {totalNotifications}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[600px] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white border-b p-4 z-10">
          <h3 className="font-heading text-lg text-[#0077A8]">
            🔔 {lang === 'fr' ? 'Notifications' : 'Notifications'} ({totalNotifications})
          </h3>
        </div>

        {totalNotifications === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-body text-sm">
              {lang === 'fr' ? 'Aucune notification' : 'No notifications'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {/* Alertes stock */}
            {stockAlerts.length > 0 && (
              <div className="mb-3">
                <div className="px-3 py-2 bg-red-50 rounded-lg">
                  <p className="text-xs font-heading text-red-600 mb-2">
                    📦 {stockAlerts.length} {lang === 'fr' ? 'alerte(s) stock' : 'stock alert(s)'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {stockAlerts.slice(0, 3).map(item => (
                      <Badge key={item.id} className="bg-red-500 text-white text-xs">
                        {item.nom_article}: {item.quantite}
                      </Badge>
                    ))}
                    {stockAlerts.length > 3 && (
                      <Badge className="bg-red-400 text-white text-xs">
                        +{stockAlerts.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Interventions */}
            {sortedIncidents.slice(0, 20).map((incident) => {
              const emoji = categoryEmojis[incident.categorie] || '❓';
              const typeEmoji = incident.type === 'technique' ? '🔧' : '🧹';
              const typeLabel = incident.type === 'technique' ? 'Technique' : 'Ménage';
              const locationLabel = incident.logement || incident.emplacement || 'N/A';
              const dateStr = incident.date_saisie && format(new Date(incident.date_saisie), 'HH:mm', { locale: fr });
              
              return (
                <Card
                  key={incident.id}
                  className={`border hover:shadow-md transition-all ${
                    incident.urgent 
                      ? 'border-red-400 bg-red-50' 
                      : 'border-gray-200 hover:border-[#00AEEF]'
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-lg">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {incident.urgent && (
                            <Badge className="bg-red-500 text-white text-xs h-4 font-medium">
                              <AlertTriangle className="w-2 h-2 mr-1" />
                              URGENT
                            </Badge>
                          )}
                          {incident.origine === 'arrivee' && (
                            <Badge className="bg-green-600 text-white text-xs h-4">🏡 Arrivée</Badge>
                          )}
                          {incident.origine === 'depart' && (
                            <Badge className="bg-orange-600 text-white text-xs h-4">🚗 Départ</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 font-body">
                          {typeEmoji} {typeLabel} – {incident.categorie} • {locationLabel} • {incident.client_prenom} {incident.client_nom} • {dateStr}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                          {incident.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleIncidentClick(incident)}
                      className="w-full px-3 py-1.5 bg-[#00AEEF] hover:bg-[#0077A8] text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                    >
                      📋 Voir la fiche
                    </button>
                  </CardContent>
                </Card>
              );
            })}

            {sortedIncidents.length > 20 && (
              <p className="text-center text-xs text-gray-400 py-2">
                +{sortedIncidents.length - 20} {lang === 'fr' ? 'autres' : 'more'}
              </p>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}