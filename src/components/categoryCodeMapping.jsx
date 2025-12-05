// Mapping des catégories d'hébergement vers les codes d'inventaire
export const categoryToCodeMapping = {
  // Chalets
  "Chalet Eco": "CHALET_ECO_1CH",
  "Chalet Classique": "CHALET_CLASSIQUE_1CH",
  
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
  "Cottage Premium": "COTTAGE_PREMIUM_2CH"
};

export const getCodeFromCategory = (category) => {
  return categoryToCodeMapping[category] || null;
};