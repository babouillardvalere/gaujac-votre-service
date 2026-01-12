/**
 * Système de cache pour les inventaires
 * Stocke en sessionStorage pour éviter de recharger à chaque page
 */

const CACHE_PREFIX = 'inventaire_cache_';
const CACHE_VERSION = 'v2_with_beds'; // Version avec lits intégrés
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Récupère un inventaire depuis le cache
 */
export const getCachedInventaire = (codeCategorie) => {
  if (!codeCategorie) return null;
  
  try {
    const cacheKey = `${CACHE_PREFIX}${codeCategorie}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp, version } = JSON.parse(cached);
    
    // Invalider si version différente (structure inventaire modifiée)
    if (version !== CACHE_VERSION) {
      console.log(`🔄 Cache "${codeCategorie}" invalidé (version ${version} → ${CACHE_VERSION})`);
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    
    // Vérifier si le cache est encore valide
    if (Date.now() - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    
    console.log(`✅ Inventaire "${codeCategorie}" chargé depuis le cache`);
    return data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};

/**
 * Stocke un inventaire dans le cache
 */
export const setCachedInventaire = (codeCategorie, data) => {
  if (!codeCategorie || !data) return;
  
  try {
    const cacheKey = `${CACHE_PREFIX}${codeCategorie}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };
    
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`💾 Inventaire "${codeCategorie}" mis en cache`);
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

/**
 * Vide le cache des inventaires (utile si mise à jour)
 */
export const clearInventaireCache = () => {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cache inventaires vidé');
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

/**
 * Hook pour charger un inventaire avec cache automatique
 */
export const useInventaireWithCache = (codeCategorie, fetchFn) => {
  // Essayer de charger depuis le cache
  const cached = getCachedInventaire(codeCategorie);
  
  if (cached) {
    return {
      data: cached,
      isLoading: false,
      fromCache: true
    };
  }
  
  // Si pas en cache, charger et mettre en cache
  return {
    data: null,
    isLoading: true,
    fromCache: false,
    loadAndCache: async () => {
      const data = await fetchFn();
      setCachedInventaire(codeCategorie, data);
      return data;
    }
  };
};