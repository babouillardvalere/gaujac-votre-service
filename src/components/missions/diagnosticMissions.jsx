import { base44 } from '@/api/base44Client';

/**
 * DIAGNOSTIC - Vérifie l'état de synchronisation des missions
 * Retourne un rapport détaillé des incohérences
 */
export async function diagnosticMissions() {
  console.log('\n[DIAGNOSTIC] 🔍 DÉMARRAGE ANALYSE...\n');
  
  try {
    // Récupérer toutes les missions et WorkItems
    const missions = await base44.entities.MissionDirection.list('-created_date', 500);
    const workItems = await base44.entities.WorkItem.filter({ type: 'MISSION_DIRECTION' }, '-created_date', 1000);
    
    console.log(`[DIAGNOSTIC] 📊 ${missions.length} missions, ${workItems.length} WorkItems`);
    
    // Grouper les WorkItems par mission
    const workItemsByMission = {};
    workItems.forEach(wi => {
      if (wi.mission_direction_id) {
        if (!workItemsByMission[wi.mission_direction_id]) {
          workItemsByMission[wi.mission_direction_id] = [];
        }
        workItemsByMission[wi.mission_direction_id].push(wi);
      }
    });
    
    const incoherences = [];
    
    // Analyser chaque mission
    for (const mission of missions) {
      const wis = workItemsByMission[mission.id] || [];
      
      if (wis.length === 0) continue;
      
      const hebergement = mission.zones?.[0]?.numero || mission.id.substring(0, 8);
      
      // Calculer le statut attendu
      const nbTerminee = wis.filter(w => w.statut === 'TERMINEE').length;
      const nbEnCours = wis.filter(w => w.statut === 'EN_COURS').length;
      const nbEnAttente = wis.filter(w => w.statut === 'EN_ATTENTE').length;
      const nbAFaire = wis.filter(w => w.statut === 'A_FAIRE').length;
      
      let statutAttendu;
      if (nbEnCours > 0) {
        statutAttendu = 'EN_COURS';
      } else if (nbEnAttente > 0) {
        statutAttendu = 'EN_ATTENTE';
      } else if (nbAFaire > 0) {
        statutAttendu = 'A_FAIRE';
      } else if (nbTerminee === wis.length && wis.length > 0) {
        statutAttendu = 'TERMINEE';
      } else {
        statutAttendu = 'A_FAIRE';
      }
      
      // Vérifier l'incohérence
      if (mission.statut !== statutAttendu) {
        const detail = {
          hebergement,
          missionId: mission.id,
          statutActuel: mission.statut,
          statutAttendu,
          workItems: wis.map(w => ({ service: w.service, statut: w.statut })),
          distribution: { TERMINEE: nbTerminee, EN_COURS: nbEnCours, EN_ATTENTE: nbEnAttente, A_FAIRE: nbAFaire }
        };
        
        incoherences.push(detail);
        
        console.log(`\n[DIAGNOSTIC] ❌ INCOHÉRENCE: ${hebergement}`);
        console.log(`  Mission statut: ${mission.statut}`);
        console.log(`  Statut attendu: ${statutAttendu}`);
        console.log(`  WorkItems: ${JSON.stringify(detail.distribution)}`);
        wis.forEach(w => console.log(`    - ${w.service}: ${w.statut}`));
      }
    }
    
    console.log(`\n[DIAGNOSTIC] 📊 RÉSULTAT:`);
    console.log(`  ✅ Missions cohérentes: ${missions.length - incoherences.length}`);
    console.log(`  ❌ Missions incohérentes: ${incoherences.length}`);
    
    if (incoherences.length > 0) {
      console.log('\n[DIAGNOSTIC] ⚠️ CORRECTION NÉCESSAIRE - Cliquez sur "Recalculer tous les statuts"');
    } else {
      console.log('\n[DIAGNOSTIC] ✅ Toutes les missions sont synchronisées');
    }
    
    return {
      success: true,
      total: missions.length,
      coherentes: missions.length - incoherences.length,
      incoherences
    };
    
  } catch (error) {
    console.error('[DIAGNOSTIC] ❌ ERREUR:', error);
    return { success: false, error: error.message };
  }
}