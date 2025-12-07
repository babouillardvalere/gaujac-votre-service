import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const RealtimeNotificationContext = createContext(null);

export const useRealtimeNotifications = () => {
  const context = useContext(RealtimeNotificationContext);
  if (!context) {
    throw new Error('useRealtimeNotifications must be used within RealtimeNotificationProvider');
  }
  return context;
};

// Intervals de polling par priorité
const POLLING_INTERVALS = {
  CRITICAL: 5000,    // 5 secondes - incidents urgents, alertes critiques
  HIGH: 10000,       // 10 secondes - nouveaux incidents, inventaires
  MEDIUM: 30000,     // 30 secondes - avis, tâches
  LOW: 60000         // 1 minute - statistiques, rapports
};

export default function RealtimeNotificationProvider({ children, userRole = 'client' }) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const [lastNotificationCheck, setLastNotificationCheck] = useState(new Date());
  const audioRef = useRef(null);
  const notificationSoundRef = useRef(null);
  
  // Initialiser les sons de notification
  useEffect(() => {
    notificationSoundRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMnBSx+zPDZiToIGGS57OihUQwNU6jj8LJoHwU2jtTx0HwvBSh1xfDhkz0KFF203+ynVhALRJzf8L9vIgU0iPDfkz0KFF203+ynVhALRJzf8L9vIgU0iPDfkz0KFF203+ynVhALRJzf8L9vIgU0iPDfkz0KFF203+ynVhALRJzf8L9vIgU0');
    audioRef.current = notificationSoundRef.current;
  }, []);

  // Demander la permission pour les notifications navigateur
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Jouer un son de notification
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Afficher une notification navigateur
  const showBrowserNotification = useCallback((title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-fermer après 10 secondes
      setTimeout(() => notification.close(), 10000);
    }
  }, []);

  // Vérifier les nouveaux incidents urgents (CRITICAL)
  const checkUrgentIncidents = useCallback(async () => {
    try {
      const urgentIncidents = await base44.entities.Incident.list('-created_date', 5, {
        statut: 'en_attente',
        urgent: true,
        created_date: { $gte: lastNotificationCheck.toISOString() }
      });

      if (urgentIncidents.length > 0) {
        playNotificationSound();
        
        urgentIncidents.forEach(incident => {
          const title = `🚨 INCIDENT URGENT`;
          const body = `${incident.client_nom} - ${incident.logement || incident.emplacement}\n${incident.categorie}`;
          
          showBrowserNotification(title, { body, tag: `urgent-${incident.id}`, requireInteraction: true });
          
          toast.error(title, {
            description: body,
            duration: 10000,
            action: {
              label: 'Voir',
              onClick: () => window.location.href = `/intervention/${incident.id}`
            }
          });
        });

        // Invalider les requêtes pour rafraîchir les listes
        queryClient.invalidateQueries({ queryKey: ['incidents'] });
        queryClient.invalidateQueries({ queryKey: ['pending-incidents'] });
      }
    } catch (error) {
      console.error('Error checking urgent incidents:', error);
    }
  }, [lastNotificationCheck, playNotificationSound, showBrowserNotification, queryClient]);

  // Vérifier les nouveaux incidents non-urgents (HIGH)
  const checkNewIncidents = useCallback(async () => {
    try {
      const newIncidents = await base44.entities.Incident.list('-created_date', 10, {
        statut: 'en_attente',
        created_date: { $gte: lastNotificationCheck.toISOString() }
      });

      const nonUrgent = newIncidents.filter(inc => !inc.urgent);
      
      if (nonUrgent.length > 0) {
        const title = `📋 ${nonUrgent.length} nouveau(x) incident(s)`;
        
        toast.info(title, {
          description: `${nonUrgent[0].client_nom} - ${nonUrgent[0].logement || nonUrgent[0].emplacement}`,
          duration: 5000
        });

        queryClient.invalidateQueries({ queryKey: ['incidents'] });
      }
    } catch (error) {
      console.error('Error checking new incidents:', error);
    }
  }, [lastNotificationCheck, queryClient]);

  // Vérifier les inventaires soumis (HIGH)
  const checkNewInventories = useCallback(async () => {
    try {
      const newInventories = await base44.entities.FicheArrivee.list('-created_date', 5, {
        created_date: { $gte: lastNotificationCheck.toISOString() }
      });

      if (newInventories.length > 0 && userRole === 'reception') {
        const title = `📝 ${newInventories.length} inventaire(s) arrivée`;
        
        toast.success(title, {
          description: `${newInventories[0].client_prenom} ${newInventories[0].client_nom}`,
          duration: 5000
        });

        queryClient.invalidateQueries({ queryKey: ['fiches-arrivee'] });
      }
    } catch (error) {
      console.error('Error checking inventories:', error);
    }
  }, [lastNotificationCheck, userRole, queryClient]);

  // Vérifier les avis clients (MEDIUM)
  const checkNewReviews = useCallback(async () => {
    try {
      const newReviews = await base44.entities.Avis.list('-created_date', 3, {
        created_date: { $gte: lastNotificationCheck.toISOString() }
      });

      if (newReviews.length > 0 && userRole === 'reception') {
        const avgNote = (newReviews.reduce((sum, r) => sum + (r.note_globale || 0), 0) / newReviews.length).toFixed(1);
        
        toast.info(`⭐ ${newReviews.length} nouvel(aux) avis`, {
          description: `Note moyenne: ${avgNote}/5`,
          duration: 4000
        });

        queryClient.invalidateQueries({ queryKey: ['avis'] });
      }
    } catch (error) {
      console.error('Error checking reviews:', error);
    }
  }, [lastNotificationCheck, userRole, queryClient]);

  // Vérifier les interventions résolues pour le client (HIGH)
  const checkResolvedIncidents = useCallback(async () => {
    if (userRole !== 'client') return;

    try {
      const resolved = await base44.entities.Incident.list('-date_resolution', 5, {
        statut: 'resolu',
        date_resolution: { $gte: lastNotificationCheck.toISOString() }
      });

      if (resolved.length > 0) {
        playNotificationSound();
        
        resolved.forEach(incident => {
          const title = `✅ Intervention terminée`;
          const body = `${incident.categorie} - ${incident.logement || incident.emplacement}`;
          
          showBrowserNotification(title, { body, tag: `resolved-${incident.id}` });
          
          toast.success(title, {
            description: body,
            duration: 8000,
            action: {
              label: 'Donner un avis',
              onClick: () => window.location.href = `/avis/${incident.id}`
            }
          });
        });

        queryClient.invalidateQueries({ queryKey: ['incidents'] });
      }
    } catch (error) {
      console.error('Error checking resolved incidents:', error);
    }
  }, [userRole, lastNotificationCheck, playNotificationSound, showBrowserNotification, queryClient]);

  // Polling pour incidents urgents (CRITICAL - 5s)
  useEffect(() => {
    if (userRole === 'client') return;

    const interval = setInterval(() => {
      checkUrgentIncidents();
      setLastNotificationCheck(new Date());
    }, POLLING_INTERVALS.CRITICAL);

    return () => clearInterval(interval);
  }, [userRole, checkUrgentIncidents]);

  // Polling pour nouveaux incidents et inventaires (HIGH - 10s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (userRole !== 'client') {
        checkNewIncidents();
        checkNewInventories();
      } else {
        checkResolvedIncidents();
      }
      setLastNotificationCheck(new Date());
    }, POLLING_INTERVALS.HIGH);

    return () => clearInterval(interval);
  }, [userRole, checkNewIncidents, checkNewInventories, checkResolvedIncidents]);

  // Polling pour avis (MEDIUM - 30s)
  useEffect(() => {
    if (userRole === 'client') return;

    const interval = setInterval(() => {
      checkNewReviews();
      setLastNotificationCheck(new Date());
    }, POLLING_INTERVALS.MEDIUM);

    return () => clearInterval(interval);
  }, [userRole, checkNewReviews]);

  // Détecter la perte de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      toast.success('✅ Connexion rétablie');
      // Rafraîchir toutes les données
      queryClient.invalidateQueries();
    };

    const handleOffline = () => {
      setIsConnected(false);
      toast.error('❌ Connexion perdue - Mode hors-ligne', { duration: Infinity });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  // Méthode pour forcer un refresh immédiat
  const refreshNow = useCallback(() => {
    checkUrgentIncidents();
    checkNewIncidents();
    checkNewInventories();
    checkResolvedIncidents();
    checkNewReviews();
    setLastNotificationCheck(new Date());
  }, [checkUrgentIncidents, checkNewIncidents, checkNewInventories, checkResolvedIncidents, checkNewReviews]);

  const value = {
    isConnected,
    refreshNow,
    playNotificationSound,
    showBrowserNotification
  };

  return (
    <RealtimeNotificationContext.Provider value={value}>
      {children}
      
      {/* Indicateur de connexion */}
      {!isConnected && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Mode hors-ligne
        </div>
      )}
    </RealtimeNotificationContext.Provider>
  );
}