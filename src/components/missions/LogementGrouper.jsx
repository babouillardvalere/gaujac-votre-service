/**
 * Regroupement par logement/séjour
 * Fusionne TOUS les WorkItems (Technique + Ménage) du même logement dans une seule entité
 * 1 logement = 1 carte unifiée contenant les deux services
 *
 * ⚠️ Ce module travaille EXCLUSIVEMENT avec les statuts UI :
 *   en_attente | en_cours | en_attente_materiel | resolu
 * Les WorkItems doivent être convertis AVANT d'être passés à groupByLogement().
 */
import { UI_STATUS_PRIORITY } from '../workItemStatusMapping';

/**
 * Regroupe les WorkItems par logement + séjour
 * Crée une structure unifiée service-agnostique
 */
export function groupByLogement(workItems = []) {
  const groups = {};

  workItems.forEach(item => {
    // Clé unique : logement + séjour (stay_id ou dates)
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
        
        // Propriétés d'urgence
        urgent: false,
        autorisation_acces: item.autorisation_acces,
        plage_horaire_client: item.plage_horaire_client || item.plages_horaires?.join(', '),
        
        // Intervenant
        pris_par: item.collaborateur || '',
        date_debut: item.date_prise_en_charge,
        date_resolution: item.date_terminee,
        
        // Type d'hébergement
        type_hebergement: item.type_hebergement,
        
        // Métadonnées
        fiche_arrivee_id: item.fiche_arrivee_id,
        
        // WorkItems dans ce groupe - TOUS les services fusionnés
        workItems: [],
        
        // Indicateurs de service présent
        hasTechnique: false,
        hasMenage: false
      };
    }

    const group = groups[groupKey];
    
    // Ajouter le WorkItem au groupe (Technique + Ménage ensemble)
    group.workItems.push(item);
    
    // Marquer le service présent
    if (item.service === 'TECHNIQUE') group.hasTechnique = true;
    if (item.service === 'MENAGE') group.hasMenage = true;
    
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
    // Priorité d'état (statuts UI) : en_attente(0) > en_cours(1) > en_attente_materiel(2) > resolu(3)
    return (UI_STATUS_PRIORITY[a.statut] ?? 99) - (UI_STATUS_PRIORITY[b.statut] ?? 99);
  });
}

/**
 * Détermine l'état du groupe basé sur ses WorkItems (statuts UI).
 * - Si tous resolu         → resolu
 * - Si au moins 1 en_cours → en_cours
 * - Si au moins 1 en_attente_materiel → en_attente_materiel
 * - Sinon                  → en_attente
 */
function getGroupStatus(workItems = []) {
  if (workItems.length === 0) return 'en_attente';

  const statuts = workItems.map(w => w.statut);

  // Si tous résolus
  if (statuts.every(s => s === 'resolu')) return 'resolu';

  // Si au moins un en cours
  if (statuts.some(s => s === 'en_cours')) return 'en_cours';

  // Si au moins un en attente matériel
  if (statuts.some(s => s === 'en_attente_materiel')) return 'en_attente_materiel';

  // Sinon en attente (A_FAIRE côté backend)
  return 'en_attente';
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