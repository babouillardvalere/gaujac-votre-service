/**
 * TYPES QA - STRUCTURE STANDARD
 * Conforme au workflow industriel de validation
 */

/**
 * @typedef {Object} QAError
 * @property {string} code - Code unique d'erreur (ex: INTERVENTION_HOUSING_REQUIRED)
 * @property {string} messageUser - Message affiché à l'utilisateur final
 * @property {string} messageDev - Message technique pour les logs/debug
 * @property {string} field - Champ concerné
 * @property {string} rule - Nom de la règle QA qui a échoué
 * @property {'blocking'|'warning'|'info'} level - Niveau de sévérité
 */

/**
 * @typedef {Object} QAResult
 * @property {boolean} isValid - true si aucune erreur bloquante
 * @property {QAError[]} blockingErrors - Erreurs bloquantes (empêchent CREATE/UPDATE)
 * @property {QAError[]} warnings - Avertissements (n'empêchent pas la création)
 * @property {QAError[]} infos - Informations (logs uniquement)
 * @property {Object} context - Contexte d'exécution
 * @property {string} context.entity - Nom de l'entité
 * @property {string} context.action - Action (CREATE/UPDATE/TRANSITION)
 */

/**
 * Crée une erreur QA structurée
 */
export function createQAError(code, messageUser, messageDev, field, rule, level = 'blocking') {
  return {
    code,
    messageUser,
    messageDev,
    field,
    rule,
    level
  };
}

/**
 * Crée un résultat QA vide (succès)
 */
export function createQASuccess(entity, action) {
  return {
    isValid: true,
    blockingErrors: [],
    warnings: [],
    infos: [],
    context: { entity, action }
  };
}

/**
 * Crée un résultat QA avec erreurs
 */
export function createQAResult(errors = [], warnings = [], infos = [], entity, action) {
  const blockingErrors = errors.filter(e => e.level === 'blocking');
  
  return {
    isValid: blockingErrors.length === 0,
    blockingErrors,
    warnings: warnings.concat(errors.filter(e => e.level === 'warning')),
    infos: infos.concat(errors.filter(e => e.level === 'info')),
    context: { entity, action }
  };
}