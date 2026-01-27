import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import { cleanAllDuplicates } from '../components/missions/missionDirectionFactory';

export default function AdminDeduplicationAuto() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // LANCER IMMÉDIATEMENT au chargement de la page
    if (!running && !resultat) {
      executeDeduplication();
    }
  }, []);

  const executeDeduplication = async () => {
    setRunning(true);
    
    console.log('='.repeat(80));
    console.log('🚀 DÉDUPLICATION AUTOMATIQUE EN COURS');
    console.log('='.repeat(80));
    
    try {
      const result = await deduplicateMissions();
      setResultat(result);
      
      console.log('='.repeat(80));
      console.log('✅ DÉDUPLICATION TERMINÉE');
      console.log(`📊 ${result.doublons} groupe(s) avec doublons`);
      console.log(`🗑️ ${result.supprimees} mission(s) supprimée(s)`);
      console.log(`🔗 ${result.rattachees} WorkItem(s) rattaché(s)`);
      console.log('='.repeat(80));
      
      if (result.supprimees === 0) {
        toast.success('✅ Aucun doublon trouvé - base de données propre');
      } else {
        toast.success(`✅ NETTOYAGE RÉUSSI : ${result.supprimees} missions supprimées`, { duration: 10000 });
      }
    } catch (error) {
      console.error('❌ ERREUR DÉDUPLICATION:', error);
      toast.error('❌ Erreur lors de la déduplication');
      setResultat({ error: error.message });
    } finally {
      setRunning(false);
    }
  };

  // Pas de confirmation - exécution automatique au chargement

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl('DirectionMenu'))}
          className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          disabled={running}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-heading">Retour</span>
        </button>
        
        <Logo className="h-16 mb-4" />
        
        <h1 className="font-handwritten text-3xl text-[#0077A8] text-center mb-6">
          🧹 Déduplication en cours
        </h1>

        <div className="space-y-4">
          {running && (
            <Card className="border-2 border-blue-400 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-700 flex-shrink-0" />
                  <div>
                    <h3 className="font-heading text-lg text-blue-900 mb-1">
                      Traitement en cours...
                    </h3>
                    <p className="text-sm text-blue-800">
                      Identification et suppression des doublons
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {resultat && !resultat.error && (
            <Card className="border-2 border-green-400 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-8 h-8 text-green-700 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-heading text-xl text-green-900 mb-3">
                      ✅ Déduplication terminée avec succès
                    </h3>
                    
                    <div className="space-y-3 text-sm text-green-800">
                      <div className="bg-green-100 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-green-900 mb-2">
                          📊 Résultats
                        </p>
                        <div className="space-y-2">
                          <p>🔍 <strong>{resultat.doublons}</strong> groupe(s) avec doublons identifié(s)</p>
                          <p>🗑️ <strong>{resultat.supprimees}</strong> mission(s) supprimée(s)</p>
                          <p>🔗 <strong>{resultat.rattachees}</strong> WorkItem(s) rattaché(s)</p>
                        </div>
                      </div>

                      {resultat.supprimees === 0 ? (
                        <p className="text-green-700 font-bold">
                          ✨ Base de données déjà propre - aucun doublon détecté
                        </p>
                      ) : (
                        <div className="bg-white p-3 rounded border-2 border-green-300">
                          <p className="font-bold text-green-900 mb-1">✅ Nettoyage réussi</p>
                          <p className="text-xs text-green-700">
                            Les missions en double ont été supprimées et les WorkItems rattachés.
                            Le système est maintenant cohérent.
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => navigate(createPageUrl('MissionsDirection'))}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    >
                      Voir les missions nettoyées
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {resultat?.error && (
            <Card className="border-2 border-red-400 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-700 flex-shrink-0" />
                  <div>
                    <h3 className="font-heading text-lg text-red-900 mb-2">
                      ❌ Erreur lors de la déduplication
                    </h3>
                    <p className="text-sm text-red-800 bg-red-100 p-2 rounded">
                      {resultat.error}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}