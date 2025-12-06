import jsPDF from 'jspdf';

export async function genererPDFDepart(dossier, lang = 'fr') {
  const doc = new jsPDF();
  const isFrench = lang === 'fr';
  
  // Titre
  doc.setFontSize(20);
  doc.setTextColor(255, 165, 0); // Orange
  doc.text(isFrench ? '📋 Fiche de Départ' : '📋 Departure Form', 20, 20);
  
  // Ligne de séparation
  doc.setDrawColor(255, 165, 0);
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
  doc.text(`${isFrench ? 'Dates' : 'Dates'}: ${dossier.date_arrivee} → ${dossier.date_depart}`, 20, y);
  y += 7;
  doc.text(`${isFrench ? 'Hébergement' : 'Accommodation'}: ${dossier.numero_logement || 'N/A'} - ${dossier.categorie_logement || 'N/A'}`, 20, y);
  y += 7;
  doc.text(`${isFrench ? 'Type' : 'Type'}: ${dossier.type_logement === 'emplacement' ? (isFrench ? 'Emplacement' : 'Pitch') : (isFrench ? 'Hébergement' : 'Accommodation')}`, 20, y);
  y += 10;
  
  // État propreté
  doc.setFontSize(14);
  doc.setTextColor(255, 165, 0);
  doc.text(isFrench ? 'État de Propreté' : 'Cleanliness Condition', 20, y);
  y += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const propreteText = dossier.evaluation_proprete === 'tres_propre' 
    ? (isFrench ? 'Très propre' : 'Very clean')
    : dossier.evaluation_proprete === 'correct'
    ? (isFrench ? 'Correct' : 'Correct')
    : (isFrench ? 'Pas satisfaisant' : 'Not satisfactory');
  
  if (dossier.evaluation_proprete === 'pas_satisfaisant') {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(`${isFrench ? 'Évaluation' : 'Rating'}: ${propreteText}`, 20, y);
  doc.setTextColor(0, 0, 0);
  y += 10;
  
  // Commentaire propreté
  if (dossier.commentaire_proprete) {
    doc.text(`${isFrench ? 'Commentaire' : 'Comment'}:`, 20, y);
    y += 7;
    const lines = doc.splitTextToSize(dossier.commentaire_proprete, 170);
    lines.forEach(line => {
      doc.text(line, 20, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    y += 5;
  }
  
  // Objets modifiés/cassés
  if (dossier.objets_modifies?.length > 0) {
    y += 5;
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38);
    doc.text(isFrench ? '⚠️ Objets Modifiés/Cassés' : '⚠️ Modified/Broken Items', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    dossier.objets_modifies.forEach(obj => {
      doc.text(`  - ${obj}`, 25, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    y += 5;
  }
  
  // Photos
  if (dossier.photos_json && Object.keys(dossier.photos_json).length > 0) {
    y += 5;
    doc.setFontSize(14);
    doc.setTextColor(0, 119, 168);
    doc.text(isFrench ? '📸 Photos des Pièces' : '📸 Room Photos', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`${Object.keys(dossier.photos_json).length} ${isFrench ? 'photo(s) disponible(s)' : 'photo(s) available'}`, 20, y);
    y += 7;
    
    Object.keys(dossier.photos_json).forEach(piece => {
      doc.text(`  - ${piece}`, 25, y);
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