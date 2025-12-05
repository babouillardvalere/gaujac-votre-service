import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

const categoriesTechnique = [
  { id: 'gaz', icon: '🔥', label_fr: 'Gaz', label_en: 'Gas' },
  { id: 'eau', icon: '💧', label_fr: 'Eau / Fuite', label_en: 'Water / Leak' },
  { id: 'electricite', icon: '⚡', label_fr: 'Électricité', label_en: 'Electricity' },
  { id: 'plomberie', icon: '🔧', label_fr: 'Plomberie', label_en: 'Plumbing' },
  { id: 'climatiseur', icon: '❄️', label_fr: 'Climatisation', label_en: 'Air conditioning' },
  { id: 'mobilier', icon: '🪑', label_fr: 'Mobilier cassé', label_en: 'Broken furniture' }
];

const categoriesMenage = [
  { id: 'literie', icon: '🛏️', label_fr: 'Literie', label_en: 'Bedding' },
  { id: 'vaisselle', icon: '🍽️', label_fr: 'Vaisselle', label_en: 'Dishes' },
  { id: 'nettoyage', icon: '🧹', label_fr: 'Nettoyage', label_en: 'Cleaning' },
  { id: 'poubelle', icon: '🗑️', label_fr: 'Poubelles', label_en: 'Trash' }
];

export default function ReceptionAideSejour() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    client_nom: '',
    client_prenom: '',
    date_arrivee: '',
    date_depart: '',
    logement: '',
    type: '',
    categorie: '',
    description: '',
    urgent: false,
    photo_url: '',
    autorisation_acces: 'oui',
    remarques_internes: ''
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectCategorie = (type, categorieId) => {
    setFormData(prev => ({
      ...prev,
      type,
      categorie: categorieId
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.client_nom || !formData.client_prenom || !formData.logement || 
        !formData.type || !formData.categorie || !formData.description) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    setSubmitting(true);

    try {
      await base44.entities.Incident.create({
        type: formData.type,
        categorie: formData.categorie,
        description: formData.description,
        urgent: formData.urgent,
        client_nom: formData.client_nom,
        client_prenom: formData.client_prenom,
        date_arrivee: formData.date_arrivee,
        date_depart: formData.date_depart,
        logement: formData.logement,
        photo_url: formData.photo_url,
        autorisation_acces: formData.autorisation_acces,
        commentaire_interne: `[RÉCEPTION] ${formData.remarques_internes}`,
        statut: 'en_attente',
        date_saisie: new Date().toISOString(),
        pris_par: 'Créé par Réception'
      });

      toast.success(lang === 'fr' ? '✅ Intervention créée !' : '✅ Intervention created!');
      
      setTimeout(() => {
        navigate(createPageUrl('Reception'));
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur' : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ReceptionAssistance'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-6">
            🛠 {lang === 'fr' ? 'Aide Intervention Client' : 'Guest Intervention Assistance'}
          </h1>

          <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
            <CardContent className="p-6 space-y-6">
              {/* Identité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('nom')} *</Label>
                  <Input
                    value={formData.client_nom}
                    onChange={(e) => handleChange('client_nom', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <Label>{t('prenom')} *</Label>
                  <Input
                    value={formData.client_prenom}
                    onChange={(e) => handleChange('client_prenom', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <Label>{t('date_arrivee')}</Label>
                  <Input
                    type="date"
                    value={formData.date_arrivee}
                    onChange={(e) => handleChange('date_arrivee', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <Label>{t('date_depart')}</Label>
                  <Input
                    type="date"
                    value={formData.date_depart}
                    onChange={(e) => handleChange('date_depart', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <Label>{lang === 'fr' ? 'Numéro de locatif' : 'Accommodation number'} *</Label>
                  <Input
                    value={formData.logement}
                    onChange={(e) => handleChange('logement', e.target.value.toUpperCase())}
                    placeholder="Ex: R01, D14, E23"
                    className="border-2 border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Catégories Technique */}
              <div>
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  🔧 {lang === 'fr' ? 'Problèmes techniques' : 'Technical issues'}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {categoriesTechnique.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => selectCategorie('technique', cat.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        formData.type === 'technique' && formData.categorie === cat.id
                          ? 'bg-blue-100 border-blue-400 scale-105'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-3xl mb-1">{cat.icon}</div>
                      <p className="text-xs font-heading">{lang === 'fr' ? cat.label_fr : cat.label_en}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Catégories Ménage */}
              <div>
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  🧹 {lang === 'fr' ? 'Ménage' : 'Housekeeping'}
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {categoriesMenage.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => selectCategorie('menage', cat.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        formData.type === 'menage' && formData.categorie === cat.id
                          ? 'bg-yellow-100 border-yellow-400 scale-105'
                          : 'border-gray-300 hover:border-yellow-300'
                      }`}
                    >
                      <div className="text-3xl mb-1">{cat.icon}</div>
                      <p className="text-xs font-heading">{lang === 'fr' ? cat.label_fr : cat.label_en}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgent */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={formData.urgent}
                  onChange={(e) => handleChange('urgent', e.target.checked)}
                  className="w-5 h-5"
                />
                <Label htmlFor="urgent" className="text-red-600 font-heading">
                  🚨 {lang === 'fr' ? 'URGENT' : 'URGENT'}
                </Label>
              </div>

              {/* Description */}
              <div>
                <Label>{t('description')} *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="border-2 border-gray-200 rounded-xl"
                  rows={3}
                  placeholder={lang === 'fr' ? 'Décrivez le problème...' : 'Describe the problem...'}
                />
              </div>

              {/* Photo */}
              <div>
                <Label>{lang === 'fr' ? 'Photo (optionnel)' : 'Photo (optional)'}</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-intervention"
                />
                <label htmlFor="photo-intervention">
                  <Button type="button" variant="outline" className="w-full" disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? (lang === 'fr' ? 'Upload...' : 'Uploading...') :
                               formData.photo_url ? '✅ Photo ajoutée' : 'Ajouter photo'}
                  </Button>
                </label>
              </div>

              {/* Remarques internes */}
              <div>
                <Label>{lang === 'fr' ? 'Remarques internes' : 'Internal notes'}</Label>
                <Textarea
                  value={formData.remarques_internes}
                  onChange={(e) => handleChange('remarques_internes', e.target.value)}
                  className="border-2 border-gray-200 rounded-xl"
                  rows={2}
                  placeholder={lang === 'fr' ? 'Notes pour les techniciens...' : 'Notes for technicians...'}
                />
              </div>

              {/* Validation */}
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {lang === 'fr' ? 'Création...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {lang === 'fr' ? 'Créer l\'intervention' : 'Create intervention'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}