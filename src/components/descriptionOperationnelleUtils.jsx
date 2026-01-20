/**
 * Fonction centrale de normalisation description_operationnelle
 * Fallback automatique pour compatibilité legacy
 * 
 * Priorité : description_operationnelle > description_probleme > description
 */
export function getDescriptionOperationnelle(item) {
  if (!item) return null;
  
  return (
    item.description_operationnelle ||
    item.description_probleme ||
    item.description ||
    null
  );
}

/**
 * Vérifie si une item a une description valide pour être "prennable en charge"
 */
export function hasValidDescription(item) {
  return !!getDescriptionOperationnelle(item);
}

/**
 * Valide qu'une mission Direction peut être clôturée
 * Règle : toutes tâches traitées (FAIT ou NON_FAIT), NON_FAIT a justification
 */
export function validateMissionClosure(taches) {
  // Vérifier que toutes les tâches ont un statut
  const toutesTraitees = taches.every(
    t => t.statut === 'FAIT' || t.statut === 'NON_FAIT'
  );

  if (!toutesTraitees) {
    return {
      valid: false,
      error: 'Toutes les tâches doivent être traitées (marquées Fait ou Pas fait)'
    };
  }

  // Vérifier que les tâches NON_FAIT ont une justification
  const nonFaitSansJustif = taches.filter(
    t => t.statut === 'NON_FAIT' && (!t.justification || t.justification.trim() === '')
  );

  if (nonFaitSansJustif.length > 0) {
    return {
      valid: false,
      error: `${nonFaitSansJustif.length} tâche(s) marquée(s) "Pas fait" sans justification`
    };
  }

  return {
    valid: true,
    hasFailures: taches.some(t => t.statut === 'NON_FAIT'),
    error: null
  };
}

/**
 * Détermine le statut final du WorkItem après clôture
 */
export function getWorkItemFinalStatus(taches) {
  const hasFailures = taches.some(t => t.statut === 'NON_FAIT');
  
  if (hasFailures) {
    return 'EN_ATTENTE'; // Ou 'ECHEC' si on veut être plus strict
  }
  
  return 'TERMINEE';
}