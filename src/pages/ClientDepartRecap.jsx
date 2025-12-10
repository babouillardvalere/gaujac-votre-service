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

      // Liste des objets techniques critiques
      const CRITICAL_ITEMS = [
        'table_jardin', 'chaises_jardin', 'lit_double', 'lits_superposes',
        'cumulus', 'lavabo', 'douche', 'wc', 'micro_ondes', 'refrigerateur',
        'plaques_cuisson', 'hotte', 'detecteur_fumee', 'telecommande_clim',
        'canape', 'cafetiere', 'extincteur', 'banquette', 'feux_gaz',
        'chauffe_eau_gaz', 'chauffage', 'evier', 'tv', 'seche_serviette',
        'seche_cheveux', 'congelateur', 'lave_vaisselle', 'sofa', 'poele',
        'poeles', 'casseroles', 'faitout', 'refrigerateur_congelateur'
      ];

      // Séparer objets par catégorie
      const objetsMenage = objetsSignales.filter(s => !CRITICAL_ITEMS.includes(s.objet));
      const objetsTechnique = objetsSignales.filter(s => CRITICAL_ITEMS.includes(s.objet));

            // Préparer les items pour le suivi
            const itemsMenage = objetsMenage.map(s => {
              const item = inventaireItems.find(i => i.id === s.objet);
              return {
                key: s.objet,
                label: item?.label || s.objet,
                quantity: 1,
                motif: s.type === 'casse' ? 'cassé' : 'manquant'
              };
            });

            // Ajouter propreté si insatisfaisante
            if (evaluationProprete === 'pas_satisfaisant') {
              itemsMenage.push({
                key: 'proprete_generale',
                label: lang === 'fr' ? 'Propreté générale' : 'General cleanliness',
                quantity: 1,
                motif: 'insatisfaisant'
              });
            }

            const itemsTechnique = objetsTechnique.map(s => {
              const item = inventaireItems.find(i => i.id === s.objet);
              return {
                key: s.objet,
                label: item?.label || s.objet,
                quantity: 1,
                motif: s.type === 'casse' ? 'cassé' : 'manquant'
              };
            });

            let tacheMenageId = null;
            let tacheTechniqueId = null;

            // Créer UNE SEULE TÂCHE MÉNAGE si objets ménage + propreté insatisfaisante
            if (itemsMenage.length > 0) {
              const objetsList = objetsMenage
                .map(s => {
                  const item = inventaireItems.find(i => i.id === s.objet);
                  return `• ${item?.label || s.objet} (${s.type === 'casse' ? (lang === 'fr' ? 'cassé' : 'broken') : (lang === 'fr' ? 'manquant' : 'missing')})`;
                })
                .join('\n');
              
              const descriptionMenage = lang === 'fr'
                ? `🧹 INVENTAIRE DÉPART - Objets manquants/cassés (ménage)\n\n` +
                  `🏠 Logement: ${numero} (${categorie})\n` +
                  `👤 Client: ${nom} ${prenom}\n` +
                  `📅 Arrivée: ${dateArrivee} | Départ: ${dateDepart}\n\n` +
                  `${objetsMenage.length > 0 ? `📝 Objets signalés:\n${objetsList}\n\n` : ''}` +
                  `${evaluationProprete === 'pas_satisfaisant' ? `🧽 Propreté insatisfaisante\n${commentaireProprete || ''}\n\n` : ''}` +
                  `⏰ Généré le: ${new Date().toLocaleString('fr-FR')}`
                : `🧹 DEPARTURE INVENTORY - Missing/broken items (housekeeping)\n\n` +
                  `🏠 Accommodation: ${numero} (${categorie})\n` +
                  `👤 Guest: ${prenom} ${nom}\n` +
                  `📅 Arrival: ${dateArrivee} | Departure: ${dateDepart}\n\n` +
                  `${objetsMenage.length > 0 ? `📝 Items reported:\n${objetsList}\n\n` : ''}` +
                  `${evaluationProprete === 'pas_satisfaisant' ? `🧽 Unsatisfactory cleanliness\n${commentaireProprete || ''}\n\n` : ''}` +
                  `⏰ Generated on: ${new Date().toLocaleString('en-GB')}`;

              const tacheMenage = await base44.entities.Tache.create({
                titre: lang === 'fr' 
                  ? `🧹 Inventaire Départ - ${numero} - ${nom}` 
                  : `🧹 Departure Inventory - ${numero} - ${nom}`,
                description: descriptionMenage,
                categorie: 'menage',
                priorite: evaluationProprete === 'pas_satisfaisant' ? 'haute' : 'normale',
                statut: 'a_faire',
                hebergement: numero,
                assignee: 'Service Ménage',
                assignee_email: 'menage@campingparadis.com',
                date_echeance: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              });
              tacheMenageId = tacheMenage.id;
            }

            // Créer UNE SEULE TÂCHE TECHNIQUE si objets critiques cassés/manquants
            if (itemsTechnique.length > 0) {
              const objetsList = objetsTechnique
                .map(s => {
                  const item = inventaireItems.find(i => i.id === s.objet);
                  return `• ${item?.label || s.objet} (${s.type === 'casse' ? (lang === 'fr' ? 'cassé' : 'broken') : (lang === 'fr' ? 'manquant' : 'missing')})${s.type === 'casse' ? ' 🚨' : ''}`;
                })
                .join('\n');
              
              const descriptionTechnique = lang === 'fr'
                ? `🔧 INVENTAIRE DÉPART - Objets cassés/manquants (technique)\n\n` +
                  `🏠 Logement: ${numero} (${categorie})\n` +
                  `👤 Client: ${nom} ${prenom}\n` +
                  `📅 Arrivée: ${dateArrivee} | Départ: ${dateDepart}\n\n` +
                  `⚠️ Objets critiques signalés:\n${objetsList}\n\n` +
                  `⏰ Généré le: ${new Date().toLocaleString('fr-FR')}`
                : `🔧 DEPARTURE INVENTORY - Broken/missing items (technical)\n\n` +
                  `🏠 Accommodation: ${numero} (${categorie})\n` +
                  `👤 Guest: ${prenom} ${nom}\n` +
                  `📅 Arrival: ${dateArrivee} | Departure: ${dateDepart}\n\n` +
                  `⚠️ Critical items reported:\n${objetsList}\n\n` +
                  `⏰ Generated on: ${new Date().toLocaleString('en-GB')}`;

              const tacheTechnique = await base44.entities.Tache.create({
                titre: lang === 'fr' 
                  ? `🔧 Inventaire Départ - ${numero} - ${nom}` 
                  : `🔧 Departure Inventory - ${numero} - ${nom}`,
                description: descriptionTechnique,
                categorie: 'technique',
                priorite: objetsTechnique.some(s => s.type === 'casse') ? 'urgente' : 'haute',
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
                ? `Votre inventaire de départ a été enregistré. Les objets signalés sont en cours de traitement par nos équipes.`
                : `Your departure inventory has been registered. Reported items are being processed by our teams.`;

              await base44.entities.SuiviInventaire.create({
                client_nom: nom,
                client_prenom: prenom,
                client_email: created_by, // Email de l'utilisateur connecté
                logement: numero,
                categorie_logement: categorie,
                type_inventaire: 'DEPART',
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
                fiche_depart_id: dossierDepart.id
              });
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

      // Message de confirmation
      setTimeout(() => {
        alert(lang === 'fr' 
          ? "Votre inventaire de départ a bien été envoyé à la réception.\nMerci d'avoir complété l'état des lieux."
          : "Your departure inventory has been sent to reception.\nThank you for completing the inventory check.");
      }, 200);

      // Redirection automatique vers l'accueil client
      setTimeout(() => {
        navigate(createPageUrl('ClientMenu'));
      }, 1000);

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