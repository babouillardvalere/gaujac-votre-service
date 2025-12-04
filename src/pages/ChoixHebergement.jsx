import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Tent, Home, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';

// Données des emplacements
const emplacements = {
  "6A": [87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 226, 227, 228, 229, 230, 231, 239, 244, 245, 256, 257, 258, 259, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  "10A": [183, 184, 185, 186, 218, 219, 220, 221, 222, 223],
  "Eau + 10A": [117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138]
};

// Données des logements
const logements = {
  "Chalet Éco 1 ch": ["C1", "C2", "C3", "C4", "C5", "C6"],
  "Chalet Classique 1 ch": ["A1", "A2", "A3", "A4"],
  "Mobil-home Éco 2 ch": ["H01", "H02", "H03", "H04", "H05", "H06", "H07", "H08", "H09", "H10", "H11", "H12", "H13", "H14", "H15", "H16"],
  "Mobil-home Éco Clim": ["OO1", "OO2", "OO3", "OO4", "OO5", "OO6"],
  "Mobil-home Classique": ["D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10", "D11", "D12", "D13", "D14", "D15", "D16", "D17", "D18", "D19", "D20", "D21"],
  "Mobil-home Classique Clim": ["V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12", "V13", "V14", "V15", "V16", "V17", "V18", "V19", "V20", "V21", "V22"],
  "Mobil-home Classique 3 ch": ["L1", "L2", "L3", "L4", "L5", "L6"],
  "MH Confort+ 2 ch": ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09", "P10", "P11", "P12"],
  "MH Confort+ 3 ch": ["T01", "T02", "T03", "T04", "T05", "T06"],
  "MH Premium 2 ch": ["R1", "R2", "R3", "R6", "R7", "R8", "R9", "R10", "R13", "R14", "R15", "R16", "R17", "R18"],
  "MH Premium 3 ch": ["M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10", "M11", "M12", "M13", "M14"],
  "MH Premium Twins": ["R04", "R05", "R11", "R12"],
  "Cottage Premium 2 ch": ["J1", "J2", "J3", "J4", "J5"]
};

export default function ChoixHebergement() {
  const navigate = useNavigate();
  const [step, setStep] = useState('type'); // type, categorie, numero
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
    
    // Enregistrer dans sessionStorage
    sessionStorage.setItem('hebergement_type', hebergementType);
    sessionStorage.setItem('hebergement_categorie', categorie);
    sessionStorage.setItem('hebergement_numero', String(num));
    
    // Rediriger vers signalement
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
    <div className="min-h-screen px-4 py-6">
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
              Retour
            </button>
            <CardTitle className="text-xl font-heading text-white">
              {step === 'type' && 'Type d\'hébergement'}
              {step === 'categorie' && (hebergementType === 'Emplacement' ? 'Catégorie d\'emplacement' : 'Type de logement')}
              {step === 'numero' && 'Votre numéro'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              {/* Étape 1: Type */}
              {step === 'type' && (
                <motion.div
                  key="type"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => handleTypeSelect('Emplacement')}
                    className="w-full p-5 bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] rounded-xl flex items-center gap-4 transition-all"
                  >
                    <div className="w-14 h-14 bg-[#FFD700] rounded-xl flex items-center justify-center">
                      <Tent className="w-7 h-7 text-[#0077A8]" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading text-lg text-[#0077A8]">Emplacement nu</h3>
                      <p className="font-body text-sm text-gray-500">Tente, caravane, camping-car</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTypeSelect('Mobil-home')}
                    className="w-full p-5 bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] rounded-xl flex items-center gap-4 transition-all"
                  >
                    <div className="w-14 h-14 bg-[#00AEEF] rounded-xl flex items-center justify-center">
                      <Home className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading text-lg text-[#0077A8]">Mobil-home / Cottage</h3>
                      <p className="font-body text-sm text-gray-500">Logement équipé</p>
                    </div>
                  </button>
                </motion.div>
              )}

              {/* Étape 2: Catégorie */}
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

              {/* Étape 3: Numéro */}
              {step === 'numero' && (
                <motion.div
                  key="numero"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="font-body text-[#0077A8] mb-4">
                    Sélectionnez votre {hebergementType === 'Emplacement' ? 'emplacement' : 'logement'} :
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