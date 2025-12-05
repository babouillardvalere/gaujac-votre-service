import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientDepartIdentite() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    date_arrivee: '',
    date_depart: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const arrivee = new Date(formData.date_arrivee);
    const depart = new Date(formData.date_depart);

    if (arrivee > today) {
      toast.error(lang === 'fr' 
        ? "La date d'arrivée doit être aujourd'hui ou avant"
        : "Arrival date must be today or before"
      );
      return false;
    }

    if (depart < today) {
      toast.error(lang === 'fr'
        ? "La date de départ doit être aujourd'hui ou après"
        : "Departure date must be today or after"
      );
      return false;
    }

    if (arrivee >= depart) {
      toast.error(lang === 'fr'
        ? "La date d'arrivée doit être avant la date de départ"
        : "Arrival date must be before departure date"
      );
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nom || !formData.prenom || !formData.date_arrivee || !formData.date_depart) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    if (!validateDates()) {
      return;
    }

    // Stocker en session
    sessionStorage.setItem('depart_nom', formData.nom);
    sessionStorage.setItem('depart_prenom', formData.prenom);
    sessionStorage.setItem('depart_date_arrivee', formData.date_arrivee);
    sessionStorage.setItem('depart_date_depart', formData.date_depart);

    navigate(createPageUrl('ClientDepartHebergement'));
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('ClientMenu'))}
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
            {lang === 'fr' ? 'Étape 1/4 : Identification' : 'Step 1/4: Identification'}
          </p>

          <Card className="border-2 border-[#FFA500]/30 rounded-xl">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nom" className="font-heading text-[#0077A8]">
                    {t('nom')} *
                  </Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#FFA500] rounded-xl"
                    placeholder={lang === 'fr' ? 'Votre nom' : 'Your last name'}
                  />
                </div>

                <div>
                  <Label htmlFor="prenom" className="font-heading text-[#0077A8]">
                    {t('prenom')} *
                  </Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleChange('prenom', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#FFA500] rounded-xl"
                    placeholder={lang === 'fr' ? 'Votre prénom' : 'Your first name'}
                  />
                </div>

                <div>
                  <Label htmlFor="date_arrivee" className="font-heading text-[#0077A8] flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('date_arrivee')} *
                  </Label>
                  <Input
                    id="date_arrivee"
                    type="date"
                    value={formData.date_arrivee}
                    onChange={(e) => handleChange('date_arrivee', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#FFA500] rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="date_depart" className="font-heading text-[#0077A8] flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t('date_depart')} *
                  </Label>
                  <Input
                    id="date_depart"
                    type="date"
                    value={formData.date_depart}
                    onChange={(e) => handleChange('date_depart', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#FFA500] rounded-xl"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading"
                >
                  {t('suivant')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}