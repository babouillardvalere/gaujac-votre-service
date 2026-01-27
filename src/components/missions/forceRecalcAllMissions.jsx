import { base44 } from '@/api/base44Client';
import { recalcMissionStatus } from './missionStatusCalculator';

/**
 * Force le recalcul de TOUTES les missions Direction
 * À utiliser pour débloquer les incohérences de statut
 */
export async function forceRecalcAllMissions() {
  try {
    console.log('[ForceRecalc] 🚀 DÉMARRAGE RECALCUL GLOBAL FORCÉ...');
    console.log('[ForceRecalc] ⚠️ CE RECALCUL VA FORCER LA MISE À JOUR DE TOUTES LES MISSIONS');

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

    console.log(`[ForceRecalc] 📋 Missions avec WorkItems: ${Object.keys(workItemsByMission).length}`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let missionsDETAILS = [];

    // 4. Pour chaque mission, forcer le recalcul IMMÉDIAT
    for (const mission of allMissions) {
      try {
        const workItems = workItemsByMission[mission.id] || [];
        const hebergement = mission.zones?.[0]?.numero || mission.id.substring(0, 8);

        if (workItems.length === 0) {
          console.log(`[ForceRecalc] ⏭️ ${hebergement}: sans WorkItems`);
          skipped++;
          continue;
        }

        console.log(`\n[ForceRecalc] 🔍 ${hebergement} (mission ${mission.id.substring(0, 8)})`);
        console.log(`  Statut actuel mission: ${mission.statut}`);
        console.log(`  WorkItems (${workItems.length}):`);
        workItems.forEach(w => {
          console.log(`    - ${w.service}: ${w.statut} (${w.id.substring(0, 8)})`);
        });

        // CALCUL STRICT du nouveau statut
        const nbTerminee = workItems.filter(w => w.statut === 'TERMINEE').length;
        const nbEnCours = workItems.filter(w => w.statut === 'EN_COURS').length;
        const nbEnAttente = workItems.filter(w => w.statut === 'EN_ATTENTE').length;
        const nbAFaire = workItems.filter(w => w.statut === 'A_FAIRE').length;

        console.log(`  Distribution: TERMINEE(${nbTerminee}) EN_COURS(${nbEnCours}) EN_ATTENTE(${nbEnAttente}) A_FAIRE(${nbAFaire})`);

        let nouveauStatut;

        // RÈGLE STRICTE: priorité absolue
        if (nbEnCours > 0) {
          nouveauStatut = 'EN_COURS';
          console.log(`  ➜ EN_COURS car ${nbEnCours} WorkItem(s) en cours`);
        } else if (nbEnAttente > 0) {
          nouveauStatut = 'EN_ATTENTE';
          console.log(`  ➜ EN_ATTENTE car ${nbEnAttente} WorkItem(s) en attente`);
        } else if (nbAFaire > 0) {
          nouveauStatut = 'A_FAIRE';
          console.log(`  ➜ A_FAIRE car ${nbAFaire} WorkItem(s) à faire`);
        } else if (nbTerminee === workItems.length && workItems.length > 0) {
          nouveauStatut = 'TERMINEE';
          console.log(`  ➜ TERMINEE car tous (${nbTerminee}) terminés`);
        } else {
          nouveauStatut = 'A_FAIRE';
          console.log(`  ➜ A_FAIRE par défaut`);
        }

        // Préparer la mise à jour FORCÉE
        const updateData = { statut: nouveauStatut };

        // Débloquer si terminé
        if (nouveauStatut === 'TERMINEE') {
          updateData.has_blocking = false;
          updateData.is_blocked_logistique = false;
          updateData.motif_attente = null;
          updateData.wait_reason = null;
          updateData.wait_comment = null;
        }

        // FORCER la mise à jour BDD avec timestamp pour déclencher les subscriptions
        updateData._forceUpdate = new Date().toISOString();

        await base44.entities.MissionDirection.update(mission.id, updateData);

        if (mission.statut !== nouveauStatut) {
          console.log(`  ✅ CHANGEMENT: ${mission.statut} ➜ ${nouveauStatut}`);
          missionsDETAILS.push(`${hebergement}: ${mission.statut} → ${nouveauStatut}`);
          updated++;
        } else {
          console.log(`  ♻️ CONFIRMÉ: ${nouveauStatut}`);
          updated++;
        }

        } catch (error) {
        console.error(`[ForceRecalc] ❌ Erreur mission ${mission.id}:`, error);
        errors++;
        }
        }

    console.log('\n[ForceRecalc] 📊 RÉSUMÉ DES CHANGEMENTS:');
    if (missionsDETAILS.length > 0) {
      missionsDETAILS.forEach(detail => console.log(`  - ${detail}`));
    } else {
      console.log('  ℹ️ Aucun changement détecté');
    }
    
    console.log(`\n[ForceRecalc] ✅ Terminé: ${updated} mises à jour, ${skipped} inchangées, ${errors} erreurs\n`);
    
    return {
      success: true,
      total: allMissions.length,
      updated,
      skipped,
      errors,
      changes: missionsDETAILS
    };
    
  } catch (error) {
    console.error('[ForceRecalc] ❌ Erreur globale:', error);
    return {
      success: false,
      error: error.message
    };
  }
}