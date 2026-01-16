/**
 * RÈGLES DE VALIDATION STRICTES - SYSTÈME REFUSE AU LIEU DE CORRIGER
 * 
 * PRINCIPE: Le système BLOQUE les données invalides, il ne les corrige JAMAIS automatiquement.
 * Chaque règle doit lever une erreur CRITICAL qui empêche la création/modification.
 */

import { computeDescriptionOperationnelle } from '../workItemUtils';

/**
 * RÈGLE 1: WorkItem DOIT avoir une description_operationnelle
 * BLOQUE: Création de WorkItem sans source de vérité unique
 */
export const validateWorkItemDescriptionOperationnelle = (workItemData) => {
  if (!workItemData.description_operationnelle || !workItemData.description_operationnelle.trim()) {
    throw new Error(
      'VALIDATION CRITICAL: Un WorkItem DOIT avoir une description_operationnelle. ' +
      'Utilisez prepareWorkItemData() avant création.'
    );
  }
  return true;
};

/**
 * RÈGLE 2: WorkItem DOIT avoir une origine (intervention/mission/incident)
 * BLOQUE: WorkItems orphelins
 */
export const validateWorkItemOrigine = (workItemData) => {
  const hasOrigin = 
    workItemData.intervention_client_id || 
    workItemData.mission_direction_id || 
    workItemData.incident_id;
  
  if (!hasOrigin) {
    throw new Error(
      'VALIDATION CRITICAL: Un WorkItem DOIT avoir une origine ' +
      '(intervention_client_id, mission_direction_id, ou incident_id).'
    );
  }
  return true;
};

/**
 * RÈGLE 3: InterventionClient DOIT avoir des tâches OU une description
 * BLOQUE: Interventions vides
 */
export const validateInterventionClientContent = (interventionData) => {
  const hasTaches = interventionData.taches && interventionData.taches.length > 0;
  const hasDescription = interventionData.description && interventionData.description.trim();
  
  if (!hasTaches && !hasDescription) {
    throw new Error(
      'VALIDATION CRITICAL: Une InterventionClient DOIT avoir des tâches OU une description.'
    );
  }
  return true;
};

/**
 * RÈGLE 4: MissionDirection DOIT avoir des zones
 * BLOQUE: Missions sans périmètre
 */
export const validateMissionDirectionZones = (missionData) => {
  if (!missionData.zones || missionData.zones.length === 0) {
    throw new Error(
      'VALIDATION CRITICAL: Une MissionDirection DOIT avoir au moins une zone définie.'
    );
  }
  return true;
};

/**
 * RÈGLE 5: Description opérationnelle DOIT être calculable
 * BLOQUE: Données sans contenu exploitable
 */
export const validateCanComputeDescription = (data) => {
  const description = computeDescriptionOperationnelle(data);
  
  if (!description) {
    throw new Error(
      'VALIDATION CRITICAL: Impossible de calculer une description opérationnelle. ' +
      'Fournissez des tâches OU une description OU un titre exploitable.'
    );
  }
  return true;
};

/**
 * VALIDATION COMBINÉE: Applique toutes les règles pertinentes
 * Utilisez cette fonction avant TOUTE création de WorkItem
 */
export const validateBeforeWorkItemCreation = (workItemData) => {
  validateWorkItemOrigine(workItemData);
  validateWorkItemDescriptionOperationnelle(workItemData);
  return true;
};

/**
 * VALIDATION COMBINÉE: Avant création InterventionClient
 */
export const validateBeforeInterventionCreation = (interventionData) => {
  validateInterventionClientContent(interventionData);
  validateCanComputeDescription(interventionData);
  return true;
};

/**
 * VALIDATION COMBINÉE: Avant création MissionDirection
 */
export const validateBeforeMissionCreation = (missionData) => {
  validateMissionDirectionZones(missionData);
  return true;
};

/**
 * DÉTECTION: Trouve les anomalies dans les données existantes
 * NE CORRIGE PAS - rapporte uniquement pour action manuelle
 */
export const detectAnomalies = async (base44) => {
  const anomalies = [];

  try {
    // WorkItems sans description opérationnelle
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

    // WorkItems orphelins
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

    // Interventions sans contenu
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