import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { getCodeFromCategory, getInventaireParCategorie } from '../components/categoryCodeMapping';
import { getCategorie, isUrgent, getDescriptionProbleme } from '../components/inventaireCategories';
import Logo from '../components/Logo';
import SignaturePad from '../components/SignaturePad';
import ArriveeProgressBar from '../components/ArriveeProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Camera, Check, AlertCircle, Smile, Meh, Frown, Send, Loader2, Wrench, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { notifierInventaireSoumis, notifierInterventionCreee, notifierDossierFinalise } from '../components/notificationService';
import { uploadCompressedImage } from '../components/imageCompression';
import LazyInventaire from '../components/LazyInventaire';
import { clearInventaireCache } from '../components/inventaireCache';

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
  const [showRecapDialog, setShowRecapDialog] = useState(false);
  const [interventionsPreview, setInterventionsPreview] = useState({ menage: [], technique: [] });

  useEffect(() => {
    if (!nom || !categorie) {
      navigate(createPageUrl('ClientArriveeIdentite'));
    }
    // Vider le cache pour forcer le rechargement avec quantités
    clearInventaireCache();
  }, [nom, categorie, navigate]);

  // Charger l'inventaire depuis categoryCodeMapping
  const codeCategorie = typeLogement === 'mobilhome' && categorie ? getCodeFromCategory(categorie) : null;

  // Utiliser getInventaireParCategorie au lieu de charger depuis la base
  const inventaireLocal = typeLogement === 'mobilhome' && categorie 
    ? getInventaireParCategorie(categorie, lang)
    : null;

  // Liste d'inventaire selon la catégorie
  const inventaireItems = typeLogement === 'mobilhome' && inventaireLocal
    ? inventaireLocal.objets.map(obj => ({
        id: obj.id,
        icon: obj.icon,
        nom_fr: obj.label,
        nom_en: obj.label,
        quantite: obj.quantity
      }))
    : typeLogement === 'emplacement' 
      ? [
          { id: 'terrain_propre', icon: '✅', nom_fr: 'Terrain propre', nom_en: 'Clean pitch', quantite: '' },
          { id: 'electricite', icon: '⚡', nom_fr: 'Électricité', nom_en: 'Electricity', quantite: '' },
        ]
      : [];

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
      const result = await uploadCompressedImage(file, (compressedFile) => 
        base44.integrations.Core.UploadFile({ file: compressedFile })
      );
      setPhotosLieux(prev => ({ ...prev, [lieuId]: result.file_url }));
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
      const result = await uploadCompressedImage(file, (compressedFile) => 
        base44.integrations.Core.UploadFile({ file: compressedFile })
      );
      setMissingItem(prev => ({ ...prev, photo: result.file_url }));
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
      const result = await uploadCompressedImage(file, (compressedFile) => 
        base44.integrations.Core.UploadFile({ file: compressedFile })
      );
      setPhotoProprete(result.file_url);
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const analyzeAndPrepareInterventions = () => {
    const interventionsMenage = [];
    const interventionsTechnique = [];

    // Analyser objets NON VALIDÉS (non cochés) → MÉNAGE par défaut
    inventaireItems.forEach(item => {
      const isValidated = objetsValides.includes(item.id);
      
      if (!isValidated) {
        const intervention = {
          objet: lang === 'fr' ? item.nom_fr : item.nom_en,
          description: `${lang === 'fr' ? 'Objet manquant ou à vérifier' : 'Missing or to check'}: ${lang === 'fr' ? item.nom_fr : item.nom_en}`,
          urgent: false,
          icon: item.icon,
          photo: null
        };

        // Objet non coché = intervention MÉNAGE
        interventionsMenage.push(intervention);
      }
    });

    // Objets déclarés MANUELLEMENT avec PHOTO = TECHNIQUE (cassé)
    objetsMissing.forEach(obj => {
      const intervention = {
        objet: obj.objet,
        description: obj.commentaire || `${lang === 'fr' ? 'Objet cassé ou endommagé' : 'Broken or damaged item'}: ${obj.objet}`,
        urgent: true,
        photo: obj.photo
      };

      // Objet déclaré manuellement = intervention TECHNIQUE
      interventionsTechnique.push(intervention);
    });

    // Propreté insatisfaisante = intervention MÉNAGE URGENT
    if (evaluationProprete === 'pas_satisfaisant') {
      interventionsMenage.push({
        objet: lang === 'fr' ? 'Propreté insatisfaisante' : 'Unsatisfactory cleanliness',
        description: commentaireProprete || (lang === 'fr' ? 'Propreté du logement non satisfaisante constatée à l\'arrivée' : 'Unsatisfactory cleanliness found on arrival'),
        urgent: true,
        photo: photoProprete
      });
    }

    return { menage: interventionsMenage, technique: interventionsTechnique };
  };

  const handlePrepareSubmit = () => {
    if (!evaluationProprete) {
      toast.error(lang === 'fr' ? 'Veuillez évaluer la propreté' : 'Please evaluate cleanliness');
      return;
    }

    if (evaluationProprete === 'pas_satisfaisant' && !commentaireProprete) {
      toast.error(lang === 'fr' ? 'Commentaire obligatoire si propreté insatisfaisante' : 'Comment required if cleanliness unsatisfactory');
      return;
    }

    // Signature optionnelle si tout est OK
    const hasProblems = (inventaireItems.length - objetsValides.length) > 0 || 
                        objetsMissing.length > 0 || 
                        evaluationProprete === 'pas_satisfaisant';
    
    if (hasProblems && !signature) {
      toast.error(lang === 'fr' ? 'Signature requise en cas de problème' : 'Signature required if issues found');
      return;
    }

    // Analyser et préparer les interventions
    const interventions = analyzeAndPrepareInterventions();
    setInterventionsPreview(interventions);
    setShowRecapDialog(true);
  };

  const handleFinalSubmit = async () => {

    setSubmitting(true);
    setShowRecapDialog(false);
    
    try {
      // Upload signature
      const blob = await fetch(signature).then(r => r.blob());
      const signatureFile = new File([blob], 'signature.png', { type: 'image/png' });
      const { file_url: signatureUrl } = await base44.integrations.Core.UploadFile({ file: signatureFile });

      // Créer le contrôle inventaire
      const inventaire = await base44.entities.ControleInventaireArrivee.create({
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
        inventaire_complet: objetsMissing.length === 0 && evaluationProprete !== 'pas_satisfaisant'
      });

      // 🔔 Notifier la réception de l'inventaire soumis
      await notifierInventaireSoumis(inventaire);

      // Créer les interventions ménage
      const interventionsMenageIds = [];
      for (const intervention of interventionsPreview.menage) {
        const incident = await base44.entities.Incident.create({
          type: 'menage',
          categorie: 'menage',
          sous_categorie: intervention.objet,
          description: intervention.description,
          urgent: intervention.urgent,
          client_nom: nom,
          client_prenom: prenom,
          date_arrivee: dateArrivee,
          date_depart: dateDepart,
          logement: numero,
          photo_url: intervention.photo || '',
          date_saisie: new Date().toISOString(),
          statut: 'en_attente',
          autorisation_acces: 'oui',
          clause_autorisation_acceptee: true,
          origine: 'arrivee',
          fiche_arrivee_id: inventaire.id,
          dossier_arrivee_id: dossierId
        });
        interventionsMenageIds.push(incident.id);

        // 🔔 Notifier l'équipe ménage
        await notifierInterventionCreee(incident);
      }

      // Créer les interventions technique
      const interventionsTechniqueIds = [];
      for (const intervention of interventionsPreview.technique) {
        const incident = await base44.entities.Incident.create({
          type: 'technique',
          categorie: 'divers_technique',
          sous_categorie: intervention.objet,
          description: intervention.description,
          urgent: intervention.urgent,
          client_nom: nom,
          client_prenom: prenom,
          date_arrivee: dateArrivee,
          date_depart: dateDepart,
          logement: numero,
          photo_url: intervention.photo || '',
          date_saisie: new Date().toISOString(),
          statut: 'en_attente',
          autorisation_acces: 'oui',
          clause_autorisation_acceptee: true,
          origine: 'arrivee',
          fiche_arrivee_id: inventaire.id,
          dossier_arrivee_id: dossierId
        });
        interventionsTechniqueIds.push(incident.id);

        // 🔔 Notifier l'équipe technique
        await notifierInterventionCreee(incident);
      }

      // Mettre à jour le dossier d'arrivée
      const dossierId = sessionStorage.getItem('arrivee_dossier_id');
      if (dossierId) {
        const dossierUpdated = await base44.entities.DossierArrivee.update(dossierId, {
          etape_3_terminee: true,
          etape_4_terminee: true,
          etape_actuelle: 4,
          inventaire_json: { 
            objets_valides: objetsValides,
            objets_manquants: objetsMissing 
          },
          photos: photosLieux,
          evaluation_proprete: evaluationProprete,
          remarques: commentaireProprete || remarques,
          signature: signatureUrl,
          inventaire_termine: true,
          statut: 'termine',
          horodatage_creation: new Date().toISOString()
        });

        // Créer la FicheArrivee pour la réception
        await base44.entities.FicheArrivee.create({
          client_nom: nom,
          client_prenom: prenom,
          date_arrivee: dateArrivee,
          date_depart: dateDepart,
          numero_logement: numero,
          categorie_logement: categorie,
          type_logement: typeLogement,
          nombre_adultes: sessionStorage.getItem('arrivee_nombre_adultes') || 0,
          nombre_adolescents: sessionStorage.getItem('arrivee_nombre_adolescents') || 0,
          nombre_enfants: sessionStorage.getItem('arrivee_nombre_enfants') || 0,
          nombre_bebes: sessionStorage.getItem('arrivee_nombre_bebes') || 0,
          nombre_animaux: sessionStorage.getItem('arrivee_nombre_animaux') || 0,
          inventaire_objets_valides: objetsValides,
          inventaire_objets_manquants: objetsMissing,
          evaluation_proprete: evaluationProprete,
          commentaire_proprete: commentaireProprete,
          photos_pieces: photosLieux,
          remarques_client: remarques,
          signature_url: signatureUrl,
          date_validation: new Date().toISOString()
        });
        
        // 🔔 Notifier la réception du dossier finalisé
        await notifierDossierFinalise(dossierUpdated, {
          interventions_menage: interventionsMenageIds.length,
          interventions_technique: interventionsTechniqueIds.length,
          inventaire_complet: objetsMissing.length === 0 && evaluationProprete !== 'pas_satisfaisant'
        });
      }

      toast.success(lang === 'fr' ? '✅ Inventaire envoyé à la réception !' : '✅ Inventory sent to reception!');
      
      if (interventionsPreview.menage.length > 0 || interventionsPreview.technique.length > 0) {
        toast.success(lang === 'fr' 
          ? `📋 ${interventionsPreview.menage.length + interventionsPreview.technique.length} intervention(s) créée(s) automatiquement`
          : `📋 ${interventionsPreview.menage.length + interventionsPreview.technique.length} intervention(s) created automatically`
        );
      }
      
      // Message de confirmation
      setTimeout(() => {
        alert(lang === 'fr' 
          ? "Votre inventaire a bien été envoyé à la réception.\nMerci d'avoir complété l'état des lieux."
          : "Your inventory has been sent to reception.\nThank you for completing the inventory check.");
      }, 200);

      // Redirection automatique vers l'accueil client
      setTimeout(() => {
        navigate(createPageUrl('ClientMenu'));
      }, 1000);
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
            ✔️ {lang === 'fr' ? `Contrôle Inventaire - ${nom} ${prenom}` : `Inventory Check - ${prenom} ${nom}`}
          </h1>

          {/* Barre de progression */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-4">
              <ArriveeProgressBar etapeActuelle={3} lang={lang} />
            </CardContent>
          </Card>

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

              <LazyInventaire
                placeholder={
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF] mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {lang === 'fr' ? 'Chargement de l\'inventaire...' : 'Loading inventory...'}
                    </p>
                  </div>
                }
              >
                {inventaireItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {lang === 'fr' ? 'Inventaire non disponible' : 'Inventory not available'}
                  </div>
                ) : (
                  <>
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
                        {item.quantite && <> <strong>×{item.quantite}</strong></>}
                      </div>
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
                  </>
                )}
              </LazyInventaire>
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

              <LazyInventaire>
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
              </LazyInventaire>
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
            onClick={handlePrepareSubmit}
            disabled={submitting || !evaluationProprete}
            className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading text-lg mt-6"
          >
            <Send className="w-5 h-5 mr-2" />
            {lang === 'fr' ? 'Envoyer à la réception' : 'Send to reception'}
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
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleUploadMissingPhoto(e.target.files[0])}
                    disabled={uploading}
                  />
                  <div className={`w-full inline-flex items-center justify-center rounded-md text-sm font-medium border-2 h-10 px-4 py-2 ${
                    missingItem.photo 
                      ? 'border-green-500 text-green-600 bg-white hover:bg-green-50' 
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {lang === 'fr' ? 'Upload...' : 'Uploading...'}
                      </>
                    ) : missingItem.photo ? (
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
                  </div>
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

        {/* Dialog Récapitulatif */}
        <Dialog open={showRecapDialog} onOpenChange={setShowRecapDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl text-[#0077A8]">
                {lang === 'fr' ? '📋 Récapitulatif avant validation' : '📋 Summary before validation'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Objets validés */}
              <Card className="border-2 border-green-500/30 bg-green-50">
                <CardContent className="p-4">
                  <h3 className="font-heading text-lg text-green-800 mb-2 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {lang === 'fr' ? 'Objets validés' : 'Validated items'} ({objetsValides.length})
                  </h3>
                </CardContent>
              </Card>

              {/* Interventions ménage */}
              {interventionsPreview.menage.length > 0 && (
                <Card className="border-2 border-yellow-500/30 bg-yellow-50">
                  <CardContent className="p-4">
                    <h3 className="font-heading text-lg text-yellow-800 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {lang === 'fr' ? '🧹 Interventions Ménage créées' : '🧹 Housekeeping interventions created'} ({interventionsPreview.menage.length})
                    </h3>
                    <div className="space-y-2">
                      {interventionsPreview.menage.map((interv, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${interv.urgent ? 'bg-red-100 border-2 border-red-400' : 'bg-white'}`}>
                          <div className="flex items-center gap-2">
                            {interv.urgent && <span className="text-red-600 font-bold">🔴 URGENT</span>}
                            {!interv.urgent && <span className="text-yellow-600">🟡 NORMAL</span>}
                            <span className="font-heading">{interv.objet}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{interv.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Interventions technique */}
              {interventionsPreview.technique.length > 0 && (
                <Card className="border-2 border-blue-500/30 bg-blue-50">
                  <CardContent className="p-4">
                    <h3 className="font-heading text-lg text-blue-800 mb-3 flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      {lang === 'fr' ? '🔧 Interventions Technique créées' : '🔧 Technical interventions created'} ({interventionsPreview.technique.length})
                    </h3>
                    <div className="space-y-2">
                      {interventionsPreview.technique.map((interv, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${interv.urgent ? 'bg-red-100 border-2 border-red-400' : 'bg-white'}`}>
                          <div className="flex items-center gap-2">
                            {interv.urgent && <span className="text-red-600 font-bold">🔴 URGENT</span>}
                            {!interv.urgent && <span className="text-blue-600">🟡 NORMAL</span>}
                            <span className="font-heading">{interv.objet}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{interv.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Photos */}
              {Object.keys(photosLieux).length > 0 && (
                <Card className="border-2 border-gray-300">
                  <CardContent className="p-4">
                    <h3 className="font-heading text-lg text-gray-800 mb-2">
                      📸 {lang === 'fr' ? 'Photos jointes' : 'Photos attached'} ({Object.keys(photosLieux).length})
                    </h3>
                  </CardContent>
                </Card>
              )}

              {/* Signature */}
              <Card className="border-2 border-gray-300">
                <CardContent className="p-4">
                  <h3 className="font-heading text-lg text-gray-800 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    ✒️ {lang === 'fr' ? 'Signature effectuée' : 'Signature done'}
                  </h3>
                </CardContent>
              </Card>

              {/* Boutons validation */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRecapDialog(false)}
                  className="flex-1 h-12 border-2"
                  disabled={submitting}
                >
                  {lang === 'fr' ? 'Modifier' : 'Edit'}
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="flex-1 h-12 bg-[#22c55e] hover:bg-[#16a34a] text-white font-heading"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {lang === 'fr' ? 'Envoi...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {lang === 'fr' ? 'Valider et envoyer' : 'Confirm and send'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}