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
import html2canvas from 'html2canvas';
import Logo from '../Logo';

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
    toast.info(lang === 'fr' ? 'Génération du PDF...' : 'Generating PDF...');
    
    try {
      const element = document.getElementById('fiche-depart-content');
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

      doc.save(`depart_${fiche.numero_logement}_${fiche.client_nom}.pdf`);
      
      toast.success(lang === 'fr' ? 'PDF téléchargé' : 'PDF downloaded');


    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de la génération du PDF' : 'Error generating PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const envoyerEmail = async () => {
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

      <div id="fiche-depart-content" className="bg-white p-6 space-y-4 rounded-xl">
        {/* Logo et titre */}
        <div className="mb-4">
          <Logo className="h-16 mb-2" />
          <h1 className="font-handwritten text-2xl text-center text-[#0077A8]">
            📋 {lang === 'fr' ? 'Dossier de départ' : 'Departure File'}
          </h1>
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
    </div>
  );
}