import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tent, Home, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { emplacements, logements } from '../accommodationData';

export default function SelecteurHebergement({ 
  onSelect, 
  defaultType = null,
  defaultCategorie = null,
  defaultNumero = null,
  lang = 'fr' 
}) {
  const [step, setStep] = useState(defaultType ? 'categorie' : 'type');
  const [hebergementType, setHebergementType] = useState(defaultType);
  const [categorie, setCategorie] = useState(defaultCategorie);
  const [numero, setNumero] = useState(defaultNumero);

  const t = (key) => {
    const translations = {
      fr: {
        choix_hebergement: 'Choisir un hébergement',
        emplacement: 'Emplacement',
        logement: 'Hébergement',
        camping_tente: 'Tente / Caravane / Camping-car',
        mobilhome_cottage: 'Mobil-home / Cottage',
        type_emplacement: 'Type d\'emplacement',
        type_hebergement: 'Type d\'hébergement',
        choisir_numero: 'Choisir le numéro',
        select_numero: 'Sélectionnez un numéro',
        retour: 'Retour'
      },
      en: {
        choix_hebergement: 'Choose accommodation',
        emplacement: 'Pitch',
        logement: 'Accommodation',
        camping_tente: 'Tent / Caravan / Motorhome',
        mobilhome_cottage: 'Mobile home / Cottage',
        type_emplacement: 'Pitch type',
        type_hebergement: 'Accommodation type',
        choisir_numero: 'Choose number',
        select_numero: 'Select a number',
        retour: 'Back'
      }
    };
    return translations[lang]?.[key] || translations.fr[key] || key;
  };

  const handleTypeSelect = (type) => {
    setHebergementType(type);
    setCategorie(null);
    setNumero(null);
    setStep('categorie');
  };

  const handleCategorieSelect = (cat) => {
    setCategorie(cat);
    setNumero(null);
    setStep('numero');
  };

  const handleNumeroSelect = (num) => {
    setNumero(num);
    if (onSelect) {
      onSelect({
        type: hebergementType,
        categorie: categorie,
        numero: num
      });
    }
  };

  const goBack = () => {
    if (step === 'numero') {
      setStep('categorie');
      setNumero(null);
    } else if (step === 'categorie') {
      setStep('type');
      setCategorie(null);
      setHebergementType(null);
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
    <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
      <CardHeader className="bg-[#00AEEF] pb-4">
        {step !== 'type' && (
          <button
            onClick={goBack}
            className="flex items-center text-white/80 hover:text-white text-sm mb-2 font-body"
          >
            ← {t('retour')}
          </button>
        )}
        <CardTitle className="text-xl font-heading text-white">
          {step === 'type' && t('choix_hebergement')}
          {step === 'categorie' && (hebergementType === 'Emplacement' ? t('type_emplacement') : t('type_hebergement'))}
          {step === 'numero' && t('choisir_numero')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        <AnimatePresence mode="wait">
          {/* Étape 1 : Choix du type */}
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
                className="w-full p-5 bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] rounded-xl flex items-center gap-4 transition-all min-h-[80px] focus:ring-4 focus:ring-[#FFD700]"
              >
                <div className="w-14 h-14 bg-[#FFD700] rounded-xl flex items-center justify-center">
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
              >
                <div className="w-14 h-14 bg-[#00AEEF] rounded-xl flex items-center justify-center">
                  <Home className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-heading text-lg text-[#0077A8]">🏠 {t('logement')}</h3>
                  <p className="font-body text-sm text-gray-500">{t('mobilhome_cottage')}</p>
                </div>
              </button>
            </motion.div>
          )}

          {/* Étape 2 : Catégories sous forme d'onglets */}
          {step === 'categorie' && (
            <motion.div
              key="categorie"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Tabs value={categorie} onValueChange={handleCategorieSelect} className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-4">
                  {getCategories().map((cat) => (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="px-4 py-2 rounded-lg border-2 border-[#00AEEF]/30 data-[state=active]:border-[#00AEEF] data-[state=active]:bg-[#e6f7ff] data-[state=active]:text-[#0077A8] font-heading transition-all hover:border-[#00AEEF]"
                    >
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </motion.div>
          )}

          {/* Étape 3 : Numéros filtrés */}
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
                    className={`p-3 bg-white border-2 rounded-xl font-heading transition-all ${
                      numero === num
                        ? 'border-[#00AEEF] bg-[#00AEEF] text-white'
                        : 'border-[#00AEEF]/30 hover:border-[#00AEEF] hover:bg-[#e6f7ff] text-[#0077A8]'
                    }`}
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
  );
}