/**
 * Système de batching pour les notifications
 * Évite la saturation en groupant les notifications similaires
 */

const BATCH_WINDOW = 5000; // 5 secondes de fenêtre pour grouper
const pendingNotifications = new Map(); // Map<type, Array<notification>>
let batchTimer = null;

/**
 * Catégories de priorité pour le tri
 */
export const PRIORITY_LEVELS = {
  CRITIQUE: 1,    // Eau, Gaz, Électricité
  URGENT: 2,      // Autres urgences signalées
  NORMALE: 3,     // Interventions standard
  BASSE: 4        // Stock, avis, etc.
};

/**
 * Détermine la priorité d'une notification
 */
export const getNotificationPriority = (notification) => {
  // Urgences critiques (eau, gaz, électricité)
  if (notification.metadata?.categorie) {
    const categorie = notification.metadata.categorie.toLowerCase();
    if (['eau', 'gaz', 'electricite', 'eau_plomberie'].includes(categorie)) {
      return PRIORITY_LEVELS.CRITIQUE;
    }
  }
  
  // Interventions urgentes
  if (notification.metadata?.urgent || notification.type === 'intervention_urgente') {
    return PRIORITY_LEVELS.URGENT;
  }
  
  // Interventions normales
  if (notification.type === 'nouvelle_intervention' || notification.type === 'intervention_creee') {
    return PRIORITY_LEVELS.NORMALE;
  }
  
  // Tout le reste (avis, stock, etc.)
  return PRIORITY_LEVELS.BASSE;
};

/**
 * Crée une clé de batching pour grouper les notifications similaires
 */
const getBatchKey = (notification) => {
  return `${notification.type}_${notification.metadata?.type || 'general'}`;
};

/**
 * Ajoute une notification au batch en attente
 */
export const addToBatch = (notification) => {
  const key = getBatchKey(notification);
  
  if (!pendingNotifications.has(key)) {
    pendingNotifications.set(key, []);
  }
  
  pendingNotifications.get(key).push({
    ...notification,
    priority: getNotificationPriority(notification),
    timestamp: Date.now()
  });
  
  // Démarrer le timer si pas déjà actif
  if (!batchTimer) {
    batchTimer = setTimeout(flushBatches, BATCH_WINDOW);
  }
};

/**
 * Fusionne les notifications groupées en une seule
 */
const mergeBatchedNotifications = (notifications) => {
  if (notifications.length === 1) {
    return notifications[0];
  }
  
  const first = notifications[0];
  const count = notifications.length;
  
  // Trier par priorité
  const sorted = notifications.sort((a, b) => a.priority - b.priority);
  const highestPriority = sorted[0].priority;
  
  // Compter les urgents
  const urgentCount = notifications.filter(n => n.priority <= PRIORITY_LEVELS.URGENT).length;
  
  let titre = '';
  let type = first.type;
  
  if (first.type === 'nouvelle_intervention' || first.type === 'intervention_creee') {
    if (urgentCount > 0) {
      titre = `🔴 ${urgentCount} intervention${urgentCount > 1 ? 's' : ''} urgente${urgentCount > 1 ? 's' : ''}`;
      type = 'intervention_urgente';
    }
    if (count > urgentCount) {
      const normalCount = count - urgentCount;
      titre += (titre ? ' + ' : '') + `${normalCount} intervention${normalCount > 1 ? 's' : ''}`;
    }
  } else {
    titre = `${count} notifications ${first.type}`;
  }
  
  return {
    ...first,
    titre,
    type,
    message: `Cliquez pour voir les ${count} demandes`,
    metadata: {
      ...first.metadata,
      batched: true,
      count,
      urgentCount,
      notifications: notifications.map(n => ({
        id: n.id,
        titre: n.titre,
        message: n.message,
        hebergement: n.hebergement,
        priority: n.priority
      }))
    }
  };
};

/**
 * Envoie tous les batchs en attente
 */
const flushBatches = async () => {
  if (pendingNotifications.size === 0) {
    batchTimer = null;
    return;
  }
  
  const batchesToSend = [];
  
  // Fusionner chaque batch
  for (const [key, notifications] of pendingNotifications.entries()) {
    if (notifications.length > 0) {
      const merged = mergeBatchedNotifications(notifications);
      batchesToSend.push(merged);
    }
  }
  
  // Vider les batchs
  pendingNotifications.clear();
  batchTimer = null;
  
  // Envoyer les notifications batchées
  // (sera géré par le système de notifications existant)
  if (window.__notificationCallbacks) {
    window.__notificationCallbacks.forEach(cb => cb(batchesToSend));
  }
  
  return batchesToSend;
};

/**
 * Force l'envoi immédiat de tous les batchs
 */
export const forceFlush = () => {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  return flushBatches();
};

/**
 * Enregistre un callback pour recevoir les notifications batchées
 */
export const onBatchedNotifications = (callback) => {
  if (!window.__notificationCallbacks) {
    window.__notificationCallbacks = [];
  }
  window.__notificationCallbacks.push(callback);
  
  // Retourne une fonction de nettoyage
  return () => {
    const index = window.__notificationCallbacks.indexOf(callback);
    if (index > -1) {
      window.__notificationCallbacks.splice(index, 1);
    }
  };
};