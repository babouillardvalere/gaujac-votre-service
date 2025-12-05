import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTranslation, getLanguage } from '../components/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Calendar, MapPin, ArrowRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { emplacements, logements } from '../components/accommodationData';
import { parseISO, isAfter, isBefore, startOfDay } from 'date-fns';

export default function AvisIdentification() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const isFrench = lang === 'fr';

  const [clientNom, setClientNom] = useState('');
  const [clientPrenom, setClientPrenom] = useState('');
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [hebergementType, setHebergementType] = useState('');
  const [hebergementCategorie, setHebergementCategorie] = useState('');
  const [hebergementNumero, setHebergementNumero] = useState('');

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
      return;
    }
    // Pré-remplir depuis la session si disponible
    const nom = sessionStorage.getItem('user_nom');
    const prenom = sessionStorage.getItem('user_prenom');
    const arrivee = sessionStorage.getItem('user_date_arrivee');
    const depart = sessionStorage.getItem('user_date_depart');
    const type = sessionStorage.getItem('hebergement_type');
    const cat = sessionStorage.getItem('hebergement_categorie');
    const num = sessionStorage.getItem('hebergement_numero');
    
    if (nom) setClientNom(nom);
    if (prenom) setClientPrenom(prenom);
    if (arrivee) setDateArrivee(arrivee);
    if (depart) setDateDepart(depart);
    if (type) setHebergementType(type);
    if (cat) setHebergementCategorie(cat);
    if (num) setHebergementNumero(num);
  }, [navigate]);

  const getCategories = () => {
    if (hebergementType === 'Emplacement') return Object.keys(emplacements);
    if (hebergementType === 'Logement') return Object.keys(logements);
    return [];
  };

  const getNumeros = () => {
    if (hebergementType === 'Emplacement' && hebergementCategorie) {
      return emplacements[hebergementCategorie] || [];
    }
    if (hebergementType === 'Logement' && hebergementCategorie) {
      return logements[hebergementCategorie] || [];
    }
    return [];
  };

  const isFormValid = () => {
    return (
      clientNom.trim() !== '' &&
      clientPrenom.trim() !== '' &&
      dateArrivee !== '' &&
      dateDepart !== '' &&
      hebergementNumero !== ''
    );
  };

  const validateDates = () => {
    if (!dateArrivee || !dateDepart) return { valid: false, message: '' };
    
    const today = startOfDay(new Date());
    const arrivee = parseISO(dateArrivee);
    const depart = parseISO(dateDepart);
    
    // Date d'arrivée ne peut pas être dans le futur
    if (isAfter(arrivee, today)) {
      return { valid: false, message: isFrench ? "La date d'arrivée ne peut pas être dans le futur" : "Arrival date cannot be in the future" };
    }
    
    // Date de départ doit être après la date d'arrivée
    if (isBefore(depart, arrivee)) {
      return { valid: false, message: isFrench ? "La date de départ doit être après la date d'arrivée" : "Departure date must be after arrival date" };
    }
    
    // Vérifier que le séjour n'est pas expiré depuis plus de 7 jours
    const daysSinceDeparture = Math.floor((today - depart) / (1000 * 60 * 60 * 24));
    if (daysSinceDeparture > 7) {
      return { valid: false, message: isFrench ? "Votre séjour est terminé depuis plus de 7 jours. Vous ne pouvez plus laisser d'avis." : "Your stay ended more than 7 days ago. You can no longer leave a review." };
    }
    
    return { valid: true, message: '' };
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    const dateValidation = validateDates();
    if (!dateValidation.valid) {
      toast.error(dateValidation.message);
      return;
    }

    // Enregistrer en session
    sessionStorage.setItem('avis_client_nom', clientNom);
    sessionStorage.setItem('avis_client_prenom', clientPrenom);
    sessionStorage.setItem('avis_date_arrivee', dateArrivee);
    sessionStorage.setItem('avis_date_depart', dateDepart);
    sessionStorage.setItem('avis_hebergement', hebergementNumero);
    sessionStorage.setItem('avis_identification_complete', 'true');

    navigate(createPageUrl('AvisFormulaire'));
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo className="h-16" />
        </motion.div>

        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="bg-[#00AEEF] pb-4">
            <CardTitle className="text-xl font-heading text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              {isFrench ? 'Vos informations' : 'Your information'}
            </CardTitle>
            <p className="text-white/80 text-sm font-body mt-1">
              {isFrench ? 'Veuillez renseigner vos informations pour laisser un avis' : 'Please fill in your information to leave a review'}
            </p>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">
                  {t('nom')} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={clientNom}
                  onChange={(e) => setClientNom(e.target.value)}
                  placeholder={isFrench ? 'Votre nom' : 'Your last name'}
                  className="border-[#00AEEF]/30 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">
                  {t('prenom')} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={clientPrenom}
                  onChange={(e) => setClientPrenom(e.target.value)}
                  placeholder={isFrench ? 'Votre prénom' : 'Your first name'}
                  className="border-[#00AEEF]/30 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">
                  {t('date_arrivee')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={dateArrivee}
                  onChange={(e) => setDateArrivee(e.target.value)}
                  className="border-[#00AEEF]/30 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">
                  {t('date_depart')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={dateDepart}
                  onChange={(e) => setDateDepart(e.target.value)}
                  className="border-[#00AEEF]/30 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-heading text-[#0077A8] mb-1 block">
                {t('type_hebergement')} <span className="text-red-500">*</span>
              </label>
              <Select 
                value={hebergementType} 
                onValueChange={(v) => { 
                  setHebergementType(v); 
                  setHebergementCategorie(''); 
                  setHebergementNumero(''); 
                }}
              >
                <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                  <SelectValue placeholder={isFrench ? 'Sélectionner' : 'Select'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emplacement">⛺ {t('emplacement')}</SelectItem>
                  <SelectItem value="Logement">🏠 {t('logement')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hebergementType && (
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">
                  {t('categorie')} <span className="text-red-500">*</span>
                </label>
                <Select 
                  value={hebergementCategorie} 
                  onValueChange={(v) => { 
                    setHebergementCategorie(v); 
                    setHebergementNumero(''); 
                  }}
                >
                  <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                    <SelectValue placeholder={t('select_categorie')} />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategories().map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {hebergementCategorie && (
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">
                  {isFrench ? 'Numéro' : 'Number'} <span className="text-red-500">*</span>
                </label>
                <Select value={hebergementNumero} onValueChange={setHebergementNumero}>
                  <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                    <SelectValue placeholder={t('select_numero')} />
                  </SelectTrigger>
                  <SelectContent>
                    {getNumeros().map(num => (
                      <SelectItem key={num} value={num}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading disabled:opacity-50"
              >
                {t('suivant')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                onClick={() => navigate(createPageUrl('Home'))}
                variant="outline"
                className="w-full h-10 rounded-xl font-heading border-gray-300"
              >
                <Home className="w-4 h-4 mr-2" />
                {t('retour_accueil')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}