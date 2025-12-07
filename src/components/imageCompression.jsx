/**
 * Compresse une image avant upload
 * Redimensionne à 1600px max et compresse en JPEG 70%
 * Réduit la taille de 3-8 Mo à 150-300 ko
 */
export const compressImage = async (file, maxWidth = 1600, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    // Vérifier que c'est bien une image
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        // Calculer les nouvelles dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Créer un canvas pour la compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en blob compressé
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            
            // Créer un nouveau fichier avec le blob compressé
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            console.log(`Image compressée: ${(file.size / 1024 / 1024).toFixed(2)} Mo -> ${(compressedFile.size / 1024).toFixed(0)} Ko`);
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
    };
    
    reader.onerror = () => reject(new Error('File read failed'));
  });
};

/**
 * Hook pour uploader une image avec compression automatique
 */
export const uploadCompressedImage = async (file, uploadFn) => {
  if (!file) return null;
  
  try {
    // Compresser l'image
    const compressedFile = await compressImage(file);
    
    // Upload avec la fonction fournie
    const result = await uploadFn(compressedFile);
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};