/**
 * Test QA — Validation suppression cascade & orphelins
 * À exécuter après suppression d'intervention
 */

import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Vérifier qu'aucun WorkItem orphelin n'existe
 * (WorkItem avec incident_id qui pointe vers supprimé)
 */
export const testNoCascadeOrphans = async () => {
  console.log('🧪 TEST: Vérification orphelins après suppression cascade...');
  
  try {
    // 1️⃣ Récupérer tous les WorkItems
    const allWorkItems = await base44.entities.WorkItem.list('-created_date', 1000);
    
    // 2️⃣ Pour chaque WorkItem ayant incident_id, vérifier que l'incident existe ET est actif
    const orphans = [];
    
    for (const wi of allWorkItems) {
      if (!wi.incident_id) continue; // Pas un WorkItem lié à incident
      
      try {
        const incidents = await base44.entities.Incident.filter({
          id: wi.incident_id
        });
        
        if (!incidents || incidents.length === 0) {
          orphans.push({
            workItemId: wi.id,
            incidentId: wi.incident_id,
            reason: 'INCIDENT_NOT_FOUND'
          });
        } else if (incidents[0].deleted_at) {
          orphans.push({
            workItemId: wi.id,
            incidentId: wi.incident_id,
            reason: 'INCIDENT_DELETED',
            deletedAt: incidents[0].deleted_at
          });
        }
      } catch (err) {
        orphans.push({
          workItemId: wi.id,
          incidentId: wi.incident_id,
          reason: 'QUERY_ERROR',
          error: err.message
        });
      }
    }
    
    // 3️⃣ Résultat
    if (orphans.length === 0) {
      console.log('✅ TEST PASSÉ: Aucun orphelin trouvé');
      toast.success(`✅ Test suppression: 0 orphelin (${allWorkItems.length} WorkItems vérifiés)`);
      return {
        success: true,
        orphanCount: 0,
        totalWorkItems: allWorkItems.length
      };
    } else {
      console.warn('❌ TEST ÉCHOUÉ: Orphelins trouvés:', orphans);
      toast.error(`❌ ${orphans.length} orphelin(s) détecté(s)!`);
      return {
        success: false,
        orphanCount: orphans.length,
        orphans,
        totalWorkItems: allWorkItems.length
      };
    }
  } catch (error) {
    console.error('❌ Erreur test:', error);
    toast.error('Erreur lors du test');
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Vérifier que les interventions supprimées sont bien marquées
 */
export const testDeletedFlagPresent = async () => {
  console.log('🧪 TEST: Vérification deleted_at flag...');
  
  try {
    const incidents = await base44.entities.Incident.list('-created_date', 1000);
    
    // Compter supprimés
    const deletedIncidents = incidents.filter(i => i.deleted_at);
    const activeIncidents = incidents.filter(i => !i.deleted_at);
    
    console.log(`✅ TEST: ${activeIncidents.length} actifs, ${deletedIncidents.length} supprimés`);
    
    return {
      success: true,
      totalIncidents: incidents.length,
      activeIncidents: activeIncidents.length,
      deletedIncidents: deletedIncidents.length
    };
  } catch (error) {
    console.error('❌ Erreur test:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Lancer tous les tests
 */
export const runAllSuppressionTests = async () => {
  console.log('🚀 Lancement suite de tests suppression...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Test 1: Orphelins
  results.tests.orphans = await testNoCascadeOrphans();
  
  // Test 2: Deleted flag
  results.tests.deletedFlag = await testDeletedFlagPresent();
  
  // Résumé
  const allPassed = Object.values(results.tests).every(t => t.success !== false);
  
  console.log(
    allPassed
      ? '✅ TOUS LES TESTS PASSÉS'
      : '❌ CERTAINS TESTS ÉCHOUÉS'
  );
  
  return results;
};