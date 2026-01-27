import { base44 } from '@/api/base44Client';

/**
 * DIAGNOSTIC PROFOND - Analyse exacte de ce qui est en BDD
 * Sans recalcul, juste afficher la VÉRITÉ
 */
export async function deepDiagnostic() {
  console.clear();
  console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                  🔍 DIAGNOSTIC PROFOND                         ║');
  console.log('║            Analyse exacte de la synchronisation               ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Récupérer TOUTES les missions DESHIVERNAGE
    console.log('📥 RÉCUPÉRATION DES DONNÉES...\n');
    const missions = await base44.entities.MissionDirection.filter(
      { type_mission: 'DESHIVERNAGE' },
      '-created_date',
      200
    );
    console.log(`✅ ${missions.length} missions DESHIVERNAGE trouvées\n`);

    // Récupérer TOUS les WorkItems
    const allWorkItems = await base44.entities.WorkItem.list('-created_date', 2000);
    console.log(`✅ ${allWorkItems.length} WorkItems totaux en BDD\n`);

    // Filtrer pour MISSION_DIRECTION
    const missionWorkItems = allWorkItems.filter(w => w.type === 'MISSION_DIRECTION');
    console.log(`✅ ${missionWorkItems.length} WorkItems de type MISSION_DIRECTION\n`);

    // Grouper par mission_direction_id
    const wiByMission = {};
    missionWorkItems.forEach(wi => {
      if (wi.mission_direction_id) {
        if (!wiByMission[wi.mission_direction_id]) {
          wiByMission[wi.mission_direction_id] = [];
        }
        wiByMission[wi.mission_direction_id].push(wi);
      }
    });

    console.log(`✅ ${Object.keys(wiByMission).length} missions ont des WorkItems liés\n`);

    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                  📋 DÉTAIL MISSION PAR MISSION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    let problemCount = 0;

    missions.forEach((mission, idx) => {
      const hebergement = mission.zones?.[0]?.numero || mission.id.substring(0, 8);
      const wis = wiByMission[mission.id] || [];

      console.log(`\n【${idx + 1}】 ${hebergement.toUpperCase()}`);
      console.log(`    Mission ID: ${mission.id.substring(0, 12)}`);
      console.log(`    Statut BDD: ${mission.statut}`);
      console.log(`    Type: ${mission.type_mission}`);
      console.log(`    Zones: ${mission.zones?.length || 0}`);
      console.log(`    Has Blocking: ${mission.has_blocking}`);

      if (wis.length === 0) {
        console.log(`    ❌ PROBLÈME: AUCUN WorkItem lié!`);
        problemCount++;
      } else {
        console.log(`    WorkItems liés: ${wis.length}`);
        
        const statusCount = {
          A_FAIRE: 0,
          EN_COURS: 0,
          EN_ATTENTE: 0,
          TERMINEE: 0,
          ANNULEE: 0
        };

        wis.forEach(wi => {
          const key = wi.statut;
          if (statusCount.hasOwnProperty(key)) {
            statusCount[key]++;
          }
          console.log(`      • ${wi.service} (${wi.id.substring(0, 8)}): ${wi.statut}`);
        });

        console.log(`    Distribution: A_FAIRE(${statusCount.A_FAIRE}) EN_COURS(${statusCount.EN_COURS}) EN_ATTENTE(${statusCount.EN_ATTENTE}) TERMINEE(${statusCount.TERMINEE})`);

        // Calculer le statut attendu selon les règles
        let expectedStatus;
        if (statusCount.EN_COURS > 0) {
          expectedStatus = 'EN_COURS';
        } else if (statusCount.EN_ATTENTE > 0) {
          expectedStatus = 'EN_ATTENTE';
        } else if (statusCount.A_FAIRE > 0) {
          expectedStatus = 'A_FAIRE';
        } else if (statusCount.TERMINEE === wis.length && wis.length > 0) {
          expectedStatus = 'TERMINEE';
        } else {
          expectedStatus = 'A_FAIRE';
        }

        if (mission.statut !== expectedStatus) {
          console.log(`    ❌ DÉSYNCHRONISÉ: ${mission.statut} ≠ ${expectedStatus}`);
          problemCount++;
        } else {
          console.log(`    ✅ OK: ${mission.statut}`);
        }
      }
    });

    // Résumé
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('                     📊 RÉSUMÉ FINAL');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n  Missions DESHIVERNAGE: ${missions.length}`);
    console.log(`  ✅ Synchronisées: ${missions.length - problemCount}`);
    console.log(`  ❌ Désynchronisées: ${problemCount}`);
    
    if (problemCount > 0) {
      console.log(`\n  ⚠️  PROBLÈMES DÉTECTÉS - Action requise:`);
      console.log(`      1. Cliquez sur "Recalculer tous les statuts"`);
      console.log(`      2. Attendez la fin`);
      console.log(`      3. Relancez ce diagnostic`);
    } else {
      console.log(`\n  ✅ Tout est en ordre!`);
    }

    console.log('\n╚═══════════════════════════════════════════════════════════════╝\n');

    return {
      success: true,
      total: missions.length,
      problemes: problemCount,
      details: {
        missionsCount: missions.length,
        workItemsCount: missionWorkItems.length,
        synchronisees: missions.length - problemCount
      }
    };

  } catch (error) {
    console.error('❌ ERREUR DIAGNOSTIC:', error);
    return { success: false, error: error.message };
  }
}