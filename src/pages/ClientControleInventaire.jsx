import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { base44 } from '../api/base44Client';
import { createPageUrl } from '../utils';
import { useTranslation } from '../components/translations';

import Logo from '../components/Logo';
import SignaturePad from '../components/SignaturePad';
import ArriveeProgressBar from '../components/ArriveeProgressBar';
import LazyInventaire from '../components/LazyInventaire';
import { clearInventaireCache } from '../components/inventaireCache';
import { getInventaireParCategorie } from '../components/categoryCodeMapping';

import { uploadCompressedImage } from '../components/imageCompression';
import { notifierInterventionCreee } from '../components/notificationService';

import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog';

import {
  ArrowLeft,
  Camera,
  Check,
  AlertCircle,
  Smile,
  Meh,
  Frown,
  Send,
  Loader2
} from 'lucide-react';

import { toast } from 'sonner';

/* ============================================================
   CLIENT – CONTRÔLE INVENTAIRE ARRIVÉE
============================================================ */
export default function ClientControleInventaire() {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  /* =======================
     DONNÉES SESSION
  ======================= */
  const nom = sessionStorage.getItem('arrivee_nom');
  const prenom = sessionStorage.getItem('arrivee_prenom');
  const dateArrivee = sessionStorage.getItem('arrivee_date_arrivee');
  const dateDepart = sessionStorage.getItem('arrivee_date_depart');
  const categorie = sessionStorage.getItem('arrivee_categorie');
  const numero = sessionStorage.getItem('arrivee_numero');

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
  const [interventionsPreview, setInterventionsPreview] = useState({
    menage: [],
    technique: []
  });

  /* =======================
     OBJETS CRITIQUES
  ======================= */
  const CRITICAL_ITEMS = [
    'tv',
    'refrigerateur',
    'micro_ondes',
    'chauffage',
    'plaque_cuisson',
    'chauffe_eau',
    'wc',
    'douche'
  ];

  /* =======================
     INVENTAIRE
  ======================= */
  const inventaire = getInventaireParCategorie(categorie, lang);
  const items = inventaire?.objets || [];

  /* =======================
     INIT
  ======================= */
  useEffect(() => {
    if (!nom || !categorie) {
      navigate(createPageUrl('ClientArriveeIdentite'));
      return;
    }
    clearInventaireCache();
  }, []);

  useEffect(() => {
    const init = {};
    items.forEach(item => {
      init[item.id] = false;
    });
    setObjetsCoches(init);
  }, [items.length]);

  /* =======================
     HELPERS
  ======================= */
  const toggleObjet = id => {
    setObjetsCoches(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUploadPhoto = async (id, file) => {
    if (!file) return;
    try {
      const result = await uploadCompressedImage(file, compressed =>
        base44.integrations.Core.UploadFile({ file: compressed })
      );
      setPhotosObjets(p => ({ ...p, [id]: result.file_url }));
    } catch {
      toast.error('Erreur upload photo');
    }
  };

  const analyzeInterventions = () => {
    const menage = [];
    const technique = [];

    items.forEach(item => {
      if (objetsCoches[item.id]) {
        const target = CRITICAL_ITEMS.includes(item.id)
          ? technique
          : menage;

        target.push({
          objet: item.label,
          icon: item.icon,
          photo: photosObjets[item.id] || null
        });
      }
    });

    if (evaluationProprete === 'pas_satisfaisant') {
      menage.push({
        objet: lang === 'fr' ? 'Propreté du logement' : 'Cleanliness issue'
      });
    }

    return { menage, technique };
  };

  /* =======================
     VALIDATION
  ======================= */
  const handlePrepareSubmit = () => {
    if (!evaluationProprete) {
      toast.error('Veuillez évaluer la propreté');
      return;
    }

    const hasIssue =
      Object.values(objetsCoches).some(v => v) ||
      evaluationProprete === 'pas_satisfaisant';

    if (hasIssue && !signature) {
      toast.error('Signature obligatoire en cas de problème');
      return;
    }

    setInterventionsPreview(analyzeInterventions());
    setShowRecap(true);
  };

  /* =======================
     ENVOI FINAL
  ======================= */
  const handleFinalSubmit = async () => {
    setSubmitting(true);

    try {
      const { menage, technique } = interventionsPreview;

      const messageClient =
        menage.length && technique.length
          ? 'Votre inventaire a été enregistré. Le ménage et la technique s’en occupent.'
          : menage.length
          ? 'Votre inventaire a été enregistré. Le ménage s’en occupe.'
          : technique.length
          ? 'Votre inventaire a été enregistré. La technique s’en occupe.'
          : 'Votre inventaire a été enregistré.';

      /* FICHE ARRIVÉE */
      const fiche = await base44.entities.FicheArrivee.create({
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        logement: numero,
        inventaire_objets_manquants: Object.keys(objetsCoches).filter(
          k => objetsCoches[k]
        ),
        evaluation_proprete: evaluationProprete,
        commentaire_proprete: commentaireProprete,
        signature_url: signature
      });

      /* SUIVI INVENTAIRE CLIENT */
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

        fiche_arrivee_id: fiche.id,

        pdf_autorise: true,
        nom_camping: 'Camping Paradis',
        logo_camping_url: '/assets/logo-camping.png'
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
    <div className="min-h-screen max-w-2xl mx-auto px-6 py-8">
      <Logo className="h-16 mb-4" />

      <h1 className="text-2xl font-bold text-center mb-6">
        Contrôle inventaire – {nom} {prenom}
      </h1>

      <Card className="mb-6">
        <CardContent>
          <ArriveeProgressBar etapeActuelle={3} lang={lang} />
        </CardContent>
      </Card>

      <LazyInventaire>
        <Card className="mb-6">
          <CardContent className="grid grid-cols-2 gap-3">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => toggleObjet(item.id)}
                className={`p-4 border rounded-lg ${
                  objetsCoches[item.id]
                    ? 'bg-orange-50 border-orange-500'
                    : 'border-gray-300'
                }`}
              >
                <div className="text-3xl mb-1">{item.icon}</div>
                <div className="text-sm font-semibold">{item.label}</div>

                {objetsCoches[item.id] && (
                  <label className="mt-2 block">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e =>
                        handleUploadPhoto(item.id, e.target.files[0])
                      }
                    />
                    <span className="text-xs text-blue-600 cursor-pointer">
                      📸 Ajouter photo
                    </span>
                  </label>
                )}
              </button>
            ))}
          </CardContent>
        </Card>
      </LazyInventaire>

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

          {(evaluationProprete === 'pas_satisfaisant' ||
            evaluationProprete === 'correct') && (
            <Textarea
              className="mt-3"
              placeholder="Commentaire"
              value={commentaireProprete}
              onChange={e => setCommentaireProprete(e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      <SignaturePad onSave={setSignature} disabled={submitting} />

      <Button
        onClick={handlePrepareSubmit}
        className="w-full h-14 mt-6"
      >
        <Send className="mr-2" />
        Envoyer
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