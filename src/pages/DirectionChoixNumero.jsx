import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { logements } from '../components/accommodationData';
import Logo from '../components/Logo';

export default function DirectionChoixNumero() {
  const navigate = useNavigate();
  const location = useLocation();
  const { typeIntervention, typeHebergement } = location.state || {};

  const numeros = logements[typeHebergement] || [];

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
            {typeHebergement}
          </h1>
          <p className="text-center text-gray-600 font-body">
            Choisissez le numéro
          </p>
        </motion.div>

        <div className="grid grid-cols-4 gap-2">
          {numeros.map((numero, index) => (
            <motion.div
              key={numero}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.02 * index }}
            >
              <button
                onClick={() => navigate(createPageUrl('DirectionCreerIntervention'), {
                  state: {
                    typeIntervention,
                    typeHebergement,
                    numerosHebergement: [numero]
                  }
                })}
                className="w-full group focus:ring-4 focus:ring-purple-500 rounded-xl"
              >
                <Card className="border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg transition-all rounded-xl overflow-hidden">
                  <CardContent className="p-3">
                    <p className="font-heading text-center text-purple-700 group-hover:text-purple-800 text-lg">
                      {numero}
                    </p>
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