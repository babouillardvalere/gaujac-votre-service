// Classification des objets d'inventaire par catégorie d'intervention

export const categoriesInventaire = {
  menage: [
    'assiettes', 'verres', 'bols', 'tasses', 'mugs', 'couverts',
    'couteau', 'fourchette', 'cuillere', 'louche', 'spatule',
    'saladier', 'plat', 'assiette', 'verre', 'bol',
    'balai', 'serpilliere', 'pelle', 'balayette', 'bassine',
    'poubelle', 'seau', 'chiffon', 'eponge',
    'casseroles', 'poeles', 'fait_tout', 'cocotte',
    'ouvre_boite', 'tire_bouchon', 'econome', 'rape',
    'planche_a_decouper', 'passoire', 'essoreuse',
    'torchon', 'nappe', 'sets_de_table'
  ],
  
  technique: [
    'gaz', 'plaque', 'four', 'plaque_cuisson',
    'frigo', 'refrigerateur', 'congelateur',
    'micro_ondes', 'bouilloire', 'grille_pain', 'cafetiere',
    'tv', 'television', 'telecommande',
    'clim', 'climatisation', 'ventilateur', 'chauffage',
    'detecteur_fumee', 'detecteur',
    'serrure', 'porte', 'fenetre', 'volet',
    'electricite', 'lumiere', 'lampe', 'prise',
    'eau', 'douche', 'lavabo', 'robinet', 'evier',
    'wc', 'toilettes', 'chasse',
    'fuite', 'plomberie',
    'table', 'chaise', 'lit', 'matelas', 'sommier',
    'armoire', 'placard', 'etagere',
    'transat', 'parasol', 'table_exterieure'
  ]
};

export const objetsPrioritaires = [
  'gaz', 'fuite', 'eau', 'electricite', 'wc', 'toilettes',
  'porte', 'serrure', 'plomberie', 'chasse'
];

export const getCategorie = (objetId, objetNom = '') => {
  const idLower = objetId.toLowerCase();
  const nomLower = objetNom.toLowerCase();
  
  // Vérifier dans catégorie ménage
  if (categoriesInventaire.menage.some(cat => 
    idLower.includes(cat) || nomLower.includes(cat)
  )) {
    return 'menage';
  }
  
  // Vérifier dans catégorie technique
  if (categoriesInventaire.technique.some(cat => 
    idLower.includes(cat) || nomLower.includes(cat)
  )) {
    return 'technique';
  }
  
  // Par défaut, considérer comme technique si inconnu
  return 'technique';
};

export const isUrgent = (objetId, objetNom = '') => {
  const idLower = objetId.toLowerCase();
  const nomLower = objetNom.toLowerCase();
  
  return objetsPrioritaires.some(prioritaire => 
    idLower.includes(prioritaire) || nomLower.includes(prioritaire)
  );
};

export const getDescriptionProbleme = (objet, lang = 'fr') => {
  if (lang === 'fr') {
    return `Objet manquant ou défectueux détecté lors du contrôle d'arrivée : ${objet}`;
  } else {
    return `Missing or defective item detected during arrival check: ${objet}`;
  }
};