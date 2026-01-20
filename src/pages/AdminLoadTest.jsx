import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, Database, AlertTriangle, CheckCircle, 
  TrendingUp, Activity, Download, Play, StopCircle,
  Camera, FileText, Clock, GitBranch
} from 'lucide-react';
import { generateAllTestData } from '../components/loadtesting/seed-test-data';
import { runAutoArchiving } from '../components/reception/ArchivageService';
import testSurchargePDF from '../components/loadtesting/test-surcharge-pdf';
import testUploadMassif from '../components/loadtesting/test-upload-massif';
import { 
  POINTS_FORTS, 
  POINTS_CRITIQUES, 
  RECOMMANDATIONS_PAR_MODULE,
  WORST_CASE_SCENARIO,
  PLAN_ACTION,
  PERFORMANCE_ESTIMATES,
  SUCCESS_CRITERIA
} from '../components/loadtesting/RAPPORT_ANALYSE_PERFORMANCE';
import { 
  TEST_SURCHARGE_PDF,
  TEST_UPLOAD_MASSIF,
  TEST_LONGUE_DUREE,
  TEST_MODULE_RECEPTION,
  TEST_OPTIMISATION_IMAGES
} from '../components/loadtesting/TESTS_COMPLEMENTAIRES';
import {
  PROBLEMES_IDENTIFIES,
  PROCEDURE_TEST_COMPLETE,
  CHECKLIST_VALIDATION,
  MESSAGE_SYNTHESE
} from '../components/loadtesting/VERIFICATION_MODULES_CRITIQUES';

export default function AdminLoadTest() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [testingSuivi, setTestingSuivi] = useState(false);
  const [suiviTestResult, setSuiviTestResult] = useState(null);
  const [testingInventaire, setTestingInventaire] = useState(false);
  const [inventaireTestResult, setInventaireTestResult] = useState(null);
  const [testingMassive, setTestingMassive] = useState(false);
  const [massiveTestResult, setMassiveTestResult] = useState(null);

  // Exposer tests dans window pour console
  React.useEffect(() => {
    window.testSurchargePDF = testSurchargePDF;
    window.testUploadMassif = testUploadMassif;
  }, []);

  const handleSeedData = async () => {
    const confirmed = window.confirm(
      '⚠️ ATTENTION: Ceci va générer des centaines de données de test.\n\n' +
      'Assurez-vous d\'être sur un environnement de TEST, PAS en production.\n\n' +
      'Continuer ?'
    );
    
    if (!confirmed) return;
    
    setSeeding(true);
    try {
      const result = await generateAllTestData();
      setSeedResult(result);
    } catch (error) {
      setSeedResult({ success: false, error: error.message });
    } finally {
      setSeeding(false);
    }
  };

  const handleArchiving = async () => {
    setArchiving(true);
    await runAutoArchiving({ showToast: true });
    setArchiving(false);
  };

  const handleTestSuiviEvent = async () => {
    setTestingSuivi(true);
    setSuiviTestResult(null);
    
    try {
      const { createWorkItem } = await import('../components/workItemCreator');
      const { updateWorkItem, pauseWorkItem, resumeWorkItem, completeWorkItem } = await import('../components/workItemUpdater');
      const { base44 } = await import('@/api/base44Client');
      
      const results = {
        etapes: [],
        success: true,
        errors: []
      };
      
      // ÉTAPE 1: Créer un WorkItem de test
      const workItem = await createWorkItem({
        type: 'INTERVENTION_CLIENT',
        service: 'MENAGE',
        statut: 'A_FAIRE',
        priorite: 'NORMALE',
        description_operationnelle: 'Test automatique timeline SuiviEvent',
        hebergement: 'TEST-AUTO',
        stay_id: `TEST-${Date.now()}`
      });
      
      results.etapes.push({ action: 'CREATE', workItemId: workItem.id, timestamp: new Date() });
      
      // Vérifier SuiviEvent CREATION
      await new Promise(r => setTimeout(r, 500)); // Attendre hook
      let events = await base44.entities.SuiviEvent.filter({ workitem_id: workItem.id });
      if (events.length !== 1 || events[0].action !== 'CREATION') {
        results.errors.push('❌ Event CREATION manquant ou incorrect');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'CREATION verified', count: events.length });
      }
      
      // ÉTAPE 2: Prise en charge (A_FAIRE → EN_COURS)
      await updateWorkItem(workItem.id, { 
        statut: 'EN_COURS', 
        collaborateur: 'Test Auto',
        pris_en_charge_par: 'Test Auto'
      });
      
      results.etapes.push({ action: 'PRISE_EN_CHARGE', timestamp: new Date() });
      
      await new Promise(r => setTimeout(r, 500));
      events = await base44.entities.SuiviEvent.filter({ workitem_id: workItem.id });
      if (events.length !== 2 || events[0].action !== 'PRISE_EN_CHARGE') {
        results.errors.push('❌ Event PRISE_EN_CHARGE manquant');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'PRISE_EN_CHARGE verified', count: events.length });
      }
      
      // ÉTAPE 3: Mise en attente
      await pauseWorkItem(workItem.id, {
        raison_attente: 'attente_materiel',
        motif: 'Test matériel manquant',
        delai_estime: '1h'
      });
      
      results.etapes.push({ action: 'MISE_EN_ATTENTE', timestamp: new Date() });
      
      await new Promise(r => setTimeout(r, 500));
      events = await base44.entities.SuiviEvent.filter({ workitem_id: workItem.id });
      if (events.length !== 3 || events[0].action !== 'MISE_EN_ATTENTE') {
        results.errors.push('❌ Event MISE_EN_ATTENTE manquant');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'MISE_EN_ATTENTE verified', count: events.length });
      }
      
      // ÉTAPE 4: Reprise
      await resumeWorkItem(workItem.id);
      
      results.etapes.push({ action: 'REPRISE', timestamp: new Date() });
      
      await new Promise(r => setTimeout(r, 500));
      events = await base44.entities.SuiviEvent.filter({ workitem_id: workItem.id });
      if (events.length !== 4 || events[0].action !== 'REPRISE') {
        results.errors.push('❌ Event REPRISE manquant');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'REPRISE verified', count: events.length });
      }
      
      // ÉTAPE 5: Terminée
      await completeWorkItem(workItem.id, { duree_minutes: 15 });
      
      results.etapes.push({ action: 'TERMINEE', timestamp: new Date() });
      
      await new Promise(r => setTimeout(r, 500));
      events = await base44.entities.SuiviEvent.filter({ workitem_id: workItem.id });
      if (events.length !== 5 || events[0].action !== 'TERMINEE') {
        results.errors.push('❌ Event TERMINEE manquant');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'TERMINEE verified', count: events.length });
      }
      
      // Vérifier ordre chronologique
      const timestamps = events.map(e => new Date(e.timestamp).getTime());
      const sorted = [...timestamps].sort((a, b) => b - a);
      if (JSON.stringify(timestamps) !== JSON.stringify(sorted)) {
        results.errors.push('❌ Ordre chronologique incorrect');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'Ordre chronologique OK' });
      }
      
      results.totalEvents = events.length;
      results.workItemId = workItem.id;
      
      setSuiviTestResult(results);
      
    } catch (error) {
      setSuiviTestResult({
        success: false,
        errors: [error.message],
        etapes: []
      });
    } finally {
      setTestingSuivi(false);
    }
  };

  const handleTestInventaireArrivee = async () => {
    setTestingInventaire(true);
    setInventaireTestResult(null);
    
    try {
      const { base44 } = await import('@/api/base44Client');
      const { createWorkItem } = await import('../components/workItemCreator');
      
      const results = {
        etapes: [],
        success: true,
        errors: []
      };
      
      // ÉTAPE 1: Simuler création WorkItem TECHNIQUE depuis inventaire
      const workItemTechnique = await createWorkItem({
        type: 'INTERVENTION_CLIENT',
        service: 'TECHNIQUE',
        statut: 'A_FAIRE',
        priorite: 'NORMALE',
        description_operationnelle: '1. 🔧 Robinet qui fuit: 1 manquant(s)\n2. 💡 Ampoule grillée: 2 manquant(s)',
        hebergement: 'TEST-M03',
        type_hebergement: 'MH Premium 2ch',
        client_nom: 'Dupont',
        client_prenom: 'Jean',
        date_arrivee: '2026-01-20',
        date_depart: '2026-01-27',
        stay_id: `TEST-ARR-${Date.now()}`,
        autorisation_acces: 'oui'
      });
      
      results.etapes.push({ action: 'CREATE TECHNIQUE', workItemId: workItemTechnique.id });
      
      // ÉTAPE 2: Simuler création WorkItem MENAGE depuis inventaire
      const workItemMenage = await createWorkItem({
        type: 'INTERVENTION_CLIENT',
        service: 'MENAGE',
        statut: 'A_FAIRE',
        priorite: 'URGENTE',
        description_operationnelle: '1. 🍽️ Assiettes cassées: 2 manquant(s)\n2. 🛏️ Draps tachés: 1 manquant(s)',
        hebergement: 'TEST-M03',
        type_hebergement: 'MH Premium 2ch',
        client_nom: 'Dupont',
        client_prenom: 'Jean',
        date_arrivee: '2026-01-20',
        date_depart: '2026-01-27',
        stay_id: `TEST-ARR-${Date.now()}`,
        autorisation_acces: 'non',
        plages_horaires: ['09h - 12h', '17h - 19h']
      });
      
      results.etapes.push({ action: 'CREATE MENAGE', workItemId: workItemMenage.id });
      
      // VÉRIFICATION 1: description_operationnelle non vide
      if (!workItemTechnique.description_operationnelle || workItemTechnique.description_operationnelle.trim() === '') {
        results.errors.push('❌ WorkItem TECHNIQUE: description_operationnelle vide');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'TECHNIQUE: description_operationnelle OK' });
      }
      
      if (!workItemMenage.description_operationnelle || workItemMenage.description_operationnelle.trim() === '') {
        results.errors.push('❌ WorkItem MENAGE: description_operationnelle vide');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'MENAGE: description_operationnelle OK' });
      }
      
      // VÉRIFICATION 2: Services corrects
      if (workItemTechnique.service !== 'TECHNIQUE') {
        results.errors.push('❌ Service incorrect pour TECHNIQUE');
        results.success = false;
      }
      if (workItemMenage.service !== 'MENAGE') {
        results.errors.push('❌ Service incorrect pour MENAGE');
        results.success = false;
      }
      
      // VÉRIFICATION 3: SuiviEvent CREATION créés
      await new Promise(r => setTimeout(r, 500));
      const eventsTechnique = await base44.entities.SuiviEvent.filter({ workitem_id: workItemTechnique.id });
      const eventsMenage = await base44.entities.SuiviEvent.filter({ workitem_id: workItemMenage.id });
      
      if (eventsTechnique.length === 0 || eventsTechnique[0].action !== 'CREATION') {
        results.errors.push('❌ SuiviEvent CREATION manquant pour TECHNIQUE');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'SuiviEvent CREATION OK (TECHNIQUE)' });
      }
      
      if (eventsMenage.length === 0 || eventsMenage[0].action !== 'CREATION') {
        results.errors.push('❌ SuiviEvent CREATION manquant pour MENAGE');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'SuiviEvent CREATION OK (MENAGE)' });
      }
      
      // TEST 2: Prise en charge TECHNIQUE
      const { updateWorkItem } = await import('../components/workItemUpdater');
      await updateWorkItem(workItemTechnique.id, {
        statut: 'EN_COURS',
        collaborateur: 'Marc Test',
        date_prise_en_charge: new Date().toISOString()
      });
      
      results.etapes.push({ action: 'PRISE_EN_CHARGE TECHNIQUE', timestamp: new Date() });
      
      await new Promise(r => setTimeout(r, 500));
      const eventsAfterPEC = await base44.entities.SuiviEvent.filter({ workitem_id: workItemTechnique.id });
      
      if (eventsAfterPEC.length !== 2 || eventsAfterPEC[0].action !== 'PRISE_EN_CHARGE') {
        results.errors.push('❌ SuiviEvent PRISE_EN_CHARGE manquant');
        results.success = false;
      } else {
        results.etapes.push({ verification: 'PRISE_EN_CHARGE créé', collaborateur: eventsAfterPEC[0].collaborateur });
      }
      
      // TEST 3: Timeline cliente
      results.etapes.push({
        info: 'TEST 3 - Chronologie visible dans ClientSuiviWorkItems',
        hebergement: 'TEST-M03',
        workItemIds: [workItemTechnique.id, workItemMenage.id]
      });
      
      results.totalWorkItems = 2;
      results.workItemIds = [workItemTechnique.id, workItemMenage.id];
      
      setInventaireTestResult(results);
      
    } catch (error) {
      setInventaireTestResult({
        success: false,
        errors: [error.message],
        etapes: []
      });
    } finally {
      setTestingInventaire(false);
    }
  };

  const handleTestCreationMassive = async () => {
    const count = parseInt(prompt('Nombre de WorkItems à créer (50/100/300):', '100'), 10);
    if (!count || count < 1) return;
    
    const confirmed = window.confirm(
      `⚠️ ATTENTION: Création de ${count} WorkItems.\n\nContinuer ?`
    );
    if (!confirmed) return;
    
    setTestingMassive(true);
    setMassiveTestResult(null);
    
    try {
      const { createWorkItem } = await import('../components/workItemCreator');
      
      const startTime = Date.now();
      const results = {
        etapes: [],
        success: true,
        errors: [],
        count
      };
      
      // Créer en batch de 20
      const batchSize = 20;
      const batches = Math.ceil(count / batchSize);
      
      for (let batch = 0; batch < batches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, count);
        const batchCount = batchEnd - batchStart;
        
        const promises = [];
        for (let i = 0; i < batchCount; i++) {
          const index = batchStart + i;
          promises.push(
            createWorkItem({
              type: 'INTERVENTION_CLIENT',
              service: index % 2 === 0 ? 'TECHNIQUE' : 'MENAGE',
              statut: 'A_FAIRE',
              priorite: 'NORMALE',
              description_operationnelle: `Test charge massive #${index + 1}`,
              hebergement: `LOAD-${Math.floor(index / 5) + 1}`,
              stay_id: `LOAD-TEST-${Date.now()}-${index}`
            })
          );
        }
        
        await Promise.all(promises);
        results.etapes.push({ batch: batch + 1, created: batchCount });
      }
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      results.duration = duration;
      results.itemsPerSecond = (count / parseFloat(duration)).toFixed(1);
      
      // Seuils de validation
      if (count === 100 && parseFloat(duration) > 3) {
        results.errors.push(`⚠️ Objectif non atteint: ${duration}s > 3s pour 100 WorkItems`);
      } else if (count === 300 && parseFloat(duration) > 8) {
        results.errors.push(`⚠️ Objectif non atteint: ${duration}s > 8s pour 300 WorkItems`);
      } else {
        results.etapes.push({ validation: `✅ Performance acceptable: ${duration}s` });
      }
      
      setMassiveTestResult(results);
      
    } catch (error) {
      setMassiveTestResult({
        success: false,
        errors: [error.message],
        etapes: []
      });
    } finally {
      setTestingMassive(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-4xl text-[#0077A8] mb-2">
            🔥 Test de Charge - Camping Paradis
          </h1>
          <p className="text-gray-600">
            Validation performance pour 500 utilisateurs simultanés
          </p>
        </div>

        {/* Alerte environnement */}
        <Alert className="mb-6 border-2 border-red-500 bg-red-50">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-800 font-bold">
            ⚠️ Cette page est réservée aux tests de charge sur environnement de PRÉ-PRODUCTION uniquement.
            NE JAMAIS utiliser en production !
          </AlertDescription>
        </Alert>

        {/* Alertes problèmes critiques */}
        <Card className="mb-6 border-2 border-red-600 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-6 h-6" />
              🔴 PROBLÈMES CRITIQUES DÉTECTÉS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(PROBLEMES_IDENTIFIES).map(([key, prob]) => (
              <div key={key} className="bg-white border-2 border-red-400 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading text-lg text-red-900">
                    {key.replace(/_/g, ' ')}
                  </h3>
                  <Badge className="bg-red-600">{prob.statut}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {prob.problemes.map((p, idx) => (
                    <p key={idx} className="text-red-700">{p}</p>
                  ))}
                  <p className="text-red-800 font-bold mt-3">
                    ⚠️ Impact: {prob.impact}
                  </p>
                  <p className="text-gray-700">
                    🔍 Cause probable: {prob.cause_probable}
                  </p>
                </div>
              </div>
            ))}
            
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertDescription className="text-yellow-900">
                <strong>📅 Ces problèmes doivent être corrigés AVANT les tests de charge.</strong>
                <br />Voir VERIFICATION_MODULES_CRITIQUES.jsx pour procédure détaillée.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card className="mb-6 border-2 border-[#00AEEF]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-6 h-6 text-[#00AEEF]" />
              Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleSeedData}
              disabled={seeding}
              className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8]"
            >
              <Database className="w-5 h-5 mr-2" />
              {seeding ? 'Génération en cours...' : '🌱 Générer données de test (300+ fiches, 500+ incidents)'}
            </Button>
            
            {seedResult && (
              <Alert className={seedResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                <AlertDescription>
                  {seedResult.success 
                    ? `✅ Données générées avec succès en ${seedResult.duration}s`
                    : `❌ Erreur: ${seedResult.error}`}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleArchiving}
              disabled={archiving}
              variant="outline"
              className="w-full h-12"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              {archiving ? 'Archivage...' : '📦 Lancer archivage automatique (>30j)'}
            </Button>

            <Button
              onClick={handleTestCreationMassive}
              disabled={testingMassive}
              className="w-full h-14 bg-red-600 hover:bg-red-700"
            >
              <Zap className="w-5 h-5 mr-2" />
              {testingMassive ? 'Test en cours...' : '🔥 Test Création Massive (50/100/300 WorkItems)'}
            </Button>
            
            {massiveTestResult && (
              <Alert className={massiveTestResult.success && massiveTestResult.errors.length === 0 ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-bold text-gray-800">
                      📊 {massiveTestResult.count} WorkItems créés en {massiveTestResult.duration}s
                    </p>
                    <p className="text-sm text-gray-700">
                      ⚡ Vitesse: {massiveTestResult.itemsPerSecond} WorkItems/seconde
                    </p>
                    {massiveTestResult.errors.length > 0 && (
                      <div className="text-xs text-orange-700 space-y-1">
                        {massiveTestResult.errors.map((err, i) => (
                          <p key={i}>{err}</p>
                        ))}
                      </div>
                    )}
                    {massiveTestResult.errors.length === 0 && (
                      <p className="text-xs text-green-700">✅ Performance dans les objectifs</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleTestInventaireArrivee}
              disabled={testingInventaire}
              className="w-full h-14 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {testingInventaire ? 'Test en cours...' : '✅ Test Inventaire Arrivée (3 tests intégrés)'}
            </Button>
            
            {inventaireTestResult && (
              <Alert className={inventaireTestResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                <AlertDescription>
                  {inventaireTestResult.success ? (
                    <div className="space-y-2">
                      <p className="font-bold text-green-800">✅ Tests réussis - {inventaireTestResult.totalWorkItems} WorkItems créés</p>
                      <div className="text-xs text-green-700 space-y-1">
                        {inventaireTestResult.etapes.filter(e => e.verification).map((e, i) => (
                          <p key={i}>✓ {e.verification}</p>
                        ))}
                      </div>
                      <div className="bg-white p-2 rounded border border-green-300 mt-2">
                        <p className="text-xs font-bold text-gray-700 mb-1">🔍 Vérifier dans ClientSuiviWorkItems:</p>
                        <p className="text-xs text-gray-600">Logement: TEST-M03</p>
                        <div className="flex gap-2 mt-1">
                          {inventaireTestResult.workItemIds?.map(id => (
                            <code key={id} className="text-xs bg-gray-100 px-1 rounded">{id.substring(0, 8)}...</code>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-bold text-red-800">❌ Tests échoués</p>
                      {inventaireTestResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-700">{err}</p>
                      ))}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleTestSuiviEvent}
              disabled={testingSuivi}
              className="w-full h-14 bg-purple-600 hover:bg-purple-700"
            >
              <GitBranch className="w-5 h-5 mr-2" />
              {testingSuivi ? 'Test en cours...' : '🧪 Test Timeline SuiviEvent (5 transitions)'}
            </Button>
            
            {suiviTestResult && (
              <Alert className={suiviTestResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                <AlertDescription>
                  {suiviTestResult.success ? (
                    <div className="space-y-2">
                      <p className="font-bold text-green-800">✅ Test réussi - {suiviTestResult.totalEvents} événements créés</p>
                      <div className="text-xs text-green-700 space-y-1">
                        {suiviTestResult.etapes.filter(e => e.verification).map((e, i) => (
                          <p key={i}>✓ {e.verification} ({e.count || 'OK'})</p>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">WorkItem: {suiviTestResult.workItemId}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-bold text-red-800">❌ Test échoué</p>
                      {suiviTestResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-red-700">{err}</p>
                      ))}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
              <p className="text-sm font-bold text-purple-900 mb-2">🧪 Tests Complémentaires</p>
              <p className="text-xs text-purple-700 mb-3">
                Exécuter dans la console navigateur (F12)
              </p>
              <div className="space-y-2 text-xs">
                <div className="bg-white p-2 rounded border border-purple-200">
                  <code className="text-purple-800">await window.testSurchargePDF(50)</code>
                  <p className="text-gray-600 mt-1">Test 50 PDFs simultanés</p>
                </div>
                <div className="bg-white p-2 rounded border border-purple-200">
                  <code className="text-purple-800">await window.testUploadMassif(200, 50)</code>
                  <p className="text-gray-600 mt-1">Test 200 photos en batch de 50</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
              <p className="text-sm font-bold text-blue-900 mb-2">📥 Documentation Complète</p>
              <p className="text-xs text-blue-700 mb-3">
                Scripts de test et analyses sécurité/performance
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => window.open('/components/loadtesting/k6-load-test.js', '_blank')}
                  variant="outline"
                  size="sm"
                  className="border-blue-500 w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Script K6 Standard (500 users)
                </Button>
                <Button
                  onClick={() => window.open('/components/loadtesting/k6-longue-duree.js', '_blank')}
                  variant="outline"
                  size="sm"
                  className="border-purple-500 w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Script K6 Longue Durée (6h)
                </Button>
                <Button
                  onClick={() => window.open('/components/loadtesting/SECURITE_ET_ISOLATION.jsx', '_blank')}
                  variant="outline"
                  size="sm"
                  className="border-red-500 w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  🔒 Sécurité & Isolation
                </Button>
                <Button
                  onClick={() => window.open('/components/loadtesting/TESTS_COMPLEMENTAIRES.jsx', '_blank')}
                  variant="outline"
                  size="sm"
                  className="border-green-500 w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  📋 Tests Complémentaires
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points forts */}
        <Card className="mb-6 border-2 border-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-6 h-6" />
              ✅ Points Forts de l'Architecture
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {Object.entries(POINTS_FORTS).map(([key, point]) => (
                <div key={key} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-green-100 text-green-800">{point.status}</Badge>
                    <h3 className="font-heading text-lg text-gray-900">
                      {key.replace(/_/g, ' ')}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700">{point.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Impact: {point.impact}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tests complémentaires */}
        <Card className="mb-6 border-2 border-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Activity className="w-6 h-6" />
              🧪 Tests Complémentaires Techniques
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-lg text-red-900 mb-1">
                      Test 1: Surcharge PDF (30-50 simultanés)
                    </h3>
                    <p className="text-sm text-red-700 mb-2">
                      {TEST_SURCHARGE_PDF.objectif}
                    </p>
                    <Badge className="bg-red-600 mb-2">CRITIQUE</Badge>
                    <div className="text-xs text-gray-700 space-y-1 mt-2">
                      <p><strong>Scénario:</strong> Samedi 10h-12h, 40-50 PDFs en 30 min</p>
                      <p><strong>Métriques:</strong> Temps génération P95 &lt; 10s, taux erreur 0%</p>
                      <p><strong>Exécution:</strong> <code className="bg-white px-1 rounded">await window.testSurchargePDF(50)</code></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <div className="flex items-start gap-3">
                  <Camera className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-lg text-blue-900 mb-1">
                      Test 2: Upload massif photos (150-200 images)
                    </h3>
                    <p className="text-sm text-blue-700 mb-2">
                      {TEST_UPLOAD_MASSIF.objectif}
                    </p>
                    <Badge className="bg-blue-600 mb-2">HAUTE</Badge>
                    <div className="text-xs text-gray-700 space-y-1 mt-2">
                      <p><strong>Scénario:</strong> 40 inventaires × 5 photos = 200 uploads</p>
                      <p><strong>Métriques:</strong> Compression &lt; 2s/photo, upload &lt; 5s/photo</p>
                      <p><strong>Exécution:</strong> <code className="bg-white px-1 rounded">await window.testUploadMassif(200, 50)</code></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-lg text-orange-900 mb-1">
                      Test 3: Charge longue durée (6 heures)
                    </h3>
                    <p className="text-sm text-orange-700 mb-2">
                      {TEST_LONGUE_DUREE.objectif}
                    </p>
                    <Badge className="bg-orange-600 mb-2">HAUTE</Badge>
                    <div className="text-xs text-gray-700 space-y-1 mt-2">
                      <p><strong>Scénario:</strong> 200 users constants pendant 6h</p>
                      <p><strong>Métriques:</strong> Mémoire stable, CPU &lt; 60%, pas de dégradation</p>
                      <p><strong>Exécution:</strong> <code className="bg-white px-1 rounded">k6 run k6-longue-duree.js</code></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <div className="flex items-start gap-3">
                  <Activity className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-lg text-green-900 mb-1">
                      Test 4: Navigation réelle Module Réception
                    </h3>
                    <p className="text-sm text-green-700 mb-2">
                      Parcours complet: mois → semaine → dossier → inventaire → PDF
                    </p>
                    <Badge className="bg-green-600 mb-2">MOYENNE</Badge>
                    <div className="text-xs text-gray-700 space-y-1 mt-2">
                      <p><strong>Scénario:</strong> 10 agents réception × 10 dossiers chacun</p>
                      <p><strong>Métriques:</strong> Temps chargement, transitions, isolation données</p>
                      <p><strong>Méthode:</strong> Script Puppeteer/Playwright ou test manuel</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                <div className="flex items-start gap-3">
                  <Camera className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-lg text-yellow-900 mb-1">
                      Test 5: Optimisation images & cache
                    </h3>
                    <p className="text-sm text-yellow-700 mb-2">
                      Audit format, compression, CDN, chargement
                    </p>
                    <Badge className="bg-yellow-600 mb-2">MOYENNE</Badge>
                    <div className="text-xs text-gray-700 space-y-1 mt-2">
                      <p><strong>Vérifier:</strong> WebP, compression, cache CDN, lazy loading</p>
                      <p><strong>Objectif:</strong> Photos &lt; 400KB, gain stockage 70-80%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Points critiques */}
        <Card className="mb-6 border-2 border-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-6 h-6" />
              🔴 Points Critiques à Traiter
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-6">
              {Object.entries(POINTS_CRITIQUES).map(([key, point]) => (
                <div key={key} className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge className={
                        point.status.includes('CRITIQUE') ? 'bg-red-600' :
                        point.status.includes('MOYEN') ? 'bg-orange-500' :
                        'bg-yellow-500'
                      }>
                        {point.status}
                      </Badge>
                      <h3 className="font-heading text-xl text-gray-900 mt-2">
                        {key.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    <Badge variant="outline" className="border-red-500 text-red-700">
                      {point.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{point.description}</p>
                  {point.impact_500_users && (
                    <p className="text-xs text-red-700 font-bold mb-2">
                      ⚠️ Impact 500 users: {point.impact_500_users}
                    </p>
                  )}
                  <pre className="bg-white p-3 rounded text-xs text-gray-800 whitespace-pre-wrap border border-red-200">
                    {point.solution_immediate}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scénario pire cas */}
        <Card className="mb-6 border-2 border-orange-500">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Activity className="w-6 h-6" />
              🔥 Scénario Pire Cas - Samedi Haute Saison
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-700 mb-4">
              <strong>{WORST_CASE_SCENARIO.description}</strong>
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Object.entries(WORST_CASE_SCENARIO.simultane).map(([action, detail]) => (
                <div key={action} className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <p className="font-bold text-orange-900 text-sm">{action}</p>
                  <p className="text-xs text-orange-700">{detail}</p>
                </div>
              ))}
            </div>

            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
              <p className="font-bold text-red-800 mb-2">⚠️ Risques Identifiés:</p>
              <ul className="space-y-1 text-sm text-red-700">
                {WORST_CASE_SCENARIO.risques_identifies.map((risque, idx) => (
                  <li key={idx}>• {risque}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Plan d'action */}
        <Card className="mb-6 border-2 border-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Zap className="w-6 h-6" />
              🎯 Plan d'Action Priorisé
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <h3 className="font-heading text-lg text-blue-900 mb-3">
              AVANT HAUTE SAISON (5-7 jours)
            </h3>
            <div className="space-y-3">
              {PLAN_ACTION.AVANT_HAUTE_SAISON.map((item, idx) => (
                <div key={idx} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-bold text-blue-900">{item.action}</p>
                    <Badge>{item.delai}</Badge>
                  </div>
                  <div className="flex gap-2 text-xs mb-1">
                    <Badge variant="outline">{item.complexite}</Badge>
                    <Badge className={
                      item.impact === 'CRITIQUE' || item.impact === 'TRÈS ÉLEVÉ' ? 'bg-red-600' :
                      item.impact === 'ÉLEVÉ' ? 'bg-orange-500' : 'bg-yellow-500'
                    }>
                      Impact: {item.impact}
                    </Badge>
                  </div>
                  {item.details && (
                    <p className="text-xs text-gray-600 mt-2">{item.details}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estimations performance */}
        <Card className="border-2 border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-6 h-6" />
              📊 Estimations Temps de Réponse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(PERFORMANCE_ESTIMATES).map(([module, estimate]) => (
                <div key={module} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-heading text-base text-gray-900">{module}</h3>
                    <Badge className={
                      estimate.conforme_objectif.includes('OUI') ? 'bg-green-500' :
                      estimate.conforme_objectif.includes('NON') ? 'bg-red-500' :
                      'bg-yellow-500'
                    }>
                      {estimate.conforme_objectif}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-gray-600">Actuel estimé:</span>
                      <span className="font-bold ml-2 text-gray-900">{estimate.actuel_estime}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avec optimisations:</span>
                      <span className="font-bold ml-2 text-green-700">{estimate.avec_optimisations}</span>
                    </div>
                  </div>
                  <p className="text-xs text-red-600">
                    🎯 Goulot: {estimate.goulot}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documentation */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
          <h2 className="font-heading text-2xl text-blue-900 mb-4">
            📚 Documentation Complète
          </h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p>✅ Stratégie complète: <code className="bg-white px-2 py-1 rounded">components/loadtesting/LOAD_TESTING_STRATEGY.jsx</code></p>
            <p>✅ Rapport analyse: <code className="bg-white px-2 py-1 rounded">components/loadtesting/RAPPORT_ANALYSE_PERFORMANCE.jsx</code></p>
            <p>🔒 Sécurité & isolation: <code className="bg-white px-2 py-1 rounded">components/loadtesting/SECURITE_ET_ISOLATION.jsx</code></p>
            <p>✅ Script K6: <code className="bg-white px-2 py-1 rounded">components/loadtesting/k6-load-test.js</code></p>
            <p>✅ Seed données: <code className="bg-white px-2 py-1 rounded">components/loadtesting/seed-test-data.js</code></p>
            <p>✅ Index BDD: <code className="bg-white px-2 py-1 rounded">components/DATABASE_INDEXING.jsx</code></p>
            <p>🧪 Tests complémentaires: <code className="bg-white px-2 py-1 rounded">components/loadtesting/TESTS_COMPLEMENTAIRES.jsx</code></p>
            <p>🔥 Test surcharge PDF: <code className="bg-white px-2 py-1 rounded">components/loadtesting/test-surcharge-pdf.js</code></p>
            <p>📸 Test upload massif: <code className="bg-white px-2 py-1 rounded">components/loadtesting/test-upload-massif.js</code></p>
            <p>⏱️ Script K6 6h: <code className="bg-white px-2 py-1 rounded">components/loadtesting/k6-longue-duree.js</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}