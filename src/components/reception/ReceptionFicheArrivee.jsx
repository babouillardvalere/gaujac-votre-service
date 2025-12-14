import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Mail, FileText, CheckCircle, XCircle, Users, Calendar, Home } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { addPDFToQueue, PDF_STATUS } from '../pdfQueue';
import Logo from '../Logo';

export default function ReceptionFicheArrivee({ ficheId, onClose, lang }) {
  const [fiche, setFiche] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadFiche = async () => {
      try {
        const ficheComplete = await base44.entities.FicheArrivee.get(ficheId);
        console.log('📄 Fiche chargée:', ficheComplete);
        setFiche(ficheComplete);
      } catch (error) {
        console.error('Erreur chargement fiche:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFiche();
  }, [ficheId]);

  if (loading || !fiche) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
      </div>
    );
  }

  const genererPDF = async () => {
    setGeneratingPDF(true);
    toast.info(lang === 'fr' ? 'Génération du PDF...' : 'Generating PDF...');
    
    try {
      const element = document.getElementById('fiche-arrivee-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 1.5,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const doc = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`arrivee_${fiche.numero_logement}_${fiche.client_nom}.pdf`);
      
      toast.success(lang === 'fr' ? 'PDF téléchargé' : 'PDF downloaded');


    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error(lang === 'fr' ? 'Erreur génération PDF' : 'PDF generation error');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const envoyerEmail = async () => {
    setSendingEmail(true);
    try {
      const totalPersonnes = (fiche.nombre_adultes || 0) + (fiche.nombre_adolescents || 0) + 
                             (fiche.nombre_enfants || 0) + (fiche.nombre_bebes || 0);
      
      const objetsManquants = fiche.inventaire_objets_manquants && fiche.inventaire_objets_manquants.length > 0
        ? fiche.inventaire_objets_manquants.map(obj => {
            const objetNom = typeof obj === 'string' ? obj : obj.objet;
            return `  - ${objetNom}`;
          }).join('\n')
        : (lang === 'fr' ? 'Aucun' : 'None');

      const proprete = fiche.evaluation_proprete === 'tres_propre' ? (lang === 'fr' ? 'Très propre' : 'Very clean') :
                       fiche.evaluation_proprete === 'correct' ? (lang === 'fr' ? 'Correct' : 'OK') :
                       (lang === 'fr' ? 'Pas satisfaisant' : 'Not satisfactory');

      await base44.integrations.Core.SendEmail({
        to: 'reception@camping-paradis.fr',
        subject: lang === 'fr' 
          ? `Dossier d'arrivée - ${fiche.client_prenom} ${fiche.client_nom} - ${fiche.numero_logement}`
          : `Arrival file - ${fiche.client_prenom} ${fiche.client_nom} - ${fiche.numero_logement}`,
        body: `
${lang === 'fr' ? 'DOSSIER D\'ARRIVÉE' : 'ARRIVAL FILE'}

${lang === 'fr' ? 'Client' : 'Guest'}: ${fiche.client_prenom} ${fiche.client_nom}
${lang === 'fr' ? 'Logement' : 'Accommodation'}: ${fiche.numero_logement} (${fiche.categorie_logement})
${lang === 'fr' ? 'Dates' : 'Dates'}: ${fiche.date_arrivee} → ${fiche.date_depart}
${lang === 'fr' ? 'Occupants' : 'Occupants'}: ${totalPersonnes} personne(s)

${lang === 'fr' ? 'INVENTAIRE' : 'INVENTORY'}
---
${lang === 'fr' ? 'Objets validés' : 'Validated items'}: ${fiche.inventaire_objets_valides?.length || 0}
${lang === 'fr' ? 'Objets manquants/cassés' : 'Missing/broken items'}: ${fiche.inventaire_objets_manquants?.length || 0}

${fiche.inventaire_objets_manquants?.length > 0 ? `\n${lang === 'fr' ? 'Détail objets manquants' : 'Missing items detail'}:\n${objetsManquants}\n` : ''}

${lang === 'fr' ? 'PROPRETÉ' : 'CLEANLINESS'}: ${proprete}
${fiche.commentaire_proprete ? `${lang === 'fr' ? 'Commentaire' : 'Comment'}: ${fiche.commentaire_proprete}` : ''}

${fiche.remarques_client ? `\n${lang === 'fr' ? 'REMARQUES CLIENT' : 'GUEST REMARKS'}:\n${fiche.remarques_client}` : ''}

${lang === 'fr' ? 'Validé le' : 'Validated on'}: ${new Date(fiche.date_validation).toLocaleString(lang)}
        `
      });

      await base44.entities.FicheArrivee.update(fiche.id, { email_envoye: true });
      queryClient.invalidateQueries({ queryKey: ['fiches-arrivee'] });

      toast.success(lang === 'fr' ? 'Email envoyé avec succès' : 'Email sent successfully');
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de l\'envoi de l\'email' : 'Error sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  const propreteBadge = fiche.evaluation_proprete === 'tres_propre' ? 
    { emoji: '😊', text: lang === 'fr' ? 'Très propre' : 'Very clean', color: 'bg-green-100 text-green-700' } :
    fiche.evaluation_proprete === 'correct' ?
    { emoji: '😐', text: lang === 'fr' ? 'Correct' : 'OK', color: 'bg-yellow-100 text-yellow-700' } :
    { emoji: '😞', text: lang === 'fr' ? 'Pas satisfaisant' : 'Not satisfactory', color: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onClose} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {lang === 'fr' ? 'Retour à la liste' : 'Back to list'}
        </Button>
        <div className="flex gap-2">
          <Button 
            onClick={genererPDF} 
            disabled={generatingPDF} 
            className="gap-2 bg-[#00AEEF]"
          >
            <Download className="w-4 h-4" />
            {generatingPDF ? (lang === 'fr' ? 'Génération...' : 'Generating...') : (lang === 'fr' ? 'Générer PDF' : 'Generate PDF')}
          </Button>
          <Button onClick={envoyerEmail} disabled={sendingEmail} variant="outline" className="gap-2">
            <Mail className="w-4 h-4" />
            {sendingEmail ? (lang === 'fr' ? 'Envoi...' : 'Sending...') : (lang === 'fr' ? 'Envoyer par email' : 'Send by email')}
          </Button>
        </div>
      </div>

      {/* Fiche complète */}
      <div id="fiche-arrivee-content" className="bg-white p-6 space-y-4 rounded-xl">
        {/* Logo et titre */}
        <div className="mb-4">
          <Logo className="h-16 mb-2" />
          <h1 className="font-handwritten text-2xl text-center text-[#0077A8]">
            📋 {lang === 'fr' ? 'Dossier d\'arrivée' : 'Arrival File'}
          </h1>
        </div>

      <Card className="border-2 border-[#00AEEF]">
        <CardHeader className="bg-gradient-to-r from-[#00AEEF] to-[#0077A8] text-white">
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {lang === 'fr' ? `Dossier d'arrivée - ${fiche.client_prenom} ${fiche.client_nom}` : `Arrival file - ${fiche.client_prenom} ${fiche.client_nom}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Informations client */}
          <div>
            <h3 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {lang === 'fr' ? 'Informations client' : 'Guest information'}
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Nom complet' : 'Full name'}</p>
                <p className="font-heading text-lg">{fiche.client_prenom} {fiche.client_nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Logement' : 'Accommodation'}</p>
                <p className="font-heading text-lg flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  {fiche.numero_logement}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Catégorie' : 'Category'}</p>
                <p className="font-heading">{fiche.categorie_logement}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Dates' : 'Dates'}</p>
                <p className="font-heading flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {fiche.date_arrivee} → {fiche.date_depart}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Occupants */}
          <div>
            <h3 className="font-heading text-lg text-[#0077A8] mb-3">
              {lang === 'fr' ? 'Occupants' : 'Occupants'} ({(fiche.nombre_adultes || 0) + (fiche.nombre_adolescents || 0) + (fiche.nombre_enfants || 0) + (fiche.nombre_bebes || 0)})
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{fiche.nombre_adultes || 0}</p>
                <p className="text-xs text-gray-600">{lang === 'fr' ? 'Adultes' : 'Adults'}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{fiche.nombre_adolescents || 0}</p>
                <p className="text-xs text-gray-600">{lang === 'fr' ? 'Ados' : 'Teens'}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600">{fiche.nombre_enfants || 0}</p>
                <p className="text-xs text-gray-600">{lang === 'fr' ? 'Enfants' : 'Children'}</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-pink-600">{fiche.nombre_bebes || 0}</p>
                <p className="text-xs text-gray-600">{lang === 'fr' ? 'Bébés' : 'Babies'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Inventaire */}
          <div>
            <h3 className="font-heading text-lg text-[#0077A8] mb-3">
              {lang === 'fr' ? '📋 Inventaire' : '📋 Inventory'}
            </h3>
            <div className="space-y-3">
              {fiche.inventaire_objets_valides && fiche.inventaire_objets_valides.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="font-heading text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {lang === 'fr' ? 'Objets validés' : 'Validated items'} ({fiche.inventaire_objets_valides.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fiche.inventaire_objets_valides.map((obj, i) => {
                      const objData = typeof obj === 'object' ? obj : { nom: obj };
                      return (
                        <Badge key={i} className="bg-green-100 text-green-800">
                          ✓ {objData.nom || obj} {objData.quantity && <strong>×{objData.quantity}</strong>}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              {fiche.inventaire_objets_manquants && fiche.inventaire_objets_manquants.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="font-heading text-red-700 mb-2 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    {lang === 'fr' ? 'Objets manquants/cassés' : 'Missing/broken items'} ({fiche.inventaire_objets_manquants.length})
                  </p>
                  <div className="space-y-2">
                    {fiche.inventaire_objets_manquants.map((obj, i) => {
                      const objData = typeof obj === 'object' ? obj : { nom: obj };
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>{objData.nom || objData.objet || obj} {objData.quantity && <strong>×{objData.quantity}</strong>}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Photos */}
          {fiche.photos_pieces && Object.keys(fiche.photos_pieces).length > 0 && (
            <>
              <div>
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  {lang === 'fr' ? '📸 Photos de l\'état initial' : '📸 Initial condition photos'}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(fiche.photos_pieces).map(([lieu, url]) => (
                    <div key={lieu} className="space-y-2">
                      <img 
                        src={url} 
                        alt={lieu}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <p className="text-xs text-center text-gray-600 capitalize">
                        {lieu.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Propreté */}
          <div>
            <h3 className="font-heading text-lg text-[#0077A8] mb-3">
              {lang === 'fr' ? '🧹 Propreté' : '🧹 Cleanliness'}
            </h3>
            <div className={`p-4 rounded-lg ${propreteBadge.color}`}>
              <p className="font-heading text-xl">{propreteBadge.emoji} {propreteBadge.text}</p>
              {fiche.commentaire_proprete && (
                <p className="mt-2 text-sm">{fiche.commentaire_proprete}</p>
              )}
            </div>
          </div>

          {/* Remarques */}
          {fiche.remarques_client && (
            <>
              <Separator />
              <div>
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  {lang === 'fr' ? '💬 Remarques client' : '💬 Guest remarks'}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{fiche.remarques_client}</p>
                </div>
              </div>
            </>
          )}

          {/* Signature */}
          {fiche.signature_url && (
            <>
              <Separator />
              <div>
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  {lang === 'fr' ? '✍️ Signature' : '✍️ Signature'}
                </h3>
                <img src={fiche.signature_url} alt="Signature" className="border-2 border-gray-300 rounded-lg max-w-xs" />
              </div>
            </>
          )}

          {/* Date validation */}
          <div className="text-sm text-gray-500 text-center pt-4 border-t">
            {lang === 'fr' ? 'Validé le' : 'Validated on'} {new Date(fiche.date_validation).toLocaleString(lang)}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}