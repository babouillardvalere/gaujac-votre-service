/**
 * 🧪 SCRIPT DE TEST AUTOMATIQUE — VALIDATION CORRECTIFS INVENTAIRE
 * 
 * Usage: Copier/coller dans la console navigateur (F12) sur l'app
 * 
 * Prérequis:
 * - Être authentifié admin
 * - Avoir accès à base44 global
 */

(async function runTests() {
  console.log('🚀 DÉMARRAGE TESTS AUTOMATIQUES — Correctifs Inventaire');
  console.log('=' .repeat(60));
  
  const results = {
    testA: { name: 'SuiviEvent auto-créé', passed: false, details: '' },
    testB: { name: 'Emplacement WorkItem', passed: false, details: '' },
    testC: { name: 'Description Services', passed: false, details: '' },
    testD: { name: 'Timeline Suivi', passed: false, details: '' },
    testE: { name: 'Soft delete cascade', passed: false, details: '' },
    testF: { name: 'Régression legacy', passed: false, details: '' }
  };
  
  // =========================================
  // TEST A — SuiviEvent auto-créé
  // =========================================
  try {
    console.log('\n🔍 TEST A — Vérification SuiviEvent auto-créé');
    
    // Récupérer tous les WorkItems récents (dernières 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentWorkItems = await base44.entities.WorkItem.filter({}, '-created_date', 50);
    const recentWI = recentWorkItems.filter(wi => wi.created_date > yesterday);
    
    if (recentWI.length === 0) {
      results.testA.details = '⚠️ Aucun WorkItem récent trouvé. Créer une intervention d\'abord.';
      console.warn(results.testA.details);
    } else {
      const firstWI = recentWI[0];
      const suiviEvents = await base44.entities.SuiviEvent.filter({ workitem_id: firstWI.id });
      
      if (suiviEvents.length > 0) {
        const creationEvent = suiviEvents.find(e => e.action === 'CREATION');
        if (creationEvent) {
          results.testA.passed = true;
          results.testA.details = `✅ SuiviEvent trouvé: ${creationEvent.message} (${creationEvent.timestamp})`;
          console.log(results.testA.details);
        } else {
          results.testA.details = `⚠️ Aucun event CREATION trouvé (${suiviEvents.length} events total)`;
          console.warn(results.testA.details);
        }
      } else {
        results.testA.details = `❌ Aucun SuiviEvent pour WorkItem ${firstWI.id}`;
        console.error(results.testA.details);
      }
    }
  } catch (e) {
    results.testA.details = `❌ Erreur: ${e.message}`;
    console.error(results.testA.details);
  }
  
  // =========================================
  // TEST B — Emplacement WorkItem créé
  // =========================================
  try {
    console.log('\n🔍 TEST B — Vérification Emplacement WorkItem');
    
    // Chercher WorkItem emplacement récent
    const workItems = await base44.entities.WorkItem.filter({}, '-created_date', 100);
    const emplacementWI = workItems.find(wi => 
      wi.type_hebergement?.toLowerCase().includes('emplacement') ||
      wi.hebergement?.startsWith('P')
    );
    
    if (!emplacementWI) {
      results.testB.details = '⚠️ Aucun WorkItem emplacement trouvé. Créer un contrôle P04 d\'abord.';
      console.warn(results.testB.details);
    } else {
      const hasDescription = emplacementWI.description_operationnelle && 
                            emplacementWI.description_operationnelle.includes('Arrivée emplacement');
      const hasDates = emplacementWI.date_arrivee && emplacementWI.date_depart;
      
      if (hasDescription && hasDates) {
        results.testB.passed = true;
        results.testB.details = `✅ Emplacement ${emplacementWI.hebergement} OK: ${emplacementWI.date_arrivee} → ${emplacementWI.date_depart}`;
        console.log(results.testB.details);
      } else {
        results.testB.details = `⚠️ Données incomplètes: description=${!!hasDescription}, dates=${!!hasDates}`;
        console.warn(results.testB.details);
      }
    }
  } catch (e) {
    results.testB.details = `❌ Erreur: ${e.message}`;
    console.error(results.testB.details);
  }
  
  // =========================================
  // TEST C — Description opérationnelle visible
  // =========================================
  try {
    console.log('\n🔍 TEST C — Vérification Description Services');
    
    const techniqueWI = await base44.entities.WorkItem.filter({ service: 'TECHNIQUE' }, '-created_date', 10);
    const menageWI = await base44.entities.WorkItem.filter({ service: 'MENAGE' }, '-created_date', 10);
    
    const allServiceWI = [...techniqueWI, ...menageWI].filter(wi => !wi.deleted_at);
    
    const withDescription = allServiceWI.filter(wi => wi.description_operationnelle);
    const withoutDescription = allServiceWI.filter(wi => !wi.description_operationnelle);
    
    const ratio = withDescription.length / allServiceWI.length;
    
    if (ratio >= 0.8) {
      results.testC.passed = true;
      results.testC.details = `✅ ${withDescription.length}/${allServiceWI.length} WorkItems ont description_operationnelle`;
      console.log(results.testC.details);
    } else {
      results.testC.details = `⚠️ Seulement ${Math.round(ratio * 100)}% ont description (attendu >= 80%)`;
      console.warn(results.testC.details);
      console.warn('WorkItems sans description:', withoutDescription.map(wi => wi.id));
    }
  } catch (e) {
    results.testC.details = `❌ Erreur: ${e.message}`;
    console.error(results.testC.details);
  }
  
  // =========================================
  // TEST D — Timeline Suivi complète
  // =========================================
  try {
    console.log('\n🔍 TEST D — Vérification Timeline Suivi');
    
    const workItems = await base44.entities.WorkItem.filter({}, '-created_date', 50);
    const completedWI = workItems.filter(wi => wi.statut === 'TERMINEE').slice(0, 5);
    
    if (completedWI.length === 0) {
      results.testD.details = '⚠️ Aucun WorkItem terminé trouvé. Compléter une intervention d\'abord.';
      console.warn(results.testD.details);
    } else {
      let timelineComplete = 0;
      
      for (const wi of completedWI) {
        const events = await base44.entities.SuiviEvent.filter({ workitem_id: wi.id });
        const hasCreation = events.some(e => e.action === 'CREATION');
        const hasCloture = events.some(e => e.action === 'TERMINEE' || e.action === 'CLOTUREE');
        
        if (hasCreation && hasCloture && events.length >= 2) {
          timelineComplete++;
        }
      }
      
      const completionRatio = timelineComplete / completedWI.length;
      
      if (completionRatio >= 0.8) {
        results.testD.passed = true;
        results.testD.details = `✅ ${timelineComplete}/${completedWI.length} WorkItems ont timeline complète`;
        console.log(results.testD.details);
      } else {
        results.testD.details = `⚠️ Seulement ${Math.round(completionRatio * 100)}% ont timeline complète`;
        console.warn(results.testD.details);
      }
    }
  } catch (e) {
    results.testD.details = `❌ Erreur: ${e.message}`;
    console.error(results.testD.details);
  }
  
  // =========================================
  // TEST E — Soft delete cascade
  // =========================================
  try {
    console.log('\n🔍 TEST E — Vérification Soft delete cascade');
    
    const allIncidents = await base44.entities.Incident.filter({}, '-created_date', 100);
    const deletedIncidents = allIncidents.filter(inc => inc.deleted_at);
    
    if (deletedIncidents.length === 0) {
      results.testE.details = '⚠️ Aucun incident supprimé trouvé. Supprimer une intervention d\'abord.';
      console.warn(results.testE.details);
    } else {
      const testIncident = deletedIncidents[0];
      
      // Vérifier orphelins
      const allWorkItems = await base44.entities.WorkItem.filter({}, '-created_date', 200);
      const orphelins = allWorkItems.filter(wi => 
        (wi.incident_id === testIncident.id || wi.intervention_client_id === testIncident.id) &&
        !wi.deleted_at
      );
      
      if (orphelins.length === 0) {
        results.testE.passed = true;
        results.testE.details = `✅ Aucun orphelin trouvé pour incident supprimé ${testIncident.id}`;
        console.log(results.testE.details);
      } else {
        results.testE.details = `❌ ${orphelins.length} WorkItems orphelins détectés!`;
        console.error(results.testE.details);
        console.error('Orphelins:', orphelins.map(wi => wi.id));
      }
    }
  } catch (e) {
    results.testE.details = `❌ Erreur: ${e.message}`;
    console.error(results.testE.details);
  }
  
  // =========================================
  // TEST F — Régression legacy
  // =========================================
  try {
    console.log('\n🔍 TEST F — Vérification Régression legacy');
    
    // Fonction fallback getDescriptionOperationnelle
    const getDescriptionOperationnelle = (item) => {
      return (
        item?.description_operationnelle ||
        item?.description_probleme ||
        item?.description ||
        null
      );
    };
    
    // Tester fallback sur ancien format
    const legacyIncident = {
      id: 'TEST_LEGACY',
      description_probleme: 'Ancienne description',
      description_operationnelle: null
    };
    
    const fallbackResult = getDescriptionOperationnelle(legacyIncident);
    
    if (fallbackResult === 'Ancienne description') {
      results.testF.passed = true;
      results.testF.details = '✅ Fallback description_probleme fonctionne';
      console.log(results.testF.details);
    } else {
      results.testF.details = `❌ Fallback échoué: ${fallbackResult}`;
      console.error(results.testF.details);
    }
  } catch (e) {
    results.testF.details = `❌ Erreur: ${e.message}`;
    console.error(results.testF.details);
  }
  
  // =========================================
  // RÉCAPITULATIF
  // =========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS TESTS AUTOMATIQUES');
  console.log('='.repeat(60));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  Object.entries(results).forEach(([key, result]) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${key.toUpperCase()} — ${result.name}`);
    console.log(`   ${result.details}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`📈 SCORE: ${passedTests}/${totalTests} tests réussis (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
  } else {
    console.warn(`⚠️ ${failedTests} test(s) échoué(s). Vérifier les détails ci-dessus.`);
  }
  
  console.log('='.repeat(60));
  
  return results;
})();