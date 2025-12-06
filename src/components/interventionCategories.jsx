// Catégories d'interventions harmonisées pour toute l'application
// Utilisées dans : Arrivée, Séjour, Départ, Réception, Assistance Clientèle

export const interventionCategories = {
  technique: {
    id: 'technique',
    icon: '🔧',
    labelFr: 'Technique',
    labelEn: 'Technical',
    color: 'bg-blue-500',
    subcategories: {
      eau: {
        id: 'eau',
        icon: '🚿',
        labelFr: 'Eau / Plomberie',
        labelEn: 'Water / Plumbing',
        options: [
          { id: 'plus_eau', icon: '🚿', labelFr: 'Plus d\'eau / faible pression', labelEn: 'No water / low pressure' },
          { id: 'wc_bouche', icon: '🚽', labelFr: 'WC bouché', labelEn: 'Blocked toilet' },
          { id: 'fuite', icon: '💧', labelFr: 'Fuite / dégâts des eaux', labelEn: 'Leak / water damage', urgent: true, photoRequired: true },
          { id: 'douche_lavabo', icon: '🛁', labelFr: 'Problème douche / lavabo', labelEn: 'Shower / sink problem' }
        ]
      },
      gaz: {
        id: 'gaz',
        icon: '🔥',
        labelFr: 'Gaz',
        labelEn: 'Gas',
        urgent: true,
        options: [
          { id: 'plus_gaz', icon: '🔥', labelFr: 'Plus de gaz', labelEn: 'No gas', urgent: true },
          { id: 'odeur_gaz', icon: '⚠️', labelFr: 'Odeur de gaz / fuite possible', labelEn: 'Gas smell / possible leak', urgent: true, photoRequired: true }
        ]
      },
      electricite: {
        id: 'electricite',
        icon: '⚡',
        labelFr: 'Électricité',
        labelEn: 'Electricity',
        options: [
          { id: 'plus_electricite', icon: '⚡', labelFr: 'Plus d\'électricité', labelEn: 'No electricity', urgent: true },
          { id: 'lumiere_hs', icon: '💡', labelFr: 'Lumière HS', labelEn: 'Light broken' },
          { id: 'prise_defectueuse', icon: '🔌', labelFr: 'Prise défectueuse', labelEn: 'Faulty outlet' },
          { id: 'appareil_hs', icon: '🍽️', labelFr: 'Appareil électrique qui ne s\'allume plus', labelEn: 'Appliance not working' }
        ]
      }
    }
  },
  menage: {
    id: 'menage',
    icon: '🧹',
    labelFr: 'Ménage',
    labelEn: 'Housekeeping',
    color: 'bg-yellow-500',
    subcategories: {
      proprete: {
        id: 'proprete',
        icon: '🧼',
        labelFr: 'Propreté',
        labelEn: 'Cleanliness',
        options: [
          { id: 'literie_sale', icon: '🛏️', labelFr: 'Literie sale', labelEn: 'Dirty bedding' },
          { id: 'vaisselle_sale', icon: '🍽️', labelFr: 'Vaisselle sale', labelEn: 'Dirty dishes' },
          { id: 'sol_sale', icon: '🧹', labelFr: 'Sol sale', labelEn: 'Dirty floor' },
          { id: 'surfaces_sales', icon: '🚪', labelFr: 'Surfaces / poignées collantes', labelEn: 'Sticky surfaces / handles' },
          { id: 'vitres_sales', icon: '🪟', labelFr: 'Vitres très sales', labelEn: 'Very dirty windows' }
        ]
      },
      dechets: {
        id: 'dechets',
        icon: '🗑',
        labelFr: 'Tri & déchets',
        labelEn: 'Sorting & waste',
        options: [
          { id: 'poubelles_pleines', icon: '🚮', labelFr: 'Poubelles pleines', labelEn: 'Full trash bins' },
          { id: 'tri_non_fait', icon: '♻️', labelFr: 'Tri non fait', labelEn: 'Sorting not done' },
          { id: 'dechets_interieurs', icon: '🗑', labelFr: 'Déchets dans le mobil-home', labelEn: 'Waste in mobile home' }
        ]
      }
    }
  },
  casse: {
    id: 'casse',
    icon: '🛠',
    labelFr: 'Matériel cassé',
    labelEn: 'Broken equipment',
    color: 'bg-red-500',
    depositWarning: true,
    photoRequired: true,
    options: [
      { id: 'meuble_casse', icon: '🪑', labelFr: 'Meuble cassé', labelEn: 'Broken furniture' },
      { id: 'vaisselle_cassee', icon: '🍽️', labelFr: 'Vaisselle cassée', labelEn: 'Broken dishes' },
      { id: 'tv_hs', icon: '📺', labelFr: 'TV HS', labelEn: 'TV broken' },
      { id: 'frigo_casse', icon: '❄️', labelFr: 'Frigo / congélateur cassé', labelEn: 'Fridge / freezer broken' },
      { id: 'plaque_cassee', icon: '🔥', labelFr: 'Plaque de cuisson cassée', labelEn: 'Stove broken' },
      { id: 'volet_porte_casse', icon: '🪟', labelFr: 'Volet / porte cassé', labelEn: 'Shutter / door broken' }
    ]
  },
  nuisibles: {
    id: 'nuisibles',
    icon: '🐝',
    labelFr: 'Nuisibles',
    labelEn: 'Pests',
    color: 'bg-orange-500',
    options: [
      { id: 'guepes_frelons', icon: '🐝', labelFr: 'Guêpes / frelons', labelEn: 'Wasps / hornets' },
      { id: 'fourmis', icon: '🐜', labelFr: 'Fourmis / insectes', labelEn: 'Ants / insects' },
      { id: 'rongeurs', icon: '🐀', labelFr: 'Rongeurs', labelEn: 'Rodents' },
      { id: 'nids', icon: '🪺', labelFr: 'Nids extérieurs', labelEn: 'Outdoor nests' }
    ]
  },
  securite: {
    id: 'securite',
    icon: '🛑',
    labelFr: 'Sécurité',
    labelEn: 'Security',
    color: 'bg-red-600',
    urgent: true,
    photoRequired: true,
    options: [
      { id: 'porte_ferme_plus', icon: '🚨', labelFr: 'Porte qui ne ferme plus', labelEn: 'Door won\'t close', urgent: true },
      { id: 'serrure_bloquee', icon: '🔐', labelFr: 'Serrure bloquée', labelEn: 'Lock blocked', urgent: true },
      { id: 'detecteur_hs', icon: '🧯', labelFr: 'Détecteur de fumée HS', labelEn: 'Smoke detector broken', urgent: true }
    ]
  },
  divers: {
    id: 'divers',
    icon: '⚠',
    labelFr: 'Autres dysfonctionnements',
    labelEn: 'Other issues',
    color: 'bg-purple-500',
    options: [
      { id: 'bruit', icon: '🔊', labelFr: 'Bruit anormal', labelEn: 'Unusual noise' },
      { id: 'odeurs', icon: '👃', labelFr: 'Mauvaises odeurs', labelEn: 'Bad smells' },
      { id: 'probleme_exterieur', icon: '🏞️', labelFr: 'Problème extérieur (terrasse, sol, etc.)', labelEn: 'Outdoor problem (terrace, ground, etc.)' },
      { id: 'autre', icon: '❓', labelFr: 'Autre problème', labelEn: 'Other problem' }
    ]
  }
};

// Informations horaires et règles (à afficher en bas du formulaire)
export const interventionRules = {
  fr: {
    horaires_technique: {
      title: '📌 Horaires d\'intervention technique',
      items: [
        'Basse saison : 9h–12h / 13h30–18h30',
        'Haute saison : 8h30–12h / 14h–20h',
        'Samedi non-stop : 8h30–20h'
      ]
    },
    horaires_menage: {
      title: '📌 Horaires ménage',
      items: [
        '9h–16h',
        'Week-ends d\'été : renfort'
      ]
    },
    astreintes: {
      title: '📌 Astreintes : 20h–23h',
      subtitle: 'Urgences uniquement',
      items: [
        '💧 Plus d\'eau',
        '🔥 Plus de gaz',
        '⚡ Plus d\'électricité'
      ]
    },
    delais: {
      title: '📌 Délais de traitement',
      text: 'Selon priorité + ordre d\'arrivée'
    }
  },
  en: {
    horaires_technique: {
      title: '📌 Technical intervention hours',
      items: [
        'Low season: 9am–12pm / 1:30pm–6:30pm',
        'High season: 8:30am–12pm / 2pm–8pm',
        'Saturday non-stop: 8:30am–8pm'
      ]
    },
    horaires_menage: {
      title: '📌 Housekeeping hours',
      items: [
        '9am–4pm',
        'Summer weekends: reinforcement'
      ]
    },
    astreintes: {
      title: '📌 On-call: 8pm–11pm',
      subtitle: 'Emergencies only',
      items: [
        '💧 No water',
        '🔥 No gas',
        '⚡ No electricity'
      ]
    },
    delais: {
      title: '📌 Processing times',
      text: 'According to priority + order of arrival'
    }
  }
};

// Messages automatiques
export const interventionMessages = {
  fr: {
    photoFacultative: '📷 Vous pouvez ajouter une photo pour nous aider à traiter plus rapidement votre demande (fortement recommandé).',
    photoObligatoire: '⚠️ Pour des raisons de sécurité, une photo est obligatoire.',
    depositWarning: '⚠️ Matériel cassé : peut engager la caution. Une vérification sera effectuée par nos équipes.',
    descriptionRequired: 'Description obligatoire (minimum 10 caractères)'
  },
  en: {
    photoFacultative: '📷 You can add a photo to help us process your request faster (highly recommended).',
    photoObligatoire: '⚠️ For security reasons, a photo is required.',
    depositWarning: '⚠️ Broken equipment: may involve deposit. Our teams will verify.',
    descriptionRequired: 'Description required (minimum 10 characters)'
  }
};

// Fonction helper pour obtenir toutes les options d'une catégorie
export const getCategoryOptions = (categoryId) => {
  const category = interventionCategories[categoryId];
  if (!category) return [];
  
  // Si la catégorie a des sous-catégories
  if (category.subcategories) {
    const allOptions = [];
    Object.values(category.subcategories).forEach(subcat => {
      if (subcat.options) {
        allOptions.push(...subcat.options);
      }
    });
    return allOptions;
  }
  
  // Sinon retourner les options directes
  return category.options || [];
};

// Fonction helper pour vérifier si une photo est obligatoire
export const isPhotoRequired = (categoryId, optionId) => {
  const category = interventionCategories[categoryId];
  if (!category) return false;
  
  // Vérifier si la catégorie elle-même requiert une photo
  if (category.photoRequired) return true;
  
  // Vérifier si l'option spécifique requiert une photo
  const options = getCategoryOptions(categoryId);
  const option = options.find(opt => opt.id === optionId);
  return option?.photoRequired || false;
};

// Fonction helper pour vérifier si c'est une urgence
export const isUrgent = (categoryId, optionId) => {
  const category = interventionCategories[categoryId];
  if (!category) return false;
  
  // Vérifier si la catégorie elle-même est urgente
  if (category.urgent) return true;
  
  // Vérifier si l'option spécifique est urgente
  const options = getCategoryOptions(categoryId);
  const option = options.find(opt => opt.id === optionId);
  return option?.urgent || false;
};