import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import { toast } from 'sonner';

export default function DirectionInterventions() {
  const navigate = useNavigate();
  const [typeIntervention, setTypeIntervention] = useState('');
  const [datePlanifiee, setDatePlanifiee] = useState('');

  const handleSuivant = () => {
    if (!typeIntervention) {
      toast.error('Veuillez sélectionner un type d\'intervention');
      return;
    }
    if (!datePlanifiee) {
      toast.error('Veuillez sélectionner une date planifiée');
      return;
    }

    navigate(createPageUrl('DirectionChoixHebergement'), {
      state: { typeIntervention, datePlanifiee }
    });
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto">
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
            🔧 Créer une intervention
          </h1>
          <p className="text-center text-gray-600 font-body">
            Étape 1/5 - Type et planification
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardContent className="p-6 space-y-6">
              {/* Type d'intervention */}
              <div>
                <label className="block font-heading text-purple-700 mb-2">
                  Type d'intervention *
                </label>
                <Select value={typeIntervention} onValueChange={setTypeIntervention}>
                  <SelectTrigger className="border-purple-200">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIVERNAGE">❄️ Hivernage</SelectItem>
                    <SelectItem value="DESHIVERNAGE">🌞 Déshivernage</SelectItem>
                    <SelectItem value="INTERVENTION">🔧 Intervention</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date planifiée */}
              <div>
                <label className="block font-heading text-purple-700 mb-2">
                  Date planifiée *
                </label>
                <input
                  type="date"
                  value={datePlanifiee}
                  onChange={(e) => setDatePlanifiee(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-400 focus:outline-none"
                />
              </div>

              {/* Bouton Suivant */}
              <Button 
                onClick={handleSuivant}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-lg"
              >
                Suivant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}