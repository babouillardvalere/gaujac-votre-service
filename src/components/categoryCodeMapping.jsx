// Mapping des catégories d'hébergement vers les codes d'inventaire
// IMPORTANT: Les clés doivent correspondre EXACTEMENT aux noms dans accommodationData.jsx
export const categoryToCodeMapping = {
  // Chalets (sans accent sur Eco)
  "Chalet Eco": "CHALET_ECO_1CH",
  "Chalet Classique": "CHALET_CLASSIQUE",
  
  // Mobil-homes Éco (sans accent sur Eco)
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
  
  // Inventaires complets par catégorie
  const INVENTAIRES = {
    CHALET_ECO_1CH: [
      // Vaisselle
      { id: 'assiettes_creuses', icon: '🍽️', label_fr: 'Assiettes creuses', label_en: 'Soup plates', quantity: 6 },
      { id: 'assiettes_dessert', icon: '🍰', label_fr: 'Assiettes à dessert', label_en: 'Dessert plates', quantity: 6 },
      { id: 'assiettes_plates', icon: '🍽️', label_fr: 'Assiettes plates', label_en: 'Dinner plates', quantity: 6 },
      { id: 'plat', icon: '🍲', label_fr: 'Plat', label_en: 'Serving dish', quantity: 1 },
      { id: 'bols', icon: '🥣', label_fr: 'Bols', label_en: 'Bowls', quantity: 6 },
      { id: 'saladier', icon: '🥗', label_fr: 'Saladier', label_en: 'Salad bowl', quantity: 1 },
      { id: 'tasses', icon: '☕', label_fr: 'Tasses', label_en: 'Cups', quantity: 6 },
      { id: 'verres_eau', icon: '🥛', label_fr: 'Verres', label_en: 'Glasses', quantity: 6 },
      { id: 'pichet', icon: '🍶', label_fr: 'Pichet / Carafe', label_en: 'Pitcher / Carafe', quantity: 1 },

      // Couverts & Ustensiles
      { id: 'fourchettes', icon: '🍴', label_fr: 'Fourchettes', label_en: 'Forks', quantity: 6 },
      { id: 'cuilleres_soupe', icon: '🥄', label_fr: 'Cuillères à soupe', label_en: 'Soup spoons', quantity: 6 },
      { id: 'cuilleres_cafe', icon: '🥄', label_fr: 'Cuillères à café', label_en: 'Coffee spoons', quantity: 6 },
      { id: 'couteau_pain', icon: '🔪', label_fr: 'Couteau à pain', label_en: 'Bread knife', quantity: 1 },
      { id: 'couteaux', icon: '🔪', label_fr: 'Couteaux', label_en: 'Knives', quantity: 6 },
      { id: 'cendrier', icon: '🚬', label_fr: 'Cendrier', label_en: 'Ashtray', quantity: 1 },
      { id: 'couvert_salade', icon: '🥗', label_fr: 'Couvert à salade', label_en: 'Salad servers', quantity: 1 },
      { id: 'ciseaux', icon: '✂️', label_fr: 'Ciseaux', label_en: 'Scissors', quantity: 1 },
      { id: 'spatule_bois', icon: '🥄', label_fr: 'Spatule en bois', label_en: 'Wooden spatula', quantity: 1 },
      { id: 'eplucheur', icon: '🥕', label_fr: 'Éplucheur', label_en: 'Peeler', quantity: 1 },
      { id: 'louche', icon: '🍜', label_fr: 'Louche', label_en: 'Ladle', quantity: 1 },
      { id: 'ecumoire', icon: '🥄', label_fr: 'Écumoire', label_en: 'Skimmer', quantity: 1 },
      { id: 'planche_decouper', icon: '🔪', label_fr: 'Planche à découper', label_en: 'Cutting board', quantity: 1 },
      { id: 'dessous_plat', icon: '🧤', label_fr: 'Dessous de plat', label_en: 'Trivet', quantity: 1 },
      { id: 'passoire', icon: '🥛', label_fr: 'Passoire', label_en: 'Colander', quantity: 1 },
      { id: 'essoreuse_salade', icon: '🥬', label_fr: 'Essoreuse à salade', label_en: 'Salad spinner', quantity: 1 },
      { id: 'tire_bouchon', icon: '🍷', label_fr: 'Tire-bouchon', label_en: 'Corkscrew', quantity: 1 },
      { id: 'ouvre_boite', icon: '🥫', label_fr: 'Ouvre-boîte', label_en: 'Can opener', quantity: 1 },
      { id: 'range_couverts', icon: '🍴', label_fr: 'Range couverts', label_en: 'Cutlery tray', quantity: 1 },
      { id: 'cloche_micro_onde', icon: '🥤', label_fr: 'Cloche micro-onde', label_en: 'Microwave cover', quantity: 1 },
      { id: 'bac_glacons', icon: '🧊', label_fr: 'Bac à glaçons', label_en: 'Ice cube tray', quantity: 1 },

      // Cuisson / Électroménager
      { id: 'casseroles', icon: '🍲', label_fr: 'Casseroles', label_en: 'Pots', quantity: 3 },
      { id: 'poele', icon: '🍳', label_fr: 'Poêle', label_en: 'Pan', quantity: 1 },
      { id: 'faitout', icon: '🍲', label_fr: 'Faitout + couvercle', label_en: 'Dutch oven + lid', quantity: 1 },
      { id: 'couvercle', icon: '🔥', label_fr: 'Couvercle', label_en: 'Lid', quantity: 1 },
      { id: 'cafetiere', icon: '☕', label_fr: 'Cafetière électrique', label_en: 'Electric coffee maker', quantity: 1 },
      { id: 'micro_ondes', icon: '📡', label_fr: 'Micro-ondes', label_en: 'Microwave', quantity: 1 },
      { id: 'refrigerateur', icon: '🧊', label_fr: 'Réfrigérateur', label_en: 'Refrigerator', quantity: 1 },

      // Ménage
      { id: 'kit_wc', icon: '🚽', label_fr: 'Kit brosse WC', label_en: 'Toilet kit', quantity: 1 },
      { id: 'seau', icon: '🪣', label_fr: 'Seau', label_en: 'Bucket', quantity: 1 },
      { id: 'bassine', icon: '🧴', label_fr: 'Bassine', label_en: 'Basin', quantity: 1 },
      { id: 'balai', icon: '🧹', label_fr: 'Balai', label_en: 'Broom', quantity: 1 },
      { id: 'balai_brosse', icon: '🧼', label_fr: 'Balai brosse', label_en: 'Scrubbing brush', quantity: 1 },
      { id: 'pelle_balayette', icon: '🧽', label_fr: 'Pelle + balayette', label_en: 'Dustpan + brush', quantity: 1 },
      { id: 'serpilliere', icon: '🪣', label_fr: 'Serpillière', label_en: 'Mop', quantity: 1 },
      { id: 'sechoir_linge', icon: '👕', label_fr: 'Séchoir à linge', label_en: 'Clothes dryer', quantity: 1 },
      { id: 'pinces_linge', icon: '🧷', label_fr: 'Pinces à linge', label_en: 'Clothespins', quantity: 8 },
      { id: 'poubelle', icon: '🗑️', label_fr: 'Poubelle', label_en: 'Trash can', quantity: 1 },
      { id: 'extincteur', icon: '🧯', label_fr: 'Extincteur', label_en: 'Fire extinguisher', quantity: 1 },
      { id: 'detecteur_fumee', icon: '🚨', label_fr: 'Détecteur de fumée', label_en: 'Smoke detector', quantity: 1 },

      // Nuit
      { id: 'couettes_doubles', icon: '🛏️', label_fr: 'Couettes doubles', label_en: 'Double duvets', quantity: 2 },
      { id: 'couette_simple', icon: '🛏️', label_fr: 'Couette simple', label_en: 'Single duvet', quantity: 1 },
      { id: 'oreillers', icon: '🛏️', label_fr: 'Oreillers', label_en: 'Pillows', quantity: 4 },
      { id: 'cintres', icon: '👗', label_fr: 'Cintres', label_en: 'Hangers', quantity: 10 },

      // Extérieur
      { id: 'cle_locatif', icon: '🗝️', label_fr: 'Clé locatif', label_en: 'Rental key', quantity: 1 },
      { id: 'carte_barriere', icon: '🪪', label_fr: 'Carte Barrière', label_en: 'Barrier card', quantity: 1 },
      { id: 'banc_bois', icon: '🌳', label_fr: 'Bancs en bois', label_en: 'Wooden benches', quantity: 2 },
      { id: 'table_jardin', icon: '🍽️', label_fr: 'Table de jardin', label_en: 'Garden table', quantity: 1 },
      { id: 'chaises_jardin', icon: '🪑', label_fr: 'Chaises de jardin', label_en: 'Garden chairs', quantity: 4 }
    ],

    CHALET_CLASSIQUE: [
      { id: 'assiettes_creuses', icon: '🍽️', label_fr: 'Assiettes creuses', label_en: 'Soup plates', quantity: 4 },
      { id: 'assiettes_dessert', icon: '🍰', label_fr: 'Assiettes dessert', label_en: 'Dessert plates', quantity: 4 },
      { id: 'assiettes_plates', icon: '🍽️', label_fr: 'Assiettes plates', label_en: 'Dinner plates', quantity: 4 },
      { id: 'plat', icon: '🍲', label_fr: 'Plat', label_en: 'Serving dish', quantity: 1 },
      { id: 'bols', icon: '🥣', label_fr: 'Bols', label_en: 'Bowls', quantity: 4 },
      { id: 'saladier', icon: '🥗', label_fr: 'Saladier', label_en: 'Salad bowl', quantity: 1 },
      { id: 'tasses', icon: '☕', label_fr: 'Tasses', label_en: 'Cups', quantity: 4 },
      { id: 'verres', icon: '🥛', label_fr: 'Verres', label_en: 'Glasses', quantity: 4 },
      { id: 'pichet', icon: '🍶', label_fr: 'Pichet / Carafe', label_en: 'Pitcher / Carafe', quantity: 1 },
      { id: 'fourchettes', icon: '🍴', label_fr: 'Fourchettes', label_en: 'Forks', quantity: 4 },
      { id: 'cuilleres_soupe', icon: '🥄', label_fr: 'Cuillères soupe', label_en: 'Soup spoons', quantity: 4 },
      { id: 'cuilleres_cafe', icon: '🥄', label_fr: 'Cuillères café', label_en: 'Coffee spoons', quantity: 4 },
      { id: 'couteau_pain', icon: '🔪', label_fr: 'Couteau pain', label_en: 'Bread knife', quantity: 1 },
      { id: 'couteaux', icon: '🔪', label_fr: 'Couteaux', label_en: 'Knives', quantity: 4 },
      { id: 'cendrier', icon: '🚬', label_fr: 'Cendrier', label_en: 'Ashtray', quantity: 1 },
      { id: 'couvert_salade', icon: '🥗', label_fr: 'Couvert salade', label_en: 'Salad servers', quantity: 1 },
      { id: 'ciseaux', icon: '✂️', label_fr: 'Ciseaux', label_en: 'Scissors', quantity: 1 },
      { id: 'spatule_bois', icon: '🥄', label_fr: 'Spatule bois', label_en: 'Wooden spatula', quantity: 1 },
      { id: 'eplucheur', icon: '🥕', label_fr: 'Éplucheur', label_en: 'Peeler', quantity: 1 },
      { id: 'louche', icon: '🍜', label_fr: 'Louche', label_en: 'Ladle', quantity: 1 },
      { id: 'ecumoire', icon: '🥄', label_fr: 'Écumoire', label_en: 'Skimmer', quantity: 1 },
      { id: 'planche_decouper', icon: '🔪', label_fr: 'Planche à découper', label_en: 'Cutting board', quantity: 1 },
      { id: 'dessous_plat', icon: '🧤', label_fr: 'Dessous de plat', label_en: 'Trivet', quantity: 1 },
      { id: 'passoire', icon: '🥛', label_fr: 'Passoire', label_en: 'Colander', quantity: 1 },
      { id: 'essoreuse_salade', icon: '🥬', label_fr: 'Essoreuse salade', label_en: 'Salad spinner', quantity: 1 },
      { id: 'tire_bouchon', icon: '🍷', label_fr: 'Tire-bouchon', label_en: 'Corkscrew', quantity: 1 },
      { id: 'ouvre_boite', icon: '🥫', label_fr: 'Ouvre-boîte', label_en: 'Can opener', quantity: 1 },
      { id: 'range_couverts', icon: '🍴', label_fr: 'Range-couverts', label_en: 'Cutlery tray', quantity: 1 },
      { id: 'cloche_micro_onde', icon: '🥤', label_fr: 'Cloche micro-onde', label_en: 'Microwave cover', quantity: 1 },
      { id: 'bac_glacons', icon: '🧊', label_fr: 'Bac glaçons', label_en: 'Ice cube tray', quantity: 1 },

      // Électroménager
      { id: 'casseroles', icon: '🍲', label_fr: 'Casseroles', label_en: 'Pots', quantity: 3 },
      { id: 'poele', icon: '🍳', label_fr: 'Poêle', label_en: 'Pan', quantity: 1 },
      { id: 'faitout', icon: '🍲', label_fr: 'Faitout + couvercle', label_en: 'Dutch oven + lid', quantity: 1 },
      { id: 'couvercle', icon: '🔥', label_fr: 'Couvercle', label_en: 'Lid', quantity: 1 },
      { id: 'cafetiere', icon: '☕', label_fr: 'Cafetière', label_en: 'Coffee maker', quantity: 1 },
      { id: 'micro_ondes', icon: '📡', label_fr: 'Micro-onde', label_en: 'Microwave', quantity: 1 },
      { id: 'tv', icon: '📺', label_fr: 'TV + télécommande', label_en: 'TV + remote', quantity: 1 },

      // Ménage
      { id: 'kit_wc', icon: '🚽', label_fr: 'Kit WC', label_en: 'Toilet kit', quantity: 1 },
      { id: 'seau', icon: '🪣', label_fr: 'Seau', label_en: 'Bucket', quantity: 1 },
      { id: 'bassine', icon: '🧴', label_fr: 'Bassine', label_en: 'Basin', quantity: 1 },
      { id: 'balai', icon: '🧹', label_fr: 'Balai', label_en: 'Broom', quantity: 1 },
      { id: 'balai_brosse', icon: '🧼', label_fr: 'Balai brosse', label_en: 'Scrubbing brush', quantity: 1 },
      { id: 'pelle_balayette', icon: '🧽', label_fr: 'Pelle + balayette', label_en: 'Dustpan + brush', quantity: 1 },
      { id: 'serpilliere', icon: '🪣', label_fr: 'Serpillère', label_en: 'Mop', quantity: 1 },
      { id: 'sechoir_linge', icon: '👕', label_fr: 'Séchoir à linge', label_en: 'Clothes dryer', quantity: 1 },
      { id: 'pinces_linge', icon: '🧷', label_fr: 'Pinces à linge', label_en: 'Clothespins', quantity: 8 },
      { id: 'poubelle', icon: '🗑️', label_fr: 'Poubelle', label_en: 'Trash can', quantity: 1 },
      { id: 'detecteur_fumee', icon: '🚨', label_fr: 'Détecteur fumée', label_en: 'Smoke detector', quantity: 1 },

      // Nuit
      { id: 'couette_double', icon: '🛏️', label_fr: 'Couette double', label_en: 'Double duvet', quantity: 1 },
      { id: 'oreillers', icon: '🛏️', label_fr: 'Oreillers', label_en: 'Pillows', quantity: 2 },
      { id: 'cintres', icon: '👗', label_fr: 'Cintres', label_en: 'Hangers', quantity: 6 },

      // Extérieur
      { id: 'cle_locatif', icon: '🗝️', label_fr: 'Clé locatif', label_en: 'Rental key', quantity: 1 },
      { id: 'carte_barriere', icon: '🪪', label_fr: 'Carte barrière', label_en: 'Barrier card', quantity: 1 },
      { id: 'table_jardin', icon: '🍽️', label_fr: 'Table de jardin', label_en: 'Garden table', quantity: 1 },
      { id: 'chaises_jardin', icon: '🪑', label_fr: 'Chaises de jardin', label_en: 'Garden chairs', quantity: 4 }
    ],

    MH_PREMIUM_3CH: [
      // Cuisine
      { id: 'assiettes_creuses', icon: '🍽️', label_fr: 'Assiettes creuses', label_en: 'Soup plates', quantity: 8 },
      { id: 'assiettes_dessert', icon: '🍰', label_fr: 'Assiettes dessert', label_en: 'Dessert plates', quantity: 8 },
      { id: 'assiettes_plates', icon: '🍽️', label_fr: 'Assiettes plates', label_en: 'Dinner plates', quantity: 8 },
      { id: 'plat', icon: '🍲', label_fr: 'Plat', label_en: 'Serving dish', quantity: 1 },
      { id: 'bols', icon: '🥣', label_fr: 'Bols', label_en: 'Bowls', quantity: 8 },
      { id: 'saladiers', icon: '🥗', label_fr: 'Saladiers', label_en: 'Salad bowls', quantity: 2 },
      { id: 'tasses', icon: '☕', label_fr: 'Tasses', label_en: 'Cups', quantity: 8 },
      { id: 'verres_vin', icon: '🍷', label_fr: 'Verres à vin', label_en: 'Wine glasses', quantity: 8 },
      { id: 'verres_eau', icon: '🥛', label_fr: 'Verres à eau', label_en: 'Water glasses', quantity: 8 },
      { id: 'pichet', icon: '🍶', label_fr: 'Pichet / Carafe', label_en: 'Pitcher / Carafe', quantity: 1 },
      { id: 'fourchettes', icon: '🍴', label_fr: 'Fourchettes', label_en: 'Forks', quantity: 8 },
      { id: 'cuilleres_soupe', icon: '🥄', label_fr: 'Cuillères soupe', label_en: 'Soup spoons', quantity: 8 },
      { id: 'cuilleres_cafe', icon: '🥄', label_fr: 'Cuillères café', label_en: 'Coffee spoons', quantity: 8 },
      { id: 'couteau_decouper', icon: '🔪', label_fr: 'Couteau à découper', label_en: 'Carving knife', quantity: 1 },
      { id: 'couteau_pain', icon: '🔪', label_fr: 'Couteau pain', label_en: 'Bread knife', quantity: 1 },
      { id: 'couteau_office', icon: '🔪', label_fr: 'Couteau office', label_en: 'Paring knife', quantity: 1 },
      { id: 'couteaux', icon: '🔪', label_fr: 'Couteaux', label_en: 'Knives', quantity: 8 },
      { id: 'cendrier', icon: '🚬', label_fr: 'Cendrier', label_en: 'Ashtray', quantity: 1 },
      { id: 'couvert_salade', icon: '🥗', label_fr: 'Couvert à salade', label_en: 'Salad servers', quantity: 1 },
      { id: 'spatule_bois', icon: '🥄', label_fr: 'Spatule bois', label_en: 'Wooden spatula', quantity: 1 },
      { id: 'eplucheur', icon: '🥕', label_fr: 'Éplucheur', label_en: 'Peeler', quantity: 1 },
      { id: 'louche', icon: '🍜', label_fr: 'Louche', label_en: 'Ladle', quantity: 1 },
      { id: 'ecumoire', icon: '🥄', label_fr: 'Écumoire', label_en: 'Skimmer', quantity: 1 },
      { id: 'planche_decouper', icon: '🔪', label_fr: 'Planche à découper', label_en: 'Cutting board', quantity: 1 },
      { id: 'dessous_plat', icon: '🧤', label_fr: 'Dessous de plat', label_en: 'Trivet', quantity: 1 },
      { id: 'passoire', icon: '🥛', label_fr: 'Passoire', label_en: 'Colander', quantity: 1 },
      { id: 'essoreuse_salade', icon: '🥬', label_fr: 'Essoreuse salade', label_en: 'Salad spinner', quantity: 1 },
      { id: 'tire_bouchon', icon: '🍷', label_fr: 'Tire-bouchon', label_en: 'Corkscrew', quantity: 1 },
      { id: 'ouvre_boite', icon: '🥫', label_fr: 'Ouvre-boîte', label_en: 'Can opener', quantity: 1 },
      { id: 'range_couverts', icon: '🍴', label_fr: 'Range-couverts', label_en: 'Cutlery tray', quantity: 1 },
      { id: 'plateau', icon: '🍱', label_fr: 'Plateau', label_en: 'Tray', quantity: 1 },
      { id: 'corbeille_pain', icon: '🍞', label_fr: 'Corbeille pain', label_en: 'Bread basket', quantity: 1 },
      { id: 'plat_four', icon: '🍛', label_fr: 'Plat four rond', label_en: 'Round baking dish', quantity: 1 },
      { id: 'cloche_micro_onde', icon: '🥤', label_fr: 'Cloche micro-onde', label_en: 'Microwave cover', quantity: 1 },
      { id: 'bac_glacons', icon: '🧊', label_fr: 'Bac glaçons', label_en: 'Ice cube tray', quantity: 1 },

      // Électroménager
      { id: 'casseroles', icon: '🍲', label_fr: 'Casseroles', label_en: 'Pots', quantity: 3 },
      { id: 'poeles', icon: '🍳', label_fr: 'Poêles', label_en: 'Pans', quantity: 2 },
      { id: 'faitout', icon: '🍲', label_fr: 'Faitout + couvercle', label_en: 'Dutch oven + lid', quantity: 1 },
      { id: 'couvercle', icon: '🔥', label_fr: 'Couvercle', label_en: 'Lid', quantity: 1 },
      { id: 'cafetiere', icon: '☕', label_fr: 'Cafetière', label_en: 'Coffee maker', quantity: 1 },
      { id: 'micro_ondes', icon: '📡', label_fr: 'Micro-onde', label_en: 'Microwave', quantity: 1 },
      { id: 'tv', icon: '📺', label_fr: 'TV + télécommande', label_en: 'TV + remote', quantity: 1 },
      { id: 'telecommande_clim', icon: '❄️', label_fr: 'Télécommande clim', label_en: 'AC remote', quantity: 1 },
      { id: 'lave_vaisselle', icon: '🍽️', label_fr: 'Lave-vaisselle', label_en: 'Dishwasher', quantity: 1 },
      { id: 'frigo', icon: '🧊', label_fr: 'Réfrigérateur-congélateur', label_en: 'Fridge-freezer', quantity: 1 },

      // Ménage
      { id: 'kit_wc', icon: '🚽', label_fr: 'Kit WC', label_en: 'Toilet kit', quantity: 1 },
      { id: 'seau', icon: '🪣', label_fr: 'Seau', label_en: 'Bucket', quantity: 1 },
      { id: 'bassine', icon: '🧴', label_fr: 'Bassine', label_en: 'Basin', quantity: 1 },
      { id: 'balai', icon: '🧹', label_fr: 'Balai', label_en: 'Broom', quantity: 1 },
      { id: 'balai_brosse', icon: '🧼', label_fr: 'Balai brosse', label_en: 'Scrubbing brush', quantity: 1 },
      { id: 'pelle_balayette', icon: '🧽', label_fr: 'Pelle + balayette', label_en: 'Dustpan + brush', quantity: 1 },
      { id: 'serpilliere', icon: '🪣', label_fr: 'Serpillère', label_en: 'Mop', quantity: 1 },
      { id: 'sechoir_linge', icon: '👕', label_fr: 'Séchoir à linge', label_en: 'Clothes dryer', quantity: 1 },
      { id: 'pinces_linge', icon: '🧷', label_fr: 'Pinces à linge', label_en: 'Clothespins', quantity: 8 },
      { id: 'poubelles', icon: '🗑️', label_fr: 'Poubelles', label_en: 'Trash cans', quantity: 2 },
      { id: 'detecteur_fumee', icon: '🚨', label_fr: 'Détecteur fumée', label_en: 'Smoke detector', quantity: 1 },

      // Nuit
      { id: 'couette_double', icon: '🛏️', label_fr: 'Couette double', label_en: 'Double duvet', quantity: 1 },
      { id: 'couettes_simples', icon: '🛏️', label_fr: 'Couettes simples', label_en: 'Single duvets', quantity: 4 },
      { id: 'oreillers', icon: '🛏️', label_fr: 'Oreillers', label_en: 'Pillows', quantity: 6 },
      { id: 'cintres', icon: '👗', label_fr: 'Cintres', label_en: 'Hangers', quantity: 10 },

      // Extérieur
      { id: 'cle_locatif', icon: '🗝️', label_fr: 'Clé locatif', label_en: 'Rental key', quantity: 1 },
      { id: 'carte_barriere', icon: '🪪', label_fr: 'Carte barrière', label_en: 'Barrier card', quantity: 1 },
      { id: 'chaises_interieures', icon: '🪑', label_fr: 'Chaises intérieures', label_en: 'Indoor chairs', quantity: 4 },
      { id: 'table_jardin', icon: '🍽️', label_fr: 'Table de jardin', label_en: 'Garden table', quantity: 1 },
      { id: 'chaises_jardin', icon: '🪑', label_fr: 'Chaises de jardin', label_en: 'Garden chairs', quantity: 4 },
      { id: 'banc_bois', icon: '🌳', label_fr: 'Banc en bois', label_en: 'Wooden bench', quantity: 2 },
      { id: 'transats', icon: '🌞', label_fr: 'Transats', label_en: 'Sun loungers', quantity: 2 },
      { id: 'terrasse', icon: '🌤️', label_fr: 'Terrasse semi-couverte', label_en: 'Semi-covered terrace', quantity: 1 }
    ],

    MH_ECO_2CH: [
      // Cuisine
      { id: 'assiettes_creuses', icon: '🍽️', label_fr: 'Assiettes creuses', label_en: 'Soup plates', quantity: 6 },
      { id: 'assiettes_dessert', icon: '🍰', label_fr: 'Assiettes dessert', label_en: 'Dessert plates', quantity: 6 },
      { id: 'assiettes_plates', icon: '🍽️', label_fr: 'Assiettes plates', label_en: 'Dinner plates', quantity: 6 },
      { id: 'plat', icon: '🍲', label_fr: 'Plat', label_en: 'Serving dish', quantity: 1 },
      { id: 'bols', icon: '🥣', label_fr: 'Bols', label_en: 'Bowls', quantity: 6 },
      { id: 'saladier', icon: '🥗', label_fr: 'Saladier', label_en: 'Salad bowl', quantity: 1 },
      { id: 'tasses', icon: '☕', label_fr: 'Tasses', label_en: 'Cups', quantity: 6 },
      { id: 'verres_vin', icon: '🍷', label_fr: 'Verres à vin', label_en: 'Wine glasses', quantity: 6 },
      { id: 'verres_eau', icon: '🥛', label_fr: 'Verres à eau', label_en: 'Water glasses', quantity: 6 },
      { id: 'pichet', icon: '🍶', label_fr: 'Pichet / Carafe', label_en: 'Pitcher / Carafe', quantity: 1 },
      { id: 'fourchettes', icon: '🍴', label_fr: 'Fourchettes', label_en: 'Forks', quantity: 6 },
      { id: 'cuilleres_soupe', icon: '🥄', label_fr: 'Cuillères soupe', label_en: 'Soup spoons', quantity: 6 },
      { id: 'cuilleres_cafe', icon: '🥄', label_fr: 'Cuillères café', label_en: 'Coffee spoons', quantity: 6 },
      { id: 'couteau_decouper', icon: '🔪', label_fr: 'Couteau découper', label_en: 'Carving knife', quantity: 1 },
      { id: 'couteau_pain', icon: '🔪', label_fr: 'Couteau pain', label_en: 'Bread knife', quantity: 1 },
      { id: 'couteau_office', icon: '🔪', label_fr: 'Couteau office', label_en: 'Paring knife', quantity: 1 },
      { id: 'couteaux', icon: '🔪', label_fr: 'Couteaux', label_en: 'Knives', quantity: 6 },
      { id: 'cendrier', icon: '🚬', label_fr: 'Cendrier', label_en: 'Ashtray', quantity: 1 },
      { id: 'couvert_salade', icon: '🥗', label_fr: 'Couvert salade', label_en: 'Salad servers', quantity: 1 },
      { id: 'spatule_bois', icon: '🥄', label_fr: 'Spatule bois', label_en: 'Wooden spatula', quantity: 1 },
      { id: 'eplucheur', icon: '🥕', label_fr: 'Éplucheur', label_en: 'Peeler', quantity: 1 },
      { id: 'louche', icon: '🍜', label_fr: 'Louche', label_en: 'Ladle', quantity: 1 },
      { id: 'ecumoire', icon: '🥄', label_fr: 'Écumoire', label_en: 'Skimmer', quantity: 1 },
      { id: 'planche_decouper', icon: '🔪', label_fr: 'Planche à découper', label_en: 'Cutting board', quantity: 1 },
      { id: 'dessous_plat', icon: '🧤', label_fr: 'Dessous de plat', label_en: 'Trivet', quantity: 1 },
      { id: 'passoire', icon: '🥛', label_fr: 'Passoire', label_en: 'Colander', quantity: 1 },
      { id: 'essoreuse_salade', icon: '🥬', label_fr: 'Essoreuse salade', label_en: 'Salad spinner', quantity: 1 },
      { id: 'tire_bouchon', icon: '🍷', label_fr: 'Tire-bouchon', label_en: 'Corkscrew', quantity: 1 },
      { id: 'ouvre_boite', icon: '🥫', label_fr: 'Ouvre-boîte', label_en: 'Can opener', quantity: 1 },
      { id: 'range_couverts', icon: '🍴', label_fr: 'Range-couverts', label_en: 'Cutlery tray', quantity: 1 },
      { id: 'cloche_micro_onde', icon: '🥤', label_fr: 'Cloche micro-ondes', label_en: 'Microwave cover', quantity: 1 },
      { id: 'bac_glacons', icon: '🧊', label_fr: 'Bac glaçons', label_en: 'Ice cube tray', quantity: 1 },

      // Électroménager
      { id: 'casseroles', icon: '🍲', label_fr: 'Casseroles', label_en: 'Pots', quantity: 3 },
      { id: 'poeles', icon: '🍳', label_fr: 'Poêles', label_en: 'Pans', quantity: 2 },
      { id: 'faitout', icon: '🍲', label_fr: 'Faitout + couvercle', label_en: 'Dutch oven + lid', quantity: 1 },
      { id: 'couvercle', icon: '🔥', label_fr: 'Couvercle', label_en: 'Lid', quantity: 1 },
      { id: 'cafetiere', icon: '☕', label_fr: 'Cafetière', label_en: 'Coffee maker', quantity: 1 },
      { id: 'micro_ondes', icon: '📡', label_fr: 'Micro-onde', label_en: 'Microwave', quantity: 1 },
      { id: 'frigo', icon: '🧊', label_fr: 'Réfrigérateur-congélateur', label_en: 'Fridge-freezer', quantity: 1 },

      // Ménage
      { id: 'kit_wc', icon: '🚽', label_fr: 'Kit WC', label_en: 'Toilet kit', quantity: 1 },
      { id: 'seau', icon: '🪣', label_fr: 'Seau', label_en: 'Bucket', quantity: 1 },
      { id: 'bassine', icon: '🧴', label_fr: 'Bassine', label_en: 'Basin', quantity: 1 },
      { id: 'balai', icon: '🧹', label_fr: 'Balai', label_en: 'Broom', quantity: 1 },
      { id: 'balai_brosse', icon: '🧼', label_fr: 'Balai brosse', label_en: 'Scrubbing brush', quantity: 1 },
      { id: 'pelle_balayette', icon: '🧽', label_fr: 'Pelle + balayette', label_en: 'Dustpan + brush', quantity: 1 },
      { id: 'serpilliere', icon: '🪣', label_fr: 'Serpillère', label_en: 'Mop', quantity: 1 },
      { id: 'sechoir_linge', icon: '👕', label_fr: 'Séchoir à linge', label_en: 'Clothes dryer', quantity: 1 },
      { id: 'pinces_linge', icon: '🧷', label_fr: 'Pinces à linge', label_en: 'Clothespins', quantity: 8 },
      { id: 'poubelles', icon: '🗑️', label_fr: 'Poubelles', label_en: 'Trash cans', quantity: 2 },
      { id: 'detecteur_fumee', icon: '🚨', label_fr: 'Détecteur fumée', label_en: 'Smoke detector', quantity: 1 },

      // Nuit
      { id: 'couette_double', icon: '🛏️', label_fr: 'Couette double', label_en: 'Double duvet', quantity: 1 },
      { id: 'couettes_simples', icon: '🛏️', label_fr: 'Couettes simples', label_en: 'Single duvets', quantity: 2 },
      { id: 'oreillers', icon: '🛏️', label_fr: 'Oreillers', label_en: 'Pillows', quantity: 4 },
      { id: 'cintres', icon: '👗', label_fr: 'Cintres', label_en: 'Hangers', quantity: 10 },

      // Extérieur
      { id: 'cle_locatif', icon: '🗝️', label_fr: 'Clé locatif', label_en: 'Rental key', quantity: 1 },
      { id: 'carte_barriere', icon: '🪪', label_fr: 'Carte barrière', label_en: 'Barrier card', quantity: 1 },
      { id: 'table_jardin', icon: '🍽️', label_fr: 'Table de jardin', label_en: 'Garden table', quantity: 1 },
      { id: 'chaises_jardin', icon: '🪑', label_fr: 'Chaises jardin', label_en: 'Garden chairs', quantity: 4 }
    ]
  };

  // Génération des variantes avec héritage
  INVENTAIRES.MH_ECO_CLIM_2CH = [
    ...INVENTAIRES.MH_ECO_2CH,
    { id: 'telecommande_clim', icon: '❄️', label_fr: 'Télécommande climatisation', label_en: 'AC remote', quantity: 1 }
  ];

  INVENTAIRES.MH_CLASSIQUE_2CH = [
    ...INVENTAIRES.MH_ECO_2CH,
    { id: 'tv', icon: '📺', label_fr: 'TV + télécommande', label_en: 'TV + remote', quantity: 1 }
  ];

  INVENTAIRES.MH_CLASSIQUE_CLIM_2CH = [
    ...INVENTAIRES.MH_ECO_2CH,
    { id: 'tv', icon: '📺', label_fr: 'TV + télécommande', label_en: 'TV + remote', quantity: 1 },
    { id: 'telecommande_clim', icon: '❄️', label_fr: 'Télécommande climatisation', label_en: 'AC remote', quantity: 1 }
  ];

  INVENTAIRES.MH_CLASSIQUE_3CH = [
    ...INVENTAIRES.MH_CLASSIQUE_2CH,
    { id: 'oreiller_ch3', icon: '🛏️', label_fr: 'Oreiller chambre 3', label_en: 'Bedroom 3 pillow', quantity: 1 }
  ];

  INVENTAIRES.MH_CONFORT_PLUS_2CH = [
    ...INVENTAIRES.MH_CLASSIQUE_CLIM_2CH,
    { id: 'plancha', icon: '🔥', label_fr: 'Plancha', label_en: 'Griddle', quantity: 1 }
  ];

  INVENTAIRES.MH_CONFORT_PLUS_3CH = [
    ...INVENTAIRES.MH_CONFORT_PLUS_2CH,
    { id: 'oreiller_supp_ch3', icon: '🛏️', label_fr: 'Oreiller supp. chambre 3', label_en: 'Extra bedroom 3 pillows', quantity: 2 }
  ];

  INVENTAIRES.MH_PREMIUM_2CH = [
    ...INVENTAIRES.MH_CONFORT_PLUS_2CH,
    { id: 'lave_vaisselle', icon: '🍽️', label_fr: 'Lave-vaisselle', label_en: 'Dishwasher', quantity: 1 }
  ];

  INVENTAIRES.MH_PREMIUM_TWINS = [
    ...INVENTAIRES.MH_PREMIUM_2CH,
    { id: 'tv_2e_logement', icon: '📺', label_fr: 'Télévision 2e logement', label_en: '2nd unit TV', quantity: 1 }
  ];

  INVENTAIRES.COTTAGE_PREMIUM = [
    ...INVENTAIRES.MH_PREMIUM_3CH,
    { id: 'lave_linge', icon: '🧺', label_fr: 'Lave-linge', label_en: 'Washing machine', quantity: 1 },
    { id: 'seche_linge', icon: '🌬️', label_fr: 'Sèche-linge', label_en: 'Dryer', quantity: 1 }
  ];

  const inventairesData = {
    'MH_PREMIUM_3CH': {
      titre_fr: 'Mobil-home Premium 3 chambres',
      titre_en: 'Premium Mobile Home 3 bedrooms',
      objets: INVENTAIRES.MH_PREMIUM_3CH
    },
    'CHALET_ECO_1CH': {
      titre_fr: 'Chalet Éco 1 chambre',
      titre_en: 'Eco Chalet 1 bedroom',
      objets: INVENTAIRES.CHALET_ECO_1CH
    },
    'CHALET_CLASSIQUE': {
      titre_fr: 'Chalet Classique 1 chambre',
      titre_en: 'Classic Chalet 1 bedroom',
      objets: INVENTAIRES.CHALET_CLASSIQUE
    },
    'MH_ECO_2CH': {
      titre_fr: 'Mobil-home Éco 2 chambres',
      titre_en: 'Eco Mobile Home 2 bedrooms',
      objets: INVENTAIRES.MH_ECO_2CH
    },
    'MH_ECO_CLIM_2CH': {
      titre_fr: 'Mobil-home Éco Clim 2 chambres',
      titre_en: 'Eco AC Mobile Home 2 bedrooms',
      objets: INVENTAIRES.MH_ECO_CLIM_2CH
    },
    'MH_CLASSIQUE_2CH': {
      titre_fr: 'Mobil-home Classique 2 chambres',
      titre_en: 'Classic Mobile Home 2 bedrooms',
      objets: INVENTAIRES.MH_CLASSIQUE_2CH
    },
    'MH_CLASSIQUE_CLIM_2CH': {
      titre_fr: 'Mobil-home Classique Clim 2 chambres',
      titre_en: 'Classic AC Mobile Home 2 bedrooms',
      objets: INVENTAIRES.MH_CLASSIQUE_CLIM_2CH
    },
    'MH_CLASSIQUE_3CH': {
      titre_fr: 'Mobil-home Classique 3 chambres',
      titre_en: 'Classic Mobile Home 3 bedrooms',
      objets: INVENTAIRES.MH_CLASSIQUE_3CH
    },
    'MH_CONFORT_PLUS_2CH': {
      titre_fr: 'Mobil-home Confort+ 2 chambres',
      titre_en: 'Comfort+ Mobile Home 2 bedrooms',
      objets: INVENTAIRES.MH_CONFORT_PLUS_2CH
    },
    'MH_CONFORT_PLUS_3CH': {
      titre_fr: 'Mobil-home Confort+ 3 chambres',
      titre_en: 'Comfort+ Mobile Home 3 bedrooms',
      objets: INVENTAIRES.MH_CONFORT_PLUS_3CH
    },
    'MH_PREMIUM_2CH': {
      titre_fr: 'Mobil-home Premium 2 chambres',
      titre_en: 'Premium Mobile Home 2 bedrooms',
      objets: INVENTAIRES.MH_PREMIUM_2CH
    },
    'MH_PREMIUM_TWINS': {
      titre_fr: 'Mobil-home Premium Twins',
      titre_en: 'Premium Twins Mobile Home',
      objets: INVENTAIRES.MH_PREMIUM_TWINS
    },
    'COTTAGE_PREMIUM': {
      titre_fr: 'Cottage Premium',
      titre_en: 'Premium Cottage',
      objets: INVENTAIRES.COTTAGE_PREMIUM
    }
  };
  
  const inventaire = inventairesData[code];
  if (!inventaire) return null;
  
  const result = {
    titre: lang === 'fr' ? inventaire.titre_fr : inventaire.titre_en,
    objets: inventaire.objets.map(obj => ({
      id: obj.id,
      icon: obj.icon,
      label: lang === 'fr' ? obj.label_fr : obj.label_en,
      quantity: obj.quantity
    }))
  };
  
  // Mettre en cache
  setCachedInventaire(cacheKey, result);
  
  return result;
};