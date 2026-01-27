import { base44 } from '@/api/base44Client';

/**
 * 🔒 VERROU D'UNICITÉ STRICT - AUCUN DOUBLON AUTORISÉ
 * 
 * Règle métier absolue:
 * 1 seul MissionDirection par (logement, type_mission, saison)
 * 
 * Cette fonction est la SEULE autorisée à créer des MissionDirection.
 */

/**
 * Trouve une mission existante selon la clé métier
 * @param {string} logement - Numéro du logement (ex: "B12", "F01")
 * @param {string} typeMission - DESHIVERNAGE | HIVERNAGE | INTERVENTION
 * @param {number} saison - Année de la campagne (ex: 2026)
 * @returns {Promise<Object|null>} Mission existante ou null
 */
async function findExistingMission(logement, typeMission, saison) {
  console.log(`[FACTORY] 🔍 Recherche mission: ${typeMission} | ${logement} | ${saison}`);
  
  // Récupérer TOUTES les missions du même type
  const allMissions = await base44.entities.MissionDirection.filter({
    type_mission: typeMission
  }, null, 500);
  
  console.log(`[FACTORY] 📦 ${allMissions.length} missions ${typeMission} trouvées`);
  
  // Filtrer manuellement par logement ET saison
  const matching = allMissions.filter(m => {
    const premierLogement = m.zones?.[0]?.numero;
    const anneeCreation = new Date(m.created_date).getFullYear();
    
    const match = 
      premierLogement === logement &&
      anneeCreation === saison &&
      m.statut !== 'ANNULEE'; // Ignorer les missions annulées
    
    if (match) {
      console.log(`[FACTORY] ✅ MATCH TROUVÉ: ${m.id} (${m.statut})`);
    }
    
    return match;
  });
  
  if (matching.length > 1) {
    console.error(`[FACTORY] ⚠️ ANOMALIE: ${matching.length} missions identiques trouvées - DOUBLONS EXISTANTS`);
  }
  
  return matching[0] || null;
}

/**
 * 🔒 CRÉATION UNIQUE - AVEC VERROU AUTOMATIQUE
 * 
 * Si une mission existe déjà → la retourne (ne crée PAS de doublon)
 * Sinon → crée une nouvelle mission
 * 
 * @param {Object} missionData - Données de la mission
 * @returns {Promise<Object>} Mission (existante ou nouvellement créée)
 */
export async function findOrCreateMission(missionData) {
  const logement = missionData.zones?.[0]?.numero;
  const typeMission = missionData.type_mission;
  const saison = new Date().getFullYear();
  
  if (!logement) {
    throw new Error('❌ BLOCAGE: zones[0].numero manquant - impossible de garantir l\'unicité');
  }
  
  if (!typeMission || !['HIVERNAGE', 'DESHIVERNAGE', 'INTERVENTION'].includes(typeMission)) {
    throw new Error(`❌ BLOCAGE: type_mission invalide "${typeMission}"`);
  }
  
  // VERROU: Chercher si mission existe déjà
  const existing = await findExistingMission(logement, typeMission, saison);
  
  if (existing) {
    console.log(`[FACTORY] ♻️ RÉUTILISATION mission existante: ${existing.id}`);
    console.log(`[FACTORY]    Statut actuel: ${existing.statut}`);
    return { mission: existing, created: false };
  }
  
  // CRÉATION SEULEMENT si aucune mission n'existe
  console.log(`[FACTORY] 🆕 CRÉATION nouvelle mission: ${typeMission} | ${logement} | ${saison}`);
  
  const created = await base44.entities.MissionDirection.create({
    ...missionData,
    mission_direction: true
  });
  
  console.log(`[FACTORY] ✅ Mission créée: ${created.id}`);
  
  return { mission: created, created: true };
}

/**
 * 🧹 NETTOYAGE COMPLET DES DOUBLONS EXISTANTS
 * À exécuter UNE FOIS pour nettoyer la base
 */
export async function cleanAllDuplicates() {
  console.log('='.repeat(80));
  console.log('🚀 NETTOYAGE COMPLET DES DOUBLONS - BACKEND');
  console.log('='.repeat(80));
  
  // 1. Charger TOUTES les missions
  const allMissions = await base44.entities.MissionDirection.list('-created_date', 2000);
  console.log(`[CLEANUP] ✅ ${allMissions.length} missions chargées`);
  
  // 2. Grouper par CLÉ MÉTIER STRICTE
  const groupes = {};
  
  allMissions.forEach(m => {
    const logement = m.zones?.[0]?.numero || 'INCONNU';
    const typeMission = m.type_mission;
    const saison = new Date(m.created_date).getFullYear();
    
    const cle = `${typeMission}|${logement}|${saison}`;
    
    if (!groupes[cle]) {
      groupes[cle] = [];
    }
    groupes[cle].push(m);
  });
  
  console.log(`[CLEANUP] ✅ ${Object.keys(groupes).length} groupes métier`);
  
  // 3. Identifier doublons
  const groupesDoublons = Object.entries(groupes).filter(([_, missions]) => missions.length > 1);
  
  console.log(`[CLEANUP] 🔍 ${groupesDoublons.length} groupes avec doublons`);
  
  if (groupesDoublons.length === 0) {
    console.log('[CLEANUP] ✅ Aucun doublon - base propre');
    return { doublons: 0, supprimees: 0, rattachees: 0, details: [] };
  }
  
  // Afficher détails
  groupesDoublons.forEach(([cle, missions]) => {
    console.log(`[CLEANUP] 📦 ${cle}: ${missions.length} doublons`);
  });
  
  // 4. Traiter chaque groupe
  let totalSupprimees = 0;
  let totalRattachees = 0;
  const details = [];
  
  for (const [cle, missions] of groupesDoublons) {
    console.log('─'.repeat(80));
    console.log(`[CLEANUP] 🔧 ${cle} (${missions.length} missions)`);
    
    // TRIER: garder la PLUS ANCIENNE (stable)
    missions.sort((a, b) => {
      // Priorité 1: TERMINEE en premier
      if (a.statut === 'TERMINEE' && b.statut !== 'TERMINEE') return -1;
      if (b.statut === 'TERMINEE' && a.statut !== 'TERMINEE') return 1;
      
      // Priorité 2: Plus ancienne
      return new Date(a.created_date) - new Date(b.created_date);
    });
    
    const conservee = missions[0];
    const aSupprimer = missions.slice(1);
    
    console.log(`[CLEANUP] ✅ CONSERVÉE: ${conservee.id} (${conservee.statut}, ${conservee.created_date})`);
    
    let workItemsRattaches = 0;
    
    // Rattacher WorkItems + Supprimer
    for (const dupli of aSupprimer) {
      console.log(`[CLEANUP] 🗑️ SUPPRESSION: ${dupli.id} (${dupli.statut})`);
      
      // Récupérer WorkItems liés
      const workItems = await base44.entities.WorkItem.filter({
        mission_direction_id: dupli.id,
        type: 'MISSION_DIRECTION'
      }, null, 500);
      
      console.log(`[CLEANUP]    ├─ ${workItems.length} WorkItem(s) à rattacher`);
      
      // Rattacher à la mission conservée
      for (const wi of workItems) {
        await base44.entities.WorkItem.update(wi.id, {
          mission_direction_id: conservee.id
        });
        totalRattachees++;
        workItemsRattaches++;
      }
      
      // SUPPRIMER DÉFINITIVEMENT
      await base44.entities.MissionDirection.delete(dupli.id);
      totalSupprimees++;
      console.log(`[CLEANUP]    └─ ✅ Supprimée`);
    }
    
    details.push({
      cle,
      conservee: conservee.id,
      supprimees: aSupprimer.length,
      workItemsRattaches
    });
  }
  
  console.log('='.repeat(80));
  console.log('✅ NETTOYAGE TERMINÉ');
  console.log(`📊 Groupes traités: ${groupesDoublons.length}`);
  console.log(`🗑️ Missions supprimées: ${totalSupprimees}`);
  console.log(`🔗 WorkItems rattachés: ${totalRattachees}`);
  console.log('='.repeat(80));
  
  // Afficher détails par logement
  details.forEach(d => {
    console.log(`   ${d.cle}: ${d.supprimees} supprimées, ${d.workItemsRattaches} WorkItems rattachés`);
  });
  
  return {
    doublons: groupesDoublons.length,
    supprimees: totalSupprimees,
    rattachees: totalRattachees,
    details
  };
}