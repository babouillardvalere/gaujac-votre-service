import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { emplacements, logements } from '../components/accommodationData';
import { ArrowLeft, ArrowRight, Plus, Minus, Upload, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ReceptionAideArrivee() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    client_nom: '',
    client_prenom: '',
    date_arrivee: '',
    date_depart: '',
    nombre_adultes: 2,
    nombre_adolescents: 0,
    nombre_enfants: 0,
    nombre_bebes: 0,
    nombre_chiens: 0,
    nombre_chats: 0,
    type_logement: '',
    categorie_logement: '',
    numero_logement: '',
    proprete: 'correct',
    remarques_internes: '',
    photo_arrivee: ''
  });

  const [availableNumbers, setAvailableNumbers] = useState([]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'categorie_logement') {
      const numbers = formData.type_logement === 'emplacement' 
        ? emplacements[value] || []
        : logements[value] || [];
      setAvailableNumbers(numbers);
      setFormData(prev => ({ ...prev, numero_logement: '' }));
    }
  };

  const handleIncrement = (field) => {
    setFormData(prev => ({ ...prev, [field]: Math.min(prev[field] + 1, 20) }));
  };

  const handleDecrement = (field) => {
    setFormData(prev => ({ ...prev, [field]: Math.max(prev[field] - 1, 0) }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_arrivee: file_url }));
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.client_nom || !formData.client_prenom || 
        !formData.date_arrivee || !formData.date_depart ||
        !formData.type_logement || !formData.categorie_logement || !formData.numero_logement) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    setSubmitting(true);

    try {
      const codeDossier = `ARRIVEE-${formData.numero_logement}-${formData.date_arrivee}`;
      
      const dossier = await base44.entities.DossierArrivee.create({
        code_dossier: codeDossier,
        client_nom: formData.client_nom,
        client_prenom: formData.client_prenom,
        date_arrivee: formData.date_arrivee,
        date_depart: formData.date_depart,
        type_logement: formData.type_logement,
        categorie_logement: formData.categorie_logement,
        numero_logement: formData.numero_logement,
        nombre_adultes: formData.nombre_adultes,
        nombre_adolescents: formData.nombre_adolescents,
        nombre_enfants: formData.nombre_enfants,
        nombre_bebes: formData.nombre_bebes,
        nombre_animaux: formData.nombre_chiens + formData.nombre_chats,
        nombre_chiens: formData.nombre_chiens,
        nombre_chats: formData.nombre_chats,
        etape_actuelle: 4,
        etape_1_terminee: true,
        etape_2_terminee: true,
        etape_3_terminee: true,
        etape_4_terminee: true,
        statut: 'finalise',
        date_finalisation: new Date().toISOString(),
        remarques_client: formData.remarques_internes
      });

      // Créer intervention si propreté insatisfaisante
      if (formData.proprete === 'pas_satisfaisant') {
        await base44.entities.Incident.create({
          type: 'menage',
          categorie: 'nettoyage',
          description: `Propreté non satisfaisante à l'arrivée - ${formData.remarques_internes}`,
          urgent: true,
          client_nom: formData.client_nom,
          client_prenom: formData.client_prenom,
          date_arrivee: formData.date_arrivee,
          date_depart: formData.date_depart,
          logement: formData.numero_logement,
          photo_url: formData.photo_arrivee,
          statut: 'en_attente',
          autorisation_acces: 'oui',
          commentaire_interne: 'Créé par réception lors de l\'arrivée assistée'
        });
      }

      toast.success(lang === 'fr' ? '✅ Arrivée enregistrée !' : '✅ Arrival registered!');
      
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

  const emplacementCategories = [
    { value: 'Emplacement 6A', label: lang === 'fr' ? 'Électricité 6A' : 'Electricity 6A' },
    { value: 'Emplacement 10A', label: lang === 'fr' ? 'Électricité 10A' : 'Electricity 10A' },
    { value: 'Emplacement Eau+10A', label: lang === 'fr' ? 'Eau + 10A' : 'Water + 10A' }
  ];

  const mobilhomeCategories = [
    { value: 'Chalet Eco', label: lang === 'fr' ? 'Chalet Éco 1 ch' : 'Eco Chalet 1BR' },
    { value: 'Chalet Classique', label: lang === 'fr' ? 'Chalet Classique 1 ch' : 'Classic Chalet 1BR' },
    { value: 'Mobil-home Eco', label: lang === 'fr' ? 'MH Éco 2 ch' : 'Eco MH 2BR' },
    { value: 'Mobil-home Eco Clim', label: 'MH Éco Clim' },
    { value: 'Mobil-home Classique', label: lang === 'fr' ? 'MH Classique' : 'Classic MH' },
    { value: 'Mobil-home Classique Clim', label: lang === 'fr' ? 'MH Classique Clim' : 'Classic MH AC' },
    { value: 'Mobil-home Classique 3ch', label: lang === 'fr' ? 'MH Classique 3 ch' : 'Classic MH 3BR' },
    { value: 'Confort+ 2ch', label: lang === 'fr' ? 'MH Confort+ 2 ch' : 'Comfort+ MH 2BR' },
    { value: 'Confort+ 3ch', label: lang === 'fr' ? 'MH Confort+ 3 ch' : 'Comfort+ MH 3BR' },
    { value: 'Premium 2ch', label: lang === 'fr' ? 'MH Premium 2 ch' : 'Premium MH 2BR' },
    { value: 'Premium 3ch', label: lang === 'fr' ? 'MH Premium 3 ch' : 'Premium MH 3BR' },
    { value: 'Premium Twins', label: 'MH Premium Twins' },
    { value: 'Cottage Premium', label: lang === 'fr' ? 'Cottage Premium 2 ch' : 'Premium Cottage 2BR' }
  ];

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
          
          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-6">
            🏡 {lang === 'fr' ? 'Aide Arrivée Client' : 'Guest Arrival Assistance'}
          </h1>

          <Card className="border-2 border-[#22c55e]/30 rounded-xl">
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
                  <Label>{t('date_arrivee')} *</Label>
                  <Input
                    type="date"
                    value={formData.date_arrivee}
                    onChange={(e) => handleChange('date_arrivee', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <Label>{t('date_depart')} *</Label>
                  <Input
                    type="date"
                    value={formData.date_depart}
                    onChange={(e) => handleChange('date_depart', e.target.value)}
                    className="border-2 border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Personnes */}
              <div>
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  {lang === 'fr' ? 'Nombre de personnes' : 'Number of people'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['nombre_adultes', 'nombre_adolescents', 'nombre_enfants', 'nombre_bebes'].map(field => (
                    <div key={field} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-heading">
                        {field === 'nombre_adultes' && '👨 Adultes'}
                        {field === 'nombre_adolescents' && '🧑 Ados'}
                        {field === 'nombre_enfants' && '👧 Enfants'}
                        {field === 'nombre_bebes' && '👶 Bébés'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDecrement(field)} className="w-8 h-8 rounded-full bg-white border">
                          <Minus className="w-4 h-4 mx-auto" />
                        </button>
                        <span className="w-8 text-center font-bold">{formData[field]}</span>
                        <button onClick={() => handleIncrement(field)} className="w-8 h-8 rounded-full bg-white border">
                          <Plus className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Animaux */}
              <div>
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  {lang === 'fr' ? 'Animaux' : 'Pets'}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                    <span className="text-sm font-heading">🐶 Chiens</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDecrement('nombre_chiens')} className="w-8 h-8 rounded-full bg-white border">
                        <Minus className="w-4 h-4 mx-auto" />
                      </button>
                      <span className="w-8 text-center font-bold">{formData.nombre_chiens}</span>
                      <button onClick={() => handleIncrement('nombre_chiens')} className="w-8 h-8 rounded-full bg-white border">
                        <Plus className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
                    <span className="text-sm font-heading">🐱 Chats</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDecrement('nombre_chats')} className="w-8 h-8 rounded-full bg-white border">
                        <Minus className="w-4 h-4 mx-auto" />
                      </button>
                      <span className="w-8 text-center font-bold">{formData.nombre_chats}</span>
                      <button onClick={() => handleIncrement('nombre_chats')} className="w-8 h-8 rounded-full bg-white border">
                        <Plus className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hébergement */}
              <div>
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  {lang === 'fr' ? 'Hébergement' : 'Accommodation'}
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        handleChange('type_logement', 'emplacement');
                        handleChange('categorie_logement', '');
                      }}
                      className={`flex-1 p-3 rounded-xl border-2 ${
                        formData.type_logement === 'emplacement' ? 'border-[#00AEEF] bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      ⛺ Emplacement
                    </button>
                    <button
                      onClick={() => {
                        handleChange('type_logement', 'mobilhome');
                        handleChange('categorie_logement', '');
                      }}
                      className={`flex-1 p-3 rounded-xl border-2 ${
                        formData.type_logement === 'mobilhome' ? 'border-[#22c55e] bg-green-50' : 'border-gray-300'
                      }`}
                    >
                      🏠 Mobil-home
                    </button>
                  </div>

                  {formData.type_logement && (
                    <>
                      <Select value={formData.categorie_logement} onValueChange={(v) => handleChange('categorie_logement', v)}>
                        <SelectTrigger className="border-2 border-gray-200 rounded-xl">
                          <SelectValue placeholder={lang === 'fr' ? 'Catégorie' : 'Category'} />
                        </SelectTrigger>
                        <SelectContent>
                          {(formData.type_logement === 'emplacement' ? emplacementCategories : mobilhomeCategories).map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {formData.categorie_logement && (
                        <Select value={formData.numero_logement} onValueChange={(v) => handleChange('numero_logement', v)}>
                          <SelectTrigger className="border-2 border-gray-200 rounded-xl">
                            <SelectValue placeholder={lang === 'fr' ? 'Numéro' : 'Number'} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableNumbers.map(num => (
                              <SelectItem key={num} value={num}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Propreté */}
              <div>
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  {lang === 'fr' ? 'État de propreté' : 'Cleanliness status'}
                </h3>
                <div className="flex gap-3">
                  {[
                    { value: 'pas_satisfaisant', emoji: '😠', label: 'Pas satisfaisant' },
                    { value: 'correct', emoji: '😐', label: 'Correct' },
                    { value: 'tres_propre', emoji: '😊', label: 'Très propre' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleChange('proprete', opt.value)}
                      className={`flex-1 p-3 rounded-xl border-2 ${
                        formData.proprete === opt.value ? 'border-[#22c55e] bg-green-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="text-3xl">{opt.emoji}</div>
                      <div className="text-xs mt-1">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo */}
              <div>
                <Label>{lang === 'fr' ? 'Photo (optionnel)' : 'Photo (optional)'}</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-arrivee"
                />
                <label htmlFor="photo-arrivee">
                  <Button type="button" variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {formData.photo_arrivee ? '✅ Photo ajoutée' : 'Ajouter photo'}
                  </Button>
                </label>
              </div>

              {/* Remarques internes */}
              <div>
                <Label>{lang === 'fr' ? 'Remarques internes (non visible client)' : 'Internal notes (not visible to guest)'}</Label>
                <Textarea
                  value={formData.remarques_internes}
                  onChange={(e) => handleChange('remarques_internes', e.target.value)}
                  className="border-2 border-gray-200 rounded-xl"
                  rows={3}
                  placeholder={lang === 'fr' ? 'Notes pour la réception...' : 'Notes for reception...'}
                />
              </div>

              {/* Validation */}
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl font-heading"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {lang === 'fr' ? 'Enregistrement...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {lang === 'fr' ? 'Valider l\'arrivée du client' : 'Validate guest arrival'}
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