export const degatsCategories = {
  menage: [
    { id: 'tres_sale', icon: '🧹', label_fr: 'Locatif très sale', label_en: 'Very dirty accommodation' },
    { id: 'vaisselle_non_lavee', icon: '🍽️', label_fr: 'Vaisselle non lavée', label_en: 'Unwashed dishes' },
    { id: 'lits_non_debarasses', icon: '🛏️', label_fr: 'Lits non débarrassés', label_en: 'Beds not cleared' },
    { id: 'salle_bain_refaire', icon: '🧼', label_fr: 'Salle de bain à refaire', label_en: 'Bathroom to redo' },
    { id: 'wc_tres_sale', icon: '🚽', label_fr: 'WC très sale', label_en: 'Very dirty toilet' },
    { id: 'vitres_sales', icon: '🪟', label_fr: 'Vitres sales', label_en: 'Dirty windows' },
    { id: 'poubelles_non_videes', icon: '🗑️', label_fr: 'Poubelles non vidées', label_en: 'Trash not emptied' },
    { id: 'dechets_terrasse', icon: '🚮', label_fr: 'Déchets sur terrasse', label_en: 'Trash on terrace' }
  ],
  technique: [
    { id: 'porte_cassee', icon: '🚪', label_fr: 'Porte cassée', label_en: 'Broken door' },
    { id: 'gaz_fuite', icon: '🔥', label_fr: 'Plus de gaz / fuite', label_en: 'No gas / leak' },
    { id: 'fuite_eau', icon: '💧', label_fr: 'Fuite eau / robinet', label_en: 'Water leak / tap' },
    { id: 'wc_bouche', icon: '🚽', label_fr: 'WC bouché', label_en: 'Clogged toilet' },
    { id: 'electricite_hs', icon: '🔌', label_fr: 'Prise ou lumière HS', label_en: 'Socket or light broken' },
    { id: 'tv_cassee', icon: '📺', label_fr: 'Télévision cassée', label_en: 'Broken TV' },
    { id: 'frigo_clim_hs', icon: '❄️', label_fr: 'Frigo/Clim HS', label_en: 'Fridge/AC broken' },
    { id: 'mobilier_casse', icon: '🪑', label_fr: 'Mobilier cassé', label_en: 'Broken furniture' }
  ],
  inventaire: [
    { id: 'assiettes_manquantes', icon: '🍽️', label_fr: 'Assiettes manquantes', label_en: 'Missing plates' },
    { id: 'verres_casses', icon: '🥃', label_fr: 'Verres cassés', label_en: 'Broken glasses' },
    { id: 'casseroles_abimees', icon: '🍳', label_fr: 'Casseroles abîmées', label_en: 'Damaged pans' },
    { id: 'couverts_manquants', icon: '🍴', label_fr: 'Couverts manquants', label_en: 'Missing cutlery' },
    { id: 'ustensiles_manquants', icon: '🔪', label_fr: 'Ustensiles manquants', label_en: 'Missing utensils' },
    { id: 'bac_glacon_manquant', icon: '🧊', label_fr: 'Bac glaçon manquant', label_en: 'Missing ice tray' },
    { id: 'corbeille_cassee', icon: '🧺', label_fr: 'Corbeille/plateau cassé', label_en: 'Broken basket/tray' }
  ]
};

export const getDegatsLabel = (id, categorie, lang = 'fr') => {
  const allDegats = [...degatsCategories.menage, ...degatsCategories.technique, ...degatsCategories.inventaire];
  const degat = allDegats.find(d => d.id === id);
  return degat ? (lang === 'fr' ? degat.label_fr : degat.label_en) : id;
};