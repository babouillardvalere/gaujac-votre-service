import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { format, differenceInMinutes } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Mail, Eye } from 'lucide-react';
import { toast } from 'sonner';

// Logo Camping Paradis
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6930cc5060a27d8dfd0bf5fd/aa24decb4_logo.png";

// Couleurs charte Camping Paradis
const COLORS = {
  blue: [0, 174, 239],
  blueDark: [0, 119, 168],
  yellow: [255, 215, 0],
  orange: [255, 165, 0],
  white: [255, 255, 255],
  gray: [100, 100, 100],
  lightGray: [240, 240, 240],
  red: [220, 53, 69],
  green: [40, 167, 69]
};

// Traductions
const translations = {
  fr: {
    title: 'RAPPORT AUTOMATIQUE',
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    generated: 'Date de génération',
    period: 'Période',
    to: 'au',
    summary: 'RÉSUMÉ GLOBAL',
    totalInterventions: 'Total interventions',
    avgResolutionTime: 'Temps moyen résolution',
    urgentRate: 'Interventions urgentes',
    resolvedRate: 'Taux de résolution',
    avgClientRating: 'Note moyenne clients',
    categoryBreakdown: 'RÉPARTITION PAR CATÉGORIE',
    technique: 'Technique',
    menage: 'Ménage',
    nuisibles: 'Nuisibles',
    other: 'Autre',
    interventionsTable: 'DÉTAIL DES INTERVENTIONS',
    id: 'ID',
    type: 'Type',
    category: 'Catégorie',
    urgent: 'Urgence',
    date: 'Date',
    accommodation: 'Hébergement',
    resolution: 'Résolution',
    duration: 'Durée',
    technician: 'Collaborateur',
    yes: 'Oui',
    no: 'Non',
    clientReviews: 'AVIS CLIENTS',
    client: 'Client',
    stay: 'Séjour',
    reactivity: 'Réactivité',
    friendliness: 'Amabilité',
    quality: 'Qualité',
    comment: 'Commentaire',
    minutes: 'min',
    hours: 'h',
    noData: 'Aucune donnée',
    accommodationBreakdown: 'RÉPARTITION PAR HÉBERGEMENT',
    timeEvolution: 'ÉVOLUTION TEMPORELLE',
    topCollaborators: 'TOP COLLABORATEURS',
    interventions: 'interventions',
    footerText: 'Camping Paradis — Domaine de Gaujac | Document confidentiel',
    emailSubject: 'Rapport',
    emailBody: 'Bonjour,\n\nVeuillez trouver ci-joint le rapport {type}.\n\nCamping Paradis – Domaine de Gaujac\nMerci et bonne journée.'
  },
  en: {
    title: 'AUTOMATIC REPORT',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    generated: 'Generation date',
    period: 'Period',
    to: 'to',
    summary: 'GLOBAL SUMMARY',
    totalInterventions: 'Total interventions',
    avgResolutionTime: 'Avg resolution time',
    urgentRate: 'Urgent interventions',
    resolvedRate: 'Resolution rate',
    avgClientRating: 'Avg client rating',
    categoryBreakdown: 'BREAKDOWN BY CATEGORY',
    technique: 'Technical',
    menage: 'Housekeeping',
    nuisibles: 'Pests',
    other: 'Other',
    interventionsTable: 'INTERVENTIONS DETAILS',
    id: 'ID',
    type: 'Type',
    category: 'Category',
    urgent: 'Urgent',
    date: 'Date',
    accommodation: 'Accommodation',
    resolution: 'Resolution',
    duration: 'Duration',
    technician: 'Technician',
    yes: 'Yes',
    no: 'No',
    clientReviews: 'CLIENT REVIEWS',
    client: 'Client',
    stay: 'Stay',
    reactivity: 'Responsiveness',
    friendliness: 'Friendliness',
    quality: 'Quality',
    comment: 'Comment',
    minutes: 'min',
    hours: 'h',
    noData: 'No data',
    accommodationBreakdown: 'BREAKDOWN BY ACCOMMODATION',
    timeEvolution: 'TIME EVOLUTION',
    topCollaborators: 'TOP COLLABORATORS',
    interventions: 'interventions',
    footerText: 'Camping Paradis — Domaine de Gaujac | Confidential document',
    emailSubject: 'Report',
    emailBody: 'Hello,\n\nPlease find attached the {type} report.\n\nCamping Paradis – Domaine de Gaujac\nThank you and have a great day.'
  }
};

// Charger image en base64
const loadImageAsBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
};

// Formater durée
const formatDuration = (minutes, lang) => {
  const t = translations[lang];
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes} ${t.minutes}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}${t.hours} ${m}${t.minutes}` : `${h}${t.hours}`;
};

// Dessiner un bar chart simple
const drawBarChart = (doc, data, x, y, width, height, colors, lang) => {
  if (!data || data.length === 0) return;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = (width - 20) / data.length - 5;
  const chartHeight = height - 25;
  
  // Axe Y
  doc.setDrawColor(...COLORS.gray);
  doc.setLineWidth(0.3);
  doc.line(x, y, x, y + chartHeight);
  doc.line(x, y + chartHeight, x + width - 10, y + chartHeight);
  
  // Barres
  data.forEach((item, i) => {
    const barHeight = (item.value / maxValue) * (chartHeight - 10);
    const barX = x + 10 + i * (barWidth + 5);
    const barY = y + chartHeight - barHeight;
    
    const color = colors[i % colors.length];
    doc.setFillColor(...color);
    doc.rect(barX, barY, barWidth, barHeight, 'F');
    
    // Valeur au-dessus
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.gray);
    doc.text(String(item.value), barX + barWidth / 2, barY - 2, { align: 'center' });
    
    // Label en dessous
    doc.setFontSize(6);
    const label = item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label;
    doc.text(label, barX + barWidth / 2, y + chartHeight + 5, { align: 'center' });
  });
};

// Dessiner un pie chart simple
const drawPieChart = (doc, data, centerX, centerY, radius, colors) => {
  if (!data || data.length === 0) return;
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return;
  
  let startAngle = -Math.PI / 2;
  
  data.forEach((item, i) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    
    // Dessiner le secteur
    const color = colors[i % colors.length];
    doc.setFillColor(...color);
    
    // Approximation par triangles
    const steps = Math.max(Math.floor(sliceAngle * 20), 3);
    for (let j = 0; j < steps; j++) {
      const a1 = startAngle + (j / steps) * sliceAngle;
      const a2 = startAngle + ((j + 1) / steps) * sliceAngle;
      
      const x1 = centerX + Math.cos(a1) * radius;
      const y1 = centerY + Math.sin(a1) * radius;
      const x2 = centerX + Math.cos(a2) * radius;
      const y2 = centerY + Math.sin(a2) * radius;
      
      doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
    }
    
    // Légende
    const legendY = centerY - radius + i * 8;
    doc.setFillColor(...color);
    doc.rect(centerX + radius + 10, legendY, 4, 4, 'F');
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.gray);
    const percent = Math.round((item.value / total) * 100);
    doc.text(`${item.label} (${percent}%)`, centerX + radius + 17, legendY + 3);
    
    startAngle = endAngle;
  });
};

// Générer le PDF du rapport
export const generateRapportPDF = async (type, metriques, incidents, avis, lang = 'fr') => {
  const t = translations[lang];
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const typeLabels = { quotidien: t.daily, hebdomadaire: t.weekly, mensuel: t.monthly };
  const dateLocale = lang === 'fr' ? fr : enUS;

  // Charger le logo
  let logoBase64 = null;
  try {
    logoBase64 = await loadImageAsBase64(LOGO_URL);
  } catch (e) {}

  // ============ BANNIÈRE TITRE ============
  doc.setFillColor(...COLORS.blue);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 25, 3, 50, 22);
    } catch (e) {}
  }

  // Titre
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${t.title} — ${typeLabels[type] || type}`, pageWidth / 2, 32, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Camping Paradis – Domaine de Gaujac', pageWidth / 2, 39, { align: 'center' });

  doc.setFontSize(8);
  doc.text(`${t.generated}: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}`, pageWidth / 2, 46, { align: 'center' });

  y = 58;

  // Période
  if (metriques?.periode) {
    doc.setTextColor(...COLORS.blueDark);
    doc.setFontSize(10);
    doc.text(`${t.period}: ${metriques.periode.debut} ${t.to} ${metriques.periode.fin}`, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }

  // ============ SECTION RÉSUMÉ GLOBAL ============
  doc.setFillColor(...COLORS.blueDark);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`📊 ${t.summary}`, margin + 3, y + 5.5);
  y += 12;

  // KPIs en grille
  const kpis = [];
  if (metriques?.total !== undefined) {
    kpis.push({ label: t.totalInterventions, value: metriques.total });
  }
  if (metriques?.avgResolution !== undefined) {
    kpis.push({ label: t.avgResolutionTime, value: formatDuration(metriques.avgResolution, lang) });
  }
  if (metriques?.urgences !== undefined && metriques?.total > 0) {
    const urgentPercent = Math.round((metriques.urgences / metriques.total) * 100);
    kpis.push({ label: t.urgentRate, value: `${metriques.urgences} (${urgentPercent}%)` });
  }
  if (metriques?.resolus !== undefined && metriques?.total > 0) {
    const resolvedPercent = Math.round((metriques.resolus / metriques.total) * 100);
    kpis.push({ label: t.resolvedRate, value: `${resolvedPercent}%` });
  }
  if (metriques?.avis?.avgGlobale) {
    kpis.push({ label: t.avgClientRating, value: `${metriques.avis.avgGlobale}/5 ⭐` });
  }

  // Afficher KPIs
  const kpiWidth = (pageWidth - 2 * margin) / Math.min(kpis.length, 4);
  kpis.slice(0, 4).forEach((kpi, i) => {
    const kpiX = margin + i * kpiWidth;
    
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(kpiX + 2, y, kpiWidth - 4, 20, 3, 3, 'F');
    
    doc.setTextColor(...COLORS.blueDark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(kpi.value), kpiX + kpiWidth / 2, y + 10, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(kpi.label, kpiX + kpiWidth / 2, y + 17, { align: 'center' });
  });

  y += 28;

  // ============ GRAPHIQUES ============
  const chartColors = [COLORS.blue, COLORS.yellow, COLORS.orange, COLORS.green, COLORS.red, COLORS.blueDark];

  // Répartition par catégorie (Pie Chart)
  if (metriques?.parCategorie && Object.keys(metriques.parCategorie).length > 0) {
    doc.setFillColor(...COLORS.yellow);
    doc.rect(margin, y, (pageWidth - 2 * margin) / 2 - 5, 8, 'F');
    doc.setTextColor(...COLORS.blueDark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`📈 ${t.categoryBreakdown}`, margin + 3, y + 5.5);

    const categoryData = Object.entries(metriques.parCategorie)
      .map(([key, value]) => ({ label: key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    drawPieChart(doc, categoryData, margin + 35, y + 40, 25, chartColors);
    
    y += 75;
  }

  // Répartition par hébergement (Bar Chart)
  if (metriques?.parHebergement && Object.keys(metriques.parHebergement).length > 0) {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(...COLORS.orange);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`🏠 ${t.accommodationBreakdown}`, margin + 3, y + 5.5);
    y += 12;

    const hebergementData = Object.entries(metriques.parHebergement)
      .map(([key, value]) => ({ label: key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    drawBarChart(doc, hebergementData, margin, y, pageWidth - 2 * margin, 50, chartColors, lang);
    y += 55;
  }

  // Top collaborateurs
  if (metriques?.parCollaborateur && Object.keys(metriques.parCollaborateur).length > 0) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(...COLORS.green);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`👷 ${t.topCollaborators}`, margin + 3, y + 5.5);
    y += 12;

    const collabData = Object.entries(metriques.parCollaborateur)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(9);
    collabData.forEach(([name, count], i) => {
      const barWidth = (count / collabData[0][1]) * 100;
      doc.setFillColor(...chartColors[i % chartColors.length]);
      doc.rect(margin + 40, y + 1, barWidth, 5, 'F');
      doc.setFont('helvetica', 'normal');
      doc.text(name, margin + 3, y + 5);
      doc.text(`${count}`, margin + 145, y + 5);
      y += 8;
    });
    y += 5;
  }

  // ============ TABLEAU DES INTERVENTIONS ============
  if (incidents && incidents.length > 0) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(...COLORS.blueDark);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`📋 ${t.interventionsTable}`, margin + 3, y + 5.5);
    y += 12;

    // En-têtes
    const colWidths = [15, 18, 25, 12, 25, 22, 22, 15, 25];
    const headers = [t.id.substring(0, 3), t.type, t.category, t.urgent.substring(0, 3), t.date, t.accommodation, t.resolution, t.duration.substring(0, 3), t.technician];
    
    doc.setFillColor(...COLORS.lightGray);
    doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
    doc.setTextColor(...COLORS.blueDark);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    
    let colX = margin + 1;
    headers.forEach((header, i) => {
      doc.text(header, colX, y + 5);
      colX += colWidths[i];
    });
    y += 8;

    // Lignes
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    
    const maxRows = Math.min(incidents.length, 30);
    for (let i = 0; i < maxRows; i++) {
      if (y > pageHeight - 15) {
        doc.addPage();
        y = margin;
      }

      const inc = incidents[i];
      const duration = inc.temps_total_intervention || (inc.date_resolution && inc.date_saisie 
        ? differenceInMinutes(new Date(inc.date_resolution), new Date(inc.date_saisie)) 
        : null);

      const rowData = [
        (inc.id || '-').substring(0, 6),
        inc.type === 'technique' ? '🛠' : '🧹',
        (inc.categorie || '-').substring(0, 12),
        inc.urgent ? '🔴' : '⚪',
        inc.date_saisie ? format(new Date(inc.date_saisie), 'dd/MM HH:mm') : '-',
        (inc.logement || inc.emplacement || '-').substring(0, 10),
        inc.date_resolution ? format(new Date(inc.date_resolution), 'dd/MM HH:mm') : '-',
        duration ? `${duration}m` : '-',
        (inc.pris_par || '-').substring(0, 12)
      ];

      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 1, pageWidth - 2 * margin, 6, 'F');
      }

      colX = margin + 1;
      doc.setFontSize(5.5);
      rowData.forEach((cell, j) => {
        doc.text(String(cell), colX, y + 3);
        colX += colWidths[j];
      });
      y += 6;
    }

    if (incidents.length > maxRows) {
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gray);
      doc.text(`... ${lang === 'fr' ? 'et' : 'and'} ${incidents.length - maxRows} ${lang === 'fr' ? 'autres interventions' : 'more interventions'}`, margin, y + 3);
      y += 8;
    }
  }

  // ============ SECTION AVIS CLIENTS ============
  const goodAvis = avis?.filter(a => (a.note_globale || 0) >= 4) || [];
  if (goodAvis.length > 0) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(...COLORS.yellow);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(...COLORS.blueDark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`⭐ ${t.clientReviews} (4-5 ⭐)`, margin + 3, y + 5.5);
    y += 12;

    const maxAvis = Math.min(goodAvis.length, 10);
    for (let i = 0; i < maxAvis; i++) {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = margin;
      }

      const av = goodAvis[i];
      
      doc.setFillColor(...COLORS.lightGray);
      doc.rect(margin, y, pageWidth - 2 * margin, 18, 'F');

      doc.setTextColor(...COLORS.blueDark);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${av.client_prenom || ''} ${av.client_nom || ''} — ${av.logement_ou_emplacement || '-'}`, margin + 3, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(7);
      doc.text(`${t.stay}: ${av.date_arrivee || '-'} → ${av.date_depart || '-'}`, margin + 3, y + 10);
      
      const stars = '⭐'.repeat(Math.round(av.note_globale || 0));
      doc.text(`${t.reactivity}: ${av.note_reactivite}/5 | ${t.friendliness}: ${av.note_amabilite}/5 | ${t.quality}: ${av.note_intervention}/5 | ${stars}`, margin + 3, y + 14);

      if (av.commentaire) {
        doc.setFontSize(6);
        const comment = av.commentaire.length > 100 ? av.commentaire.substring(0, 100) + '...' : av.commentaire;
        doc.text(`"${comment}"`, margin + 3, y + 18);
      }

      y += 22;
    }
  }

  // ============ PIED DE PAGE ============
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...COLORS.blue);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.text(
      `${t.footerText} | Page ${i}/${totalPages}`,
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    );
  }

  return doc;
};

// Composant React pour les boutons
export default function RapportPDFGenerator({ type, metriques, incidents, avis, lang = 'fr', destinataires = [] }) {
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const t = translations[lang];
  const typeLabels = { quotidien: t.daily, hebdomadaire: t.weekly, mensuel: t.monthly };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const doc = await generateRapportPDF(type, metriques, incidents, avis, lang);
      doc.save(`rapport_${type}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
      toast.success(lang === 'fr' ? 'PDF téléchargé' : 'PDF downloaded');
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur génération PDF' : 'PDF generation error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async () => {
    setGenerating(true);
    try {
      const doc = await generateRapportPDF(type, metriques, incidents, avis, lang);
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur aperçu' : 'Preview error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (emailList) => {
    if (!emailList || emailList.length === 0) {
      toast.error(lang === 'fr' ? 'Aucun destinataire' : 'No recipients');
      return;
    }
    
    setSending(true);
    try {
      const doc = await generateRapportPDF(type, metriques, incidents, avis, lang);
      const pdfBlob = doc.output('blob');
      
      const file = new File([pdfBlob], `rapport_${type}.pdf`, { type: 'application/pdf' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const emailBody = t.emailBody.replace('{type}', typeLabels[type] || type);

      for (const email of emailList) {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Camping Paradis - ${t.emailSubject} ${typeLabels[type] || type}`,
          body: `${emailBody}\n\n📎 ${lang === 'fr' ? 'Télécharger le rapport' : 'Download report'}: ${file_url}`
        });
      }

      toast.success(lang === 'fr' ? 'Email envoyé' : 'Email sent');
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur envoi' : 'Send error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handlePreview}
        disabled={generating}
        variant="outline"
        size="sm"
        className="rounded-xl"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
        {lang === 'fr' ? 'Aperçu PDF' : 'Preview PDF'}
      </Button>
      
      <Button
        onClick={handleDownload}
        disabled={generating}
        size="sm"
        className="bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
        PDF
      </Button>
      
      {destinataires.length > 0 && (
        <Button
          onClick={() => handleSendEmail(destinataires)}
          disabled={sending}
          size="sm"
          className="bg-[#FFA500] hover:bg-[#e69500] text-white rounded-xl"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Mail className="w-4 h-4 mr-1" />}
          {lang === 'fr' ? 'Envoyer' : 'Send'}
        </Button>
      )}
    </div>
  );
}