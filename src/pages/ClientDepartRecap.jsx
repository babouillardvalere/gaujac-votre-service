import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { getInventaireParCategorie } from '../components/categoryCodeMapping';
import { getCategorie } from '../components/inventaireCategories';
import Logo from '../components/Logo';
import SignaturePad from '../components/SignaturePad';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Check, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { notifierInterventionCreee } from '../components/notificationService';

export default function ClientDepartRecap() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const nom = sessionStorage.getItem('depart_nom');
  const prenom = sessionStorage.getItem('depart_prenom');
  const dateArrivee = sessionStorage.getItem('depart_date_arrivee');
  const dateDepart = sessionStorage.getItem('depart_date_depart');
  const typeLogement = sessionStorage.getItem('depart_type_logement');
  const categorie = sessionStorage.getItem('depart_categorie');
  const numero = sessionStorage.getItem('depart_numero');
  const idArrivee = sessionStorage.getItem('depart_id_arrivee');

  const objetsOK = JSON.parse(sessionStorage.getItem('depart_objets_ok') || '[]');
  const objetsSignales = JSON.parse(sessionStorage.getItem('depart_objets_signales') || '[]');
  const objetsValidesArrivee = JSON.parse(sessionStorage.getItem('depart_objets_valides') || '[]');
  const objetsNonCochesArrivee = JSON.parse(sessionStorage.getItem('depart_objets_non_coches') || '[]');
  const objetsSignalesArrivee = JSON.parse(sessionStorage.getItem('depart_objets_signales_arrivee') || '[]');
  const photosLieux = JSON.parse(sessionStorage.getItem('depart_photos') || '{}');

  const evaluationProprete = sessionStorage.getItem('depart_proprete_emoji');
  const commentaireProprete = sessionStorage.getItem('depart_proprete_commentaire');
  const remarques = sessionStorage.getItem('depart_remarques');

  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const inventaireLocal = typeLogement === 'mobilhome' && categorie 
    ? getInventaireParCategorie(categorie, lang)
    : null;

  const inventaireItems = typeLogement === 'mobilhome' && inventaireLocal
    ? inventaireLocal.objets
    : typeLogement === 'emplacement' 
      ? [
          { id: 'terrain_propre', icon: '✅', label: lang === 'fr' ? 'Terrain propre' : 'Clean pitch' },
          { id: 'electricite', icon: '⚡', label: lang === 'fr' ? 'Électricité' : 'Electricity' },
        ]
      : [];

  useEffect(() => {
    if (!nom || !categorie) {
      navigate(createPageUrl('ClientDepartIdentification'));
    }
  }, [nom, categorie, navigate]);

  const getObjetDetails = (objetId) => {
    const item = inventaireItems.find(i => i.id === objetId);
    const wasValidatedArrivee = objetsValidesArrivee.includes(objetId);
    const wasMissingArrivee = objetsNonCochesArrivee.includes(objetId) || objetsSignalesArrivee.find(s => s.objet === objetId);
    const isSignaleDepart = objetsSignales.find(s => s.objet === objetId);
    const isOKDepart = objetsOK.includes(objetId);

    return {
      item,
      wasValidatedArrivee,
      wasMissingArrivee,
      isSignaleDepart,
      isOKDepart
    };
  };

  const handleSubmit = async () => {
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

      // Séparer objets cassés et manquants
      const objetsCasses = objetsSignales.filter(s => s.type === 'casse');
      const objetsManquants = objetsSignales.filter(s => s.type === 'manquant');
      const objetsDejaManquants = inventaireItems
        .filter(item => objetsNonCochesArrivee.includes(item.id) || objetsSignalesArrivee.find(s => s.objet === item.id))
        .map(item => item.id);

      // Créer DossierDepart
      const dossierDepart = await base44.entities.DossierDepart.create({
        code_dossier: `DEP-${nom.toUpperCase()}-${Date.now()}`,
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        type_logement: typeLogement,
        categorie_logement: categorie,
        numero_logement: numero,
        inventaire_json: {
          objets_ok: objetsOK,
          objets_casses: objetsCasses.map(o => o.objet),
          objets_manquants: objetsManquants.map(o => o.objet),
          objets_deja_manquants: objetsDejaManquants
        },
        evaluation_proprete: evaluationProprete,
        photos: photosLieux,
        remarques: remarques || commentaireProprete,
        signature: signatureUrl,
        checklist_termine: true,
        photos_termine: true,
        degats_signales: objetsSignales.length > 0 || evaluationProprete === 'pas_satisfaisant',
        statut: 'termine',
        horodatage_creation: new Date().toISOString()
      });

      // Créer FicheDepart
      await base44.entities.FicheDepart.create({
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        numero_logement: numero,
        categorie_logement: categorie,
        type_logement: typeLogement,
        inventaire_objets_etat: objetsSignales.map(s => ({
          objet: s.objet,
          type: s.type,
          commentaire: s.commentaire,
          photo: s.photo
        })),
        photos_depart: photosLieux,
        evaluation_proprete: evaluationProprete,
        remarques_staff: commentaireProprete,
        signature_url: signatureUrl,
        date_validation: new Date().toISOString(),
        degats_signales: objetsSignales.length > 0 || evaluationProprete === 'pas_satisfaisant'
      });

      // Créer interventions TECHNIQUE pour objets cassés/manquants
      for (const signal of objetsSignales) {
        const item = inventaireItems.find(i => i.id === signal.objet);
        const categorieIntervention = getCategorie(signal.objet, item?.label || signal.objet);

        await base44.entities.Incident.create({
          type: categorieIntervention === 'menage' ? 'menage' : 'technique',
          categorie: categorieIntervention === 'menage' ? 'menage' : 'divers_technique',
          sous_categorie: signal.objet,
          description: `${lang === 'fr' ? 'Départ' : 'Departure'} - ${signal.type === 'casse' 
            ? (lang === 'fr' ? 'Objet cassé' : 'Broken item') 
            : (lang === 'fr' ? 'Objet manquant' : 'Missing item')}: ${item?.label || signal.objet}. ${signal.commentaire}`,
          urgent: signal.type === 'casse',
          client_nom: nom,
          client_prenom: prenom,
          date_arrivee: dateArrivee,
          date_depart: dateDepart,
          logement: numero,
          photo_url: signal.photo || '',
          date_saisie: new Date().toISOString(),
          statut: 'en_attente',
          autorisation_acces: 'oui',
          clause_autorisation_acceptee: true,
          origine: 'depart',
          fiche_depart_id: dossierDepart.id
        }).then(incident => notifierInterventionCreee(incident));
      }

      // Créer intervention MÉNAGE si propreté insatisfaisante
      if (evaluationProprete === 'pas_satisfaisant') {
        await base44.entities.Incident.create({
          type: 'menage',
          categorie: 'menage',
          sous_categorie: 'nettoyage',
          description: `${lang === 'fr' ? 'Reprise ménage départ' : 'Departure cleaning required'} - ${categorie} ${numero}. ${commentaireProprete}`,
          urgent: true,
          client_nom: nom,
          client_prenom: prenom,
          date_arrivee: dateArrivee,
          date_depart: dateDepart,
          logement: numero,
          date_saisie: new Date().toISOString(),
          statut: 'en_attente',
          autorisation_acces: 'oui',
          clause_autorisation_acceptee: true,
          origine: 'depart',
          fiche_depart_id: dossierDepart.id
        }).then(incident => notifierInterventionCreee(incident));
      }

      // Nettoyer session
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('depart_')) {
          sessionStorage.removeItem(key);
        }
      });

      toast.success(lang === 'fr' 
        ? '✅ Départ enregistré ! Merci et bon retour !'
        : '✅ Departure registered! Thank you and safe travels!');

      setTimeout(() => {
        navigate(createPageUrl('ClientMenu'));
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur lors de l\'enregistrement' : 'Error saving');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientDepartProprete'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-6">
            📋 {lang === 'fr' ? 'Récapitulatif départ' : 'Departure summary'}
          </h1>

          {/* Infos client */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                👤 {lang === 'fr' ? 'Informations' : 'Information'}
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>{lang === 'fr' ? 'Client' : 'Guest'}:</strong> {nom} {prenom}</p>
                <p><strong>{lang === 'fr' ? 'Dates' : 'Dates'}:</strong> {dateArrivee} → {dateDepart}</p>
                <p><strong>{lang === 'fr' ? 'Logement' : 'Accommodation'}:</strong> {categorie} - {numero}</p>
              </div>
            </CardContent>
          </Card>

          {/* Comparatif inventaire */}
          <Card className="border-2 border-[#22c55e]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                ✔️ {lang === 'fr' ? 'Inventaire comparatif' : 'Comparative inventory'}
              </h2>

              <div className="space-y-2 text-sm">
                {inventaireItems.map(item => {
                  const details = getObjetDetails(item.id);
                  
                  if (details.wasMissingArrivee) {
                    return (
                      <div key={item.id} className="p-3 bg-orange-50 border-2 border-orange-300 rounded-lg">
                        <p className="font-heading text-gray-700">
                          {item.icon} {item.label}
                        </p>
                        <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {lang === 'fr' ? 'Manquant à l\'arrivée (non imputable)' : 'Missing on arrival (not accountable)'}
                        </p>
                      </div>
                    );
                  }

                  if (details.isSignaleDepart) {
                    return (
                      <div key={item.id} className="p-3 bg-red-50 border-2 border-red-400 rounded-lg">
                        <p className="font-heading text-gray-700">
                          {item.icon} {item.label}
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {lang === 'fr' ? 'Présent à l\'arrivée' : 'Present on arrival'}
                        </p>
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <XCircle className="w-3 h-3" />
                          ❗❗ {details.isSignaleDepart.type === 'casse' 
                            ? (lang === 'fr' ? 'Cassé au départ' : 'Broken on departure')
                            : (lang === 'fr' ? 'Manquant au départ' : 'Missing on departure')}
                        </p>
                        {details.isSignaleDepart.commentaire && (
                          <p className="text-xs text-gray-600 mt-1 italic">"{details.isSignaleDepart.commentaire}"</p>
                        )}
                      </div>
                    );
                  }

                  if (details.isOKDepart) {
                    return (
                      <div key={item.id} className="p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                        <p className="font-heading text-gray-700">
                          {item.icon} {item.label}
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {lang === 'fr' ? 'Présent à l\'arrivée' : 'Present on arrival'}
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3" />
                          {lang === 'fr' ? 'Présent au départ' : 'Present on departure'}
                        </p>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </CardContent>
          </Card>

          {/* Propreté */}
          <Card className="border-2 border-[#FFA500]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                🧽 {lang === 'fr' ? 'Propreté' : 'Cleanliness'}
              </h2>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {evaluationProprete === 'tres_propre' ? '😄' : evaluationProprete === 'correct' ? '😐' : '😠'}
                </span>
                <span className="font-heading">
                  {evaluationProprete === 'tres_propre' 
                    ? (lang === 'fr' ? 'Très propre' : 'Very clean')
                    : evaluationProprete === 'correct' 
                      ? (lang === 'fr' ? 'Correct' : 'Okay')
                      : (lang === 'fr' ? 'Pas satisfaisant' : 'Unsatisfactory')}
                </span>
              </div>
              {commentaireProprete && (
                <p className="text-sm text-gray-600 mt-2 italic">"{commentaireProprete}"</p>
              )}
            </CardContent>
          </Card>

          {/* Remarques */}
          {remarques && (
            <Card className="border-2 border-gray-300 rounded-xl mb-6">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                  💬 {lang === 'fr' ? 'Remarques' : 'Comments'}
                </h2>
                <p className="text-sm text-gray-700 italic">"{remarques}"</p>
              </CardContent>
            </Card>
          )}

          {/* Signature */}
          <SignaturePad onSave={setSignature} disabled={submitting} lang={lang} />

          {/* Validation */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !signature}
            className="w-full h-14 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading text-lg mt-6 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {lang === 'fr' ? 'Envoi...' : 'Sending...'}
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                {lang === 'fr' ? 'Valider le départ' : 'Validate departure'}
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}