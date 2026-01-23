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


export default function DirectionRecapIntervention() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { interventions = [] } = location.state || {};
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleConfirmer = async () => {
    setCreating(true);
    setError(null);
    
    try {
      console.log('[DIRECTION] === DÉBUT CRÉATION MISSIONDIRECTION ===');
      console.log('[DIRECTION] Interventions reçues:', interventions);
      
      const template = interventions[0];
      
      if (!template) {
        throw new Error('Aucune intervention à créer');
      }
      
      // Validation des champs requis
      if (!template.typeIntervention || !['HIVERNAGE', 'DESHIVERNAGE'].includes(template.typeIntervention)) {
        throw new Error('Type de mission invalide (HIVERNAGE ou DESHIVERNAGE requis)');
      }
      
      if (!template.service) {
        throw new Error('Service requis');
      }
      
      if (!template.datePlanifiee) {
        throw new Error('Date planifiée requise');
      }
      
      if (!template.taches || template.taches.length === 0) {
        throw new Error('Au moins une tâche requise');
      }
      
      const numerosHebergement = interventions.map(i => i.numeroHebergement).filter(Boolean);
      
      if (numerosHebergement.length === 0) {
        throw new Error('Aucun hébergement sélectionné');
      }
      
      console.log('[DIRECTION] Zones à traiter:', numerosHebergement);
      console.log('[DIRECTION] Type mission:', template.typeIntervention);
      
      // Créer UNE MissionDirection par hébergement
      const missionsCreated = [];
      
      for (const numeroHebergement of numerosHebergement) {
        const missionData = {
          type_mission: template.typeIntervention,
          titre: `${template.typeIntervention} - ${numeroHebergement}`,
          description: template.description || '',
          objectif: template.description || `Mission ${template.typeIntervention} pour ${numeroHebergement}`,
          zones: [{
            type_zone: 'hebergement',
            numero: numeroHebergement,
            categorie: template.typeHebergement
          }],
          services_intervenants: [{
            service: template.service,
            agent: '',
            zone_perimetre: numeroHebergement
          }],
          actions_prevues: template.taches.map(t => ({
            action: t.texte,
            effectuee: false
          })),
          statut: 'A_FAIRE',
          priorite: template.priorite || 'NORMALE',
          date_planifiee: template.datePlanifiee,
          createur: 'Direction',
          mission_direction: true
        };
        
        console.log(`[DIRECTION] Création MissionDirection pour ${numeroHebergement}:`, missionData);
        
        const created = await base44.entities.MissionDirection.create(missionData);
        missionsCreated.push(created);
        
        console.log(`[DIRECTION] ✅ MissionDirection créée: ${created.id}`);
      }

      console.log(`[DIRECTION] === FIN CRÉATION RÉUSSIE - ${missionsCreated.length} mission(s) ===`);

      queryClient.invalidateQueries({ queryKey: ['suivi-hivernage'] });
      queryClient.invalidateQueries({ queryKey: ['suivi-deshivernage'] });
      queryClient.invalidateQueries({ queryKey: ['interventions-direction'] });
      
      toast.success(`✅ ${missionsCreated.length} mission(s) ${template.typeIntervention} créée(s) !`);
      navigate(createPageUrl('DirectionMenu'));
    } catch (error) {
      const errorMsg = error.message || 'Erreur inconnue lors de la création';
      console.error('[DIRECTION] EXCEPTION:', error);
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`, { duration: 10000 });
    } finally {
      setCreating(false);
    }
  };



  const [error, setError] = useState(null);

  if (!interventions || interventions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 font-heading text-xl mb-4">⚠️ Erreur: aucune zone sélectionnée</p>
          <p className="text-sm text-gray-600 mb-4">
            Aucune intervention n'a été générée.
            <br />
            Veuillez sélectionner au moins un hébergement pour créer les interventions.
          </p>
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

        {/* Affichage erreur sans navigation */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-red-600 text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-heading text-red-800 text-lg mb-1">Erreur de validation</h3>
                <p className="text-red-700 text-sm mb-3">{error}</p>
                <p className="text-xs text-red-600 bg-red-100 p-2 rounded">
                  Corrigez les données ci-dessous ou utilisez le bouton "Retour" pour recommencer.
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
                  <p className="font-heading text-purple-700">{intervention.datePlanifiee || 'Non définie'}</p>
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

          <div className="space-y-3">
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

            {error && (
              <Button 
                onClick={() => navigate(createPageUrl('DirectionMenu'))}
                variant="outline"
                className="w-full h-10 border-purple-400 text-purple-700 hover:bg-purple-50"
              >
                Retour au menu Direction
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}