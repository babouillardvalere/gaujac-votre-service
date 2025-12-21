import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Download, Loader2, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PDFRapportMensuel({ incidents = [], lang = 'fr' }) {
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const generatePDF = async () => {
    setGenerating(true);
    toast.loading(lang === 'fr' ? 'Génération du rapport mensuel...' : 'Generating monthly report...', { id: 'pdf-mensuel' });

    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const debut = startOfMonth(selectedMonth);
      const fin = endOfMonth(selectedMonth);

      // Filtrer incidents de la période
      const periodIncidents = incidents.filter(i => {
        const d = new Date(i.date_saisie);
        return d >= debut && d <= fin;
      });

      const resolus = periodIncidents.filter(i => i.statut === 'resolu');
      const techniques = periodIncidents.filter(i => i.type === 'technique');
      const menage = periodIncidents.filter(i => i.type === 'menage');

      // Calcul temps moyens
      const tempsResolution = resolus
        .filter(i => i.temps_total_intervention)
        .map(i => i.temps_total_intervention);
      
      const tempsMoyenTech = techniques
        .filter(i => i.statut === 'resolu' && i.temps_total_intervention)
        .map(i => i.temps_total_intervention);
      
      const tempsMoyenMenage = menage
        .filter(i => i.statut === 'resolu' && i.temps_total_intervention)
        .map(i => i.temps_total_intervention);

      const avgResolution = tempsResolution.length > 0
        ? Math.round(tempsResolution.reduce((a, b) => a + b, 0) / tempsResolution.length)
        : 0;

      const avgTech = tempsMoyenTech.length > 0
        ? Math.round(tempsMoyenTech.reduce((a, b) => a + b, 0) / tempsMoyenTech.length)
        : 0;

      const avgMenage = tempsMoyenMenage.length > 0
        ? Math.round(tempsMoyenMenage.reduce((a, b) => a + b, 0) / tempsMoyenMenage.length)
        : 0;

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
      doc.text(lang === 'fr' ? 'RAPPORT MENSUEL - INTERVENTIONS' : 'MONTHLY REPORT - INTERVENTIONS', 105, y, { align: 'center' });
      y += 10;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(format(debut, 'MMMM yyyy', { locale: fr }).toUpperCase(), 105, y, { align: 'center' });
      y += 15;

      // Section globale
      doc.setFontSize(14);
      doc.setTextColor(0, 119, 168);
      doc.setFont(undefined, 'bold');
      doc.text(lang === 'fr' ? 'VUE D\'ENSEMBLE' : 'OVERVIEW', 15, y);
      y += 8;

      doc.autoTable({
        startY: y,
        head: [[lang === 'fr' ? 'Métrique' : 'Metric', lang === 'fr' ? 'Valeur' : 'Value']],
        body: [
          [lang === 'fr' ? 'Total interventions' : 'Total interventions', periodIncidents.length],
          [lang === 'fr' ? 'Interventions techniques' : 'Technical interventions', techniques.length],
          [lang === 'fr' ? 'Interventions ménage' : 'Housekeeping interventions', menage.length],
          [lang === 'fr' ? 'Résolues' : 'Resolved', resolus.length],
          [lang === 'fr' ? 'En cours' : 'In progress', periodIncidents.filter(i => i.statut === 'en_cours').length],
          [lang === 'fr' ? 'Urgences' : 'Emergencies', periodIncidents.filter(i => i.urgent).length],
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 119, 168], textColor: 255 },
        margin: { left: 15, right: 15 }
      });

      y = doc.lastAutoTable.finalY + 10;

      // Section temps
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 119, 168);
      doc.text(lang === 'fr' ? 'TEMPS DE RÉSOLUTION' : 'RESOLUTION TIME', 15, y);
      y += 8;

      doc.autoTable({
        startY: y,
        head: [[lang === 'fr' ? 'Service' : 'Service', lang === 'fr' ? 'Temps moyen (min)' : 'Avg time (min)', lang === 'fr' ? 'Interventions résolues' : 'Resolved interventions']],
        body: [
          [lang === 'fr' ? '🔧 Technique' : '🔧 Technical', avgTech || '-', tempsMoyenTech.length],
          [lang === 'fr' ? '🧹 Ménage' : '🧹 Housekeeping', avgMenage || '-', tempsMoyenMenage.length],
          [lang === 'fr' ? 'MOYENNE GLOBALE' : 'GLOBAL AVERAGE', avgResolution || '-', tempsResolution.length],
        ],
        theme: 'grid',
        headStyles: { fillColor: [255, 215, 0], textColor: [0, 119, 168] },
        margin: { left: 15, right: 15 }
      });

      y = doc.lastAutoTable.finalY + 10;

      // Par catégorie
      const parCategorie = periodIncidents.reduce((acc, i) => {
        acc[i.categorie] = (acc[i.categorie] || 0) + 1;
        return acc;
      }, {});

      const topCategories = Object.entries(parCategorie)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      if (topCategories.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 119, 168);
        doc.text(lang === 'fr' ? 'TOP 10 CATÉGORIES' : 'TOP 10 CATEGORIES', 15, y);
        y += 8;

        doc.autoTable({
          startY: y,
          head: [[lang === 'fr' ? 'Catégorie' : 'Category', lang === 'fr' ? 'Nombre' : 'Count']],
          body: topCategories.map(([cat, count]) => [cat, count]),
          theme: 'grid',
          headStyles: { fillColor: [0, 174, 239], textColor: 255 },
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
      const fileName = `Rapport_Mensuel_${format(debut, 'yyyy-MM')}.pdf`;
      doc.save(fileName);

      toast.dismiss('pdf-mensuel');
      toast.success(lang === 'fr' ? 'Rapport téléchargé ✅' : 'Report downloaded ✅');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.dismiss('pdf-mensuel');
      toast.error(lang === 'fr' ? 'Erreur génération PDF' : 'PDF generation error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-[#00AEEF] rounded-xl">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-heading text-xl text-[#0077A8] flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {lang === 'fr' ? 'Rapport Mensuel Interventions' : 'Monthly Interventions Report'}
        </h3>
        
        <p className="text-sm text-gray-600">
          {lang === 'fr' 
            ? 'Statistiques complètes des interventions techniques et ménage avec temps moyens de résolution.'
            : 'Complete statistics of technical and housekeeping interventions with average resolution times.'}
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
          className="w-full bg-[#00AEEF] hover:bg-[#0077A8] h-12 rounded-xl"
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