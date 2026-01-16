// Configuration globale du système QA
export const QAConfig = {
  // Mode QA (actif = tests + logs détaillés, passif = validations CRITICAL uniquement)
  isQAModeActive: () => {
    return sessionStorage.getItem('qa_mode_active') === 'true';
  },

  setQAMode: (active) => {
    sessionStorage.setItem('qa_mode_active', active ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('qa-mode-change', { detail: { active } }));
  },

  // Règles de déploiement
  deploymentRules: {
    // Si ≥ 1 CRITICAL → déploiement interdit
    canDeploy: (criticalCount) => criticalCount === 0,
    getMessage: (criticalCount) => {
      if (criticalCount === 0) {
        return '✅ Application exploitable - Déploiement autorisé';
      }
      return `🚨 DÉPLOIEMENT INTERDIT - ${criticalCount} erreur(s) CRITICAL détectée(s)`;
    }
  },

  // Validations CRITICAL (toujours actives, même hors mode QA)
  criticalValidations: {
    // Intervention doit avoir au moins 1 tâche
    validateIntervention: (interventionData) => {
      if (!interventionData.taches || interventionData.taches.length === 0) {
        return {
          valid: false,
          error: '🚨 VALIDATION BLOQUANTE: Une intervention doit contenir au moins 1 tâche',
          severity: 'CRITICAL'
        };
      }
      return { valid: true };
    },

    // WorkItem doit avoir une origine
    validateWorkItem: (workItemData) => {
      const hasOrigin = workItemData.intervention_client_id || 
                        workItemData.mission_direction_id || 
                        workItemData.incident_id;
      
      if (!hasOrigin) {
        return {
          valid: false,
          error: '🚨 VALIDATION BLOQUANTE: Un WorkItem doit avoir une origine (intervention, mission ou incident)',
          severity: 'CRITICAL'
        };
      }
      return { valid: true };
    },

    // Mission Direction doit avoir au moins 1 zone
    validateMission: (missionData) => {
      if (!missionData.zones || missionData.zones.length === 0) {
        return {
          valid: false,
          error: '🚨 VALIDATION BLOQUANTE: Une mission Direction doit définir au moins 1 zone',
          severity: 'CRITICAL'
        };
      }
      return { valid: true };
    }
  },

  // Tests de performance (limites max)
  performanceLimits: {
    maxPageLoadTime: 300, // ms
    maxQATestTime: 5000, // ms pour tests volontaires
    maxLogSize: 500 // nombre max de logs en mémoire
  }
};

export default QAConfig;