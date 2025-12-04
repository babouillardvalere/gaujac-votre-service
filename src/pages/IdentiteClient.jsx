import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';

export default function IdentiteClient() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  
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
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nom.trim()) newErrors.nom = 'Requis';
    if (!formData.prenom.trim()) newErrors.prenom = 'Requis';
    if (!formData.dateArrivee) newErrors.dateArrivee = 'Requis';
    if (!formData.dateDepart) newErrors.dateDepart = 'Requis';
    
    if (formData.dateArrivee && formData.dateArrivee > today) {
      newErrors.dateArrivee = 'La date d\'arrivée doit être aujourd\'hui ou avant';
    }
    
    if (formData.dateArrivee && formData.dateDepart && formData.dateDepart < formData.dateArrivee) {
      newErrors.dateDepart = 'La date de départ doit être après l\'arrivée';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return formData.nom.trim() && 
           formData.prenom.trim() && 
           formData.dateArrivee && 
           formData.dateDepart &&
           formData.dateArrivee <= today &&
           formData.dateDepart >= formData.dateArrivee;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      sessionStorage.setItem('user_nom', formData.nom);
      sessionStorage.setItem('user_prenom', formData.prenom);
      sessionStorage.setItem('user_date_arrivee', formData.dateArrivee);
      sessionStorage.setItem('user_date_depart', formData.dateDepart);
      navigate(createPageUrl('ConditionsClient'));
    }
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo className="h-20" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <h1 className="font-handwritten text-3xl text-[#00AEEF]">Bienvenue !</h1>
          <p className="font-body text-[#0077A8]">Commençons par vos informations</p>
        </motion.div>

        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="bg-[#00AEEF] pb-4">
            <CardTitle className="text-xl font-heading text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Votre identité
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-heading text-[#0077A8]">Prénom *</Label>
                <Input
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Jean"
                  className={`border-[#00AEEF]/30 rounded-xl font-body ${errors.prenom ? 'border-red-500' : ''}`}
                />
                {errors.prenom && <p className="text-red-500 text-xs">{errors.prenom}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-heading text-[#0077A8]">Nom *</Label>
                <Input
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Dupont"
                  className={`border-[#00AEEF]/30 rounded-xl font-body ${errors.nom ? 'border-red-500' : ''}`}
                />
                {errors.nom && <p className="text-red-500 text-xs">{errors.nom}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-heading text-[#0077A8] flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date d'arrivée *
                </Label>
                <Input
                  type="date"
                  value={formData.dateArrivee}
                  max={today}
                  onChange={(e) => setFormData({ ...formData, dateArrivee: e.target.value })}
                  className={`border-[#00AEEF]/30 rounded-xl font-body ${errors.dateArrivee ? 'border-red-500' : ''}`}
                />
                {errors.dateArrivee && <p className="text-red-500 text-xs">{errors.dateArrivee}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-heading text-[#0077A8] flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date de départ *
                </Label>
                <Input
                  type="date"
                  value={formData.dateDepart}
                  min={formData.dateArrivee || today}
                  onChange={(e) => setFormData({ ...formData, dateDepart: e.target.value })}
                  className={`border-[#00AEEF]/30 rounded-xl font-body ${errors.dateDepart ? 'border-red-500' : ''}`}
                />
                {errors.dateDepart && <p className="text-red-500 text-xs">{errors.dateDepart}</p>}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading mt-4 disabled:opacity-50"
            >
              Continuer
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}