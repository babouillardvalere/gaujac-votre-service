import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Trash2, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import { deduplicateMissions } from '../components/missions/deduplicateMissions';

export default function AdminDeduplication() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [resultat, setResultat] = useState(null);

  const handleDeduplicate = async () => {
    if (!confirm('⚠️ Attention : Cette opération va supprimer les missions en double.\n\nContinuer ?')) {
      return;
    }
    
    setRunning(true);
    setResultat(null);
    
    try {
      const result = await deduplicateMissions();
      setResultat(result);
      
      if (result.supprimees === 0) {
        toast.success('✅ Aucun doublon trouvé - base de données propre');
      } else {
        toast.success(`✅ ${result.supprimees} missions supprimées, ${result.rattachees} WorkItems rattachés`, { duration: 8000 });
      }
    } catch (error) {
      console.error('Erreur déduplication:', error);
      toast.error('❌ Erreur lors de la déduplication');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl('DirectionMenu'))}
          className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-heading">Retour</span>
        </button>
        
        <Logo className="h-16 mb-4" />
        
        <h1 className="font-handwritten text-3xl text-[#0077A8] text-center mb-6">
          🧹 Déduplication des missions
        </h1>

        <div className="space-y-4">
          <Card className="border-2 border-yellow-400 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-700 flex-shrink-0" />
                <div>
                  <h3 className="font-heading text-lg text-yellow-900 mb-2">
                    Correction des doublons
                  </h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Cette opération va identifier et supprimer les missions Direction en double, 
                    en conservant une seule mission par clé fonctionnelle :
                  </p>
                  <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1 mb-3">
                    <li>Type de mission (HIVERNAGE / DESHIVERNAGE)</li>
                    <li>Hébergement concerné</li>
                    <li>Saison (année)</li>
                  </ul>
                  <p className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                    ℹ️ Tous les WorkItems des missions supprimées seront automatiquement 
                    rattachés à la mission conservée.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleDeduplicate}
                disabled={running}
                className="w-full bg-yellow-600 hover:bg-yellow-700 h-12"
              >
                {running ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Déduplication en cours...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 mr-2" />
                    Lancer la déduplication
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {resultat && (
            <Card className="border-2 border-green-400 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-700 flex-shrink-0" />
                  <div>
                    <h3 className="font-heading text-lg text-green-900 mb-3">
                      Déduplication terminée
                    </h3>
                    <div className="space-y-2 text-sm text-green-800">
                      <p>📊 <strong>{resultat.doublons}</strong> groupe(s) avec doublons identifié(s)</p>
                      <p>🗑️ <strong>{resultat.supprimees}</strong> mission(s) supprimée(s)</p>
                      <p>🔗 <strong>{resultat.rattachees}</strong> WorkItem(s) rattaché(s)</p>
                    </div>
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