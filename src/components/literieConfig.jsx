// Configuration literie par catégorie d'hébergement
export const literieConfig = {
  // 2 chambres, 2 lits doubles
  'Chalet Eco 1ch': { chambres: 2, litsDoubles: 2, litsSimples: 0, litsSuperpose: 0 },
  'MH Éco': { chambres: 2, litsDoubles: 2, litsSimples: 0, litsSuperpose: 0 },
  'MH Éco Clim': { chambres: 2, litsDoubles: 2, litsSimples: 0, litsSuperpose: 0 },
  'MH Classique 2ch': { chambres: 2, litsDoubles: 2, litsSimples: 0, litsSuperpose: 0 },
  'MH Classique Clim 2ch': { chambres: 2, litsDoubles: 2, litsSimples: 0, litsSuperpose: 0 },
  'MH Confort 2ch': { chambres: 2, litsDoubles: 2, litsSimples: 0, litsSuperpose: 0 },
  'MH Confort+ 2ch': { chambres: 2, litsDoubles: 2, litsSimples: 0, litsSuperpose: 0 },
  'MH Premium 2ch': { chambres: 2, litsDoubles: 2, litsSimples: 0, litsSuperpose: 0 },
  
  // 3 chambres, 2 lits doubles (lits simples non précisés)
  'MH Classique 3ch': { chambres: 3, litsDoubles: 2, litsSimples: null, litsSuperpose: 0 },
  'MH Confort 3ch': { chambres: 3, litsDoubles: 2, litsSimples: null, litsSuperpose: 0 },
  'MH Confort+ 3ch': { chambres: 3, litsDoubles: 2, litsSimples: null, litsSuperpose: 0 },
  'MH Premium 3ch': { chambres: 3, litsDoubles: 2, litsSimples: null, litsSuperpose: 0 },
  
  // Exceptions
  'Chalet Classique 1ch': { chambres: null, litsDoubles: 1, litsSimples: null, litsSuperpose: 0 },
  'MH Premium Twins': { chambres: 4, litsDoubles: 2, litsSimples: 4, litsSuperpose: 0 },
  'Cottage Premium': { chambres: 2, litsDoubles: 1, litsSimples: 1, litsSuperpose: 1 },
  
  // Emplacements (pas de configuration literie)
  'Emplacement': null,
};

// Composant affichant la configuration literie
export function ConfigurationLiterie({ categorie, lang = 'fr' }) {
  const config = literieConfig[categorie];
  
  if (!config) return null;
  
  const labels = {
    fr: {
      title: '🛏️ Configuration literie',
      chambres: 'Chambres',
      litsDoubles: 'Lit(s) double',
      litsSimples: 'Lit(s) simple',
      litsSuperpose: 'Lit(s) superposé',
      nonPrecise: 'Non précisé'
    },
    en: {
      title: '🛏️ Bedding configuration',
      chambres: 'Bedrooms',
      litsDoubles: 'Double bed(s)',
      litsSimples: 'Single bed(s)',
      litsSuperpose: 'Bunk bed(s)',
      nonPrecise: 'Not specified'
    }
  };
  
  const t = labels[lang] || labels.fr;
  
  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="font-heading text-lg text-[#0077A8] mb-3">{t.title}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {config.chambres !== null && (
          <div className="flex justify-between">
            <span className="font-semibold">{t.chambres} :</span>
            <span>{config.chambres}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-semibold">{t.litsDoubles} :</span>
          <span>{config.litsDoubles}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">{t.litsSimples} :</span>
          <span>{config.litsSimples !== null ? config.litsSimples : t.nonPrecise}</span>
        </div>
        {config.litsSuperpose > 0 && (
          <div className="flex justify-between">
            <span className="font-semibold">{t.litsSuperpose} :</span>
            <span>{config.litsSuperpose}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600 mt-3 italic">
        {lang === 'fr' 
          ? 'Configuration fixe pour cette catégorie d\'hébergement' 
          : 'Fixed configuration for this accommodation category'}
      </p>
    </div>
  );
}

// Fonction pour vérifier si un problème de literie doit être routé vers TECHNIQUE
// Règle : tout ce qui est STRUCTURE DE LIT = TECHNIQUE
// Règle : couettes, oreillers, cintres = MÉNAGE
export function isLiterieTechnique(itemId) {
  if (!itemId) return false;
  const id = itemId.toLowerCase();
  // Pattern dynamique : tout ID contenant 'lit_' ou 'lits_' ou 'sommier' ou 'matelas' ou 'superpose'
  return (
    id.startsWith('lit_') ||
    id.startsWith('lits_') ||
    id === 'lit_superpose' ||
    id === 'lits_superposes' ||
    id === 'sommier' ||
    id === 'matelas'
  );
}

// Fonction pour vérifier si un item de couchage doit aller en MÉNAGE
// Règle : couettes, oreillers, cintres = MÉNAGE
export function isCouchageMenage(itemId) {
  if (!itemId) return false;
  const id = itemId.toLowerCase();
  return (
    id.startsWith('couette') ||
    id.startsWith('couettes') ||
    id === 'oreillers' ||
    id === 'cintres'
  );
}

// Labels pour les problèmes de literie (toujours TECHNIQUE)
export const literieProblemLabels = {
  fr: {
    lit_double: 'Lit double endommagé',
    lit_simple: 'Lit simple endommagé', 
    lit_superpose: 'Lit superposé endommagé',
    sommier: 'Sommier cassé',
    structure_lit: 'Structure de lit instable'
  },
  en: {
    lit_double: 'Damaged double bed',
    lit_simple: 'Damaged single bed',
    lit_superpose: 'Damaged bunk bed', 
    sommier: 'Broken box spring',
    structure_lit: 'Unstable bed frame'
  }
};