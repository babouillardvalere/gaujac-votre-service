/**
 * Gestion de la suppression d'interventions au Bureau
 * Implémente la suppression en cascade
 */

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { deleteInterventionCascade } from '../interventionDeletion';
import { runAllSuppressionTests } from '../qa/TestSuppression';

export default function InterventionDeletionManager({ incidentId, onDeleted, runQaTests = false }) {
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cascadeInfo, setCascadeInfo] = useState(null);
  const [qaResults, setQaResults] = useState(null);

  // Charger infos cascade
  const handleOpenDelete = async () => {
    setIsDeleting(true);
    try {
      // Vérifier combien de WorkItems seront supprimés
      const workItems = await base44.entities.WorkItem.filter({
        incident_id: incidentId
      });
      setCascadeInfo({
        workItems: workItems.length
      });
      setShowConfirm(true);
    } catch (error) {
      toast.error('Erreur lors de la vérification');
    } finally {
      setIsDeleting(false);
    }
  };

  // Exécuter la suppression
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      // Récupérer l'utilisateur actuel pour l'audit
      const user = await base44.auth.me();
      const userId = user?.email || user?.id || 'SYSTEM';
      
      const result = await deleteInterventionCascade(incidentId, userId);
      
      // 🔄 Invalider TOUS les caches React Query
      await queryClient.invalidateQueries({ queryKey: ['incidents-technique'] });
      await queryClient.invalidateQueries({ queryKey: ['incidents-menage'] });
      await queryClient.invalidateQueries({ queryKey: ['workitems-technique'] });
      await queryClient.invalidateQueries({ queryKey: ['workitems-menage'] });
      await queryClient.invalidateQueries({ queryKey: ['workitems-reception'] });
      
      // Invalider les queries génériques aussi
      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
      await queryClient.invalidateQueries({ queryKey: ['workitems'] });
      
      toast.success(
        `Suppression effectuée: 1 incident + ${result.deletedWorkItems} WorkItems`
      );
      
      // 🧪 Lancer les tests QA si activé
      if (runQaTests) {
        toast.loading('Validation QA...', { id: 'qa-test' });
        const testResults = await runAllSuppressionTests();
        setQaResults(testResults);
        toast.dismiss('qa-test');
        
        if (testResults.tests.orphans.success) {
          toast.success('✅ QA: Aucun orphelin détecté');
        }
      }
      
      setShowConfirm(false);
      onDeleted?.(result);
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenDelete}
        variant="destructive"
        size="sm"
        disabled={isDeleting}
        className="flex items-center gap-2"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        Supprimer
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Supprimer cette intervention ?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Cette action va supprimer:
            </p>
            <ul className="space-y-2 bg-red-50 p-3 rounded-lg text-sm">
              <li>✓ L'intervention principale</li>
              {cascadeInfo && cascadeInfo.workItems > 0 && (
                <li>✓ {cascadeInfo.workItems} WorkItem(s) associé(s)</li>
              )}
            </ul>
            <p className="text-xs text-gray-500">
              Ceci est un soft delete — les données restent en base avec timestamp
              <code className="bg-gray-100 px-1 rounded">deleted_at</code>
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => setShowConfirm(false)}
              variant="outline"
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="destructive"
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirmer la suppression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}