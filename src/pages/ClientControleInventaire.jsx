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
import { notifierInventaireSoumis, notifierDossierFinalise } from '../components/notificationService';
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

  // État pour tracker les objets MANQUANTS/CASSÉS (cochés = problème signalé)
  const [objetsCocheState, setObjetsCocheState] = useState({});
  const [objetPhotos, setObjetPhotos] = useState({});
  const [objetsMissing, setObjetsMissing] = useState([]);
  const [showMissingDialog, setShowMissingDialog] = useState(false);
  const [missingItem, setMissingItem] = useState({ objet: '', photo: '', commentaire: '' });
  const [uploadingItemId, setUploadingItemId] = useState(null);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Liste des objets critiques nécessitant intervention TECHNIQUE immédiate
  const CRITICAL_ITEMS = [
    'table_jardin', 'chaises_jardin', 'lit_double', 'lits_superposes',
    'cumulus', 'lavabo', 'douche', 'wc', 'micro_ondes', 'refrigerateur',
    'plaques_cuisson', 'hotte', 'detecteur_fumee', 'telecommande_clim',
    'canape', 'cafetiere', 'extincteur', 'banquette', 'feux_gaz',
    'chauffe_eau_gaz', 'chauffage', 'evier', 'tv', 'seche_serviette',
    'seche_cheveux', 'congelateur', 'lave_vaisselle', 'sofa', 'poele',
    'poeles', 'casseroles', 'faitout', 'refrigerateur_congelateur'
  ];
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
  const [autorisationAcces, setAutorisationAcces] = useState('');
  const [plageHoraire, setPlageHoraire] = useState('');

  useEffect(() => {
    if (!nom || !categorie) {
      navigate(createPageUrl('ClientArriveeIdentite'));
      return;
    }
    
    // DEBUG: Vérifier les données occupants dans sessionStorage
    const debugOccupants = {
      adultes: sessionStorage.getItem('arrivee_nb_adultes'),
      ados: sessionStorage.getItem('arrivee_nb_adolescents'),
      enfants: sessionStorage.getItem('arrivee_nb_enfants'),
      bebes: sessionStorage.getItem('arrivee_nb_bebes'),
      chiens: sessionStorage.getItem('arrivee_nombre_chiens'),
      chats: sessionStorage.getItem('arrivee_nombre_chats')
    };
    console.log('🔍 DEBUG sessionStorage occupants:', debugOccupants);
    
    // Si les données occupants sont manquantes, rediriger vers l'étape identité
    if (!sessionStorage.getItem('arrivee_nb_adultes')) {
      console.warn('⚠️ Données occupants manquantes - redirection vers identité');
      navigate(createPageUrl('ClientArriveeIdentite'));
      return;
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
  const inventaireItemsRaw = typeLogement === 'mobilhome' && inventaireLocal
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

  // Déterminer la catégorie d'un item
  const getItemCategory = (itemId) => {
    const vaisselle = ['assiettes_creuses', 'assiettes_dessert', 'assiettes_plates', 'plat', 'bols', 'saladier', 'tasses', 'verres_eau', 'verres_vin', 'verres', 'pichet'];
    const couverts = ['fourchettes', 'cuilleres_soupe', 'cuilleres_cafe', 'couteau_pain', 'couteau_office', 'couteau_decouper', 'couteaux', 'cendrier', 'couvert_salade', 'ciseaux', 'spatule_bois', 'eplucheur', 'louche', 'ecumoire', 'planche_decouper', 'dessous_plat', 'passoire', 'essoreuse_salade', 'tire_bouchon', 'ouvre_boite', 'range_couverts', 'plateau', 'corbeille_pain', 'cloche_micro_onde', 'bac_glacons', 'plat_four_rond', 'plat_four', 'egouttoir'];
    const cuisson = ['casseroles', 'poeles', 'poele', 'faitout', 'couvercle', 'cafetiere', 'micro_ondes', 'refrigerateur', 'congelateur', 'tv', 'telecommande_tv', 'telecommande_clim', 'lave_vaisselle', 'lave_linge', 'seche_linge', 'refrigerateur_congelateur', 'plancha'];
    const menage = ['kit_wc', 'seau', 'bassine', 'balai', 'balai_brosse', 'pelle_balayette', 'serpilliere', 'sechoir_linge', 'pinces_linge', 'poubelle', 'poubelles', 'extincteur', 'detecteur_fumee'];
    const nuit = ['couette_double', 'couettes_doubles', 'couette_simple', 'couettes_simples', 'oreillers', 'cintres', 'table_chevet'];
    const exterieur = ['cle_locatif', 'carte_barriere', 'banc_bois', 'table_jardin', 'chaises_jardin', 'chaises_interieures', 'chaises_interieur', 'tabourets', 'transats', 'terrasse'];
    
    if (vaisselle.includes(itemId)) return 'vaisselle';
    if (couverts.includes(itemId)) return 'couverts';
    if (cuisson.includes(itemId)) return 'cuisson';
    if (menage.includes(itemId)) return 'menage';
    if (nuit.includes(itemId)) return 'nuit';
    if (exterieur.includes(itemId)) return 'exterieur';
    return 'autre';
  };

  // Filtrer les items
  const inventaireItems = inventaireItemsRaw.filter(item => {
    const itemLabel = lang === 'fr' ? item.nom_fr : item.nom_en;
    const matchesSearch = searchTerm === '' || 
      itemLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || getItemCategory(item.id) === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Initialiser l'état des objets cochés quand inventaireItems change
  useEffect(() => {
    if (inventaireItems.length > 0 && Object.keys(objetsCocheState).length === 0) {
      const initialState = {};
      inventaireItems.forEach(item => {
        initialState[item.id] = false; // TOUS à false par défaut
      });
      setObjetsCocheState(initialState);
      console.log('✅ Inventaire initialisé:', Object.keys(initialState).length, 'objets à false');
    }
  }, [inventaireItems.length]);

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
    const newState = !objetsCocheState[objetId];
    setObjetsCocheState(prev => ({
      ...prev,
      [objetId]: newState
    }));

    // Si objet critique coché (= manquant) → notifier immédiatement
    if (newState && CRITICAL_ITEMS.includes(objetId)) {
      const item = inventaireItems.find(i => i.id === objetId);
      toast.warning(
        lang === 'fr' 
          ? `⚠️ Objet critique signalé : ${item?.nom_fr || objetId}` 
          : `⚠️ Critical item reported: ${item?.nom_en || objetId}`,
        { duration: 3000 }
      );
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

  const handleUploadItemPhoto = async (itemId, file) => {
    if (!file) return;
    setUploadingItemId(itemId);
    try {
      const result = await uploadCompressedImage(file, (compressedFile) => 
        base44.integrations.Core.UploadFile({ file: compressedFile })
      );
      setObjetPhotos(prev => ({ ...prev, [itemId]: result.file_url }));
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploadingItemId(null);
    }
  };

  const analyzeAndPrepareInterventions = () => {
    const interventionsMenage = [];
    const interventionsTechnique = [];

    // Analyser objets COCHÉS (= manquants/cassés signalés par client)
    inventaireItems.forEach(item => {
      const isCoche = objetsCocheState[item.id] === true;
      
      if (isCoche) {
        const intervention = {
          objet: lang === 'fr' ? item.nom_fr : item.nom_en,
          description: `${lang === 'fr' ? 'Objet manquant ou cassé signalé à l\'arrivée' : 'Missing or broken item reported on arrival'}: ${lang === 'fr' ? item.nom_fr : item.nom_en}`,
          urgent: CRITICAL_ITEMS.includes(item.id),
          icon: item.icon,
          photo: objetPhotos[item.id] || null
        };

        // Si objet critique → intervention TECHNIQUE urgente
        if (CRITICAL_ITEMS.includes(item.id)) {
          interventionsTechnique.push(intervention);
        } else {
          // Sinon → intervention MÉNAGE standard
          interventionsMenage.push(intervention);
        }
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
    if (!autorisationAcces) {
      toast.error(lang === 'fr' ? 'Veuillez indiquer si vous autorisez l\'accès' : 'Please indicate if you authorize access');
      return;
    }

    if (autorisationAcces === 'non' && !plageHoraire) {
      toast.error(lang === 'fr' ? 'Veuillez sélectionner une plage horaire' : 'Please select a time slot');
      return;
    }

    if (!evaluationProprete) {
      toast.error(lang === 'fr' ? 'Veuillez évaluer la propreté' : 'Please evaluate cleanliness');
      return;
    }

    if (evaluationProprete === 'pas_satisfaisant' && !commentaireProprete) {
      toast.error(lang === 'fr' ? 'Commentaire obligatoire si propreté insatisfaisante' : 'Comment required if cleanliness unsatisfactory');
      return;
    }

    // Compter les objets signalés (cochés = problème)
    const objetsSignalesCount = Object.values(objetsCocheState).filter(v => v === true).length;
    const hasProblems = objetsSignalesCount > 0 || 
                        objetsMissing.length > 0 || 
                        evaluationProprete === 'pas_satisfaisant';
    
    if (hasProblems && !signature) {
      toast.error(lang === 'fr' ? 'Signature requise en cas de problème signalé' : 'Signature required if issues reported');
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
      // Upload signature (optionnelle si pas de problème)
      let signatureUrl = '';
      if (signature) {
        const blob = await fetch(signature).then(r => r.blob());
        const signatureFile = new File([blob], 'signature.png', { type: 'image/png' });
        const result = await base44.integrations.Core.UploadFile({ file: signatureFile });
        signatureUrl = result.file_url;
      }

      const dossierId = sessionStorage.getItem('arrivee_dossier_id');

      // NOUVELLE LOGIQUE : objets cochés = MANQUANTS/CASSÉS
      const objetsSignalesIds = Object.keys(objetsCocheState).filter(id => objetsCocheState[id] === true);
      const objetsOkIds = Object.keys(objetsCocheState).filter(id => objetsCocheState[id] === false);
      
      // Préparer les objets OK (non cochés = RAS)
      const objetsValidesAvecDetails = objetsOkIds.map(id => {
        const item = inventaireItems.find(i => i.id === id);
        return item ? (lang === 'fr' ? item.nom_fr : item.nom_en) : id;
      });
      
      // Préparer les objets manquants (cochés par le client)
      const objetsManquantsAuto = objetsSignalesIds.map(id => {
        const item = inventaireItems.find(i => i.id === id);
        return {
          objet: item ? (lang === 'fr' ? item.nom_fr : item.nom_en) : id,
          commentaire: lang === 'fr' ? 'Signalé manquant ou cassé par le client' : 'Reported missing or broken by client',
          photo: '',
          critique: CRITICAL_ITEMS.includes(id)
        };
      });
      
      console.log('📊 Inventaire:', {
        objetsSignalesCount: objetsSignalesIds.length,
        objetsOkCount: objetsOkIds.length,
        objetsManuels: objetsMissing.length,
        total: inventaireItems.length
      });

      // Récupérer les occupants depuis sessionStorage
      const nombreAdultes = sessionStorage.getItem('arrivee_nb_adultes') || '0';
      const nombreAdos = sessionStorage.getItem('arrivee_nb_adolescents') || '0';
      const nombreEnfants = sessionStorage.getItem('arrivee_nb_enfants') || '0';
      const nombreBebes = sessionStorage.getItem('arrivee_nb_bebes') || '0';
      const nombreChiens = sessionStorage.getItem('arrivee_nombre_chiens') || '0';
      const nombreChats = sessionStorage.getItem('arrivee_nombre_chats') || '0';
      const nombreAnimaux = (parseInt(nombreChiens) + parseInt(nombreChats)).toString();

      console.log('📊 Données occupants (STRING):', {
        nombreAdultes,
        nombreAdos,
        nombreEnfants,
        nombreBebes,
        nombreAnimaux
      });

      // Créer la FicheArrivee pour la réception EN PREMIER
      const ficheArrivee = await base44.entities.FicheArrivee.create({
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        numero_logement: numero,
        categorie_logement: categorie,
        type_logement: typeLogement,
        nombre_adultes: parseInt(nombreAdultes),
        nombre_adolescents: parseInt(nombreAdos),
        nombre_enfants: parseInt(nombreEnfants),
        nombre_bebes: parseInt(nombreBebes),
        nombre_animaux: parseInt(nombreAnimaux),
        inventaire_objets_valides: objetsValidesAvecDetails,
        inventaire_objets_manquants: [...objetsManquantsAuto, ...objetsMissing],
        evaluation_proprete: evaluationProprete,
        commentaire_proprete: commentaireProprete,
        photos_pieces: photosLieux,
        remarques_client: remarques,
        signature_url: signatureUrl,
        date_validation: new Date().toISOString()
      });

      // Préparer les items pour le suivi
      const itemsMenage = interventionsPreview.menage.map(interv => ({
        key: interv.objet.toLowerCase().replace(/\s+/g, '_'),
        label: interv.objet,
        quantity: 1,
        motif: 'manquant'
      }));

      const itemsTechnique = interventionsPreview.technique.map(interv => ({
        key: interv.objet.toLowerCase().replace(/\s+/g, '_'),
        label: interv.objet,
        quantity: 1,
        motif: interv.urgent ? 'cassé' : 'manquant'
      }));

      let tacheMenageId = null;
      let tacheTechniqueId = null;

      // Créer UNE SEULE TÂCHE MÉNAGE regroupant tous les objets
      if (interventionsPreview.menage.length > 0) {
        const objetsList = interventionsPreview.menage
          .map(interv => `• ${interv.objet}`)
          .join('\n');

        const descriptionMenage = lang === 'fr'
          ? `📋 INVENTAIRE ARRIVÉE - Objets manquants (ménage)\n\n` +
            `🏠 Logement: ${numero} (${categorie})\n` +
            `👤 Client: ${nom} ${prenom}\n` +
            `📅 Arrivée: ${dateArrivee} | Départ: ${dateDepart}\n\n` +
            `📝 Objets signalés:\n${objetsList}\n\n` +
            `🔐 Autorisation d'accès: ${autorisationAcces === 'oui' ? 'OUI' : 'NON - ' + plageHoraire}\n` +
            `⏰ Généré le: ${new Date().toLocaleString('fr-FR')}`
          : `📋 ARRIVAL INVENTORY - Missing items (housekeeping)\n\n` +
            `🏠 Accommodation: ${numero} (${categorie})\n` +
            `👤 Guest: ${prenom} ${nom}\n` +
            `📅 Arrival: ${dateArrivee} | Departure: ${dateDepart}\n\n` +
            `📝 Items reported:\n${objetsList}\n\n` +
            `🔐 Access authorization: ${autorisationAcces === 'oui' ? 'YES' : 'NO - ' + plageHoraire}\n` +
            `⏰ Generated on: ${new Date().toLocaleString('en-GB')}`;

        const tacheMenage = await base44.entities.Tache.create({
          titre: lang === 'fr' 
            ? `🧹 Inventaire Arrivée - ${numero} - ${nom}` 
            : `🧹 Arrival Inventory - ${numero} - ${nom}`,
          description: descriptionMenage,
          categorie: 'menage',
          priorite: 'normale',
          statut: 'a_faire',
          hebergement: numero,
          assignee: 'Service Ménage',
          assignee_email: 'menage@campingparadis.com',
          date_echeance: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        tacheMenageId = tacheMenage.id;
      }

      // Créer UNE SEULE TÂCHE TECHNIQUE regroupant tous les objets critiques
      if (interventionsPreview.technique.length > 0) {
        const objetsList = interventionsPreview.technique
          .map(interv => `• ${interv.objet}${interv.urgent ? ' 🚨 URGENT' : ''}`)
          .join('\n');

        const descriptionTechnique = lang === 'fr'
          ? `🔧 INVENTAIRE ARRIVÉE - Objets cassés/défectueux (technique)\n\n` +
            `🏠 Logement: ${numero} (${categorie})\n` +
            `👤 Client: ${nom} ${prenom}\n` +
            `📅 Arrivée: ${dateArrivee} | Départ: ${dateDepart}\n\n` +
            `⚠️ Objets critiques signalés:\n${objetsList}\n\n` +
            `🔐 Autorisation d'accès: ${autorisationAcces === 'oui' ? 'OUI' : 'NON - ' + plageHoraire}\n` +
            `⏰ Généré le: ${new Date().toLocaleString('fr-FR')}`
          : `🔧 ARRIVAL INVENTORY - Broken/defective items (technical)\n\n` +
            `🏠 Accommodation: ${numero} (${categorie})\n` +
            `👤 Guest: ${prenom} ${nom}\n` +
            `📅 Arrival: ${dateArrivee} | Departure: ${dateDepart}\n\n` +
            `⚠️ Critical items reported:\n${objetsList}\n\n` +
            `🔐 Access authorization: ${autorisationAcces === 'oui' ? 'YES' : 'NO - ' + plageHoraire}\n` +
            `⏰ Generated on: ${new Date().toLocaleString('en-GB')}`;

        const tacheTechnique = await base44.entities.Tache.create({
          titre: lang === 'fr' 
            ? `🔧 Inventaire Arrivée - ${numero} - ${nom}` 
            : `🔧 Arrival Inventory - ${numero} - ${nom}`,
          description: descriptionTechnique,
          categorie: 'technique',
          priorite: interventionsPreview.technique.some(i => i.urgent) ? 'urgente' : 'haute',
          statut: 'a_faire',
          hebergement: numero,
          assignee: 'Service Technique',
          assignee_email: 'technique@campingparadis.com',
          date_echeance: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        });
        tacheTechniqueId = tacheTechnique.id;
      }

      // Créer le SUIVI INVENTAIRE pour le client
      if (itemsMenage.length > 0 || itemsTechnique.length > 0) {
        const messageClient = lang === 'fr'
          ? `Votre inventaire a été enregistré. Les objets signalés sont en cours de traitement par nos équipes.`
          : `Your inventory has been registered. Reported items are being processed by our teams.`;

        await base44.entities.SuiviInventaire.create({
          client_nom: nom,
          client_prenom: prenom,
          client_email: created_by, // Email de l'utilisateur connecté
          logement: numero,
          categorie_logement: categorie,
          type_inventaire: 'ARRIVEE',
          date_arrivee: dateArrivee,
          date_depart: dateDepart,
          items_menage: itemsMenage,
          items_technique: itemsTechnique,
          statut_menage: itemsMenage.length > 0 ? 'en_attente' : 'non_requis',
          statut_technique: itemsTechnique.length > 0 ? 'en_attente' : 'non_requis',
          tache_menage_id: tacheMenageId,
          tache_technique_id: tacheTechniqueId,
          message_client: messageClient,
          date_derniere_maj: new Date().toISOString(),
          fiche_arrivee_id: ficheArrivee.id
        });
      }

      // Mettre à jour le dossier d'arrivée
      if (dossierId) {
        await base44.entities.DossierArrivee.update(dossierId, {
          etape_3_terminee: true,
          etape_4_terminee: true,
          etape_actuelle: 4,
          inventaire_json: { 
            objets_valides: objetsOkIds,
            objets_manquants: [...objetsSignalesIds, ...objetsMissing.map(o => o.objet)]
          },
          photos: photosLieux,
          evaluation_proprete: evaluationProprete,
          remarques: commentaireProprete || remarques,
          signature: signatureUrl,
          inventaire_termine: true,
          statut: 'termine',
          nombre_adultes: parseInt(nombreAdultes),
          nombre_adolescents: parseInt(nombreAdos),
          nombre_enfants: parseInt(nombreEnfants),
          nombre_bebes: parseInt(nombreBebes),
          nombre_animaux: parseInt(nombreAnimaux)
        });
      }

      // Sauvegarder l'ID de la fiche pour le résumé
      sessionStorage.setItem('fiche_arrivee_id', ficheArrivee.id);

      // Message de confirmation
      alert(lang === 'fr' 
        ? "Votre contrôle inventaire a bien été envoyé à la réception.\nMerci !"
        : "Your inventory has been sent to reception.\nThank you!");

      // Redirection vers le résumé
      navigate(createPageUrl('ClientResume'));

    } catch (error) {
      console.error('ERREUR ENVOI INVENTAIRE:', error);
      alert(lang === 'fr' 
        ? "Une erreur est survenue lors de l'envoi. Merci de réessayer."
        : "An error occurred during submission. Please try again.");
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
                <p><strong>{lang === 'fr' ? 'Occupants' : 'Occupants'}:</strong> {sessionStorage.getItem('arrivee_nb_adultes') || '0'} adultes, {sessionStorage.getItem('arrivee_nb_adolescents') || '0'} ados, {sessionStorage.getItem('arrivee_nb_enfants') || '0'} enfants, {sessionStorage.getItem('arrivee_nb_bebes') || '0'} bébés, {(parseInt(sessionStorage.getItem('arrivee_nombre_chiens') || '0') + parseInt(sessionStorage.getItem('arrivee_nombre_chats') || '0'))} animaux</p>
              </div>
            </CardContent>
          </Card>

          {/* Bloc 2 - Contrôle objets */}
          <Card className="border-2 border-[#22c55e]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-2">
                ⚠️ {lang === 'fr' ? 'Cochez UNIQUEMENT les objets manquants ou cassés' : 'Check ONLY missing or broken items'}
              </h2>
              <p className="text-sm text-red-600 font-semibold mb-4">
                ✔️ {lang === 'fr' 
                  ? 'Icône cochée = objet MANQUANT ou ABÎMÉ signalé' 
                  : 'Checked icon = MISSING or DAMAGED item reported'}
              </p>

              {/* Filtres */}
              <div className="mb-4 space-y-3">
                <Input
                  placeholder={lang === 'fr' ? '🔍 Rechercher un objet...' : '🔍 Search item...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-2"
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                    className="text-xs"
                  >
                    {lang === 'fr' ? 'Tout' : 'All'}
                  </Button>
                  <Button
                    variant={selectedCategory === 'vaisselle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('vaisselle')}
                    className="text-xs"
                  >
                    🍽️ {lang === 'fr' ? 'Vaisselle' : 'Dishes'}
                  </Button>
                  <Button
                    variant={selectedCategory === 'couverts' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('couverts')}
                    className="text-xs"
                  >
                    🍴 {lang === 'fr' ? 'Couverts' : 'Cutlery'}
                  </Button>
                  <Button
                    variant={selectedCategory === 'cuisson' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('cuisson')}
                    className="text-xs"
                  >
                    🍳 {lang === 'fr' ? 'Cuisson' : 'Cooking'}
                  </Button>
                  <Button
                    variant={selectedCategory === 'menage' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('menage')}
                    className="text-xs"
                  >
                    🧹 {lang === 'fr' ? 'Ménage' : 'Cleaning'}
                  </Button>
                  <Button
                    variant={selectedCategory === 'nuit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('nuit')}
                    className="text-xs"
                  >
                    🛏️ {lang === 'fr' ? 'Nuit' : 'Bedding'}
                  </Button>
                  <Button
                    variant={selectedCategory === 'exterieur' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('exterieur')}
                    className="text-xs"
                  >
                    🌳 {lang === 'fr' ? 'Extérieur' : 'Outdoor'}
                  </Button>
                </div>

                {(searchTerm || selectedCategory !== 'all') && (
                  <p className="text-xs text-gray-500">
                    {inventaireItems.length} {lang === 'fr' ? 'objet(s) affiché(s)' : 'item(s) displayed'}
                  </p>
                )}
              </div>

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
                    const isCoche = objetsCocheState[item.id] === true;
                    const hasPhoto = objetPhotos[item.id];
                    const isUploading = uploadingItemId === item.id;

                    return (
                    <div key={item.id} className="relative">
                     <button
                       onClick={() => toggleObjet(item.id)}
                       className={`w-full p-4 rounded-lg border-2 transition-all ${
                         isCoche 
                           ? 'border-red-500 bg-red-50' 
                           : 'border-gray-300 bg-white hover:border-[#00AEEF]'
                       }`}
                     >
                       <div className="text-3xl mb-2">{item.icon}</div>
                       <div className="text-sm font-heading text-[#0077A8]">
                         {lang === 'fr' ? item.nom_fr : item.nom_en}
                         {item.quantite && <> <strong>×{item.quantite}</strong></>}
                       </div>
                       {isCoche && (
                         <AlertCircle className="w-5 h-5 text-red-600 mx-auto mt-2" />
                       )}
                     </button>

                     {isCoche && (
                       <label 
                         className="absolute bottom-2 right-2 cursor-pointer"
                         onClick={(e) => e.stopPropagation()}
                       >
                         <input
                           type="file"
                           accept="image/*"
                           capture="environment"
                           className="hidden"
                           onChange={(e) => handleUploadItemPhoto(item.id, e.target.files[0])}
                           disabled={isUploading}
                         />
                         <div className={`p-1.5 rounded-full ${
                           hasPhoto 
                             ? 'bg-green-500 hover:bg-green-600' 
                             : 'bg-orange-500 hover:bg-orange-600'
                         } ${isUploading ? 'opacity-50' : ''}`}>
                           {isUploading ? (
                             <Loader2 className="w-4 h-4 text-white animate-spin" />
                           ) : hasPhoto ? (
                             <Check className="w-4 h-4 text-white" />
                           ) : (
                             <Camera className="w-4 h-4 text-white" />
                           )}
                         </div>
                       </label>
                     )}
                    </div>
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

          {/* Bloc 3 - Autorisation d'accès */}
          <Card className="border-2 border-purple-300 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-2">
                🔐 {lang === 'fr' ? 'Autorisation d\'accès' : 'Access authorization'} *
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {lang === 'fr' 
                  ? 'Autorisez-vous notre intervenant à entrer dans votre hébergement / emplacement en votre absence ?' 
                  : 'Do you authorize our staff to enter your accommodation / pitch in your absence?'}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => {
                    setAutorisationAcces('oui');
                    setPlageHoraire('');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    autorisationAcces === 'oui'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <div className="text-3xl mb-2">✔</div>
                  <div className="font-heading text-sm">
                    {lang === 'fr' ? 'Oui' : 'Yes'}
                  </div>
                </button>

                <button
                  onClick={() => setAutorisationAcces('non')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    autorisationAcces === 'non'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                >
                  <div className="text-3xl mb-2">✖</div>
                  <div className="font-heading text-sm">
                    {lang === 'fr' ? 'Non' : 'No'}
                  </div>
                </button>
              </div>

              {autorisationAcces === 'non' && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                  <p className="text-sm text-gray-700 mb-3">
                    ⏰ {lang === 'fr' 
                      ? 'Quand souhaitez-vous que notre équipe intervienne ?' 
                      : 'When would you like our team to intervene?'}
                  </p>
                  <Select value={plageHoraire} onValueChange={setPlageHoraire}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder={lang === 'fr' ? 'Choisir une plage horaire' : 'Choose a time slot'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8h-12h">8h–12h</SelectItem>
                      <SelectItem value="12h-14h">12h–14h</SelectItem>
                      <SelectItem value="14h-18h">14h–18h</SelectItem>
                      <SelectItem value="18h-20h">18h–20h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bloc 4 - Photos facultatives */}
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

          {/* Bloc 5 - Propreté */}
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

          {/* Bloc 6 - Remarques */}
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

          {/* Bloc 7 - Signature */}
          <SignaturePad onSave={setSignature} disabled={submitting} lang={lang} />

          {/* Bloc 8 - Validation */}
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
              {/* Objets OK (non cochés) */}
              <Card className="border-2 border-green-500/30 bg-green-50">
                <CardContent className="p-4">
                  <h3 className="font-heading text-lg text-green-800 mb-2 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {lang === 'fr' ? 'Objets OK (non signalés)' : 'OK items (not reported)'} ({Object.values(objetsCocheState).filter(v => v === false).length})
                  </h3>
                </CardContent>
              </Card>

              {/* Interventions ménage (objets non critiques signalés) */}
              {interventionsPreview.menage.length > 0 && (
                <Card className="border-2 border-yellow-500/30 bg-yellow-50">
                  <CardContent className="p-4">
                    <h3 className="font-heading text-lg text-yellow-800 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {lang === 'fr' ? '🧹 Objets manquants - Ménage' : '🧹 Missing items - Housekeeping'} ({interventionsPreview.menage.length})
                    </h3>
                    <div className="space-y-2">
                      {interventionsPreview.menage.map((interv, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-white">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-600">🟡</span>
                            <span className="font-heading">{interv.objet}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{interv.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Interventions technique URGENTES (objets critiques signalés) */}
              {interventionsPreview.technique.length > 0 && (
                <Card className="border-2 border-red-500/30 bg-red-50">
                  <CardContent className="p-4">
                    <h3 className="font-heading text-lg text-red-800 mb-3 flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      {lang === 'fr' ? '🔧 Objets CRITIQUES - Technique URGENTE' : '🔧 CRITICAL items - URGENT Technical'} ({interventionsPreview.technique.length})
                    </h3>
                    <div className="space-y-2">
                      {interventionsPreview.technique.map((interv, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-red-100 border-2 border-red-400">
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-bold">🚨 CRITIQUE</span>
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