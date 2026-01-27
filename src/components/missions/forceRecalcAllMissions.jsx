import { base44 } from '@/api/base44Client';
import { recalcMissionStatus } from './missionStatusCalculator';

/**
 * Force le recalcul de TOUTES les missions Direction
 * À utiliser pour débloquer les incohérences de statut
 */
export async function forceRecalcAllMissions() {
  try {
    console.log('[ForceRecalc] Démarrage recalcul global...');
    
    // 1. Récupérer toutes les missions
    const allMissions = await base44.entities.MissionDirection.list('-created_date', 500);
    console.log(`[ForceRecalc] ${allMissions.length} missions trouvées`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // 2. Pour chaque mission, forcer le recalcul
    for (const mission of allMissions) {
      try {
        // Récupérer WorkItems
        const workItems = await base44.entities.WorkItem.filter({
          mission_direction_id: mission.id,
          type: 'MISSION_DIRECTION'
        });
        
        if (workItems.length === 0) {
          console.log(`[ForceRecalc] ⏭️ Mission ${mission.id} sans WorkItems`);
          skipped++;
          continue;
        }
        
        console.log(`[ForceRecalc] 📋 Mission ${mission.id} (${mission.zones?.[0]?.numero}): ${workItems.length} WorkItems`);
        workItems.forEach(w => console.log(`  - ${w.service}: ${w.statut}`));
        
        // Analyser les WorkItems
        const allTerminee = workItems.every(w => w.statut === 'TERMINEE');
        const hasEnCours = workItems.some(w => w.statut === 'EN_COURS');
        const hasEnAttente = workItems.some(w => w.statut === 'EN_ATTENTE');
        const hasAFaire = workItems.some(w => w.statut === 'A_FAIRE');
        
        let nouveauStatut;
        const updateData = {};
        
        // Déterminer le nouveau statut
        if (hasEnCours) {
          nouveauStatut = 'EN_COURS';
        } else if (hasEnAttente) {
          nouveauStatut = 'EN_ATTENTE';
        } else if (hasAFaire) {
          nouveauStatut = 'A_FAIRE';
        } else if (allTerminee) {
          nouveauStatut = 'TERMINEE';
          // Débloquer si passage à TERMINEE
          updateData.has_blocking = false;
          updateData.is_blocked_logistique = false;
          updateData.motif_attente = null;
          updateData.wait_reason = null;
          updateData.wait_comment = null;
        } else {
          nouveauStatut = 'A_FAIRE';
        }
        
        const oldStatus = mission.statut;
        
        // Forcer la mise à jour si différent OU si bloqué alors que tous terminés
        const needsUpdate = (oldStatus !== nouveauStatut) || 
                           (allTerminee && (mission.has_blocking === true || mission.is_blocked_logistique === true));
        
        if (needsUpdate) {
          updateData.statut = nouveauStatut;
          await base44.entities.MissionDirection.update(mission.id, updateData);
          console.log(`[ForceRecalc] ✅ Mission ${mission.id} (${mission.zones?.[0]?.numero}): ${oldStatus} → ${nouveauStatut}`);
          updated++;
        } else {
          console.log(`[ForceRecalc] ⏭️ Mission ${mission.id} (${mission.zones?.[0]?.numero}): déjà ${nouveauStatut}`);
          skipped++;
        }
        
      } catch (error) {
        console.error(`[ForceRecalc] ❌ Erreur mission ${mission.id}:`, error);
        errors++;
      }
    }
    
    console.log(`[ForceRecalc] ✅ Terminé: ${updated} mises à jour, ${skipped} inchangées, ${errors} erreurs`);
    
    return {
      success: true,
      total: allMissions.length,
      updated,
      skipped,
      errors
    };
    
  } catch (error) {
    console.error('[ForceRecalc] ❌ Erreur globale:', error);
    return {
      success: false,
      error: error.message
    };
  }
}