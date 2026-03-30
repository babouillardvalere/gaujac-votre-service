import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Trash2, AlertTriangle, Wrench, Sparkles, Building2 } from 'lucide-react';
import { useTranslation } from './translations';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsPanelCollab({ service }) {
  const { t, lang } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('non_lu');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-collab', service, filter],
    queryFn: async () => {
      const query = { destinataire_role: service };
      if (filter !== 'tous') query.statut = filter;
      const notifs = await base44.entities.Notification.filter(query, '-created_date', 100);

      // Filtrer les notifications dont le WorkItem source n'existe plus
      const notifsWithWorkItem = notifs.filter(n => n.metadata?.workitem_id);
      const notifsWithoutWorkItem = notifs.filter(n => !n.metadata?.workitem_id);

      if (notifsWithWorkItem.length === 0) return notifsWithoutWorkItem;

      // Vérifier quels WorkItems existent encore
      const workItemIds = [...new Set(notifsWithWorkItem.map(n => n.metadata.workitem_id))];
      const existingIds = new Set();

      await Promise.all(
        workItemIds.map(async (wiId) => {
          try {
            const wi = await base44.entities.WorkItem.filter({ id: wiId }, '-created_date', 1);
            if (wi && wi.length > 0 && !wi[0].deleted_at) {
              existingIds.add(wiId);
            } else {
              // Supprimer silencieusement la notification orpheline
              const orphans = notifsWithWorkItem.filter(n => n.metadata?.workitem_id === wiId);
              await Promise.all(orphans.map(n => base44.entities.Notification.delete(n.id).catch(() => {})));
            }
          } catch {
            // En cas d'erreur, garder la notification
            existingIds.add(wiId);
          }
        })
      );

      const validNotifs = notifsWithWorkItem.filter(n => existingIds.has(n.metadata.workitem_id));
      return [...notifsWithoutWorkItem, ...validNotifs].sort(
        (a, b) => new Date(b.created_date) - new Date(a.created_date)
      );
    },
    refetchInterval: 30000
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { statut: 'lu' }),
    onSuccess: () => queryClient.invalidateQueries(['notifications-collab'])
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const promises = notifications
        .filter(n => n.statut === 'non_lu')
        .map(n => base44.entities.Notification.update(n.id, { statut: 'lu' }));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications-collab']);
      toast.success(lang === 'fr' ? 'Toutes les notifications marquées lues' : 'All notifications marked as read');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications-collab']);
      toast.success(lang === 'fr' ? 'Notification supprimée' : 'Notification deleted');
    }
  });

  const getIcon = (type) => {
    switch (type) {
      case 'INCIDENT_URGENT':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'NOUVEAU_INCIDENT':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'STOCK_ALERTE':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => n.statut === 'non_lu').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#00AEEF]/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {lang === 'fr' ? 'Notifications' : 'Notifications'}
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Tout marquer lu' : 'Mark all read'}
            </Button>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant={filter === 'non_lu' ? 'default' : 'outline'}
            onClick={() => setFilter('non_lu')}
          >
            {lang === 'fr' ? 'Non lues' : 'Unread'} ({notifications.filter(n => n.statut === 'non_lu').length})
          </Button>
          <Button
            size="sm"
            variant={filter === 'tous' ? 'default' : 'outline'}
            onClick={() => setFilter('tous')}
          >
            {lang === 'fr' ? 'Toutes' : 'All'} ({notifications.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {lang === 'fr' ? 'Aucune notification' : 'No notifications'}
          </p>
        ) : (
          <AnimatePresence>
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  notif.statut === 'non_lu'
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200'
                } ${notif.priorite === 'URGENTE' ? 'border-red-400 bg-red-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-gray-900 break-words">
                        {notif.titre}
                      </h4>
                      {notif.priorite === 'URGENTE' && (
                        <Badge className="bg-red-500 text-white text-xs whitespace-nowrap">
                          🔴 {lang === 'fr' ? 'URGENT' : 'URGENT'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-line break-words">
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notif.created_date).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {notif.statut === 'non_lu' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsReadMutation.mutate(notif.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <CheckCheck className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(notif.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}