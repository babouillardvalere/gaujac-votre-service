import { base44 } from '@/api/base44Client';

/**
 * Calcule le statut agrégé d'une MissionDirection à partir de ses WorkItems
 * 
 * RÈGLE MÉTIER STRICTE :
 * - Si ≥ 1 WorkItem = EN_ATTENTE → Mission = EN_ATTENTE
 * - Sinon si ≥ 1 WorkItem = EN_COURS → Mission = EN_COURS
 * - Sinon si tous = A_FAIRE → Mission = A_FAIRE
 * - Sinon si tous = TERMINEE → Mission = TERMINEE
 * 
 * Priorité : EN_ATTENTE > EN_COURS > A_FAIRE > TERMINEE
 */
export async function recalcMissionStatus(missionId) {
  try {
    console.log(`[MissionStatusCalculator] Recalcul statut mission ${missionId}`);
    
    // 1. Récupérer tous les WorkItems de cette mission
    const workItems = await base44.entities.WorkItem.filter({
      mission_direction_id: missionId,
      type: 'MISSION_DIRECTION'
    });
    
    if (!workItems || workItems.length === 0) {
      console.warn(`[MissionStatusCalculator] Aucun WorkItem trouvé pour mission ${missionId}`);
      return 'A_FAIRE'; // Fallback par défaut
    }
    
    console.log(`[MissionStatusCalculator] ${workItems.length} WorkItems analysés :`, 
      workItems.map(w => `${w.service}: ${w.statut}`));
    
    // 2. Appliquer la règle de priorité
    const hasEnAttente = workItems.some(w => w.statut === 'EN_ATTENTE');
    const hasEnCours = workItems.some(w => w.statut === 'EN_COURS');
    const allAFaire = workItems.every(w => w.statut === 'A_FAIRE');
    const allTerminee = workItems.every(w => w.statut === 'TERMINEE');
    
    let nouveauStatut;
    
    if (hasEnAttente) {
      nouveauStatut = 'EN_ATTENTE';
    } else if (hasEnCours) {
      nouveauStatut = 'EN_COURS';
    } else if (allAFaire) {
      nouveauStatut = 'A_FAIRE';
    } else if (allTerminee) {
      nouveauStatut = 'TERMINEE';
    } else {
      // État mixte (ex: certains A_FAIRE, d'autres TERMINEE) → considéré EN_COURS
      nouveauStatut = 'EN_COURS';
    }
    
    console.log(`[MissionStatusCalculator] ✓ Statut calculé: ${nouveauStatut}`);
    
    // 3. Mettre à jour la MissionDirection
    await base44.entities.MissionDirection.update(missionId, {
      statut: nouveauStatut
    });
    
    console.log(`[MissionStatusCalculator] ✓ Mission ${missionId} mise à jour → ${nouveauStatut}`);
    
    return nouveauStatut;
    
  } catch (error) {
    console.error(`[MissionStatusCalculator] ❌ Erreur recalcul mission ${missionId}:`, error);
    throw error;
  }
}

/**
 * Vérifie si une mission peut être clôturée (tous WorkItems TERMINEE)
 */
export async function canCloseMission(missionId) {
  try {
    const workItems = await base44.entities.WorkItem.filter({
      mission_direction_id: missionId,
      type: 'MISSION_DIRECTION'
    });
    
    if (!workItems || workItems.length === 0) {
      return false;
    }
    
    const allTerminee = workItems.every(w => w.statut === 'TERMINEE');
    return allTerminee;
    
  } catch (error) {
    console.error('[MissionStatusCalculator] Erreur canCloseMission:', error);
    return false;
  }
}