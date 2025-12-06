// Configuration unifiée des icônes d'intervention
// Utilisé partout : client, assistance, arrivée, séjour, départ, réception

export const INTERVENTION_ICONS = {
  // 🔧 TECHNIQUE
  technique: {
    eau: { icon: '🚰', label: 'Eau', description: 'Coupure, fuite, chasse d\'eau, WC bouché, dégât des eaux' },
    gaz: { icon: '🔥', label: 'Gaz', description: 'Plus de gaz / problème bouteille / fuite' },
    electricite: { icon: '⚡', label: 'Électricité', description: 'Court-circuit, panne, prise HS' },
    frigo: { icon: '❄️', label: 'Frigo/Congélateur', description: 'Frigo / congélateur en panne' },
    equipements: { icon: '🔌', label: 'Équipements techniques', description: 'TV, clim, four, micro-ondes' },
    plomberie: { icon: '🔧', label: 'Plomberie', description: 'Problème de plomberie général' },
    divers_technique: { icon: '🛠', label: 'Divers technique', description: 'Autre problème technique' },
  },
  
  // 🧹 MÉNAGE
  menage: {
    proprete: { icon: '🧽', label: 'Propreté insuffisante', description: 'Propreté insuffisante' },
    vaisselle: { icon: '🍽', label: 'Vaisselle', description: 'Vaisselle sale' },
    literie: { icon: '🛏', label: 'Linge/Literie', description: 'Linge / literie' },
    vitres: { icon: '🪟', label: 'Vitres', description: 'Vitres sales' },
    sols: { icon: '🧺', label: 'Sols', description: 'Sols sales' },
    nettoyage: { icon: '🧹', label: 'Nettoyage', description: 'Nettoyage général' },
    poubelle: { icon: '🗑', label: 'Poubelle', description: 'Poubelle / odeur' },
    produit_manquant: { icon: '🧴', label: 'Produit manquant', description: 'Produit d\'entretien manquant' },
  },
  
  // 🐝 NUISIBLES
  nuisibles: {
    guepes: { icon: '🐝', label: 'Guêpes', description: 'Guêpes' },
    rongeurs: { icon: '🐀', label: 'Rongeurs', description: 'Souris, rats' },
    moustiques: { icon: '🦟', label: 'Moustiques', description: 'Moustiques / insectes inhabituels' },
    fourmis: { icon: '🐜', label: 'Fourmis', description: 'Fourmis' },
    frelons: { icon: '🐝', label: 'Frelons', description: 'Frelons' },
  },
  
  // 🪑 MATÉRIEL CASSÉ (⚠ caution)
  materiel_casse: {
    vaisselle_cassee: { icon: '🔪', label: 'Vaisselle cassée', description: 'Vaisselle cassée (⚠ caution)' },
    chaise: { icon: '🪑', label: 'Chaise cassée', description: 'Chaise cassée (⚠ caution)' },
    porte: { icon: '🚪', label: 'Porte', description: 'Porte défectueuse (⚠ caution)' },
    moustiquaire: { icon: '🪟', label: 'Moustiquaire', description: 'Moustiquaire déchirée (⚠ caution)' },
    lit: { icon: '🛏', label: 'Lattes du lit', description: 'Lattes du lit cassées (⚠ caution)' },
    mobilier: { icon: '🧰', label: 'Mobilier', description: 'Mobilier cassé (⚠ caution)' },
    autre_materiel: { icon: '🔧', label: 'Autre matériel', description: 'Autre matériel cassé (⚠ caution)' },
  },
  
  // ⚠ DIVERS
  divers: {
    nuisances_sonores: { icon: '🔇', label: 'Nuisances sonores', description: 'Nuisances sonores' },
    circulation: { icon: '🚗', label: 'Circulation/Barrière', description: 'Problème circulation / barrière' },
    animal: { icon: '🐶', label: 'Problème animal', description: 'Problème animal' },
    autre: { icon: '❓', label: 'Autre', description: 'Autre problème' },
  }
};

// Helper pour obtenir toutes les icônes en liste plate
export const getAllIcons = () => {
  const allIcons = [];
  Object.entries(INTERVENTION_ICONS).forEach(([category, items]) => {
    Object.entries(items).forEach(([key, value]) => {
      allIcons.push({ category, key, ...value });
    });
  });
  return allIcons;
};

// Helper pour obtenir une icône spécifique
export const getIcon = (category, key) => {
  return INTERVENTION_ICONS[category]?.[key] || { icon: '❓', label: 'Inconnu', description: '' };
};

// Mapping des anciennes catégories vers les nouvelles icônes
export const LEGACY_MAPPING = {
  gaz: { category: 'technique', key: 'gaz' },
  eau: { category: 'technique', key: 'eau' },
  electricite: { category: 'technique', key: 'electricite' },
  plomberie: { category: 'technique', key: 'plomberie' },
  divers_technique: { category: 'technique', key: 'divers_technique' },
  literie: { category: 'menage', key: 'literie' },
  vaisselle: { category: 'menage', key: 'vaisselle' },
  nettoyage: { category: 'menage', key: 'nettoyage' },
  menage: { category: 'menage', key: 'nettoyage' },
  poubelle: { category: 'menage', key: 'poubelle' },
  produit_manquant: { category: 'menage', key: 'produit_manquant' },
  souris: { category: 'nuisibles', key: 'rongeurs' },
  guepes: { category: 'nuisibles', key: 'guepes' },
  frelons: { category: 'nuisibles', key: 'frelons' },
  fourmis: { category: 'nuisibles', key: 'fourmis' },
  moustiques: { category: 'nuisibles', key: 'moustiques' },
  mobilier: { category: 'materiel_casse', key: 'mobilier' },
  structurel: { category: 'materiel_casse', key: 'autre_materiel' },
  autre: { category: 'divers', key: 'autre' },
};

// Helper pour obtenir l'icône depuis une ancienne catégorie
export const getIconFromLegacyCategory = (legacyCategory) => {
  const mapping = LEGACY_MAPPING[legacyCategory];
  if (mapping) {
    return getIcon(mapping.category, mapping.key);
  }
  return { icon: '❓', label: legacyCategory, description: '' };
};