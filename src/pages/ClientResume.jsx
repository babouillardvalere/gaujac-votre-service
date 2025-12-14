import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import SignaturePad from '../components/SignaturePad';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Check, AlertCircle, Smile, Meh, Frown, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ClientResume() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  
  const [showSignatureSection, setShowSignatureSection] = useState(false);
  const [newSignature, setNewSignature] = useState('');
  const [updating, setUpdating] = useState(false);

  // Récupérer l'ID de la fiche depuis sessionStorage ou URL
  const ficheId = sessionStorage.getItem('fiche_arrivee_id');
  const nom = sessionStorage.getItem('arrivee_nom');
  const prenom = sessionStorage.getItem('arrivee_prenom');

  // Charger la fiche d'arrivée
  const { data: fiche, isLoading, refetch } = useQuery({
    queryKey: ['ficheArrivee', ficheId],
    queryFn: async () => {
      if (!ficheId) return null;
      const fiches = await base44.entities.FicheArrivee.list();
      return fiches.find(f => f.id === ficheId);
    },
    enabled: !!ficheId
  });

  useEffect(() => {
    if (!ficheId && !nom) {
      navigate(createPageUrl('ClientMenu'));
    }
  }, [ficheId, nom, navigate]);

  const handleUpdateSignature = async () => {
    if (!newSignature || !ficheId) return;
    
    setUpdating(true);
    try {
      const blob = await fetch(newSignature).then(r => r.blob());
      const signatureFile = new File([blob], 'signature.png', { type: 'image/png' });
      const result = await base44.integrations.Core.UploadFile({ file: signatureFile });
      
      await base44.entities.FicheArrivee.update(ficheId, {
        signature_url: result.file_url
      });
      
      toast.success(lang === 'fr' ? 'Signature mise à jour' : 'Signature updated');
      setShowSignatureSection(false);
      refetch();
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur' : 'Error');
    } finally {
      setUpdating(false);
    }
  };



  const handleDownload = async () => {
    toast.info(lang === 'fr' ? 'Génération du PDF...' : 'Generating PDF...');
    
    try {
      const element = document.getElementById('resume-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('resume-content');
          if (clonedElement) {
            clonedElement.style.padding = '20px';
          }
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const imgWidth = 210 - (2 * margin);
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 2 * margin);

      while (heightLeft > 0) {
        pdf.addPage();
        position = -(imgHeight - heightLeft) + margin;
        pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Arrivee_${fiche.client_nom}_${fiche.client_prenom}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      toast.success(lang === 'fr' ? 'PDF téléchargé avec succès' : 'PDF downloaded successfully');
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur génération PDF' : 'PDF generation error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  if (!fiche) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="font-heading text-2xl text-[#0077A8] mb-4">
            {lang === 'fr' ? 'Aucune fiche trouvée' : 'No form found'}
          </h2>
          <Button onClick={() => navigate(createPageUrl('ClientMenu'))}>
            {lang === 'fr' ? 'Retour au menu' : 'Back to menu'}
          </Button>
        </div>
      </div>
    );
  }

  const propretéIcon = {
    'pas_satisfaisant': <Frown className="w-8 h-8 text-red-500" />,
    'correct': <Meh className="w-8 h-8 text-yellow-500" />,
    'tres_propre': <Smile className="w-8 h-8 text-green-500" />
  }[fiche.evaluation_proprete];

  const propretéLabel = {
    'pas_satisfaisant': lang === 'fr' ? 'Pas satisfaisant' : 'Unsatisfactory',
    'correct': lang === 'fr' ? 'Correct' : 'Okay',
    'tres_propre': lang === 'fr' ? 'Très propre' : 'Very clean'
  }[fiche.evaluation_proprete];

  const dateLocale = lang === 'fr' ? fr : enUS;
  const formattedDate = fiche.date_validation 
    ? format(new Date(fiche.date_validation), 'PPP à HH:mm', { locale: dateLocale })
    : '';

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header - Non imprimable */}
        <div className="print:hidden mb-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-2">
              📋 {lang === 'fr' ? 'Résumé d\'arrivée' : 'Arrival Summary'}
            </h1>
          </motion.div>
        </div>

        {/* Contenu imprimable */}
        <div id="resume-content" className="space-y-4 bg-white p-6 rounded-xl">
          {/* Logo dans le PDF */}
          <div className="mb-4">
            <Logo className="h-16 mb-2" />
            <h1 className="font-handwritten text-2xl text-center text-[#0077A8]">
              📋 {lang === 'fr' ? 'Résumé d\'arrivée' : 'Arrival Summary'}
            </h1>
          </div>
          {/* Informations générales */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                <span>👤</span>
                {lang === 'fr' ? 'Informations du séjour' : 'Stay Information'}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">{lang === 'fr' ? 'Client' : 'Guest'}</p>
                  <p className="font-heading text-lg">{fiche.client_nom} {fiche.client_prenom}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 mb-1">{lang === 'fr' ? 'Hébergement' : 'Accommodation'}</p>
                  <p className="font-heading text-lg">{fiche.numero_logement}</p>
                  <p className="text-sm text-gray-600">{fiche.categorie_logement}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 mb-1">{lang === 'fr' ? 'Arrivée' : 'Check-in'}</p>
                  <p className="font-heading">{fiche.date_arrivee}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 mb-1">{lang === 'fr' ? 'Départ' : 'Check-out'}</p>
                  <p className="font-heading">{fiche.date_depart}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-gray-600 mb-1">{lang === 'fr' ? 'Occupants' : 'Occupants'}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {fiche.nombre_adultes > 0 && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        👨‍👩‍👧‍👦 {fiche.nombre_adultes} {lang === 'fr' ? 'adulte(s)' : 'adult(s)'}
                      </span>
                    )}
                    {fiche.nombre_adolescents > 0 && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        👦 {fiche.nombre_adolescents} {lang === 'fr' ? 'ado(s)' : 'teen(s)'}
                      </span>
                    )}
                    {fiche.nombre_enfants > 0 && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        👶 {fiche.nombre_enfants} {lang === 'fr' ? 'enfant(s)' : 'child(ren)'}
                      </span>
                    )}
                    {fiche.nombre_bebes > 0 && (
                      <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                        🍼 {fiche.nombre_bebes} {lang === 'fr' ? 'bébé(s)' : 'baby/ies'}
                      </span>
                    )}
                    {fiche.nombre_animaux > 0 && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                        🐾 {fiche.nombre_animaux} {lang === 'fr' ? 'animal/aux' : 'pet(s)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventaire */}
          <Card className="border-2 border-[#22c55e]/30 rounded-xl">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                <span>✅</span>
                {lang === 'fr' ? 'État de l\'inventaire' : 'Inventory Status'}
              </h2>

              {/* Objets validés */}
              {fiche.inventaire_objets_valides?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-heading text-sm text-green-700 mb-2 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {lang === 'fr' ? 'Objets conformes' : 'Items OK'} ({fiche.inventaire_objets_valides.length})
                  </h3>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      {lang === 'fr' 
                        ? `${fiche.inventaire_objets_valides.length} objet(s) vérifié(s) et conforme(s)`
                        : `${fiche.inventaire_objets_valides.length} item(s) checked and OK`}
                    </p>
                  </div>
                </div>
              )}

              {/* Objets manquants */}
              {fiche.inventaire_objets_manquants?.length > 0 && (
                <div>
                  <h3 className="font-heading text-sm text-red-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {lang === 'fr' ? 'Objets signalés' : 'Reported Items'} ({fiche.inventaire_objets_manquants.length})
                  </h3>
                  <div className="space-y-2">
                    {fiche.inventaire_objets_manquants.map((obj, idx) => (
                      <div key={idx} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                        <p className="font-heading text-sm text-red-900">
                          {typeof obj === 'string' ? obj : obj.objet}
                        </p>
                        {obj.commentaire && (
                          <p className="text-xs text-red-700 mt-1">{obj.commentaire}</p>
                        )}
                        {obj.critique && (
                          <span className="inline-block mt-2 px-2 py-1 bg-red-600 text-white text-xs rounded">
                            🚨 {lang === 'fr' ? 'CRITIQUE' : 'CRITICAL'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Propreté */}
          <Card className="border-2 border-[#FFA500]/30 rounded-xl">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                <span>🧽</span>
                {lang === 'fr' ? 'Évaluation de la propreté' : 'Cleanliness Assessment'}
              </h2>

              <div className="flex items-center gap-4 mb-4">
                {propretéIcon}
                <div>
                  <p className="font-heading text-lg">{propretéLabel}</p>
                  {fiche.commentaire_proprete && (
                    <p className="text-sm text-gray-600 mt-1">{fiche.commentaire_proprete}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          {fiche.photos_pieces && Object.keys(fiche.photos_pieces).length > 0 && (
            <Card className="border-2 border-blue-300 rounded-xl print:break-before-page">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                  <span>📸</span>
                  {lang === 'fr' ? 'Photos de l\'état initial' : 'Initial Condition Photos'}
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(fiche.photos_pieces).map(([lieu, url]) => (
                    <div key={lieu} className="space-y-2">
                      <p className="text-sm font-heading text-gray-700 capitalize">
                        {lieu.replace(/_/g, ' ')}
                      </p>
                      <img 
                        src={url} 
                        alt={lieu}
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remarques */}
          {fiche.remarques_client && (
            <Card className="border-2 border-gray-300 rounded-xl">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                  <span>💬</span>
                  {lang === 'fr' ? 'Remarques du client' : 'Guest Comments'}
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{fiche.remarques_client}</p>
              </CardContent>
            </Card>
          )}

          {/* Signature - Positionnement amélioré pour PDF */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <CardContent className="p-6 pb-8">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                <span>✒️</span>
                {lang === 'fr' ? 'Signature du client' : 'Guest Signature'}
              </h2>

              {fiche.signature_url ? (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    <img 
                      src={fiche.signature_url} 
                      alt="Signature"
                      className="h-28 object-contain"
                      crossOrigin="anonymous"
                      style={{ display: 'block', maxWidth: '400px' }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {lang === 'fr' ? 'Signé le' : 'Signed on'} {formattedDate}
                  </p>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowSignatureSection(true)}
                    className="print:hidden"
                  >
                    {lang === 'fr' ? 'Modifier la signature' : 'Update signature'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-orange-600 font-heading">
                    {lang === 'fr' ? 'Aucune signature enregistrée' : 'No signature recorded'}
                  </p>
                  <Button
                    onClick={() => setShowSignatureSection(true)}
                    className="print:hidden bg-[#00AEEF] hover:bg-[#0077A8]"
                  >
                    {lang === 'fr' ? 'Ajouter une signature' : 'Add signature'}
                  </Button>
                </div>
              )}

              {showSignatureSection && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg print:hidden">
                  <SignaturePad 
                    onSave={setNewSignature} 
                    disabled={updating}
                    lang={lang}
                  />
                  
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowSignatureSection(false);
                        setNewSignature('');
                      }}
                      disabled={updating}
                      className="flex-1"
                    >
                      {lang === 'fr' ? 'Annuler' : 'Cancel'}
                    </Button>
                    <Button
                      onClick={handleUpdateSignature}
                      disabled={!newSignature || updating}
                      className="flex-1 bg-[#22c55e] hover:bg-[#16a34a]"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {lang === 'fr' ? 'Enregistrement...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {lang === 'fr' ? 'Enregistrer' : 'Save'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 pt-6 border-t-2 border-gray-200 print:block">
            <p className="font-heading">Camping Paradis - Le Domaine de Gaujac</p>
            <p className="text-xs mt-1">
              {lang === 'fr' 
                ? 'Document généré le ' 
                : 'Document generated on '}
              {format(new Date(), 'PPP', { locale: dateLocale })}
            </p>
          </div>
        </div>

        {/* Message de confirmation */}
        <Card className="border-2 border-green-500 bg-green-50 mb-6 print:hidden">
          <CardContent className="p-6 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-handwritten text-2xl text-green-800 mb-2">
              {lang === 'fr' ? 'Inventaire enregistré !' : 'Inventory registered!'}
            </h2>
            <p className="text-gray-700">
              {lang === 'fr' 
                ? 'Votre inventaire d\'arrivée a bien été enregistré. Vous pouvez consulter ce document ou retourner au menu.'
                : 'Your arrival inventory has been registered. You can view this document or return to the menu.'}
            </p>
          </CardContent>
        </Card>

        {/* Actions principales */}
        <div className="space-y-3 print:hidden">
          <Button
            onClick={() => navigate(createPageUrl('ClientMenu'))}
            className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] text-white font-heading text-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {lang === 'fr' ? 'Retour au menu principal' : 'Back to main menu'}
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full h-14 border-2 border-[#00AEEF] text-[#0077A8] font-heading text-lg hover:bg-blue-50"
          >
            <Download className="w-5 h-5 mr-2" />
            {lang === 'fr' ? 'Télécharger le document' : 'Download document'}
          </Button>
        </div>
      </div>

      {/* Styles d'impression */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:break-before-page {
            break-before: page;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}