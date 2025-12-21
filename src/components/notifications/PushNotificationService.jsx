import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Service centralisé de notifications push
class PushNotificationService {
  constructor() {
    this.audioRef = null;
    this.initSound();
  }

  initSound() {
    this.audioRef = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMnBSx+zPDZiToIGGS57OihUQwNU6jj8LJoHwU2jtTx0HwvBSh1xfDhkz0KFF203+ynVhALRJzf8L9vIgU0iPDfkz0KFF203+ynVhALRJzf8L9vIgU0iPDfkz0KFF203+ynVhALRJzf8L9vIgU0iPDfkz0KFF203+ynVhALRJzf8L9vIgU0');
  }

  playSound() {
    if (this.audioRef) {
      this.audioRef.currentTime = 0;
      this.audioRef.volume = 0.3;
      this.audioRef.play().catch(() => {});
    }
  }

  showBrowserNotification(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6930cc5060a27d8dfd0bf5fd/aa24decb4_logo.png',
        badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6930cc5060a27d8dfd0bf5fd/aa24decb4_logo.png',
        vibrate: [200, 100, 200],
        requireInteraction: options.critical || false,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        if (options.onClick) options.onClick();
        notification.close();
      };

      setTimeout(() => notification.close(), options.duration || 10000);
    }
  }

  async getPreferences(userEmail) {
    const prefs = await base44.entities.NotificationPreference.filter({ user_email: userEmail });
    return prefs[0] || {
      interventions_urgentes: true,
      interventions_nouvelles: true,
      missions_reactivation: true,
      litiges_signales: true,
      stock_alerte: true,
      commandes_recues: true,
      sound_enabled: true,
      browser_notifications: true,
      email_notifications: false,
      services_surveilles: ['TOUS']
    };
  }

  async shouldNotify(userEmail, eventType) {
    const prefs = await this.getPreferences(userEmail);
    return prefs[eventType] !== false;
  }

  async notify({ userEmail, eventType, titre, message, metadata = {}, critical = false, toastOptions = {} }) {
    const prefs = await this.getPreferences(userEmail);

    // Vérifier si l'utilisateur veut ce type de notification
    if (prefs[eventType] === false) return;

    // Vérifier filtres services
    if (metadata.service && !prefs.services_surveilles.includes('TOUS')) {
      if (!prefs.services_surveilles.includes(metadata.service)) return;
    }

    // Créer notification en base
    await base44.entities.Notification.create({
      destinataire_email: userEmail,
      destinataire_type: 'collaborateur',
      type: eventType,
      titre,
      message,
      lue: false,
      archivee: false,
      priorite: critical ? 'critique' : 'normale',
      metadata
    });

    // Son
    if (prefs.sound_enabled) {
      this.playSound();
    }

    // Notification navigateur
    if (prefs.browser_notifications) {
      this.showBrowserNotification(titre, message, {
        critical,
        onClick: toastOptions.onClick
      });
    }

    // Toast in-app
    const toastFn = critical ? toast.error : (toastOptions.type === 'success' ? toast.success : toast.info);
    toastFn(titre, {
      description: message,
      duration: critical ? 15000 : 6000,
      ...toastOptions
    });

    // Email si activé
    if (prefs.email_notifications) {
      try {
        await base44.integrations.Core.SendEmail({
          to: userEmail,
          subject: `🔔 ${titre}`,
          body: `${message}\n\n---\nCamping Paradis - Notification automatique`
        });
      } catch (error) {
        console.error('Erreur envoi email notification:', error);
      }
    }
  }

  // Notifier intervention urgente
  async notifyInterventionUrgente(userEmail, incident) {
    await this.notify({
      userEmail,
      eventType: 'interventions_urgentes',
      titre: '🚨 INTERVENTION URGENTE',
      message: `${incident.client_nom} - ${incident.logement || incident.emplacement} - ${incident.categorie}`,
      metadata: {
        incident_id: incident.id,
        service: incident.type?.toUpperCase(),
        categorie: incident.categorie
      },
      critical: true,
      toastOptions: {
        action: {
          label: 'Voir',
          onClick: () => window.location.href = `/technique`
        }
      }
    });
  }

  // Notifier nouvelle intervention
  async notifyNouvelleIntervention(userEmail, incident) {
    await this.notify({
      userEmail,
      eventType: 'interventions_nouvelles',
      titre: '📋 Nouvelle intervention',
      message: `${incident.client_nom} - ${incident.logement || incident.emplacement}`,
      metadata: {
        incident_id: incident.id,
        service: incident.type?.toUpperCase()
      }
    });
  }

  // Notifier mission réactivée
  async notifyMissionReactivee(userEmail, mission) {
    await this.notify({
      userEmail,
      eventType: 'missions_reactivation',
      titre: '🔁 Mission réactivée',
      message: `${mission.type_hebergement} - ${mission.numero_hebergement} - Matériel disponible`,
      metadata: {
        mission_id: mission.id,
        service: mission.service
      },
      toastOptions: {
        type: 'success',
        action: {
          label: 'Voir',
          onClick: () => window.location.href = `/direction-interventions`
        }
      }
    });
  }

  // Notifier litige
  async notifyLitige(userEmail, incident) {
    await this.notify({
      userEmail,
      eventType: 'litiges_signales',
      titre: '⚠️ Litige signalé',
      message: `Intervention ${incident.logement || incident.emplacement} - Attention requise`,
      metadata: {
        incident_id: incident.id
      },
      critical: true
    });
  }

  // Notifier commande reçue
  async notifyCommandeRecue(userEmail, commande) {
    await this.notify({
      userEmail,
      eventType: 'commandes_recues',
      titre: '📦 Commande reçue',
      message: `${commande.articles?.length || 0} article(s) - ${commande.type_hebergement}`,
      metadata: {
        commande_id: commande.id,
        mission_id: commande.mission_id
      },
      toastOptions: {
        type: 'success'
      }
    });
  }

  // Notifier stock critique
  async notifyStockCritique(userEmail, article, quantite, seuil) {
    await this.notify({
      userEmail,
      eventType: 'stock_alerte',
      titre: '📉 Stock critique',
      message: `${article}: ${quantite} unités restantes (seuil: ${seuil})`,
      metadata: {
        article,
        quantite
      },
      critical: quantite === 0,
      toastOptions: {
        action: {
          label: 'Voir stock',
          onClick: () => window.location.href = `/materiel`
        }
      }
    });
  }

  // Notifier intervention en retard
  async notifyInterventionRetard(userEmail, incident, minutesRetard) {
    await this.notify({
      userEmail,
      eventType: 'interventions_urgentes',
      titre: '⏰ Intervention en retard',
      message: `${incident.logement || incident.emplacement} - ${minutesRetard} min sans prise en charge`,
      metadata: {
        incident_id: incident.id,
        retard_minutes: minutesRetard
      },
      critical: true
    });
  }
}

export const pushNotificationService = new PushNotificationService();

// Hook pour utiliser le service
export const usePushNotifications = () => {
  return pushNotificationService;
};