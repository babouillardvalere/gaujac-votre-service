import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Mail } from 'lucide-react';
import { toast } from 'sonner';

// Logo Camping Paradis en base64 (placeholder - sera chargé dynamiquement)
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6930cc5060a27d8dfd0bf5fd/aa24decb4_logo.png";

// Couleurs charte Camping Paradis
const COLORS = {
  blue: [0, 174, 239],      // #00AEEF
  blueDark: [0, 119, 168],  // #0077A8
  yellow: [255, 215, 0],    // #FFD700
  orange: [255, 165, 0],    // #FFA500
  white: [255, 255, 255],
  gray: [100, 100, 100],
  lightGray: [240, 240, 240],
  red: [220, 53, 69],
  green: [40, 167, 69]
};

// Convertir une image URL en base64
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
    console.error('Erreur chargement image:', error);
    return null;
  }
};

// Fonction pour déterminer le type de priorité
const getPriorityInfo = (incident) => {
  if (incident.urgent) {
    return { label: '🔴 URGENT', color: COLORS.red };
  }
  if (incident.autorisation_acces === 'non' && incident.plage_horaire_client) {
    return { label: '🔵 Programmée (' + incident.plage_horaire_client + ')', color: COLORS.blue };
  }
  return { label: '🟡 Normal', color: COLORS.yellow };
};

export const generateLitigePDF = async (incident, logs = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Charger le logo
  let logoBase64 = null;
  try {
    logoBase64 = await loadImageAsBase64(LOGO_URL);
  } catch (e) {
    console.log('Logo non chargé');
  }

  // ============ BANNIÈRE TITRE ============
  doc.setFillColor(...COLORS.blue);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo centré
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 20, 5, 40, 20);
    } catch (e) {}
  }

  // Titre
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT DE LITIGE', pageWidth / 2, 32, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('CAMPING PARADIS — DOMAINE DE GAUJAC', pageWidth / 2, 38, { align: 'center' });

  // Date de génération
  doc.setFontSize(8);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, pageWidth / 2, 43, { align: 'center' });

  y = 55;

  // ============ SECTION 1: INFORMATIONS INTERVENTION ============
  doc.setFillColor(...COLORS.blue);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. INFORMATIONS INTERVENTION', margin + 3, y + 5.5);
  y += 12;

  // Tableau infos
  const infoRows = [
    ['ID Intervention', incident.id || '-'],
    ['Signalement', incident.date_saisie ? format(new Date(incident.date_saisie), 'dd/MM/yyyy HH:mm') : '-'],
    ['Résolution', incident.date_resolution ? format(new Date(incident.date_resolution), 'dd/MM/yyyy HH:mm') : '-'],
    ['Catégorie', `${incident.type === 'technique' ? '🛠 Technique' : '🧹 Ménage'} - ${incident.categorie || '-'}`],
    ['Priorité', getPriorityInfo(incident).label]
  ];

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  infoRows.forEach((row, i) => {
    const isEven = i % 2 === 0;
    if (isEven) {
      doc.setFillColor(...COLORS.lightGray);
      doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], margin + 60, y + 5);
    y += 7;
  });

  y += 5;

  // ============ SECTION 2: INFORMATIONS CLIENT ============
  doc.setFillColor(...COLORS.green);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. INFORMATIONS CLIENT', margin + 3, y + 5.5);
  y += 12;

  const clientRows = [
    ['Nom', incident.client_nom || '-'],
    ['Prénom', incident.client_prenom || '-'],
    ['Séjour', `${incident.date_arrivee || '-'} → ${incident.date_depart || '-'}`],
    ['Autorisation accès', incident.autorisation_acces === 'oui' ? '✅ Oui' : (incident.autorisation_acces === 'non' ? '❌ Non' : '-')]
  ];

  if (incident.plage_horaire_client && incident.autorisation_acces === 'non') {
    clientRows.push(['Plage horaire demandée', incident.plage_horaire_client]);
  }

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  clientRows.forEach((row, i) => {
    const isEven = i % 2 === 0;
    if (isEven) {
      doc.setFillColor(...COLORS.lightGray);
      doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], margin + 60, y + 5);
    y += 7;
  });

  y += 5;

  // ============ SECTION 3: HÉBERGEMENT ============
  doc.setFillColor(...COLORS.yellow);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(...COLORS.blueDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. HÉBERGEMENT / EMPLACEMENT', margin + 3, y + 5.5);
  y += 12;

  const hebergementRows = [
    ['Type', incident.logement ? '🏠 Mobil-home / Cottage' : '⛺ Emplacement'],
    ['Numéro', incident.logement || incident.emplacement || '-']
  ];

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  hebergementRows.forEach((row, i) => {
    const isEven = i % 2 === 0;
    if (isEven) {
      doc.setFillColor(...COLORS.lightGray);
      doc.rect(margin, y, pageWidth - 2 * margin, 7, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], margin + 60, y + 5);
    y += 7;
  });

  y += 5;

  // ============ SECTION 4: DESCRIPTION DU PROBLÈME ============
  doc.setFillColor(...COLORS.orange);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('4. DESCRIPTION DU PROBLÈME', margin + 3, y + 5.5);
  y += 12;

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Bordure pour la description
  doc.setDrawColor(...COLORS.orange);
  doc.setLineWidth(0.5);
  
  const descriptionText = incident.description || 'Aucune description fournie.';
  const splitDescription = doc.splitTextToSize(descriptionText, pageWidth - 2 * margin - 10);
  const descHeight = Math.max(splitDescription.length * 5 + 6, 20);
  
  doc.rect(margin, y, pageWidth - 2 * margin, descHeight, 'S');
  doc.text(splitDescription, margin + 5, y + 5);
  y += descHeight + 5;

  // ============ SECTION 5: PREUVES PHOTOGRAPHIQUES ============
  // Nouvelle page si nécessaire
  if (y > pageHeight - 100) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(...COLORS.blueDark);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('5. PREUVES PHOTOGRAPHIQUES', margin + 3, y + 5.5);
  y += 12;

  const photoWidth = 75;
  const photoHeight = 50;

  // Photo AVANT
  doc.setTextColor(...COLORS.orange);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('📷 Photo AVANT intervention', margin, y + 5);
  y += 8;

  if (incident.photo_avant_url) {
    try {
      const photoAvantBase64 = await loadImageAsBase64(incident.photo_avant_url);
      if (photoAvantBase64) {
        doc.addImage(photoAvantBase64, 'JPEG', margin, y, photoWidth, photoHeight);
      }
    } catch (e) {
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(8);
      doc.text('Image non disponible', margin + 5, y + 25);
    }
    
    // Infos photo
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const photoAvantInfos = [
      `Horodatage: ${incident.photo_avant_timestamp ? format(new Date(incident.photo_avant_timestamp), 'dd/MM/yyyy HH:mm:ss') : '-'}`,
      `Collaborateur: ${incident.pris_par || '-'}`,
      `Hash SHA-256: ${incident.photo_avant_hash ? incident.photo_avant_hash.substring(0, 32) + '...' : '-'}`
    ];
    photoAvantInfos.forEach((info, i) => {
      doc.text(info, margin + photoWidth + 5, y + 10 + i * 5);
    });
  } else {
    doc.setFillColor(...COLORS.lightGray);
    doc.rect(margin, y, photoWidth, photoHeight, 'F');
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(8);
    doc.text('Aucune photo AVANT', margin + 15, y + 25);
  }

  y += photoHeight + 10;

  // Photo APRÈS
  doc.setTextColor(...COLORS.green);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('📷 Photo APRÈS intervention', margin, y + 5);
  y += 8;

  if (incident.photo_apres_url) {
    try {
      const photoApresBase64 = await loadImageAsBase64(incident.photo_apres_url);
      if (photoApresBase64) {
        doc.addImage(photoApresBase64, 'JPEG', margin, y, photoWidth, photoHeight);
      }
    } catch (e) {
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(8);
      doc.text('Image non disponible', margin + 5, y + 25);
    }
    
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const photoApresInfos = [
      `Horodatage: ${incident.photo_apres_timestamp ? format(new Date(incident.photo_apres_timestamp), 'dd/MM/yyyy HH:mm:ss') : '-'}`,
      `Collaborateur: ${incident.pris_par || '-'}`,
      `Hash SHA-256: ${incident.photo_apres_hash ? incident.photo_apres_hash.substring(0, 32) + '...' : '-'}`
    ];
    photoApresInfos.forEach((info, i) => {
      doc.text(info, margin + photoWidth + 5, y + 10 + i * 5);
    });
  } else {
    doc.setFillColor(...COLORS.lightGray);
    doc.rect(margin, y, photoWidth, photoHeight, 'F');
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(8);
    doc.text('Aucune photo APRÈS', margin + 15, y + 25);
  }

  y += photoHeight + 10;

  // ============ SECTION 6: CHRONOLOGIE DÉTAILLÉE ============
  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(...COLORS.blueDark);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('6. CHRONOLOGIE DÉTAILLÉE', margin + 3, y + 5.5);
  y += 12;

  const chronologie = [];
  
  if (incident.date_saisie) {
    chronologie.push({
      date: format(new Date(incident.date_saisie), 'dd/MM/yyyy HH:mm'),
      action: 'Création du signalement',
      responsable: `Client: ${incident.client_prenom} ${incident.client_nom}`
    });
  }
  
  if (incident.date_debut) {
    chronologie.push({
      date: format(new Date(incident.date_debut), 'dd/MM/yyyy HH:mm'),
      action: 'Prise en charge',
      responsable: incident.pris_par || '-'
    });
  }
  
  if (incident.attente_date) {
    chronologie.push({
      date: format(new Date(incident.attente_date), 'dd/MM/yyyy HH:mm'),
      action: `Mise en attente${incident.motif_attente ? ': ' + incident.motif_attente : ''}`,
      responsable: incident.pris_par || '-'
    });
  }
  
  if (incident.date_resolution) {
    chronologie.push({
      date: format(new Date(incident.date_resolution), 'dd/MM/yyyy HH:mm'),
      action: 'Résolution',
      responsable: incident.pris_par || '-'
    });
  }

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  
  chronologie.forEach((event, i) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(`[${event.date}]`, margin + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`• ${event.action}`, margin + 45, y + 5);
    doc.text(`— ${event.responsable}`, margin + 120, y + 5);
    y += 7;
  });

  y += 8;

  // ============ SECTION 7: REMARQUES INTERVENANT ============
  if (incident.commentaire_interne) {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(...COLORS.gray);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('7. REMARQUES DE L\'INTERVENANT', margin + 3, y + 5.5);
    y += 12;

    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitComment = doc.splitTextToSize(incident.commentaire_interne, pageWidth - 2 * margin - 10);
    doc.text(splitComment, margin + 3, y + 5);
    y += splitComment.length * 5 + 10;
  }

  // ============ SECTION 8: RÉSUMÉ TECHNIQUE (PREUVE JURIDIQUE) ============
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(...COLORS.red);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('8. RÉSUMÉ TECHNIQUE (PREUVE JURIDIQUE)', margin + 3, y + 5.5);
  y += 12;

  doc.setDrawColor(...COLORS.red);
  doc.setLineWidth(1);
  doc.rect(margin, y, pageWidth - 2 * margin, 35, 'S');

  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  const techInfos = [
    `🔐 ID Intervention: ${incident.id}`,
    `👤 Intervenant: ${incident.pris_par || 'Non renseigné'}`,
    `📧 Créé par: ${incident.created_by || '-'}`,
    `📷 Hash Photo AVANT: ${incident.photo_avant_hash || 'Non disponible'}`,
    `📷 Hash Photo APRÈS: ${incident.photo_apres_hash || 'Non disponible'}`,
    `📅 Document généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`
  ];

  techInfos.forEach((info, i) => {
    doc.text(info, margin + 3, y + 5 + i * 5);
  });

  // Pied de page sur toutes les pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...COLORS.blue);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(7);
    doc.text(
      `Camping Paradis — Domaine de Gaujac | Page ${i}/${totalPages} | Document confidentiel`,
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    );
  }

  return doc;
};

export default function LitigePDFGenerator({ incident, onClose }) {
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');

  const handleDownloadPDF = async () => {
    setGenerating(true);
    try {
      const doc = await generateLitigePDF(incident);
      doc.save(`rapport_litige_${incident.logement || incident.emplacement}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast.error('Veuillez saisir une adresse email');
      return;
    }
    
    setSending(true);
    try {
      // Générer le PDF
      const doc = await generateLitigePDF(incident);
      const pdfBlob = doc.output('blob');
      
      // Uploader le PDF
      const file = new File([pdfBlob], `rapport_litige_${incident.id}.pdf`, { type: 'application/pdf' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Envoyer l'email avec le lien vers le PDF
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `Camping Paradis - Rapport de Litige #${incident.logement || incident.emplacement}`,
        body: `Bonjour,

Veuillez trouver ci-joint le rapport de litige de l'intervention #${incident.logement || incident.emplacement}.

📎 Télécharger le rapport PDF: ${file_url}

---
Client: ${incident.client_prenom} ${incident.client_nom}
Hébergement: ${incident.logement || incident.emplacement}
Date signalement: ${incident.date_saisie ? format(new Date(incident.date_saisie), 'dd/MM/yyyy HH:mm') : '-'}
Date résolution: ${incident.date_resolution ? format(new Date(incident.date_resolution), 'dd/MM/yyyy HH:mm') : '-'}

---
Camping Paradis — Domaine de Gaujac
Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`
      });

      toast.success('Email envoyé avec succès');
      setEmail('');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bouton télécharger PDF */}
      <Button
        onClick={handleDownloadPDF}
        disabled={generating}
        className="w-full bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl h-12"
      >
        {generating ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Download className="w-5 h-5 mr-2" />
        )}
        Télécharger le PDF du rapport
      </Button>

      {/* Envoi par email */}
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#00AEEF]"
        />
        <Button
          onClick={handleSendEmail}
          disabled={sending || !email}
          className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Mail className="w-4 h-4 mr-2" />
          )}
          Envoyer
        </Button>
      </div>
    </div>
  );
}