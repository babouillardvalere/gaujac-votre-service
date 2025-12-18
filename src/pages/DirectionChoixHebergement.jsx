import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';

export default function DirectionChoixHebergement() {
  const navigate = useNavigate();
  const location = useLocation();
  const typeIntervention = location.state?.typeIntervention || 'HIVERNAGE';

  const typesHebergement = [
    { id: 'Chalet Eco', emoji: '🏡', label: 'Chalet Eco' },
    { id: 'Chalet Classique', emoji: '🏡', label: 'Chalet Classique' },
    { id: 'Mobil-home Eco', emoji: '🏠', label: 'Mobil-home Eco' },
    { id: 'Mobil-home Eco Clim', emoji: '🏠', label: 'Mobil-home Eco Clim' },
    { id: 'Mobil-home Classique', emoji: '🏠', label: 'Mobil-home Classique' },
    { id: 'Mobil-home Classique Clim', emoji: '🏠', label: 'Mobil-home Classique Clim' },
    { id: 'Mobil-home Classique 3ch', emoji: '🏠', label: 'Mobil-home Classique 3ch' },
    { id: 'Mobil-home Confort 2ch', emoji: '🏠', label: 'Mobil-home Confort 2ch' },
    { id: 'Mobil-home Confort 3ch', emoji: '🏠', label: 'Mobil-home Confort 3ch' },
    { id: 'Confort+ 2ch', emoji: '🏠', label: 'Confort+ 2ch' },
    { id: 'Confort+ 3ch', emoji: '🏠', label: 'Confort+ 3ch' },
    { id: 'Premium 2ch', emoji: '🏠', label: 'Premium 2ch' },
    { id: 'Premium 3ch', emoji: '🏠', label: 'Premium 3ch' },
    { id: 'Premium Twins', emoji: '🏠', label: 'Premium Twins' },
    { id: 'Cottage Premium', emoji: '🏠', label: 'Cottage Premium' }
  ];

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(createPageUrl('DirectionInterventions'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">Retour</span>
          </button>
          
          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-2">
            {typeIntervention === 'HIVERNAGE' ? '❄️ Hivernage' : '🌞 Déshivernage'}
          </h1>
          <p className="text-center text-gray-600 font-body">
            Choisissez le type d'hébergement
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {typesHebergement.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * index }}
            >
              <button
                onClick={() => navigate(createPageUrl('DirectionChoixNumero'), {
                  state: { 
                    typeIntervention,
                    typeHebergement: type.id
                  }
                })}
                className="w-full group focus:ring-4 focus:ring-purple-500 rounded-xl"
              >
                <Card className="border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg transition-all rounded-xl overflow-hidden h-full">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-4xl mb-2">{type.emoji}</div>
                      <p className="font-heading text-sm text-purple-700 group-hover:text-purple-800">
                        {type.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}