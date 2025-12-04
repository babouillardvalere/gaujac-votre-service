import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import { emplacementCategories, logementCategories } from '../components/accommodationData';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Tent, Home, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChoixHebergement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [step, setStep] = useState('type'); // type, category, number
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
      return;
    }
    
    // Check if identity is set
    if (!sessionStorage.getItem('user_name')) {
      navigate('/IdentiteClient');
    }
  }, [navigate]);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setStep('category');
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setStep('number');
  };

  const handleNumberSelect = (number) => {
    sessionStorage.setItem('hebergement_type', selectedType);
    sessionStorage.setItem('hebergement_categorie', selectedCategory);
    sessionStorage.setItem('hebergement_numero', number.toString());
    navigate(`/Signalement?id=${number}`);
  };

  const goBack = () => {
    if (step === 'number') {
      setStep('category');
      setSelectedCategory(null);
    } else if (step === 'category') {
      setStep('type');
      setSelectedType(null);
    } else {
      navigate('/IdentiteClient');
    }
  };

  const categories = selectedType === 'emplacement' ? emplacementCategories : logementCategories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Logo className="h-20" />
        </motion.div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <button 
              onClick={goBack}
              className="flex items-center text-slate-500 hover:text-sky-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('retour')}
            </button>
            <CardTitle className="text-2xl font-light text-slate-800">
              {t('choix_hebergement')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {/* Step 1: Type selection */}
              {step === 'type' && (
                <motion.div
                  key="type"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => handleTypeSelect('emplacement')}
                    className="w-full group bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl p-6 text-left transition-all border border-emerald-100"
                  >
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Tent className="w-7 h-7 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-slate-800">{t('emplacement')}</h3>
                        <p className="text-sm text-slate-500">6A, 10A, Eau + 10A</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>

                  <button
                    onClick={() => handleTypeSelect('logement')}
                    className="w-full group bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 rounded-xl p-6 text-left transition-all border border-sky-100"
                  >
                    <div className="flex items-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Home className="w-7 h-7 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-slate-800">{t('logement')}</h3>
                        <p className="text-sm text-slate-500">Chalets, Mobil-homes, Premium...</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                </motion.div>
              )}

              {/* Step 2: Category selection */}
              {step === 'category' && (
                <motion.div
                  key="category"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-slate-500 mb-4">{t('select_categorie')}</p>
                  {Object.keys(categories).map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className="w-full group bg-white hover:bg-slate-50 rounded-xl p-4 text-left transition-all border border-slate-200 hover:border-sky-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-700 group-hover:text-sky-600">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">{categories[category].length} {selectedType === 'emplacement' ? 'emplacements' : 'logements'}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Step 3: Number selection */}
              {step === 'number' && (
                <motion.div
                  key="number"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="text-sm text-slate-500 mb-4">
                    {t('select_numero')} - <span className="font-medium text-slate-700">{selectedCategory}</span>
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-80 overflow-y-auto p-1">
                    {categories[selectedCategory]?.map((number) => (
                      <button
                        key={number}
                        onClick={() => handleNumberSelect(number)}
                        className="aspect-square bg-white hover:bg-sky-500 border border-slate-200 hover:border-sky-500 rounded-xl flex items-center justify-center font-semibold text-slate-700 hover:text-white transition-all shadow-sm hover:shadow-md"
                      >
                        {number}
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