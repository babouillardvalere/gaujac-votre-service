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

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(20);
      doc.setTextColor(0, 119, 168);
      doc.text('Camping Paradis - Domaine de Gaujac', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('RECAPITULATIF INTERVENTION DIRECTION', 105, 35, { align: 'center' });
      
      // Corps
      let y = 50;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      doc.text('Type d\'intervention:', 20, y);
      doc.setFont(undefined, 'bold');
      doc.text(intervention.typeIntervention === 'HIVERNAGE' ? 'HIVERNAGE' : 'DESHIVERNAGE', 80, y);
      doc.setFont(undefined, 'normal');
      y += 10;
      
      doc.text('Hebergement:', 20, y);
      doc.setFont(undefined, 'bold');
      doc.text(`${intervention.typeHebergement} - ${intervention.numeroHebergement}`, 80, y);
      doc.setFont(undefined, 'normal');
      y += 10;
      
      doc.text('Service assigne:', 20, y);
      doc.setFont(undefined, 'bold');
      doc.text(intervention.service === 'TECHNIQUE' ? 'TECHNIQUE' : 'MENAGE', 80, y);
      doc.setFont(undefined, 'normal');
      y += 10;
      
      doc.text('Priorite:', 20, y);
      doc.setFont(undefined, 'bold');
      doc.text(intervention.priorite, 80, y);
      doc.setFont(undefined, 'normal');
      y += 15;
      
      doc.text('Description:', 20, y);
      y += 7;
      const descLines = doc.splitTextToSize(intervention.description, 170);
      doc.text(descLines, 20, y);
      y += descLines.length * 7 + 10;
      
      doc.setFont(undefined, 'bold');
      doc.text('TACHES A EFFECTUER:', 20, y);
      doc.setFont(undefined, 'normal');
      y += 10;
      
      intervention.taches.forEach(tache => {
        const tacheLines = doc.splitTextToSize(`${tache.numero}. ${tache.texte}`, 170);
        doc.text(tacheLines, 25, y);
        y += tacheLines.length * 7 + 5;
      });
      
      y += 15;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date d'emission: ${new Date().toLocaleDateString('fr-FR')}`, 20, y);
      
      // Télécharger
      doc.save(`Intervention_${intervention.numeroHebergement}_${new Date().getTime()}.pdf`);
      toast.success('PDF téléchargé ✅');
    } catch (error) {
      console.error('Erreur PDF:', error);
      toast.error('Erreur génération PDF');
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