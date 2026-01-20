/**
 * Validation centralisée pour interventions/workitems
 * Applique les règles métier strictes
 */

/**
 * Check si intervention/workitem est actionnable pour prise en charge
 * @param {Object} item - Incident ou WorkItem
 * @returns {Object} { canTakeOver: boolean, reason: string }
 */
export const canTakeOverIntervention = (item) => {
  // BYPASS pour audit/test
  if (item?.is_audit_ou_test === true || item?.type_source === 'AUDIT' || item?.type_source === 'TEST') {
    return { canTakeOver: true, reason: 'AUDIT_OU_TEST_BYPASS' };
  }

  // Intervention réelle = validation stricte
  const desc = item?.description_operationnelle?.trim();
  if (!desc) {
    return {
      canTakeOver: false,
      reason: 'DESCRIPTION_OPERATIONNELLE_MANQUANTE'
    };
  }

  return { canTakeOver: true, reason: 'OK' };
};

/**
 * Assure qu'une intervention a une description opérationnelle valide
 * @param {Object} item - Incident ou WorkItem
 * @throws {Error} si description manquante pour intervention réelle
 */
export const assertInterventionActionnable = (item) => {
  const validation = canTakeOverIntervention(item);
  if (!validation.canTakeOver) {
    throw new Error(`INTERVENTION_INVALIDE: ${validation.reason}`);
  }
};

/**
 * Marque une intervention comme audit/test
 * @param {string} id - ID de l'intervention
 * @param {string} type - 'AUDIT' ou 'TEST'
 * @param {Object} baseClient - base44 SDK
 * @returns {Promise<void>}
 */
export const markAsAuditOrTest = async (id, type, baseClient) => {
  if (!['AUDIT', 'TEST'].includes(type)) {
    throw new Error(`Type invalide: ${type}`);
  }

  await baseClient.entities.Incident.update(id, {
    is_audit_ou_test: true,
    type_source: type
  });
};

/**
 * Marque une intervention comme réelle (retire le flag audit/test)
 * @param {string} id - ID de l'intervention
 * @param {Object} baseClient - base44 SDK
 * @returns {Promise<void>}
 */
export const markAsRealIntervention = async (id, baseClient) => {
  await baseClient.entities.Incident.update(id, {
    is_audit_ou_test: false,
    type_source: 'INTERVENTION_REELLE'
  });
};