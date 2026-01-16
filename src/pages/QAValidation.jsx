import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import { detectAnomalies } from '../components/qa/ValidationRules';

export default function QAValidation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState(null);

  const handleDetectAnomalies = async () => {
    setLoading(true);
    try {
      const detected = await detectAnomalies(base44);
      setAnomalies(detected);
    } catch (error) {
      console.error('Erreur détection anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = anomalies?.filter(a => a.severity === 'CRITICAL').length || 0;
  const warningCount = anomalies?.filter(a => a.severity === 'WARNING').length || 0;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(createPageUrl('DirectionMenu'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">Retour</span>
          </button>
          
          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-2">
            🛡️ Validation Qualité
          </h1>
          <p className="text-center text-gray-600 font-body">
            Détection d'anomalies (le système REFUSE les données invalides, ne corrige pas)
          </p>
        </motion.div>

        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Principe de validation stricte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900">
            <p className="font-semibold">✅ Le système BLOQUE les données invalides</p>
            <p className="font-semibold">❌ Le système NE corrige JAMAIS automatiquement</p>
            <div className="mt-4 bg-white p-3 rounded border border-blue-300">
              <p className="text-xs font-bold mb-2">Règles actives:</p>
              <ul className="text-xs space-y-1">
                <li>• WorkItem DOIT avoir description_operationnelle</li>
                <li>• WorkItem DOIT avoir une origine (intervention/mission/incident)</li>
                <li>• InterventionClient DOIT avoir tâches OU description</li>
                <li>• MissionDirection DOIT avoir zones</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center mb-6">
          <Button 
            onClick={handleDetectAnomalies}
            disabled={loading}
            className="h-12 px-8 bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 mr-2" />
                🔍 Détecter les anomalies
              </>
            )}
          </Button>
        </div>

        {anomalies && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className={criticalCount > 0 ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {criticalCount > 0 ? (
                    <>
                      <XCircle className="w-6 h-6 text-red-600" />
                      <span className="text-red-800">{criticalCount} anomalie(s) CRITIQUE(s)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-green-800">Aucune anomalie critique détectée</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {warningCount > 0 && (
                  <p className="text-sm text-orange-700 mb-4">
                    ⚠️ {warningCount} avertissement(s)
                  </p>
                )}
                <p className="text-xs text-gray-600">
                  {anomalies.length === 0 ? 
                    '✅ Toutes les validations strictes sont respectées.' :
                    'Les anomalies ci-dessous nécessitent une ACTION MANUELLE (pas de correction automatique).'
                  }
                </p>
              </CardContent>
            </Card>

            {anomalies.length > 0 && (
              <div className="space-y-3">
                {anomalies.map((anomaly, idx) => (
                  <Card 
                    key={idx} 
                    className={
                      anomaly.severity === 'CRITICAL' ? 'border-red-400 bg-red-50' :
                      anomaly.severity === 'WARNING' ? 'border-orange-400 bg-orange-50' :
                      'border-gray-400 bg-gray-50'
                    }
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {anomaly.severity === 'CRITICAL' && (
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-sm">
                              {anomaly.type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">{anomaly.message}</p>
                          </div>
                        </div>
                        <span className={`
                          text-xs font-bold px-2 py-1 rounded
                          ${anomaly.severity === 'CRITICAL' ? 'bg-red-200 text-red-800' : 
                            anomaly.severity === 'WARNING' ? 'bg-orange-200 text-orange-800' :
                            'bg-gray-200 text-gray-800'}
                        `}>
                          {anomaly.severity}
                        </span>
                      </div>
                      
                      {anomaly.count && (
                        <p className="text-xs text-gray-700 mt-2">
                          <span className="font-semibold">Nombre d'entités:</span> {anomaly.count}
                        </p>
                      )}
                      
                      {anomaly.ids && anomaly.ids.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                            Voir les IDs affectés ({anomaly.ids.length})
                          </summary>
                          <div className="mt-2 bg-white p-2 rounded border border-gray-300 max-h-40 overflow-auto">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                              {anomaly.ids.join('\n')}
                            </pre>
                          </div>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}