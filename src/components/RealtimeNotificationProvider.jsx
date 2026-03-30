import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { pushNotificationService } from './notifications/PushNotificationService';

const RealtimeNotificationContext = createContext(null);

export const useRealtimeNotifications = () => {
  const context = useContext(RealtimeNotificationContext);
  if (!context) {
    throw new Error('useRealtimeNotifications must be used within RealtimeNotificationProvider');
  }
  return context;
};

// Intervals de polling par priorité (ralentis pour éviter le rate limit 429)
const POLLING_INTERVALS = {
  CRITICAL: 60000,   // 1 minute - incidents urgents
  HIGH: 90000,       // 1.5 minutes - nouveaux incidents, inventaires
  MEDIUM: 120000,    // 2 minutes - avis, tâches
  LOW: 180000        // 3 minutes - statistiques, rapports
};

export default function RealtimeNotificationProvider({ children, userRole = 'client' }) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const [lastNotificationCheck, setLastNotificationCheck] = useState(new Date());
  const [userEmail, setUserEmail] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const audioRef = useRef(null);
  const notificationSoundRef = useRef(null);

  // Charger l'email utilisateur et ses préférences
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await base44.auth.me();
        setUserEmail(user?.email);
        
        if (user?.email) {
          const prefs = await pushNotificationService.getPreferences(user.email);
          setUserPreferences(prefs);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      }
    };
    loadUserData();
  }, []);
  
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

  // Vérifier les interventions en retard
  const checkInterventionsRetard = useCallback(async () => {
    if (!userEmail || !userPreferences) return;

    try {
      const seuil = userPreferences.seuil_intervention_retard || 120;
      const dateLimit = new Date(Date.now() - seuil * 60 * 1000);

      const enRetard = await base44.entities.Incident.filter({
        statut: 'en_attente',
        pris_par: null,
        date_saisie: { $lte: dateLimit.toISOString() }
      }, '-date_saisie', 10);

      if (enRetard.length > 0 && userPreferences.interventions_urgentes) {
        enRetard.forEach(incident => {
          const minutesRetard = Math.floor((Date.now() - new Date(incident.date_saisie)) / 60000);
          pushNotificationService.notifyInterventionRetard(userEmail, incident, minutesRetard);
        });
        queryClient.invalidateQueries({ queryKey: ['incidents'] });
      }
    } catch (error) {
      console.error('Error checking delayed interventions:', error);
    }
  }, [userEmail, userPreferences, queryClient]);

  // Vérifier les nouveaux incidents urgents (CRITICAL)
  const checkUrgentIncidents = useCallback(async () => {
    if (!userEmail || !userPreferences) return;

    try {
      const urgentIncidents = await base44.entities.Incident.filter({
        statut: 'en_attente',
        urgent: true,
        created_date: { $gte: lastNotificationCheck.toISOString() }
      }, '-created_date', 5);

      if (urgentIncidents.length > 0 && userPreferences.interventions_urgentes) {
        urgentIncidents.forEach(incident => {
          pushNotificationService.notifyInterventionUrgente(userEmail, incident);
        });

        queryClient.invalidateQueries({ queryKey: ['incidents'] });
        queryClient.invalidateQueries({ queryKey: ['pending-incidents'] });
      }
    } catch (error) {
      console.error('Error checking urgent incidents:', error);
    }
  }, [userEmail, userPreferences, lastNotificationCheck, queryClient]);

  // Vérifier missions réactivées
  const checkMissionsReactivees = useCallback(async () => {
    if (!userEmail || !userPreferences) return;

    try {
      const recentMissions = await base44.entities.InterventionDirection.filter({
        statut: 'A_FAIRE',
        updated_date: { $gte: lastNotificationCheck.toISOString() }
      }, '-updated_date', 5);

      if (recentMissions.length > 0 && userPreferences.missions_reactivation) {
        recentMissions.forEach(mission => {
          if (mission.description?.includes('réactivée') || mission.description?.includes('matériel')) {
            pushNotificationService.notifyMissionReactivee(userEmail, mission);
          }
        });
        queryClient.invalidateQueries({ queryKey: ['interventions-direction'] });
      }
    } catch (error) {
      console.error('Error checking reactivated missions:', error);
    }
  }, [userEmail, userPreferences, lastNotificationCheck, queryClient]);

  // Vérifier les nouveaux incidents non-urgents (HIGH)
  const checkNewIncidents = useCallback(async () => {
    if (!userEmail || !userPreferences) return;

    try {
      const newIncidents = await base44.entities.Incident.filter({
        statut: 'en_attente',
        created_date: { $gte: lastNotificationCheck.toISOString() }
      }, '-created_date', 10);

      const nonUrgent = newIncidents.filter(inc => !inc.urgent);
      
      if (nonUrgent.length > 0 && userPreferences.interventions_nouvelles) {
        nonUrgent.forEach(incident => {
          pushNotificationService.notifyNouvelleIntervention(userEmail, incident);
        });

        queryClient.invalidateQueries({ queryKey: ['incidents'] });
      }
    } catch (error) {
      console.error('Error checking new incidents:', error);
    }
  }, [userEmail, userPreferences, lastNotificationCheck, queryClient]);

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

  // Polling pour incidents urgents et retards (CRITICAL - 5s)
  useEffect(() => {
    if (userRole === 'client' || !userEmail) return;

    const interval = setInterval(() => {
      checkUrgentIncidents();
      checkInterventionsRetard();
      setLastNotificationCheck(new Date());
    }, POLLING_INTERVALS.CRITICAL);

    return () => clearInterval(interval);
  }, [userRole, userEmail, checkUrgentIncidents, checkInterventionsRetard]);

  // Polling pour nouveaux incidents, inventaires et missions (HIGH - 10s)
  useEffect(() => {
    if (!userEmail) return;

    const interval = setInterval(() => {
      if (userRole !== 'client') {
        checkNewIncidents();
        checkNewInventories();
        checkMissionsReactivees();
      } else {
        checkResolvedIncidents();
      }
      setLastNotificationCheck(new Date());
    }, POLLING_INTERVALS.HIGH);

    return () => clearInterval(interval);
  }, [userRole, userEmail, checkNewIncidents, checkNewInventories, checkMissionsReactivees, checkResolvedIncidents]);

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
    checkInterventionsRetard();
    checkNewIncidents();
    checkMissionsReactivees();
    checkNewInventories();
    checkResolvedIncidents();
    checkNewReviews();
    setLastNotificationCheck(new Date());
  }, [checkUrgentIncidents, checkInterventionsRetard, checkNewIncidents, checkMissionsReactivees, checkNewInventories, checkResolvedIncidents, checkNewReviews]);

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