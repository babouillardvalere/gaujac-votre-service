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
        // Si has_blocking=true MAIS qu'il n'y a plus de WorkItems EN_ATTENTE, débloquer
        if (mission.has_blocking === true || mission.is_blocked_logistique === true) {
          const workItems = await base44.entities.WorkItem.filter({
            mission_direction_id: mission.id,
            type: 'MISSION_DIRECTION'
          });
          
          // Si tous les WorkItems sont TERMINEE, débloquer
          const allTerminee = workItems.length > 0 && workItems.every(w => w.statut === 'TERMINEE');
          if (allTerminee) {
            console.log(`[ForceRecalc] 🔓 Déblocage mission ${mission.id} (${mission.zones?.[0]?.numero}) - tous WorkItems terminés`);
            await base44.entities.MissionDirection.update(mission.id, {
              has_blocking: false,
              is_blocked_logistique: false,
              statut: 'TERMINEE',
              motif_attente: null,
              wait_reason: null,
              wait_comment: null
            });
            updated++;
            continue;
          }
        }
        
        // Sinon, recalcul normal
        const oldStatus = mission.statut;
        const newStatus = await recalcMissionStatus(mission.id);
        
        if (oldStatus !== newStatus) {
          console.log(`[ForceRecalc] ✓ Mission ${mission.id} (${mission.zones?.[0]?.numero}): ${oldStatus} → ${newStatus}`);
          updated++;
        } else {
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