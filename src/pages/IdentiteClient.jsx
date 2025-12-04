import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function IdentiteClient() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateArrivee: '',
    dateDepart: ''
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
    }
    
    // Restore from session if exists
    const savedData = sessionStorage.getItem('client_identity');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, [navigate]);

  const validateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const arrivee = new Date(formData.dateArrivee);
    const depart = new Date(formData.dateDepart);
    
    const newErrors = {};

    if (arrivee > today) {
      newErrors.dateArrivee = t('date_error_arrivee');
    }
    
    if (depart < today) {
      newErrors.dateDepart = t('date_error_depart');
    }
    
    if (arrivee >= depart) {
      newErrors.dateOrdre = t('date_error_ordre');
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check all fields filled
    if (!formData.nom || !formData.prenom || !formData.dateArrivee || !formData.dateDepart) {
      setErrors({ general: t('champs_obligatoires') });
      return;
    }

    const dateErrors = validateDates();
    if (Object.keys(dateErrors).length > 0) {
      setErrors(dateErrors);
      return;
    }

    // Store in session
    sessionStorage.setItem('client_identity', JSON.stringify(formData));
    sessionStorage.setItem('user_name', formData.nom);
    sessionStorage.setItem('user_surname', formData.prenom);
    sessionStorage.setItem('user_date_arrivee', formData.dateArrivee);
    sessionStorage.setItem('user_date_depart', formData.dateDepart);

    navigate('/ChoixHebergement');
  };

  const isFormValid = () => {
    return formData.nom && formData.prenom && formData.dateArrivee && formData.dateDepart;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Logo className="h-20" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <button 
                onClick={() => navigate('/Home')}
                className="flex items-center text-slate-500 hover:text-sky-600 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('retour')}
              </button>
              <CardTitle className="text-2xl font-light text-slate-800">
                {t('identite_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="prenom" className="text-slate-700">{t('prenom')}</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                    placeholder="Jean"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom" className="text-slate-700">{t('nom')}</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                    placeholder="Dupont"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateArrivee" className="text-slate-700">{t('date_arrivee')}</Label>
                  <Input
                    id="dateArrivee"
                    type="date"
                    value={formData.dateArrivee}
                    onChange={(e) => setFormData({ ...formData, dateArrivee: e.target.value })}
                    className="h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                  />
                  {errors.dateArrivee && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.dateArrivee}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateDepart" className="text-slate-700">{t('date_depart')}</Label>
                  <Input
                    id="dateDepart"
                    type="date"
                    value={formData.dateDepart}
                    onChange={(e) => setFormData({ ...formData, dateDepart: e.target.value })}
                    className="h-12 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                  />
                  {errors.dateDepart && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.dateDepart}
                    </p>
                  )}
                </div>

                {errors.dateOrdre && (
                  <p className="text-red-500 text-sm flex items-center gap-1 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {errors.dateOrdre}
                  </p>
                )}

                {errors.general && (
                  <p className="text-red-500 text-sm flex items-center gap-1 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {errors.general}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!isFormValid()}
                  className="w-full h-12 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium rounded-xl shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('suivant')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}