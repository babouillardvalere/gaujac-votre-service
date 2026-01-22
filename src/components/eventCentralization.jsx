/**
 * Centralisation des événements
 * RÈGLE: 1 action = 1 événement SuiviEvent propre (pas de doublons)
 */

import { createCleanEvent } from './workflowStateService';

/**
 * Enregistre UNE SEULE prise en charge pour un WorkItem
 * Pas d'InterventionLog, pas d'HistoriqueEvent, pas de pushClientEvent
 * TOUT va dans SuiviEvent qui est la source unique de vérité
 */
export async function logPriseEnCharge(incident, collaborateurNom, base44, tempsPriseEnCharge = 0) {
  const now = new Date();
  
  const event = createCleanEvent('PRISE_EN_CHARGE', incident, {
    origine: 'INVENTAIRE_ARRIVEE',
    reference_id: incident.stay_id || incident.fiche_arrivee_id || incident.id,
    service: incident.service || 'TECHNIQUE',
    collaborateur: collaborateurNom,
    message: `Prise en charge par ${collaborateurNom}`,
    metadata: {
      temps_prise_en_charge: tempsPriseEnCharge,
      service_source: incident.service || 'TECHNIQUE'
    }
  });

  // ✅ 1 SEUL événement enregistré
  await base44.entities.SuiviEvent.create(event);
}

/**
 * Enregistre UNE SEULE mise en attente
 */
export async function logMiseEnAttente(incident, collaborateurNom, base44, formData) {
  const event = createCleanEvent('MISE_EN_ATTENTE', incident, {
    origine: 'INVENTAIRE_ARRIVEE',
    reference_id: incident.stay_id || incident.fiche_arrivee_id || incident.id,
    service: incident.service || 'TECHNIQUE',
    collaborateur: collaborateurNom,
    message: `Mise en attente: ${formData.raison}`,
    metadata: {
      raison_attente: formData.raison,
      motif_attente: formData.motifAttente,
      materiel: formData.materiel,
      materiel_detail: formData.materielDetail,
      delai: formData.delai,
      commentaire: formData.commentaire
    }
  });

  // ✅ 1 SEUL événement enregistré
  await base44.entities.SuiviEvent.create(event);
}

/**
 * Enregistre UNE SEULE clôture/terminaison
 */
export async function logTerminaison(incident, collaborateurNom, base44, tempsTotal = 0) {
  const event = createCleanEvent('TERMINEE', incident, {
    origine: 'INVENTAIRE_ARRIVEE',
    reference_id: incident.stay_id || incident.fiche_arrivee_id || incident.id,
    service: incident.service || 'TECHNIQUE',
    collaborateur: collaborateurNom,
    message: `Intervention terminée`,
    metadata: {
      temps_total_minutes: tempsTotal,
      service_source: incident.service || 'TECHNIQUE'
    }
  });

  // ✅ 1 SEUL événement enregistré
  await base44.entities.SuiviEvent.create(event);
}

/**
 * Enregistre UNE SEULE reprise
 */
export async function logReprise(incident, collaborateurNom, base44) {
  const event = createCleanEvent('REPRISE', incident, {
    origine: 'INVENTAIRE_ARRIVEE',
    reference_id: incident.stay_id || incident.fiche_arrivee_id || incident.id,
    service: incident.service || 'TECHNIQUE',
    collaborateur: collaborateurNom,
    message: `Intervention reprise`
  });

  // ✅ 1 SEUL événement enregistré
  await base44.entities.SuiviEvent.create(event);
}

/**
 * Valide avant d'autoriser une transition
 * RETOURNE: { authorized: boolean, error?: string }
 */
export function validateTransition(currentState, nextState, data = {}, areTasksResolved = false) {
  const transitions = {
    'A_FAIRE': {
      'EN_COURS': { required: ['collaborateur'], error: 'Collaborateur requis' },
      'EN_ATTENTE': { required: ['raison_attente', 'motif_attente'], error: 'Raison et motif requis' }
    },
    'EN_COURS': {
      'EN_ATTENTE': { required: ['raison_attente', 'motif_attente'], error: 'Raison et motif requis' },
      'TERMINEE': { required: [], error: areTasksResolved ? null : 'Toutes les tâches doivent être justifiées' }
    },
    'EN_ATTENTE': {
      'EN_COURS': { required: ['collaborateur'], error: 'Collaborateur requis' }
    }
  };

  const allowed = transitions[currentState]?.[nextState];
  if (!allowed) {
    return { authorized: false, error: `Transition ${currentState} → ${nextState} non autorisée` };
  }

  if (allowed.error && !areTasksResolved) {
    return { authorized: false, error: allowed.error };
  }

  for (const field of allowed.required) {
    if (!data[field]) {
      return { authorized: false, error: `Champ manquant: ${field}` };
    }
  }

  return { authorized: true };
}