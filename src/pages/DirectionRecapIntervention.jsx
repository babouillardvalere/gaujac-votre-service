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

export default function DirectionRecapIntervention() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { intervention } = location.state || {};
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      const newIntervention = await base44.entities.InterventionDirection.create({
        type_intervention: intervention.typeIntervention,
        type_hebergement: intervention.typeHebergement,
        numero_hebergement: intervention.numeroHebergement,
        service: intervention.service,
        priorite: intervention.priorite,
        description: intervention.description,
        taches: intervention.taches.map(t => ({
          numero: t.numero,
          texte: t.texte,
          faite: false
        })),
        statut: 'A_FAIRE'
      });

      return newIntervention;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions-direction'] });
      toast.success('Intervention créée et envoyée au service !');
      setTimeout(() => {
        navigate(createPageUrl('DirectionMenu'));
      }, 1500);
    },
    onError: (error) => {
      toast.error('Erreur lors de la création');
      console.error(error);
    }
  });

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const prompt = `Génère un PDF professionnel de récapitulatif d'intervention Direction avec:

TYPE: ${intervention.typeIntervention === 'HIVERNAGE' ? 'HIVERNAGE ❄️' : 'DÉSHIVERNAGE 🌞'}
HÉBERGEMENT: ${intervention.typeHebergement} - ${intervention.numeroHebergement}
SERVICE ASSIGNÉ: ${intervention.service === 'TECHNIQUE' ? 'TECHNIQUE 🧰' : 'MÉNAGE 🧽'}
PRIORITÉ: ${intervention.priorite}

DESCRIPTION:
${intervention.description}

TÂCHES À EFFECTUER:
${intervention.taches.map(t => `${t.numero}. ${t.texte}`).join('\n')}

Date d'émission: ${new Date().toLocaleDateString('fr-FR')}

Créer un PDF avec en-tête "Camping Paradis - Domaine de Gaujac", logo, et mise en forme professionnelle.`;

      const { file_url } = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      // Télécharger le fichier
      window.open(file_url, '_blank');
      toast.success('PDF téléchargé ✅');
    } catch (error) {
      console.error('Erreur PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleValider = () => {
    createMutation.mutate();
  };

  if (!intervention) {
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
            Récapitulatif
          </h1>
        </motion.div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200 space-y-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-heading text-lg">
              {intervention.typeIntervention === 'HIVERNAGE' ? '❄️ Hivernage' : '🌞 Déshivernage'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Hébergement</p>
            <p className="font-heading text-lg">{intervention.typeHebergement}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Numéro</p>
            <p className="font-heading text-lg text-purple-700">{intervention.numeroHebergement}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Service</p>
            <p className="font-heading text-lg">
              {intervention.service === 'TECHNIQUE' ? '🧰 Technique' : '🧽 Ménage'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Priorité</p>
            <p className="font-heading text-lg">
              {intervention.priorite === 'URGENTE' ? '⚠️ Urgente' : '◯ Normale'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="font-body text-gray-700">{intervention.description}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Tâches</p>
            <div className="space-y-2">
              {intervention.taches.map((tache) => (
                <div key={tache.numero} className="flex items-center gap-2 bg-purple-50 p-2 rounded">
                  <span className="font-bold text-purple-600">{tache.numero}.</span>
                  <span className="font-body">{tache.texte}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleDownloadPDF} 
            variant="outline" 
            className="w-full h-12"
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                📄 Télécharger le PDF
              </>
            )}
          </Button>

          <Button 
            onClick={handleValider}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                ✔️ Valider
              </>
            )}
          </Button>

          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="w-full h-12"
          >
            ↩️ Retour
          </Button>
        </div>
      </div>
    </div>
  );
}