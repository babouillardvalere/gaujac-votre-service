/**
 * Regroupement par logement/séjour
 * Fusionne tous les WorkItems du même logement dans une seule entité
 */

/**
 * Regroupe les WorkItems par logement + date + client
 * Crée une structure unifiée où 1 logement = 1 carte
 */
export function groupByLogement(workItems = []) {
  const groups = {};

  workItems.forEach(item => {
    // Clé unique : logement + séjour (stay_id ou date_arrivee)
    const logement = item.hebergement || item.logement || 'unknown';
    const stayKey = item.stay_id || 
                    `${item.date_arrivee}-${item.date_depart}` || 
                    `${item.client_nom}-${item.client_prenom}`;
    
    const groupKey = `${logement}_${stayKey}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        // Identifiants
        groupId: groupKey,
        logement,
        stay_id: item.stay_id,
        
        // Infos client
        client_nom: item.client_nom,
        client_prenom: item.client_prenom,
        
        // Dates
        date_arrivee: item.date_arrivee,
        date_depart: item.date_depart,
        
        // État du groupe (le plus grave)
        statut: item.statut,
        
        // Priorité
        urgent: false,
        autorisation_acces: item.autorisation_acces,
        plage_horaire_client: item.plages_horaires?.join(', '),
        
        // Intervenant
        pris_par: item.collaborateur || '',
        date_debut: item.date_prise_en_charge,
        date_resolution: item.date_terminee,
        
        // Type d'hébergement
        type_hebergement: item.type_hebergement,
        
        // Métadonnées
        fiche_arrivee_id: item.fiche_arrivee_id,
        
        // WorkItems dans ce groupe
        workItems: [],
        
        // Agrégation
        hasTehnique: false,
        hasMenage: false,
        totalTasks: 0,
        completedTasks: 0
      };
    }

    const group = groups[groupKey];
    
    // Ajouter le WorkItem au groupe
    group.workItems.push(item);
    
    // Marquer le service présent
    if (item.service === 'TECHNIQUE') group.hasTechnique = true;
    if (item.service === 'MENAGE') group.hasMenage = true;
    
    // Compter les tâches
    if (item.taches) {
      group.totalTasks += item.taches.length;
      group.completedTasks += item.taches.filter(t => t.faite).length;
    }
    
    // Propager l'urgence
    if (item.priorite === 'URGENTE') {
      group.urgent = true;
    }
    
    // Déterminer l'état du groupe (le plus grave)
    group.statut = getGroupStatus(group.workItems);
  });

  // Trier par urgence + statut
  return Object.values(groups).sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    
    // Priorité d'état : A_FAIRE > EN_COURS > EN_ATTENTE > TERMINEE
    const statePriority = { 'A_FAIRE': 0, 'EN_COURS': 1, 'EN_ATTENTE': 2, 'TERMINEE': 3 };
    return (statePriority[a.statut] || 99) - (statePriority[b.statut] || 99);
  });
}

/**
 * Détermine l'état du groupe basé sur ses WorkItems
 * - Si tous TERMINEE → TERMINEE
 * - Si au moins 1 EN_COURS → EN_COURS
 * - Si au moins 1 EN_ATTENTE → EN_ATTENTE
 * - Sinon → A_FAIRE
 */
function getGroupStatus(workItems = []) {
  if (workItems.length === 0) return 'A_FAIRE';
  
  const statuts = workItems.map(w => w.statut);
  
  // Si tous terminés
  if (statuts.every(s => s === 'TERMINEE')) return 'TERMINEE';
  
  // Si au moins un en cours
  if (statuts.some(s => s === 'EN_COURS')) return 'EN_COURS';
  
  // Si au moins un en attente
  if (statuts.some(s => s === 'EN_ATTENTE')) return 'EN_ATTENTE';
  
  // Sinon à faire
  return 'A_FAIRE';
}

/**
 * Récupère les WorkItems techniques + ménage d'un groupe
 */
export function getGroupServices(group) {
  return {
    technique: group.workItems.filter(w => w.service === 'TECHNIQUE'),
    menage: group.workItems.filter(w => w.service === 'MENAGE')
  };
}

/**
 * Vérifie si le groupe peut faire une transition
 */
export function canGroupTransition(group, toState) {
  // Règle simple : tous les WorkItems doivent pouvoir transitionner
  return group.workItems.every(wi => canItemTransition(wi, toState));
}

function canItemTransition(item, toState) {
  // À implémenter avec les règles du workflowStateService
  return true; // Placeholder
}