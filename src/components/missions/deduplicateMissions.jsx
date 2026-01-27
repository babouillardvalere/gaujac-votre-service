import { base44 } from '@/api/base44Client';

/**
 * DÉDUPLICATION ONE-SHOT des MissionDirection
 * Clé fonctionnelle: (type_mission, zones.numero, année)
 * 
 * Pour chaque groupe de doublons:
 * - Garder 1 mission (la plus récente ou celle avec le plus d'activité)
 * - Rattacher TOUS les WorkItems à celle conservée
 * - Supprimer les autres
 */
export async function deduplicateMissions() {
  try {
    console.log('[DEDUPE] === DÉBUT DÉDUPLICATION MISSIONS ===');
    
    // 1. Récupérer TOUTES les MissionDirection
    const allMissions = await base44.entities.MissionDirection.list('-created_date', 1000);
    console.log(`[DEDUPE] ${allMissions.length} missions totales`);
    
    // 2. Grouper par clé fonctionnelle
    const groupes = {};
    
    allMissions.forEach(m => {
      const zone = m.zones?.[0]?.numero || 'unknown';
      const annee = new Date(m.created_date).getFullYear();
      const cle = `${m.type_mission}_${zone}_${annee}`;
      
      if (!groupes[cle]) {
        groupes[cle] = [];
      }
      groupes[cle].push(m);
    });
    
    console.log(`[DEDUPE] ${Object.keys(groupes).length} groupes uniques identifiés`);
    
    // 3. Identifier les doublons
    const groupesDoublons = Object.entries(groupes).filter(([_, missions]) => missions.length > 1);
    
    console.log(`[DEDUPE] ${groupesDoublons.length} groupes avec doublons`);
    
    if (groupesDoublons.length === 0) {
      console.log('[DEDUPE] ✅ Aucun doublon trouvé');
      return { doublons: 0, supprimees: 0, rattachees: 0 };
    }
    
    // 4. Traiter chaque groupe de doublons
    let totalSupprimees = 0;
    let totalRattachees = 0;
    
    for (const [cle, missions] of groupesDoublons) {
      console.log(`[DEDUPE] 📋 Traitement groupe ${cle} (${missions.length} missions)`);
      
      // Trier: priorité à la plus récente avec statut significatif
      missions.sort((a, b) => {
        const scoreA = (a.statut === 'TERMINEE' ? 100 : 0) + (a.services_intervenants?.length || 0);
        const scoreB = (b.statut === 'TERMINEE' ? 100 : 0) + (b.services_intervenants?.length || 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.created_date) - new Date(a.created_date);
      });
      
      const missionConservee = missions[0];
      const missionsASupprimer = missions.slice(1);
      
      console.log(`[DEDUPE] ✅ Mission conservée: ${missionConservee.id} (${missionConservee.statut})`);
      console.log(`[DEDUPE] ❌ ${missionsASupprimer.length} mission(s) à supprimer`);
      
      // 5. Rattacher tous les WorkItems à la mission conservée
      for (const missionDupli of missionsASupprimer) {
        const workItems = await base44.entities.WorkItem.filter({
          mission_direction_id: missionDupli.id
        });
        
        console.log(`[DEDUPE] 🔗 ${workItems.length} WorkItems à rattacher depuis ${missionDupli.id}`);
        
        for (const wi of workItems) {
          await base44.entities.WorkItem.update(wi.id, {
            mission_direction_id: missionConservee.id
          });
          totalRattachees++;
        }
        
        // 6. Supprimer la mission dupliquée
        await base44.entities.MissionDirection.delete(missionDupli.id);
        totalSupprimees++;
        console.log(`[DEDUPE] 🗑️ Mission ${missionDupli.id} supprimée`);
      }
    }
    
    console.log('[DEDUPE] === FIN DÉDUPLICATION ===');
    console.log(`[DEDUPE] ✅ ${totalSupprimees} missions supprimées`);
    console.log(`[DEDUPE] ✅ ${totalRattachees} WorkItems rattachés`);
    
    return {
      doublons: groupesDoublons.length,
      supprimees: totalSupprimees,
      rattachees: totalRattachees
    };
    
  } catch (error) {
    console.error('[DEDUPE] ❌ Erreur:', error);
    throw error;
  }
}