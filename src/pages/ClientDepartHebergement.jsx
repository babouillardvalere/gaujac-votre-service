import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import SelecteurHebergement from '../components/reception/SelecteurHebergement';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientDepartHebergement() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    const nom = sessionStorage.getItem('depart_nom');
    if (!nom) {
      navigate(createPageUrl('ClientDepartIdentite'));
    }
  }, [navigate]);

  const handleSubmit = () => {
    if (!selection) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    const typeLogement = selection.type === 'Emplacement' ? 'emplacement' : 'mobilhome';

    sessionStorage.setItem('depart_type_logement', typeLogement);
    sessionStorage.setItem('depart_categorie', selection.categorie);
    sessionStorage.setItem('depart_numero', selection.numero);

    navigate(createPageUrl('ClientDepartChecklist'));
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('ClientDepartIdentite'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-2">
            🚗 {lang === 'fr' ? 'Départ' : 'Departure'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-6">
            {lang === 'fr' ? 'Étape 2/4 : Hébergement' : 'Step 2/4: Accommodation'}
          </p>

          <SelecteurHebergement 
            onSelect={setSelection}
            lang={lang}
          />

          {selection && (
            <Button
              onClick={handleSubmit}
              className="w-full h-12 mt-6 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading"
            >
              {t('suivant')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}