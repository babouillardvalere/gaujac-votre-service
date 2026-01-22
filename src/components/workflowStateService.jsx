/**
 * Service de gestion stricte des états du workflow
 * Règles de transition + validation
 */

// États valides
const STATES = {
  A_FAIRE: 'A_FAIRE',
  EN_COURS: 'EN_COURS',
  EN_ATTENTE: 'EN_ATTENTE',
  TERMINEE: 'TERMINEE',
  ANNULEE: 'ANNULEE'
};

// Conversion statuts Incident/WorkItem
const INCIDENT_TO_WORKITEM = {
  'en_attente': 'A_FAIRE',
  'en_cours': 'EN_COURS',
  'en_attente_materiel': 'EN_ATTENTE',
  'resolu': 'TERMINEE'
};

const WORKITEM_TO_INCIDENT = {
  'A_FAIRE': 'en_attente',
  'EN_COURS': 'en_cours',
  'EN_ATTENTE': 'en_attente_materiel',
  'TERMINEE': 'resolu'
};

/**
 * Règles de transition strictes
 */
const TRANSITIONS = {
  'A_FAIRE': {
    'EN_COURS': { required: ['collaborateur'], description: 'Prendre en charge' },
    'EN_ATTENTE': { required: ['raison_attente', 'motif_attente'], description: 'Reporter' }
  },
  'EN_COURS': {
    'EN_ATTENTE': { required: ['raison_attente', 'motif_attente'], description: 'Mettre en attente' },
    'TERMINEE': { required: ['toutes_taches_traitees'], description: 'Terminer' }
  },
  'EN_ATTENTE': {
    'EN_COURS': { required: ['collaborateur'], description: 'Reprendre' },
    'ANNULEE': { required: [], description: 'Annuler (Direction)' }
  },
  'TERMINEE': {
    // Lecture seule - aucune transition possible sans intervention Bureau
  },
  'ANNULEE': {
    // Terminal - aucune transition possible
  }
};

/**
 * Valide si une transition est autorisée
 * @param {string} fromState - État actuel
 * @param {string} toState - État cible
 * @param {object} data - Données requises pour la transition
 * @returns {object} { valid: boolean, error?: string }
 */
export function canTransition(fromState, toState, data = {}) {
  const allowedTransitions = TRANSITIONS[fromState];
  
  if (!allowedTransitions || !allowedTransitions[toState]) {
    return {
      valid: false,
      error: `Transition ${fromState} → ${toState} non autorisée`
    };
  }

  const required = allowedTransitions[toState].required;
  
  // Vérifier les champs obligatoires
  for (const field of required) {
    if (field === 'toutes_taches_traitees') {
      // Cas spécial : vérifier que toutes les tâches sont justifiées
      if (!data.allTasksResolved) {
        return {
          valid: false,
          error: 'Toutes les tâches doivent être marquées comme "Fait" ou justifiées'
        };
      }
    } else if (!data[field]) {
      return {
        valid: false,
        error: `Champ obligatoire manquant: ${field}`
      };
    }
  }

  return { valid: true };
}

/**
 * Actions disponibles selon l'état
 */
export function getAvailableActions(state) {
  const actions = {
    'A_FAIRE': [
      { id: 'prendre_en_charge', label: 'prendre_en_charge', icon: 'Play' },
      { id: 'reporter', label: 'reporter', icon: 'Clock' }
    ],
    'EN_COURS': [
      { id: 'mettre_en_attente', label: 'mettre_en_attente', icon: 'Pause' },
      { id: 'terminer', label: 'terminer', icon: 'CheckCircle' }
    ],
    'EN_ATTENTE': [
      { id: 'reprendre', label: 'reprendre', icon: 'Play' }
    ],
    'TERMINEE': [],
    'ANNULEE': []
  };
  
  return actions[state] || [];
}

/**
 * Détermine si une action est possible
 */
export function canPerformAction(state, actionId) {
  const actions = getAvailableActions(state);
  return actions.some(a => a.id === actionId);
}

/**
 * Vérifie si toutes les tâches sont traitées (fait ou justifiées)
 */
export function areAllTasksResolved(tasks = []) {
  if (tasks.length === 0) return false;
  
  return tasks.every(task => {
    // Une tâche est résolue si:
    // 1. Elle est marquée "faite"
    // 2. Elle a une justification (non faite mais justifiée)
    return task.faite === true || (task.justification && task.justification.trim());
  });
}

/**
 * Formatte un événement propre (pas d'undefined, champs requis)
 */
export function createCleanEvent(type, incident, extraData = {}) {
  const now = new Date().toISOString();
  
  // Champs obligatoires - jamais undefined
  const baseEvent = {
    workitem_id: incident.id || incident.workItemId,
    origine: extraData.origine || 'INVENTAIRE_ARRIVEE',
    reference_id: extraData.reference_id || incident.stay_id || incident.fiche_arrivee_id,
    service: extraData.service || 'TECHNIQUE',
    action: type,
    message: extraData.message || getDefaultMessage(type),
    timestamp: now,
    collaborateur: extraData.collaborateur || incident.pris_par || 'Système',
    metadata: extraData.metadata || {}
  };

  return baseEvent;
}

function getDefaultMessage(action) {
  const messages = {
    'CREATION': 'Intervention créée',
    'PRISE_EN_CHARGE': 'Intervention prise en charge',
    'EN_COURS': 'Intervention en cours',
    'MISE_EN_ATTENTE': 'Intervention mise en attente',
    'REPRISE': 'Intervention reprise',
    'TERMINEE': 'Intervention terminée',
    'ANNULEE': 'Intervention annulée'
  };
  return messages[action] || `Action: ${action}`;
}

export {
  STATES,
  TRANSITIONS,
  INCIDENT_TO_WORKITEM,
  WORKITEM_TO_INCIDENT
};