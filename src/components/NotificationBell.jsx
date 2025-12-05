import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from './translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Bell, Clock, AlertTriangle, Package, Check } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';
import NotificationCenter from './NotificationCenter';

const categoryEmojis = {
  gaz: '🔥', eau: '💧', electricite: '⚡', plomberie: '🔧',
  espace_vert: '🌿', divers_technique: '🛠', mobilier: '🧰', structurel: '🏚',
  souris: '🐭', guepes: '🐝', frelons: '🐝', fourmis: '🐜', moustiques: '🦟',
  literie: '🛏', nettoyage: '🧽', vaisselle: '🍽', poubelle: '🗑', produit_manquant: '🧴'
};

export default function NotificationBell({ showNotificationCenter = false }) {
  const { t } = useTranslation();
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [lastCount, setLastCount] = useState(0);

  // Si on veut afficher le NotificationCenter à la place
  if (showNotificationCenter) {
    return <NotificationCenter userType="collaborateur" />;
  }

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

  useEffect(() => {
    if (pendingCount > lastCount && lastCount > 0) {
      setHasNewNotification(true);
      setTimeout(() => setHasNewNotification(false), 3000);
    }
    setLastCount(pendingCount);
  }, [pendingCount]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative w-12 h-12 rounded-xl bg-white/20 hover:bg-white/30 border-2 border-white/40 ${hasNewNotification ? 'animate-bounce' : ''}`}
        >
          <Bell className={`w-7 h-7 ${totalAlerts > 0 ? 'text-[#FFD700]' : 'text-white'}`} />
          {totalAlerts > 0 && (
            <span className={`absolute -top-2 -right-2 min-w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full px-1.5 shadow-lg border-2 border-white ${
              urgentCount > 0 || stockAlerts.some(s => s.quantite === 0) ? 'bg-red-500 text-white animate-pulse' : 'bg-[#FFD700] text-[#0077A8]'
            }`}>
              {totalAlerts}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 max-h-[500px] overflow-y-auto">
        <div className="bg-[#00AEEF] text-white p-3 rounded-t-xl">
          <div className="flex items-center justify-between">
            <span className="font-heading">{t('notifications')}</span>
            <Badge className="bg-white/20 text-white">
              {totalAlerts} {t('alertes')}
            </Badge>
          </div>
        </div>

        {stockAlerts.length > 0 && (
          <div className="p-2 bg-red-50 border-b">
            <p className="text-xs font-heading text-red-600 mb-1">🧰 {t('alertes_stock_label')}</p>
            <div className="flex flex-wrap gap-1">
              {stockAlerts.slice(0, 5).map(s => (
                <Badge key={s.id} className={`text-xs ${s.quantite === 0 ? 'bg-red-500' : 'bg-[#FFA500]'} text-white`}>
                  {s.nom_article}: {s.quantite}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {materielDemandes.length > 0 && (
          <div className="p-2 bg-orange-50 border-b">
            <p className="text-xs font-heading text-orange-600">📦 {materielDemandes.length} {t('demandes_materiel')}</p>
          </div>
        )}
        
        <div className="divide-y">
          {incidents.slice(0, 10).map((incident) => (
            <div key={incident.id} className={`p-3 hover:bg-gray-50 ${incident.urgent ? 'bg-red-50' : ''}`}>
              <div className="flex items-start gap-2">
                <span className="text-xl">{categoryEmojis[incident.categorie]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-sm text-[#0077A8]">
                      {incident.logement || incident.emplacement}
                    </span>
                    {incident.urgent && (
                      <Badge className="bg-red-500 text-white text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {t('urgent_label')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">{incident.description}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-2 border-t bg-gray-50">
          <Link to={createPageUrl('Bureau')}>
            <Button variant="ghost" size="sm" className="w-full text-[#00AEEF] font-heading">
              {t('historique')} →
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}