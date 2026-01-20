/**
 * Configuration globale du système QA
 * Architecture : Le QA AIDE le métier, ne le DOMINE jamais
 */

export const QA_CONFIG = {
  // Master switch - désactiver si QA pose problème
  enabled: true,
  
  // Contextes où QA s'exécute (JAMAIS en READ)
  allowedContexts: ['CREATE', 'UPDATE', 'TRANSITION'],
  
  // Strictness (false = warnings only, true = blocking)
  strict: true,
  
  logLevel: 'info',
  
  rules: {
    workitems: {
      description_required: true,
      service_required: true,
      zone_required: true,
      origine_required: true
    },
    interventions: {
      content_required: true
    },
    missions: {
      zones_required: true
    }
  },

  errorHandling: {
    showToasts: true,
    logErrors: true,
    throwErrors: false // JAMAIS throw, toujours retourner objet
  }
};

/**
 * Garde : détermine si QA doit s'exécuter
 */
export function shouldRunQA(context = 'READ') {
  if (!QA_CONFIG.enabled) {
    console.log('[QA] QA désactivé globalement');
    return false;
  }
  
  const shouldRun = QA_CONFIG.allowedContexts.includes(context);
  
  if (!shouldRun) {
    console.log(`[QA] Context ${context} skipped (QA only runs on ${QA_CONFIG.allowedContexts.join(', ')})`);
  }
  
  return shouldRun;
}

/**
 * Désactive temporairement le QA (debug/urgence production)
 */
export function disableQA() {
  QA_CONFIG.enabled = false;
  sessionStorage.setItem('qa_disabled', 'true');
  console.warn('[QA] ⚠️ QA DÉSACTIVÉ - mode dégradé');
  return { ok: true, message: 'QA désactivé - mode dégradé activé' };
}

/**
 * Réactive le QA
 */
export function enableQA() {
  QA_CONFIG.enabled = true;
  sessionStorage.removeItem('qa_disabled');
  console.log('[QA] ✅ QA ACTIVÉ');
  return { ok: true, message: 'QA activé - mode normal' };
}

/**
 * Vérifie si QA est désactivé au démarrage
 */
export function initQAFromSession() {
  const disabled = sessionStorage.getItem('qa_disabled') === 'true';
  if (disabled) {
    QA_CONFIG.enabled = false;
    console.warn('[QA] QA désactivé depuis session');
  }
}

// Legacy compatibility
export const QAConfig = {
  isQAModeActive: () => QA_CONFIG.enabled,
  setQAMode: (active) => active ? enableQA() : disableQA(),
  
  deploymentRules: {
    canDeploy: (criticalCount) => criticalCount === 0,
    getMessage: (criticalCount) => {
      if (criticalCount === 0) {
        return '✅ Application exploitable - Déploiement autorisé';
      }
      return `🚨 DÉPLOIEMENT INTERDIT - ${criticalCount} erreur(s) CRITICAL détectée(s)`;
    }
  },
  
  // Migré vers ValidationRules (retourne objets)
  criticalValidations: {
    validateIntervention: (data) => {
      if (!data.taches || data.taches.length === 0) {
        return {
          valid: false,
          error: '🚨 VALIDATION: Une intervention doit contenir au moins 1 tâche',
          severity: 'CRITICAL'
        };
      }
      return { valid: true };
    },
    
    validateWorkItem: (data) => {
      const hasOrigin = data.intervention_client_id || 
                        data.mission_direction_id || 
                        data.incident_id;
      
      if (!hasOrigin) {
        return {
          valid: false,
          error: '🚨 VALIDATION: Un WorkItem doit avoir une origine',
          severity: 'CRITICAL'
        };
      }

      if (!data.description_operationnelle || !data.description_operationnelle.trim()) {
        return {
          valid: false,
          error: '🚨 VALIDATION: Un WorkItem doit avoir une description_operationnelle',
          severity: 'CRITICAL'
        };
      }
      
      return { valid: true };
    },
    
    validateMission: (data) => {
      if (!data.zones || data.zones.length === 0) {
        return {
          valid: false,
          error: '🚨 VALIDATION: Une mission Direction doit définir au moins 1 zone',
          severity: 'CRITICAL'
        };
      }
      return { valid: true };
    }
  },

  performanceLimits: {
    maxPageLoadTime: 300,
    maxQATestTime: 5000,
    maxLogSize: 500
  }
};

export default QAConfig;

// Auto-init
initQAFromSession();