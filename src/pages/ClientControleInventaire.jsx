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
      'chauffe_eau', 'wc', 'douche', 'lavabo', 'feux_gaz', 'telecommande_clim', 'climatisation',
      'lave_vaisselle', 'congelateur', 'evier', 'cafetiere', 'hotte', 'cumulus', 'chauffe_eau_gaz',
      'seche_serviette', 'seche_cheveux', 'extincteur', 'detecteur_fumee'
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
        if (ARTICLES_TECHNIQUES.includes(item.id)) {
          technique.push(obj);
        } else if (ARTICLES_RECEPTION.includes(item.id)) {
          reception.push(obj);
        } else {
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
    
    const hasAnomalies = menage.length > 0 || technique.length > 0 || reception.length > 0 || evaluationProprete === "pas_satisfaisant";

    if (hasAnomalies && !signature) {
      console.error('❌ VALIDATION FAILED: signature manquante (anomalies détectées)');
      toast.error(lang === "fr" ? "⚠️ Signature obligatoire en cas d'anomalie détectée" : "⚠️ Signature required when issues detected");
      
      // Scroll vers la signature
      const sigElement = document.querySelector('[data-signature-pad]');
      if (sigElement) {
        sigElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        sigElement.style.border = '3px solid red';
        setTimeout(() => { sigElement.style.border = ''; }, 3000);
      }
      return;
    }

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
      fiche_arrivee_id: ficheId
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
    await base44.entities.Notification.create({
      type: hasUrgent ? 'INCIDENT_URGENT' : 'NOUVEAU_INCIDENT',
      titre: `${hasUrgent ? '🔴 URGENT - ' : ''}${serviceLabel} - ${numero}`,
      message: `📍 ${categorie} ${numero}
  👤 ${prenom} ${nom}
  📅 ${dateArrivee} → ${dateDepart}
  🔐 ${autorisationAcces === 'oui' ? '✅ Accès autorisé' : '❌ Présence requise'}
  ${autorisationAcces === 'non' && plagesHoraires.length > 0 ? `⏰ ${plagesHoraires.join(', ')}` : ''}

  ${detailsItems}

  📄 Contrôle inventaire arrivée`,
      destinataire_role: service === 'TECHNIQUE' ? 'TECHNIQUE' : service === 'MENAGE' ? 'MENAGE' : 'RECEPTION',
      statut: 'non_lu'
    });

    return interventionClient;
  };

  const genererPDF = async ({ ficheId, interventions }) => {
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
      doc.text(lang === "fr" ? 'CONTRÔLE INVENTAIRE ARRIVÉE' : 'ARRIVAL INVENTORY CHECK', 105, y, { align: 'center' });
      y += 15;
      
      // Infos
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`${lang === "fr" ? "Client" : "Guest"}: ${prenom} ${nom}`, 20, y);
      y += 6;
      doc.text(`${lang === "fr" ? "Hébergement" : "Accommodation"}: ${categorie} ${numero}`, 20, y);
      y += 6;
      doc.text(`${lang === "fr" ? "Séjour" : "Stay"}: ${dateArrivee} → ${dateDepart}`, 20, y);
      y += 12;
      
      // Interventions
      if (interventions.menage.length > 0 || interventions.technique.length > 0 || interventions.reception.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.text(lang === "fr" ? "INTERVENTIONS DÉTECTÉES" : "INTERVENTIONS DETECTED", 20, y);
        y += 8;
        
        const renderInterventions = (items, emoji, titre) => {
          if (items.length === 0) return;
          doc.setFont(undefined, 'bold');
          doc.text(`${emoji} ${titre} (${items.length})`, 20, y);
          y += 6;
          doc.setFont(undefined, 'normal');
          items.forEach(item => {
            const ligne = `• ${item.emoji} ${item.label}${item.problemeTechnique ? ' - Défectueux' : item.qtyManquante > 0 ? ` - ${item.qtyManquante} manquant(s)` : ''}${item.urgent ? ' 🔴' : ''}`;
            doc.text(ligne, 25, y);
            y += 5;
            if (item.remarque) {
              const remarqueLines = doc.splitTextToSize(`  💬 ${item.remarque}`, 160);
              doc.setFontSize(9);
              doc.text(remarqueLines, 30, y);
              y += remarqueLines.length * 4;
              doc.setFontSize(11);
            }
          });
          y += 5;
        };
        
        renderInterventions(interventions.technique, '🔧', lang === "fr" ? 'Technique' : 'Technical');
        renderInterventions(interventions.menage, '🧹', lang === "fr" ? 'Ménage' : 'Housekeeping');
        renderInterventions(interventions.reception, '🏠', lang === "fr" ? 'Réception' : 'Reception');
      }
      
      // Autorisation
      y += 5;
      doc.setFont(undefined, 'bold');
      doc.text(lang === "fr" ? "AUTORISATION D'ACCÈS" : "ACCESS AUTHORIZATION", 20, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      doc.text(autorisationAcces === 'oui' ? '✅ Oui' : '❌ Non', 20, y);
      y += 6;
      if (autorisationAcces === 'non' && plagesHoraires.length > 0) {
        doc.setFontSize(10);
        doc.text(lang === "fr" ? "Plages horaires demandées:" : "Requested time slots:", 20, y);
        y += 5;
        plagesHoraires.forEach(plage => {
          doc.text(`  • ${plage}`, 25, y);
          y += 5;
        });
        doc.setFontSize(11);
      }
      
      // Appréciation
      y += 5;
      doc.setFont(undefined, 'bold');
      doc.text(lang === "fr" ? "APPRÉCIATION GLOBALE" : "OVERALL RATING", 20, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      const appreciationText = evaluationProprete === "pas_satisfaisant" ? "😠 Insatisfaisant" :
                               evaluationProprete === "correct" ? "😐 Correct" : "😄 Très propre";
      doc.text(appreciationText, 20, y);
      y += 6;
      if (commentaireProprete) {
        const commentLines = doc.splitTextToSize(commentaireProprete, 170);
        doc.text(commentLines, 20, y);
        y += commentLines.length * 5;
      }
      
      // Signature
      if (signature) {
        y += 10;
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text(lang === "fr" ? "SIGNATURE CLIENT" : "CLIENT SIGNATURE", 20, y);
        y += 6;
        try {
          doc.addImage(signature, 'PNG', 20, y, 60, 25);
        } catch (e) {
          console.error('Erreur signature:', e);
        }
      }
      
      // Footer
      doc.setFontSize(8);
      doc.text(`Camping Paradis - ${new Date().toLocaleDateString()} - Page 1`, 105, 287, { align: 'center' });
      
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
    setShowRecap(false);
    
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

      // 3. Stocker résumé (pour display final)
      const interventionsSummary = {
        technique: technique.length,
        menage: menage.length,
        reception: reception.length
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

      // 5. Générer PDF
      let urlPDF = "";
      try {
        const pdf = await genererPDF({ ficheId: fiche.id, interventions: { menage, technique, reception } });
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

      // 6. Finaliser dossier
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

      // 7. Afficher page finale de succès
      toast.dismiss('submit');
      toast.success(lang === "fr" ? "✅ Validé" : "✅ Validated");
      
      setFinalReceipt({
        ficheId: fiche.id,
        pdfUrl: urlPDF,
        interventionsSummary,
        categorie,
        numero,
        dateArrivee,
        dateDepart
      });
      
      setSubmitting(false);
      
      console.log('[ARRIVAL_VALIDATE] SUCCESS - Navigation vers écran final');
      console.log('========================================');
      console.log('[ARRIVAL_VALIDATE] RÉSUMÉ FINAL:', {
        ficheId: fiche.id,
        dossierId: sessionStorage.getItem('arrivee_dossier_id'),
        pdfUrl: urlPDF,
        interventionsTech: interventionTechnique?.id || 'AUCUNE',
        interventionsMenage: interventionMenage?.id || 'AUCUNE',
        interventionsReception: interventionReception?.id || 'AUCUNE',
        finalReceiptSet: true
      });
      console.log('========================================');
      
    } catch (e) {
      console.error('[ARRIVAL_VALIDATE] ERROR GLOBAL:', e);
      toast.dismiss('submit');
      toast.error(lang === "fr" ? "Erreur lors de la validation. Réessayez." : "Validation error. Try again.");
      setSubmitting(false);
      setShowRecap(true); // Rester sur le récap en cas d'erreur
    }
  };

  // ÉCRAN FINAL DE SUCCÈS
  if (finalReceipt) {
    return (
      <div className="min-h-screen max-w-2xl mx-auto px-6 py-8 flex flex-col items-center justify-center">
        <Logo className="h-16 mb-8" />
        
        <Card className="w-full border-2 border-green-500 shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-green-700">
              ✅ {lang === "fr" ? "Contrôle inventaire validé" : "Inventory check validated"}
            </h1>
            
            <p className="text-lg text-gray-700">
              {lang === "fr" 
                ? "Merci. Votre contrôle a bien été enregistré."
                : "Thank you. Your check has been recorded."}
            </p>

            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p className="text-sm text-gray-600 mb-2">
                <strong>{finalReceipt.categorie} {finalReceipt.numero}</strong>
              </p>
              <p className="text-sm text-gray-600">
                {finalReceipt.dateArrivee} → {finalReceipt.dateDepart}
              </p>
              
              {(finalReceipt.interventionsSummary.technique > 0 || 
                finalReceipt.interventionsSummary.menage > 0 || 
                finalReceipt.interventionsSummary.reception > 0) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {lang === "fr" ? "Interventions créées:" : "Interventions created:"}
                  </p>
                  {finalReceipt.interventionsSummary.technique > 0 && (
                    <p className="text-sm text-blue-700">🔧 Technique: {finalReceipt.interventionsSummary.technique}</p>
                  )}
                  {finalReceipt.interventionsSummary.menage > 0 && (
                    <p className="text-sm text-yellow-700">🧹 Ménage: {finalReceipt.interventionsSummary.menage}</p>
                  )}
                  {finalReceipt.interventionsSummary.reception > 0 && (
                    <p className="text-sm text-green-700">🏠 Réception: {finalReceipt.interventionsSummary.reception}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4">
              {finalReceipt.pdfUrl ? (
                <Button 
                  onClick={() => {
                    console.log('📄 Ouverture PDF:', finalReceipt.pdfUrl);
                    window.open(finalReceipt.pdfUrl, '_blank');
                  }}
                  className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] text-lg"
                >
                  <Download className="mr-2 w-5 h-5" />
                  {lang === "fr" ? "📄 Télécharger / Ouvrir le PDF" : "📄 Download / Open PDF"}
                </Button>
              ) : (
                <div className="py-3 text-sm text-gray-500">
                  {lang === "fr" ? "PDF en cours de génération..." : "PDF being generated..."}
                </div>
              )}

              <Button 
                onClick={() => {
                  console.log('🏠 Retour menu principal');
                  navigate(createPageUrl('ClientMenu'));
                }}
                variant="outline"
                className="w-full h-14 text-lg font-semibold"
              >
                <Home className="mr-2 w-5 h-5" />
                {lang === "fr" ? "🏠 Retour menu principal" : "🏠 Back to main menu"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <Dialog open={showRecap} onOpenChange={setShowRecap}>
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