import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ClientDepart() {
  const { t } = useTranslation();
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
          <Logo className="h-20 mb-6" />
          
          <div className="bg-white rounded-2xl border-2 border-[#FFD700] p-8 shadow-lg">
            <Construction className="w-20 h-20 text-[#FFD700] mx-auto mb-4" />
            
            <h1 className="font-handwritten text-3xl text-[#0077A8] mb-4">
              🚧 {t('lang') === 'fr' ? 'Fonction en développement' : 'Feature under development'}
            </h1>
            
            <p className="font-body text-gray-600 mb-6">
              {t('lang') === 'fr' 
                ? 'Cette section sera bientôt disponible dans l\'application.'
                : 'This section will be available soon in the application.'
              }
            </p>
            
            <p className="font-body text-[#00AEEF] text-lg mb-6">
              {t('lang') === 'fr' ? 'Merci pour votre patience 💙' : 'Thank you for your patience 💙'}
            </p>
            
            <Button
              onClick={() => navigate(createPageUrl('ClientMenu'))}
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t('retour')}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}