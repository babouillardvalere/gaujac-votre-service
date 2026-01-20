/**
 * RÈGLES DE VALIDATION V2 - CONFORME WORKFLOW STANDARD
 * 
 * PRINCIPES:
 * - Aucun throw, jamais
 * - Double message (user + dev)
 * - Structure QAError standardisée
 * - Classification blocking/warning/info
 */

import { createQAError, createQAResult, createQASuccess } from './QATypes';
import { computeDescriptionOperationnelle } from '../workItemUtils';

/**
 * Garde : détermine si QA doit s'exécuter
 */
function shouldRunQA(context = 'READ', enabled = true) {
  if (!enabled) return false;
  // QA uniquement sur CREATE, UPDATE, TRANSITION - JAMAIS sur READ
  return ['CREATE', 'UPDATE', 'TRANSITION'].includes(context);
}

/**
 * RÈGLE 1: WorkItem DOIT avoir une description_operationnelle
 */
export class WorkItemDescriptionRule {
  static validate(data) {
    if (!data.description_operationnelle || !data.description_operationnelle.trim()) {
      return createQAError(
        'WORKITEM_DESCRIPTION_REQUIRED',
        'La description opérationnelle est obligatoire.',
        'description_operationnelle is empty or undefined',
        'description_operationnelle',
        'WorkItemDescriptionRule',
        'blocking'
      );
    }
    return null;
  }
}

/**
 * RÈGLE 2: WorkItem DOIT avoir une origine
 */
export class WorkItemOriginRule {
  static validate(data) {
    const hasOrigin = 
      data.intervention_client_id || 
      data.mission_direction_id || 
      data.incident_id;
    
    if (!hasOrigin) {
      return createQAError(
        'WORKITEM_ORIGIN_REQUIRED',
        'Un WorkItem doit être lié à une source (intervention, mission ou incident).',
        'No intervention_client_id, mission_direction_id, or incident_id provided',
        'origine',
        'WorkItemOriginRule',
        'blocking'
      );
    }
    return null;
  }
}

/**
 * RÈGLE 3: WorkItem DOIT avoir un hébergement
 */
export class WorkItemHousingRule {
  static validate(data) {
    if (!data.hebergement || !data.hebergement.trim()) {
      return createQAError(
        'WORKITEM_HOUSING_REQUIRED',
        'Veuillez sélectionner un hébergement.',
        'hebergement is empty or undefined',
        'hebergement',
        'WorkItemHousingRule',
        'blocking'
      );
    }
    return null;
  }
}

/**
 * RÈGLE 4: WorkItem DOIT avoir un service assigné
 */
export class WorkItemServiceRule {
  static validate(data) {
    const validServices = ['TECHNIQUE', 'MENAGE', 'RECEPTION', 'DIRECTION'];
    
    if (!data.service || !validServices.includes(data.service)) {
      return createQAError(
        'WORKITEM_SERVICE_INVALID',
        'Le service assigné est invalide.',
        `service is "${data.service}", expected one of ${validServices.join(', ')}`,
        'service',
        'WorkItemServiceRule',
        'blocking'
      );
    }
    return null;
  }
}

/**
 * RÈGLE 5: InterventionClient DOIT avoir du contenu
 */
export class InterventionContentRule {
  static validate(data) {
    const hasTaches = data.taches && data.taches.length > 0;
    const hasDescription = data.description && data.description.trim();
    
    if (!hasTaches && !hasDescription) {
      return createQAError(
        'INTERVENTION_CONTENT_REQUIRED',
        'Une intervention doit avoir des tâches OU une description.',
        'Both taches and description are empty',
        'contenu',
        'InterventionContentRule',
        'blocking'
      );
    }
    return null;
  }
}

/**
 * RÈGLE 6: MissionDirection DOIT avoir des zones
 */
export class MissionZonesRule {
  static validate(data) {
    if (!data.zones || data.zones.length === 0) {
      return createQAError(
        'MISSION_ZONES_REQUIRED',
        'Une mission doit avoir au moins une zone définie.',
        'zones array is empty or undefined',
        'zones',
        'MissionZonesRule',
        'blocking'
      );
    }
    return null;
  }
}

/**
 * MOTEUR QA: Validation WorkItem
 */
export function validateWorkItem(data, context = 'CREATE', enabled = true) {
  // Garde
  if (!shouldRunQA(context, enabled)) {
    return createQASuccess('WorkItem', context);
  }

  const errors = [];
  
  // Exécution des règles
  const rules = [
    WorkItemDescriptionRule,
    WorkItemOriginRule,
    WorkItemHousingRule,
    WorkItemServiceRule
  ];
  
  for (const Rule of rules) {
    const error = Rule.validate(data);
    if (error) errors.push(error);
  }
  
  return createQAResult(errors, [], [], 'WorkItem', context);
}

/**
 * MOTEUR QA: Validation InterventionClient
 */
export function validateInterventionClient(data, context = 'CREATE', enabled = true) {
  if (!shouldRunQA(context, enabled)) {
    return createQASuccess('InterventionClient', context);
  }

  const errors = [];
  
  const rules = [InterventionContentRule];
  
  for (const Rule of rules) {
    const error = Rule.validate(data);
    if (error) errors.push(error);
  }
  
  return createQAResult(errors, [], [], 'InterventionClient', context);
}

/**
 * MOTEUR QA: Validation MissionDirection
 */
export function validateMissionDirection(data, context = 'CREATE', enabled = true) {
  if (!shouldRunQA(context, enabled)) {
    return createQASuccess('MissionDirection', context);
  }

  const errors = [];
  
  const rules = [MissionZonesRule];
  
  for (const Rule of rules) {
    const error = Rule.validate(data);
    if (error) errors.push(error);
  }
  
  return createQAResult(errors, [], [], 'MissionDirection', context);
}

/**
 * HELPERS POUR RÉTROCOMPATIBILITÉ
 */
export const validateBeforeWorkItemCreation = (data, options = {}) => {
  const { context = 'CREATE', enabled = true } = options;
  const result = validateWorkItem(data, context, enabled);
  
  // Conversion vers ancien format pour compatibilité
  return {
    ok: result.isValid,
    level: result.blockingErrors.length > 0 ? 'CRITICAL' : 'SUCCESS',
    message: result.blockingErrors.map(e => e.messageUser).join(' | '),
    errors: result.blockingErrors,
    warnings: result.warnings,
    // Format nouveau disponible
    qaResult: result
  };
};

export const validateBeforeInterventionCreation = (data, options = {}) => {
  const { context = 'CREATE', enabled = true } = options;
  const result = validateInterventionClient(data, context, enabled);
  
  return {
    ok: result.isValid,
    level: result.blockingErrors.length > 0 ? 'CRITICAL' : 'SUCCESS',
    message: result.blockingErrors.map(e => e.messageUser).join(' | '),
    errors: result.blockingErrors,
    qaResult: result
  };
};

export const validateBeforeMissionCreation = (data, options = {}) => {
  const { context = 'CREATE', enabled = true } = options;
  const result = validateMissionDirection(data, context, enabled);
  
  return {
    ok: result.isValid,
    level: result.blockingErrors.length > 0 ? 'CRITICAL' : 'SUCCESS',
    message: result.blockingErrors.map(e => e.messageUser).join(' | '),
    errors: result.blockingErrors,
    qaResult: result
  };
};