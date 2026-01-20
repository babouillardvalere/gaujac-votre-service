import { base44 } from '@/api/base44Client';

/**
 * 🔒 FACTORY CENTRALISÉE - SEULE MÉTHODE AUTORISÉE POUR CRÉER DES WORKITEMS
 * 
 * RÈGLE ABSOLUE: Ne JAMAIS appeler base44.entities.WorkItem.create() directement
 * Toujours passer par createWorkItem() pour garantir la conformité
 * 
 * @throws {Error} Si validation échoue
 */

/**
 * Valide les champs obligatoires d'un WorkItem avant création
 * @param {Object} data - Données du WorkItem
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateWorkItemData(data) {
  const errors = [];

  // CHAMP OBLIGATOIRE #1: description_operationnelle
  if (!data.description_operationnelle || data.description_operationnelle.trim() === '') {
    errors.push('description_operationnelle est OBLIGATOIRE et ne peut pas être vide');
  }

  // CHAMP OBLIGATOIRE #2: service
  const validServices = ['TECHNIQUE', 'MENAGE', 'RECEPTION', 'DIRECTION'];
  if (!data.service || !validServices.includes(data.service)) {
    errors.push(`service doit être l'un de: ${validServices.join(', ')}`);
  }

  // CHAMP OBLIGATOIRE #3: statut
  const validStatuts = ['A_FAIRE', 'EN_COURS', 'EN_ATTENTE', 'TERMINEE', 'ANNULEE'];
  if (!data.statut || !validStatuts.includes(data.statut)) {
    errors.push(`statut doit être l'un de: ${validStatuts.join(', ')}`);
  }

  // CHAMP OBLIGATOIRE #4: hebergement
  if (!data.hebergement || data.hebergement.trim() === '') {
    errors.push('hebergement est OBLIGATOIRE et ne peut pas être vide');
  }

  // CHAMP OBLIGATOIRE #5: type
  const validTypes = ['INTERVENTION_CLIENT', 'MISSION_DIRECTION', 'INCIDENT_SIGNALEMENT', 'TACHE_SERVICE'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.push(`type doit être l'un de: ${validTypes.join(', ')}`);
  }

  // CHAMP OBLIGATOIRE #6: priorite
  const validPriorites = ['NORMALE', 'URGENTE', 'CRITIQUE'];
  if (!data.priorite || !validPriorites.includes(data.priorite)) {
    errors.push(`priorite doit être l'un de: ${validPriorites.join(', ')}`);
  }

  // VALIDATION MÉTIER: Autorisation accès
  if (data.autorisation_acces === 'non' && (!data.plages_horaires || data.plages_horaires.length === 0)) {
    errors.push('plages_horaires OBLIGATOIRE si autorisation_acces = "non"');
  }

  // VALIDATION MÉTIER: Origine (au moins un lien)
  const hasOrigine = data.intervention_client_id || data.mission_direction_id || data.incident_id;
  if (!hasOrigine && data.type !== 'TACHE_SERVICE') {
    console.warn('⚠️ WorkItem sans origine (intervention_client_id, mission_direction_id, incident_id) - acceptable pour création manuelle Direction');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 🔒 MÉTHODE UNIQUE AUTORISÉE POUR CRÉER DES WORKITEMS
 * 
 * Usage:
 * import { createWorkItem } from '@/components/workItemCreator';
 * const workItem = await createWorkItem({ ... });
 * 
 * @param {Object} data - Données du WorkItem (DOIT contenir tous les champs obligatoires)
 * @returns {Promise<Object>} WorkItem créé
 * @throws {Error} Si validation échoue
 */
export async function createWorkItem(data) {
  // VALIDATION STRICTE
  const validation = validateWorkItemData(data);
  
  if (!validation.valid) {
    const errorMessage = `❌ CRÉATION WORKITEM REFUSÉE:\n${validation.errors.join('\n')}`;
    console.error(errorMessage, data);
    throw new Error(errorMessage);
  }

  // Valeurs par défaut sécurisées
  const workItemData = {
    rank: 0,
    plages_horaires: [],
    taches: [],
    attachments: [],
    ...data
  };

  console.log('✅ CRÉATION WORKITEM VALIDÉE:', {
    type: workItemData.type,
    service: workItemData.service,
    hebergement: workItemData.hebergement,
    description_length: workItemData.description_operationnelle.length
  });

  // CRÉATION VIA SDK (QA sera exécuté automatiquement)
  const createdWorkItem = await base44.entities.WorkItem.create(workItemData);
  
  console.log('✅ WORKITEM CRÉÉ:', createdWorkItem.id);
  
  // Hook automatique: Logger l'événement de création
  try {
    const { onWorkItemCreated } = await import('./suiviEventLogger');
    await onWorkItemCreated(createdWorkItem);
  } catch (error) {
    console.warn('⚠️ Hook SuiviEvent non exécuté:', error.message);
  }
  
  return createdWorkItem;
}

/**
 * Création en masse de WorkItems (missions Direction multi-zones)
 * @param {Array<Object>} workItemsArray - Tableau de données WorkItems
 * @returns {Promise<Array<Object>>} WorkItems créés
 */
export async function createWorkItemsBulk(workItemsArray) {
  if (!Array.isArray(workItemsArray) || workItemsArray.length === 0) {
    throw new Error('workItemsArray doit être un tableau non vide');
  }

  // Valider TOUS les WorkItems avant création
  const validations = workItemsArray.map(validateWorkItemData);
  const allValid = validations.every(v => v.valid);

  if (!allValid) {
    const allErrors = validations
      .filter(v => !v.valid)
      .map((v, idx) => `WorkItem #${idx + 1}: ${v.errors.join(', ')}`)
      .join('\n');
    
    throw new Error(`❌ CRÉATION BULK REFUSÉE:\n${allErrors}`);
  }

  console.log(`✅ CRÉATION BULK VALIDÉE: ${workItemsArray.length} WorkItems`);

  // Créer un par un (pas de bulkCreate pour garantir validation QA)
  const created = [];
  for (const data of workItemsArray) {
    const workItem = await createWorkItem(data);
    created.push(workItem);
  }

  console.log(`✅ BULK TERMINÉ: ${created.length} WorkItems créés`);
  return created;
}

/**
 * 🔧 HELPER - Construction description_operationnelle depuis tâches
 * @param {Array<Object>} taches - Tableau de tâches
 * @returns {string} Description opérationnelle formatée
 */
export function buildDescriptionFromTaches(taches) {
  if (!taches || taches.length === 0) {
    throw new Error('Impossible de construire description_operationnelle: aucune tâche fournie');
  }

  return taches
    .map((t, idx) => `${idx + 1}. ${t.texte || t.label || 'Tâche sans texte'}`)
    .join('\n');
}

/**
 * 🔧 HELPER - Déterminer le service depuis une catégorie
 * @param {string} categorie - Catégorie du problème (ex: 'electricite', 'nettoyage')
 * @returns {string} Service assigné ('TECHNIQUE', 'MENAGE', 'RECEPTION')
 */
export function getServiceFromCategorie(categorie) {
  const CATEGORIES_TECHNIQUE = [
    'gaz', 'eau', 'electricite', 'plomberie', 'espace_vert', 'divers_technique',
    'mobilier', 'structurel', 'souris', 'guepes', 'frelons', 'fourmis', 'moustiques',
    // Literie = TOUJOURS technique
    'lit_double', 'lit_simple', 'lit_superpose', 'sommier', 'matelas', 'literie'
  ];

  const CATEGORIES_RECEPTION = [
    'cle_locatif', 'cle_locative', 'carte_barriere', 'badge', 
    'table_jardin', 'chaises_jardin', 'salon_jardin'
  ];

  if (CATEGORIES_TECHNIQUE.includes(categorie)) {
    return 'TECHNIQUE';
  } else if (CATEGORIES_RECEPTION.includes(categorie)) {
    return 'RECEPTION';
  } else {
    return 'MENAGE';
  }
}

// Export par défaut
export default {
  createWorkItem,
  createWorkItemsBulk,
  buildDescriptionFromTaches,
  getServiceFromCategorie
};