import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ClientDepartConfirmation() {
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
          <Logo className="h-20 mb-6" />
          
          <Card className="border-2 border-green-500 rounded-2xl shadow-lg">
            <CardContent className="p-8">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              
              <h1 className="font-handwritten text-3xl text-[#0077A8] mb-4">
                🎉 {lang === 'fr' ? 'Merci !' : 'Thank you!'}
              </h1>
              
              <p className="font-body text-gray-700 mb-4 text-lg">
                {lang === 'fr' 
                  ? 'Votre départ a bien été enregistré.'
                  : 'Your checkout has been registered.'
                }
              </p>
              
              <p className="font-body text-[#00AEEF] text-lg mb-6">
                {lang === 'fr' 
                  ? 'Toute l\'équipe du Camping Paradis vous souhaite un excellent retour !'
                  : 'The entire Camping Paradis team wishes you a safe journey home!'
                }
              </p>
              
              <div className="bg-[#FFF4B2] rounded-lg p-4 mb-6">
                <p className="font-body text-sm text-[#0077A8]">
                  💙 {lang === 'fr' 
                    ? 'Nous espérons vous revoir très bientôt au Domaine de Gaujac !'
                    : 'We hope to see you again very soon at Domaine de Gaujac!'
                  }
                </p>
              </div>
              
              <Button
                onClick={() => navigate(createPageUrl('Home'))}
                className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading"
              >
                <Home className="w-5 h-5 mr-2" />
                {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}