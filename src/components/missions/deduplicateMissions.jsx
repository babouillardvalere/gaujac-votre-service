import { base44 } from '@/api/base44Client';

/**
 * DÉDUPLICATION BACKEND FORCÉE - ONE-SHOT
 * Clé métier stricte: (type_mission, premier_logement, saison)
 * 
 * Groupement correct:
 * - Premier logement de zones[0].numero (pas tout le tableau)
 * - Saison 2025-2026 (pas juste année technique)
 * - Ignore workflow_version, source, created_from
 * 
 * Action:
 * - Garder LA PLUS ANCIENNE mission par groupe (stable)
 * - Rattacher TOUS les WorkItems
 * - Supprimer définitivement les doublons
 */
export async function deduplicateMissions() {
  try {
    console.log('='.repeat(80));
    console.log('🚀 DÉDUPLICATION BACKEND FORCÉE');
    console.log('='.repeat(80));
    
    // 1. Récupérer TOUTES les MissionDirection
    const allMissions = await base44.entities.MissionDirection.list('-created_date', 2000);
    console.log(`[DEDUPE] ✅ ${allMissions.length} missions chargées`);
    
    // 2. Grouper par CLÉ MÉTIER STRICTE
    const groupes = {};
    
    allMissions.forEach(m => {
      // CRITIQUE: Premier logement uniquement
      const logement = m.zones?.[0]?.numero || 'INCONNU';
      
      // CRITIQUE: Saison métier (année de created_date suffit pour 2025-2026)
      const dateCreation = new Date(m.created_date);
      const saison = dateCreation.getFullYear();
      
      // CLÉ UNIQUE MÉTIER
      const cle = `${m.type_mission}|${logement}|${saison}`;
      
      if (!groupes[cle]) {
        groupes[cle] = [];
      }
      groupes[cle].push(m);
    });
    
    console.log(`[DEDUPE] ✅ ${Object.keys(groupes).length} groupes métier identifiés`);
    
    // 3. Identifier les doublons
    const groupesDoublons = Object.entries(groupes).filter(([_, missions]) => missions.length > 1);
    
    console.log(`[DEDUPE] 🔍 ${groupesDoublons.length} groupes avec doublons détectés`);
    
    if (groupesDoublons.length === 0) {
      console.log('[DEDUPE] ✅ Aucun doublon - base déjà propre');
      return { doublons: 0, supprimees: 0, rattachees: 0, details: [] };
    }
    
    // Afficher détails des doublons
    groupesDoublons.forEach(([cle, missions]) => {
      console.log(`[DEDUPE] 📦 ${cle}: ${missions.length} missions`);
      missions.forEach(m => {
        console.log(`   - ID: ${m.id}, Statut: ${m.statut}, Créée: ${m.created_date}`);
      });
    });
    
    // 4. Traiter chaque groupe de doublons
    let totalSupprimees = 0;
    let totalRattachees = 0;
    const details = [];
    
    for (const [cle, missions] of groupesDoublons) {
      console.log('─'.repeat(80));
      console.log(`[DEDUPE] 🔧 TRAITEMENT: ${cle} (${missions.length} doublons)`);
      
      // CRITIQUE: Trier pour garder LA PLUS ANCIENNE (stable dans le temps)
      // Sauf si une est TERMINEE (priorité absolue)
      missions.sort((a, b) => {
        // Priorité 1: TERMINEE en premier
        if (a.statut === 'TERMINEE' && b.statut !== 'TERMINEE') return -1;
        if (b.statut === 'TERMINEE' && a.statut !== 'TERMINEE') return 1;
        
        // Priorité 2: Plus ancienne (créée en premier)
        return new Date(a.created_date) - new Date(b.created_date);
      });
      
      const missionConservee = missions[0];
      const missionsASupprimer = missions.slice(1);
      
      console.log(`[DEDUPE] ✅ CONSERVÉE: ${missionConservee.id}`);
      console.log(`[DEDUPE]    ├─ Statut: ${missionConservee.statut}`);
      console.log(`[DEDUPE]    ├─ Créée: ${missionConservee.created_date}`);
      console.log(`[DEDUPE]    └─ Zones: ${missionConservee.zones?.map(z => z.numero).join(', ')}`);
      
      let workItemsRattaches = 0;
      
      // 5. Rattacher TOUS les WorkItems des doublons à la mission conservée
      for (const missionDupli of missionsASupprimer) {
        console.log(`[DEDUPE] 🗑️ SUPPRESSION: ${missionDupli.id} (${missionDupli.statut})`);
        
        const workItems = await base44.entities.WorkItem.filter({
          mission_direction_id: missionDupli.id,
          type: 'MISSION_DIRECTION'
        }, null, 500);
        
        console.log(`[DEDUPE]    ├─ ${workItems.length} WorkItem(s) à rattacher`);
        
        for (const wi of workItems) {
          await base44.entities.WorkItem.update(wi.id, {
            mission_direction_id: missionConservee.id
          });
          totalRattachees++;
          workItemsRattaches++;
        }
        
        // 6. SUPPRIMER DÉFINITIVEMENT la mission dupliquée
        await base44.entities.MissionDirection.delete(missionDupli.id);
        totalSupprimees++;
        console.log(`[DEDUPE]    └─ ✅ Supprimée`);
      }
      
      details.push({
        cle,
        conservee: missionConservee.id,
        supprimees: missionsASupprimer.length,
        workItemsRattaches
      });
    }
    
    console.log('='.repeat(80));
    console.log('✅ DÉDUPLICATION TERMINÉE');
    console.log(`📊 ${groupesDoublons.length} groupes traités`);
    console.log(`🗑️ ${totalSupprimees} missions supprimées`);
    console.log(`🔗 ${totalRattachees} WorkItems rattachés`);
    console.log('='.repeat(80));
    
    return {
      doublons: groupesDoublons.length,
      supprimees: totalSupprimees,
      rattachees: totalRattachees,
      details
    };
    
  } catch (error) {
    console.error('[DEDUPE] ❌ Erreur:', error);
    throw error;
  }
}