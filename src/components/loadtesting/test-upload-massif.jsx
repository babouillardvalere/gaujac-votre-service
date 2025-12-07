/**
 * 📸 TEST UPLOAD MASSIF PHOTOS - 150-200 IMAGES SIMULTANÉES
 * 
 * Simule inventaires multiples avec uploads photos
 * 
 * USAGE:
 * 1. Ouvrir console navigateur
 * 2. Copier-coller ce script
 * 3. Exécuter: await testUploadMassif(200, 50)
 */

import { base44 } from '@/api/base44Client';
import { uploadCompressedImage } from '../imageCompression';

/**
 * Génère une image de test aléatoire
 */
function generateTestImage(sizeKB = 2000) {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  
  // Remplir avec pattern aléatoire
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = Math.random() * 255;     // R
    imageData.data[i+1] = Math.random() * 255;   // G
    imageData.data[i+2] = Math.random() * 255;   // B
    imageData.data[i+3] = 255;                   // A
  }
  ctx.putImageData(imageData, 0, 0);
  
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      resolve(new File([blob], `test-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  });
}

/**
 * Upload une image avec compression
 */
async function uploadTestImage(index) {
  const startTime = performance.now();
  
  try {
    // Générer image test
    const image = await generateTestImage(2000 + Math.random() * 2000); // 2-4MB
    const originalSize = image.size;
    
    const compressionStart = performance.now();
    
    // Upload avec compression
    const result = await uploadCompressedImage(
      image,
      (compressedFile) => base44.integrations.Core.UploadFile({ file: compressedFile })
    );
    
    const compressionTime = performance.now() - compressionStart;
    const totalTime = performance.now() - startTime;
    
    // Vérifier taille finale
    const response = await fetch(result.file_url, { method: 'HEAD' });
    const finalSize = parseInt(response.headers.get('content-length') || 0);
    
    return {
      success: true,
      index,
      original_size: originalSize,
      final_size: finalSize,
      compression_ratio: Math.round((1 - finalSize/originalSize) * 100),
      compression_time: Math.round(compressionTime),
      total_time: Math.round(totalTime),
      file_url: result.file_url
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      index,
      error: error.message,
      duration: Math.round(endTime - startTime)
    };
  }
}

/**
 * Test upload massif avec parallélisation
 */
export async function testUploadMassif(nbPhotos = 200, batchSize = 50) {
  console.log(`📸 DÉMARRAGE TEST UPLOAD MASSIF: ${nbPhotos} photos`);
  console.log(`📦 Upload par batch de ${batchSize}\n`);
  
  const globalStart = performance.now();
  const results = [];
  
  // Upload par batch
  for (let i = 0; i < nbPhotos; i += batchSize) {
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(nbPhotos / batchSize);
    const batchCount = Math.min(batchSize, nbPhotos - i);
    
    console.log(`\n📦 Batch ${batchNum}/${totalBatches}: ${batchCount} photos`);
    
    const batchStart = performance.now();
    
    // Upload parallèle
    const promises = [];
    for (let j = 0; j < batchCount; j++) {
      promises.push(uploadTestImage(i + j));
    }
    
    const batchResults = await Promise.all(promises);
    const batchDuration = performance.now() - batchStart;
    
    const batchSuccesses = batchResults.filter(r => r.success).length;
    console.log(`✅ Batch terminé: ${batchSuccesses}/${batchCount} réussis en ${Math.round(batchDuration/1000)}s`);
    
    results.push(...batchResults);
    
    // Pause entre batch
    if (i + batchSize < nbPhotos) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  const globalDuration = performance.now() - globalStart;
  
  // Analyse
  const stats = analyzeUploadResults(results, globalDuration);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS TEST UPLOAD MASSIF');
  console.log('='.repeat(60));
  
  displayUploadResults(stats);
  
  return stats;
}

/**
 * Analyse résultats upload
 */
function analyzeUploadResults(results, totalDuration) {
  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);
  
  const compressionTimes = successes.map(r => r.compression_time);
  const totalTimes = successes.map(r => r.total_time);
  const originalSizes = successes.map(r => r.original_size);
  const finalSizes = successes.map(r => r.final_size);
  const ratios = successes.map(r => r.compression_ratio);
  
  return {
    total_photos: results.length,
    reussies: successes.length,
    echouees: failures.length,
    taux_succes: Math.round(successes.length / results.length * 100),
    
    duree_totale: Math.round(totalDuration / 1000),
    
    compression: {
      min: Math.min(...compressionTimes),
      max: Math.max(...compressionTimes),
      moyenne: Math.round(compressionTimes.reduce((a,b) => a+b, 0) / compressionTimes.length),
      p95: percentile(compressionTimes, 95)
    },
    
    upload_total: {
      min: Math.min(...totalTimes),
      max: Math.max(...totalTimes),
      moyenne: Math.round(totalTimes.reduce((a,b) => a+b, 0) / totalTimes.length),
      p95: percentile(totalTimes, 95)
    },
    
    taille_originale: {
      moyenne: Math.round(originalSizes.reduce((a,b) => a+b, 0) / originalSizes.length / 1024),
      total_mb: Math.round(originalSizes.reduce((a,b) => a+b, 0) / 1024 / 1024)
    },
    
    taille_finale: {
      moyenne: Math.round(finalSizes.reduce((a,b) => a+b, 0) / finalSizes.length / 1024),
      total_mb: Math.round(finalSizes.reduce((a,b) => a+b, 0) / 1024 / 1024)
    },
    
    compression_ratio: {
      min: Math.min(...ratios),
      max: Math.max(...ratios),
      moyenne: Math.round(ratios.reduce((a,b) => a+b, 0) / ratios.length)
    },
    
    erreurs: failures.map(f => ({ index: f.index, error: f.error }))
  };
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * (p / 100)) - 1;
  return sorted[index];
}

/**
 * Affiche résultats upload
 */
function displayUploadResults(stats) {
  console.log(`\n📈 PERFORMANCE GLOBALE:`);
  console.log(`   Total photos: ${stats.total_photos}`);
  console.log(`   Réussies: ${stats.reussies} (${stats.taux_succes}%)`);
  console.log(`   Échouées: ${stats.echouees}`);
  console.log(`   Durée totale: ${stats.duree_totale}s`);
  
  console.log(`\n⏱️ TEMPS COMPRESSION:`);
  console.log(`   Min: ${stats.compression.min}ms`);
  console.log(`   Moyenne: ${stats.compression.moyenne}ms`);
  console.log(`   Max: ${stats.compression.max}ms`);
  console.log(`   P95: ${stats.compression.p95}ms`);
  
  console.log(`\n⏱️ TEMPS TOTAL (Compression + Upload):`);
  console.log(`   Min: ${stats.upload_total.min}ms`);
  console.log(`   Moyenne: ${stats.upload_total.moyenne}ms`);
  console.log(`   Max: ${stats.upload_total.max}ms`);
  console.log(`   P95: ${stats.upload_total.p95}ms`);
  
  console.log(`\n📦 COMPRESSION EFFICACITÉ:`);
  console.log(`   Taille originale moyenne: ${stats.taille_originale.moyenne} KB`);
  console.log(`   Taille finale moyenne: ${stats.taille_finale.moyenne} KB`);
  console.log(`   Ratio compression moyen: ${stats.compression_ratio.moyenne}%`);
  console.log(`   Total avant: ${stats.taille_originale.total_mb} MB`);
  console.log(`   Total après: ${stats.taille_finale.total_mb} MB`);
  console.log(`   Gain: ${stats.taille_originale.total_mb - stats.taille_finale.total_mb} MB`);
  
  // Conformité
  const conforme = {
    compression_rapide: stats.compression.moyenne < 2000,
    upload_rapide: stats.upload_total.moyenne < 5000,
    taille_optimisee: stats.taille_finale.moyenne < 400,
    taux_succes: stats.taux_succes === 100,
    compression_efficace: stats.compression_ratio.moyenne > 60
  };
  
  console.log(`\n✅ CONFORMITÉ OBJECTIFS:`);
  console.log(`   ${conforme.compression_rapide ? '✅' : '❌'} Compression < 2s/photo: ${conforme.compression_rapide ? 'OUI' : 'NON'}`);
  console.log(`   ${conforme.upload_rapide ? '✅' : '❌'} Upload total < 5s/photo: ${conforme.upload_rapide ? 'OUI' : 'NON'}`);
  console.log(`   ${conforme.taille_optimisee ? '✅' : '❌'} Taille finale < 400KB: ${conforme.taille_optimisee ? 'OUI' : 'NON'}`);
  console.log(`   ${conforme.taux_succes ? '✅' : '❌'} Taux succès 100%: ${conforme.taux_succes ? 'OUI' : 'NON'}`);
  console.log(`   ${conforme.compression_efficace ? '✅' : '❌'} Compression > 60%: ${conforme.compression_efficace ? 'OUI' : 'NON'}`);
  
  const tousConformes = Object.values(conforme).every(c => c);
  console.log(`\n${tousConformes ? '✅' : '❌'} VERDICT: ${tousConformes ? 'TEST RÉUSSI' : 'OPTIMISATIONS NÉCESSAIRES'}`);
  
  if (!conforme.taille_optimisee || !conforme.compression_efficace) {
    console.log(`\n💡 RECOMMANDATION: Implémenter conversion WebP pour gain supplémentaire 30-50%`);
  }
  
  if (stats.erreurs.length > 0) {
    console.log(`\n❌ DÉTAIL ERREURS:`);
    stats.erreurs.forEach(err => {
      console.log(`   Photo #${err.index}: ${err.error}`);
    });
  }
}

// Export global
if (typeof window !== 'undefined') {
  window.testUploadMassif = testUploadMassif;
}

export default testUploadMassif;