import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ClientDepartChecklist() {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  
  const typeLogement = sessionStorage.getItem('depart_type_logement');

  useEffect(() => {
    if (!typeLogement) {
      navigate(createPageUrl('ClientDepartIdentite'));
    }
  }, [typeLogement, navigate]);

  const handleContinue = () => {
    navigate(createPageUrl('ClientDepartPhotos'));
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('ClientDepartHebergement'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">
                {lang === 'fr' ? 'Retour' : 'Back'}
              </span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-2">
            🚗 {lang === 'fr' ? 'Départ' : 'Departure'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-6">
            {lang === 'fr' ? 'Étape 3/4 : Checklist' : 'Step 3/4: Checklist'}
          </p>

          <Card className="border-2 border-[#FFA500]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              {typeLogement === 'mobilhome' ? (
                <div className="space-y-4">
                  <h2 className="font-handwritten text-2xl text-[#0077A8] mb-4">
                    ✨ {lang === 'fr' ? 'Avant de partir' : 'Before leaving'}
                  </h2>
                  
                  {lang === 'fr' ? (
                    <>
                      <p className="font-body text-gray-700 mb-4 italic">
                        Agents en vacances, votre mission : laisser ce mobil-home impeccable pour les prochains infiltrés. Merci de votre collaboration !
                      </p>

                      <div className="space-y-3">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">1. Salle de bain – Zone Hydra 🚿</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Rincez la douche : elle a vu des choses… trop de choses.</li>
                            <li>Lavabo nettoyé : opération "Blanche-Neige".</li>
                            <li>Sol & vitres impeccables : effacez toute trace de votre passage.</li>
                          </ul>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">2. Toilettes – Base Royale 🚽</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Le trône doit rester digne de son rang.</li>
                            <li>Sol propre : aucune preuve au sol.</li>
                            <li>Vitre claire : visibilité optimale.</li>
                          </ul>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">3. Chambres – Secteur Sommeil 🛏️</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Lits remis en place : camouflage correct accepté.</li>
                            <li>Oreillers & couvertures positionnés.</li>
                            <li>Sol propre & placards vidés.</li>
                            <li>Fenêtres propres.</li>
                          </ul>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">4. Séjour – Zone Stratégique 🛋️</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Table nettoyée.</li>
                            <li>Vaisselle propre ou regroupée.</li>
                          </ul>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">5. Cuisine – Labo Opérationnel 🍳</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Gazinière impeccable.</li>
                            <li>Micro-ondes sans traces.</li>
                            <li>Évier brillant.</li>
                            <li>Frigo vidé.</li>
                            <li>Plan de travail propre.</li>
                            <li>Hotte nettoyée.</li>
                          </ul>
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">6. Fin de mission – Extraction 🗑️</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Poubelles vidées.</li>
                            <li>Sol nettoyé.</li>
                            <li>Vitres propres.</li>
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-body text-gray-700 mb-4 italic">
                        Vacationers on a mission: leave this mobile home spotless for the next guests. Thank you for your cooperation!
                      </p>

                      <div className="space-y-3">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">1. Bathroom – Hydra Zone 🚿</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Rinse the shower: it's seen things… too many things.</li>
                            <li>Clean sink: "Snow White" operation.</li>
                            <li>Spotless floor & windows: erase all traces.</li>
                          </ul>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">2. Toilets – Royal Base 🚽</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>The throne must remain dignified.</li>
                            <li>Clean floor: no evidence left behind.</li>
                            <li>Clear window: optimal visibility.</li>
                          </ul>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">3. Bedrooms – Sleep Sector 🛏️</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Beds made: proper camouflage accepted.</li>
                            <li>Pillows & blankets positioned.</li>
                            <li>Clean floor & emptied closets.</li>
                            <li>Clean windows.</li>
                          </ul>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">4. Living Room – Strategic Zone 🛋️</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Clean table.</li>
                            <li>Dishes clean or grouped.</li>
                          </ul>
                        </div>

                        <div className="bg-orange-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">5. Kitchen – Operational Lab 🍳</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Spotless stove.</li>
                            <li>Microwave without traces.</li>
                            <li>Shiny sink.</li>
                            <li>Empty fridge.</li>
                            <li>Clean countertop.</li>
                            <li>Clean hood.</li>
                          </ul>
                        </div>

                        <div className="bg-red-50 p-4 rounded-lg">
                          <h3 className="font-heading text-[#0077A8] mb-2">6. Mission End – Extraction 🗑️</h3>
                          <ul className="list-disc list-inside text-sm font-body text-gray-700 space-y-1">
                            <li>Empty trash.</li>
                            <li>Clean floor.</li>
                            <li>Clean windows.</li>
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="font-handwritten text-2xl text-[#0077A8] mb-4">
                    ✨ {lang === 'fr' ? 'Avant de partir' : 'Before leaving'}
                  </h2>
                  
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="font-heading text-[#0077A8] mb-3 text-lg">
                      {lang === 'fr' ? 'Merci de :' : 'Please:'}
                    </h3>
                    <ul className="list-disc list-inside font-body text-gray-700 space-y-2">
                      <li>{lang === 'fr' ? 'Ramasser tous vos déchets' : 'Pick up all your trash'}</li>
                      <li>{lang === 'fr' ? 'Ne rien laisser sur place' : 'Leave nothing behind'}</li>
                      <li>{lang === 'fr' ? 'Vérifier que le terrain est propre et sans objets oubliés' : 'Check that the site is clean with no forgotten items'}</li>
                    </ul>
                  </div>
                </div>
              )}

              <Button
                onClick={handleContinue}
                className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading mt-6"
              >
                {lang === 'fr' ? 'Continuer' : 'Continue'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}