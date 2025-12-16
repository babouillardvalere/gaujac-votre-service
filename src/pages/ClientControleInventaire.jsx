import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import SignaturePad from '../components/SignaturePad';
import ArriveeProgressBar from '../components/ArriveeProgressBar';
import LazyInventaire from '../components/LazyInventaire';
import { clearInventaireCache } from '../components/inventaireCache';
import { getInventaireParCategorie, getCodeFromCategory } from '../components/categoryCodeMapping';
import { uploadCompressedImage } from '../components/imageCompression';
import { notifierInterventionCreee } from '../components/notificationService';
import { createPageUrl } from '../utils';

import {
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui';

import {
  ArrowLeft,
  Camera,
  Check,
  AlertCircle,
  Smile,
  Meh,
  Frown,
  Send,
  Loader2,
  Wrench,
  Sparkles
} from 'lucide-react';

import { toast } from 'sonner';

/* ============================================================
   COMPOSANT
============================================================ */
export default function ClientControleInventaire() {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  /* =======================
     SESSION
  ======================= */
  const nom = sessionStorage.getItem('arrivee_nom');
  const prenom = sessionStorage.getItem('arrivee_prenom');
  const dateArrivee = sessionStorage.getItem('arrivee_date_arrivee');
  const dateDepart = sessionStorage.getItem('arrivee_date_depart');
  const categorie = sessionStorage.getItem('arrivee_categorie');
  const numero = sessionStorage.getItem('arrivee_numero');
  const typeLogement = sessionStorage.getItem('arrivee_type_logement') || 'mobilhome';

  /* =======================
     STATES
  ======================= */
  const [objetsCoches, setObjetsCoches] = useState({});
  const [photosObjets, setPhotosObjets] = useState({});
  const [evaluationProprete, setEvaluationProprete] = useState('');
  const [commentaireProprete, setCommentaireProprete] = useState('');
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [interventionsPreview, setInterventionsPreview] = useState({ menage: [], technique: [] });

  /* =======================
     CRITICAL ITEMS
  ======================= */
  const CRITICAL_ITEMS = [
    'tv', 'refrigerateur', 'micro_ondes', 'chauffage',
    'plaque_cuisson', 'chauffe_eau', 'wc', 'douche'
  ];

  /* =======================
     INVENTAIRE
  ======================= */
  const inventaire = getInventaireParCategorie(categorie, lang);
  const items = inventaire?.objets || [];

  useEffect(() => {
    if (!nom || !categorie) {
      navigate(createPageUrl('ClientArriveeIdentite'));
      return;
    }
    clearInventaireCache();
  }, []);

  useEffect(() => {
    const init = {};
    items.forEach(i => (init[i.id] = false));
    setObjetsCoches(init);
  }, [items.length]);

  /* =======================
     HELPERS
  ======================= */
  const toggleObjet = id => {
    setObjetsCoches(p => ({ ...p, [id]: !p[id] }));
  };

  const analyzeInterventions = () => {
    const menage = [];
    const technique = [];

    items.forEach(item => {
      if (objetsCoches[item.id]) {
        const target = CRITICAL_ITEMS.includes(item.id) ? technique : menage;
        target.push({
          objet: item.label,
          icon: item.icon
        });
      }
    });

    if (evaluationProprete === 'pas_satisfaisant') {
      menage.push({ objet: 'Propreté du logement' });
    }

    return { menage, technique };
  };

  /* =======================
     SUBMIT
  ======================= */
  const handlePrepareSubmit = () => {
    if (!evaluationProprete) {
      toast.error('Veuillez évaluer la propreté');
      return;
    }
    if (
      (Object.values(objetsCoches).includes(true) ||
        evaluationProprete === 'pas_satisfaisant') &&
      !signature
    ) {
      toast.error('Signature obligatoire en cas de problème');
      return;
    }
    setInterventionsPreview(analyzeInterventions());
    setShowRecap(true);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      /* =======================
         MESSAGE CLIENT CLAIR
      ======================= */
      const { menage, technique } = interventionsPreview;

      const messageClient =
        menage.length && technique.length
          ? 'Votre inventaire a été enregistré. Le ménage et la technique s’en occupent.'
          : menage.length
          ? 'Votre inventaire a été enregistré. Le ménage s’en occupe.'
          : technique.length
          ? 'Votre inventaire a été enregistré. La technique s’en occupe.'
          : 'Votre inventaire a été enregistré.';

      /* =======================
         FICHE ARRIVEE
      ======================= */
      const fiche = await base44.entities.FicheArrivee.create({
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        logement: numero,
        inventaire_objets_manquants: Object.keys(objetsCoches).filter(k => objetsCoches[k]),
        evaluation_proprete: evaluationProprete,
        commentaire_proprete: commentaireProprete,
        signature_url: signature
      });

      /* =======================
         SUIVI INVENTAIRE
      ======================= */
      await base44.entities.SuiviInventaire.create({
        client_nom: nom,
        client_prenom: prenom,
        logement: numero,
        type_inventaire: 'ARRIVEE',
        items_menage: menage,
        items_technique: technique,
        statut_menage: menage.length ? 'en_attente' : 'non_requis',
        statut_technique: technique.length ? 'en_attente' : 'non_requis',
        message_client: messageClient,

        /* PDF */
        pdf_autorise: true,
        nom_camping: 'Camping Paradis',
        logo_camping_url: '/assets/logo-camping.png',

        fiche_arrivee_id: fiche.id
      });

      toast.success('Inventaire envoyé avec succès');
      navigate(createPageUrl('ClientResume'));
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de l’envoi');
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="min-h-screen px-6 py-8 max-w-2xl mx-auto">
      <Logo className="h-16 mb-4" />

      <h1 className="text-2xl font-bold text-center mb-6">
        Contrôle inventaire – {nom} {prenom}
      </h1>

      <Card className="mb-6">
        <CardContent>
          <ArriveeProgressBar etapeActuelle={3} lang={lang} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => toggleObjet(item.id)}
              className={`p-4 border rounded ${
                objetsCoches[item.id] ? 'bg-orange-50 border-orange-500' : ''
              }`}
            >
              <div className="text-3xl">{item.icon}</div>
              <div>{item.label}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <h2 className="font-bold mb-2">Propreté</h2>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setEvaluationProprete('pas_satisfaisant')}>
              <Frown />
            </button>
            <button onClick={() => setEvaluationProprete('correct')}>
              <Meh />
            </button>
            <button onClick={() => setEvaluationProprete('tres_propre')}>
              <Smile />
            </button>
          </div>
        </CardContent>
      </Card>

      <SignaturePad onSave={setSignature} disabled={submitting} />

      <Button onClick={handlePrepareSubmit} className="w-full h-14 mt-6">
        <Send className="mr-2" /> Envoyer
      </Button>

      <Dialog open={showRecap} onOpenChange={setShowRecap}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Récapitulatif</DialogTitle>
          </DialogHeader>
          <Button onClick={handleFinalSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : 'Valider'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}