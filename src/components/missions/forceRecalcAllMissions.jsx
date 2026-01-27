import { base44 } from '@/api/base44Client';
import { recalcMissionStatus } from './missionStatusCalculator';

/**
 * Force le recalcul de TOUTES les missions Direction
 * À utiliser pour débloquer les incohérences de statut
 */
export async function forceRecalcAllMissions() {
  try {
    console.log('[ForceRecalc] 🔄 Démarrage recalcul global...');
    
    // 1. Récupérer toutes les missions
    const allMissions = await base44.entities.MissionDirection.list('-created_date', 500);
    console.log(`[ForceRecalc] 📊 ${allMissions.length} missions trouvées`);
    
    // 2. Récupérer TOUS les WorkItems en une seule fois
    const allWorkItems = await base44.entities.WorkItem.filter({ type: 'MISSION_DIRECTION' }, '-created_date', 1000);
    console.log(`[ForceRecalc] 📊 ${allWorkItems.length} WorkItems trouvés`);
    
    // 3. Grouper les WorkItems par mission_direction_id
    const workItemsByMission = {};
    allWorkItems.forEach(wi => {
      if (wi.mission_direction_id) {
        if (!workItemsByMission[wi.mission_direction_id]) {
          workItemsByMission[wi.mission_direction_id] = [];
        }
        workItemsByMission[wi.mission_direction_id].push(wi);
      }
    });
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    // 4. Pour chaque mission, forcer le recalcul
    for (const mission of allMissions) {
      try {
        const workItems = workItemsByMission[mission.id] || [];
        const hebergement = mission.zones?.[0]?.numero || mission.id.substring(0, 8);
        
        if (workItems.length === 0) {
          console.log(`[ForceRecalc] ⏭️ ${hebergement}: sans WorkItems`);
          skipped++;
          continue;
        }
        
        console.log(`[ForceRecalc] 📋 ${hebergement}: ${workItems.length} WorkItems`);
        workItems.forEach(w => console.log(`     ${w.service}: ${w.statut}`));
        
        // Analyser les WorkItems
        const statutsCount = {
          TERMINEE: workItems.filter(w => w.statut === 'TERMINEE').length,
          EN_COURS: workItems.filter(w => w.statut === 'EN_COURS').length,
          EN_ATTENTE: workItems.filter(w => w.statut === 'EN_ATTENTE').length,
          A_FAIRE: workItems.filter(w => w.statut === 'A_FAIRE').length
        };
        
        const allTerminee = workItems.every(w => w.statut === 'TERMINEE');
        
        let nouveauStatut;
        const updateData = {};
        
        // Déterminer le nouveau statut selon la règle de priorité
        if (statutsCount.EN_COURS > 0) {
          nouveauStatut = 'EN_COURS';
        } else if (statutsCount.EN_ATTENTE > 0) {
          nouveauStatut = 'EN_ATTENTE';
        } else if (statutsCount.A_FAIRE > 0) {
          nouveauStatut = 'A_FAIRE';
        } else if (allTerminee) {
          nouveauStatut = 'TERMINEE';
          // Débloquer complètement si passage à TERMINEE
          updateData.has_blocking = false;
          updateData.is_blocked_logistique = false;
          updateData.motif_attente = null;
          updateData.wait_reason = null;
          updateData.wait_comment = null;
        } else {
          nouveauStatut = 'A_FAIRE';
        }
        
        const oldStatus = mission.statut;
        
        // Forcer la mise à jour
        updateData.statut = nouveauStatut;
        
        if (oldStatus !== nouveauStatut) {
          await base44.entities.MissionDirection.update(mission.id, updateData);
          console.log(`[ForceRecalc] ✅ ${hebergement}: ${oldStatus} → ${nouveauStatut} (${JSON.stringify(statutsCount)})`);
          updated++;
        } else {
          // Même si le statut est identique, débloquer si tous terminés
          if (allTerminee && (mission.has_blocking === true || mission.is_blocked_logistique === true)) {
            await base44.entities.MissionDirection.update(mission.id, updateData);
            console.log(`[ForceRecalc] 🔓 ${hebergement}: déblocage (tous terminés)`);
            updated++;
          } else {
            console.log(`[ForceRecalc] ⏭️ ${hebergement}: déjà ${nouveauStatut}`);
            skipped++;
          }
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