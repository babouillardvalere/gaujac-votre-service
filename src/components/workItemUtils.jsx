// Utilitaires pour WorkItem - Source unique de vérité

/**
 * Calcule la description opérationnelle à partir de tâches ou description libre
 * RÈGLE: Cette fonction est la SEULE source de vérité pour description_operationnelle
 */
export const computeDescriptionOperationnelle = (data) => {
  // Priorité 1: Tâches structurées
  if (data.taches && data.taches.length > 0) {
    return data.taches
      .map((t, idx) => `${idx + 1}. ${t.texte || t.label || 'Tâche sans description'}`)
      .join('\n');
  }
  
  // Priorité 2: Description libre
  if (data.description && data.description.trim()) {
    return data.description.trim();
  }
  
  // Priorité 3: Titre (si non générique)
  if (data.titre && data.titre.trim() && data.titre !== 'Intervention à traiter') {
    return data.titre.trim();
  }
  
  // Aucune description exploitable
  return null;
};

/**
 * Prépare les données WorkItem pour création avec description_operationnelle calculée
 * USAGE: Appeler AVANT toute création de WorkItem
 * BLOQUE: Si impossible de calculer une description (au lieu de corriger silencieusement)
 */
export const prepareWorkItemData = (data) => {
  const description_operationnelle = computeDescriptionOperationnelle(data);
  
  if (!description_operationnelle) {
    throw new Error(
      'VALIDATION CRITICAL: Impossible de créer un WorkItem sans description opérationnelle. ' +
      'Fournissez des tâches OU une description OU un titre exploitable. ' +
      'Le système REFUSE les données invalides, il ne les corrige pas.'
    );
  }
  
  return {
    ...data,
    description_operationnelle
  };
};

/**
 * Lit la description opérationnelle d'un WorkItem existant
 * USAGE: Affichage UI dans Technique, Ménage, SuiviIntervention
 */
export const getWorkItemDescription = (workItem) => {
  // Source unique: description_operationnelle
  if (workItem.description_operationnelle && workItem.description_operationnelle.trim()) {
    return workItem.description_operationnelle;
  }
  
  // Fallback: construire depuis tâches si disponibles
  if (workItem.taches && workItem.taches.length > 0) {
    const description = workItem.taches
      .map((t, idx) => `${idx + 1}. ${t.texte || 'Tâche'}`)
      .join('\n');
    console.log('📋 Description construite depuis tâches pour WorkItem', workItem.id);
    return description;
  }
  
  // Fallback temporaire (données anciennes sans description_operationnelle)
  return computeDescriptionOperationnelle(workItem) || '⚠️ Description manquante - contactez le bureau';
};

/**
 * Mapping des statuts WorkItem → Incident (pour compatibilité)
 */
export const workItemToIncidentStatus = {
  'A_FAIRE': 'en_attente',
  'EN_COURS': 'en_cours',
  'EN_ATTENTE': 'en_attente_materiel',
  'TERMINEE': 'resolu',
  'ANNULEE': 'annule'
};

/**
 * Mapping inverse Incident → WorkItem
 */
export const incidentToWorkItemStatus = {
  'en_attente': 'A_FAIRE',
  'en_cours': 'EN_COURS',
  'en_attente_materiel': 'EN_ATTENTE',
  'resolu': 'TERMINEE',
  'annule': 'ANNULEE'
};