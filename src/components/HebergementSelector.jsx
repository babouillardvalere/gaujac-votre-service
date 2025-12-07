import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { emplacements, logements } from './accommodationData';

export default function HebergementSelector({ onSelect, lang = 'fr' }) {
  const [step, setStep] = useState('type'); // type, categorie, numero
  const [type, setType] = useState('');
  const [categorie, setCategorie] = useState('');
  const [numero, setNumero] = useState('');

  const handleTypeSelect = (selectedType) => {
    setType(selectedType);
    setCategorie('');
    setNumero('');
    setStep('categorie');
    onSelect(null);
  };

  const handleCategorieSelect = (selectedCat) => {
    setCategorie(selectedCat);
    setNumero('');
    setStep('numero');
    onSelect(null);
  };

  const handleNumeroSelect = (selectedNum) => {
    setNumero(selectedNum);
    onSelect({
      type,
      categorie,
      numero: selectedNum
    });
  };

  const goBack = () => {
    if (step === 'numero') {
      setStep('categorie');
      setNumero('');
      onSelect(null);
    } else if (step === 'categorie') {
      setStep('type');
      setCategorie('');
      setType('');
      onSelect(null);
    }
  };

  const getCategories = () => {
    if (type === 'Emplacement') {
      return Object.keys(emplacements);
    }
    return Object.keys(logements);
  };

  const getNumeros = () => {
    if (type === 'Emplacement') {
      return emplacements[categorie] || [];
    }
    return logements[categorie] || [];
  };

  return (
    <Card className="border-2 border-[#00AEEF]">
      <CardContent className="p-6">
        {step !== 'type' && (
          <button
            onClick={goBack}
            className="text-sm text-gray-600 hover:text-[#00AEEF] mb-4 flex items-center gap-1"
          >
            ← {lang === 'fr' ? 'Retour' : 'Back'}
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <h3 className="font-heading text-lg text-[#0077A8] mb-4">
                {lang === 'fr' ? 'Type d\'hébergement' : 'Accommodation type'}
              </h3>
              <button
                onClick={() => handleTypeSelect('Emplacement')}
                className="w-full p-4 bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:bg-[#e6f7ff] rounded-xl flex items-center gap-4 transition-all"
              >
                <div className="w-12 h-12 bg-[#FFD700] rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#0077A8]" />
                </div>
                <div className="text-left">
                  <p className="font-heading text-[#0077A8]">⛺ {lang === 'fr' ? 'Emplacement' : 'Pitch'}</p>
                  <p className="text-sm text-gray-500">{lang === 'fr' ? 'Camping / Tente' : 'Camping / Tent'}</p>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelect('Mobil-home')}
                className="w-full p-4 bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:bg-[#e6f7ff] rounded-xl flex items-center gap-4 transition-all"
              >
                <div className="w-12 h-12 bg-[#00AEEF] rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-heading text-[#0077A8]">🏠 {lang === 'fr' ? 'Hébergement' : 'Accommodation'}</p>
                  <p className="text-sm text-gray-500">{lang === 'fr' ? 'Mobil-home / Cottage' : 'Mobile home / Cottage'}</p>
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
              className="space-y-3"
            >
              <h3 className="font-heading text-lg text-[#0077A8] mb-4">
                {lang === 'fr' ? 'Catégorie' : 'Category'}
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {getCategories().map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorieSelect(cat)}
                    className="w-full p-3 bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:bg-[#e6f7ff] rounded-lg text-left transition-all"
                  >
                    <span className="font-heading text-[#0077A8]">{cat}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'numero' && (
            <motion.div
              key="numero"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="font-heading text-lg text-[#0077A8] mb-4">
                {lang === 'fr' ? 'Choisir un numéro' : 'Choose a number'}
              </h3>
              <Badge className="mb-3 bg-[#00AEEF] text-white">{categorie}</Badge>
              <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">
                {getNumeros().map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumeroSelect(num)}
                    className={`p-3 rounded-lg font-heading transition-all ${
                      numero === num
                        ? 'bg-[#00AEEF] text-white border-2 border-[#00AEEF]'
                        : 'bg-white border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] text-[#0077A8]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {numero && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-green-50 p-4 rounded-lg border-2 border-green-200 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-heading text-green-700">
              {type === 'Emplacement' ? `E${numero}` : `${numero}`} - {categorie}
            </span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}