// Mapping des catégories d'hébergement vers les codes d'inventaire
export const categoryToCodeMapping = {
  // Chalets
  "Chalet Eco": "CHALET_ECO_1CH",
  "Chalet Classique": "CHALET_CLASSIQUE",
  
  // Mobil-homes Éco
  "Mobil-home Eco": "MH_ECO_2CH",
  "Mobil-home Eco Clim": "MH_ECO_CLIM_2CH",
  
  // Mobil-homes Classique
  "Mobil-home Classique": "MH_CLASSIQUE_2CH",
  "Mobil-home Classique Clim": "MH_CLASSIQUE_CLIM_2CH",
  "Mobil-home Classique 3ch": "MH_CLASSIQUE_3CH",
  
  // Mobil-homes Confort+
  "Confort+ 2ch": "MH_CONFORT_PLUS_2CH",
  "Confort+ 3ch": "MH_CONFORT_PLUS_3CH",
  
  // Mobil-homes Premium
  "Premium 2ch": "MH_PREMIUM_2CH",
  "Premium 3ch": "MH_PREMIUM_3CH",
  "Premium Twins": "MH_PREMIUM_TWINS",
  
  // Cottage
  "Cottage Premium": "COTTAGE_PREMIUM"
};

import { getCachedInventaire, setCachedInventaire } from './inventaireCache';

export const getCodeFromCategory = (category) => {
  return categoryToCodeMapping[category] || null;
};

// Fonction pour récupérer l'inventaire d'une catégorie
export const getInventaireParCategorie = (categorie, lang = 'fr') => {
  const code = getCodeFromCategory(categorie);
  if (!code) return null;
  
  // Vérifier le cache d'abord
  const cacheKey = `${code}_${lang}`;
  const cached = getCachedInventaire(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Import dynamique des inventaires - TOUS LES TYPES
  const inventaireBase = [
    { id: 'assiettes_plates', icon: '🍽️', label_fr: 'Assiettes plates', label_en: 'Dinner plates' },
    { id: 'assiettes_creuses', icon: '🥣', label_fr: 'Assiettes creuses', label_en: 'Soup plates' },
    { id: 'verres', icon: '🥤', label_fr: 'Verres', label_en: 'Glasses' },
    { id: 'tasses', icon: '☕', label_fr: 'Tasses', label_en: 'Cups' },
    { id: 'couverts', icon: '🍴', label_fr: 'Couverts', label_en: 'Cutlery' },
    { id: 'casseroles', icon: '🍲', label_fr: 'Casseroles', label_en: 'Pots' },
    { id: 'poeles', icon: '🍳', label_fr: 'Poêles', label_en: 'Pans' },
    { id: 'plats', icon: '🍛', label_fr: 'Plats', label_en: 'Dishes' },
    { id: 'saladiers', icon: '🥗', label_fr: 'Saladiers', label_en: 'Salad bowls' },
    { id: 'cafetiere', icon: '☕', label_fr: 'Cafetière', label_en: 'Coffee maker' },
    { id: 'bouilloire', icon: '🫖', label_fr: 'Bouilloire', label_en: 'Kettle' },
    { id: 'micro_ondes', icon: '📻', label_fr: 'Micro-ondes', label_en: 'Microwave' },
    { id: 'frigo', icon: '🧊', label_fr: 'Réfrigérateur', label_en: 'Refrigerator' },
    { id: 'table_exterieure', icon: '🪑', label_fr: 'Table extérieure', label_en: 'Outdoor table' },
    { id: 'chaises_exterieure', icon: '🪑', label_fr: 'Chaises extérieures', label_en: 'Outdoor chairs' },
    { id: 'parasol', icon: '⛱️', label_fr: 'Parasol', label_en: 'Umbrella' },
    { id: 'balai', icon: '🧹', label_fr: 'Balai', label_en: 'Broom' },
    { id: 'serpilliere', icon: '🧽', label_fr: 'Serpillière', label_en: 'Mop' },
    { id: 'oreiller', icon: '🛏️', label_fr: 'Oreillers', label_en: 'Pillows' },
    { id: 'couverture', icon: '🛏️', label_fr: 'Couvertures', label_en: 'Blankets' },
  ];

  const inventairesData = {
    'CHALET_ECO_1CH': {
      titre_fr: 'Chalet Éco 1 chambre',
      titre_en: 'Eco Chalet 1 bedroom',
      objets: inventaireBase
    },
    'CHALET_CLASSIQUE': {
      titre_fr: 'Chalet Classique 1 chambre',
      titre_en: 'Classic Chalet 1 bedroom',
      objets: [...inventaireBase, { id: 'tv', icon: '📺', label_fr: 'TV', label_en: 'TV' }]
    },
    'MH_ECO_2CH': {
      titre_fr: 'Mobil-home Éco 2 chambres',
      titre_en: 'Eco Mobile Home 2 bedrooms',
      objets: inventaireBase
    },
    'MH_ECO_CLIM_2CH': {
      titre_fr: 'Mobil-home Éco Clim 2 chambres',
      titre_en: 'Eco AC Mobile Home 2 bedrooms',
      objets: [...inventaireBase, { id: 'clim', icon: '❄️', label_fr: 'Climatisation', label_en: 'Air conditioning' }]
    },
    'MH_CLASSIQUE_2CH': {
      titre_fr: 'Mobil-home Classique 2 chambres',
      titre_en: 'Classic Mobile Home 2 bedrooms',
      objets: [...inventaireBase, { id: 'tv', icon: '📺', label_fr: 'TV', label_en: 'TV' }]
    },
    'MH_CLASSIQUE_CLIM_2CH': {
      titre_fr: 'Mobil-home Classique Clim 2 chambres',
      titre_en: 'Classic AC Mobile Home 2 bedrooms',
      objets: [...inventaireBase, 
        { id: 'tv', icon: '📺', label_fr: 'TV', label_en: 'TV' },
        { id: 'clim', icon: '❄️', label_fr: 'Climatisation', label_en: 'Air conditioning' }
      ]
    },
    'MH_CLASSIQUE_3CH': {
      titre_fr: 'Mobil-home Classique 3 chambres',
      titre_en: 'Classic Mobile Home 3 bedrooms',
      objets: [...inventaireBase, 
        { id: 'tv', icon: '📺', label_fr: 'TV', label_en: 'TV' },
        { id: 'oreiller_3', icon: '🛏️', label_fr: 'Oreillers chambre 3', label_en: 'Pillows bedroom 3' }
      ]
    },
    'MH_CONFORT_PLUS_2CH': {
      titre_fr: 'Mobil-home Confort+ 2 chambres',
      titre_en: 'Comfort+ Mobile Home 2 bedrooms',
      objets: [...inventaireBase, 
        { id: 'tv', icon: '📺', label_fr: 'TV', label_en: 'TV' },
        { id: 'clim', icon: '❄️', label_fr: 'Climatisation', label_en: 'Air conditioning' },
        { id: 'plancha', icon: '🍖', label_fr: 'Plancha', label_en: 'Griddle' }
      ]
    },
    'MH_CONFORT_PLUS_3CH': {
      titre_fr: 'Mobil-home Confort+ 3 chambres',
      titre_en: 'Comfort+ Mobile Home 3 bedrooms',
      objets: [...inventaireBase, 
        { id: 'tv', icon: '📺', label_fr: 'TV', label_en: 'TV' },
        { id: 'clim', icon: '❄️', label_fr: 'Climatisation', label_en: 'Air conditioning' },
        { id: 'plancha', icon: '🍖', label_fr: 'Plancha', label_en: 'Griddle' },
        { id: 'oreiller_3', icon: '🛏️', label_fr: 'Oreillers chambre 3', label_en: 'Pillows bedroom 3' }
      ]
    },
    'MH_PREMIUM_2CH': {
      titre_fr: 'Mobil-home Premium 2 chambres',
      titre_en: 'Premium Mobile Home 2 bedrooms',
      objets: [...inventaireBase, 
        { id: 'tv', icon: '📺', label_fr: 'TV', label_en: 'TV' },
        { id: 'clim', icon: '❄️', label_fr: 'Climatisation', label_en: 'Air conditioning' },
        { id: 'plancha', icon: '🍖', label_fr: 'Plancha', label_en: 'Griddle' },
        { id: 'lave_vaisselle', icon: '🍽️', label_fr: 'Lave-vaisselle', label_en: 'Dishwasher' }
      ]
    },
    'MH_PREMIUM_3CH': {
      titre_fr: 'Mobil-home Premium 3 chambres',
      titre_en: 'Premium Mobile Home 3 bedrooms',
      objets: [...inventaireBase, 
        { id: 'tv', icon: '📺', label_fr: 'TV', label_en: 'TV' },
        { id: 'clim', icon: '❄️', label_fr: 'Climatisation', label_en: 'Air conditioning' },
        { id: 'plancha', icon: '🍖', label_fr: 'Plancha', label_en: 'Griddle' },
        { id: 'lave_vaisselle', icon: '🍽️', label_fr: 'Lave-vaisselle', label_en: 'Dishwasher' },
        { id: 'oreiller_3', icon: '🛏️', label_fr: 'Oreillers chambre 3', label_en: 'Pillows bedroom 3' }
      ]
    },
    'MH_PREMIUM_TWINS': {
      titre_fr: 'Mobil-home Premium Twins',
      titre_en: 'Premium Twins Mobile Home',
      objets: [...inventaireBase, 
        { id: 'tv', icon: '📺', label_fr: 'TV', label_en: 'TV' },
        { id: 'clim', icon: '❄️', label_fr: 'Climatisation', label_en: 'Air conditioning' },
        { id: 'plancha', icon: '🍖', label_fr: 'Plancha', label_en: 'Griddle' },
        { id: 'lave_vaisselle', icon: '🍽️', label_fr: 'Lave-vaisselle', label_en: 'Dishwasher' },
        { id: 'tv_2', icon: '📺', label_fr: 'TV chambre 2', label_en: 'TV bedroom 2' }
      ]
    },
    'COTTAGE_PREMIUM': {
      titre_fr: 'Cottage Premium',
      titre_en: 'Premium Cottage',
      objets: [...inventaireBase, 
        { id: 'tv', icon: '📺', label_fr: 'TV', label_en: 'TV' },
        { id: 'clim', icon: '❄️', label_fr: 'Climatisation', label_en: 'Air conditioning' },
        { id: 'plancha', icon: '🍖', label_fr: 'Plancha', label_en: 'Griddle' },
        { id: 'lave_vaisselle', icon: '🍽️', label_fr: 'Lave-vaisselle', label_en: 'Dishwasher' },
        { id: 'lave_linge', icon: '👕', label_fr: 'Lave-linge', label_en: 'Washing machine' },
        { id: 'seche_linge', icon: '👔', label_fr: 'Sèche-linge', label_en: 'Dryer' }
      ]
    }
  };
  
  const inventaire = inventairesData[code];
  if (!inventaire) return null;
  
  const result = {
    titre: lang === 'fr' ? inventaire.titre_fr : inventaire.titre_en,
    objets: inventaire.objets.map(obj => ({
      id: obj.id,
      icon: obj.icon,
      label: lang === 'fr' ? obj.label_fr : obj.label_en
    }))
  };
  
  // Mettre en cache
  setCachedInventaire(cacheKey, result);
  
  return result;
};