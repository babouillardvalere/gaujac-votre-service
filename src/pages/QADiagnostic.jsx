import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prepareWorkItemsForMission } from '../components/workItemFactory';
import { validateBeforeWorkItemCreation } from '../components/qa/ValidationRulesV2';
import { disableQA, enableQA, shouldRunQA } from '../components/qa/QAConfig';
import { CheckCircle, XCircle, AlertTriangle, Bug } from 'lucide-react';

export default function QADiagnostic() {
  const [qaEnabled, setQaEnabled] = useState(true);
  const [testResult, setTestResult] = useState(null);

  // Cas de test réel : Déshivernage
  const testDeshivernage = () => {
    console.log('[QA DIAGNOSTIC] === TEST DÉSHIVERNAGE ===');
    
    const form = {
      typeMission: 'DESHIVERNAGE',
      datePlanifiee: '2026-03-15',
      typeHebergement: 'Mobil-home Classique',
      numerosHebergement: ['R12', 'R13', 'R14'],
      service: 'TECHNIQUE',
      priorite: 'NORMALE',
      taches: [
        { numero: 1, texte: 'Ouvrir eau' },
        { numero: 2, texte: 'Ouvrir gaz' },
        { numero: 3, texte: 'Tester électricité' }
      ],
      description: 'Déshivernage standard zone R'
    };

    console.log('[QA DIAGNOSTIC] Form data:', form);

    const factoryResult = prepareWorkItemsForMission(form);
    console.log('[QA DIAGNOSTIC] Factory result:', factoryResult);

    if (!factoryResult.ok) {
      setTestResult({
        status: 'FACTORY_ERROR',
        level: 'CRITICAL',
        message: factoryResult.error,
        data: form
      });
      return;
    }

    const workItems = factoryResult.workItems;
    const qaResults = [];

    for (let i = 0; i < workItems.length; i++) {
      const wi = workItems[i];
      console.log(`[QA DIAGNOSTIC] Testing WorkItem ${i + 1}:`, wi);
      
      const qaResult = validateBeforeWorkItemCreation(wi, {
        context: 'CREATE',
        strict: true,
        enabled: qaEnabled
      });
      
      console.log(`[QA DIAGNOSTIC] QA Result ${i + 1}:`, qaResult);
      
      qaResults.push({
        workItem: wi,
        qaResult,
        index: i + 1
      });
    }

    setTestResult({
      status: 'COMPLETED',
      form,
      factoryResult,
      qaResults,
      qaEnabled
    });
  };

  // Test avec undefined
  const testUndefined = () => {
    console.log('[QA DIAGNOSTIC] === TEST UNDEFINED ===');
    
    const form = {
      typeMission: 'DESHIVERNAGE',
      datePlanifiee: '2026-03-15',
      typeHebergement: undefined, // PROBLÈME
      numerosHebergement: ['R12'],
      service: 'TECHNIQUE',
      priorite: 'NORMALE',
      taches: [{ numero: 1, texte: 'Test' }],
      description: ''
    };

    const factoryResult = prepareWorkItemsForMission(form);
    
    setTestResult({
      status: factoryResult.ok ? 'COMPLETED' : 'FACTORY_ERROR',
      level: factoryResult.ok ? 'SUCCESS' : 'CRITICAL',
      message: factoryResult.error || 'Factory OK malgré undefined',
      form,
      factoryResult
    });
  };

  // Test sans tâches
  const testNoTasks = () => {
    console.log('[QA DIAGNOSTIC] === TEST SANS TÂCHES ===');
    
    const form = {
      typeMission: 'DESHIVERNAGE',
      datePlanifiee: '2026-03-15',
      typeHebergement: 'Mobil-home Classique',
      numerosHebergement: ['R12'],
      service: 'TECHNIQUE',
      priorite: 'NORMALE',
      taches: [], // PROBLÈME
      description: 'Test sans tâches'
    };

    const factoryResult = prepareWorkItemsForMission(form);
    
    setTestResult({
      status: factoryResult.ok ? 'UNEXPECTED_SUCCESS' : 'EXPECTED_ERROR',
      level: factoryResult.ok ? 'WARNING' : 'SUCCESS',
      message: factoryResult.error || 'Devrait bloquer mais ne bloque pas',
      form,
      factoryResult
    });
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Bug className="w-6 h-6" />
              Diagnostic QA - Direction/Déshivernage
            </CardTitle>
            <p className="text-sm text-gray-600">
              Page de diagnostic pour identifier exactement ce qui bloque la création
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QA Toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-semibold">Système QA</h3>
                <p className="text-sm text-gray-600">
                  {qaEnabled ? 'Actif - validations bloquantes' : 'Désactivé - mode dégradé'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={qaEnabled ? 'default' : 'outline'}
                  onClick={() => {
                    enableQA();
                    setQaEnabled(true);
                  }}
                >
                  Activer QA
                </Button>
                <Button
                  size="sm"
                  variant={!qaEnabled ? 'destructive' : 'outline'}
                  onClick={() => {
                    disableQA();
                    setQaEnabled(false);
                  }}
                >
                  Désactiver QA
                </Button>
              </div>
            </div>

            {/* Tests */}
            <div className="grid md:grid-cols-3 gap-3">
              <Button onClick={testDeshivernage} className="h-auto py-4 flex-col">
                <CheckCircle className="w-5 h-5 mb-2" />
                Test Déshivernage Standard
                <span className="text-xs mt-1">3 zones, 3 tâches</span>
              </Button>
              
              <Button onClick={testUndefined} variant="outline" className="h-auto py-4 flex-col">
                <AlertTriangle className="w-5 h-5 mb-2" />
                Test avec undefined
                <span className="text-xs mt-1">typeHebergement undefined</span>
              </Button>
              
              <Button onClick={testNoTasks} variant="outline" className="h-auto py-4 flex-col">
                <XCircle className="w-5 h-5 mb-2" />
                Test sans tâches
                <span className="text-xs mt-1">taches: []</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Résultats */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Résultats du test
                <Badge variant={
                  testResult.status === 'COMPLETED' ? 'default' :
                  testResult.status === 'EXPECTED_ERROR' ? 'default' :
                  testResult.level === 'CRITICAL' ? 'destructive' : 'secondary'
                }>
                  {testResult.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Données envoyées */}
              <div>
                <h3 className="font-semibold mb-2">📝 Données du formulaire</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
                  {JSON.stringify(testResult.form, null, 2)}
                </pre>
              </div>

              {/* Résultat Factory */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  🏭 Résultat Factory
                  {testResult.factoryResult?.ok ? 
                    <Badge variant="default">OK</Badge> : 
                    <Badge variant="destructive">BLOQUÉ</Badge>
                  }
                </h3>
                {testResult.factoryResult?.error && (
                  <div className="bg-red-50 border border-red-300 p-3 rounded">
                    <p className="text-red-700 font-semibold">❌ {testResult.factoryResult.error}</p>
                  </div>
                )}
                {testResult.factoryResult?.ok && (
                  <p className="text-green-700">
                    ✅ {testResult.factoryResult.workItems.length} WorkItem(s) générés
                  </p>
                )}
              </div>

              {/* Résultats QA */}
              {testResult.qaResults && testResult.qaResults.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">🔍 Validation QA ({testResult.qaEnabled ? 'activée' : 'désactivée'})</h3>
                  <div className="space-y-3">
                    {testResult.qaResults.map((result, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border-2 ${
                        result.qaResult.ok ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-400'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">
                            WorkItem #{result.index} - {result.workItem.hebergement}
                          </h4>
                          {result.qaResult.ok ? 
                            <Badge variant="default">✅ VALIDE</Badge> : 
                            <Badge variant="destructive">❌ BLOQUÉ</Badge>
                          }
                        </div>
                        
                        {!result.qaResult.ok && (
                          <div className="mt-2 space-y-2">
                            <p className="text-red-700 font-semibold">
                              🚫 {result.qaResult.message}
                            </p>
                            <p className="text-sm text-red-600">
                              Niveau : {result.qaResult.level}
                            </p>
                            
                            {/* NOUVEAU: Affichage structuré V2 */}
                            {result.qaResult.qaResult && result.qaResult.qaResult.blockingErrors.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-red-800">Erreurs bloquantes :</h5>
                                {result.qaResult.qaResult.blockingErrors.map((err, i) => (
                                  <div key={i} className="bg-red-100 p-2 rounded text-xs space-y-1">
                                    <div><span className="font-semibold">Code:</span> {err.code}</div>
                                    <div><span className="font-semibold">Message utilisateur:</span> {err.messageUser}</div>
                                    <div><span className="font-semibold">Message dev:</span> {err.messageDev}</div>
                                    <div><span className="font-semibold">Champ:</span> {err.field}</div>
                                    <div><span className="font-semibold">Règle:</span> {err.rule}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                            Voir WorkItem complet
                          </summary>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-48 mt-2">
                            {JSON.stringify(result.workItem, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Guide */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Critères de validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-1">
              <h4 className="font-semibold">✅ Test réussi si :</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Factory génère le bon nombre de WorkItems</li>
                <li>QA valide tous les WorkItems (ou les bloque avec message clair)</li>
                <li>Aucune erreur silencieuse (toujours un message visible)</li>
                <li>Logs console traçables à chaque étape</li>
              </ul>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-semibold text-red-700">❌ Échec si :</h4>
              <ul className="list-disc list-inside space-y-1 text-red-600">
                <li>Blocage sans message d'erreur</li>
                <li>undefined accepté par Factory</li>
                <li>QA bloque sans indiquer quelle règle</li>
                <li>Données invalides créées en base</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}