/**
 * Gestion de la suppression en cascade pour interventions
 * Soft delete + blocage des orphelins
 */

import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { logDeletionCascade } from './interventionDeletionAudit';

/**
 * Supprimer une intervention en cascade (soft delete)
 * @param {string} interventionId - ID de l'intervention (Incident)
 * @param {string} userId - ID/email utilisateur (optionnel, 'SYSTEM' par défaut)
 * @returns {Promise<{ deletedIncident: number, deletedWorkItems: number }>}
 */
export const deleteInterventionCascade = async (interventionId, userId = 'SYSTEM') => {
  try {
    const now = new Date().toISOString();
    
    // 1️⃣ Soft delete l'incident principal
    await base44.entities.Incident.update(interventionId, {
      deleted_at: now
    });
    
    // 2️⃣ FIX: Trouver WorkItems liés par incident_id OU intervention_client_id
    const workItemsByIncident = await base44.entities.WorkItem.filter({
      incident_id: interventionId
    });
    
    const workItemsByIntervention = await base44.entities.WorkItem.filter({
      intervention_client_id: interventionId
    });
    
    // Fusionner et dédupliquer
    const allWorkItems = [...workItemsByIncident, ...workItemsByIntervention];
    const uniqueWorkItems = Array.from(new Map(allWorkItems.map(wi => [wi.id, wi])).values());
    
    const deletedWorkItemIds = [];
    for (const wi of uniqueWorkItems) {
      await base44.entities.WorkItem.update(wi.id, {
        deleted_at: now
      });
      deletedWorkItemIds.push(wi.id);
    }
    
    // 3️⃣ Logger l'action pour audit
    await logDeletionCascade(interventionId, deletedWorkItemIds, userId);
    
    console.log(`✅ Suppression cascade: 1 incident + ${deletedWorkItemIds.length} workitems (incident_id + intervention_client_id)`);
    
    return {
      deletedIncident: 1,
      deletedWorkItems: deletedWorkItemIds.length,
      workItemIds: deletedWorkItemIds,
      timestamp: now
    };
  } catch (error) {
    console.error('❌ Erreur suppression cascade:', error);
    throw error;
  }
};

/**
 * Récupérer les incidents/workitems ACTIFS UNIQUEMENT
 * À utiliser systématiquement côté services
 */
export const getActiveOnlyQuery = () => {
  // Retourner un objet qui sera passé à filter()
  // Note: Le backend appliquera deleted_at == null automatiquement
  // Pour maintenant, utiliser le filtrage côté client
  return {
    filterDeletedLocally: true // Signal au composant
  };
};

/**
 * Filtrer les éléments supprimés (côté client)
 */
export const filterActive = (items) => {
  return items.filter(item => !item.deleted_at);
};

/**
 * Vérifier si une intervention est supprimée
 */
export const isDeleted = (item) => {
  return !!item?.deleted_at;
};

/**
 * Récupérer un incident avec vérification d'existence
 */
export const getActiveIncident = async (incidentId) => {
  const incident = await base44.entities.Incident.filter({
    id: incidentId
  });
  
  if (!incident || incident.length === 0) {
    throw new Error('INCIDENT_NOT_FOUND');
  }
  
  const item = incident[0];
  if (item.deleted_at) {
    throw new Error('INCIDENT_DELETED');
  }
  
  return item;
};

/**
 * Bloquer la création de WorkItem si incident supprimé
 */
export const assertIncidentActive = async (incidentId) => {
  const incident = await getActiveIncident(incidentId);
  return incident;
};