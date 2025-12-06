import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { genererPDFArrivee } from './genererPDFArrivee';
import { getInventaireParCategorie } from '../categoryCodeMapping';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Mail, Users, Dog, Calendar, Home, CheckCircle, XCircle, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ReceptionFicheArrivee({ dossier, onClose, lang = 'fr' }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  const { data: inventaire } = useQuery({
    queryKey: ['inventaire-arrivee', dossier.inventaire_id],
    queryFn: async () => {
      if (!dossier.inventaire_id) return null;
      const inventaires = await base44.entities.ControleInventaireArrivee.list();
      return inventaires.find(inv => inv.id === dossier.inventaire_id);
    },
    enabled: !!dossier.inventaire_id
  });

  const { data: interventions = [] } = useQuery({
    queryKey: ['interventions-arrivee', dossier.id],
    queryFn: async () => {
      const allInterventions = await base44.entities.Incident.list();
      const menageIds = dossier.interventions_menage || [];
      const techniqueIds = dossier.interventions_technique || [];
      const ids = [...menageIds, ...techniqueIds];
      return allInterventions.filter(i => ids.includes(i.id));
    },
    enabled: !!(dossier.interventions_menage?.length || dossier.interventions_technique?.length)
  });

  const handleGenererPDF = async () => {
    try {
      toast.info(lang === 'fr' ? 'Génération du PDF...' : 'Generating PDF...');
      const pdf = await genererPDFArrivee(dossier, inventaire, interventions, lang);
      pdf.save(`Arrivee_${dossier.client_nom}_${dossier.numero_logement}_${dossier.date_arrivee}.pdf`);
      toast.success(lang === 'fr' ? 'PDF généré avec succès' : 'PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de la génération du PDF' : 'Error generating PDF');
    }
  };

  const handleEnvoyerEmail = async () => {
    try {
      toast.info(lang === 'fr' ? 'Préparation de l\'email...' : 'Preparing email...');
      
      // Générer le PDF
      const pdf = await genererPDFArrivee(dossier, inventaire, interventions, lang);
      const pdfBlob = pdf.output('blob');
      
      // Upload le PDF
      const formData = new FormData();
      formData.append('file', pdfBlob, `Arrivee_${dossier.client_nom}_${dossier.numero_logement}.pdf`);
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfBlob });
      
      // Envoyer l'email (nécessite l'email du client - à adapter selon votre structure)
      const emailBody = lang === 'fr' 
        ? `Bonjour ${dossier.client_prenom} ${dossier.client_nom},\n\nVeuillez trouver ci-joint votre fiche d'arrivée.\n\nCordialement,\nL'équipe Camping Paradis`
        : `Hello ${dossier.client_prenom} ${dossier.client_nom},\n\nPlease find attached your arrival form.\n\nBest regards,\nCamping Paradis Team`;
      
      // Note: Vous devrez adapter selon que vous avez l'email du client
      toast.success(lang === 'fr' ? 'PDF prêt à être envoyé' : 'PDF ready to send');
      
      // Ouvrir le client email avec le lien
      window.open(`mailto:?subject=${encodeURIComponent(lang === 'fr' ? 'Votre fiche d\'arrivée' : 'Your arrival form')}&body=${encodeURIComponent(emailBody + '\n\n' + file_url)}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de l\'envoi' : 'Error sending email');
    }
  };

  const totalPersonnes = (dossier.nombre_adultes || 0) + (dossier.nombre_adolescents || 0) + (dossier.nombre_enfants || 0) + (dossier.nombre_bebes || 0);

  // Récupérer l'inventaire complet de la catégorie
  const inventaireComplet = dossier.categorie_logement 
    ? getInventaireParCategorie(dossier.categorie_logement, lang)
    : null;

  // Vérifier si le dossier est complet
  const dossierComplet = !!(
    dossier.inventaire_id &&
    inventaire &&
    inventaire.evaluation_proprete &&
    inventaire.signature_url
  );

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{lang === 'fr' ? 'Retour à la liste' : 'Back to list'}</span>
          </button>

          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-6">
            📋 {lang === 'fr' ? 'Dossier Arrivée' : 'Arrival File'}
          </h1>

          {/* Alerte si dossier incomplet */}
          {!dossierComplet && (
            <Card className="border-2 border-orange-400 bg-orange-50 rounded-xl mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="font-heading text-orange-900">
                      {lang === 'fr' ? '⚠️ Dossier incomplet' : '⚠️ Incomplete file'}
                    </p>
                    <p className="text-sm text-orange-700">
                      {lang === 'fr' 
                        ? 'Le client n\'a pas encore terminé le processus d\'arrivée (inventaire, photos, signature).'
                        : 'The guest has not yet completed the arrival process (inventory, photos, signature).'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informations client */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                👤 {lang === 'fr' ? 'Informations client' : 'Guest information'}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Nom' : 'Name'}</p>
                  <p className="font-heading text-lg">{dossier.client_nom} {dossier.client_prenom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Code dossier' : 'File code'}</p>
                  <p className="font-heading text-lg">{dossier.code_dossier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Dates' : 'Dates'}</p>
                  <p className="font-heading flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {dossier.date_arrivee} → {dossier.date_depart}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Hébergement' : 'Accommodation'}</p>
                  <p className="font-heading flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    {dossier.numero_logement} - {dossier.categorie_logement}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Personnes' : 'People'}</p>
                  <p className="font-heading flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {totalPersonnes} {lang === 'fr' ? 'pers' : 'ppl'}
                    {totalPersonnes > 0 && 
                      ` (${dossier.nombre_adultes || 0}A / ${dossier.nombre_adolescents || 0}Ado / ${dossier.nombre_enfants || 0}E / ${dossier.nombre_bebes || 0}B)`}
                  </p>
                </div>
                {dossier.nombre_animaux > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">{lang === 'fr' ? 'Animaux' : 'Pets'}</p>
                    <p className="font-heading flex items-center gap-2">
                      <Dog className="w-4 h-4" />
                      {dossier.nombre_animaux}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventaire */}
          {inventaire ? (
            <Card className="border-2 border-blue-300 rounded-xl mb-6">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                  ✔️ {lang === 'fr' ? 'Contrôle Inventaire' : 'Inventory Check'}
                </h2>
                <div className="space-y-6">
                  {/* Inventaire complet avec icônes */}
                  {inventaireComplet && (
                    <div>
                      <p className="text-sm font-heading text-gray-700 mb-3">
                        {lang === 'fr' ? '📦 Inventaire complet' : '📦 Complete inventory'}
                      </p>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                        {inventaireComplet.objets.map((objet) => {
                          const estValide = inventaire.objets_valides?.includes(objet.id);
                          const estManquant = inventaire.objets_manquants?.some(obj => obj.objet === objet.id);
                          
                          return (
                            <div
                              key={objet.id}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                estManquant
                                  ? 'border-red-400 bg-red-50'
                                  : estValide
                                  ? 'border-green-400 bg-green-50'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="text-3xl mb-1">{objet.icon}</div>
                              <p className="text-xs font-heading">{objet.label}</p>
                              {estValide && <CheckCircle className="w-4 h-4 mx-auto mt-1 text-green-600" />}
                              {estManquant && <XCircle className="w-4 h-4 mx-auto mt-1 text-red-600" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Résumé */}
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-heading">
                        {inventaire.objets_valides?.length || 0} {lang === 'fr' ? 'validés' : 'validated'}
                      </span>
                    </div>
                    {inventaire.objets_manquants?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-heading">
                          {inventaire.objets_manquants.length} {lang === 'fr' ? 'manquants' : 'missing'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Objets manquants */}
                  {inventaire.objets_manquants?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        {lang === 'fr' ? '⚠️ Objets manquants/cassés' : '⚠️ Missing/broken items'} ({inventaire.objets_manquants.length})
                      </p>
                      <div className="space-y-2">
                        {inventaire.objets_manquants.map((obj, idx) => (
                          <div key={idx} className="p-3 bg-red-50 rounded-lg border-2 border-red-300 flex items-start gap-2">
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-heading text-sm text-red-900">{obj.objet}</p>
                              {obj.commentaire && (
                                <p className="text-xs text-gray-700 mt-1">{obj.commentaire}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos des pièces */}
                  {inventaire.photos_pieces && Object.keys(inventaire.photos_pieces).length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        📸 {lang === 'fr' ? 'Photos des pièces' : 'Room photos'}
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(inventaire.photos_pieces).map(([piece, url]) => (
                          <button
                            key={piece}
                            onClick={() => setSelectedPhoto({ piece, url })}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#00AEEF] transition-all group"
                          >
                            <img 
                              src={url} 
                              alt={piece}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="text-xs text-white font-heading">{piece}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Évaluation propreté */}
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">{lang === 'fr' ? '🧹 Évaluation propreté' : '🧹 Cleanliness rating'}</p>
                    <div className={`p-4 rounded-lg border-2 ${
                      inventaire.evaluation_proprete === 'tres_propre' ? 'bg-green-50 border-green-300' :
                      inventaire.evaluation_proprete === 'correct' ? 'bg-yellow-50 border-yellow-300' :
                      'bg-red-50 border-red-300'
                    }`}>
                      <p className="font-heading text-lg">
                        {inventaire.evaluation_proprete === 'tres_propre' ? '😊 ' + (lang === 'fr' ? 'Très propre' : 'Very clean') :
                         inventaire.evaluation_proprete === 'correct' ? '😐 ' + (lang === 'fr' ? 'Correct' : 'Correct') :
                         '😞 ' + (lang === 'fr' ? 'Pas satisfaisant' : 'Not satisfactory')}
                      </p>
                      {inventaire.commentaire_proprete && (
                        <p className="text-sm text-gray-700 mt-2">{inventaire.commentaire_proprete}</p>
                      )}
                      {inventaire.photo_proprete && (
                        <button
                          onClick={() => setSelectedPhoto({ piece: lang === 'fr' ? 'Propreté' : 'Cleanliness', url: inventaire.photo_proprete })}
                          className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ImageIcon className="w-4 h-4" />
                          {lang === 'fr' ? 'Voir photo' : 'View photo'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Remarques client */}
                  {inventaire.remarques_suggestions && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">💬 {lang === 'fr' ? 'Remarques du client' : 'Guest remarks'}</p>
                      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <p className="text-sm text-gray-800">{inventaire.remarques_suggestions}</p>
                      </div>
                    </div>
                  )}

                  {/* Signature */}
                  {inventaire.signature_url && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">✍️ {lang === 'fr' ? 'Signature client' : 'Guest signature'}</p>
                      <div className="border-2 border-gray-300 rounded-lg p-2 bg-white inline-block">
                        <img 
                          src={inventaire.signature_url} 
                          alt="Signature"
                          className="h-20"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {lang === 'fr' ? 'Signé le' : 'Signed on'} {new Date(inventaire.date_validation).toLocaleString(lang)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-gray-300 rounded-xl mb-6">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl text-gray-500 mb-4">
                  ⏳ {lang === 'fr' ? 'En attente d\'inventaire' : 'Waiting for inventory'}
                </h2>
                <p className="text-gray-600">
                  {lang === 'fr'
                    ? 'Le client n\'a pas encore complété le contrôle d\'inventaire à l\'arrivée.'
                    : 'The guest has not yet completed the arrival inventory check.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Dialog pour afficher les photos en grand */}
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{selectedPhoto?.piece}</DialogTitle>
              </DialogHeader>
              {selectedPhoto && (
                <img 
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.piece}
                  className="w-full rounded-lg"
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Interventions générées */}
          {interventions.length > 0 && (
            <Card className="border-2 border-orange-300 rounded-xl mb-6">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                  🔧 {lang === 'fr' ? 'Interventions créées' : 'Created interventions'}
                </h2>
                <div className="space-y-2">
                  {interventions.map(interv => (
                    <div key={interv.id} className={`p-3 rounded-lg border ${
                      interv.type === 'menage' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <p className="font-heading text-sm">{interv.sous_categorie || interv.categorie}</p>
                      <p className="text-xs text-gray-600">{interv.description}</p>
                      <span className={`text-xs font-bold ${interv.urgent ? 'text-red-600' : 'text-gray-600'}`}>
                        {interv.urgent ? '🔴 URGENT' : '🟢 NORMAL'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleGenererPDF}
              className="flex-1 bg-[#00AEEF] hover:bg-[#0077A8]"
            >
              <Download className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Générer PDF' : 'Generate PDF'}
            </Button>
            <Button
              onClick={handleEnvoyerEmail}
              variant="outline"
              className="flex-1 border-2 border-[#00AEEF] text-[#00AEEF]"
            >
              <Mail className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Envoyer par email' : 'Send by email'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}