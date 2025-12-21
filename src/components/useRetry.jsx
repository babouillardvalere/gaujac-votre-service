import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook pour gérer les retry avec backoff exponentiel
 * @param {Function} operation - Fonction async à exécuter
 * @param {Object} options - Configuration
 * @returns {Object} - { execute, loading, error, retryCount }
 */
export function useRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onError = null,
    onSuccess = null,
    showToast = true,
    lang = 'fr'
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const execute = async (...args) => {
    setLoading(true);
    setError(null);
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation(...args);
        
        setLoading(false);
        setRetryCount(0);
        
        if (onSuccess) onSuccess(result);
        
        return { success: true, data: result };
      } catch (err) {
        lastError = err;
        console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, err);

        if (attempt < maxRetries) {
          const delay = Math.min(
            initialDelay * Math.pow(backoffMultiplier, attempt),
            maxDelay
          );
          
          if (showToast) {
            toast.error(
              lang === 'fr'
                ? `Erreur, nouvelle tentative dans ${Math.round(delay / 1000)}s... (${attempt + 1}/${maxRetries})`
                : `Error, retrying in ${Math.round(delay / 1000)}s... (${attempt + 1}/${maxRetries})`
            );
          }
          
          setRetryCount(attempt + 1);
          await sleep(delay);
        }
      }
    }

    // Toutes les tentatives ont échoué
    setLoading(false);
    setError(lastError);
    setRetryCount(0);
    
    if (onError) onError(lastError);
    
    if (showToast) {
      toast.error(
        lang === 'fr'
          ? `Échec après ${maxRetries + 1} tentatives. Veuillez réessayer plus tard.`
          : `Failed after ${maxRetries + 1} attempts. Please try again later.`
      );
    }

    return { success: false, error: lastError };
  };

  return {
    execute,
    loading,
    error,
    retryCount
  };
}

/**
 * Wrapper simplifié pour upload de fichiers avec retry
 */
export async function uploadFileWithRetry(file, options = {}) {
  const {
    maxRetries = 3,
    onProgress = null,
    lang = 'fr'
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (onProgress) onProgress({ attempt: attempt + 1, total: maxRetries + 1 });
      
      const { base44 } = await import('@/api/base44Client');
      const result = await base44.integrations.Core.UploadFile({ file });
      
      return { success: true, data: result };
    } catch (error) {
      console.error(`Upload attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        toast.error(
          lang === 'fr'
            ? 'Échec de l\'upload après plusieurs tentatives'
            : 'Upload failed after multiple attempts'
        );
        return { success: false, error };
      }
    }
  }
}