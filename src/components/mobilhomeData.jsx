// Génération automatique de tous les mobilhomes du camping

export const generateMobilhomes = () => {
  const mobilhomes = [];

  // Helper pour générer une série de numéros
  const generateRange = (prefix, start, end, categorie, specs) => {
    for (let i = start; i <= end; i++) {
      const num = prefix + (i < 10 && prefix.length > 0 ? '0' + i : i);
      mobilhomes.push({
        numero: num,
        categorie,
        ...specs
      });
    }
  };

  // Chalets Eco 1 chambre : C1 à C6
  generateRange('C', 1, 6, 'Chalet Eco', {
    capacite: 2,
    surface: 20,
    nb_chambres: 1,
    annee: 2018,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière'],
    terrasse: 'ouverte',
    localisation: 'Zone Chalets'
  });

  // Chalets Classique 2 pers : A1 à A4
  generateRange('A', 1, 4, 'Chalet Classique', {
    capacite: 4,
    surface: 25,
    nb_chambres: 2,
    annee: 2019,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière', 'Plancha'],
    terrasse: 'semi-couverte',
    localisation: 'Zone Chalets'
  });

  // Mobil-home Éco 2 chambres : H01 à H16
  generateRange('H', 1, 16, 'Mobil-home Eco', {
    capacite: 4,
    surface: 24,
    nb_chambres: 2,
    annee: 2015,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes'],
    terrasse: 'ouverte',
    localisation: 'Zone Eco'
  });

  // Mobil-home Éco Clim : OO1 à OO6
  generateRange('OO', 1, 6, 'Mobil-home Eco Clim', {
    capacite: 4,
    surface: 24,
    nb_chambres: 2,
    annee: 2017,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Climatisation'],
    terrasse: 'ouverte',
    localisation: 'Zone Eco'
  });

  // Mobil-home Classique 2 chambres : D01 à D21
  generateRange('D', 1, 21, 'Mobil-home Classique', {
    capacite: 4,
    surface: 28,
    nb_chambres: 2,
    annee: 2018,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière', 'Grille-pain'],
    terrasse: 'semi-couverte',
    localisation: 'Zone Classique'
  });

  // Mobil-home Classique Clim 2 chambres : V1 à V22
  generateRange('V', 1, 22, 'Mobil-home Classique Clim', {
    capacite: 4,
    surface: 28,
    nb_chambres: 2,
    annee: 2019,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière', 'Grille-pain', 'Climatisation'],
    terrasse: 'semi-couverte',
    localisation: 'Zone Classique'
  });

  // Mobil-home Classique 3 chambres : L1 à L6
  generateRange('L', 1, 6, 'Mobil-home Classique 3ch', {
    capacite: 6,
    surface: 32,
    nb_chambres: 3,
    annee: 2019,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière', 'Grille-pain'],
    terrasse: 'semi-couverte',
    localisation: 'Zone Classique'
  });

  // Confort+ 2 chambres : P01 à P12
  generateRange('P', 1, 12, 'Confort+ 2ch', {
    capacite: 4,
    surface: 30,
    nb_chambres: 2,
    annee: 2020,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière', 'Grille-pain', 'Climatisation', 'Lave-vaisselle'],
    terrasse: 'semi-couverte',
    localisation: 'Zone Confort'
  });

  // Confort+ 3 chambres : T01 à T06
  generateRange('T', 1, 6, 'Confort+ 3ch', {
    capacite: 6,
    surface: 34,
    nb_chambres: 3,
    annee: 2020,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière', 'Grille-pain', 'Climatisation', 'Lave-vaisselle'],
    terrasse: 'semi-couverte',
    localisation: 'Zone Confort'
  });

  // Premium 2 chambres : R1 à R18 sauf R04, R05, R11, R12
  for (let i = 1; i <= 18; i++) {
    if (![4, 5, 11, 12].includes(i)) {
      mobilhomes.push({
        numero: 'R' + i,
        categorie: 'Premium 2ch',
        capacite: 4,
        surface: 32,
        nb_chambres: 2,
        annee: 2021,
        equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière', 'Grille-pain', 'Climatisation', 'Lave-vaisselle', 'Plancha'],
        terrasse: 'couverte',
        localisation: 'Zone Premium'
      });
    }
  }

  // Premium 3 chambres : M01 à M14
  generateRange('M', 1, 14, 'Premium 3ch', {
    capacite: 6,
    surface: 36,
    nb_chambres: 3,
    annee: 2021,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière', 'Grille-pain', 'Climatisation', 'Lave-vaisselle', 'Plancha'],
    terrasse: 'couverte',
    localisation: 'Zone Premium'
  });

  // Premium Twins 4 chambres : R11/R04 et R12/R05
  ['R04', 'R05', 'R11', 'R12'].forEach(num => {
    mobilhomes.push({
      numero: num,
      categorie: 'Premium Twins',
      capacite: 8,
      surface: 64,
      nb_chambres: 4,
      annee: 2021,
      equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière', 'Grille-pain', 'Climatisation', 'Lave-vaisselle', 'Plancha', '2 salles de bain'],
      terrasse: 'couverte',
      localisation: 'Zone Premium'
    });
  });

  // Cottages Premium : J1 à J5
  generateRange('J', 1, 5, 'Cottage Premium', {
    capacite: 6,
    surface: 40,
    nb_chambres: 3,
    annee: 2022,
    equipements: ['TV', 'Réfrigérateur', 'Micro-ondes', 'Cafetière', 'Grille-pain', 'Climatisation', 'Lave-vaisselle', 'Plancha', 'Spa privatif'],
    terrasse: 'couverte',
    localisation: 'Zone Premium'
  });

  // Emplacements 6A
  const emplacements6A = [
    ...Array.from({length: 13}, (_, i) => 87 + i), // 87-99
    ...Array.from({length: 17}, (_, i) => 161 + i), // 161-177
    ...Array.from({length: 6}, (_, i) => 226 + i), // 226-231
    239, 244, 245,
    ...Array.from({length: 4}, (_, i) => 256 + i), // 256-259
    ...Array.from({length: 24}, (_, i) => 1 + i) // 1-24
  ];
  emplacements6A.forEach(num => {
    mobilhomes.push({
      numero: String(num),
      categorie: 'Emplacement 6A',
      capacite: 6,
      surface: 100,
      equipements: ['Branchement électrique 6A'],
      terrasse: 'non',
      localisation: 'Zone Emplacements'
    });
  });

  // Emplacements 10A : 183-186, 218-223
  const emplacements10A = [
    ...Array.from({length: 4}, (_, i) => 183 + i),
    ...Array.from({length: 6}, (_, i) => 218 + i)
  ];
  emplacements10A.forEach(num => {
    mobilhomes.push({
      numero: String(num),
      categorie: 'Emplacement 10A',
      capacite: 6,
      surface: 100,
      equipements: ['Branchement électrique 10A'],
      terrasse: 'non',
      localisation: 'Zone Emplacements'
    });
  });

  // Emplacements Eau + 10A : 117-138
  for (let i = 117; i <= 138; i++) {
    mobilhomes.push({
      numero: String(i),
      categorie: 'Emplacement Eau+10A',
      capacite: 6,
      surface: 100,
      equipements: ['Branchement électrique 10A', 'Point d\'eau'],
      terrasse: 'non',
      localisation: 'Zone Emplacements'
    });
  }

  return mobilhomes;
};

// Types de problèmes avec icônes
export const problemTypes = [
  { id: 'electricite', label: 'Électricité', icon: 'Zap', emoji: '🔌', urgentDefault: true, categorie: 'technique' },
  { id: 'gaz', label: 'Gaz', icon: 'Flame', emoji: '🔥', urgentDefault: true, categorie: 'technique' },
  { id: 'frigo', label: 'Frigo', icon: 'Thermometer', emoji: '🧊', urgentDefault: false, categorie: 'technique' },
  { id: 'eau_fuite', label: 'Eau / Fuite', icon: 'Droplets', emoji: '🚿', urgentDefault: true, categorie: 'technique' },
  { id: 'clim', label: 'Climatisation', icon: 'Wind', emoji: '❄️', urgentDefault: false, categorie: 'technique' },
  { id: 'tv', label: 'TV', icon: 'Tv', emoji: '📺', urgentDefault: false, categorie: 'technique' },
  { id: 'plomberie', label: 'Plomberie', icon: 'Wrench', emoji: '🔧', urgentDefault: false, categorie: 'technique' },
  { id: 'terrasse', label: 'Terrasse', icon: 'TreePine', emoji: '🌳', urgentDefault: false, categorie: 'technique' },
  { id: 'exterieur', label: 'Extérieur', icon: 'Trees', emoji: '🌲', urgentDefault: false, categorie: 'technique' },
  { id: 'vaisselle', label: 'Vaisselle', icon: 'UtensilsCrossed', emoji: '🍽️', urgentDefault: false, categorie: 'menage' },
  { id: 'literie', label: 'Literie', icon: 'Bed', emoji: '🛏️', urgentDefault: false, categorie: 'menage' },
  { id: 'menage', label: 'Ménage', icon: 'Sparkles', emoji: '🧹', urgentDefault: false, categorie: 'menage' },
  { id: 'autre', label: 'Autre', icon: 'AlertTriangle', emoji: '⚠️', urgentDefault: false, categorie: 'technique' }
];