import { base44 } from '@/api/base44Client';

/**
 * Synchronise AUTOMATIQUEMENT les statuts services → SuiviInventaire client
 * RÈGLE D'OR : Toute action service DOIT mettre à jour le suivi client en temps réel
 */

// Mapping statuts internes → affichage client unifié
const STATUT_MAPPING = {
  'en_attente': 'en_attente',
  'en_cours': 'en_cours',
  'en_attente_materiel': 'en_attente_materiel',
  'reprise': 'reprise',
  'resolu': 'termine',
  'intervention_terminee': 'termine'
};

// Mapping actions → timeline events
const ACTION_TO_TIMELINE = {
  'prise_en_charge': { status: 'prise_en_charge', detail: 'Intervention prise en charge' },
  'intervenant_arrive': { status: 'intervenant_arrive', detail: 'Technicien arrivé' },
  'en_cours': { status: 'en_cours', detail: 'Intervention en cours' },
  'attente': { status: 'en_attente', detail: 'Mise en attente' },
  'reprise': { status: 'reprise', detail: 'Intervention reprise' },
  'resolu': { status: 'intervention_terminee', detail: 'Problème résolu' },
  'intervenant_reparti': { status: 'intervenant_reparti', detail: 'Technicien reparti' }
};

/**
 * Synchronise UNE intervention vers le suivi client
 * @param {Object} incident - L'incident modifié
 * @param {string} action - Action effectuée (prise_en_charge, en_cours, etc.)
 * @param {string} utilisateur - Nom du collaborateur
 * @param {Object} details - Détails supplémentaires (motif attente, etc.)
 */
export async function syncIncidentToSuivi(incident, action, utilisateur = '', details = {}) {
  if (!incident) return;

  try {
    // 1. Trouver le SuiviInventaire correspondant
    const suivis = await base44.entities.SuiviInventaire.filter({
      client_nom: incident.client_nom,
      client_prenom: incident.client_prenom,
      logement: incident.logement || incident.emplacement,
      date_arrivee: incident.date_arrivee,
      date_depart: incident.date_depart
    });

    if (suivis.length === 0) {
      console.warn('Aucun SuiviInventaire trouvé pour cet incident:', incident.id);
      return;
    }

    const suivi = suivis[0];
    const isMenuge = incident.type === 'menage';
    const isTechnique = incident.type === 'technique';

    // 2. Construire l'événement timeline
    const timelineEvent = {
      timestamp: Date.now(),
      status: ACTION_TO_TIMELINE[action]?.status || action,
      detail: details.detail || ACTION_TO_TIMELINE[action]?.detail || '',
      utilisateur: utilisateur || incident.pris_par || ''
    };

    // 3. Mettre à jour la timeline appropriée
    const updateData = {
      date_derniere_maj: new Date().toISOString()
    };

    if (isMenuge) {
      const currentTimeline = suivi.timeline_menage || [];
      updateData.timeline_menage = [...currentTimeline, timelineEvent];
      updateData.statut_menage = STATUT_MAPPING[incident.statut] || incident.statut;
    }

    if (isTechnique) {
      const currentTimeline = suivi.timeline_technique || [];
      updateData.timeline_technique = [...currentTimeline, timelineEvent];
      updateData.statut_technique = STATUT_MAPPING[incident.statut] || incident.statut;
    }

    // 4. Ajouter message client si fourni
    if (details.messageClient) {
      updateData.message_client = details.messageClient;
    }

    // 5. Synchroniser vers le suivi client
    await base44.entities.SuiviInventaire.update(suivi.id, updateData);

    console.log('✅ SuiviInventaire synchronisé:', {
      incidentId: incident.id,
      suiviId: suivi.id,
      action,
      service: incident.type
    });

  } catch (error) {
    console.error('❌ Erreur synchronisation SuiviInventaire:', error);
    // Ne pas bloquer l'opération principale si la sync échoue
  }
}

/**
 * Crée un SuiviInventaire automatiquement si besoin lors d'un signalement
 * @param {Object} incident - Le nouvel incident
 */
export async function createSuiviFromIncident(incident) {
  if (!incident) return;

  try {
    // Vérifier si un suivi existe déjà
    const existing = await base44.entities.SuiviInventaire.filter({
      client_nom: incident.client_nom,
      client_prenom: incident.client_prenom,
      logement: incident.logement || incident.emplacement,
      date_arrivee: incident.date_arrivee,
      date_depart: incident.date_depart
    });

    if (existing.length > 0) {
      // Suivi existe déjà, juste ajouter l'événement initial
      await syncIncidentToSuivi(incident, 'demande_recue', '', {
        detail: 'Demande transmise au service'
      });
      return existing[0];
    }

    // Créer un nouveau suivi
    const suiviData = {
      client_nom: incident.client_nom,
      client_prenom: incident.client_prenom,
      client_email: incident.client_email || '',
      logement: incident.logement || incident.emplacement,
      categorie_logement: incident.categorie_logement || '',
      type_inventaire: incident.origine === 'arrivee' ? 'ARRIVEE' : 
                       incident.origine === 'depart' ? 'DEPART' : 'ARRIVEE',
      date_arrivee: incident.date_arrivee,
      date_depart: incident.date_depart,
      items_menage: incident.type === 'menage' ? [{
        key: incident.categorie,
        label: incident.description,
        quantity: 1,
        motif: 'Signalé'
      }] : [],
      items_technique: incident.type === 'technique' ? [{
        key: incident.categorie,
        label: incident.description,
        quantity: 1,
        motif: 'Signalé'
      }] : [],
      statut_menage: incident.type === 'menage' ? 'en_attente' : 'non_requis',
      statut_technique: incident.type === 'technique' ? 'en_attente' : 'non_requis',
      timeline_menage: incident.type === 'menage' ? [{
        timestamp: Date.now(),
        status: 'demande_recue',
        detail: 'Demande transmise au service ménage',
        utilisateur: ''
      }] : [],
      timeline_technique: incident.type === 'technique' ? [{
        timestamp: Date.now(),
        status: 'demande_recue',
        detail: 'Demande transmise au service technique',
        utilisateur: ''
      }] : []
    };

    const newSuivi = await base44.entities.SuiviInventaire.create(suiviData);
    console.log('✅ Nouveau SuiviInventaire créé:', newSuivi.id);
    return newSuivi;

  } catch (error) {
    console.error('❌ Erreur création SuiviInventaire:', error);
  }
}

/**
 * Hook pour synchroniser après chaque action service
 * À appeler APRÈS chaque mutation d'Incident
 */
export function useSyncAfterAction() {
  return {
    syncPriseEnCharge: (incident, collaborateur) => 
      syncIncidentToSuivi(incident, 'prise_en_charge', collaborateur, {
        detail: `Prise en charge par ${collaborateur}`
      }),
    
    syncArrivee: (incident, collaborateur) =>
      syncIncidentToSuivi(incident, 'intervenant_arrive', collaborateur, {
        detail: `${collaborateur} est arrivé sur place`
      }),
    
    syncEnCours: (incident, collaborateur) =>
      syncIncidentToSuivi(incident, 'en_cours', collaborateur, {
        detail: 'Intervention en cours'
      }),
    
    syncAttente: (incident, motif, delai) =>
      syncIncidentToSuivi(incident, 'attente', incident.pris_par, {
        detail: `En attente: ${motif}`,
        messageClient: delai ? `Intervention reportée. Délai estimé: ${delai}` : undefined
      }),
    
    syncReprise: (incident, collaborateur) =>
      syncIncidentToSuivi(incident, 'reprise', collaborateur, {
        detail: 'Intervention reprise'
      }),
    
    syncResolu: (incident, collaborateur) =>
      syncIncidentToSuivi(incident, 'resolu', collaborateur, {
        detail: 'Problème résolu',
        messageClient: 'Votre demande a été traitée avec succès !'
      }),
    
    syncDepart: (incident, collaborateur) =>
      syncIncidentToSuivi(incident, 'intervenant_reparti', collaborateur, {
        detail: `${collaborateur} a quitté les lieux`
      })
  };
}