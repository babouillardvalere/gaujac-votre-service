import jsPDF from 'jspdf';

export async function genererPDFArrivee(dossier, inventaire, interventions, lang = 'fr') {
  const doc = new jsPDF();
  const isFrench = lang === 'fr';
  
  // Titre
  doc.setFontSize(20);
  doc.setTextColor(0, 119, 168);
  doc.text(isFrench ? '📋 Fiche d\'Arrivée' : '📋 Arrival Form', 20, 20);
  
  // Ligne de séparation
  doc.setDrawColor(0, 174, 239);
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  let y = 35;
  
  // Informations client
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(isFrench ? 'Informations Client' : 'Guest Information', 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.text(`${isFrench ? 'Nom' : 'Name'}: ${dossier.client_nom} ${dossier.client_prenom}`, 20, y);
  y += 7;
  doc.text(`${isFrench ? 'Code dossier' : 'File code'}: ${dossier.code_dossier}`, 20, y);
  y += 7;
  doc.text(`${isFrench ? 'Dates' : 'Dates'}: ${dossier.date_arrivee} → ${dossier.date_depart}`, 20, y);
  y += 7;
  doc.text(`${isFrench ? 'Hébergement' : 'Accommodation'}: ${dossier.numero_logement || 'N/A'} - ${dossier.categorie_logement || 'N/A'}`, 20, y);
  y += 7;
  
  const totalPersonnes = (dossier.nombre_adultes || 0) + (dossier.nombre_adolescents || 0) + (dossier.nombre_enfants || 0) + (dossier.nombre_bebes || 0);
  doc.text(`${isFrench ? 'Personnes' : 'People'}: ${totalPersonnes} (${dossier.nombre_adultes || 0}A / ${dossier.nombre_adolescents || 0}Ado / ${dossier.nombre_enfants || 0}E / ${dossier.nombre_bebes || 0}B)`, 20, y);
  y += 7;
  
  if (dossier.nombre_animaux > 0) {
    doc.text(`${isFrench ? 'Animaux' : 'Pets'}: ${dossier.nombre_animaux}`, 20, y);
    y += 7;
  }
  
  y += 5;
  
  // Inventaire
  if (inventaire) {
    doc.setFontSize(14);
    doc.setTextColor(0, 119, 168);
    doc.text(isFrench ? 'Contrôle Inventaire' : 'Inventory Check', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Objets validés
    doc.text(`${isFrench ? 'Objets validés' : 'Validated items'}: ${inventaire.objets_valides?.length || 0}`, 20, y);
    y += 7;
    
    // Objets manquants
    if (inventaire.objets_manquants?.length > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`${isFrench ? 'Objets manquants/cassés' : 'Missing/broken items'}:`, 20, y);
      y += 7;
      inventaire.objets_manquants.forEach(obj => {
        doc.text(`  - ${obj.objet}${obj.commentaire ? ` (${obj.commentaire})` : ''}`, 25, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
      doc.setTextColor(0, 0, 0);
    }
    
    y += 5;
    
    // Propreté
    const propreteText = inventaire.evaluation_proprete === 'tres_propre' 
      ? (isFrench ? 'Très propre' : 'Very clean')
      : inventaire.evaluation_proprete === 'correct'
      ? (isFrench ? 'Correct' : 'Correct')
      : (isFrench ? 'Pas satisfaisant' : 'Not satisfactory');
    
    doc.text(`${isFrench ? 'Propreté' : 'Cleanliness'}: ${propreteText}`, 20, y);
    y += 7;
    
    if (inventaire.commentaire_proprete) {
      doc.text(`${isFrench ? 'Commentaire' : 'Comment'}: ${inventaire.commentaire_proprete}`, 20, y);
      y += 7;
    }
    
    // Remarques client
    if (inventaire.remarques_suggestions) {
      y += 5;
      doc.text(`${isFrench ? 'Remarques' : 'Remarks'}:`, 20, y);
      y += 7;
      const lines = doc.splitTextToSize(inventaire.remarques_suggestions, 170);
      lines.forEach(line => {
        doc.text(line, 20, y);
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }
    
    // Photos des pièces
    if (inventaire.photos_pieces && Object.keys(inventaire.photos_pieces).length > 0) {
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      y += 5;
      doc.setTextColor(0, 119, 168);
      doc.text(`${isFrench ? 'Photos des pièces' : 'Room photos'}:`, 20, y);
      y += 7;
      doc.setTextColor(0, 0, 0);
      
      const photoEntries = Object.entries(inventaire.photos_pieces);
      for (let i = 0; i < photoEntries.length; i++) {
        const [piece, url] = photoEntries[i];
        try {
          // Ajouter l'image au PDF
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = url;
          });
          
          if (y > 200) {
            doc.addPage();
            y = 20;
          }
          
          doc.text(piece, 20, y);
          y += 5;
          doc.addImage(img, 'JPEG', 20, y, 80, 60);
          y += 65;
        } catch (error) {
          doc.text(`${piece}: ${isFrench ? 'Photo non disponible' : 'Photo unavailable'}`, 20, y);
          y += 7;
        }
      }
    }
    
    // Signature
    if (inventaire.signature_url) {
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      y += 5;
      doc.setTextColor(0, 119, 168);
      doc.text(`${isFrench ? 'Signature client' : 'Guest signature'}:`, 20, y);
      y += 7;
      doc.setTextColor(0, 0, 0);
      
      try {
        const signImg = new Image();
        signImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          signImg.onload = () => resolve();
          signImg.onerror = () => reject();
          signImg.src = inventaire.signature_url;
        });
        
        doc.addImage(signImg, 'PNG', 20, y, 60, 20);
        y += 25;
        doc.setFontSize(8);
        doc.text(`${isFrench ? 'Signé le' : 'Signed on'} ${new Date(inventaire.date_validation).toLocaleString(lang)}`, 20, y);
        doc.setFontSize(10);
        y += 7;
      } catch (error) {
        doc.text(isFrench ? 'Signature non disponible' : 'Signature unavailable', 20, y);
        y += 7;
      }
    }
    
    y += 5;
  }
  
  // Interventions
  if (interventions?.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(0, 119, 168);
    doc.text(isFrench ? 'Interventions Créées' : 'Created Interventions', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    interventions.forEach(interv => {
      doc.text(`- ${interv.categorie}: ${interv.description}`, 20, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`${isFrench ? 'Généré le' : 'Generated on'} ${new Date().toLocaleString(lang)}`, 20, 285);
  doc.text('Camping Paradis - Domaine de Gaujac', 105, 285, { align: 'center' });
  
  return doc;
}