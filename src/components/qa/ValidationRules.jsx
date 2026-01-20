/**
 * RÈGLES DE VALIDATION - RETOURNE DES OBJETS, JAMAIS THROW
 * 
 * PRINCIPE: Le système INFORME des problèmes, le contrôleur DÉCIDE du blocage
 * Chaque règle retourne {ok: boolean, level?: string, message?: string}
 */

import { computeDescriptionOperationnelle } from '../workItemUtils';

/**
 * Garde : détermine si QA doit s'exécuter
 */
function shouldRunQA(context = 'READ', config = {}) {
  const { enabled = true } = config;
  if (!enabled) return false;
  return ['CREATE', 'UPDATE', 'TRANSITION'].includes(context);
}

/**
 * RÈGLE 1: WorkItem DOIT avoir une description_operationnelle
 */
export const validateWorkItemDescriptionOperationnelle = (workItemData) => {
  if (!workItemData.description_operationnelle || !workItemData.description_operationnelle.trim()) {
    return {
      ok: false,
      level: 'CRITICAL',
      field: 'description_operationnelle',
      message: 'Un WorkItem DOIT avoir une description_operationnelle. Utilisez prepareWorkItemData().'
    };
  }
  return { ok: true };
};

/**
 * RÈGLE 2: WorkItem DOIT avoir une origine (intervention/mission/incident)
 */
export const validateWorkItemOrigine = (workItemData) => {
  const hasOrigin = 
    workItemData.intervention_client_id || 
    workItemData.mission_direction_id || 
    workItemData.incident_id;
  
  if (!hasOrigin) {
    return {
      ok: false,
      level: 'CRITICAL',
      field: 'origine',
      message: 'Un WorkItem DOIT avoir une origine (intervention_client_id, mission_direction_id, ou incident_id).'
    };
  }
  return { ok: true };
};

/**
 * RÈGLE 3: InterventionClient DOIT avoir des tâches OU une description
 */
export const validateInterventionClientContent = (interventionData) => {
  const hasTaches = interventionData.taches && interventionData.taches.length > 0;
  const hasDescription = interventionData.description && interventionData.description.trim();
  
  if (!hasTaches && !hasDescription) {
    return {
      ok: false,
      level: 'CRITICAL',
      field: 'contenu',
      message: 'Une InterventionClient DOIT avoir des tâches OU une description.'
    };
  }
  return { ok: true };
};

/**
 * RÈGLE 4: MissionDirection DOIT avoir des zones
 */
export const validateMissionDirectionZones = (missionData) => {
  if (!missionData.zones || missionData.zones.length === 0) {
    return {
      ok: false,
      level: 'CRITICAL',
      field: 'zones',
      message: 'Une MissionDirection DOIT avoir au moins une zone définie.'
    };
  }
  return { ok: true };
};

/**
 * RÈGLE 5: Description opérationnelle DOIT être calculable
 */
export const validateCanComputeDescription = (data) => {
  const description = computeDescriptionOperationnelle(data);
  
  if (!description) {
    return {
      ok: false,
      level: 'CRITICAL',
      field: 'description_operationnelle',
      message: 'Impossible de calculer une description opérationnelle. Fournissez des tâches OU une description OU un titre exploitable.'
    };
  }
  return { ok: true };
};

/**
 * VALIDATION COMBINÉE: Applique toutes les règles pertinentes pour WorkItem
 * @returns {ok: boolean, level?: string, message?: string, errors?: array}
 */
export const validateBeforeWorkItemCreation = (workItemData, options = {}) => {
  const { context = 'CREATE', strict = true, enabled = true } = options;
  
  // Garde : QA désactivé ou contexte READ
  if (!shouldRunQA(context, { enabled })) {
    return { ok: true, skipped: true, reason: `Context ${context} skipped` };
  }

  const errors = [];

  // Validation 1 : Origine
  const origineResult = validateWorkItemOrigine(workItemData);
  if (!origineResult.ok) errors.push(origineResult);

  // Validation 2 : Description opérationnelle
  const descResult = validateWorkItemDescriptionOperationnelle(workItemData);
  if (!descResult.ok) errors.push(descResult);

  // Retour structuré
  if (errors.length > 0) {
    const criticalErrors = errors.filter(e => e.level === 'CRITICAL');
    
    if (criticalErrors.length > 0 && strict) {
      return {
        ok: false,
        level: 'CRITICAL',
        message: criticalErrors.map(e => e.message).join(' | '),
        errors: criticalErrors
      };
    }
  }

  return { ok: true, warnings: errors.filter(e => e.level !== 'CRITICAL') };
};

/**
 * VALIDATION COMBINÉE: Avant création InterventionClient
 */
export const validateBeforeInterventionCreation = (interventionData, options = {}) => {
  const { context = 'CREATE', strict = true, enabled = true } = options;
  
  if (!shouldRunQA(context, { enabled })) {
    return { ok: true, skipped: true };
  }

  const errors = [];
  
  const contentResult = validateInterventionClientContent(interventionData);
  if (!contentResult.ok) errors.push(contentResult);
  
  const descResult = validateCanComputeDescription(interventionData);
  if (!descResult.ok) errors.push(descResult);

  if (errors.length > 0 && strict) {
    return {
      ok: false,
      level: 'CRITICAL',
      message: errors.map(e => e.message).join(' | '),
      errors
    };
  }

  return { ok: true };
};

/**
 * VALIDATION COMBINÉE: Avant création MissionDirection
 */
export const validateBeforeMissionCreation = (missionData, options = {}) => {
  const { context = 'CREATE', strict = true, enabled = true } = options;
  
  if (!shouldRunQA(context, { enabled })) {
    return { ok: true, skipped: true };
  }

  const result = validateMissionDirectionZones(missionData);
  
  if (!result.ok && strict) {
    return result;
  }

  return { ok: true };
};

/**
 * DÉTECTION: Trouve les anomalies dans les données existantes
 * NE CORRIGE PAS - rapporte uniquement pour action manuelle
 * Context READ, donc non-bloquant
 */
export const detectAnomalies = async (base44) => {
  const anomalies = [];

  try {
    const workItems = await base44.entities.WorkItem.filter({});
    const workItemsSansDesc = workItems.filter(w => 
      !w.description_operationnelle || !w.description_operationnelle.trim()
    );
    
    if (workItemsSansDesc.length > 0) {
      anomalies.push({
        type: 'WORKITEM_SANS_DESCRIPTION',
        severity: 'CRITICAL',
        count: workItemsSansDesc.length,
        ids: workItemsSansDesc.map(w => w.id),
        message: `${workItemsSansDesc.length} WorkItem(s) sans description_operationnelle`
      });
    }

    const orphelins = workItems.filter(w => 
      !w.intervention_client_id && !w.mission_direction_id && !w.incident_id
    );
    
    if (orphelins.length > 0) {
      anomalies.push({
        type: 'WORKITEM_ORPHELIN',
        severity: 'CRITICAL',
        count: orphelins.length,
        ids: orphelins.map(w => w.id),
        message: `${orphelins.length} WorkItem(s) orphelin(s) détecté(s)`
      });
    }

    const interventions = await base44.entities.InterventionClient.filter({});
    const interventionsSansContenu = interventions.filter(i => 
      (!i.taches || i.taches.length === 0) && (!i.description || !i.description.trim())
    );
    
    if (interventionsSansContenu.length > 0) {
      anomalies.push({
        type: 'INTERVENTION_SANS_CONTENU',
        severity: 'CRITICAL',
        count: interventionsSansContenu.length,
        ids: interventionsSansContenu.map(i => i.id),
        message: `${interventionsSansContenu.length} Intervention(s) sans contenu`
      });
    }

  } catch (error) {
    anomalies.push({
      type: 'DETECTION_ERROR',
      severity: 'ERROR',
      message: error.message
    });
  }

  return anomalies;
};