import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const translations = {
  fr: {
    notifications: 'Mes notifications',
    no_notifications: 'Aucune notification',
    mark_read: 'Marquer comme lu',
    new: 'Nouveau',
    statut_change: 'Mise à jour',
    intervention_resolue: 'Terminé',
    intervention_urgente: 'Urgent',
    just_now: 'À l\'instant',
    minutes_ago: 'il y a {n} min',
    hours_ago: 'il y a {n}h'
  },
  en: {
    notifications: 'My notifications',
    no_notifications: 'No notifications',
    mark_read: 'Mark as read',
    new: 'New',
    statut_change: 'Update',
    intervention_resolue: 'Completed',
    intervention_urgente: 'Urgent',
    just_now: 'Just now',
    minutes_ago: '{n} min ago',
    hours_ago: '{n}h ago'
  }
};

const typeIcons = {
  statut_change: Clock,
  intervention_resolue: Check,
  intervention_urgente: AlertTriangle
};

const typeColors = {
  statut_change: 'bg-blue-100 text-blue-600',
  intervention_resolue: 'bg-green-100 text-green-600',
  intervention_urgente: 'bg-red-100 text-red-600'
};

export default function ClientNotificationBell({ hebergement }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const lang = sessionStorage.getItem('user_language') || 'fr';
  const t = (key) => translations[lang]?.[key] || translations['fr'][key];
  const dateLocale = lang === 'en' ? enUS : fr;

  // Récupérer les notifications du client pour cet hébergement
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['client-notifications', hebergement],
    queryFn: async () => {
      if (!hebergement) return [];
      return base44.entities.Notification.filter({
        destinataire_type: 'client',
        hebergement: hebergement,
        archivee: false
      }, '-created_date', 20);
    },
    enabled: !!hebergement,
    refetchInterval: 15000
  });

  const unreadCount = notifications.filter(n => !n.lue).length;

  // Mutation pour marquer comme lu
  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { lue: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-notifications'] })
  });

  // Marquer toutes comme lues à l'ouverture
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      notifications.filter(n => !n.lue).forEach(n => {
        markReadMutation.mutate(n.id);
      });
    }
  }, [isOpen]);

  // Formater le temps relatif
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000 / 60);
    
    if (diff < 1) return t('just_now');
    if (diff < 60) return t('minutes_ago').replace('{n}', diff);
    if (diff < 1440) return t('hours_ago').replace('{n}', Math.floor(diff / 60));
    return format(new Date(date), 'dd/MM HH:mm', { locale: dateLocale });
  };

  if (!hebergement) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 rounded-full bg-white/20 hover:bg-white/30"
          aria-label={`${t('notifications')} ${unreadCount > 0 ? `(${unreadCount} ${t('new')})` : ''}`}
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-[#FFD700]' : 'text-[#0077A8]'}`} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center text-xs font-bold rounded-full px-1 bg-red-500 text-white"
            >
              {unreadCount}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-0 max-h-[400px] overflow-hidden">
        <div className="bg-[#00AEEF] text-white p-3">
          <span className="font-heading text-sm">{t('notifications')}</span>
        </div>

        <ScrollArea className="max-h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin w-5 h-5 border-2 border-[#00AEEF] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('no_notifications')}</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                const colorClass = typeColors[notification.type] || 'bg-gray-100 text-gray-600';

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 border-b border-gray-100 ${!notification.lue ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${!notification.lue ? 'text-[#0077A8]' : 'text-gray-700'}`}>
                          {notification.titre}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-400 mt-1 block">
                          {formatRelativeTime(notification.created_date)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}