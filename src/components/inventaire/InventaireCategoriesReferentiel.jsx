/**
 * RÉFÉRENTIEL UNIQUE DES CATÉGORIES D'INVENTAIRE
 * 
 * Structure obligatoire pour tous les contrôles inventaire.
 * Aucun objet ne peut exister hors de ces catégories.
 */

export const CATEGORIES_INVENTAIRE = [
  {
    id: 'couchage_linge',
    nom: 'Couchage & Linge',
    icone: '🛏️',
    service_responsable: 'MENAGE',
    objets: [
      'lit_double_chambre_1',
      'lits_simples_chambre_2',
      'couettes_doubles',
      'couette_simple',
      'oreillers'
    ]
  },
  {
    id: 'vaisselle_cuisine',
    nom: 'Vaisselle & Cuisine',
    icone: '🍽️',
    service_responsable: 'MENAGE',
    objets: [
      'assiettes_creuses',
      'assiettes_plates',
      'assiettes_dessert',
      'bols',
      'saladier',
      'plat',
      'tasses',
      'verres',
      'pichet'
    ]
  },
  {
    id: 'couverts_ustensiles',
    nom: 'Couverts & Ustensiles',
    icone: '🍴',
    service_responsable: 'MENAGE',
    objets: [
      'fourchettes',
      'cuilleres_soupe',
      'cuilleres_cafe',
      'couteaux',
      'couteau_pain',
      'couvert_salade',
      'ciseaux',
      'spatule_bois',
      'eplucheur',
      'louche',
      'ecumoire',
      'planche_decouper',
      'dessous_plat',
      'passoire',
      'essoreuse_salade',
      'tire_bouchon',
      'ouvre_boite',
      'range_couverts',
      'cloche_micro_ondes',
      'bac_glacons'
    ]
  },
  {
    id: 'cuisson_electromenager',
    nom: 'Cuisson & Électroménager',
    icone: '🍳',
    service_responsable: 'TECHNIQUE',
    objets: [
      'casseroles',
      'poeles',
      'faitout_couvercle',
      'cafetiere_filtre',
      'micro_ondes',
      'refrigerateur_top',
      'plaques_cuisson_gaz_2_feux',
      'hotte',
      'cumulus'
    ]
  },
  {
    id: 'sanitaires',
    nom: 'Sanitaires',
    icone: '🚿',
    service_responsable: 'TECHNIQUE',
    objets: [
      'toilettes',
      'douche',
      'robinet',
      'lavabo',
      'kit_brosse_wc'
    ]
  },
  {
    id: 'entretien',
    nom: 'Entretien',
    icone: '🧹',
    service_responsable: 'MENAGE',
    objets: [
      'seau',
      'bassine',
      'balai',
      'balai_brosse',
      'pelle_balayette',
      'serpilliere'
    ]
  },
  {
    id: 'exterieur_rangement',
    nom: 'Extérieur & Rangement',
    icone: '👕',
    service_responsable: 'MENAGE',
    objets: [
      'sechoir_linge',
      'pinces_linge',
      'poubelle',
      'detecteur_fumee',
      'cintres',
      'cle_locative',
      'carte_barriere'
    ]
  },
  {
    id: 'mobilier_exterieur',
    nom: 'Mobilier extérieur',
    icone: '🌿',
    service_responsable: 'MENAGE',
    objets: [
      'table_jardin',
      'chaises_jardin'
    ]
  }
];

/**
 * LABELS LISIBLES POUR LES OBJETS
 */
export const OBJETS_LABELS = {
  // Couchage & Linge
  lit_double_chambre_1: 'Lit double – chambre 1',
  lits_simples_chambre_2: 'Lits simples – chambre 2',
  couettes_doubles: 'Couettes doubles',
  couette_simple: 'Couette simple',
  oreillers: 'Oreillers',

  // Vaisselle & Cuisine
  assiettes_creuses: 'Assiettes creuses',
  assiettes_plates: 'Assiettes plates',
  assiettes_dessert: 'Assiettes à dessert',
  bols: 'Bols',
  saladier: 'Saladier',
  plat: 'Plat',
  tasses: 'Tasses',
  verres: 'Verres',
  pichet: 'Pichet',

  // Couverts & Ustensiles
  fourchettes: 'Fourchettes',
  cuilleres_soupe: 'Cuillères soupe',
  cuilleres_cafe: 'Cuillères café',
  couteaux: 'Couteaux',
  couteau_pain: 'Couteau pain',
  couvert_salade: 'Couvert salade',
  ciseaux: 'Ciseaux',
  spatule_bois: 'Spatule bois',
  eplucheur: 'Éplucheur',
  louche: 'Louche',
  ecumoire: 'Écumoire',
  planche_decouper: 'Planche à découper',
  dessous_plat: 'Dessous de plat',
  passoire: 'Passoire',
  essoreuse_salade: 'Essoreuse salade',
  tire_bouchon: 'Tire-bouchon',
  ouvre_boite: 'Ouvre-boîte',
  range_couverts: 'Range-couverts',
  cloche_micro_ondes: 'Cloche micro-ondes',
  bac_glacons: 'Bac à glaçons',

  // Cuisson & Électroménager
  casseroles: 'Casseroles',
  poeles: 'Poêles',
  faitout_couvercle: 'Faitout + couvercle',
  cafetiere_filtre: 'Cafetière filtre',
  micro_ondes: 'Micro-ondes',
  refrigerateur_top: 'Réfrigérateur TOP',
  plaques_cuisson_gaz_2_feux: 'Plaques cuisson gaz 2 feux',
  hotte: 'Hotte',
  cumulus: 'Cumulus',

  // Sanitaires
  toilettes: 'Toilettes (fonctionnement)',
  douche: 'Douche',
  robinet: 'Robinet',
  lavabo: 'Lavabo',
  kit_brosse_wc: 'Kit brosse WC',

  // Entretien
  seau: 'Seau',
  bassine: 'Bassine',
  balai: 'Balai',
  balai_brosse: 'Balai brosse',
  pelle_balayette: 'Pelle + balayette',
  serpilliere: 'Serpillière',

  // Extérieur & Rangement
  sechoir_linge: 'Séchoir à linge',
  pinces_linge: 'Pinces à linge',
  poubelle: 'Poubelle',
  detecteur_fumee: 'Détecteur fumée',
  cintres: 'Cintres',
  cle_locative: 'Clé locative',
  carte_barriere: 'Carte barrière',

  // Mobilier extérieur
  table_jardin: 'Table de jardin',
  chaises_jardin: 'Chaises de jardin'
};

/**
 * Récupère la catégorie d'un objet
 */
export function getCategorieObjet(objetId) {
  for (const categorie of CATEGORIES_INVENTAIRE) {
    if (categorie.objets.includes(objetId)) {
      return categorie;
    }
  }
  return null;
}

/**
 * Valide qu'un objet appartient à une catégorie valide
 */
export function validerObjetInventaire(objetId) {
  const categorie = getCategorieObjet(objetId);
  if (!categorie) {
    throw new Error(`Objet "${objetId}" hors catégorie autorisée`);
  }
  return true;
}

/**
 * Récupère le label lisible d'un objet
 */
export function getLabelObjet(objetId) {
  return OBJETS_LABELS[objetId] || objetId;
}