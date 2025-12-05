import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage, useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Tent, Home, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';

import { emplacements, logements } from '../components/accommodationData';

export default function ChoixHebergement() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState('type');
  const [hebergementType, setHebergementType] = useState(null);
  const [categorie, setCategorie] = useState(null);
  const [numero, setNumero] = useState(null);

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
      return;
    }
    const accepted = sessionStorage.getItem('conditions_accepted');
    if (accepted !== 'true') {
      navigate(createPageUrl('ConditionsClient'));
    }
  }, [navigate]);

  const handleTypeSelect = (type) => {
    setHebergementType(type);
    setStep('categorie');
  };

  const handleCategorieSelect = (cat) => {
    setCategorie(cat);
    setStep('numero');
  };

  const handleNumeroSelect = (num) => {
    setNumero(num);
    sessionStorage.setItem('hebergement_type', hebergementType);
    sessionStorage.setItem('hebergement_categorie', categorie);
    sessionStorage.setItem('hebergement_numero', String(num));
    navigate(createPageUrl('Signalement'));
  };

  const goBack = () => {
    if (step === 'numero') {
      setStep('categorie');
      setNumero(null);
    } else if (step === 'categorie') {
      setStep('type');
      setCategorie(null);
      setHebergementType(null);
    } else {
      navigate(createPageUrl('ConditionsClient'));
    }
  };

  const getCategories = () => {
    if (hebergementType === 'Emplacement') {
      return Object.keys(emplacements);
    }
    return Object.keys(logements);
  };

  const getNumeros = () => {
    if (hebergementType === 'Emplacement') {
      return emplacements[categorie] || [];
    }
    return logements[categorie] || [];
  };

  return (
    <div className="min-h-screen px-4 py-6" role="main" aria-label="Choix de votre hébergement">
      <h1 className="sr-only">Sélectionnez votre type d'hébergement</h1>
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo className="h-16" />
        </motion.div>

        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="bg-[#00AEEF] pb-4">
            <button
              onClick={goBack}
              className="flex items-center text-white/80 hover:text-white text-sm mb-2 font-body"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('retour')}
            </button>
            <CardTitle className="text-xl font-heading text-white">
              {step === 'type' && t('choix_hebergement')}
              {step === 'categorie' && (hebergementType === 'Emplacement' ? t('type_emplacement') : t('type_hebergement'))}
              {step === 'numero' && t('choisir_numero')}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              {step === 'type' && (
                <motion.div
                  key="type"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                  role="group"
                  aria-label="Choisir le type d'hébergement"
                >
                  <button
                    onClick={() => handleTypeSelect('Emplacement')}
                    className="w-full p-5 bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] rounded-xl flex items-center gap-4 transition-all min-h-[80px] focus:ring-4 focus:ring-[#FFD700]"
                    aria-label="Emplacement nu - Tente, caravane, camping-car"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="w-14 h-14 bg-[#FFD700] rounded-xl flex items-center justify-center" aria-hidden="true">
                      <Tent className="w-7 h-7 text-[#0077A8]" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading text-lg text-[#0077A8]">⛺ {t('emplacement')}</h3>
                      <p className="font-body text-sm text-gray-500">{t('camping_tente')}</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTypeSelect('Mobil-home')}
                    className="w-full p-5 bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] rounded-xl flex items-center gap-4 transition-all min-h-[80px] focus:ring-4 focus:ring-[#FFD700]"
                    aria-label="Mobil-home ou Cottage - Logement équipé"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="w-14 h-14 bg-[#00AEEF] rounded-xl flex items-center justify-center" aria-hidden="true">
                      <Home className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading text-lg text-[#0077A8]">🏠 {t('logement')}</h3>
                      <p className="font-body text-sm text-gray-500">{t('mobilhome_cottage')}</p>
                    </div>
                  </button>
                </motion.div>
              )}

              {step === 'categorie' && (
                <motion.div
                  key="categorie"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3 max-h-[400px] overflow-y-auto pr-2"
                >
                  {getCategories().map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategorieSelect(cat)}
                      className="w-full p-4 bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:bg-[#e6f7ff] rounded-xl text-left transition-all"
                    >
                      <span className="font-heading text-[#0077A8]">{cat}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {step === 'numero' && (
                <motion.div
                  key="numero"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="font-body text-[#0077A8] mb-4">
                    {t('select_numero')} :
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[350px] overflow-y-auto">
                    {getNumeros().map((num) => (
                      <button
                        key={num}
                        onClick={() => handleNumeroSelect(num)}
                        className="p-3 bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:bg-[#00AEEF] hover:text-white rounded-xl font-heading text-[#0077A8] transition-all"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}