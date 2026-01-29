import { base44 } from '@/api/base44Client';
import { recomputeMissionRollup } from './missions/recomputeMissionRollup';

/**
 * 🔒 WRAPPER CENTRALISÉ - UPDATE WORKITEM AVEC HOOKS AUTOMATIQUES
 * 
 * Utiliser cette fonction au lieu de base44.entities.WorkItem.update()
 * pour garantir l'exécution des hooks de timeline + recalcul rollups
 */

/**
 * Met à jour un WorkItem et déclenche automatiquement les hooks
 * @param {string} workItemId - ID du WorkItem
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<Object>} WorkItem mis à jour
 */
export async function updateWorkItem(workItemId, updates) {
  // Récupérer l'état actuel pour comparer les statuts
  const currentWorkItem = await base44.entities.WorkItem.get(workItemId);
  const oldStatut = currentWorkItem.statut;
  
  // Exécuter la mise à jour
  const updatedWorkItem = await base44.entities.WorkItem.update(workItemId, updates);
  const newStatut = updatedWorkItem.statut;
  
  // Hook automatique: Logger si le statut a changé
  if (oldStatut !== newStatut) {
    try {
      const { onWorkItemStatusChanged } = await import('./suiviEventLogger');
      await onWorkItemStatusChanged(updatedWorkItem, oldStatut, newStatut);
    } catch (error) {
      console.warn('⚠️ Hook SuiviEvent non exécuté:', error.message);
    }
  }
  
  // ⭐ HOOK AUTOMATIQUE: Recalculer les rollups de la mission liée
  if (updatedWorkItem.mission_direction_id) {
    try {
      await recomputeMissionRollup(updatedWorkItem.mission_direction_id);
    } catch (error) {
      console.warn('⚠️ Recalcul rollup mission échoué:', error.message);
    }
  }
  
  return updatedWorkItem;
}

/**
 * Prise en charge d'un WorkItem (A_FAIRE → EN_COURS)
 * @param {string} workItemId
 * @param {string} collaborateur - Nom du collaborateur
 * @returns {Promise<Object>}
 */
export async function takeChargeWorkItem(workItemId, collaborateur) {
  return updateWorkItem(workItemId, {
    statut: 'EN_COURS',
    collaborateur,
    pris_en_charge_par: collaborateur,
    date_prise_en_charge: new Date().toISOString()
  });
}

/**
 * Terminer un WorkItem
 * @param {string} workItemId
 * @param {Object} completionData - Données de clôture (durée, commentaire, etc.)
 * @returns {Promise<Object>}
 */
export async function completeWorkItem(workItemId, completionData = {}) {
  return updateWorkItem(workItemId, {
    statut: 'TERMINEE',
    date_terminee: new Date().toISOString(),
    ...completionData
  });
}

/**
 * Mettre en attente un WorkItem
 * @param {string} workItemId
 * @param {Object} attenteData - Raison, motif, délai
 * @returns {Promise<Object>}
 */
export async function pauseWorkItem(workItemId, attenteData) {
  return updateWorkItem(workItemId, {
    statut: 'EN_ATTENTE',
    metadata: {
      ...attenteData,
      date_mise_en_attente: new Date().toISOString()
    }
  });
}

/**
 * Reprendre un WorkItem en attente
 * @param {string} workItemId
 * @returns {Promise<Object>}
 */
export async function resumeWorkItem(workItemId) {
  return updateWorkItem(workItemId, {
    statut: 'EN_COURS'
  });
}

export default {
  updateWorkItem,
  takeChargeWorkItem,
  completeWorkItem,
  pauseWorkItem,
  resumeWorkItem
};