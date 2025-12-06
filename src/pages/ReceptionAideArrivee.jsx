import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { getCodeFromCategory } from '../components/categoryCodeMapping';
import SelecteurHebergement from '../components/reception/SelecteurHebergement';
import Logo from '../components/Logo';
import PhotoManagerReception from '../components/reception/PhotoManagerReception';
import DemanderPhotosDialog from '../components/reception/DemanderPhotosDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ReceptionAideArrivee() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [etape, setEtape] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    client_nom: '',
    client_prenom: '',
    date_arrivee: '',
    date_depart: '',
    type_logement: '',
    categorie_logement: '',
    numero_logement: '',
    nombre_adultes: 0,
    nombre_adolescents: 0,
    nombre_enfants: 0,
    nombre_bebes: 0,
    nombre_animaux: 0,
    nombre_chiens: 0,
    nombre_chats: 0,
    autres_animaux: '',
    inventaire_valide: true,
    objets_manquants: [],
    photos: [],
    evaluation_proprete: 'correct',
    commentaire_proprete: '',
    remarques: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.client_nom || !formData.client_prenom || !formData.numero_logement) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    setSubmitting(true);

    try {
      const codeDossier = `ARRIVEE-${formData.numero_logement}-${formData.date_arrivee || new Date().toISOString().split('T')[0]}`;
      
      // Créer le dossier d'arrivée
      const dossier = await base44.entities.DossierArrivee.create({
        code_dossier: codeDossier,
        client_nom: formData.client_nom,
        client_prenom: formData.client_prenom,
        date_arrivee: formData.date_arrivee || new Date().toISOString().split('T')[0],
        date_depart: formData.date_depart || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type_logement: formData.type_logement,
        categorie_logement: formData.categorie_logement,
        numero_logement: formData.numero_logement,
        nombre_adultes: formData.nombre_adultes,
        nombre_adolescents: formData.nombre_adolescents,
        nombre_enfants: formData.nombre_enfants,
        nombre_bebes: formData.nombre_bebes,
        nombre_animaux: formData.nombre_animaux,
        nombre_chiens: formData.nombre_chiens,
        nombre_chats: formData.nombre_chats,
        autres_animaux: formData.autres_animaux,
        etape_actuelle: 4,
        etape_1_terminee: true,
        etape_2_terminee: true,
        etape_3_terminee: true,
        etape_4_terminee: true,
        statut: 'finalise',
        date_finalisation: new Date().toISOString(),
        remarques_client: `[RÉCEPTION] ${formData.remarques}`
      });

      // Créer le contrôle inventaire
      await base44.entities.ControleInventaireArrivee.create({
        numero_locatif: formData.numero_logement,
        categorie_locatif: formData.categorie_logement,
        client_nom: formData.client_nom,
        client_prenom: formData.client_prenom,
        date_arrivee: formData.date_arrivee || new Date().toISOString().split('T')[0],
        date_depart: formData.date_depart || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        objets_valides: [],
        objets_manquants: formData.objets_manquants,
        photos_pieces: formData.photos.reduce((acc, photo, index) => {
          acc[`photo_${index + 1}`] = {
            url: photo.url,
            source: photo.source,
            description: photo.description
          };
          return acc;
        }, {}),
        evaluation_proprete: formData.evaluation_proprete,
        commentaire_proprete: formData.commentaire_proprete,
        date_validation: new Date().toISOString(),
        inventaire_complet: formData.objets_manquants.length === 0
      });

      // Si propreté insatisfaisante, créer intervention
      if (formData.evaluation_proprete === 'pas_satisfaisant') {
        await base44.entities.Incident.create({
          type: 'menage',
          categorie: 'nettoyage',
          description: `Propreté insatisfaisante constatée à l'arrivée - ${formData.commentaire_proprete}`,
          urgent: true,
          client_nom: formData.client_nom,
          client_prenom: formData.client_prenom,
          date_arrivee: formData.date_arrivee,
          date_depart: formData.date_depart,
          logement: formData.numero_logement,
          statut: 'en_attente',
          autorisation_acces: 'oui',
          commentaire_interne: '[RÉCEPTION] Constaté lors de l\'arrivée assistée'
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

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => etape === 1 ? navigate(createPageUrl('ReceptionAssistance')) : setEtape(etape - 1)}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-6">
            🏡 {lang === 'fr' ? 'Aide Arrivée Client' : 'Guest Arrival Assistance'}
          </h1>

          {/* Barre de progression */}
          <Card className="border-2 border-[#22c55e]/30 rounded-xl mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5].map(step => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      etape > step ? 'bg-green-500 text-white' :
                      etape === step ? 'bg-[#22c55e] text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {etape > step ? '✓' : step}
                    </div>
                    {step < 5 && <div className={`w-12 h-1 ${etape > step ? 'bg-green-500' : 'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <AnimatePresence mode="wait">
            {/* Étape 1 : Identité */}
            {etape === 1 && (
              <motion.div key="etape1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Card className="border-2 border-[#22c55e]/30 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-heading text-xl text-[#0077A8]">
                      👤 {lang === 'fr' ? 'Identité client' : 'Guest identity'}
                    </h2>
                    
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
                    </div>

                    <div>
                      <h3 className="font-heading text-[#0077A8] mb-3">
                        {lang === 'fr' ? 'Hébergement' : 'Accommodation'} *
                      </h3>
                      <SelecteurHebergement 
                        onSelect={(sel) => {
                          const typeLogement = sel.type === 'Emplacement' ? 'emplacement' : 'mobilhome';
                          handleChange('type_logement', typeLogement);
                          handleChange('categorie_logement', sel.categorie);
                          handleChange('numero_logement', sel.numero);
                        }}
                        lang={lang}
                      />
                    </div>

                    <Button onClick={() => setEtape(2)} className="w-full bg-[#22c55e] hover:bg-[#16a34a]">
                      {t('suivant')} <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Étape 2 : Statistiques */}
            {etape === 2 && (
              <motion.div key="etape2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Card className="border-2 border-[#22c55e]/30 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-heading text-xl text-[#0077A8]">
                      👥 {lang === 'fr' ? 'Statistiques séjour' : 'Stay statistics'}
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{lang === 'fr' ? 'Adultes (18+)' : 'Adults (18+)'}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.nombre_adultes}
                          onChange={(e) => handleChange('nombre_adultes', parseInt(e.target.value) || 0)}
                          className="border-2 border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label>{lang === 'fr' ? 'Adolescents (13-17)' : 'Teens (13-17)'}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.nombre_adolescents}
                          onChange={(e) => handleChange('nombre_adolescents', parseInt(e.target.value) || 0)}
                          className="border-2 border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label>{lang === 'fr' ? 'Enfants (3-12)' : 'Children (3-12)'}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.nombre_enfants}
                          onChange={(e) => handleChange('nombre_enfants', parseInt(e.target.value) || 0)}
                          className="border-2 border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label>{lang === 'fr' ? 'Bébés (0-2)' : 'Babies (0-2)'}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.nombre_bebes}
                          onChange={(e) => handleChange('nombre_bebes', parseInt(e.target.value) || 0)}
                          className="border-2 border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label>{lang === 'fr' ? '🐶 Chiens' : '🐶 Dogs'}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.nombre_chiens}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleChange('nombre_chiens', val);
                            handleChange('nombre_animaux', val + formData.nombre_chats);
                          }}
                          className="border-2 border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label>{lang === 'fr' ? '🐱 Chats' : '🐱 Cats'}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.nombre_chats}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            handleChange('nombre_chats', val);
                            handleChange('nombre_animaux', formData.nombre_chiens + val);
                          }}
                          className="border-2 border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <Button onClick={() => setEtape(3)} className="w-full bg-[#22c55e] hover:bg-[#16a34a]">
                      {t('suivant')} <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Étape 3 : Photos */}
            {etape === 3 && (
              <motion.div key="etape3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Card className="border-2 border-[#22c55e]/30 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-heading text-xl text-[#0077A8]">
                      📸 {lang === 'fr' ? 'Photos d\'état' : 'Condition photos'}
                    </h2>
                    
                    <PhotoManagerReception
                      numeroLogement={formData.numero_logement}
                      onPhotosSelected={(photos) => handleChange('photos', photos)}
                      selectedPhotos={formData.photos}
                      lang={lang}
                    />

                    <DemanderPhotosDialog
                      numeroLogement={formData.numero_logement}
                      serviceType="menage"
                      description={lang === 'fr' ? 'État initial du locatif' : 'Initial accommodation condition'}
                      lang={lang}
                    />

                    <Button onClick={() => setEtape(4)} className="w-full bg-[#22c55e] hover:bg-[#16a34a]">
                      {t('suivant')} <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Étape 4 : Propreté */}
            {etape === 4 && (
              <motion.div key="etape4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Card className="border-2 border-[#22c55e]/30 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-heading text-xl text-[#0077A8]">
                      🧹 {lang === 'fr' ? 'Évaluation propreté' : 'Cleanliness assessment'}
                    </h2>
                    
                    <div className="flex gap-3">
                      {[
                        { value: 'pas_satisfaisant', emoji: '😠', label: 'Pas satisfaisant' },
                        { value: 'correct', emoji: '😐', label: 'Correct' },
                        { value: 'tres_propre', emoji: '😊', label: 'Très propre' }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleChange('evaluation_proprete', opt.value)}
                          className={`flex-1 p-4 rounded-xl border-2 ${
                            formData.evaluation_proprete === opt.value ? 'border-[#22c55e] bg-green-50' : 'border-gray-300'
                          }`}
                        >
                          <div className="text-4xl mb-2">{opt.emoji}</div>
                          <div className="text-sm">{opt.label}</div>
                        </button>
                      ))}
                    </div>

                    <div>
                      <Label>{lang === 'fr' ? 'Commentaire' : 'Comment'}</Label>
                      <Textarea
                        value={formData.commentaire_proprete}
                        onChange={(e) => handleChange('commentaire_proprete', e.target.value)}
                        className="border-2 border-gray-200 rounded-xl"
                        rows={3}
                        placeholder={lang === 'fr' ? 'Observations...' : 'Observations...'}
                      />
                    </div>

                    <Button onClick={() => setEtape(5)} className="w-full bg-[#22c55e] hover:bg-[#16a34a]">
                      {t('suivant')} <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Étape 5 : Validation */}
            {etape === 5 && (
              <motion.div key="etape5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Card className="border-2 border-[#22c55e]/30 rounded-xl">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-heading text-xl text-[#0077A8]">
                      ✅ {lang === 'fr' ? 'Remarques finales' : 'Final remarks'}
                    </h2>
                    
                    <div>
                      <Label>{lang === 'fr' ? 'Remarques' : 'Remarks'}</Label>
                      <Textarea
                        value={formData.remarques}
                        onChange={(e) => handleChange('remarques', e.target.value)}
                        className="border-2 border-gray-200 rounded-xl"
                        rows={4}
                        placeholder={lang === 'fr' ? 'Remarques internes ou client...' : 'Internal or guest remarks...'}
                      />
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full h-12 bg-[#22c55e] hover:bg-[#16a34a]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {lang === 'fr' ? 'Validation...' : 'Validating...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {lang === 'fr' ? 'Valider l\'arrivée' : 'Validate arrival'}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}