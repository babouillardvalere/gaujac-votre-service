/**
 * INVENTAIRE NORMALISÉ PAR CATÉGORIES
 * Structure unique pour tous les hébergements - seules les quantités varient
 */

import { CATEGORIES_INVENTAIRE, OBJETS_LABELS, getCategorieObjet } from './InventaireCategoriesReferentiel';

/**
 * RÉFÉRENTIEL DES QUANTITÉS PAR TYPE D'HÉBERGEMENT
 * Clé = ID objet (depuis référentiel)
 */
const QUANTITES_PAR_HEBERGEMENT = {
  'CHALET_ECO_1CH': {
    // Couchage
    lit_double_chambre_1: 1,
    oreillers: 4,
    couettes_doubles: 1,
    
    // Vaisselle (4 pers)
    assiettes_creuses: 4, assiettes_plates: 4, assiettes_dessert: 4,
    bols: 4, saladier: 1, plat: 1, tasses: 4, verres: 4, pichet: 1,
    
    // Couverts
    fourchettes: 4, cuilleres_soupe: 4, cuilleres_cafe: 4, couteaux: 4,
    couteau_pain: 1, couvert_salade: 1, ciseaux: 1, spatule_bois: 1,
    eplucheur: 1, louche: 1, ecumoire: 1, planche_decouper: 1,
    dessous_plat: 1, passoire: 1, essoreuse_salade: 1, tire_bouchon: 1,
    ouvre_boite: 1, range_couverts: 1, cloche_micro_ondes: 1, bac_glacons: 1,
    
    // Cuisson
    casseroles: 2, poeles: 1, faitout_couvercle: 1, cafetiere_filtre: 1,
    micro_ondes: 1, refrigerateur_top: 1, plaques_cuisson_gaz_2_feux: 1,
    hotte: 1, cumulus: 1,
    
    // Sanitaires
    toilettes: 1, douche: 1, robinet: 1, lavabo: 1, kit_brosse_wc: 1,
    
    // Entretien
    seau: 1, bassine: 1, balai: 1, balai_brosse: 1, pelle_balayette: 1, serpilliere: 1,
    
    // Extérieur
    sechoir_linge: 1, pinces_linge: 6, poubelle: 1, detecteur_fumee: 1,
    cintres: 8, cle_locative: 1, carte_barriere: 1,
    
    // Mobilier
    table_jardin: 1, chaises_jardin: 4
  },
  
  'MH_CONFORT_2CH_4P': {
    // Couchage
    lit_double_chambre_1: 1, lits_simples_chambre_2: 2,
    oreillers: 6, couettes_doubles: 1, couette_simple: 1,
    
    // Vaisselle (6 pers)
    assiettes_creuses: 6, assiettes_plates: 6, assiettes_dessert: 6,
    bols: 6, saladier: 1, plat: 1, tasses: 6, verres: 6, pichet: 1,
    
    // Couverts
    fourchettes: 6, cuilleres_soupe: 6, cuilleres_cafe: 6, couteaux: 6,
    couteau_pain: 1, couvert_salade: 1, ciseaux: 1, spatule_bois: 1,
    eplucheur: 1, louche: 1, ecumoire: 1, planche_decouper: 1,
    dessous_plat: 1, passoire: 1, essoreuse_salade: 1, tire_bouchon: 1,
    ouvre_boite: 1, range_couverts: 1, cloche_micro_ondes: 1, bac_glacons: 1,
    
    // Cuisson
    casseroles: 3, poeles: 2, faitout_couvercle: 1, cafetiere_filtre: 1,
    micro_ondes: 1, refrigerateur_top: 1, plaques_cuisson_gaz_2_feux: 1,
    hotte: 1, cumulus: 1,
    
    // Sanitaires
    toilettes: 1, douche: 1, robinet: 1, lavabo: 1, kit_brosse_wc: 1,
    
    // Entretien
    seau: 1, bassine: 1, balai: 1, balai_brosse: 1, pelle_balayette: 1, serpilliere: 1,
    
    // Extérieur
    sechoir_linge: 1, pinces_linge: 8, poubelle: 1, detecteur_fumee: 1,
    cintres: 10, cle_locative: 1, carte_barriere: 1,
    
    // Mobilier
    table_jardin: 1, chaises_jardin: 4
  },
  
  'MH_PREMIUM_TWINS': {
    // Couchage (4 chambres)
    lit_double_chambre_1: 1, lits_simples_chambre_2: 2,
    oreillers: 8, couettes_doubles: 2, couette_simple: 0,
    
    // Vaisselle (8 pers)
    assiettes_creuses: 8, assiettes_plates: 8, assiettes_dessert: 8,
    bols: 8, saladier: 2, plat: 2, tasses: 8, verres: 8, pichet: 1,
    
    // Couverts
    fourchettes: 8, cuilleres_soupe: 8, cuilleres_cafe: 8, couteaux: 8,
    couteau_pain: 1, couvert_salade: 1, ciseaux: 1, spatule_bois: 1,
    eplucheur: 1, louche: 1, ecumoire: 1, planche_decouper: 1,
    dessous_plat: 1, passoire: 1, essoreuse_salade: 1, tire_bouchon: 1,
    ouvre_boite: 1, range_couverts: 1, cloche_micro_ondes: 1, bac_glacons: 1,
    
    // Cuisson
    casseroles: 3, poeles: 2, faitout_couvercle: 1, cafetiere_filtre: 1,
    micro_ondes: 1, refrigerateur_top: 1, plaques_cuisson_gaz_2_feux: 1,
    hotte: 1, cumulus: 1,
    
    // Sanitaires
    toilettes: 1, douche: 1, robinet: 1, lavabo: 1, kit_brosse_wc: 1,
    
    // Entretien
    seau: 1, bassine: 1, balai: 1, balai_brosse: 1, pelle_balayette: 1, serpilliere: 1,
    
    // Extérieur
    sechoir_linge: 1, pinces_linge: 10, poubelle: 2, detecteur_fumee: 1,
    cintres: 12, cle_locative: 1, carte_barriere: 1,
    
    // Mobilier
    table_jardin: 1, chaises_jardin: 6
  },

  'COTTAGE_PREMIUM': {
    // Couchage
    lit_double_chambre_1: 1, lits_simples_chambre_2: 2,
    oreillers: 6, couettes_doubles: 1, couette_simple: 1,
    
    // Vaisselle (4-6 pers)
    assiettes_creuses: 6, assiettes_plates: 6, assiettes_dessert: 6,
    bols: 6, saladier: 1, plat: 1, tasses: 6, verres: 6, pichet: 1,
    
    // Couverts
    fourchettes: 6, cuilleres_soupe: 6, cuilleres_cafe: 6, couteaux: 6,
    couteau_pain: 1, couvert_salade: 1, ciseaux: 1, spatule_bois: 1,
    eplucheur: 1, louche: 1, ecumoire: 1, planche_decouper: 1,
    dessous_plat: 1, passoire: 1, essoreuse_salade: 1, tire_bouchon: 1,
    ouvre_boite: 1, range_couverts: 1, cloche_micro_ondes: 1, bac_glacons: 1,
    
    // Cuisson
    casseroles: 3, poeles: 2, faitout_couvercle: 1, cafetiere_filtre: 1,
    micro_ondes: 1, refrigerateur_top: 1, plaques_cuisson_gaz_2_feux: 1,
    hotte: 1, cumulus: 1,
    
    // Sanitaires
    toilettes: 1, douche: 1, robinet: 1, lavabo: 1, kit_brosse_wc: 1,
    
    // Entretien
    seau: 1, bassine: 1, balai: 1, balai_brosse: 1, pelle_balayette: 1, serpilliere: 1,
    
    // Extérieur
    sechoir_linge: 1, pinces_linge: 8, poubelle: 1, detecteur_fumee: 1,
    cintres: 10, cle_locative: 1, carte_barriere: 1,
    
    // Mobilier
    table_jardin: 1, chaises_jardin: 6
  }
};

/**
 * Génère l'inventaire normalisé pour un hébergement
 */
export function getInventaireNormalise(codeHebergement, lang = 'fr') {
  const quantites = QUANTITES_PAR_HEBERGEMENT[codeHebergement];
  if (!quantites) {
    console.warn(`Inventaire non trouvé pour: ${codeHebergement}`);
    return null;
  }

  const objets = [];
  
  // Parcourir TOUTES les catégories dans l'ordre défini
  CATEGORIES_INVENTAIRE.forEach(categorie => {
    categorie.objets.forEach(objetId => {
      const qte = quantites[objetId];
      if (qte !== undefined && qte > 0) {
        objets.push({
          id: objetId,
          label: OBJETS_LABELS[objetId] || objetId,
          icon: categorie.icone,
          quantity: qte,
          categorieId: categorie.id,
          categorieNom: categorie.nom,
          serviceResponsable: categorie.service_responsable
        });
      }
    });
  });

  return {
    code: codeHebergement,
    objets
  };
}

/**
 * Valide qu'un inventaire respecte la structure normalisée
 */
export function validerStructureInventaire(objets) {
  const erreurs = [];
  
  objets.forEach(obj => {
    // Vérifier que l'objet existe dans le référentiel
    if (!OBJETS_LABELS[obj.id]) {
      erreurs.push(`Objet inconnu: ${obj.id}`);
    }
    
    // Vérifier que l'objet appartient à une catégorie
    const categorieTrouvee = CATEGORIES_INVENTAIRE.find(c => c.objets.includes(obj.id));
    if (!categorieTrouvee) {
      erreurs.push(`Objet hors catégorie: ${obj.id}`);
    }
  });
  
  return {
    valide: erreurs.length === 0,
    erreurs
  };
}