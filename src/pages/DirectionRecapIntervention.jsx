import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { prepareWorkItemData } from '../components/workItemUtils';
import { validateBeforeWorkItemCreation } from '../components/qa/ValidationRules';

export default function DirectionRecapIntervention() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { interventions = [] } = location.state || {};
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleConfirmer = async () => {
    setCreating(true);
    try {
      console.log('[DIRECTION] Création interventions:', interventions.length);
      
      for (const intervention of interventions) {
        // Validation : Au moins une tâche doit être définie
        if (!intervention.taches || intervention.taches.length === 0) {
          toast.error(`❌ Intervention ${intervention.numeroHebergement} : aucune tâche définie`);
          setCreating(false);
          return;
        }

        // Préparer données avec description_operationnelle (BLOQUE si impossible)
        let workItemDataToCreate;
        try {
          workItemDataToCreate = prepareWorkItemData({
            taches: intervention.taches,
            description: intervention.description,
            titre: `${intervention.typeIntervention} - ${intervention.numeroHebergement}`
          });
        } catch (error) {
          toast.error(`❌ Intervention ${intervention.numeroHebergement} : ${error.message}`);
          setCreating(false);
          return;
        }

        // Créer WorkItem directement (source: direction)
        const workItemData = {
          type: 'MISSION_DIRECTION',
          service: intervention.service,
          statut: 'A_FAIRE',
          priorite: intervention.priorite,
          titre: `${intervention.typeIntervention} - ${intervention.numeroHebergement}`,
          description_operationnelle: workItemDataToCreate.description_operationnelle,
          description: intervention.description || `${intervention.typeIntervention} - ${intervention.taches.length} tâche(s)`,
          hebergement: intervention.numeroHebergement,
          type_hebergement: intervention.typeHebergement,
          taches: intervention.taches,
          client_nom: 'Direction',
          client_prenom: intervention.typeIntervention,
          rank: 0,
          // Origine obligatoire (création manuelle Direction)
          mission_direction_id: 'direction_manuelle_' + Date.now()
        };

        // VALIDATION QA BLOQUANTE avant création
        try {
          validateBeforeWorkItemCreation(workItemData);
        } catch (validationError) {
          toast.error(`❌ Validation QA : ${validationError.message}`);
          console.error('[DIRECTION] Validation QA échouée:', validationError);
          setCreating(false);
          return;
        }

        await base44.entities.WorkItem.create(workItemData);
        
        console.log('[DIRECTION] WorkItem créé et validé:', intervention.numeroHebergement);
      }

      queryClient.invalidateQueries({ queryKey: ['workitems-technique'] });
      queryClient.invalidateQueries({ queryKey: ['workitems-menage'] });
      toast.success(`✅ ${interventions.length} intervention(s) créée(s) avec succès !`);
      navigate(createPageUrl('DirectionMenu'));
    } catch (error) {
      console.error('[DIRECTION] Erreur création:', error);
      toast.error(`❌ Erreur création : ${error.message || 'Erreur inconnue'}`);
    } finally {
      setCreating(false);
    }
  };



  if (!interventions || interventions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 font-heading text-xl mb-4">⚠️ Erreur: données manquantes</p>
          <Button onClick={() => navigate(createPageUrl('DirectionMenu'))} className="bg-purple-600">
            Retour au menu Direction
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">Retour</span>
          </button>
          
          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-2">
            🔧 Récapitulatif
          </h1>
          <p className="text-center text-gray-600 font-body">
            {interventions.length} intervention(s) à créer
          </p>
        </motion.div>

        <div className="space-y-4">
          {interventions.map((intervention, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200 space-y-4">
              <h3 className="font-heading text-lg text-purple-700 border-b pb-2">
                Intervention #{idx + 1} - {intervention.numeroHebergement}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-heading text-purple-700">{intervention.typeIntervention}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date planifiée</p>
                  <p className="font-heading text-purple-700">{intervention.datePlanifiee}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-heading text-purple-700">{intervention.service === 'TECHNIQUE' ? '🧰 Technique' : '🧽 Ménage'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priorité</p>
                  <p className="font-heading text-purple-700">{intervention.priorite === 'URGENTE' ? '⚠️ Urgente' : '◯ Normale'}</p>
                </div>
              </div>

              {intervention.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{intervention.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-2">Tâches ({intervention.taches.length})</p>
                <div className="space-y-1">
                  {intervention.taches.map((tache) => (
                    <div key={tache.numero} className="flex items-center gap-2 bg-purple-50 p-2 rounded">
                      <span className="font-bold text-purple-600 text-xs">{tache.numero}️⃣</span>
                      <span className="text-sm">{tache.texte}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <Button 
            onClick={handleConfirmer} 
            disabled={creating}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg disabled:opacity-50"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                ✅ Confirmer {interventions.length} intervention(s)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}