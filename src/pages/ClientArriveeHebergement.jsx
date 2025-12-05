import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { emplacements, logements } from '../components/accommodationData';
import { getCodeFromCategory } from '../components/categoryCodeMapping';
import InventaireDisplay from '../components/InventaireDisplay';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle, Home, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientArriveeHebergement() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [typeLogement, setTypeLogement] = useState('');
  const [categorie, setCategorie] = useState('');
  const [numero, setNumero] = useState('');
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [codeCategorie, setCodeCategorie] = useState('');

  useEffect(() => {
    // Vérifier que l'identité est en session
    const nom = sessionStorage.getItem('arrivee_nom');
    if (!nom) {
      navigate(createPageUrl('ClientArriveeIdentite'));
    }
  }, [navigate]);

  useEffect(() => {
    if (categorie) {
      if (typeLogement === 'emplacement') {
        const numbers = emplacements[categorie] || [];
        setAvailableNumbers(numbers);
        setCodeCategorie('');
      } else {
        const numbers = logements[categorie] || [];
        setAvailableNumbers(numbers);
        const code = getCodeFromCategory(categorie);
        setCodeCategorie(code);
      }
      setNumero('');
    }
  }, [categorie, typeLogement]);

  const handleTypeSelection = (type) => {
    setTypeLogement(type);
    setCategorie('');
    setNumero('');
    setStep(2);
  };

  const handleSubmit = () => {
    if (!typeLogement || !categorie || !numero) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    sessionStorage.setItem('arrivee_type_logement', typeLogement);
    sessionStorage.setItem('arrivee_categorie', categorie);
    sessionStorage.setItem('arrivee_numero', numero);

    // Afficher confirmation et rediriger
    toast.success(lang === 'fr' 
      ? '✅ Votre arrivée a bien été enregistrée !'
      : '✅ Your arrival has been registered!'
    );
    
    setTimeout(() => {
      // Nettoyer la session
      sessionStorage.removeItem('arrivee_nom');
      sessionStorage.removeItem('arrivee_prenom');
      sessionStorage.removeItem('arrivee_date_arrivee');
      sessionStorage.removeItem('arrivee_date_depart');
      sessionStorage.removeItem('arrivee_type_logement');
      sessionStorage.removeItem('arrivee_categorie');
      sessionStorage.removeItem('arrivee_numero');
      
      navigate(createPageUrl('Home'));
    }, 2000);
  };

  const emplacementCategories = [
    { value: 'Emplacement 6A', label: lang === 'fr' ? 'Électricité 6A' : 'Electricity 6A' },
    { value: 'Emplacement 10A', label: lang === 'fr' ? 'Électricité 10A' : 'Electricity 10A' },
    { value: 'Emplacement Eau+10A', label: lang === 'fr' ? 'Eau + 10A' : 'Water + 10A' }
  ];

  const mobilhomeCategories = [
    { value: 'Chalet Eco', label: lang === 'fr' ? 'Chalet Éco 1 ch' : 'Eco Chalet 1BR' },
    { value: 'Chalet Classique', label: lang === 'fr' ? 'Chalet Classique 1 ch' : 'Classic Chalet 1BR' },
    { value: 'Mobil-home Eco', label: lang === 'fr' ? 'MH Éco 2 ch' : 'Eco MH 2BR' },
    { value: 'Mobil-home Eco Clim', label: 'MH Éco Clim' },
    { value: 'Mobil-home Classique', label: lang === 'fr' ? 'MH Classique' : 'Classic MH' },
    { value: 'Mobil-home Classique Clim', label: lang === 'fr' ? 'MH Classique Clim' : 'Classic MH AC' },
    { value: 'Mobil-home Classique 3ch', label: lang === 'fr' ? 'MH Classique 3 ch' : 'Classic MH 3BR' },
    { value: 'Confort+ 2ch', label: lang === 'fr' ? 'MH Confort+ 2 ch' : 'Comfort+ MH 2BR' },
    { value: 'Confort+ 3ch', label: lang === 'fr' ? 'MH Confort+ 3 ch' : 'Comfort+ MH 3BR' },
    { value: 'Premium 2ch', label: lang === 'fr' ? 'MH Premium 2 ch' : 'Premium MH 2BR' },
    { value: 'Premium 3ch', label: lang === 'fr' ? 'MH Premium 3 ch' : 'Premium MH 3BR' },
    { value: 'Premium Twins', label: 'MH Premium Twins' },
    { value: 'Cottage Premium', label: lang === 'fr' ? 'Cottage Premium 2 ch' : 'Premium Cottage 2BR' }
  ];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => step === 1 ? navigate(createPageUrl('ClientArriveeIdentite')) : setStep(1)}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-2">
            🏡 {lang === 'fr' ? 'Arrivée' : 'Arrival'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-6">
            {lang === 'fr' ? 'Étape 2/2 : Hébergement' : 'Step 2/2: Accommodation'}
          </p>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <Card 
                  className="border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] cursor-pointer transition-all rounded-xl"
                  onClick={() => handleTypeSelection('emplacement')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#00AEEF] rounded-xl flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="font-heading text-xl text-[#0077A8]">
                          {lang === 'fr' ? '⛺ Emplacement nu' : '⛺ Pitch'}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {lang === 'fr' ? 'Camping / Tente' : 'Camping / Tent'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="border-2 border-[#22c55e]/30 hover:border-[#22c55e] cursor-pointer transition-all rounded-xl"
                  onClick={() => handleTypeSelection('mobilhome')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#22c55e] rounded-xl flex items-center justify-center">
                        <Home className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="font-heading text-xl text-[#0077A8]">
                          {lang === 'fr' ? '🏠 Mobil-home' : '🏠 Mobile home'}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {lang === 'fr' ? 'Hébergement équipé' : 'Equipped accommodation'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="border-2 border-[#22c55e]/30 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <label className="font-heading text-[#0077A8] block mb-2">
                        {lang === 'fr' ? 'Catégorie' : 'Category'} *
                      </label>
                      <Select value={categorie} onValueChange={setCategorie}>
                        <SelectTrigger className="border-2 border-gray-200 focus:border-[#22c55e] rounded-xl">
                          <SelectValue placeholder={lang === 'fr' ? 'Sélectionner' : 'Select'} />
                        </SelectTrigger>
                        <SelectContent>
                          {(typeLogement === 'emplacement' ? emplacementCategories : mobilhomeCategories).map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {categorie && (
                      <>
                        <div>
                          <label className="font-heading text-[#0077A8] block mb-2">
                            {lang === 'fr' ? 'Numéro' : 'Number'} *
                          </label>
                          <Select value={numero} onValueChange={setNumero}>
                            <SelectTrigger className="border-2 border-gray-200 focus:border-[#22c55e] rounded-xl">
                              <SelectValue placeholder={lang === 'fr' ? 'Sélectionner' : 'Select'} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableNumbers.map(num => (
                                <SelectItem key={num} value={num}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {typeLogement === 'mobilhome' && codeCategorie && (
                          <div className="mt-4">
                            <InventaireDisplay codeCategorie={codeCategorie} lang={lang} />
                          </div>
                        )}
                      </>
                    )}

                    <Button
                      onClick={handleSubmit}
                      disabled={!categorie || !numero}
                      className="w-full h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl font-heading"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {lang === 'fr' ? 'Confirmer mon arrivée' : 'Confirm my arrival'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}