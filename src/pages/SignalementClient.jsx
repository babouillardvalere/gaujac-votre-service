import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import { problemTypes } from '../components/mobilhomeData';
import Logo from '../components/Logo';
import OfflineBanner from '../components/OfflineBanner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, Camera, CheckCircle, Loader2, AlertTriangle,
  Zap, Flame, Thermometer, Droplets, Wind, Tv, Wrench, TreePine,
  UtensilsCrossed, Bed, Sparkles, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const iconMap = {
  Zap, Flame, Thermometer, Droplets, Wind, Tv, Wrench, TreePine,
  UtensilsCrossed, Bed, Sparkles, AlertTriangle, Trees: TreePine, Home
};

export default function SignalementClient() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(window.location.search);
  const mobilhomeId = urlParams.get('id');

  // Couleurs par catégorie
  const categoryColors = {
    technique: 'bg-[#00AEEF]',
    menage: 'bg-[#FFD700]',
    nuisible: 'bg-[#FFA500]'
  };

  const [step, setStep] = useState(1);
  const [clientInfo, setClientInfo] = useState({
    nom: '',
    prenom: '',
    dateArrivee: '',
    dateDepart: ''
  });
  const [selectedType, setSelectedType] = useState(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: mobilhome } = useQuery({
    queryKey: ['mobilhome', mobilhomeId],
    queryFn: async () => {
      if (!mobilhomeId) return null;
      const results = await base44.entities.Mobilhome.filter({ numero: mobilhomeId });
      return results[0] || null;
    },
    enabled: !!mobilhomeId
  });

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
    }
  }, [navigate]);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setIsUrgent(type.urgentDefault);
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Veuillez décrire le problème');
      return;
    }

    setIsSubmitting(true);

    let photoUrl = null;
    if (photo) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
      photoUrl = file_url;
    }

    const incidentData = {
      mobilhome_id: mobilhomeId || 'INCONNU',
      client_nom: clientInfo.nom,
      client_prenom: clientInfo.prenom,
      date_arrivee: clientInfo.dateArrivee,
      date_depart: clientInfo.dateDepart,
      type_probleme: selectedType.id,
      categorie_intervention: selectedType.categorie,
      description: description,
      photo_client_url: photoUrl,
      urgence: isUrgent,
      statut: 'nouveau',
      date_signalement: new Date().toISOString()
    };

    await base44.entities.Incident.create(incidentData);

    setIsSubmitting(false);
    setIsSuccess(true);
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
              setStep(1);
              setSelectedType(null);
              setDescription('');
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

  return (
    <div className="min-h-screen px-4 py-6">
      <OfflineBanner />
      
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo className="h-16" />
        </motion.div>

        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="pb-4 bg-[#00AEEF] text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-heading">Signaler un problème</CardTitle>
                <p className="text-sky-100 text-sm">
                  {mobilhomeId ? `Logement ${mobilhomeId}` : 'Sélectionnez votre logement'}
                  {mobilhome && ` - ${mobilhome.categorie}`}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Client Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="font-medium text-slate-700 mb-4">Vos informations</h3>
                  
                  {!mobilhomeId && (
                    <div className="space-y-2">
                      <Label>N° Logement / Emplacement</Label>
                      <Input
                        placeholder="Ex: C1, H05, 123..."
                        onChange={(e) => {
                          const url = new URL(window.location);
                          url.searchParams.set('id', e.target.value);
                          window.history.replaceState({}, '', url);
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <Input
                        value={clientInfo.prenom}
                        onChange={(e) => setClientInfo({ ...clientInfo, prenom: e.target.value })}
                        placeholder="Jean"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input
                        value={clientInfo.nom}
                        onChange={(e) => setClientInfo({ ...clientInfo, nom: e.target.value })}
                        placeholder="Dupont"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date d'arrivée</Label>
                      <Input
                        type="date"
                        value={clientInfo.dateArrivee}
                        onChange={(e) => setClientInfo({ ...clientInfo, dateArrivee: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de départ</Label>
                      <Input
                        type="date"
                        value={clientInfo.dateDepart}
                        onChange={(e) => setClientInfo({ ...clientInfo, dateDepart: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    disabled={!clientInfo.prenom || !clientInfo.nom}
                    className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading mt-4"
                  >
                    Continuer
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Problem Type */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center text-[#0077A8] hover:text-[#00AEEF] text-sm mb-2 font-body"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Retour
                  </button>
                  
                  <h3 className="font-heading text-[#0077A8]">Type de problème</h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {problemTypes.map((type) => {
                      const IconComponent = iconMap[type.icon] || AlertTriangle;
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleTypeSelect(type)}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            selectedType?.id === type.id
                              ? 'border-[#00AEEF] bg-[#e6f7ff]'
                              : 'border-[#00AEEF]/30 hover:border-[#00AEEF] bg-white'
                          }`}
                        >
                          <span className="text-3xl">{type.emoji}</span>
                          <span className="text-xs font-heading text-[#0077A8] text-center">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedType && (
                    <Button
                      onClick={() => setStep(3)}
                      className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading mt-4"
                    >
                      Continuer
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Step 3: Details */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center text-[#0077A8] hover:text-[#00AEEF] text-sm mb-2 font-body"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Retour
                  </button>

                  <div className="flex items-center gap-3 p-3 bg-[#e6f7ff] rounded-xl border border-[#00AEEF]/30">
                    <span className="text-2xl">{selectedType.emoji}</span>
                    <span className="font-heading text-[#0077A8]">{selectedType.label}</span>
                  </div>

                  {/* Urgency */}
                  <div className={`p-4 rounded-xl ${isUrgent ? 'bg-[#FFA500]/20 border-2 border-[#FFA500]' : 'bg-[#FFF4B2] border-2 border-[#FFD700]'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-5 h-5 ${isUrgent ? 'text-[#FFA500]' : 'text-[#FFD700]'}`} />
                        <span className="font-heading text-[#0077A8]">Problème urgent ?</span>
                      </div>
                      <Checkbox
                        checked={isUrgent}
                        onCheckedChange={setIsUrgent}
                        className="data-[state=checked]:bg-[#FFA500]"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description du problème *</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez votre problème en détail..."
                      className="min-h-28"
                    />
                  </div>

                  {/* Photo */}
                  <div className="space-y-2">
                    <Label className="font-heading text-[#0077A8]">Photo (facultatif)</Label>
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
                      <span className="text-[#0077A8] font-body">Ajouter une photo</span>
                    </label>
                    {photoPreview && (
                      <div className="relative mt-2">
                        <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
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
                    disabled={!description.trim() || isSubmitting}
                    className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading mt-4"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      'Envoyer le signalement'
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}