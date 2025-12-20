import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import ArriveeProgressBar from '../components/ArriveeProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Tent, Building, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { emplacements, logements } from '../components/accommodationData';

export default function ClientArriveeHebergement() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [etapeSelection, setEtapeSelection] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState('');
  const [selectedNumero, setSelectedNumero] = useState('');

  const dossierId = sessionStorage.getItem('arrivee_dossier_id');
  const nom = sessionStorage.getItem('arrivee_nom');

  useEffect(() => {
    if (!dossierId || !nom) {
      navigate(createPageUrl('ClientArriveeIdentite'));
    }
  }, [dossierId, nom, navigate]);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setSelectedCategorie('');
    setSelectedNumero('');
    setEtapeSelection(2);
  };

  const handleCategorieChange = (categorie) => {
    setSelectedCategorie(categorie);
    setSelectedNumero('');
    setEtapeSelection(3);
  };

  const handleRetourType = () => {
    setSelectedType('');
    setSelectedCategorie('');
    setSelectedNumero('');
    setEtapeSelection(1);
  };

  const handleRetourCategorie = () => {
    setSelectedCategorie('');
    setSelectedNumero('');
    setEtapeSelection(2);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType || !selectedNumero) {
      toast.error(lang === 'fr' 
        ? 'Veuillez sélectionner un hébergement'
        : 'Please select accommodation');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      sessionStorage.setItem('arrivee_type_logement', selectedType);
      sessionStorage.setItem('arrivee_categorie', selectedCategorie);
      sessionStorage.setItem('arrivee_numero', selectedNumero);
      
      // Mettre à jour stay_id avec le vrai numéro de logement
      const dateArrivee = sessionStorage.getItem('arrivee_date_arrivee') || new Date().toISOString().split('T')[0];
      const dateFormatted = dateArrivee.replace(/-/g, '');
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const stayId = `ARR-${selectedNumero}-${dateFormatted}-${random}`;
      sessionStorage.setItem('stay_id', stayId);

      await base44.entities.DossierArrivee.update(dossierId, {
        type_logement: selectedType,
        categorie_logement: selectedCategorie,
        numero_logement: selectedNumero,
        etape_3_terminee: true,
        etape_actuelle: 4
      });

      toast.success(lang === 'fr' ? 'Hébergement sélectionné ✅' : 'Accommodation selected ✅');
      navigate(createPageUrl('ClientControleInventaire'));
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur' : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const categoriesEmplacement = Object.keys(emplacements);
  const categoriesLogement = Object.keys(logements);
  
  const numerosDisponibles = selectedType === 'emplacement' 
    ? (selectedCategorie ? emplacements[selectedCategorie] || [] : [])
    : (selectedCategorie ? logements[selectedCategorie] || [] : []);

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientArriveeIdentite'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-2">
            🏡 {lang === 'fr' ? 'Arrivée' : 'Arrival'}
          </h1>

          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-4">
              <ArriveeProgressBar etapeActuelle={2} lang={lang} />
            </CardContent>
          </Card>

          <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
            <CardContent className="p-6 space-y-6">
              {/* ÉTAPE 1 - Type de locatif */}
              {etapeSelection === 1 && (
                <div>
                  <h2 className="font-heading text-2xl text-[#0077A8] mb-6 text-center">
                    {lang === 'fr' ? 'Type de locatif' : 'Rental type'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      onClick={() => handleTypeChange('emplacement')}
                      className="p-8 rounded-xl border-2 border-gray-300 hover:border-[#00AEEF] hover:bg-blue-50 transition-all group"
                    >
                      <Tent className="w-20 h-20 mx-auto mb-4 text-[#00AEEF] group-hover:scale-110 transition-transform" />
                      <p className="font-heading text-xl text-[#0077A8] mb-2">
                        {lang === 'fr' ? 'Emplacement nu' : 'Pitch'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {lang === 'fr' ? 'Camping / Tente / Caravane' : 'Camping / Tent / Caravan'}
                      </p>
                    </button>

                    <button
                      onClick={() => handleTypeChange('mobilhome')}
                      className="p-8 rounded-xl border-2 border-gray-300 hover:border-[#22c55e] hover:bg-green-50 transition-all group"
                    >
                      <Building className="w-20 h-20 mx-auto mb-4 text-[#22c55e] group-hover:scale-110 transition-transform" />
                      <p className="font-heading text-xl text-[#0077A8] mb-2">
                        {lang === 'fr' ? 'Hébergement' : 'Accommodation'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {lang === 'fr' ? 'Mobil-home / Chalet / Cottage' : 'Mobile home / Chalet / Cottage'}
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 2 - Catégories en boutons */}
              {etapeSelection === 2 && selectedType && (
                <div>
                  <button
                    onClick={handleRetourType}
                    className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {lang === 'fr' ? 'Changer type' : 'Change type'}
                  </button>

                  <h2 className="font-heading text-xl text-[#0077A8] mb-6 text-center">
                    {selectedType === 'emplacement' 
                      ? (lang === 'fr' ? 'Catégorie d\'emplacement' : 'Pitch category')
                      : (lang === 'fr' ? 'Catégorie d\'hébergement' : 'Accommodation category')}
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedType === 'emplacement' ? (
                      categoriesEmplacement.map(cat => (
                        <button
                          key={cat}
                          onClick={() => handleCategorieChange(cat)}
                          className="p-5 rounded-xl border-2 border-gray-300 hover:border-[#00AEEF] hover:bg-blue-50 transition-all text-center group"
                        >
                          <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">⚡</div>
                          <p className="font-heading text-sm text-[#0077A8]">
                            {cat.replace('Emplacement ', '')}
                          </p>
                        </button>
                      ))
                    ) : (
                      categoriesLogement.map(cat => (
                        <button
                          key={cat}
                          onClick={() => handleCategorieChange(cat)}
                          className="p-4 rounded-xl border-2 border-gray-300 hover:border-[#22c55e] hover:bg-green-50 transition-all text-center group"
                        >
                          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏠</div>
                          <p className="font-heading text-xs text-[#0077A8]">
                            {cat}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 - Numéros en boutons */}
              {etapeSelection === 3 && selectedCategorie && (
                <div>
                  <button
                    onClick={handleRetourCategorie}
                    className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {lang === 'fr' ? 'Changer catégorie' : 'Change category'}
                  </button>

                  <h2 className="font-heading text-xl text-[#0077A8] mb-2 text-center">
                    {lang === 'fr' ? 'Numéro de locatif' : 'Rental number'}
                  </h2>
                  <p className="text-sm text-gray-600 text-center mb-6">
                    {selectedCategorie}
                  </p>

                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2 max-h-96 overflow-y-auto p-2">
                    {numerosDisponibles.map(num => (
                      <button
                        key={num}
                        onClick={() => setSelectedNumero(num)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          selectedNumero === num
                            ? 'border-[#22c55e] bg-green-50 scale-105'
                            : 'border-gray-300 hover:border-[#00AEEF] hover:bg-blue-50'
                        }`}
                      >
                        <p className="font-bold text-lg text-[#0077A8]">{num}</p>
                      </button>
                    ))}
                  </div>

                  {selectedNumero && (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl font-heading mt-6 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {lang === 'fr' ? 'Chargement...' : 'Loading...'}
                        </>
                      ) : (
                        <>
                          {lang === 'fr' ? 'Continuer vers inventaire' : 'Continue to inventory'}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}