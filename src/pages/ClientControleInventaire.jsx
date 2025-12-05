import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import SignaturePad from '../components/SignaturePad';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Camera, Check, AlertCircle, Smile, Meh, Frown, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientControleInventaire() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  // Récupération des données de session
  const nom = sessionStorage.getItem('arrivee_nom');
  const prenom = sessionStorage.getItem('arrivee_prenom');
  const dateArrivee = sessionStorage.getItem('arrivee_date_arrivee');
  const dateDepart = sessionStorage.getItem('arrivee_date_depart');
  const typeLogement = sessionStorage.getItem('arrivee_type_logement') || 'mobilhome';
  const categorie = sessionStorage.getItem('arrivee_categorie');
  const numero = sessionStorage.getItem('arrivee_numero');

  const [objetsValides, setObjetsValides] = useState([]);
  const [objetsMissing, setObjetsMissing] = useState([]);
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [missingItem, setMissingItem] = useState({ objet: '', photo: '', commentaire: '' });
  const [photosLieux, setPhotosLieux] = useState({});
  const [evaluationProprete, setEvaluationProprete] = useState('');
  const [commentaireProprete, setCommentaireProprete] = useState('');
  const [photoProprete, setPhotoProprete] = useState('');
  const [remarques, setRemarques] = useState('');
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!nom || !categorie) {
      navigate(createPageUrl('ClientArriveeIdentite'));
    }
  }, [nom, categorie, navigate]);

  // Liste d'inventaire simplifiée (peut être étendue selon la catégorie)
  const inventaireItems = typeLogement === 'mobilhome' ? [
    { id: 'assiettes', icon: '🍽️', nom_fr: 'Assiettes', nom_en: 'Plates', quantite: 'x6' },
    { id: 'verres', icon: '🥤', nom_fr: 'Verres', nom_en: 'Glasses', quantite: 'x6' },
    { id: 'couverts', icon: '🍴', nom_fr: 'Couverts', nom_en: 'Cutlery', quantite: 'x6' },
    { id: 'casseroles', icon: '🍳', nom_fr: 'Casseroles', nom_en: 'Pots', quantite: 'x3' },
    { id: 'poeles', icon: '🍳', nom_fr: 'Poêles', nom_en: 'Pans', quantite: 'x2' },
    { id: 'tv', icon: '📺', nom_fr: 'TV', nom_en: 'TV', quantite: 'x1' },
    { id: 'frigo', icon: '❄️', nom_fr: 'Frigo', nom_en: 'Fridge', quantite: 'x1' },
    { id: 'micro_ondes', icon: '⚡', nom_fr: 'Micro-ondes', nom_en: 'Microwave', quantite: 'x1' },
    { id: 'balai', icon: '🧹', nom_fr: 'Balai', nom_en: 'Broom', quantite: 'x1' },
    { id: 'serpilliere', icon: '🧽', nom_fr: 'Serpillière', nom_en: 'Mop', quantite: 'x1' },
    { id: 'table_exterieure', icon: '🪑', nom_fr: 'Table extérieure', nom_en: 'Outdoor table', quantite: 'x1' },
    { id: 'chaises', icon: '🪑', nom_fr: 'Chaises', nom_en: 'Chairs', quantite: 'x6' },
  ] : [
    { id: 'terrain_propre', icon: '✅', nom_fr: 'Terrain propre', nom_en: 'Clean pitch', quantite: '' },
    { id: 'electricite', icon: '⚡', nom_fr: 'Électricité', nom_en: 'Electricity', quantite: '' },
  ];

  const lieuxPhoto = typeLogement === 'mobilhome' ? [
    { id: 'cuisine', label_fr: 'Cuisine', label_en: 'Kitchen' },
    { id: 'salle_bain', label_fr: 'Salle de bain', label_en: 'Bathroom' },
    { id: 'wc', label_fr: 'WC', label_en: 'Toilet' },
    { id: 'chambre_principale', label_fr: 'Chambre principale', label_en: 'Master bedroom' },
    { id: 'chambre_enfants', label_fr: 'Chambre enfants', label_en: 'Children bedroom' },
    { id: 'sejour', label_fr: 'Séjour / Vaisselle', label_en: 'Living room / Dishes' },
    { id: 'terrasse', label_fr: 'Terrasse', label_en: 'Terrace' },
  ] : [
    { id: 'terrain_general', label_fr: 'Vue générale terrain', label_en: 'General pitch view' },
  ];

  const toggleObjet = (objetId) => {
    if (objetsValides.includes(objetId)) {
      setObjetsValides(objetsValides.filter(id => id !== objetId));
    } else {
      setObjetsValides([...objetsValides, objetId]);
    }
  };

  const handlePhotoLieu = async (lieuId, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotosLieux(prev => ({ ...prev, [lieuId]: file_url }));
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddMissing = () => {
    if (!missingItem.objet) {
      toast.error(lang === 'fr' ? 'Veuillez sélectionner un objet' : 'Please select an item');
      return;
    }
    setObjetsMissing([...objetsMissing, { ...missingItem, date: new Date().toISOString() }]);
    setMissingItem({ objet: '', photo: '', commentaire: '' });
    setShowMissingDialog(false);
    toast.success(lang === 'fr' ? 'Objet déclaré' : 'Item declared');
  };

  const handleUploadMissingPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMissingItem(prev => ({ ...prev, photo: file_url }));
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadPropretePhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoProprete(file_url);
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!evaluationProprete) {
      toast.error(lang === 'fr' ? 'Veuillez évaluer la propreté' : 'Please evaluate cleanliness');
      return;
    }

    if (evaluationProprete === 'pas_satisfaisant' && !commentaireProprete) {
      toast.error(lang === 'fr' ? 'Commentaire obligatoire si propreté insatisfaisante' : 'Comment required if cleanliness unsatisfactory');
      return;
    }

    if (!signature) {
      toast.error(lang === 'fr' ? 'Signature requise' : 'Signature required');
      return;
    }

    setSubmitting(true);
    try {
      // Upload signature
      const blob = await fetch(signature).then(r => r.blob());
      const signatureFile = new File([blob], 'signature.png', { type: 'image/png' });
      const { file_url: signatureUrl } = await base44.integrations.Core.UploadFile({ file: signatureFile });

      await base44.entities.ControleInventaireArrivee.create({
        numero_locatif: numero,
        categorie_locatif: categorie,
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        objets_valides: objetsValides,
        objets_manquants: objetsMissing,
        photos_pieces: photosLieux,
        evaluation_proprete: evaluationProprete,
        commentaire_proprete: commentaireProprete,
        photo_proprete: photoProprete,
        remarques_suggestions: remarques,
        signature_url: signatureUrl,
        date_validation: new Date().toISOString(),
        inventaire_complet: objetsMissing.length === 0
      });

      toast.success(lang === 'fr' ? '✅ Inventaire envoyé à la réception !' : '✅ Inventory sent to reception!');
      
      // Nettoyer session
      setTimeout(() => {
        sessionStorage.removeItem('arrivee_nom');
        sessionStorage.removeItem('arrivee_prenom');
        sessionStorage.removeItem('arrivee_date_arrivee');
        sessionStorage.removeItem('arrivee_date_depart');
        sessionStorage.removeItem('arrivee_type_logement');
        sessionStorage.removeItem('arrivee_categorie');
        sessionStorage.removeItem('arrivee_numero');
        navigate(createPageUrl('Home'));
      }, 2000);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de l\'envoi' : 'Submit error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('ClientArriveeHebergement'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-2">
            ✔️ {lang === 'fr' ? 'Contrôle Inventaire' : 'Inventory Check'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-6">
            {lang === 'fr' ? 'Arrivée - Validation' : 'Arrival - Validation'}
          </p>

          {/* Bloc 1 - Informations séjour */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                📋 {lang === 'fr' ? 'Informations du séjour' : 'Stay information'}
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>{lang === 'fr' ? 'N° locatif' : 'Rental #'}:</strong> {numero}</p>
                <p><strong>{lang === 'fr' ? 'Catégorie' : 'Category'}:</strong> {categorie}</p>
                <p><strong>{lang === 'fr' ? 'Nom & Prénom' : 'Name'}:</strong> {nom} {prenom}</p>
                <p><strong>{lang === 'fr' ? 'Dates' : 'Dates'}:</strong> {dateArrivee} — {dateDepart}</p>
              </div>
            </CardContent>
          </Card>

          {/* Bloc 2 - Contrôle objets */}
          <Card className="border-2 border-[#22c55e]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-2">
                ✔️ {lang === 'fr' ? 'Touchez les icônes pour valider les objets présents' : 'Tap icons to validate present items'}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                ❗ {lang === 'fr' 
                  ? 'Si une icône n\'est pas cochée = objet manquant ou abîmé' 
                  : 'If an icon is not checked = missing or damaged item'}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {inventaireItems.map(item => {
                  const isValidated = objetsValides.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleObjet(item.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isValidated 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 bg-white hover:border-[#00AEEF]'
                      }`}
                    >
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="text-sm font-heading text-[#0077A8]">
                        {lang === 'fr' ? item.nom_fr : item.nom_en}
                      </div>
                      <div className="text-xs text-gray-500">{item.quantite}</div>
                      {isValidated && (
                        <Check className="w-5 h-5 text-green-600 mx-auto mt-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => setShowMissingDialog(true)}
                variant="outline"
                className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {lang === 'fr' ? 'Déclarer un objet manquant / cassé' : 'Report missing / broken item'}
              </Button>

              {objetsMissing.length > 0 && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                  <p className="font-heading text-sm text-orange-800 mb-2">
                    {lang === 'fr' ? 'Objets déclarés :' : 'Declared items:'}
                  </p>
                  {objetsMissing.map((obj, idx) => (
                    <div key={idx} className="text-sm text-gray-700">
                      • {obj.objet}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bloc 3 - Photos facultatives */}
          <Card className="border-2 border-blue-300 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-2">
                📸 {lang === 'fr' ? 'Photos de l\'état initial' : 'Initial condition photos'}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                🟦 {lang === 'fr' 
                  ? 'Ces photos ne sont pas obligatoires, sauf si vous constatez un problème. Elles vous protègent en cas de litige.'
                  : 'These photos are not mandatory unless you notice a problem. They protect you in case of dispute.'}
              </p>

              <div className="space-y-3">
                {lieuxPhoto.map(lieu => (
                  <div key={lieu.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-heading text-[#0077A8]">
                      {lang === 'fr' ? lieu.label_fr : lieu.label_en}
                    </span>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoLieu(lieu.id, e.target.files[0])}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant={photosLieux[lieu.id] ? 'outline' : 'default'}
                        size="sm"
                        className={photosLieux[lieu.id] ? 'border-green-500 text-green-600' : ''}
                        asChild
                      >
                        <span>
                          {photosLieux[lieu.id] ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              {lang === 'fr' ? 'OK' : 'Done'}
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-1" />
                              {lang === 'fr' ? 'Photo' : 'Photo'}
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bloc 4 - Propreté */}
          <Card className="border-2 border-[#FFA500]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                🧽 {lang === 'fr' ? 'Comment trouvez-vous la propreté du locatif ?' : 'How do you find the cleanliness?'}
              </h2>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => setEvaluationProprete('pas_satisfaisant')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    evaluationProprete === 'pas_satisfaisant'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                >
                  <Frown className="w-12 h-12 mx-auto mb-2 text-red-500" />
                  <div className="text-sm font-heading text-center">
                    {lang === 'fr' ? 'Pas satisfaisant' : 'Unsatisfactory'}
                  </div>
                </button>

                <button
                  onClick={() => setEvaluationProprete('correct')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    evaluationProprete === 'correct'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-300 hover:border-yellow-300'
                  }`}
                >
                  <Meh className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
                  <div className="text-sm font-heading text-center">
                    {lang === 'fr' ? 'Correct' : 'Okay'}
                  </div>
                </button>

                <button
                  onClick={() => setEvaluationProprete('tres_propre')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    evaluationProprete === 'tres_propre'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <Smile className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <div className="text-sm font-heading text-center">
                    {lang === 'fr' ? 'Très propre' : 'Very clean'}
                  </div>
                </button>
              </div>

              {evaluationProprete === 'pas_satisfaisant' && (
                <div className="space-y-3">
                  <Textarea
                    placeholder={lang === 'fr' ? 'Décrivez le problème (obligatoire)' : 'Describe the problem (required)'}
                    value={commentaireProprete}
                    onChange={(e) => setCommentaireProprete(e.target.value)}
                    className="border-2"
                  />
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleUploadPropretePhoto(e.target.files[0])}
                    />
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        {photoProprete ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            {lang === 'fr' ? 'Photo ajoutée' : 'Photo added'}
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-2" />
                            {lang === 'fr' ? 'Ajouter une photo' : 'Add photo'}
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              )}

              {evaluationProprete === 'correct' && (
                <Textarea
                  placeholder={lang === 'fr' ? 'Commentaire facultatif' : 'Optional comment'}
                  value={commentaireProprete}
                  onChange={(e) => setCommentaireProprete(e.target.value)}
                  className="border-2"
                />
              )}
            </CardContent>
          </Card>

          {/* Bloc 5 - Remarques */}
          <Card className="border-2 border-gray-300 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                💬 {lang === 'fr' ? 'Remarques ou suggestions' : 'Comments or suggestions'}
              </h2>
              <Textarea
                placeholder={lang === 'fr' ? 'Avez-vous une remarque, une suggestion, un problème constaté ?' : 'Any comment, suggestion, or issue?'}
                value={remarques}
                onChange={(e) => setRemarques(e.target.value)}
                className="border-2"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Bloc 6 - Signature */}
          <SignaturePad onSave={setSignature} disabled={submitting} lang={lang} />

          {/* Bloc 7 - Validation */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !evaluationProprete || !signature}
            className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading text-lg mt-6"
          >
            <Send className="w-5 h-5 mr-2" />
            {submitting 
              ? (lang === 'fr' ? 'Envoi en cours...' : 'Sending...')
              : (lang === 'fr' ? 'Envoyer à la réception' : 'Send to reception')
            }
          </Button>
        </motion.div>

        {/* Dialog objet manquant */}
        <Dialog open={showMissingDialog} onOpenChange={setShowMissingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl text-[#0077A8]">
                {lang === 'fr' ? 'Déclarer un objet' : 'Report an item'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Objet concerné' : 'Item'}
                </label>
                <Select value={missingItem.objet} onValueChange={(val) => setMissingItem(prev => ({ ...prev, objet: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={lang === 'fr' ? 'Sélectionner' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {inventaireItems.map(item => (
                      <SelectItem key={item.id} value={lang === 'fr' ? item.nom_fr : item.nom_en}>
                        {item.icon} {lang === 'fr' ? item.nom_fr : item.nom_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Photo (recommandée)' : 'Photo (recommended)'}
                </label>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleUploadMissingPhoto(e.target.files[0])}
                  />
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      {missingItem.photo ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {lang === 'fr' ? 'Photo ajoutée' : 'Photo added'}
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          {lang === 'fr' ? 'Ajouter photo' : 'Add photo'}
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Commentaire' : 'Comment'}
                </label>
                <Textarea
                  value={missingItem.commentaire}
                  onChange={(e) => setMissingItem(prev => ({ ...prev, commentaire: e.target.value }))}
                  placeholder={lang === 'fr' ? 'Décrivez le problème...' : 'Describe the issue...'}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMissingDialog(false)}
                  className="flex-1"
                >
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleAddMissing}
                  className="flex-1 bg-[#FFA500] hover:bg-[#FF8C00]"
                >
                  {lang === 'fr' ? 'Enregistrer' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}