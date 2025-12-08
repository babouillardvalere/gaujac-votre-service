import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Mail, FileText, AlertTriangle, CheckCircle, Calendar, Home } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function ReceptionFicheDepart({ ficheId, onClose, lang }) {
  const [fiche, setFiche] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const loadFiche = async () => {
      try {
        const ficheComplete = await base44.entities.FicheDepart.get(ficheId);
        console.log('📄 Fiche départ chargée:', ficheComplete);
        setFiche(ficheComplete);
      } catch (error) {
        console.error('Erreur chargement fiche départ:', error);
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
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPos = 20;

      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(lang === 'fr' ? 'DOSSIER DE DÉPART' : 'DEPARTURE FILE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      doc.setFontSize(14);
      doc.text(lang === 'fr' ? 'Informations client' : 'Guest information', 15, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${lang === 'fr' ? 'Nom' : 'Name'}: ${fiche.client_prenom} ${fiche.client_nom}`, 15, yPos);
      yPos += 6;
      doc.text(`${lang === 'fr' ? 'Logement' : 'Accommodation'}: ${fiche.numero_logement} (${fiche.categorie_logement})`, 15, yPos);
      yPos += 6;
      doc.text(`${lang === 'fr' ? 'Dates' : 'Dates'}: ${fiche.date_arrivee} → ${fiche.date_depart}`, 15, yPos);
      yPos += 15;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(lang === 'fr' ? 'État du logement au départ' : 'Accommodation condition on departure', 15, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Inventaire état
      if (fiche.inventaire_objets_etat && fiche.inventaire_objets_etat.length > 0) {
        const objetsOK = fiche.inventaire_objets_etat.filter(o => o.etat === 'ok').length;
        const objetsCasses = fiche.inventaire_objets_etat.filter(o => o.etat === 'casse_ou_manquant').length;
        const objetsDejaManquants = fiche.inventaire_objets_etat.filter(o => o.etat === 'deja_manquant_arrivee').length;
        
        doc.setTextColor(0, 128, 0);
        doc.text(`${lang === 'fr' ? '✓ Objets en bon état' : '✓ Items in good condition'}: ${objetsOK}`, 15, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;
        
        if (objetsCasses > 0) {
          doc.setTextColor(255, 0, 0);
          doc.text(`${lang === 'fr' ? '✗ Objets cassés/manquants au départ' : '✗ Items broken/missing on departure'}: ${objetsCasses}`, 15, yPos);
          yPos += 6;
          doc.setFontSize(9);
          fiche.inventaire_objets_etat.filter(o => o.etat === 'casse_ou_manquant').forEach(obj => {
            doc.text(`  • ${obj.objet}`, 20, yPos);
            yPos += 5;
          });
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(11);
          yPos += 3;
        }
        
        if (objetsDejaManquants > 0) {
          doc.setTextColor(255, 140, 0);
          doc.text(`${lang === 'fr' ? '⚠ Déjà signalés à l\'arrivée' : '⚠ Already reported on arrival'}: ${objetsDejaManquants}`, 15, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 8;
        }
      }

      if (fiche.degats_signales) {
        doc.setTextColor(255, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(lang === 'fr' ? '⚠️ DÉGÂTS SIGNALÉS' : '⚠️ DAMAGES REPORTED', 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        yPos += 8;
      }

      if (fiche.evaluation_proprete) {
        const proprete = fiche.evaluation_proprete === 'tres_propre' ? (lang === 'fr' ? 'Très propre' : 'Very clean') :
                         fiche.evaluation_proprete === 'correct' ? (lang === 'fr' ? 'Correct' : 'OK') :
                         (lang === 'fr' ? 'Pas satisfaisant' : 'Not satisfactory');
        doc.text(`${lang === 'fr' ? 'Propreté' : 'Cleanliness'}: ${proprete}`, 15, yPos);
        yPos += 8;
      }

      if (fiche.remarques_staff) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(lang === 'fr' ? 'Remarques' : 'Remarks', 15, yPos);
        yPos += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(fiche.remarques_staff, pageWidth - 30);
        doc.text(splitText, 15, yPos);
      }

      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `depart_${fiche.numero_logement}_${fiche.client_nom}.pdf`, { type: 'application/pdf' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
      
      await base44.entities.FicheDepart.update(fiche.id, { pdf_url: file_url });
      queryClient.invalidateQueries({ queryKey: ['fiches-depart'] });

      toast.success(lang === 'fr' ? 'PDF généré avec succès' : 'PDF generated successfully');
      window.open(file_url, '_blank');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de la génération du PDF' : 'Error generating PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const envoyerEmail = async () => {
    if (!fiche.pdf_url) {
      toast.error(lang === 'fr' ? 'Veuillez d\'abord générer le PDF' : 'Please generate the PDF first');
      return;
    }

    setSendingEmail(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: 'reception@camping-paradis.fr',
        subject: lang === 'fr' 
          ? `Dossier de départ - ${fiche.client_nom} ${fiche.client_prenom}`
          : `Departure file - ${fiche.client_nom} ${fiche.client_prenom}`,
        body: `
          ${lang === 'fr' ? 'Dossier de départ pour' : 'Departure file for'}: ${fiche.client_prenom} ${fiche.client_nom}
          ${lang === 'fr' ? 'Logement' : 'Accommodation'}: ${fiche.numero_logement}
          ${lang === 'fr' ? 'Dates' : 'Dates'}: ${fiche.date_arrivee} → ${fiche.date_depart}
          
          ${lang === 'fr' ? 'Lien PDF' : 'PDF link'}: ${fiche.pdf_url}
        `
      });

      await base44.entities.FicheDepart.update(fiche.id, { email_envoye: true });
      queryClient.invalidateQueries({ queryKey: ['fiches-depart'] });

      toast.success(lang === 'fr' ? 'Email envoyé avec succès' : 'Email sent successfully');
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de l\'envoi de l\'email' : 'Error sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={onClose} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {lang === 'fr' ? 'Retour à la liste' : 'Back to list'}
        </Button>
        <div className="flex gap-2">
          <Button onClick={genererPDF} disabled={generatingPDF} className="gap-2 bg-[#FFA500]">
            <Download className="w-4 h-4" />
            {generatingPDF ? (lang === 'fr' ? 'Génération...' : 'Generating...') : (lang === 'fr' ? 'Générer PDF' : 'Generate PDF')}
          </Button>
          <Button onClick={envoyerEmail} disabled={sendingEmail || !fiche.pdf_url} variant="outline" className="gap-2">
            <Mail className="w-4 h-4" />
            {sendingEmail ? (lang === 'fr' ? 'Envoi...' : 'Sending...') : (lang === 'fr' ? 'Envoyer par email' : 'Send by email')}
          </Button>
        </div>
      </div>

      <Card className="border-2 border-[#FFA500]">
        <CardHeader className="bg-gradient-to-r from-[#FFA500] to-[#FF8C00] text-white">
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {lang === 'fr' ? `Dossier de départ - ${fiche.client_prenom} ${fiche.client_nom}` : `Departure file - ${fiche.client_prenom} ${fiche.client_nom}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="font-heading text-xl text-[#0077A8] mb-4">
              {lang === 'fr' ? 'Informations' : 'Information'}
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Client' : 'Guest'}</p>
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

          {/* Inventaire départ */}
          {fiche.inventaire_objets_etat && fiche.inventaire_objets_etat.length > 0 && (
            <div>
              <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                {lang === 'fr' ? '📋 État inventaire au départ' : '📋 Inventory condition on departure'}
              </h3>
              <div className="space-y-3">
                {fiche.inventaire_objets_etat.filter(o => o.etat === 'ok').length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-heading text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      {lang === 'fr' ? 'Objets en bon état' : 'Items in good condition'} ({fiche.inventaire_objets_etat.filter(o => o.etat === 'ok').length})
                    </p>
                  </div>
                )}
                {fiche.inventaire_objets_etat.filter(o => o.etat === 'casse_ou_manquant').length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                    <p className="font-heading text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      {lang === 'fr' ? 'Cassés/manquants au départ' : 'Broken/missing on departure'} ({fiche.inventaire_objets_etat.filter(o => o.etat === 'casse_ou_manquant').length})
                    </p>
                    <div className="space-y-1 text-sm">
                      {fiche.inventaire_objets_etat.filter(o => o.etat === 'casse_ou_manquant').map((obj, i) => (
                        <div key={i} className="text-red-600">
                          • {obj.objet} {obj.quantity && <strong>×{obj.quantity}</strong>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fiche.inventaire_objets_etat.filter(o => o.etat === 'deja_manquant_arrivee').length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
                    <p className="font-heading text-orange-700 mb-2">
                      {lang === 'fr' ? '⚠ Déjà signalés à l\'arrivée' : '⚠ Already reported on arrival'} ({fiche.inventaire_objets_etat.filter(o => o.etat === 'deja_manquant_arrivee').length})
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Photos départ */}
          {fiche.photos_depart && Object.keys(fiche.photos_depart).length > 0 && (
            <div>
              <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                {lang === 'fr' ? '📸 Photos au départ' : '📸 Departure photos'}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(fiche.photos_depart).map(([lieu, url]) => (
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
          )}

          {fiche.degats_signales && (
            <>
              <Separator />
              <div className="bg-red-50 border-2 border-red-300 p-4 rounded-lg">
                <p className="font-heading text-red-700 text-lg flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  {lang === 'fr' ? 'Dégâts signalés' : 'Damages reported'}
                </p>
              </div>
            </>
          )}

          {fiche.evaluation_proprete && (
            <div>
              <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                {lang === 'fr' ? 'Propreté' : 'Cleanliness'}
              </h3>
              <Badge className={
                fiche.evaluation_proprete === 'tres_propre' ? 'bg-green-100 text-green-700' :
                fiche.evaluation_proprete === 'correct' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }>
                {fiche.evaluation_proprete === 'tres_propre' ? (lang === 'fr' ? '😊 Très propre' : '😊 Very clean') :
                 fiche.evaluation_proprete === 'correct' ? (lang === 'fr' ? '😐 Correct' : '😐 OK') :
                 (lang === 'fr' ? '😞 Pas satisfaisant' : '😞 Not satisfactory')}
              </Badge>
            </div>
          )}

          {fiche.remarques_staff && (
            <>
              <Separator />
              <div>
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  {lang === 'fr' ? 'Remarques' : 'Remarks'}
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{fiche.remarques_staff}</p>
                </div>
              </div>
            </>
          )}

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

          <div className="text-sm text-gray-500 text-center pt-4 border-t">
            {lang === 'fr' ? 'Validé le' : 'Validated on'} {new Date(fiche.date_validation).toLocaleString(lang)}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}