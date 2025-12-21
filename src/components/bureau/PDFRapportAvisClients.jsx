import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Download, Loader2, Calendar as CalendarIcon, Star } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PDFRapportAvisClients({ avis = [], lang = 'fr' }) {
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const generatePDF = async () => {
    setGenerating(true);
    toast.loading(lang === 'fr' ? 'Génération du rapport avis clients...' : 'Generating client reviews report...', { id: 'pdf-avis' });

    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const debut = startOfMonth(selectedMonth);
      const fin = endOfMonth(selectedMonth);

      // Filtrer avis de la période
      const periodAvis = avis.filter(a => {
        const d = new Date(a.created_date);
        return d >= debut && d <= fin;
      });

      // Grouper par catégorie d'hébergement
      const parCategorie = periodAvis.reduce((acc, a) => {
        const cat = a.categorie_hebergement || 'Non spécifié';
        if (!acc[cat]) {
          acc[cat] = {
            count: 0,
            totalReactivite: 0,
            totalAmabilite: 0,
            totalQualite: 0,
            totalGlobale: 0
          };
        }
        acc[cat].count++;
        acc[cat].totalReactivite += a.note_reactivite || 0;
        acc[cat].totalAmabilite += a.note_amabilite || 0;
        acc[cat].totalQualite += a.note_intervention || 0;
        acc[cat].totalGlobale += a.note_globale || 0;
        return acc;
      }, {});

      const doc = new jsPDF();

      // Logo
      const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6930cc5060a27d8dfd0bf5fd/aa24decb4_logo.png';
      try {
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const logoBase64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        doc.addImage(logoBase64, 'PNG', 15, 10, 60, 20);
      } catch (e) {
        console.error('Erreur logo:', e);
      }

      let y = 40;

      // Titre
      doc.setFontSize(18);
      doc.setTextColor(0, 119, 168);
      doc.text(lang === 'fr' ? 'RAPPORT AVIS CLIENTS' : 'CLIENT REVIEWS REPORT', 105, y, { align: 'center' });
      y += 10;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(format(debut, 'MMMM yyyy', { locale: fr }).toUpperCase(), 105, y, { align: 'center' });
      y += 15;

      // Vue globale
      const avgGlobale = periodAvis.length > 0
        ? (periodAvis.reduce((s, a) => s + (a.note_globale || 0), 0) / periodAvis.length).toFixed(1)
        : 0;

      const avgReactivite = periodAvis.length > 0
        ? (periodAvis.reduce((s, a) => s + (a.note_reactivite || 0), 0) / periodAvis.length).toFixed(1)
        : 0;

      const avgAmabilite = periodAvis.length > 0
        ? (periodAvis.reduce((s, a) => s + (a.note_amabilite || 0), 0) / periodAvis.length).toFixed(1)
        : 0;

      const avgQualite = periodAvis.length > 0
        ? (periodAvis.reduce((s, a) => s + (a.note_intervention || 0), 0) / periodAvis.length).toFixed(1)
        : 0;

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 119, 168);
      doc.text(lang === 'fr' ? 'SATISFACTION GLOBALE' : 'OVERALL SATISFACTION', 15, y);
      y += 8;

      doc.autoTable({
        startY: y,
        head: [[lang === 'fr' ? 'Critère' : 'Criteria', lang === 'fr' ? 'Note moyenne' : 'Average rating', lang === 'fr' ? 'Nombre d\'avis' : 'Number of reviews']],
        body: [
          [lang === 'fr' ? '⭐ Note globale' : '⭐ Overall rating', `${avgGlobale}/5`, periodAvis.length],
          [lang === 'fr' ? '⚡ Réactivité' : '⚡ Responsiveness', `${avgReactivite}/5`, '-'],
          [lang === 'fr' ? '😊 Amabilité' : '😊 Friendliness', `${avgAmabilite}/5`, '-'],
          [lang === 'fr' ? '✅ Qualité intervention' : '✅ Intervention quality', `${avgQualite}/5`, '-'],
        ],
        theme: 'grid',
        headStyles: { fillColor: [255, 215, 0], textColor: [0, 119, 168] },
        margin: { left: 15, right: 15 }
      });

      y = doc.lastAutoTable.finalY + 10;

      // Par catégorie d'hébergement
      if (Object.keys(parCategorie).length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 119, 168);
        doc.text(lang === 'fr' ? 'PAR CATÉGORIE D\'HÉBERGEMENT' : 'BY ACCOMMODATION CATEGORY', 15, y);
        y += 8;

        const tableData = Object.entries(parCategorie)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([cat, stats]) => [
            cat,
            stats.count,
            (stats.totalGlobale / stats.count).toFixed(1),
            (stats.totalReactivite / stats.count).toFixed(1),
            (stats.totalAmabilite / stats.count).toFixed(1),
            (stats.totalQualite / stats.count).toFixed(1)
          ]);

        doc.autoTable({
          startY: y,
          head: [[
            lang === 'fr' ? 'Catégorie' : 'Category',
            lang === 'fr' ? 'Avis' : 'Reviews',
            lang === 'fr' ? 'Globale' : 'Overall',
            lang === 'fr' ? 'Réact.' : 'Resp.',
            lang === 'fr' ? 'Amab.' : 'Friend.',
            lang === 'fr' ? 'Qualité' : 'Quality'
          ]],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [0, 174, 239], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          margin: { left: 15, right: 15 }
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Camping Paradis - Rapport généré le ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        105,
        287,
        { align: 'center' }
      );

      // Télécharger
      const fileName = `Rapport_Avis_Clients_${format(debut, 'yyyy-MM')}.pdf`;
      doc.save(fileName);

      toast.dismiss('pdf-avis');
      toast.success(lang === 'fr' ? 'Rapport téléchargé ✅' : 'Report downloaded ✅');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.dismiss('pdf-avis');
      toast.error(lang === 'fr' ? 'Erreur génération PDF' : 'PDF generation error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-[#FFD700] rounded-xl">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-heading text-xl text-[#0077A8] flex items-center gap-2">
          <Star className="w-5 h-5 text-[#FFD700]" />
          {lang === 'fr' ? 'Rapport Avis Clients' : 'Client Reviews Report'}
        </h3>
        
        <p className="text-sm text-gray-600">
          {lang === 'fr'
            ? 'Analyse des avis clients par catégorie d\'hébergement avec notes détaillées.'
            : 'Analysis of client reviews by accommodation category with detailed ratings.'}
        </p>

        <div>
          <label className="text-sm font-heading text-[#0077A8] mb-2 block">
            {lang === 'fr' ? 'Sélectionner le mois' : 'Select month'}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start rounded-xl">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={(date) => date && setSelectedMonth(date)}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          onClick={generatePDF}
          disabled={generating}
          className="w-full bg-[#FFD700] hover:bg-[#FFA500] text-[#0077A8] h-12 rounded-xl font-heading"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {lang === 'fr' ? 'Génération...' : 'Generating...'}
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              {lang === 'fr' ? 'Télécharger PDF' : 'Download PDF'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}