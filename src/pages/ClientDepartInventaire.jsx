import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import SignaturePad from '../components/SignaturePad';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientDepartInventaire() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const ficheArriveeId = sessionStorage.getItem('depart_fiche_arrivee_id');
  const [objetsModifies, setObjetsModifies] = useState([]);
  const [problemeSignale, setProblemeSignale] = useState(null);
  const [proprete, setProprete] = useState('');
  const [commentaireProprete, setCommentaireProprete] = useState('');
  const [photoProprete, setPhotoProprete] = useState('');
  const [signature, setSignature] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);



  const { data: ficheArrivee, isLoading } = useQuery({
    queryKey: ['fiche-arrivee-depart', ficheArriveeId],
    queryFn: async () => {
      if (!ficheArriveeId) return null;
      const fiche = await base44.entities.FicheArrivee.get(ficheArriveeId);
      console.log('📄 Fiche arrivée récupérée pour départ:', fiche);
      return fiche;
    },
    enabled: !!ficheArriveeId
  });

  useEffect(() => {
    if (!ficheArriveeId) {
      navigate(createPageUrl('ClientDepartIdentite'));
    }
  }, [ficheArriveeId, navigate]);

  const toggleObjet = (objet) => {
    if (objetsModifies.includes(objet)) {
      setObjetsModifies(prev => prev.filter(o => o !== objet));
    } else {
      setObjetsModifies(prev => [...prev, objet]);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoProprete(file_url);
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!proprete) {
      toast.error(lang === 'fr' ? 'Évaluez la propreté' : 'Rate cleanliness');
      return;
    }

    if (proprete === 'pas_satisfaisant' && !commentaireProprete) {
      toast.error(lang === 'fr' ? 'Commentaire obligatoire' : 'Comment required');
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

      // Créer DossierDepart
      const dossierDepart = await base44.entities.DossierDepart.create({
        code_dossier: `DEPART-${sessionStorage.getItem('depart_nom')?.toUpperCase()}-${Date.now()}`,
        client_nom: sessionStorage.getItem('depart_nom'),
        client_prenom: sessionStorage.getItem('depart_prenom'),
        date_arrivee: ficheArrivee?.date_arrivee || '',
        date_depart: ficheArrivee?.date_depart || '',
        type_logement: sessionStorage.getItem('depart_type_logement') || 'mobilhome',
        categorie_logement: sessionStorage.getItem('depart_categorie'),
        numero_logement: sessionStorage.getItem('depart_numero'),
        inventaire_json: {
          objets_valides_arrivee: ficheArrivee?.inventaire_objets_valides || [],
          objets_manquants_arrivee: ficheArrivee?.inventaire_objets_manquants || [],
          objets_casses_depart: objetsModifies
        },
        photos: { proprete: photoProprete },
        evaluation_proprete: proprete,
        remarques: commentaireProprete,
        signature: signatureUrl,
        etape_1_terminee: true,
        etape_2_terminee: true,
        etape_3_terminee: true,
        etape_4_terminee: true,
        checklist_termine: true,
        photos_termine: true,
        degats_signales: objetsModifies.length > 0 || proprete === 'pas_satisfaisant',
        statut: 'termine',
        horodatage_creation: new Date().toISOString()
      });



      // Créer FicheDepart d'abord
      const ficheDepart = await base44.entities.FicheDepart.create({
        client_nom: sessionStorage.getItem('depart_nom'),
        client_prenom: sessionStorage.getItem('depart_prenom'),
        date_arrivee: ficheArrivee?.date_arrivee || '',
        date_depart: ficheArrivee?.date_depart || '',
        numero_logement: sessionStorage.getItem('depart_numero'),
        categorie_logement: sessionStorage.getItem('depart_categorie'),
        type_logement: sessionStorage.getItem('depart_type_logement') || 'mobilhome',
        inventaire_objets_etat: [
          ...((ficheArrivee?.inventaire_objets_valides || []).map(o => ({ 
            objet: o, 
            etat: objetsModifies.includes(o) ? 'casse_ou_manquant' : 'ok' 
          }))),
          ...((ficheArrivee?.inventaire_objets_manquants || []).map(o => ({
            objet: typeof o === 'string' ? o : o.objet,
            etat: 'deja_manquant_arrivee'
          })))
        ],
        photos_depart: { proprete: photoProprete },
        evaluation_proprete: proprete,
        remarques_staff: commentaireProprete,
        signature_url: signatureUrl,
        degats_signales: objetsModifies.length > 0 || proprete === 'pas_satisfaisant',
        date_validation: new Date().toISOString()
      });

      // Créer intervention si propreté insatisfaisante ou dégâts
      if (proprete === 'pas_satisfaisant') {
        await base44.entities.Incident.create({
          type: 'menage',
          categorie: 'nettoyage',
          description: `Propreté non satisfaisante au départ - ${commentaireProprete}`,
          urgent: true,
          client_nom: sessionStorage.getItem('depart_nom'),
          client_prenom: sessionStorage.getItem('depart_prenom'),
          date_arrivee: ficheArrivee?.date_arrivee || '',
          date_depart: ficheArrivee?.date_depart || '',
          logement: sessionStorage.getItem('depart_numero'),
          photo_url: photoProprete,
          statut: 'en_attente',
          autorisation_acces: 'oui',
          origine: 'depart',
          fiche_depart_id: ficheDepart.id,
          fiche_arrivee_id: ficheArriveeId
        });
      }

      // Créer intervention pour chaque objet modifié/cassé
      for (const objet of objetsModifies) {
        await base44.entities.Incident.create({
          type: 'technique',
          categorie: 'mobilier',
          description: `Objet cassé/manquant au départ: ${objet}`,
          urgent: false,
          client_nom: sessionStorage.getItem('depart_nom'),
          client_prenom: sessionStorage.getItem('depart_prenom'),
          date_arrivee: ficheArrivee?.date_arrivee || '',
          date_depart: ficheArrivee?.date_depart || '',
          logement: sessionStorage.getItem('depart_numero'),
          statut: 'en_attente',
          autorisation_acces: 'oui',
          origine: 'depart',
          fiche_depart_id: ficheDepart.id,
          fiche_arrivee_id: ficheArriveeId
        });
      }

      toast.success(lang === 'fr' ? '✅ Départ enregistré et remontée en Réception !' : '✅ Departure registered and sent to Reception!');
      
      setTimeout(() => {
        sessionStorage.removeItem('depart_dossier_arrivee_id');
        sessionStorage.removeItem('depart_nom');
        sessionStorage.removeItem('depart_prenom');
        sessionStorage.removeItem('depart_numero');
        navigate(createPageUrl('ClientDepartConfirmation'));
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur envoi' : 'Send error');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFA500]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientDepartIdentite'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-6">
            ✅ {lang === 'fr' ? `Inventaire Départ - ${sessionStorage.getItem('depart_prenom')} ${sessionStorage.getItem('depart_nom')}` : `Departure Inventory - ${sessionStorage.getItem('depart_prenom')} ${sessionStorage.getItem('depart_nom')}`}
          </h1>

          {/* Info pré-remplissage */}
          <Card className="border-2 border-blue-300 bg-blue-50 rounded-xl mb-6">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800 font-body">
                {lang === 'fr'
                  ? '💡 Votre inventaire d\'arrivée est déjà validé. Touchez uniquement les objets qui ont changé.'
                  : '💡 Your arrival inventory is already validated. Touch only items that changed.'}
              </p>
            </CardContent>
          </Card>

          {/* Objets validés à l'arrivée - PRÉREMPLISSAGE */}
          {ficheArrivee?.inventaire_objets_valides && ficheArrivee.inventaire_objets_valides.length > 0 && (
            <Card className="border-2 border-[#22c55e]/30 rounded-xl mb-6">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl text-[#0077A8] mb-2">
                  ✅ {lang === 'fr' ? 'Objets validés à l\'arrivée' : 'Items validated on arrival'}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {lang === 'fr' 
                    ? '👇 Touchez un objet si cassé/manquant maintenant'
                    : '👇 Tap an item if broken/missing now'}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {ficheArrivee.inventaire_objets_valides.map(objetId => {
                    const isModified = objetsModifies.includes(objetId);
                    return (
                      <button
                        key={objetId}
                        onClick={() => toggleObjet(objetId)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          isModified 
                            ? 'bg-red-100 border-red-400' 
                            : 'bg-green-100 border-green-400'
                        }`}
                      >
                        <div className="text-sm font-heading text-[#0077A8] break-words">
                          {objetId}
                        </div>
                        {isModified && (
                          <AlertCircle className="w-4 h-4 text-red-600 mx-auto mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {objetsModifies.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-lg">
                    <p className="text-sm font-heading text-red-800">
                      ⚠️ {objetsModifies.length} {lang === 'fr' ? 'objet(s) signalé(s) cassé(s)/manquant(s)' : 'item(s) reported broken/missing'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Objets manquants dès l'arrivée */}
          {ficheArrivee?.inventaire_objets_manquants && ficheArrivee.inventaire_objets_manquants.length > 0 && (
            <Card className="border-2 border-orange-400 bg-orange-50 rounded-xl mb-6">
              <CardContent className="p-4">
                <h3 className="font-heading text-orange-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {lang === 'fr' ? 'Déjà signalés à l\'arrivée' : 'Already reported on arrival'}
                </h3>
                <div className="text-sm text-orange-700 space-y-1">
                  {ficheArrivee.inventaire_objets_manquants.map((obj, idx) => (
                    <div key={idx}>• {obj.objet || obj}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Propreté */}
          <Card className="border-2 border-gray-300 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                {lang === 'fr' ? 'Comment laissez-vous le locatif ?' : 'How do you leave the accommodation?'}
              </h2>
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setProprete('pas_satisfaisant')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    proprete === 'pas_satisfaisant' ? 'bg-red-100 border-red-400' : 'border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">😠</div>
                  <p className="text-sm font-heading">{lang === 'fr' ? 'Pas satisfaisant' : 'Not satisfactory'}</p>
                </button>
                <button
                  onClick={() => setProprete('correct')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    proprete === 'correct' ? 'bg-yellow-100 border-yellow-400' : 'border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">😐</div>
                  <p className="text-sm font-heading">{lang === 'fr' ? 'Correct' : 'Correct'}</p>
                </button>
                <button
                  onClick={() => setProprete('tres_propre')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    proprete === 'tres_propre' ? 'bg-green-100 border-green-400' : 'border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-2">😊</div>
                  <p className="text-sm font-heading">{lang === 'fr' ? 'Très propre' : 'Very clean'}</p>
                </button>
              </div>

              {proprete === 'pas_satisfaisant' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Textarea
                    value={commentaireProprete}
                    onChange={(e) => setCommentaireProprete(e.target.value)}
                    placeholder={lang === 'fr' ? 'Précisez...' : 'Please specify...'}
                    className="border-2 border-gray-200"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-proprete"
                  />
                  <label htmlFor="photo-proprete">
                    <Button type="button" variant="outline" className="w-full" disabled={uploading}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? (lang === 'fr' ? 'Upload...' : 'Uploading...') : 
                                  (lang === 'fr' ? 'Ajouter photo' : 'Add photo')}
                    </Button>
                  </label>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Signature */}
          <Card className="border-2 border-gray-300 rounded-xl mb-6">
            <CardContent className="p-6">
              <SignaturePad
                onSave={setSignature}
                lang={lang}
              />
            </CardContent>
          </Card>

          {/* Soumettre */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !signature || !proprete}
            className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {lang === 'fr' ? 'Envoi...' : 'Sending...'}
              </>
            ) : (
              lang === 'fr' ? 'Valider mon départ' : 'Validate my departure'
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}