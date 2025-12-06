import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import ConditionsDepart from '../components/ConditionsDepart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ClientDepart() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { lang } = useTranslation();

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-3xl mx-auto">
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

        <Logo className="h-16 mb-6 mx-auto" />

        {/* Conditions de départ */}
        <ConditionsDepart />
        
        {/* Bouton démarrer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <Button
            onClick={() => navigate(createPageUrl('ClientDepartIdentite'))}
            className="w-full h-14 bg-[#FFA500] hover:bg-[#e69500] text-white rounded-xl font-heading text-lg"
          >
            {lang === 'fr' ? 'Commencer le départ' : 'Start departure'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}