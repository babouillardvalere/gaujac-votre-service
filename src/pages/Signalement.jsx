import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import OfflineBanner from '../components/OfflineBanner';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Send, AlertTriangle, CheckCircle, Loader2, Camera, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

// Catégories avec urgence automatique
const URGENT_CATEGORIES = ['gaz', 'eau', 'electricite'];

// Problèmes techniques
const problemesTechniques = [
  { id: 'gaz', emoji: '🔥', label: 'Gaz' },
  { id: 'eau', emoji: '💧', label: 'Eau / Fuite / Plomberie' },
  { id: 'electricite', emoji: '⚡', label: 'Électricité' },
  { id: 'divers_technique', emoji: '🛠', label: 'Problème technique divers' },
  { id: 'espace_vert', emoji: '🌿', label: 'Espace vert' },
  { id: 'mobilier', emoji: '🧰', label: 'Mobilier cassé / matériel' },
  { id: 'structurel', emoji: '🏚', label: 'Problème structurel' }
];

// Problèmes ménage
const problemesMenage = [
  { id: 'literie', emoji: '🛏', label: 'Changer la literie' },
  { id: 'nettoyage', emoji: '🧽', label: 'Ménage / nettoyage' },
  { id: 'vaisselle', emoji: '🍽', label: 'Vaisselle / matériel cuisine' },
  { id: 'poubelle', emoji: '🗑', label: 'Poubelle / odeur' },
  { id: 'produit_manquant', emoji: '🧴', label: 'Produit manquant' }
];

// Nuisances
const nuisances = [
  { id: 'souris', emoji: '🐭', label: 'Souris' },
  { id: 'guepes', emoji: '🐝', label: 'Guêpes' },
  { id: 'frelons', emoji: '🐝', label: 'Frelons' },
  { id: 'fourmis', emoji: '🐜', label: 'Fourmis' },
  { id: 'moustiques', emoji: '🦟', label: 'Moustiques en intérieur' }
];

export default function Signalement() {
  const navigate = useNavigate();
  
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [description, setDescription] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Données de session
  const [userData, setUserData] = useState({});

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
      return;
    }
    
    // Vérifier les données de session
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

  // Gérer la sélection de problèmes
  const toggleProblem = (problemId) => {
    setSelectedProblems(prev => {
      const newSelection = prev.includes(problemId)
        ? prev.filter(p => p !== problemId)
        : [...prev, problemId];
      
      // Vérifier si une catégorie urgente est sélectionnée
      const hasUrgent = newSelection.some(p => URGENT_CATEGORIES.includes(p));
      if (hasUrgent && !urgent) {
        setUrgent(true);
      }
      
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
      toast.error('La description est obligatoire');
      return;
    }
    if (selectedProblems.length === 0) {
      toast.error('Veuillez sélectionner au moins un type de problème');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl = null;
      if (photo) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
        photoUrl = file_url;
      }

      // Déterminer le type (technique ou menage)
      const isTechnique = selectedProblems.some(p => 
        problemesTechniques.some(pt => pt.id === p) || nuisances.some(n => n.id === p)
      );

      await base44.entities.Incident.create({
        type: isTechnique ? 'technique' : 'menage',
        categorie: selectedProblems[0], // Catégorie principale
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

      setIsSuccess(true);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
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
          className="text-center"
        >
          <div className="w-24 h-24 bg-[#00AEEF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="font-handwritten text-3xl text-[#0077A8] mb-2">Signalement envoyé !</h2>
          <p className="font-body text-gray-600 mb-6">Notre équipe va intervenir rapidement.</p>
          <Button
            onClick={() => {
              setIsSuccess(false);
              setSelectedProblems([]);
              setDescription('');
              setUrgent(false);
              setPhoto(null);
              setPhotoPreview(null);
            }}
            className="bg-[#FFD700] text-[#0077A8] hover:bg-[#FFA500] rounded-xl font-heading"
          >
            Nouveau signalement
          </Button>
        </motion.div>
      </div>
    );
  }

  const ProblemButton = ({ problem, selected }) => (
    <button
      onClick={() => toggleProblem(problem.id)}
      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
        selected
          ? 'border-[#00AEEF] bg-[#e6f7ff]'
          : 'border-gray-200 hover:border-[#00AEEF]/50 bg-white'
      }`}
    >
      <span className="text-2xl">{problem.emoji}</span>
      <span className="text-xs font-body text-center text-[#0077A8]">{problem.label}</span>
      {selected && <CheckCircle className="w-4 h-4 text-[#00AEEF]" />}
    </button>
  );

  return (
    <div className="min-h-screen px-4 py-6 pb-20">
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
              Retour
            </button>
            <CardTitle className="text-xl font-heading text-white flex items-center gap-2">
              <Home className="w-5 h-5" />
              Signaler un problème
            </CardTitle>
            <p className="text-white/80 text-sm font-body">
              {userData.hebergementType} {userData.hebergementNumero} • {userData.prenom} {userData.nom}
            </p>
          </CardHeader>
          
          <CardContent className="pt-4 space-y-6">
            {/* Section Technique */}
            <div>
              <h3 className="font-heading text-[#0077A8] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#00AEEF] rounded text-white text-xs flex items-center justify-center">1</span>
                Problèmes techniques
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {problemesTechniques.map(p => (
                  <ProblemButton key={p.id} problem={p} selected={selectedProblems.includes(p.id)} />
                ))}
              </div>
            </div>

            {/* Section Ménage */}
            <div>
              <h3 className="font-heading text-[#0077A8] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#FFD700] rounded text-[#0077A8] text-xs flex items-center justify-center">2</span>
                Ménage
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {problemesMenage.map(p => (
                  <ProblemButton key={p.id} problem={p} selected={selectedProblems.includes(p.id)} />
                ))}
              </div>
            </div>

            {/* Section Nuisances */}
            <div>
              <h3 className="font-heading text-[#0077A8] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#FFA500] rounded text-white text-xs flex items-center justify-center">3</span>
                Nuisances & Animaux
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {nuisances.map(p => (
                  <ProblemButton key={p.id} problem={p} selected={selectedProblems.includes(p.id)} />
                ))}
              </div>
            </div>

            {/* Urgence */}
            <div className={`p-4 rounded-xl ${urgent ? 'bg-[#FFA500]/20 border-2 border-[#FFA500]' : 'bg-gray-50 border-2 border-gray-200'}`}>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${urgent ? 'text-[#FFA500]' : 'text-gray-400'}`} />
                  <span className="font-heading text-[#0077A8]">Problème urgent ?</span>
                </div>
                <Checkbox
                  checked={urgent}
                  onCheckedChange={setUrgent}
                  className="data-[state=checked]:bg-[#FFA500] data-[state=checked]:border-[#FFA500]"
                />
              </label>
              {urgent && (
                <p className="text-xs font-body text-[#FFA500] mt-2">
                  Une intervention prioritaire sera déclenchée.
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="font-heading text-[#0077A8] mb-2 block">
                Description du problème *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre problème en détail..."
                className="min-h-28 border-[#00AEEF]/30 rounded-xl font-body"
              />
            </div>

            {/* Photo */}
            <div>
              <label className="font-heading text-[#0077A8] mb-2 block">
                Photo (facultatif)
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
                <span className="font-body text-[#0077A8]">Ajouter une photo</span>
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

            {/* Bouton envoi */}
            <Button
              onClick={handleSubmit}
              disabled={!description.trim() || selectedProblems.length === 0 || isSubmitting}
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer le signalement
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}