/**
 * 🔥 TEST SURCHARGE PDF - 30-50 GÉNÉRATION SIMULTANÉES
 * 
 * Simule le samedi haute saison avec nombreux départs
 * 
 * USAGE:
 * 1. Ouvrir console navigateur sur page AdminLoadTest
 * 2. Copier-coller ce script
 * 3. Exécuter: await testSurchargePDF(50)
 * 4. Analyser résultats
 */

import { base44 } from '@/api/base44Client';
import jsPDF from 'jspdf';

/**
 * Génère un PDF de test (simulant ReceptionFicheArrivee)
 */
async function generateTestPDF(fiche, index) {
  const startTime = performance.now();
  
  try {
    const doc = new jsPDF();
    
    // Simuler contenu réel
    doc.setFontSize(16);
    doc.text('FICHE D\'ARRIVÉE - CAMPING PARADIS', 20, 20);
    doc.setFontSize(12);
    doc.text(`Client: ${fiche.client_nom} ${fiche.client_prenom}`, 20, 35);
    doc.text(`Logement: ${fiche.numero_logement}`, 20, 45);
    doc.text(`Dates: ${fiche.date_arrivee} → ${fiche.date_depart}`, 20, 55);
    doc.text(`Évaluation propreté: ${fiche.evaluation_proprete}`, 20, 65);
    
    // Simuler inventaire (50 lignes)
    let y = 80;
    for (let i = 0; i < 50; i++) {
      doc.text(`Objet ${i+1}: Validé`, 20, y);
      y += 5;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    }
    
    // Convertir en blob
    const pdfBlob = doc.output('blob');
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Simuler upload (Core.UploadFile)
    const file = new File([pdfBlob], `fiche-${fiche.id}.pdf`, { type: 'application/pdf' });
    const uploadStart = performance.now();
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const uploadDuration = performance.now() - uploadStart;
    
    return {
      success: true,
      index,
      fiche_id: fiche.id,
      generation_time: Math.round(duration),
      upload_time: Math.round(uploadDuration),
      total_time: Math.round(duration + uploadDuration),
      pdf_size: pdfBlob.size,
      pdf_url: file_url
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      index,
      fiche_id: fiche.id,
      error: error.message,
      duration: Math.round(endTime - startTime)
    };
  }
}

/**
 * Test de surcharge: génère N PDFs en parallèle
 */
export async function testSurchargePDF(nbPDFs = 50, batchSize = 10) {
  console.log(`🔥 DÉMARRAGE TEST SURCHARGE PDF: ${nbPDFs} PDFs`);
  console.log(`📦 Génération par batch de ${batchSize}\n`);
  
  const globalStart = performance.now();
  const results = [];
  
  // Récupérer fiches test
  const fiches = await base44.entities.FicheArrivee.list('-created_date', nbPDFs);
  
  if (fiches.length < nbPDFs) {
    console.warn(`⚠️ Seulement ${fiches.length} fiches disponibles (${nbPDFs} demandés)`);
  }
  
  const fichesToProcess = fiches.slice(0, Math.min(nbPDFs, fiches.length));
  
  // Générer par batch pour simuler pics réalistes
  for (let i = 0; i < fichesToProcess.length; i += batchSize) {
    const batch = fichesToProcess.slice(i, i + batchSize);
    console.log(`\n📦 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(fichesToProcess.length/batchSize)}: ${batch.length} PDFs`);
    
    const batchStart = performance.now();
    
    // Génération parallèle du batch
    const batchResults = await Promise.all(
      batch.map((fiche, idx) => generateTestPDF(fiche, i + idx))
    );
    
    const batchDuration = performance.now() - batchStart;
    console.log(`✅ Batch terminé en ${Math.round(batchDuration)}ms`);
    
    results.push(...batchResults);
    
    // Pause entre batch (simule arrivée progressive)
    if (i + batchSize < fichesToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  const globalDuration = performance.now() - globalStart;
  
  // Analyse résultats
  const stats = analyzeResults(results, globalDuration);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS TEST SURCHARGE PDF');
  console.log('='.repeat(60));
  
  displayResults(stats);
  
  return stats;
}

/**
 * Analyse les résultats du test
 */
function analyzeResults(results, totalDuration) {
  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);
  
  const generationTimes = successes.map(r => r.generation_time);
  const uploadTimes = successes.map(r => r.upload_time);
  const totalTimes = successes.map(r => r.total_time);
  const pdfSizes = successes.map(r => r.pdf_size);
  
  return {
    total_pdfs: results.length,
    reussis: successes.length,
    echecs: failures.length,
    taux_succes: Math.round(successes.length / results.length * 100),
    
    duree_totale: Math.round(totalDuration / 1000),
    
    generation: {
      min: Math.min(...generationTimes),
      max: Math.max(...generationTimes),
      moyenne: Math.round(generationTimes.reduce((a,b) => a+b, 0) / generationTimes.length),
      p95: percentile(generationTimes, 95)
    },
    
    upload: {
      min: Math.min(...uploadTimes),
      max: Math.max(...uploadTimes),
      moyenne: Math.round(uploadTimes.reduce((a,b) => a+b, 0) / uploadTimes.length),
      p95: percentile(uploadTimes, 95)
    },
    
    total: {
      min: Math.min(...totalTimes),
      max: Math.max(...totalTimes),
      moyenne: Math.round(totalTimes.reduce((a,b) => a+b, 0) / totalTimes.length),
      p95: percentile(totalTimes, 95)
    },
    
    taille_pdf: {
      min: Math.round(Math.min(...pdfSizes) / 1024),
      max: Math.round(Math.max(...pdfSizes) / 1024),
      moyenne: Math.round(pdfSizes.reduce((a,b) => a+b, 0) / pdfSizes.length / 1024),
      total_kb: Math.round(pdfSizes.reduce((a,b) => a+b, 0) / 1024)
    },
    
    erreurs: failures.map(f => ({ index: f.index, error: f.error }))
  };
}

/**
 * Calcule percentile
 */
function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * (p / 100)) - 1;
  return sorted[index];
}

/**
 * Affiche les résultats formatés
 */
function displayResults(stats) {
  console.log(`\n📈 PERFORMANCE GLOBALE:`);
  console.log(`   Total PDFs: ${stats.total_pdfs}`);
  console.log(`   Réussis: ${stats.reussis} (${stats.taux_succes}%)`);
  console.log(`   Échecs: ${stats.echecs}`);
  console.log(`   Durée totale: ${stats.duree_totale}s`);
  
  console.log(`\n⏱️ TEMPS GÉNÉRATION PDF:`);
  console.log(`   Min: ${stats.generation.min}ms`);
  console.log(`   Moyenne: ${stats.generation.moyenne}ms`);
  console.log(`   Max: ${stats.generation.max}ms`);
  console.log(`   P95: ${stats.generation.p95}ms`);
  
  console.log(`\n📤 TEMPS UPLOAD:`);
  console.log(`   Min: ${stats.upload.min}ms`);
  console.log(`   Moyenne: ${stats.upload.moyenne}ms`);
  console.log(`   Max: ${stats.upload.max}ms`);
  console.log(`   P95: ${stats.upload.p95}ms`);
  
  console.log(`\n⏱️ TEMPS TOTAL (Génération + Upload):`);
  console.log(`   Min: ${stats.total.min}ms`);
  console.log(`   Moyenne: ${stats.total.moyenne}ms`);
  console.log(`   Max: ${stats.total.max}ms`);
  console.log(`   P95: ${stats.total.p95}ms`);
  
  console.log(`\n📦 TAILLE PDFs:`);
  console.log(`   Min: ${stats.taille_pdf.min} KB`);
  console.log(`   Moyenne: ${stats.taille_pdf.moyenne} KB`);
  console.log(`   Max: ${stats.taille_pdf.max} KB`);
  console.log(`   Total: ${stats.taille_pdf.total_kb} KB`);
  
  // Évaluation objectifs
  console.log(`\n✅ CONFORMITÉ OBJECTIFS:`);
  
  const conforme = {
    p95_temps: stats.total.p95 < 10000,
    taux_erreur: stats.echecs === 0,
    taille_pdf: stats.taille_pdf.moyenne < 500,
    temps_moyen: stats.total.moyenne < 8000
  };
  
  console.log(`   ${conforme.temps_moyen ? '✅' : '❌'} Temps moyen < 8s: ${conforme.temps_moyen ? 'OUI' : 'NON'} (${stats.total.moyenne}ms)`);
  console.log(`   ${conforme.p95_temps ? '✅' : '❌'} P95 < 10s: ${conforme.p95_temps ? 'OUI' : 'NON'} (${stats.total.p95}ms)`);
  console.log(`   ${conforme.taux_erreur ? '✅' : '❌'} Taux erreur < 1%: ${conforme.taux_erreur ? 'OUI' : 'NON'} (${stats.echecs})`);
  console.log(`   ${conforme.taille_pdf ? '✅' : '❌'} Taille PDF < 500KB: ${conforme.taille_pdf ? 'OUI' : 'NON'} (${stats.taille_pdf.moyenne}KB)`);
  
  const tousConformes = Object.values(conforme).every(c => c);
  
  console.log(`\n${tousConformes ? '✅' : '❌'} VERDICT: ${tousConformes ? 'TEST RÉUSSI' : 'OPTIMISATIONS NÉCESSAIRES'}`);
  
  if (!tousConformes) {
    console.log(`\n🔴 ACTIONS REQUISES:`);
    if (!conforme.temps_moyen || !conforme.p95_temps) {
      console.log(`   - Migrer génération PDF côté serveur (CRITIQUE)`);
    }
    if (!conforme.taille_pdf) {
      console.log(`   - Optimiser compression PDF (réduire images, fonts)`);
    }
    if (!conforme.taux_erreur) {
      console.log(`   - Corriger erreurs génération (${stats.echecs} échecs)`);
    }
  }
  
  if (stats.erreurs.length > 0) {
    console.log(`\n❌ DÉTAIL ERREURS:`);
    stats.erreurs.forEach(err => {
      console.log(`   PDF #${err.index}: ${err.error}`);
    });
  }
}

// Export pour utilisation globale
if (typeof window !== 'undefined') {
  window.testSurchargePDF = testSurchargePDF;
}

export default testSurchargePDF;