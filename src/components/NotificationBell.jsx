import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Bell, AlertTriangle, Clock, Home, Wrench, Sparkles, Bug } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';

const categoryEmojis = {
  gaz: '🔥', eau: '💧', electricite: '⚡', plomberie: '🔧',
  espace_vert: '🌿', divers_technique: '🛠', mobilier: '🧰', structurel: '🏚',
  souris: '🐭', guepes: '🐝', frelons: '🐝', fourmis: '🐜', moustiques: '🦟',
  literie: '🛏', nettoyage: '🧽', vaisselle: '🍽', poubelle: '🗑', produit_manquant: '🧴'
};

export default function NotificationBell() {
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  const { data: incidents = [] } = useQuery({
    queryKey: ['notifications-incidents'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente' }, '-date_saisie', 50),
    refetchInterval: 10000
  });

  const { data: stockAlerts = [] } = useQuery({
    queryKey: ['notifications-stock'],
    queryFn: async () => {
      const stock = await base44.entities.Stock.list();
      return stock.filter(s => s.quantite <= s.seuil_alerte);
    },
    refetchInterval: 30000
  });

  const { data: materielDemandes = [] } = useQuery({
    queryKey: ['notifications-materiel'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente_materiel', attente_materiel: true }, '-attente_date', 20),
    refetchInterval: 15000
  });

  const pendingCount = incidents.length;
  const urgentCount = incidents.filter(i => i.urgent).length;
  const totalAlerts = pendingCount + stockAlerts.length + materielDemandes.length;

  // Détecter nouvelles notifications
  useEffect(() => {
    if (pendingCount > lastCount && lastCount > 0) {
      setHasNewNotification(true);
      setTimeout(() => setHasNewNotification(false), 3000);
    }
    setLastCount(pendingCount);
  }, [pendingCount, lastCount]);

  const getTypeIcon = (type) => {
    if (type === 'technique') return <Wrench className="w-4 h-4 text-[#00AEEF]" />;
    return <Sparkles className="w-4 h-4 text-[#FFD700]" />;
  };

  const getTargetPage = (incident) => {
    return incident.type === 'technique' ? 'Technique' : 'Menage';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-white/20 transition-colors">
          <AnimatePresence>
            {hasNewNotification && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                exit={{ scale: 0 }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="absolute inset-0 bg-[#FFA500]/30 rounded-lg"
              />
            )}
          </AnimatePresence>
          
          <Bell className={`w-6 h-6 ${hasNewNotification ? 'animate-pulse' : ''}`} />
          
          {totalAlerts > 0 && (
            <span className={`absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full px-1 ${
              urgentCount > 0 || stockAlerts.some(s => s.quantite === 0) ? 'bg-red-500 text-white animate-pulse' : 'bg-[#FFA500] text-white'
            }`}>
              {totalAlerts}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0 rounded-xl border-2 border-[#00AEEF]/30 shadow-xl"
      >
        <div className="bg-[#00AEEF] text-white p-3 rounded-t-xl">
          <div className="flex items-center justify-between">
            <span className="font-heading">Notifications</span>
            <Badge className="bg-white/20 text-white">
              {totalAlerts} alerte(s)
            </Badge>
          </div>
        </div>

        {/* Alertes Stock */}
        {stockAlerts.length > 0 && (
          <div className="p-2 bg-red-50 border-b">
            <p className="text-xs font-heading text-red-600 mb-1">🧰 Alertes stock</p>
            <div className="flex flex-wrap gap-1">
              {stockAlerts.slice(0, 5).map(s => (
                <Badge key={s.id} className={`text-xs ${s.quantite === 0 ? 'bg-red-500' : 'bg-[#FFA500]'} text-white`}>
                  {s.nom_article}: {s.quantite}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Demandes matériel */}
        {materielDemandes.length > 0 && (
          <div className="p-2 bg-orange-50 border-b">
            <p className="text-xs font-heading text-orange-600">📦 {materielDemandes.length} demande(s) matériel</p>
          </div>
        )}

        <ScrollArea className="h-[350px]">
          {incidents.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-body text-gray-500">Aucune intervention en attente</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {incidents.map((incident) => (
                <Link
                  key={incident.id}
                  to={createPageUrl(getTargetPage(incident))}
                  className={`block p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                    incident.urgent 
                      ? 'bg-red-50 border-red-300 hover:border-red-500' 
                      : 'bg-white border-gray-200 hover:border-[#00AEEF]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      incident.urgent ? 'bg-red-100' : 'bg-[#e6f7ff]'
                    }`}>
                      <span className="text-xl">
                        {categoryEmojis[incident.categorie] || '❓'}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(incident.type)}
                        <span className="font-heading text-sm text-[#0077A8]">
                          {incident.logement || incident.emplacement}
                        </span>
                        {incident.urgent && (
                          <Badge className="bg-red-500 text-white text-xs px-1 py-0">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            URGENT
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs font-body text-gray-600 truncate">
                        {incident.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {incident.date_saisie && format(new Date(incident.date_saisie), 'HH:mm', { locale: fr })}
                        <span>•</span>
                        <span>{incident.client_prenom} {incident.client_nom}</span>
                      </div>

                      {incident.sous_categorie && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {incident.sous_categorie.split(', ').slice(0, 3).map(cat => (
                            <span key={cat} className="text-lg">
                              {categoryEmojis[cat] || ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t bg-gray-50 rounded-b-xl">
          <Link to={createPageUrl('Bureau')}>
            <Button variant="ghost" className="w-full text-[#00AEEF] font-heading text-sm">
              Voir tout l'historique
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}