import { base44 } from '@/api/base44Client';

/**
 * 🔒 CALCUL DU STATUT GLOBAL - RÈGLE STRICTE NON NÉGOCIABLE
 * 
 * VERROU ABSOLU : Si has_blocking = true → EN_ATTENTE (IMMUTABLE)
 * 
 * Priorité :
 * 1. has_blocking = true → EN_ATTENTE
 * 2. Au moins 1 WorkItem EN_COURS → EN_COURS
 * 3. Au moins 1 WorkItem A_FAIRE → A_FAIRE
 * 4. Tous TERMINEE → TERMINEE
 * 
 * ⚠️ INTERDICTION ABSOLUE DE SORTIR DE EN_ATTENTE SANS ACTION EXPLICITE SERVICE
 */
export async function recalcMissionStatus(missionId) {
  try {
    console.log(`[MissionStatusCalculator] Recalcul statut mission ${missionId}`);
    
    // 0. Récupérer la mission
    const mission = await base44.entities.MissionDirection.filter({ id: missionId });
    if (!mission || mission.length === 0) {
      console.warn(`[MissionStatusCalculator] Mission ${missionId} introuvable`);
      return 'A_FAIRE';
    }
    
    const missionData = mission[0];
    
    // 🔒 RÈGLE ABSOLUE : has_blocking = true → EN_ATTENTE (AUCUN RECALCUL)
    if (missionData.has_blocking === true) {
      console.warn(`[MissionStatusCalculator] 🔒 VERROU ACTIF - Mission ${missionId} EN_ATTENTE (motif: ${missionData.motif_attente || missionData.wait_reason})`);
      return 'EN_ATTENTE';
    }
    
    // Rétrocompatibilité is_blocked_logistique
    if (missionData.is_blocked_logistique === true) {
      console.warn(`[MissionStatusCalculator] 🔒 VERROU LEGACY - Mission ${missionId} EN_ATTENTE`);
      return 'EN_ATTENTE';
    }
    
    // Si la mission est TERMINEE, ne jamais recalculer
    if (missionData.statut === 'TERMINEE') {
      console.warn(`[MissionStatusCalculator] ✅ Mission TERMINEE - statut verrouillé`, missionId);
      return 'TERMINEE';
    }
    
    // 1. Récupérer tous les WorkItems de cette mission
    const workItems = await base44.entities.WorkItem.filter({
      mission_direction_id: missionId,
      type: 'MISSION_DIRECTION'
    });
    
    if (!workItems || workItems.length === 0) {
      console.warn(`[MissionStatusCalculator] Aucun WorkItem trouvé pour mission ${missionId}`);
      return 'A_FAIRE';
    }
    
    console.log(`[MissionStatusCalculator] ${workItems.length} WorkItems analysés :`, 
      workItems.map(w => `${w.service}: ${w.statut}`));
    
    // 2. Appliquer la règle de priorité
    const hasEnCours = workItems.some(w => w.statut === 'EN_COURS');
    const allTerminee = workItems.every(w => w.statut === 'TERMINEE');
    const hasAFaire = workItems.some(w => w.statut === 'A_FAIRE');
    
    let nouveauStatut;
    
    if (hasEnCours) {
      nouveauStatut = 'EN_COURS';
    } else if (hasAFaire) {
      nouveauStatut = 'A_FAIRE';
    } else if (allTerminee) {
      nouveauStatut = 'TERMINEE';
    } else {
      nouveauStatut = 'A_FAIRE';
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

/**
 * Active le blocage logistique sur une mission (passage EN_ATTENTE persistant)
 */
export async function blockMissionLogistique(missionId) {
  try {
    await base44.entities.MissionDirection.update(missionId, {
      is_blocked_logistique: true,
      statut: 'EN_ATTENTE'
    });
    console.log(`[MissionStatusCalculator] ✓ Mission ${missionId} bloquée logistiquement`);
  } catch (error) {
    console.error('[MissionStatusCalculator] Erreur blockMissionLogistique:', error);
    throw error;
  }
}

/**
 * Débloque une mission (autoriser reprise par le service)
 */
export async function unblockMissionLogistique(missionId) {
  try {
    await base44.entities.MissionDirection.update(missionId, {
      is_blocked_logistique: false,
      statut: 'EN_COURS'
    });
    console.log(`[MissionStatusCalculator] ✓ Mission ${missionId} débloquée - reprise autorisée`);
  } catch (error) {
    console.error('[MissionStatusCalculator] Erreur unblockMissionLogistique:', error);
    throw error;
  }
}