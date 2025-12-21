import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Download, Loader2, Calendar as CalendarIcon, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PDFRapportCommandes({ lang = 'fr' }) {
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: commandes = [] } = useQuery({
    queryKey: ['commandes-direction-rapport'],
    queryFn: () => base44.entities.CommandeDirection.list('-created_date', 500)
  });

  const generatePDF = async () => {
    setGenerating(true);
    toast.loading(lang === 'fr' ? 'Génération du rapport commandes...' : 'Generating orders report...', { id: 'pdf-commandes' });

    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const debut = startOfMonth(selectedMonth);
      const fin = endOfMonth(selectedMonth);

      // Filtrer commandes de la période
      const periodCommandes = commandes.filter(c => {
        const d = new Date(c.created_date);
        return d >= debut && d <= fin;
      });

      // Stats par service
      const parService = periodCommandes.reduce((acc, c) => {
        const service = c.service_demandeur || 'Non spécifié';
        if (!acc[service]) {
          acc[service] = { count: 0, commandees: 0, recues: 0, aCommander: 0 };
        }
        acc[service].count++;
        if (c.statut === 'COMMANDEE') acc[service].commandees++;
        if (c.statut === 'RECUE') acc[service].recues++;
        if (c.statut === 'A_COMMANDER') acc[service].aCommander++;
        return acc;
      }, {});

      // Stats par type intervention
      const parTypeIntervention = periodCommandes.reduce((acc, c) => {
        const type = c.type_intervention || 'Non spécifié';
        if (!acc[type]) {
          acc[type] = { count: 0, articles: [] };
        }
        acc[type].count++;
        if (c.articles) {
          acc[type].articles.push(...c.articles);
        }
        return acc;
      }, {});

      // Articles les plus commandés
      const articlesCount = {};
      periodCommandes.forEach(c => {
        c.articles?.forEach(art => {
          articlesCount[art] = (articlesCount[art] || 0) + 1;
        });
      });

      const topArticles = Object.entries(articlesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

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
      doc.text(lang === 'fr' ? 'RAPPORT COMMANDES MATÉRIEL' : 'MATERIAL ORDERS REPORT', 105, y, { align: 'center' });
      y += 10;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(format(debut, 'MMMM yyyy', { locale: fr }).toUpperCase(), 105, y, { align: 'center' });
      y += 15;

      // Stats globales
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 119, 168);
      doc.text(lang === 'fr' ? 'STATISTIQUES GLOBALES' : 'GLOBAL STATISTICS', 15, y);
      y += 8;

      doc.autoTable({
        startY: y,
        head: [[lang === 'fr' ? 'Métrique' : 'Metric', lang === 'fr' ? 'Valeur' : 'Value']],
        body: [
          [lang === 'fr' ? 'Total commandes' : 'Total orders', periodCommandes.length],
          [lang === 'fr' ? 'À commander' : 'To order', periodCommandes.filter(c => c.statut === 'A_COMMANDER').length],
          [lang === 'fr' ? 'Commandées' : 'Ordered', periodCommandes.filter(c => c.statut === 'COMMANDEE').length],
          [lang === 'fr' ? 'Reçues' : 'Received', periodCommandes.filter(c => c.statut === 'RECUE').length],
        ],
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        margin: { left: 15, right: 15 }
      });

      y = doc.lastAutoTable.finalY + 10;

      // Par service
      if (Object.keys(parService).length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 119, 168);
        doc.text(lang === 'fr' ? 'PAR SERVICE' : 'BY SERVICE', 15, y);
        y += 8;

        doc.autoTable({
          startY: y,
          head: [[
            lang === 'fr' ? 'Service' : 'Service',
            lang === 'fr' ? 'Total' : 'Total',
            lang === 'fr' ? 'À cmd.' : 'To order',
            lang === 'fr' ? 'Cmd.' : 'Ordered',
            lang === 'fr' ? 'Reçues' : 'Received'
          ]],
          body: Object.entries(parService).map(([service, stats]) => [
            service === 'TECHNIQUE' ? '🔧 Technique' : '🧹 Ménage',
            stats.count,
            stats.aCommander,
            stats.commandees,
            stats.recues
          ]),
          theme: 'grid',
          headStyles: { fillColor: [0, 174, 239], textColor: 255 },
          margin: { left: 15, right: 15 }
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      // Par type d'intervention
      if (Object.keys(parTypeIntervention).length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 119, 168);
        doc.text(lang === 'fr' ? 'PAR TYPE D\'INTERVENTION' : 'BY INTERVENTION TYPE', 15, y);
        y += 8;

        doc.autoTable({
          startY: y,
          head: [[
            lang === 'fr' ? 'Type' : 'Type',
            lang === 'fr' ? 'Commandes' : 'Orders'
          ]],
          body: Object.entries(parTypeIntervention).map(([type, stats]) => [
            type === 'HIVERNAGE' ? '❄️ Hivernage' :
            type === 'DESHIVERNAGE' ? '🌞 Déshivernage' : type,
            stats.count
          ]),
          theme: 'grid',
          headStyles: { fillColor: [255, 165, 0], textColor: 255 },
          margin: { left: 15, right: 15 }
        });

        y = doc.lastAutoTable.finalY + 10;
      }

      // Top articles commandés
      if (topArticles.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 119, 168);
        doc.text(lang === 'fr' ? 'TOP 15 ARTICLES COMMANDÉS' : 'TOP 15 ORDERED ITEMS', 15, y);
        y += 8;

        doc.autoTable({
          startY: y,
          head: [[lang === 'fr' ? 'Article' : 'Item', lang === 'fr' ? 'Quantité' : 'Quantity']],
          body: topArticles.map(([art, count]) => [art, count]),
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          bodyStyles: { fontSize: 9 },
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
      const fileName = `Rapport_Commandes_${format(debut, 'yyyy-MM')}.pdf`;
      doc.save(fileName);

      toast.dismiss('pdf-commandes');
      toast.success(lang === 'fr' ? 'Rapport téléchargé ✅' : 'Report downloaded ✅');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.dismiss('pdf-commandes');
      toast.error(lang === 'fr' ? 'Erreur génération PDF' : 'PDF generation error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-purple-500 rounded-xl">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-heading text-xl text-[#0077A8] flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          {lang === 'fr' ? 'Rapport Commandes Matériel' : 'Material Orders Report'}
        </h3>
        
        <p className="text-sm text-gray-600">
          {lang === 'fr'
            ? 'Analyse des commandes de matériel par service et type d\'intervention avec articles les plus commandés.'
            : 'Analysis of material orders by service and intervention type with most ordered items.'}
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
          className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-xl"
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