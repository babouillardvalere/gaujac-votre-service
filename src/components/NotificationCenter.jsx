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
  Archive,
  Trash2,
  AlertTriangle,
  Wrench,
  Sparkles,
  MessageSquare,
  Clock,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotificationPriority, PRIORITY_LEVELS } from './notificationBatching';

const translations = {
  fr: {
    notifications: 'Notifications',
    no_notifications: 'Aucune notification',
    mark_read: 'Marquer comme lu',
    mark_all_read: 'Tout marquer comme lu',
    archive: 'Archiver',
    delete: 'Supprimer',
    new: 'Nouveau',
    view_all: 'Voir tout',
    clear_all: 'Effacer tout',
    statut_change: 'Changement de statut',
    nouvelle_intervention: 'Nouvelle intervention',
    intervention_assignee: 'Intervention assignée',
    intervention_resolue: 'Intervention résolue',
    intervention_urgente: 'Intervention urgente',
    materiel_recu: 'Matériel reçu',
    avis_recu: 'Avis reçu',
    just_now: 'À l\'instant',
    minutes_ago: 'il y a {n} min',
    hours_ago: 'il y a {n}h',
    archived: 'Archivées',
    active: 'Actives'
  },
  en: {
    notifications: 'Notifications',
    no_notifications: 'No notifications',
    mark_read: 'Mark as read',
    mark_all_read: 'Mark all as read',
    archive: 'Archive',
    delete: 'Delete',
    new: 'New',
    view_all: 'View all',
    clear_all: 'Clear all',
    statut_change: 'Status change',
    nouvelle_intervention: 'New intervention',
    intervention_assignee: 'Assigned intervention',
    intervention_resolue: 'Resolved intervention',
    intervention_urgente: 'Urgent intervention',
    materiel_recu: 'Equipment received',
    avis_recu: 'Review received',
    just_now: 'Just now',
    minutes_ago: '{n} min ago',
    hours_ago: '{n}h ago',
    archived: 'Archived',
    active: 'Active'
  }
};

const typeIcons = {
  statut_change: Clock,
  nouvelle_intervention: Wrench,
  intervention_assignee: Wrench,
  intervention_resolue: Check,
  intervention_urgente: AlertTriangle,
  materiel_recu: Sparkles,
  avis_recu: MessageSquare
};

const typeColors = {
  statut_change: 'bg-blue-100 text-blue-600',
  nouvelle_intervention: 'bg-[#00AEEF]/10 text-[#00AEEF]',
  intervention_assignee: 'bg-purple-100 text-purple-600',
  intervention_resolue: 'bg-green-100 text-green-600',
  intervention_urgente: 'bg-red-100 text-red-600',
  materiel_recu: 'bg-orange-100 text-orange-600',
  avis_recu: 'bg-yellow-100 text-yellow-600'
};

export default function NotificationCenter({ userType = 'collaborateur', userIdentifier = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();
  
  const lang = sessionStorage.getItem('user_language') || 'fr';
  const t = (key) => translations[lang]?.[key] || translations['fr'][key];
  const dateLocale = lang === 'en' ? enUS : fr;

  // Récupérer les notifications - polling à 30s
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userType, userIdentifier, showArchived],
    queryFn: async () => {
      const filter = {
        destinataire_type: userType,
        archivee: showArchived
      };
      if (userIdentifier) {
        filter.destinataire_email = userIdentifier;
      }
      const notifs = await base44.entities.Notification.filter(filter, '-created_date', 50);
      
      // Trier par priorité (urgences critiques en haut)
      return notifs.sort((a, b) => {
        const priorityA = getNotificationPriority(a);
        const priorityB = getNotificationPriority(b);
        if (priorityA !== priorityB) return priorityA - priorityB;
        // Si même priorité, trier par date (plus récent en premier)
        return new Date(b.created_date) - new Date(a.created_date);
      });
    },
    refetchInterval: 30000 // 30 secondes au lieu de 10
  });

  const unreadCount = notifications.filter(n => !n.lue).length;

  // Mutation pour marquer comme lu
  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { lue: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  // Mutation pour archiver
  const archiveMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { archivee: true, lue: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  // Mutation pour supprimer
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  // Marquer toutes comme lues
  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.lue);
    await Promise.all(unread.map(n => markReadMutation.mutateAsync(n.id)));
  };

  // Formater le temps relatif
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000 / 60);
    
    if (diff < 1) return t('just_now');
    if (diff < 60) return t('minutes_ago').replace('{n}', diff);
    if (diff < 1440) return t('hours_ago').replace('{n}', Math.floor(diff / 60));
    return format(new Date(date), 'dd/MM HH:mm', { locale: dateLocale });
  };

  const NotificationItem = ({ notification }) => {
    const Icon = typeIcons[notification.type] || Bell;
    const colorClass = typeColors[notification.type] || 'bg-gray-100 text-gray-600';
    const priority = getNotificationPriority(notification);
    const isCritical = priority === PRIORITY_LEVELS.CRITIQUE;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
          !notification.lue ? 'bg-blue-50/50' : ''
        } ${isCritical ? 'border-l-4 border-red-500' : ''}`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-medium truncate ${!notification.lue ? 'text-[#0077A8]' : 'text-gray-700'}`}>
                {notification.titre}
              </p>
              {!notification.lue && (
                <span className="w-2 h-2 rounded-full bg-[#00AEEF] flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {formatRelativeTime(notification.created_date)}
              </span>
              <div className="flex items-center gap-1">
                {!notification.lue && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(notification.id); }}
                    className="p-1 hover:bg-gray-200 rounded"
                    aria-label={t('mark_read')}
                  >
                    <Check className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); archiveMutation.mutate(notification.id); }}
                  className="p-1 hover:bg-gray-200 rounded"
                  aria-label={t('archive')}
                >
                  <Archive className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notification.id); }}
                  className="p-1 hover:bg-red-100 rounded"
                  aria-label={t('delete')}
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-12 h-12 rounded-xl bg-white/20 hover:bg-white/30 border-2 border-white/40"
          aria-label={`${t('notifications')} ${unreadCount > 0 ? `(${unreadCount} ${t('new')})` : ''}`}
        >
          <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-[#FFD700]' : 'text-white'}`} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full px-1 bg-red-500 text-white shadow-lg"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 max-h-[500px] overflow-hidden">
        {/* Header */}
        <div className="bg-[#00AEEF] text-white p-3 flex items-center justify-between">
          <span className="font-heading">{t('notifications')}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`text-xs px-2 py-1 rounded ${showArchived ? 'bg-white/30' : 'bg-white/10'}`}
            >
              {showArchived ? t('active') : t('archived')}
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 flex items-center gap-1"
                aria-label={t('mark_all_read')}
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Liste des notifications */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-[#00AEEF] border-t-transparent rounded-full mx-auto mb-2" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('no_notifications')}</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Fonction utilitaire pour créer des notifications
export const createNotification = async ({
  destinataireType,
  destinataireEmail = null,
  type,
  titre,
  message,
  incidentId = null,
  hebergement = null,
  metadata = {}
}) => {
  return base44.entities.Notification.create({
    destinataire_type: destinataireType,
    destinataire_email: destinataireEmail,
    type,
    titre,
    message,
    incident_id: incidentId,
    hebergement,
    lue: false,
    archivee: false,
    metadata
  });
};

// Notifications prédéfinies
export const notifyStatusChange = async (incident, newStatus, lang = 'fr') => {
  const statusLabels = {
    fr: { en_attente: 'En attente', en_cours: 'En cours', en_attente_materiel: 'Reporté', resolu: 'Résolu' },
    en: { en_attente: 'Pending', en_cours: 'In progress', en_attente_materiel: 'On hold', resolu: 'Resolved' }
  };
  
  const titles = {
    fr: 'Mise à jour de votre intervention',
    en: 'Intervention status update'
  };
  
  const messages = {
    fr: `Votre intervention pour ${incident.logement || incident.emplacement} est maintenant : ${statusLabels.fr[newStatus]}`,
    en: `Your intervention for ${incident.logement || incident.emplacement} is now: ${statusLabels.en[newStatus]}`
  };

  return createNotification({
    destinataireType: 'client',
    type: 'statut_change',
    titre: titles[lang],
    message: messages[lang],
    incidentId: incident.id,
    hebergement: incident.logement || incident.emplacement
  });
};

export const notifyNewIntervention = async (incident, lang = 'fr') => {
  const titles = {
    fr: incident.urgent ? '🚨 Nouvelle intervention URGENTE' : 'Nouvelle intervention',
    en: incident.urgent ? '🚨 New URGENT intervention' : 'New intervention'
  };
  
  const messages = {
    fr: `${incident.categorie} - ${incident.logement || incident.emplacement}`,
    en: `${incident.categorie} - ${incident.logement || incident.emplacement}`
  };

  return createNotification({
    destinataireType: 'collaborateur',
    type: incident.urgent ? 'intervention_urgente' : 'nouvelle_intervention',
    titre: titles[lang],
    message: messages[lang],
    incidentId: incident.id,
    hebergement: incident.logement || incident.emplacement
  });
};

export const notifyInterventionAssigned = async (incident, collaborateur, lang = 'fr') => {
  const titles = {
    fr: 'Intervention assignée',
    en: 'Intervention assigned'
  };
  
  const messages = {
    fr: `${collaborateur} a pris en charge l'intervention ${incident.logement || incident.emplacement}`,
    en: `${collaborateur} has taken over intervention ${incident.logement || incident.emplacement}`
  };

  return createNotification({
    destinataireType: 'collaborateur',
    type: 'intervention_assignee',
    titre: titles[lang],
    message: messages[lang],
    incidentId: incident.id,
    hebergement: incident.logement || incident.emplacement,
    metadata: { collaborateur }
  });
};

export const notifyInterventionResolved = async (incident, lang = 'fr') => {
  const titles = {
    fr: '✅ Intervention terminée',
    en: '✅ Intervention completed'
  };
  
  const messages = {
    fr: `Votre demande pour ${incident.logement || incident.emplacement} a été résolue. N'hésitez pas à donner votre avis !`,
    en: `Your request for ${incident.logement || incident.emplacement} has been resolved. Feel free to leave a review!`
  };

  return createNotification({
    destinataireType: 'client',
    type: 'intervention_resolue',
    titre: titles[lang],
    message: messages[lang],
    incidentId: incident.id,
    hebergement: incident.logement || incident.emplacement
  });
};