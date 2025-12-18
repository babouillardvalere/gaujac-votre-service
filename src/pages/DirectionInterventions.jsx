import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Snowflake, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';

export default function DirectionInterventions() {
  const navigate = useNavigate();

  const types = [
    {
      id: 'HIVERNAGE',
      title: '❄️ Hivernage',
      icon: Snowflake,
      color: 'bg-[#00AEEF]',
      description: 'Fermeture et sécurisation'
    },
    {
      id: 'DESHIVERNAGE',
      title: '🌞 Déshivernage',
      icon: Sun,
      color: 'bg-[#FFD700]',
      description: 'Remise en état pour l\'ouverture'
    }
  ];

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
            🔧 Interventions
          </h1>
          <p className="text-center text-gray-600 font-body">
            Choisissez le type d'intervention
          </p>
        </motion.div>

        <div className="space-y-4">
          {types.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <button
                onClick={() => navigate(createPageUrl('DirectionChoixHebergement'), { 
                  state: { typeIntervention: type.id }
                })}
                className="w-full group focus:ring-4 focus:ring-purple-500 rounded-xl"
              >
                <Card className="border-2 border-purple-500 hover:border-purple-600 hover:shadow-lg transition-all rounded-xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center p-5 min-h-[80px]">
                      <div className={`w-14 h-14 rounded-xl ${type.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                        <type.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="ml-5 flex-1">
                        <h2 className="font-heading text-lg text-purple-700 group-hover:text-purple-800 transition-colors">
                          {type.title}
                        </h2>
                        <p className="font-body text-sm text-gray-600">
                          {type.description}
                        </p>
                      </div>
                      <div className="text-purple-600 group-hover:translate-x-1 transition-all">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
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