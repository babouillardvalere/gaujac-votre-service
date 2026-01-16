import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Download, Trash2, RefreshCw, AlertCircle, 
  CheckCircle, XCircle, Activity, Database, Wifi, Bug 
} from 'lucide-react';
import { createPageUrl } from '../utils';
import errorLogger from '../components/qa/ErrorLogger';
import smokeTests from '../components/qa/SmokeTests';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';

export default function QASante() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ type: 'all' });
  const [testResults, setTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Vérification accès admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
          toast.error('Accès réservé aux administrateurs');
          navigate(createPageUrl('Home'));
        } else {
          setIsAdmin(true);
        }
      } catch {
        navigate(createPageUrl('Home'));
      }
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [filter, isAdmin]);

  const loadLogs = () => {
    let filtered = errorLogger.getLogs();
    
    // Filtrer par type ou severity
    if (filter.type === 'critical') {
      filtered = filtered.filter(l => l.severity === 'CRITICAL');
    } else if (filter.type !== 'all') {
      filtered = filtered.filter(l => l.type === filter.type);
    }
    
    setLogs(filtered);
  };

  const handleExportReport = () => {
    const report = errorLogger.exportReport();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${new Date().toISOString()}.json`;
    a.click();
    toast.success('Rapport exporté ✅');
  };

  const handleClearLogs = () => {
    if (confirm('Supprimer tous les logs ?')) {
      errorLogger.clearLogs();
      loadLogs();
      toast.success('Logs supprimés');
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    toast.info('Exécution des smoke tests...');
    
    try {
      const results = await smokeTests.runAllTests();
      setTestResults(results);
      
      if (results.summary.failed === 0) {
        toast.success('✅ Tous les tests passent !');
      } else {
        toast.error(`❌ ${results.summary.failed} test(s) échoué(s)`);
      }
    } catch (error) {
      toast.error('Erreur lors des tests');
      console.error(error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const getLogIcon = (type) => {
    switch(type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'api': return <Wifi className="w-4 h-4 text-blue-500" />;
      case 'data': return <Database className="w-4 h-4 text-purple-500" />;
      default: return <Bug className="w-4 h-4 text-gray-500" />;
    }
  };

  const stats = {
    total: logs.length,
    critical: logs.filter(l => l.severity === 'CRITICAL').length,
    high: logs.filter(l => l.severity === 'HIGH').length,
    errors: logs.filter(l => l.type === 'error').length,
    warnings: logs.filter(l => l.type === 'warning').length,
    apiErrors: logs.filter(l => l.category === 'api_error').length,
    dataErrors: logs.filter(l => l.category === 'data_integrity').length
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      <Logo className="h-16 mb-4" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(createPageUrl('DirectionMenu'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">Retour</span>
          </button>
          <h1 className="font-handwritten text-3xl text-[#0077A8]">
            🩺 Santé du Système
          </h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Rapport
          </Button>
          <Button onClick={handleClearLogs} variant="outline" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Logs
          </Button>
          <Button onClick={loadLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card className={stats.critical > 0 ? 'border-2 border-red-500 animate-pulse' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">🚨 CRITICAL</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            {stats.critical > 0 && (
              <p className="text-xs text-red-600 mt-1 font-semibold">APP NON EXPLOITABLE</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">⚠️ High</p>
                <p className="text-2xl font-bold text-orange-500">{stats.high}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Logs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Warnings</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.warnings}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">API Errors</p>
                <p className="text-2xl font-bold text-blue-500">{stats.apiErrors}</p>
              </div>
              <Wifi className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Data Errors</p>
                <p className="text-2xl font-bold text-purple-500">{stats.dataErrors}</p>
              </div>
              <Database className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerte critique */}
      {stats.critical > 0 && (
        <Card className="mb-6 border-2 border-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-bold text-red-800">🚨 ALERTE CRITIQUE</p>
                <p className="text-sm text-red-700">
                  {stats.critical} erreur(s) critique(s) détectée(s). L'application peut être non exploitable.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs Système</TabsTrigger>
          <TabsTrigger value="tests">Smoke Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filtres */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter.type === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter({ type: 'all' })}
            >
              Tous
            </Button>
            <Button
              variant={filter.type === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter({ type: 'critical' })}
              className={stats.critical > 0 ? 'border-red-500 text-red-600' : ''}
            >
              🚨 Critical ({stats.critical})
            </Button>
            <Button
              variant={filter.type === 'error' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter({ type: 'error' })}
            >
              Erreurs ({stats.errors})
            </Button>
            <Button
              variant={filter.type === 'warning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter({ type: 'warning' })}
            >
              Warnings ({stats.warnings})
            </Button>
            <Button
              variant={filter.type === 'api' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter({ type: 'api' })}
            >
              API
            </Button>
            <Button
              variant={filter.type === 'data' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter({ type: 'data' })}
            >
              Data
            </Button>
          </div>

          {/* Liste des logs */}
          <Card>
            <CardContent className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun log</p>
              ) : (
                logs.map(log => (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-3 hover:bg-gray-50 transition-colors ${
                      log.severity === 'CRITICAL' ? 'border-red-500 bg-red-50' :
                      log.severity === 'HIGH' ? 'border-orange-500 bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getLogIcon(log.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {log.severity === 'CRITICAL' && (
                              <Badge className="bg-red-600 text-white text-xs">🚨 CRITICAL</Badge>
                            )}
                            {log.severity === 'HIGH' && (
                              <Badge className="bg-orange-500 text-white text-xs">⚠️ HIGH</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {log.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <p className="font-semibold text-sm">{log.message}</p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>👤 {log.user}</span>
                            <span>📍 {log.url}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Smoke Tests Automatisés</span>
                <Button
                  onClick={handleRunTests}
                  disabled={isRunningTests}
                  className="bg-[#00AEEF]"
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Tests en cours...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2" />
                      Lancer les tests
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!testResults ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun test exécuté</p>
                  <p className="text-sm mt-1">Cliquez sur "Lancer les tests" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Résumé */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-xs text-blue-600">Total</p>
                      <p className="text-2xl font-bold">{testResults.summary.total}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-xs text-green-600">Réussis</p>
                      <p className="text-2xl font-bold text-green-600">{testResults.summary.passed}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-xs text-red-600">Échoués</p>
                      <p className="text-2xl font-bold text-red-600">{testResults.summary.failed}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-xs text-purple-600">Taux réussite</p>
                      <p className="text-2xl font-bold text-purple-600">{testResults.summary.passRate}</p>
                    </div>
                  </div>

                  {/* Détail tests */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Résultats détaillés</h3>
                    {testResults.tests.map((test, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-lg p-3 ${
                          test.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {test.passed ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-semibold">{test.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(test.timestamp).toLocaleTimeString('fr-FR')}
                          </span>
                        </div>
                        {!test.passed && test.details && (
                          <pre className="text-xs bg-white p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Échecs critiques */}
                  {testResults.criticalFailures?.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                      <h3 className="font-semibold text-red-800 mb-2">
                        ⚠️ Échecs Critiques ({testResults.criticalFailures.length})
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {testResults.criticalFailures.map((test, idx) => (
                          <li key={idx} className="text-red-700">• {test.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}