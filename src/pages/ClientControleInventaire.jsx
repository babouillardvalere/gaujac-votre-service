import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "../api/base44Client";
import { createPageUrl } from "../utils";
import { useTranslation } from "../components/translations";
import Logo from "../components/Logo";
import SignaturePad from "../components/SignaturePad";
import ArriveeProgressBar from "../components/ArriveeProgressBar";
import { getInventaireParCategorie } from "../components/categoryCodeMapping";
import InventaireItemRow from "../components/InventaireItemRow";
import { ConfigurationLiterie, isLiterieTechnique } from "../components/literieConfig";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Smile, Meh, Frown, Send, Loader2, Home, Download, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { uploadFileWithRetry } from "../components/useRetry";

export default function ClientControleInventaire() {
  const { lang } = useTranslation();
  const navigate = useNavigate();

  const nom = sessionStorage.getItem("arrivee_nom");
  const prenom = sessionStorage.getItem("arrivee_prenom");
  const dateArrivee = sessionStorage.getItem("arrivee_date_arrivee");
  const dateDepart = sessionStorage.getItem("arrivee_date_depart");
  const categorie = sessionStorage.getItem("arrivee_categorie");
  const numero = sessionStorage.getItem("arrivee_numero");

  const [quantities, setQuantities] = useState({});
  const [photos, setPhotos] = useState({});
  const [remarques, setRemarques] = useState({});
  const [urgencies, setUrgencies] = useState({});
  const [problemesTechniques, setProblemesTechniques] = useState({});
  const [autorisationAcces, setAutorisationAcces] = useState("");
  const [plagesHoraires, setPlagesHoraires] = useState([]);
  const [evaluationProprete, setEvaluationProprete] = useState("");
  const [commentaireProprete, setCommentaireProprete] = useState("");
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [finalReceipt, setFinalReceipt] = useState(null);

  const inventaire = useMemo(() => getInventaireParCategorie(categorie, lang), [categorie, lang]);
  const items = inventaire?.objets || [];

  useEffect(() => {
    if (!nom || !prenom || !categorie || !numero || !dateArrivee || !dateDepart) {
      navigate(createPageUrl("ClientArriveeIdentite"));
    }
  }, []);

  const handleQuantityChange = (id, value) => {
    setQuantities(prev => ({ ...prev, [id]: value }));
  };

  const handlePhotosChange = (id, photoArray) => {
    setPhotos(prev => ({ ...prev, [id]: photoArray }));
  };

  const handleRemarqueChange = (id, text) => {
    setRemarques(prev => ({ ...prev, [id]: text }));
  };

  const handleUrgencyChange = (id, value) => {
    setUrgencies(prev => ({ ...prev, [id]: value }));
  };

  const handleProblemeTechnique = (id, value) => {
    setProblemesTechniques(prev => ({ ...prev, [id]: value }));
  };

  const analyzeAnomalies = () => {
    const menage = [];
    const technique = [];
    const reception = [];

    const ARTICLES_TECHNIQUES = [
      'tv', 'refrigerateur', 'micro_ondes', 'chauffage', 'plaques_cuisson', 'plaque_cuisson',
      'chauffe_eau', 'wc', 'douche', 'lavabo', 'robinet', 'feux_gaz', 'telecommande_clim', 'climatisation',
      'lave_vaisselle', 'congelateur', 'evier', 'cafetiere', 'hotte', 'cumulus', 'chauffe_eau_gaz',
      'seche_serviette', 'seche_cheveux', 'extincteur', 'detecteur_fumee',
      // LITERIE - Toujours TECHNIQUE
      'lit_double', 'lit_simple', 'lit_superpose', 'sommier', 'matelas'
    ];

    const ARTICLES_RECEPTION = [
      'cle_locatif', 'cle_locative', 'carte_barriere', 'badge', 'table_jardin', 'chaises_jardin',
      'salon_jardin', 'bancs_jardin', 'table_interieur', 'chaises_interieur'
    ];

    items.forEach(item => {
      const declared = quantities[item.id] !== undefined ? quantities[item.id] : item.quantity;
      const hasProblemeTechnique = problemesTechniques[item.id] || false;
      const hasAnomaly = declared < item.quantity || hasProblemeTechnique;

      if (hasAnomaly) {
        const obj = {
          id: item.id,
          label: item.label,
          emoji: item.icon,
          qtyAttendue: item.quantity,
          qtyDeclaree: declared,
          qtyManquante: item.quantity - declared,
          problemeTechnique: hasProblemeTechnique,
          urgent: urgencies[item.id] || false,
          photos: photos[item.id] || [],
          remarque: remarques[item.id] || ''
        };

        // Logique d'orientation automatique
        // PRIORITÉ 1: Literie = toujours TECHNIQUE
        if (isLiterieTechnique(item.id)) {
          technique.push(obj);
        }
        // PRIORITÉ 2: Articles techniques
        else if (ARTICLES_TECHNIQUES.includes(item.id)) {
          technique.push(obj);
        } 
        // PRIORITÉ 3: Articles réception
        else if (ARTICLES_RECEPTION.includes(item.id)) {
          reception.push(obj);
        } 
        // Par défaut: ménage
        else {
          menage.push(obj);
        }
      }
    });

    return { menage, technique, reception };
  };

  const handlePrepareSubmit = () => {
    console.log('🔍 VALIDATION START', {
      evaluationProprete,
      autorisationAcces,
      plagesHoraires,
      signature: signature ? 'OK' : 'MANQUANT'
    });

    if (!evaluationProprete) {
      console.error('❌ VALIDATION FAILED: évaluation propreté manquante');
      toast.error(lang === "fr" ? "Veuillez évaluer la propreté" : "Please rate cleanliness");
      return;
    }

    if (!autorisationAcces) {
      console.error('❌ VALIDATION FAILED: autorisation accès manquante');
      toast.error(lang === "fr" ? "Veuillez indiquer l'autorisation d'accès" : "Please indicate access authorization");
      return;
    }

    if (autorisationAcces === "non" && plagesHoraires.length === 0) {
      console.error('❌ VALIDATION FAILED: plages horaires manquantes');
      toast.error(lang === "fr" ? "Veuillez sélectionner au moins une plage horaire" : "Please select at least one time slot");
      return;
    }

    const { menage, technique, reception } = analyzeAnomalies();
    console.log('🔍 ANOMALIES DETECTÉES:', { menage: menage.length, technique: technique.length, reception: reception.length });

    console.log('✅ VALIDATION OK - Ouverture récapitulatif');
    setShowRecap(true);
  };

  const createIntervention = async ({ service, items, ficheId }) => {
    if (!items || items.length === 0) return null;

    const hasUrgent = items.some(i => i.urgent);

    const taches = items.map((item, index) => {
      let texte = `${item.emoji} ${item.label}`;
      if (item.problemeTechnique) {
        texte += ` - Équipement défectueux`;
      } else if (item.qtyManquante > 0) {
        texte += ` - ${item.qtyManquante} manquant(s)`;
      }
      if (item.remarque) {
        texte += `\n💬 ${item.remarque}`;
      }

      return {
        numero: index + 1,
        texte,
        objet_id: item.id,
        faite: false,
        justification: '',
        photo_url: item.photos?.[0] || '',
        commande_requise: false
      };
    });

    const descriptionComplete = items.map(i => {
      let desc = `${i.emoji} ${i.label}`;
      if (i.problemeTechnique) desc += `: Défectueux`;
      else if (i.qtyManquante > 0) desc += `: ${i.qtyManquante} manquant(s)`;
      if (i.urgent) desc += ' 🔴';
      return desc;
    }).join(' • ');

    const stayId = sessionStorage.getItem('stay_id');
    const interventionClient = await base44.entities.InterventionClient.create({
      type_intervention: "INVENTAIRE_ARRIVEE",
      type_hebergement: categorie,
      numero_hebergement: numero,
      client_nom: nom,
      client_prenom: prenom,
      date_arrivee: dateArrivee,
      date_depart: dateDepart,
      service,
      priorite: hasUrgent ? "URGENTE" : "NORMALE",
      description: descriptionComplete,
      taches,
      statut: "A_FAIRE",
      autorisation_acces: autorisationAcces,
      plages_horaires: autorisationAcces === 'non' ? plagesHoraires : [],
      fiche_arrivee_id: ficheId,
      stay_id: stayId
    });

    console.log(`[INTERVENTION_CREATE] InterventionClient créée:`, {
      id: interventionClient.id,
      service: interventionClient.service,
      statut: interventionClient.statut,
      type_intervention: interventionClient.type_intervention,
      numero_hebergement: interventionClient.numero_hebergement,
      taches: taches.length,
      priorite: interventionClient.priorite
    });

    // Créer WorkItem pilotable pour le Bureau
    const stayIdForWorkItem = sessionStorage.getItem('stay_id');
    await base44.entities.WorkItem.create({
      type: 'INTERVENTION_CLIENT',
      service,
      statut: 'A_FAIRE',
      priorite: hasUrgent ? 'URGENTE' : 'NORMALE',
      rank: 0,
      titre: `${service} - ${numero} - ${items.length} element(s)`,
      description: descriptionComplete,
      hebergement: numero,
      type_hebergement: categorie,
      client_nom: nom,
      client_prenom: prenom,
      date_arrivee: dateArrivee,
      date_depart: dateDepart,
      autorisation_acces: autorisationAcces,
      plages_horaires: autorisationAcces === 'non' ? plagesHoraires : [],
      taches,
      intervention_client_id: interventionClient.id,
      fiche_arrivee_id: ficheId,
      stay_id: stayIdForWorkItem
    });
    console.log(`[WORKITEM_CREATE] WorkItem créé pour ${service}`);

    // NOTIFICATION DIRECTE AU SERVICE
    const serviceLabel = service === 'MENAGE' ? '🧹 Ménage' : service === 'TECHNIQUE' ? '🔧 Technique' : '🏠 Réception';

    const detailsItems = items.map(i => {
      let line = `• ${i.emoji} ${i.label}`;
      if (i.problemeTechnique) line += `: ⚠️ Défectueux`;
      else if (i.qtyManquante > 0) line += `: ${i.qtyManquante} manquant(s)`;
      if (i.remarque) line += `\n  💬 ${i.remarque}`;
      if (i.urgent) line += ' 🔴';
      return line;
    }).join('\n');

    // Notification pour le service concerné
    const notificationPayload = {
      type: hasUrgent ? 'INCIDENT_URGENT' : 'NOUVEAU_INCIDENT',
      titre: `${hasUrgent ? '🔴 URGENT - ' : ''}${serviceLabel} - ${numero}`,
      message: `📍 ${categorie} ${numero}
👤 ${prenom} ${nom}
📅 ${dateArrivee} → ${dateDepart}
🔐 ${autorisationAcces === 'oui' ? '✅ Accès autorisé' : '❌ Présence requise'}
${autorisationAcces === 'non' && plagesHoraires.length > 0 ? `⏰ ${plagesHoraires.join(', ')}` : ''}

${detailsItems}

📄 Contrôle inventaire arrivée`,
      destinataire_role: service,
      statut: 'non_lu',
      priorite: hasUrgent ? 'URGENTE' : 'NORMALE',
      intervention_client_id: interventionClient.id
    };

    console.log(`[NOTIFICATION_CREATE] Création pour ${service}:`, notificationPayload);
    
    await base44.entities.Notification.create(notificationPayload);

    return interventionClient;
  };

  const genererPDF = async ({ ficheId, workItemsParService, inventaireComplet }) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
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
        doc.addImage(logoBase64, 'PNG', 70, 10, 70, 25);
      } catch (error) {
        console.error('Erreur logo:', error);
      }
      
      // Titre
      let y = 45;
      doc.setFontSize(18);
      doc.setTextColor(0, 119, 168);
      doc.text(lang === "fr" ? 'CONTROLE INVENTAIRE ARRIVEE' : 'ARRIVAL INVENTORY CHECK', 105, y, { align: 'center' });
      y += 8;
      doc.setFontSize(12);
      doc.setTextColor(34, 197, 94); // Vert
      doc.text(lang === "fr" ? 'STATUT : VALIDÉ DÉFINITIVEMENT' : 'STATUS: PERMANENTLY VALIDATED', 105, y, { align: 'center' });
      y += 10;
      
      // Infos client
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Client: ${prenom} ${nom}`, 20, y);
      y += 6;
      doc.text(`Hebergement: ${categorie} ${numero}`, 20, y);
      y += 6;
      doc.text(`Sejour: ${dateArrivee} -> ${dateDepart}`, 20, y);
      y += 6;
      doc.text(`Date validation: ${new Date().toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}`, 20, y);
      y += 12;

      // === NOUVELLE SECTION : INTERVENTIONS GÉNÉRÉES (depuis WorkItems réels) ===
      const interventionsList = [];
      
      // Parcourir TOUS les WorkItems par service
      ['TECHNIQUE', 'MENAGE', 'RECEPTION'].forEach(service => {
        if (workItemsParService[service]?.length > 0) {
          workItemsParService[service].forEach(wi => {
            wi.taches?.forEach(tache => {
              interventionsList.push({
                service: service,
                objet: tache.texte.split('\n')[0].replace(/[🔴⚠️]/g, '').trim(),
                defaut: tache.texte.includes('Défectueux') ? 'Défectueux' : 
                        tache.texte.includes('manquant') ? tache.texte.match(/(\d+)\s+manquant/)?.[1] + ' Manquant(s)' : 'Autre',
                urgence: wi.priorite === 'URGENTE' ? 'OUI' : 'Non',
                statut: wi.statut === 'A_FAIRE' ? 'EN ATTENTE' : 
                        wi.statut === 'EN_COURS' ? 'EN COURS' : 
                        wi.statut === 'TERMINEE' ? 'RÉSOLU' : wi.statut
              });
            });
          });
        }
      });

      if (interventionsList.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 119, 168);
        doc.text(lang === "fr" ? 'INTERVENTIONS GÉNÉRÉES' : 'GENERATED INTERVENTIONS', 20, y);
        y += 8;

        doc.autoTable({
          startY: y,
          head: [[
            'Service',
            lang === 'fr' ? 'Objet' : 'Item',
            lang === 'fr' ? 'Défaut / Motif' : 'Defect / Reason',
            lang === 'fr' ? 'Urgent' : 'Urgent',
            lang === 'fr' ? 'Statut' : 'Status'
          ]],
          body: interventionsList.map(i => [
            i.service,
            i.objet,
            i.defaut,
            i.urgence,
            i.statut
          ]),
          headStyles: { fillColor: [0, 119, 168], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          theme: 'grid',
          margin: { left: 20, right: 20 }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // === SECTION A: ÉLÉMENTS SIGNALÉS (depuis WorkItems réels) ===
      const elementsSignales = [];
      const elementsConformes = [];
      
      // Créer un index des WorkItems par objet pour traçabilité
      const workItemsIndex = {};
      interventionsList.forEach(wi => {
        const objetKey = wi.objet.split('-')[0].trim();
        workItemsIndex[objetKey] = wi;
      });
      
      inventaireComplet.forEach(item => {
        const declared = item.quantity;
        const attendu = item.expectedQuantity || item.quantity;
        const hasAnomaly = declared < attendu;
        const wiData = workItemsIndex[item.label];
        
        if (hasAnomaly || wiData) {
          elementsSignales.push({
            nom: item.label,
            attendu: attendu,
            present: declared,
            ecart: attendu - declared,
            type: wiData?.defaut || (hasAnomaly ? 'Manquant' : '-'),
            urgent: wiData?.urgence || 'Non',
            service: wiData?.service || 'MENAGE',
            remarque: item.remarque || '-',
            photos: item.photos || 0
          });
        } else {
          elementsConformes.push({
            nom: item.label,
            attendu: attendu,
            present: declared
          });
        }
      });
      
      if (elementsSignales.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(220, 38, 38);
        doc.text(lang === "fr" ? 'A. ELEMENTS SIGNALES' : 'A. REPORTED ITEMS', 20, y);
        y += 8;
        
        doc.autoTable({
          startY: y,
          head: [[
            lang === 'fr' ? 'Objet' : 'Item',
            lang === 'fr' ? 'Attendu' : 'Expected',
            lang === 'fr' ? 'Present' : 'Present',
            lang === 'fr' ? 'Ecart' : 'Diff',
            lang === 'fr' ? 'Type' : 'Type',
            lang === 'fr' ? 'Urgent' : 'Urgent',
            'Service',
            lang === 'fr' ? 'Remarque' : 'Note'
          ]],
          body: elementsSignales.map(el => [
            el.nom,
            el.attendu,
            el.present,
            el.ecart > 0 ? `-${el.ecart}` : '-',
            el.type,
            el.urgent,
            el.service,
            el.remarque.substring(0, 30) + (el.remarque.length > 30 ? '...' : '')
          ]),
          headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 15, halign: 'center' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 20 },
            5: { cellWidth: 15, halign: 'center' },
            6: { cellWidth: 20 },
            7: { cellWidth: 'auto' }
          },
          theme: 'grid',
          margin: { left: 20, right: 20 }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // === SECTION B: ÉLÉMENTS CONFORMES ===
      if (elementsConformes.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94);
        doc.text(lang === "fr" ? 'B. ELEMENTS CONFORMES' : 'B. COMPLIANT ITEMS', 20, y);
        y += 8;
        
        doc.autoTable({
          startY: y,
          head: [[
            lang === 'fr' ? 'Objet' : 'Item',
            lang === 'fr' ? 'Attendu' : 'Expected',
            lang === 'fr' ? 'Present' : 'Present',
            lang === 'fr' ? 'Statut' : 'Status'
          ]],
          body: elementsConformes.map(el => [
            el.nom,
            el.attendu,
            el.present,
            'OK'
          ]),
          headStyles: { fillColor: [34, 197, 94], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' }
          },
          theme: 'grid',
          margin: { left: 20, right: 20 }
        });
        
        y = doc.lastAutoTable.finalY + 10;
      }
      
      // === AUTORISATION D'ACCÈS ===
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 119, 168);
      doc.text(lang === "fr" ? 'AUTORISATION D\'ACCES' : 'ACCESS AUTHORIZATION', 20, y);
      y += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Autorisation: ${autorisationAcces === 'oui' ? 'OUI' : 'NON'}`, 20, y);
      y += 6;
      
      if (autorisationAcces === 'non' && plagesHoraires.length > 0) {
        doc.setFontSize(10);
        doc.text(lang === "fr" ? "Creneaux horaires demandes:" : "Requested time slots:", 20, y);
        y += 5;
        plagesHoraires.forEach(plage => {
          doc.text(`  - ${plage}`, 25, y);
          y += 5;
        });
        doc.setFontSize(11);
        y += 3;
      }
      
      // === APPRÉCIATION GLOBALE ===
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 119, 168);
      doc.text(lang === "fr" ? 'APPRECIATION GLOBALE' : 'OVERALL RATING', 20, y);
      y += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      const appreciationText = evaluationProprete === "pas_satisfaisant" ? "Insatisfaisant" :
                               evaluationProprete === "correct" ? "Correct" : "Tres propre";
      doc.text(`Proprete: ${appreciationText}`, 20, y);
      y += 6;
      
      if (commentaireProprete) {
        doc.setFontSize(10);
        const commentLines = doc.splitTextToSize(`Commentaire: ${commentaireProprete}`, 170);
        doc.text(commentLines, 20, y);
        y += commentLines.length * 5;
        doc.setFontSize(11);
      }
      
      // === SIGNATURE ===
      if (signature) {
        y += 10;
        if (y > 230) {
          doc.addPage();
          y = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text(lang === "fr" ? 'SIGNATURE CLIENT (electronique)' : 'CLIENT SIGNATURE (electronic)', 20, y);
        y += 8;
        try {
          doc.addImage(signature, 'PNG', 20, y, 60, 25);
          y += 30;
        } catch (e) {
          console.error('Erreur signature:', e);
        }
      }
      
      // === ANNEXE PHOTOS (si présentes) ===
      const toutesPhotos = [];
      Object.keys(photos).forEach(itemId => {
        if (photos[itemId]?.length > 0) {
          const item = items.find(i => i.id === itemId);
          photos[itemId].forEach(photoUrl => {
            toutesPhotos.push({ label: item?.label || itemId, url: photoUrl });
          });
        }
      });
      
      if (toutesPhotos.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.setTextColor(0, 119, 168);
        doc.text(lang === "fr" ? 'ANNEXE - PHOTOS' : 'APPENDIX - PHOTOS', 105, y, { align: 'center' });
        y += 10;
        
        for (const photo of toutesPhotos) {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }
          doc.setFont(undefined, 'bold');
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`Photo - ${photo.label}`, 20, y);
          y += 6;
          
          try {
            const imgResponse = await fetch(photo.url);
            const imgBlob = await imgResponse.blob();
            const imgReader = new FileReader();
            const imgBase64 = await new Promise((resolve) => {
              imgReader.onloadend = () => resolve(imgReader.result);
              imgReader.readAsDataURL(imgBlob);
            });
            doc.addImage(imgBase64, 'JPEG', 20, y, 80, 60);
            y += 65;
          } catch (e) {
            console.error('Erreur photo:', e);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text('(photo non disponible)', 20, y);
            y += 10;
          }
        }
      }
      
      // Footer sur toutes les pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Camping Paradis - ${new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')} - Page ${i}/${pageCount}`, 105, 287, { align: 'center' });
      }
      
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `Arrivee_${nom}_${prenom}.pdf`, { type: 'application/pdf' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
      return file_url;
    } catch (error) {
      console.error('Erreur PDF:', error);
      return null;
    }
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
    
    console.log('========================================');
    console.log('[ARRIVAL_VALIDATE] start', {
      inventoryId: sessionStorage.getItem('arrivee_dossier_id'),
      housing: `${categorie} ${numero}`,
      client: `${prenom} ${nom}`,
      dates: `${dateArrivee} → ${dateDepart}`
    });
    console.log('========================================');
    
    setSubmitting(true);
    // NE PAS fermer la modale ici - elle reste ouverte pendant tout le process
    
    toast.loading(lang === "fr" ? 'Envoi...' : 'Sending...', { id: 'submit' });
    
    try {
      const { menage, technique, reception } = analyzeAnomalies();
      console.log('[ARRIVAL_VALIDATE] Anomalies détectées:', { 
        technique: technique.length, 
        menage: menage.length, 
        reception: reception.length 
      });

      const allPhotos = {};
      Object.keys(photos).forEach(key => {
        if (photos[key]?.length > 0) allPhotos[key] = photos[key];
      });

      // 1. Créer fiche
      const fiche = await base44.entities.FicheArrivee.create({
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        numero_logement: numero,
        categorie_logement: categorie,
        type_logement: "mobilhome",
        inventaire_objets_manquants: [...menage, ...technique, ...reception],
        evaluation_proprete: evaluationProprete,
        commentaire_proprete: commentaireProprete,
        signature_url: signature,
        photos_pieces: allPhotos,
        date_validation: new Date().toISOString(),
        autorisation_acces: autorisationAcces,
        plage_horaire_client: autorisationAcces === 'non' ? plagesHoraires.join(', ') : null
      });
      console.log('[ARRIVAL_VALIDATE] saved/locked OK - FicheArrivee ID:', fiche.id);

      // 1.5. Générer stay_id unique si pas déjà fait
      let stayId = sessionStorage.getItem('stay_id');
      if (!stayId) {
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        const dateKey = dateArrivee.replace(/-/g, '');
        stayId = `ARR-${numero}-${dateKey}-${randomPart}`;
        sessionStorage.setItem('stay_id', stayId);
        console.log('[ARRIVAL_VALIDATE] stay_id généré:', stayId);
      }

      // 2. Créer interventions
      let interventionMenage = null;
      let interventionTechnique = null;
      let interventionReception = null;
      const createdIds = [];

      if (menage.length > 0) {
        interventionMenage = await createIntervention({ service: "MENAGE", items: menage, ficheId: fiche.id });
        if (interventionMenage) createdIds.push({ service: 'MENAGE', id: interventionMenage.id });
      }

      if (technique.length > 0) {
        interventionTechnique = await createIntervention({ service: "TECHNIQUE", items: technique, ficheId: fiche.id });
        if (interventionTechnique) createdIds.push({ service: 'TECHNIQUE', id: interventionTechnique.id });
      }

      if (reception.length > 0) {
        interventionReception = await createIntervention({ service: "RECEPTION", items: reception, ficheId: fiche.id });
        if (interventionReception) createdIds.push({ service: 'RECEPTION', id: interventionReception.id });
      }

      console.log('[ARRIVAL_VALIDATE] interventionsCreated', {
        count: createdIds.length,
        tech: technique.length,
        menage: menage.length,
        reception: reception.length,
        ids: createdIds
      });

      // 3. RÉCUPÉRER TOUS LES WORKITEMS CRÉÉS (source de vérité)
      const allWorkItems = await base44.entities.WorkItem.filter({ fiche_arrivee_id: fiche.id });
      console.log('[ARRIVAL_VALIDATE] allWorkItemsRecovered', { count: allWorkItems.length });

      // Regrouper par service avec règle métier LITS = TECHNIQUE
      const workItemsParService = { TECHNIQUE: [], MENAGE: [], RECEPTION: [] };
      
      allWorkItems.forEach(wi => {
        // Règle métier prioritaire : tous les lits/matelas/sommiers = TECHNIQUE
        const isLiterie = wi.taches?.some(t => 
          t.objet_id?.includes('lit_') || 
          t.objet_id?.includes('lits_') || 
          t.objet_id?.includes('matelas') || 
          t.objet_id?.includes('sommier')
        );
        
        const serviceFinal = isLiterie ? 'TECHNIQUE' : wi.service;
        
        if (workItemsParService[serviceFinal]) {
          workItemsParService[serviceFinal].push(wi);
        }
      });

      console.log('[ARRIVAL_VALIDATE] workItemsGrouped', {
        TECHNIQUE: workItemsParService.TECHNIQUE.length,
        MENAGE: workItemsParService.MENAGE.length,
        RECEPTION: workItemsParService.RECEPTION.length
      });

      // 3.5. CRÉER SuiviInventaire pour visibilité CLIENT
      const stayIdForSuivi = sessionStorage.getItem('stay_id');
      const clientEmail = sessionStorage.getItem('client_email') || '';
      
      const suiviData = {
        client_nom: nom,
        client_prenom: prenom,
        client_email: clientEmail,
        logement: numero,
        categorie_logement: categorie,
        type_inventaire: 'ARRIVEE',
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        items_menage: menage.map(m => ({
          key: m.id,
          label: m.label,
          quantity: m.qtyManquante || 1,
          motif: m.problemeTechnique ? 'Défectueux' : 'Manquant'
        })),
        items_technique: technique.map(t => ({
          key: t.id,
          label: t.label,
          quantity: t.qtyManquante || 1,
          motif: t.problemeTechnique ? 'Défectueux' : 'Manquant'
        })),
        statut_menage: menage.length > 0 ? 'en_attente' : 'non_requis',
        statut_technique: technique.length > 0 ? 'en_attente' : 'non_requis',
        timeline_menage: menage.length > 0 ? [{
          timestamp: Date.now(),
          status: 'demande_recue',
          detail: 'Demande transmise au service ménage',
          utilisateur: ''
        }] : [],
        timeline_technique: technique.length > 0 ? [{
          timestamp: Date.now(),
          status: 'demande_recue',
          detail: 'Demande transmise au service technique',
          utilisateur: ''
        }] : [],
        fiche_arrivee_id: fiche.id,
        stay_id: stayIdForSuivi
      };

      const suiviInventaire = await base44.entities.SuiviInventaire.create(suiviData);
      console.log('[ARRIVAL_VALIDATE] SuiviInventaire créé:', suiviInventaire.id);

      // 4. Stocker résumé COMPLET (basé sur WorkItems réels)
      const interventionsSummary = {
        technique: workItemsParService.TECHNIQUE.length,
        menage: workItemsParService.MENAGE.length,
        reception: workItemsParService.RECEPTION.length
      };

      // 4. Notification RÉCEPTION (vue d'ensemble)
      if (menage.length > 0 || technique.length > 0 || reception.length > 0) {
        const totalAnomalies = menage.length + technique.length + reception.length;
        const totalUrgent = [...menage, ...technique, ...reception].filter(i => i.urgent).length;

        const resumeServices = [];
        if (technique.length > 0) resumeServices.push(`🔧 ${technique.length}`);
        if (menage.length > 0) resumeServices.push(`🧹 ${menage.length}`);
        if (reception.length > 0) resumeServices.push(`🏠 ${reception.length}`);

        await base44.entities.Notification.create({
          type: 'NOUVEAU_INCIDENT',
          titre: `📋 Contrôle ${numero} - ${totalAnomalies} interventions`,
          message: `📋 CONTRÔLE INVENTAIRE VALIDÉ
📍 ${categorie} ${numero}
👤 ${prenom} ${nom}
⚠️ ${resumeServices.join(' • ')}
${totalUrgent > 0 ? `🔴 ${totalUrgent} URGENT(S)` : ''}`,
          destinataire_role: 'RECEPTION',
          statut: 'non_lu'
        });
        
        console.log('[ARRIVAL_VALIDATE] notificationsSent', {
          tech: technique.length > 0,
          menage: menage.length > 0,
          reception: totalAnomalies > 0
        });
        }

        // 4.5. Écriture dans l'historique central
        await base44.entities.HistoriqueEvent.create({
        type_event: 'CONTROLE_INVENTAIRE_VALIDE',
        titre: `Controle inventaire ${numero}`,
        description: `${prenom} ${nom} - ${totalAnomalies} anomalie(s) detectee(s)`,
        service: 'RECEPTION',
        hebergement: numero,
        type_hebergement: categorie,
        client_nom: nom,
        client_prenom: prenom,
        urgent: totalUrgent > 0,
        metadata: {
          total_anomalies: totalAnomalies,
          technique: technique.length,
          menage: menage.length,
          reception: reception.length,
          intervention_ids: createdIds
        },
        fiche_arrivee_id: fiche.id
        });
        console.log('[ARRIVAL_VALIDATE] historiqueEventCreated');

        // 5. Préparer l'inventaire complet pour le PDF
      const inventaireComplet = items.map(item => ({
        id: item.id,
        label: item.label || lang === 'fr' ? item.label_fr : item.label_en,
        quantity: quantities[item.id] !== undefined ? quantities[item.id] : item.quantity,
        expectedQuantity: item.quantity,
        remarque: remarques[item.id] || '',
        photos: photos[item.id]?.length || 0
      }));

      // 6. Générer PDF avec WorkItems réels
      let urlPDF = "";
      try {
        const pdf = await genererPDF({ 
          ficheId: fiche.id, 
          workItemsParService, 
          inventaireComplet 
        });
        if (pdf) {
          await base44.entities.FicheArrivee.update(fiche.id, { pdf_url: pdf });
          urlPDF = pdf;
          console.log('[ARRIVAL_VALIDATE] pdfGenerated url=', pdf);
        } else {
          console.error('[ARRIVAL_VALIDATE] pdfGenerated FAILED - null result');
        }
      } catch (err) {
        console.error('[ARRIVAL_VALIDATE] pdfGenerated ERROR:', err);
      }

      // 7. Finaliser dossier
      const dossierId = sessionStorage.getItem('arrivee_dossier_id');
      if (dossierId) {
        await base44.entities.DossierArrivee.update(dossierId, {
          etape_4_terminee: true,
          inventaire_termine: true,
          fiche_arrivee_id: fiche.id,
          statut: 'termine'
        });
      }
      sessionStorage.setItem('fiche_arrivee_id', fiche.id);

      // 8. Navigation vers HOME (redirection obligatoire)
      toast.dismiss('submit');
      toast.success(lang === "fr" ? "✅ Validé" : "✅ Validated");
      
      console.log('[ARRIVAL_VALIDATE] SUCCESS - Redirection vers Home');
      
      navigate(createPageUrl('Home'), { replace: true });
      return;
      
    } catch (e) {
      console.error('[ARRIVAL_VALIDATE] ERROR GLOBAL:', e);
      toast.dismiss('submit');
      toast.error(lang === "fr" ? "Erreur lors de la validation. Réessayez." : "Validation error. Try again.");
      setSubmitting(false);
      setShowRecap(true); // Rester sur le récap en cas d'erreur
    }
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-8">
      <Logo className="h-16 mb-4" />

      <Card className="mb-6">
        <CardContent className="p-4">
          <ArriveeProgressBar etapeActuelle={4} lang={lang} />
        </CardContent>
      </Card>

      <h1 className="text-2xl font-bold text-center mb-2">
        {lang === "fr" ? "Contrôle inventaire" : "Inventory check"}
      </h1>
      <p className="text-center text-gray-600 mb-6">
        {categorie} {numero} • {nom} {prenom}
      </p>

      {/* Configuration literie */}
      <ConfigurationLiterie categorie={categorie} lang={lang} />

      <Card className="mb-6">
        <CardContent className="p-6 space-y-3">
          {items.map(item => (
            <InventaireItemRow
              key={item.id}
              item={{ ...item, emoji: item.icon, qty: item.quantity }}
              quantity={quantities[item.id]}
              photos={photos[item.id] || []}
              remarque={remarques[item.id] || ''}
              onQuantityChange={handleQuantityChange}
              onPhotosChange={handlePhotosChange}
              onRemarqueChange={handleRemarqueChange}
              onUrgencyChange={handleUrgencyChange}
              onProblemeTechnique={handleProblemeTechnique}
              urgent={urgencies[item.id]}
              problemeTechniqueSignale={problemesTechniques[item.id]}
              lang={lang}
            />
          ))}
        </CardContent>
      </Card>

      {/* Autorisation d'accès */}
      <Card className="mb-6 border-2 border-[#FFA500]">
        <CardContent className="p-6">
          <h3 className="font-semibold text-[#0077A8] mb-3 flex items-center gap-2">
            🔐 {lang === "fr" ? "Autorisation d'accès *" : "Access authorization *"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {lang === "fr" 
              ? "Autorisez-vous notre intervenant à entrer dans votre hébergement en votre absence ?"
              : "Do you authorize our staff to enter your accommodation in your absence?"}
          </p>
          <RadioGroup 
            value={autorisationAcces} 
            onValueChange={(val) => {
              console.log('🔐 Autorisation changée:', val);
              setAutorisationAcces(val);
              if (val === 'oui') {
                setPlagesHoraires([]);
              }
            }}
          >
            <div className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-all ${autorisationAcces === 'oui' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
              <RadioGroupItem value="oui" id="acces-oui" />
              <Label htmlFor="acces-oui" className="cursor-pointer flex-1 font-medium">
                ✔ {lang === "fr" ? "Oui" : "Yes"}
              </Label>
            </div>
            <div className={`flex items-center space-x-2 p-3 border-2 rounded-lg transition-all ${autorisationAcces === 'non' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`}>
              <RadioGroupItem value="non" id="acces-non" />
              <Label htmlFor="acces-non" className="cursor-pointer flex-1 font-medium">
                ✖ {lang === "fr" ? "Non" : "No"}
              </Label>
            </div>
          </RadioGroup>

          {autorisationAcces === "non" && (
            <div className="mt-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
              <h4 className="font-semibold text-orange-800 mb-3">
                ⏰ {lang === "fr" ? "Merci de sélectionner une ou plusieurs plages horaires possibles:" : "Please select one or more available time slots:"}
              </h4>
              <div className="space-y-2">
                {['09h - 12h', '14h - 16h', '17h - 19h'].map(plage => (
                  <label key={plage} className="flex items-center space-x-3 p-2 hover:bg-orange-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plagesHoraires.includes(plage)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPlagesHoraires([...plagesHoraires, plage]);
                        } else {
                          setPlagesHoraires(plagesHoraires.filter(p => p !== plage));
                        }
                      }}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">{plage}</span>
                  </label>
                ))}
              </div>
              {plagesHoraires.length === 0 && (
                <p className="text-xs text-red-600 mt-2">
                  {lang === "fr" ? "⚠️ Au moins une plage horaire est obligatoire" : "⚠️ At least one time slot is required"}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Évaluation globale */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold text-[#0077A8] mb-3">
            {lang === "fr" ? "😊 Appréciation globale de la propreté *" : "😊 Overall cleanliness rating *"}
          </h3>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              variant={evaluationProprete === "pas_satisfaisant" ? "default" : "outline"}
              onClick={() => setEvaluationProprete("pas_satisfaisant")}
              className={evaluationProprete === "pas_satisfaisant" ? "bg-red-500" : ""}
            >
              <Frown className="w-5 h-5 mr-2" />
              {lang === "fr" ? "😠 Insatisfaisant" : "😠 Unsatisfactory"}
            </Button>
            <Button
              variant={evaluationProprete === "correct" ? "default" : "outline"}
              onClick={() => setEvaluationProprete("correct")}
              className={evaluationProprete === "correct" ? "bg-gray-500" : ""}
            >
              <Meh className="w-5 h-5 mr-2" />
              {lang === "fr" ? "😐 Correct" : "😐 Correct"}
            </Button>
            <Button
              variant={evaluationProprete === "tres_propre" ? "default" : "outline"}
              onClick={() => setEvaluationProprete("tres_propre")}
              className={evaluationProprete === "tres_propre" ? "bg-green-500" : ""}
            >
              <Smile className="w-5 h-5 mr-2" />
              {lang === "fr" ? "😄 Très propre" : "😄 Very clean"}
            </Button>
          </div>

          {evaluationProprete && (
            <Textarea
              value={commentaireProprete}
              onChange={(e) => setCommentaireProprete(e.target.value)}
              placeholder={lang === "fr" ? "Commentaire libre (facultatif)" : "Free comment (optional)"}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      <SignaturePad onSave={setSignature} disabled={submitting} lang={lang} />

      <Button 
        onClick={() => {
          console.log('🔘 BOUTON CLIQUÉ - Lancement validation');
          handlePrepareSubmit();
        }} 
        className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] mt-6 text-lg font-semibold" 
        disabled={submitting}
      >
        <Send className="mr-2" />
        {lang === "fr" ? "Valider le contrôle inventaire" : "Confirm inventory check"}
      </Button>

      {/* Dialog Récapitulatif */}
      <Dialog open={showRecap} onOpenChange={(open) => {
        if (!submitting) setShowRecap(open);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang === "fr" ? "Récapitulatif du contrôle inventaire" : "Inventory check summary"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>{lang === "fr" ? "Hébergement" : "Accommodation"}:</strong> {categorie} {numero}</p>
              <p><strong>{lang === "fr" ? "Client" : "Guest"}:</strong> {prenom} {nom}</p>
              <p><strong>{lang === "fr" ? "Arrivée" : "Arrival"}:</strong> {dateArrivee} → {dateDepart}</p>
            </div>

            {(() => {
              const { menage, technique, reception } = analyzeAnomalies();
              const renderItems = (items, bgColor) => items.map(m => (
                <div key={m.id} className={`text-sm p-3 ${bgColor} rounded mb-2 border`}>
                  <p className="font-semibold">
                    {m.emoji} {m.label}
                    {m.urgent && <span className="ml-2 text-red-600 font-bold">🔴 URGENT</span>}
                  </p>
                  {m.problemeTechnique && (
                    <p className="text-xs text-orange-600 mt-1">⚠️ {lang === "fr" ? "Équipement défectueux" : "Defective equipment"}</p>
                  )}
                  {m.qtyManquante > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      {lang === "fr" ? "Manquant" : "Missing"}: {m.qtyManquante}
                    </p>
                  )}
                  {m.remarque && (
                    <p className="text-xs text-gray-700 mt-2 italic bg-white/50 p-2 rounded">
                      💬 {m.remarque}
                    </p>
                  )}
                  {m.photos?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {m.photos.map((p, idx) => (
                        <img key={idx} src={p} alt={`Photo ${idx + 1}`} className="w-16 h-16 object-cover rounded border-2 border-white" />
                      ))}
                    </div>
                  )}
                </div>
              ));

              return (
                <>
                  {technique.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-blue-700">🔧 {lang === "fr" ? "Interventions Technique" : "Technical"} ({technique.length})</h3>
                      {renderItems(technique, 'bg-blue-50')}
                    </div>
                  )}

                  {menage.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-yellow-700">🧹 {lang === "fr" ? "Interventions Ménage" : "Housekeeping"} ({menage.length})</h3>
                      {renderItems(menage, 'bg-yellow-50')}
                    </div>
                  )}

                  {reception.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 text-green-700">🏠 {lang === "fr" ? "Réception / Logistique" : "Reception / Logistics"} ({reception.length})</h3>
                      {renderItems(reception, 'bg-green-50')}
                    </div>
                  )}

                  {menage.length === 0 && technique.length === 0 && reception.length === 0 && (
                    <p className="text-center text-green-600">✅ {lang === "fr" ? "Aucune anomalie signalée" : "No anomalies reported"}</p>
                  )}
                </>
              );
            })()}

            <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-400">
              <p className="font-bold text-orange-800">
                🔐 {lang === "fr" ? "Autorisation d'accès" : "Access authorization"}: {autorisationAcces === 'oui' ? '✅ Oui' : '❌ Non'}
              </p>
              {autorisationAcces === 'non' && plagesHoraires.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-orange-700 font-semibold mb-1">
                    {lang === "fr" ? "Plages horaires demandées:" : "Requested time slots:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {plagesHoraires.map(plage => (
                      <span key={plage} className="px-2 py-1 bg-orange-200 text-orange-900 text-xs rounded">
                        {plage}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>{lang === "fr" ? "Appréciation globale" : "Overall rating"}:</strong> {
                evaluationProprete === "pas_satisfaisant" ? "😠 Insatisfaisant" :
                evaluationProprete === "correct" ? "😐 Correct" :
                evaluationProprete === "tres_propre" ? "😄 Très propre" : ""
              }</p>
              {commentaireProprete && <p className="text-sm text-gray-600 mt-2">{commentaireProprete}</p>}
            </div>

            {signature && (
              <div>
                <p className="font-semibold mb-2">{lang === "fr" ? "Signature" : "Signature"}:</p>
                <img src={signature} alt="Signature" className="border rounded max-h-32" />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRecap(false)} className="flex-1">
              {lang === "fr" ? "Modifier" : "Edit"}
            </Button>
            <Button onClick={handleFinalSubmit} disabled={submitting} className="flex-1 bg-[#00AEEF]">
              {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
              {lang === "fr" ? "Valider définitivement" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}