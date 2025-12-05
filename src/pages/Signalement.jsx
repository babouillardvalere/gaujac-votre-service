import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getLanguage, useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import OfflineBanner from '../components/OfflineBanner';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Send, AlertTriangle, CheckCircle, Loader2, Camera, Home, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

// Catégories qui déclenchent l'urgence automatique (mais peuvent être décochées manuellement)
const URGENT_CATEGORIES = ['gaz', 'eau', 'electricite', 'guepes', 'frelons'];

export default function Signalement() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [description, setDescription] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastIncidentId, setLastIncidentId] = useState(null);

  const [userData, setUserData] = useState({});

  const problemesTechniques = [
    { id: 'gaz', emoji: '🔥', label: t('gaz') },
    { id: 'eau', emoji: '💧', label: t('eau_plomberie') },
    { id: 'electricite', emoji: '⚡', label: t('electricite') },
    { id: 'divers_technique', emoji: '🛠', label: t('probleme_technique_divers') },
    { id: 'espace_vert', emoji: '🌿', label: t('espace_vert') },
    { id: 'mobilier', emoji: '🧰', label: t('mobilier_casse') },
    { id: 'structurel', emoji: '🏚', label: t('probleme_structurel') }
  ];

  const problemesMenage = [
    { id: 'literie', emoji: '🛏', label: t('literie') },
    { id: 'nettoyage', emoji: '🧽', label: t('nettoyage') },
    { id: 'vaisselle', emoji: '🍽', label: t('vaisselle') },
    { id: 'poubelle', emoji: '🗑', label: t('poubelle') },
    { id: 'produit_manquant', emoji: '🧴', label: t('produit_manquant') }
  ];

  const nuisances = [
    { id: 'souris', emoji: '🐭', label: t('souris') },
    { id: 'guepes', emoji: '🐝', label: t('guepes') },
    { id: 'frelons', emoji: '🐝', label: t('frelons') },
    { id: 'fourmis', emoji: '🐜', label: t('fourmis') },
    { id: 'moustiques', emoji: '🦟', label: t('moustiques') }
  ];

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
      return;
    }
    
    const nom = sessionStorage.getItem('user_nom');
    const hebergement = sessionStorage.getItem('hebergement_numero');
    
    if (!nom || !hebergement) {
      navigate(createPageUrl('IdentiteClient'));
      return;
    }

    setUserData({
      nom: sessionStorage.getItem('user_nom'),
      prenom: sessionStorage.getItem('user_prenom'),
      dateArrivee: sessionStorage.getItem('user_date_arrivee'),
      dateDepart: sessionStorage.getItem('user_date_depart'),
      hebergementType: sessionStorage.getItem('hebergement_type'),
      hebergementCategorie: sessionStorage.getItem('hebergement_categorie'),
      hebergementNumero: sessionStorage.getItem('hebergement_numero')
    });
  }, [navigate]);

  const toggleProblem = (problemId) => {
    setSelectedProblems(prev => {
      const newSelection = prev.includes(problemId)
        ? prev.filter(p => p !== problemId)
        : [...prev, problemId];
      
      // Si on ajoute une catégorie urgente et que l'utilisateur n'a pas encore coché urgent manuellement
      const isAddingUrgentCategory = !prev.includes(problemId) && URGENT_CATEGORIES.includes(problemId);
      if (isAddingUrgentCategory && !urgent) {
        setUrgent(true);
      }
      // Note: on ne décoche PAS automatiquement si on retire une catégorie urgente
      // L'utilisateur garde le contrôle total
      
      return newSelection;
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error(t('description_obligatoire'));
      return;
    }
    if (selectedProblems.length === 0) {
      toast.error(t('selectionner_probleme'));
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl = null;
      if (photo) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
        photoUrl = file_url;
      }

      const isTechnique = selectedProblems.some(p => 
        problemesTechniques.some(pt => pt.id === p) || nuisances.some(n => n.id === p)
      );

      const newIncident = await base44.entities.Incident.create({
        type: isTechnique ? 'technique' : 'menage',
        categorie: selectedProblems[0],
        sous_categorie: selectedProblems.join(', '),
        description: description,
        urgent: urgent,
        client_nom: userData.nom,
        client_prenom: userData.prenom,
        date_arrivee: userData.dateArrivee,
        date_depart: userData.dateDepart,
        logement: userData.hebergementType === 'Mobil-home' ? userData.hebergementNumero : null,
        emplacement: userData.hebergementType === 'Emplacement' ? userData.hebergementNumero : null,
        photo_url: photoUrl,
        date_saisie: new Date().toISOString(),
        statut: 'en_attente'
      });

      sessionStorage.setItem('last_incident_id', newIncident.id);
      setLastIncidentId(newIncident.id);
      setIsSuccess(true);
    } catch (error) {
      toast.error(t('erreur_envoi'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-[#00AEEF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="font-handwritten text-3xl text-[#0077A8] mb-4">🎉 {t('signalement_envoye')}</h2>
          <p className="font-body text-gray-600 mb-8 leading-relaxed">
            {t('signalement_message')}
          </p>
          
          <div className="space-y-3">
            <Link to={createPageUrl('SuiviIntervention')} className="block">
              <Button className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading">
                <Search className="w-5 h-5 mr-2" />
                {t('suivre_intervention')}
              </Button>
            </Link>
            
            <Link to={createPageUrl('Home')} className="block">
              <Button variant="outline" className="w-full h-12 border-2 border-[#00AEEF] text-[#0077A8] hover:bg-[#e6f7ff] rounded-xl font-heading">
                <Home className="w-5 h-5 mr-2" />
                {t('retour_accueil')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const ProblemButton = ({ problem, selected }) => (
    <button
      onClick={() => toggleProblem(problem.id)}
      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 min-h-[80px] focus:ring-4 focus:ring-[#FFD700] ${
        selected
          ? 'border-[#00AEEF] bg-[#e6f7ff]'
          : 'border-gray-200 hover:border-[#00AEEF]/50 bg-white'
      }`}
      aria-label={`${problem.label} - ${selected ? 'Sélectionné' : 'Non sélectionné'}`}
      aria-pressed={selected}
      role="button"
      tabIndex={0}
    >
      <span className="text-2xl" aria-hidden="true">{problem.emoji}</span>
      <span className="text-xs font-body text-center text-[#0077A8]">{problem.label}</span>
      {selected && <CheckCircle className="w-4 h-4 text-[#00AEEF]" aria-hidden="true" />}
    </button>
  );

  return (
    <div className="min-h-screen px-4 py-6 pb-20" role="main" aria-label="Page de signalement d'un problème">
      <h1 className="sr-only">Signaler un problème - Formulaire de déclaration</h1>
      <OfflineBanner />
      
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Logo className="h-14" />
        </motion.div>

        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="bg-[#00AEEF] pb-4">
            <button
              onClick={() => navigate(createPageUrl('ChoixHebergement'))}
              className="flex items-center text-white/80 hover:text-white text-sm mb-2 font-body"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('retour')}
            </button>
            <CardTitle className="text-xl font-heading text-white flex items-center gap-2">
              <Home className="w-5 h-5" />
              {t('signalement_title')}
            </CardTitle>
            <p className="text-white/80 text-sm font-body">
              {userData.hebergementType} {userData.hebergementNumero} • {userData.prenom} {userData.nom}
            </p>
          </CardHeader>
          
          <CardContent className="pt-4 space-y-6">
            <div>
              <h3 className="font-heading text-[#0077A8] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#00AEEF] rounded text-white text-xs flex items-center justify-center">1</span>
                {t('problemes_techniques')}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {problemesTechniques.map(p => (
                  <ProblemButton key={p.id} problem={p} selected={selectedProblems.includes(p.id)} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-heading text-[#0077A8] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#FFD700] rounded text-[#0077A8] text-xs flex items-center justify-center">2</span>
                {t('menage_section')}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {problemesMenage.map(p => (
                  <ProblemButton key={p.id} problem={p} selected={selectedProblems.includes(p.id)} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-heading text-[#0077A8] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#FFA500] rounded text-white text-xs flex items-center justify-center">3</span>
                {t('nuisances_section')}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {nuisances.map(p => (
                  <ProblemButton key={p.id} problem={p} selected={selectedProblems.includes(p.id)} />
                ))}
              </div>
            </div>

            <div className={`p-4 rounded-xl ${urgent ? 'bg-[#FFA500]/20 border-2 border-[#FFA500]' : 'bg-gray-50 border-2 border-gray-200'}`}>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${urgent ? 'text-[#FFA500]' : 'text-gray-400'}`} />
                  <span className="font-heading text-[#0077A8]">{t('probleme_urgent')}</span>
                </div>
                <Checkbox
                  checked={urgent}
                  onCheckedChange={setUrgent}
                  className="data-[state=checked]:bg-[#FFA500] data-[state=checked]:border-[#FFA500]"
                />
              </label>
              {urgent && (
                <p className="text-xs font-body text-[#FFA500] mt-2">
                  {t('intervention_prioritaire')}
                </p>
              )}
            </div>

            <div>
              <label className="font-heading text-[#0077A8] mb-2 block">
                {t('description')} *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('description_placeholder')}
                className="min-h-28 border-[#00AEEF]/30 rounded-xl font-body"
              />
            </div>

            <div>
              <label className="font-heading text-[#0077A8] mb-2 block">
                {t('photo')}
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-[#00AEEF]/50 rounded-xl cursor-pointer hover:border-[#00AEEF] hover:bg-[#e6f7ff] transition-all"
              >
                <Camera className="w-6 h-6 text-[#00AEEF]" />
                <span className="font-body text-[#0077A8]">{t('ajouter_photo')}</span>
              </label>
              {photoPreview && (
                <div className="relative mt-2">
                  <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                  <button
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!description.trim() || selectedProblems.length === 0 || isSubmitting}
              className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading disabled:opacity-50 text-lg focus:ring-4 focus:ring-[#FFD700]"
              aria-label={isSubmitting ? "Envoi en cours, veuillez patienter" : "Envoyer le signalement"}
              aria-busy={isSubmitting}
              role="button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                  <span aria-live="polite">{t('envoi_en_cours')}</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" aria-hidden="true" />
                  {t('envoyer_signalement')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}