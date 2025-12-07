import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, Database, AlertTriangle, CheckCircle, 
  TrendingUp, Activity, Download, Play, StopCircle,
  Camera, FileText, Clock
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