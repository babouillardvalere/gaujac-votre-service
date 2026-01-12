import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import ArriveeProgressBar from '../components/ArriveeProgressBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Users, Dog, Cat, Plus, Minus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientArriveeIdentite() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    date_arrivee: '',
    date_depart: '',
    nb_adultes: 2,
    nb_adolescents: 0,
    nb_enfants: 0,
    nb_bebes: 0,
    nombre_chiens: 0,
    nombre_chats: 0
  });

  const [dossierId, setDossierId] = useState(sessionStorage.getItem('arrivee_dossier_id'));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const existingDossierId = sessionStorage.getItem('arrivee_dossier_id');
    if (existingDossierId) setDossierId(existingDossierId);

    const savedNom = sessionStorage.getItem('arrivee_nom');
    const savedPrenom = sessionStorage.getItem('arrivee_prenom');
    const savedDateArrivee = sessionStorage.getItem('arrivee_date_arrivee');
    const savedDateDepart = sessionStorage.getItem('arrivee_date_depart');
    
    if (savedNom) setFormData(prev => ({ ...prev, nom: savedNom }));
    if (savedPrenom) setFormData(prev => ({ ...prev, prenom: savedPrenom }));
    if (savedDateArrivee) setFormData(prev => ({ ...prev, date_arrivee: savedDateArrivee }));
    if (savedDateDepart) setFormData(prev => ({ ...prev, date_depart: savedDateDepart }));
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIncrement = (field) => {
    setFormData(prev => ({ ...prev, [field]: Math.min(prev[field] + 1, 20) }));
  };

  const handleDecrement = (field) => {
    setFormData(prev => ({ ...prev, [field]: Math.max(prev[field] - 1, 0) }));
  };

  const validateForm = () => {
    if (!formData.nom.trim()) {
      toast.error(lang === 'fr' ? 'Le nom est obligatoire' : 'Last name is required');
      return false;
    }

    if (!formData.prenom.trim()) {
      toast.error(lang === 'fr' ? 'Le prénom est obligatoire' : 'First name is required');
      return false;
    }

    if (!formData.date_arrivee) {
      toast.error(lang === 'fr' ? 'La date d\'arrivée est obligatoire' : 'Arrival date is required');
      return false;
    }

    if (!formData.date_depart) {
      toast.error(lang === 'fr' ? 'La date de départ est obligatoire' : 'Departure date is required');
      return false;
    }

    // RÈGLE ANTIFRAUDE : Un client ne peut pas s'enregistrer le jour même ou dans le passé
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    const arrivee = new Date(formData.date_arrivee);
    arrivee.setHours(0, 0, 0, 0);
    
    if (arrivee.getTime() <= aujourdhui.getTime()) {
      toast.error(
        lang === 'fr' 
          ? '⚠️ Les arrivées le jour même ou passées ne peuvent pas être enregistrées par le client. Veuillez contacter l\'accueil.'
          : '⚠️ Same-day or past arrivals cannot be registered by guests. Please contact reception.',
        { duration: 5000 }
      );
      return false;
    }

    const depart = new Date(formData.date_depart);
    depart.setHours(0, 0, 0, 0);

    if (depart <= arrivee) {
      toast.error(t('date_error_ordre'));
      return false;
    }

    if (formData.nb_adultes < 1) {
      toast.error(lang === 'fr' 
        ? 'Au moins 1 adulte est requis'
        : 'At least 1 adult is required');
      return false;
    }

    const totalPersonnes = formData.nb_adultes + formData.nb_adolescents + formData.nb_enfants + formData.nb_bebes;
    if (totalPersonnes < 1) {
      toast.error(lang === 'fr' 
        ? 'Au moins une personne est requise'
        : 'At least one person is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    
    try {
      // Persister en session
      sessionStorage.setItem('arrivee_nom', formData.nom);
      sessionStorage.setItem('arrivee_prenom', formData.prenom);
      sessionStorage.setItem('arrivee_date_arrivee', formData.date_arrivee);
      sessionStorage.setItem('arrivee_date_depart', formData.date_depart);
      sessionStorage.setItem('arrivee_nb_adultes', formData.nb_adultes);
      sessionStorage.setItem('arrivee_nb_adolescents', formData.nb_adolescents);
      sessionStorage.setItem('arrivee_nb_enfants', formData.nb_enfants);
      sessionStorage.setItem('arrivee_nb_bebes', formData.nb_bebes);
      sessionStorage.setItem('arrivee_nombre_chiens', formData.nombre_chiens);
      sessionStorage.setItem('arrivee_nombre_chats', formData.nombre_chats);

      const totalAnimaux = formData.nombre_chiens + formData.nombre_chats;

      if (!dossierId) {
        const dossier = await base44.entities.DossierArrivee.create({
          code_dossier: `ARR-${formData.nom.toUpperCase()}-${Date.now()}`,
          client_nom: formData.nom,
          client_prenom: formData.prenom,
          date_arrivee: formData.date_arrivee,
          date_depart: formData.date_depart,
          nombre_adultes: formData.nb_adultes,
          nombre_adolescents: formData.nb_adolescents,
          nombre_enfants: formData.nb_enfants,
          nombre_bebes: formData.nb_bebes,
          nombre_animaux: totalAnimaux,
          nombre_chiens: formData.nombre_chiens,
          nombre_chats: formData.nombre_chats,
          etape_1_terminee: true,
          etape_2_terminee: true,
          etape_actuelle: 3,
          statut: 'en_cours',
          horodatage_creation: new Date().toISOString()
        });
        sessionStorage.setItem('arrivee_dossier_id', dossier.id);
      } else {
        await base44.entities.DossierArrivee.update(dossierId, {
          client_nom: formData.nom,
          client_prenom: formData.prenom,
          date_arrivee: formData.date_arrivee,
          date_depart: formData.date_depart,
          nombre_adultes: formData.nb_adultes,
          nombre_adolescents: formData.nb_adolescents,
          nombre_enfants: formData.nb_enfants,
          nombre_bebes: formData.nb_bebes,
          nombre_animaux: totalAnimaux,
          nombre_chiens: formData.nombre_chiens,
          nombre_chats: formData.nombre_chats,
          etape_1_terminee: true,
          etape_2_terminee: true,
          etape_actuelle: 3
        });
      }

      toast.success(lang === 'fr' ? 'Informations enregistrées ✅' : 'Information saved ✅');
      navigate(createPageUrl('ClientArriveeHebergement'));
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de l\'enregistrement. Veuillez réessayer.' : 'Error saving data. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientMenu'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-2">
            🏡 {lang === 'fr' ? 'Arrivée' : 'Arrival'}
          </h1>

          {dossierId && (
            <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
              <CardContent className="p-4">
                <ArriveeProgressBar etapeActuelle={1} lang={lang} />
              </CardContent>
            </Card>
          )}

          {/* Identité */}
          <Card className="border-2 border-[#22c55e]/30 rounded-xl mb-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                {t('identite_title')}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom" className="font-heading text-[#0077A8]">
                    {t('nom')} *
                  </Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#22c55e] rounded-xl"
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
                    className="mt-1 border-2 border-gray-200 focus:border-[#22c55e] rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="date_arrivee" className="font-heading text-[#0077A8]">
                    {t('date_arrivee')} *
                  </Label>
                  <Input
                    id="date_arrivee"
                    type="date"
                    value={formData.date_arrivee}
                    onChange={(e) => handleChange('date_arrivee', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#22c55e] rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="date_depart" className="font-heading text-[#0077A8]">
                    {t('date_depart')} *
                  </Label>
                  <Input
                    id="date_depart"
                    type="date"
                    value={formData.date_depart}
                    onChange={(e) => handleChange('date_depart', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#22c55e] rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Occupants */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                {lang === 'fr' ? 'Nombre de personnes' : 'Number of people'} *
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="font-heading text-gray-700">
                    👨‍👩 {lang === 'fr' ? 'Adultes (18+)' : 'Adults (18+)'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDecrement('nb_adultes')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-blue-400"
                      type="button"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{formData.nb_adultes}</span>
                    <button
                      onClick={() => handleIncrement('nb_adultes')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-blue-400"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <span className="font-heading text-gray-700">
                    🧑‍🦱 {lang === 'fr' ? 'Ados (13-17 ans)' : 'Teens (13-17)'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDecrement('nb_adolescents')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-purple-400"
                      type="button"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{formData.nb_adolescents}</span>
                    <button
                      onClick={() => handleIncrement('nb_adolescents')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-purple-400"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <span className="font-heading text-gray-700">
                    👧 {lang === 'fr' ? 'Enfants (3-12 ans)' : 'Children (3-12)'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDecrement('nb_enfants')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-green-400"
                      type="button"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{formData.nb_enfants}</span>
                    <button
                      onClick={() => handleIncrement('nb_enfants')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-green-400"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                  <span className="font-heading text-gray-700">
                    👶 {lang === 'fr' ? 'Bébés (0-2 ans)' : 'Babies (0-2)'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDecrement('nb_bebes')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-yellow-400"
                      type="button"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{formData.nb_bebes}</span>
                    <button
                      onClick={() => handleIncrement('nb_bebes')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-yellow-400"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Animaux */}
          <Card className="border-2 border-[#FFA500]/30 rounded-xl mb-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                <Dog className="w-6 h-6" />
                {lang === 'fr' ? 'Animaux' : 'Pets'}
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                  <span className="font-heading text-gray-700 flex items-center gap-2">
                    <Dog className="w-5 h-5" />
                    {lang === 'fr' ? 'Chiens' : 'Dogs'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDecrement('nombre_chiens')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-orange-400"
                      type="button"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{formData.nombre_chiens}</span>
                    <button
                      onClick={() => handleIncrement('nombre_chiens')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-orange-400"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
                  <span className="font-heading text-gray-700 flex items-center gap-2">
                    <Cat className="w-5 h-5" />
                    {lang === 'fr' ? 'Chats' : 'Cats'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDecrement('nombre_chats')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-pink-400"
                      type="button"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{formData.nombre_chats}</span>
                    <button
                      onClick={() => handleIncrement('nombre_chats')}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:border-pink-400"
                      type="button"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !formData.nom || !formData.prenom || !formData.date_arrivee || !formData.date_depart || formData.nb_adultes < 1}
            className="w-full h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl font-heading disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {lang === 'fr' ? 'Enregistrement...' : 'Saving...'}
              </>
            ) : (
              <>
                {lang === 'fr' ? 'Continuer' : 'Continue'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}