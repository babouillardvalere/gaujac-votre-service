/**
 * Panneau d'accès aux tests QA suppression
 * À intégrer au Bureau pour validation
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { runAllSuppressionTests, testNoCascadeOrphans } from './TestSuppression';
import { getSuppressionCountToday } from '../interventionDeletionAudit';

export default function SuppressionTestsPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [suppCount, setSuppCount] = useState(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await runAllSuppressionTests();
      setResults(testResults);
      
      const count = await getSuppressionCountToday();
      setSuppCount(count);
      
      const orphanTest = testResults.tests.orphans;
      if (orphanTest.success) {
        toast.success(`✅ ${orphanTest.totalWorkItems} WorkItems, 0 orphelin`);
      } else {
        toast.error(`❌ ${orphanTest.orphanCount} orphelin(s) détecté(s)`);
      }
    } catch (error) {
      toast.error('Erreur lors des tests');
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Tests QA — Suppression Cascade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bouton test */}
        <Button
          onClick={handleRunTests}
          disabled={isRunning}
          className="w-full flex items-center gap-2"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <TestTube className="w-4 h-4" />
          )}
          Lancer les tests
        </Button>

        {/* Résultats */}
        {results && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500">
              Test lancé: {new Date(results.timestamp).toLocaleString()}
            </div>

            {/* Test Orphelins */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Orphelins</span>
                {results.tests.orphans.success ? (
                  <Badge className="bg-green-500">✅ OK</Badge>
                ) : (
                  <Badge className="bg-red-500">❌ ERREUR</Badge>
                )}
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  WorkItems vérifiés: <strong>{results.tests.orphans.totalWorkItems}</strong>
                </div>
                <div>
                  Orphelins trouvés: <strong>{results.tests.orphans.orphanCount || 0}</strong>
                </div>
              </div>
            </div>

            {/* Test Deleted Flag */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Deleted Flag</span>
                {results.tests.deletedFlag.success ? (
                  <Badge className="bg-green-500">✅ OK</Badge>
                ) : (
                  <Badge className="bg-red-500">❌ ERREUR</Badge>
                )}
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  Total interventions: <strong>{results.tests.deletedFlag.totalIncidents}</strong>
                </div>
                <div>
                  Actives: <strong>{results.tests.deletedFlag.activeIncidents}</strong>
                </div>
                <div>
                  Supprimées: <strong>{results.tests.deletedFlag.deletedIncidents}</strong>
                </div>
              </div>
            </div>

            {/* Statistiques du jour */}
            {suppCount && (
              <div className="p-3 bg-blue-50 rounded-lg space-y-2 border border-blue-200">
                <div className="text-sm font-semibold text-blue-900">Aujourd'hui</div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>
                    Suppressions: <strong>{suppCount.count}</strong>
                  </div>
                  <div>
                    WorkItems supprimés: <strong>{suppCount.totalWorkItems}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Résumé global */}
            <div className="p-3 border-t-2 pt-3 flex items-center gap-2">
              {results.tests.orphans.success && results.tests.deletedFlag.success ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">
                    Tous les tests passés ✅
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-semibold text-red-600">
                    Certains tests échoués ❌
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}