import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, CheckCircle, Loader2, Home, User, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { emplacements, logements } from '../components/accommodationData';

export default function Avis() {
  const { t, lang } = useTranslation();
  const isFrench = lang === 'fr';
  
  // Step management
  const [step, setStep] = useState('identity'); // identity, rating, success
  
  // Identity form
  const [clientNom, setClientNom] = useState('');
  const [clientPrenom, setClientPrenom] = useState('');
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [hebergementType, setHebergementType] = useState('');
  const [hebergementCategorie, setHebergementCategorie] = useState('');
  const [hebergementNumero, setHebergementNumero] = useState('');
  
  // Ratings
  const [noteReactivite, setNoteReactivite] = useState(0);
  const [noteAmabilite, setNoteAmabilite] = useState(0);
  const [noteIntervention, setNoteIntervention] = useState(0);
  const [hoverReactivite, setHoverReactivite] = useState(0);
  const [hoverAmabilite, setHoverAmabilite] = useState(0);
  const [hoverIntervention, setHoverIntervention] = useState(0);
  const [commentaire, setCommentaire] = useState('');

  // Pre-fill from session if available
  useEffect(() => {
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
  }, []);

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

  const createAvisMutation = useMutation({
    mutationFn: (data) => base44.entities.Avis.create(data),
    onSuccess: () => {
      setStep('success');
    },
    onError: () => {
      toast.error(isFrench ? 'Erreur lors de l\'envoi' : 'Error while sending');
    }
  });

  const isIdentityValid = () => {
    return clientNom.trim() && clientPrenom.trim() && dateArrivee && dateDepart && hebergementNumero;
  };

  const isRatingValid = () => {
    return noteReactivite > 0 && noteAmabilite > 0 && noteIntervention > 0;
  };

  const handleSubmitIdentity = () => {
    if (!isIdentityValid()) {
      toast.error(t('champs_obligatoires'));
      return;
    }
    setStep('rating');
  };

  const handleSubmitRating = () => {
    if (!isRatingValid()) {
      toast.error(isFrench ? 'Veuillez donner une note pour chaque critère' : 'Please rate each criterion');
      return;
    }
    
    const noteGlobale = parseFloat(((noteReactivite + noteAmabilite + noteIntervention) / 3).toFixed(2));
    
    createAvisMutation.mutate({
      client_nom: clientNom,
      client_prenom: clientPrenom,
      logement_ou_emplacement: hebergementNumero,
      date_arrivee: dateArrivee,
      date_depart: dateDepart,
      note_reactivite: noteReactivite,
      note_amabilite: noteAmabilite,
      note_intervention: noteIntervention,
      note_globale: noteGlobale,
      commentaire: commentaire || null,
      visible: noteGlobale >= 4,
      mis_en_avant: false
    });
  };

  const StarRating = ({ value, hoverValue, onChange, onHover, label }) => (
    <div className="mb-6">
      <label className="text-sm font-heading text-[#0077A8] mb-2 block">{label}</label>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(0)}
            onClick={() => onChange(star)}
            className="focus:ring-2 focus:ring-[#FFD700] rounded-lg p-1"
          >
            <Star
              className={`w-10 h-10 transition-colors ${
                star <= (hoverValue || value)
                  ? 'text-[#FFD700] fill-[#FFD700]'
                  : 'text-gray-300'
              }`}
            />
          </motion.button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-center text-sm text-[#0077A8] mt-1">{value}/5</p>
      )}
    </div>
  );

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle className="w-12 h-12 text-[#0077A8]" />
          </div>
          <h2 className="font-handwritten text-3xl text-[#0077A8] mb-2">{t('merci_avis')}</h2>
          <p className="font-body text-gray-600 mb-6">{t('avis_enregistre')}</p>
          <p className="font-handwritten text-[#00AEEF] text-lg mb-6">Camping Paradis ! 🌴</p>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading">
              <Home className="w-4 h-4 mr-2" />
              {t('retour_accueil')}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

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

        {step === 'identity' && (
          <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
            <CardHeader className="bg-[#00AEEF] pb-4">
              <CardTitle className="text-xl font-heading text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                {isFrench ? 'Vos informations' : 'Your information'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-heading text-[#0077A8] mb-1 block">{t('nom')} *</label>
                  <Input
                    value={clientNom}
                    onChange={(e) => setClientNom(e.target.value)}
                    className="border-[#00AEEF]/30 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-heading text-[#0077A8] mb-1 block">{t('prenom')} *</label>
                  <Input
                    value={clientPrenom}
                    onChange={(e) => setClientPrenom(e.target.value)}
                    className="border-[#00AEEF]/30 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-heading text-[#0077A8] mb-1 block">{t('date_arrivee')} *</label>
                  <Input
                    type="date"
                    value={dateArrivee}
                    onChange={(e) => setDateArrivee(e.target.value)}
                    className="border-[#00AEEF]/30 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-heading text-[#0077A8] mb-1 block">{t('date_depart')} *</label>
                  <Input
                    type="date"
                    value={dateDepart}
                    onChange={(e) => setDateDepart(e.target.value)}
                    className="border-[#00AEEF]/30 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">{t('type_hebergement')} *</label>
                <Select value={hebergementType} onValueChange={(v) => { setHebergementType(v); setHebergementCategorie(''); setHebergementNumero(''); }}>
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
                  <label className="text-sm font-heading text-[#0077A8] mb-1 block">{t('categorie')} *</label>
                  <Select value={hebergementCategorie} onValueChange={(v) => { setHebergementCategorie(v); setHebergementNumero(''); }}>
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
                  <label className="text-sm font-heading text-[#0077A8] mb-1 block">{isFrench ? 'Numéro' : 'Number'} *</label>
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

              <Button
                onClick={handleSubmitIdentity}
                disabled={!isIdentityValid()}
                className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading mt-4 disabled:opacity-50"
              >
                {t('suivant')}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'rating' && (
          <Card className="shadow-lg border-2 border-[#FFD700] rounded-xl overflow-hidden">
            <CardHeader className="bg-[#FFD700] pb-4">
              <CardTitle className="text-xl font-heading text-[#0077A8] flex items-center gap-2">
                <Star className="w-5 h-5" />
                {t('noter_intervention')}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="bg-[#e6f7ff] rounded-xl p-3 mb-6 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#00AEEF]" />
                <div>
                  <p className="font-heading text-[#0077A8]">{hebergementNumero}</p>
                  <p className="text-xs font-body text-gray-600">{clientPrenom} {clientNom}</p>
                </div>
              </div>

              <StarRating
                value={noteReactivite}
                hoverValue={hoverReactivite}
                onChange={setNoteReactivite}
                onHover={setHoverReactivite}
                label={isFrench ? '⚡ Réactivité de l\'intervention' : '⚡ Response speed'}
              />

              <StarRating
                value={noteAmabilite}
                hoverValue={hoverAmabilite}
                onChange={setNoteAmabilite}
                onHover={setHoverAmabilite}
                label={isFrench ? '😊 Amabilité du collaborateur' : '😊 Staff friendliness'}
              />

              <StarRating
                value={noteIntervention}
                hoverValue={hoverIntervention}
                onChange={setNoteIntervention}
                onHover={setHoverIntervention}
                label={isFrench ? '✨ Qualité globale de l\'intervention' : '✨ Overall intervention quality'}
              />

              {(noteReactivite > 0 && noteAmabilite > 0 && noteIntervention > 0) && (
                <div className="bg-[#FFD700]/20 rounded-xl p-3 mb-4 text-center">
                  <p className="font-heading text-[#0077A8]">
                    {isFrench ? 'Note globale' : 'Overall rating'}: {((noteReactivite + noteAmabilite + noteIntervention) / 3).toFixed(1)}/5 ⭐
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {t('votre_avis')}
                </label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder={t('votre_avis_placeholder')}
                  className="min-h-24 border-[#00AEEF]/30 rounded-xl font-body"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep('identity')}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-heading"
                >
                  {t('retour')}
                </Button>
                <Button
                  onClick={handleSubmitRating}
                  disabled={!isRatingValid() || createAvisMutation.isPending}
                  className="flex-1 h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading disabled:opacity-50"
                >
                  {createAvisMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t('envoyer_avis')
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}