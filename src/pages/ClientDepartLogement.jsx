import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Home, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ClientDepartLogement() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const nom = sessionStorage.getItem('depart_nom');
  const prenom = sessionStorage.getItem('depart_prenom');
  const typeLogement = sessionStorage.getItem('depart_type_logement');
  const categorie = sessionStorage.getItem('depart_categorie');
  const numero = sessionStorage.getItem('depart_numero');

  useEffect(() => {
    if (!nom || !categorie) {
      navigate(createPageUrl('ClientDepartIdentification'));
    }
  }, [nom, categorie, navigate]);

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientDepartIdentification'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-2">
            🚪 {lang === 'fr' ? 'Départ' : 'Departure'}
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {nom} {prenom}
          </p>

          <Card className="border-2 border-[#FFA500]/30 rounded-xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                <Home className="w-6 h-6" />
                {lang === 'fr' ? 'Votre logement' : 'Your accommodation'}
              </h2>

              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">
                    {lang === 'fr' ? 'Type' : 'Type'}
                  </p>
                  <p className="font-heading text-lg text-[#0077A8]">
                    {typeLogement === 'emplacement' 
                      ? (lang === 'fr' ? 'Emplacement' : 'Pitch')
                      : (lang === 'fr' ? 'Hébergement' : 'Accommodation')}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">
                    {lang === 'fr' ? 'Catégorie' : 'Category'}
                  </p>
                  <p className="font-heading text-lg text-[#0077A8]">
                    {categorie}
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                  <p className="text-sm text-gray-600 mb-1">
                    {lang === 'fr' ? 'Numéro' : 'Number'}
                  </p>
                  <p className="font-heading text-2xl text-[#0077A8]">
                    {numero}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm text-gray-700">
                  ℹ️ {lang === 'fr' 
                    ? 'Ces informations proviennent de votre fiche d\'arrivée.'
                    : 'This information comes from your arrival form.'}
                </p>
              </div>

              <Button
                onClick={() => navigate(createPageUrl('ClientDepartInventaire'))}
                className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading mt-6"
              >
                {lang === 'fr' ? 'Continuer vers inventaire' : 'Continue to inventory'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}