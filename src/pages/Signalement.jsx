import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import { problemCategories } from '../components/accommodationData';
import Logo from '../components/Logo';
import OfflineBanner from '../components/OfflineBanner';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, AlertTriangle, Camera, CheckCircle, Loader2,
  Flame, Zap, Droplets, Home, Wind, Tv, Thermometer, Wrench,
  Bug, Bed, UtensilsCrossed, Sparkles, TreePine
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const iconMap = {
  Flame, Zap, Droplets, Home, Wind, Tv, Refrigerator: Thermometer, Wrench,
  Bug, Mouse: Bug, Bed, UtensilsCrossed, Sparkles, TreePine
};

export default function Signalement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(window.location.search);
  const hebergementId = urlParams.get('id');

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [canToggleUrgent, setCanToggleUrgent] = useState(true);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
      return;
    }
    
    if (!sessionStorage.getItem('user_name')) {
      navigate('/IdentiteClient');
    }
  }, [navigate]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubCategory(null);
    setIsUrgent(false);
    setCanToggleUrgent(true);
  };

  const handleSubCategorySelect = (subCat) => {
    setSelectedSubCategory(subCat);
    setIsUrgent(subCat.urgentDefault);
    setCanToggleUrgent(subCat.canUncheck);
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
      toast.error(t('description') + ' ' + t('champs_obligatoires'));
      return;
    }

    setIsSubmitting(true);

    let photoUrl = null;
    if (photo) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
      photoUrl = file_url;
    }

    const incidentData = {
      client_nom: sessionStorage.getItem('user_name'),
      client_prenom: sessionStorage.getItem('user_surname'),
      date_arrivee: sessionStorage.getItem('user_date_arrivee'),
      date_depart: sessionStorage.getItem('user_date_depart'),
      hebergement_type: sessionStorage.getItem('hebergement_type'),
      hebergement_categorie: sessionStorage.getItem('hebergement_categorie'),
      hebergement_numero: hebergementId,
      categorie_probleme: selectedCategory,
      sous_categorie: selectedSubCategory?.id,
      probleme_urgent: isUrgent,
      description_probleme: description,
      photo_client_url: photoUrl,
      statut: 'nouveau'
    };

    // Store locally for offline support
    const pendingIncidents = JSON.parse(localStorage.getItem('pendingIncidents') || '[]');
    
    if (navigator.onLine) {
      await base44.entities.Incident.create(incidentData);
    } else {
      pendingIncidents.push({ ...incidentData, pendingSync: true });
      localStorage.setItem('pendingIncidents', JSON.stringify(pendingIncidents));
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      navigate('/Home');
    }, 2000);
  };

  const mainCategories = [
    { id: 'technique', icon: Wrench, color: 'from-orange-500 to-red-500' },
    { id: 'nuisibles', icon: Bug, color: 'from-amber-500 to-yellow-600' },
    { id: 'menage', icon: Sparkles, color: 'from-sky-500 to-blue-500' }
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">{t('succes')}</h2>
          <p className="text-slate-600">{t('signalement_envoye')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-8">
      <OfflineBanner />
      
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Logo className="h-20" />
        </motion.div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <button 
              onClick={() => navigate('/ChoixHebergement')}
              className="flex items-center text-slate-500 hover:text-sky-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('retour')}
            </button>
            <CardTitle className="text-2xl font-light text-slate-800">
              {t('signalement_title')}
            </CardTitle>
            <p className="text-sm text-slate-500 mt-2">
              {t('logement')} #{hebergementId}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Category Selection */}
            <div>
              <Label className="text-sm text-slate-600 mb-3 block">Catégorie principale</Label>
              <div className="grid grid-cols-3 gap-3">
                {mainCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCategory === cat.id 
                        ? 'border-sky-500 bg-sky-50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-2`}>
                      <cat.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-slate-700">{t(cat.id)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sub Category Selection */}
            <AnimatePresence mode="wait">
              {selectedCategory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label className="text-sm text-slate-600 mb-3 block">Sous-catégorie</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {problemCategories[selectedCategory]?.map((subCat) => {
                      const IconComponent = iconMap[subCat.icon] || Wrench;
                      return (
                        <button
                          key={subCat.id}
                          onClick={() => handleSubCategorySelect(subCat)}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                            selectedSubCategory?.id === subCat.id 
                              ? 'border-sky-500 bg-sky-50' 
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          {subCat.emoji ? (
                            <span className="text-2xl">{subCat.emoji}</span>
                          ) : (
                            <IconComponent className="w-5 h-5 text-slate-600" />
                          )}
                          <span className="text-sm font-medium text-slate-700">{t(subCat.id)}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Urgency Toggle */}
            {selectedSubCategory && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-xl ${isUrgent ? 'bg-red-50 border-2 border-red-200' : 'bg-amber-50 border-2 border-amber-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
                    <span className="font-medium text-slate-700">{t('urgence')}</span>
                  </div>
                  <Checkbox
                    checked={isUrgent}
                    onCheckedChange={setIsUrgent}
                    disabled={!canToggleUrgent}
                    className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                </div>
                {!canToggleUrgent && (
                  <p className="text-xs text-red-600 mt-2">
                    Ce type de problème est toujours considéré comme urgent
                  </p>
                )}
              </motion.div>
            )}

            {/* Description */}
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">{t('description')} *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre problème en détail..."
                className="min-h-32 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">{t('photo')}</Label>
              <div className="relative">
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
                  className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-all"
                >
                  <Camera className="w-6 h-6 text-slate-400" />
                  <span className="text-slate-600">{t('ajouter_photo')}</span>
                </label>
              </div>
              {photoPreview && (
                <div className="mt-3 relative">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-40 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedSubCategory || !description.trim() || isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-medium rounded-xl shadow-lg shadow-sky-500/25 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('chargement')}
                </>
              ) : (
                t('envoyer')
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}