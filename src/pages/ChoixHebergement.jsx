import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage, useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Tent, Home, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';

// Données exactes des hébergements du Camping Paradis
const emplacements = {
  "Emplacement 6A": [
    ...Array.from({ length: 24 }, (_, i) => String(i + 1)),
    ...Array.from({ length: 13 }, (_, i) => String(87 + i)),
    ...Array.from({ length: 17 }, (_, i) => String(161 + i)),
    ...Array.from({ length: 6 }, (_, i) => String(226 + i)),
    "239", "244", "245", "256", "257", "258", "259"
  ].sort((a, b) => Number(a) - Number(b)),
  "Emplacement 10A": ["183", "184", "185", "186", "218", "219", "220", "221", "222", "223"],
  "Emplacement Eau+10A": Array.from({ length: 22 }, (_, i) => String(117 + i))
};

const logements = {
  "Chalet Eco": ["C1", "C2", "C3", "C4", "C5", "C6"],
  "Chalet Classique": ["A1", "A2", "A3", "A4"],
  "Mobil-home Eco": ["H01", "H02", "H03", "H04", "H05", "H06", "H07", "H08", "H09", "H10", "H11", "H12", "H13", "H14", "H15", "H16"],
  "Mobil-home Eco Clim": ["OO1", "OO2", "OO3", "OO4", "OO5", "OO6"],
  "Mobil-home Classique": ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "D11", "D12", "D13", "D14", "D15", "D16", "D17", "D18", "D19", "D20", "D21"],
  "Mobil-home Classique Clim": ["V01", "V02", "V03", "V04", "V05", "V06", "V07", "V08", "V09", "V10", "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19", "V20", "V21", "V22"],
  "Mobil-home Classique 3ch": ["L1", "L2", "L3", "L4", "L5", "L6"],
  "Confort+ 2ch": ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09", "P10", "P11", "P12"],
  "Confort+ 3ch": ["T01", "T02", "T03", "T04", "T05", "T06"],
  "Premium 2ch": ["R1", "R2", "R3", "R6", "R7", "R8", "R9", "R10", "R13", "R14", "R15", "R16", "R17", "R18"],
  "Premium 3ch": ["M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10", "M11", "M12", "M13", "M14"],
  "Premium Twins": ["R11/R04", "R12/R05"],
  "Cottage Premium": ["J1", "J2", "J3", "J4", "J5"]
};

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