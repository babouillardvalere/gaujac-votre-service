import { base44 } from '@/api/base44Client';

/**
 * 🔒 LOGGER CENTRALISÉ - TIMELINE UNIQUE CHRONOLOGIQUE
 * 
 * RÈGLE ABSOLUE: Ne JAMAIS appeler base44.entities.SuiviEvent.create() directement depuis l'UI
 * Toujours passer par logSuiviEvent() appelé depuis les hooks WorkItem
 */

/**
 * Détecte l'origine d'un WorkItem
 * @param {Object} workItem
 * @returns {string} 'INVENTAIRE_ARRIVEE' | 'SEJOUR' | 'MISSION_DIRECTION'
 */
function detectOrigine(workItem) {
  if (workItem.fiche_arrivee_id) return 'INVENTAIRE_ARRIVEE';
  if (workItem.fiche_depart_id) return 'INVENTAIRE_DEPART';
  if (workItem.mission_direction_id) return 'MISSION_DIRECTION';
  if (workItem.incident_id) return 'SEJOUR';
  return 'SEJOUR'; // Par défaut
}

/**
 * Génère le message lisible automatiquement
 * @param {Object} workItem
 * @param {string} service
 * @param {string} action
 * @param {Object} metadata
 * @returns {string} Message formaté
 */
function generateMessage(workItem, service, action, metadata = {}) {
  const hebergement = workItem.hebergement || 'N/A';
  
  switch(action) {
    case 'CREATION':
      const firstLine = workItem.description_operationnelle?.split('\n')[0] || workItem.titre || 'Intervention';
      return `Intervention créée - ${workItem.service} - ${firstLine}`;
    
    case 'PRISE_EN_CHARGE':
      return `${service} a pris en charge l'intervention`;
    
    case 'ARRIVEE_SUR_SITE':
      return `${service} est arrivé sur site (${hebergement})`;
    
    case 'EN_COURS':
      return `${service} a démarré l'intervention`;
    
    case 'MISE_EN_ATTENTE':
      const raison = metadata.raison_attente || metadata.motif_attente || 'Raison non spécifiée';
      return `${service} a mis en attente - ${raison}`;
    
    case 'REPRISE':
      return `${service} a repris l'intervention`;
    
    case 'TERMINEE':
      const duree = metadata.duree_intervention_minutes || metadata.duree_minutes;
      return duree 
        ? `${service} a terminé l'intervention (${duree} min)`
        : `${service} a terminé l'intervention`;
    
    case 'ANNULEE':
      const motif = metadata.motif_annulation || 'Motif non spécifié';
      return `${service} a annulé l'intervention - ${motif}`;
    
    default:
      return `${service} - ${action}`;
  }
}

/**
 * 🔒 MÉTHODE UNIQUE POUR LOGGER UN ÉVÉNEMENT DE SUIVI
 * 
 * NE PAS APPELER DEPUIS L'UI - Uniquement depuis hooks WorkItem
 * 
 * @param {string} workItemId - ID du WorkItem
 * @param {string} service - Service concerné
 * @param {string} action - Action effectuée
 * @param {string|null} collaborateur - Nom du collaborateur (null pour SYSTEM)
 * @param {Object} metadata - Données contextuelles
 * @returns {Promise<Object>} SuiviEvent créé
 */
export async function logSuiviEvent(workItemId, service, action, collaborateur = null, metadata = {}) {
  try {
    // Récupérer le WorkItem pour construire le message
    const workItem = await base44.entities.WorkItem.get(workItemId);
    
    const message = generateMessage(workItem, service, action, metadata);
    const origine = detectOrigine(workItem);
    const reference_id = workItem.stay_id || workItem.fiche_arrivee_id || workItem.fiche_depart_id || workItem.mission_direction_id;
    
    const event = await base44.entities.SuiviEvent.create({
      workitem_id: workItemId,
      origine,
      reference_id,
      service,
      action,
      message,
      timestamp: new Date().toISOString(),
      collaborateur,
      metadata
    });
    
    console.log('✅ SuiviEvent créé:', action, 'pour WorkItem', workItemId);
    return event;
    
  } catch (error) {
    console.error('❌ Erreur création SuiviEvent:', error);
    // Ne pas bloquer le workflow si le logging échoue
    return null;
  }
}

/**
 * Hook automatique appelé après création WorkItem
 * @param {Object} workItem - WorkItem créé
 */
export async function onWorkItemCreated(workItem) {
  await logSuiviEvent(
    workItem.id,
    'SYSTEM',
    'CREATION',
    null,
    {
      hebergement: workItem.hebergement,
      priorite: workItem.priorite,
      type: workItem.type
    }
  );
}

/**
 * Hook automatique appelé après mise à jour statut WorkItem
 * @param {Object} workItem - WorkItem mis à jour
 * @param {string} oldStatut - Ancien statut
 * @param {string} newStatut - Nouveau statut
 */
export async function onWorkItemStatusChanged(workItem, oldStatut, newStatut) {
  // Mapper les transitions de statut vers les actions
  let action = null;
  
  if (oldStatut === 'A_FAIRE' && newStatut === 'EN_COURS') {
    action = 'PRISE_EN_CHARGE';
  } else if (newStatut === 'EN_ATTENTE') {
    action = 'MISE_EN_ATTENTE';
  } else if (oldStatut === 'EN_ATTENTE' && newStatut === 'EN_COURS') {
    action = 'REPRISE';
  } else if (newStatut === 'TERMINEE') {
    action = 'TERMINEE';
  } else if (newStatut === 'ANNULEE') {
    action = 'ANNULEE';
  }
  
  if (action) {
    await logSuiviEvent(
      workItem.id,
      workItem.service,
      action,
      workItem.collaborateur || workItem.pris_en_charge_par,
      workItem.metadata || {}
    );
  }
}

/**
 * Récupère la timeline complète d'un WorkItem
 * @param {string} workItemId
 * @returns {Promise<Array>} Événements triés par timestamp DESC
 */
export async function getWorkItemTimeline(workItemId) {
  const events = await base44.entities.SuiviEvent.filter(
    { workitem_id: workItemId },
    '-timestamp'
  );
  return events;
}

/**
 * Récupère la timeline globale d'un séjour/arrivée
 * @param {string} referenceId - stay_id ou fiche_arrivee_id
 * @returns {Promise<Array>} Événements triés par timestamp DESC
 */
export async function getReferenceTimeline(referenceId) {
  const events = await base44.entities.SuiviEvent.filter(
    { reference_id: referenceId },
    '-timestamp'
  );
  return events;
}

export default {
  logSuiviEvent,
  onWorkItemCreated,
  onWorkItemStatusChanged,
  getWorkItemTimeline,
  getReferenceTimeline
};