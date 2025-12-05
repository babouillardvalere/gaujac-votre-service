import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ClientArrivee() {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-8 flex items-center justify-center">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('ClientMenu'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">
                {lang === 'fr' ? 'Retour' : 'Back'}
              </span>
            </button>
          </div>

          <Logo className="h-20 mb-6" />
          
          <Card className="border-2 border-[#22c55e] rounded-2xl shadow-lg">
            <CardContent className="p-8">
              <Smile className="w-20 h-20 text-[#22c55e] mx-auto mb-4" />
              
              <h1 className="font-handwritten text-3xl text-[#0077A8] mb-4">
                👋 {lang === 'fr' 
                  ? 'Bienvenue au Camping Paradis – Domaine de Gaujac !'
                  : 'Welcome to Camping Paradis – Domaine de Gaujac!'
                }
              </h1>
              
              <p className="font-body text-gray-700 mb-6 text-lg">
                {lang === 'fr' 
                  ? 'Merci de remplir ces informations afin de préparer votre arrivée.'
                  : 'Please fill in this information to prepare your arrival.'
                }
              </p>
              
              <Button
                onClick={() => navigate(createPageUrl('ClientArriveeIdentite'))}
                className="w-full h-14 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl font-heading text-lg"
              >
                {lang === 'fr' ? 'Commencer' : 'Start'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}