import { base44 } from '@/api/base44Client';

// Types de notifications
export const NOTIFICATION_TYPES = {
  INVENTAIRE_SOUMIS: 'inventaire_soumis',
  INTERVENTION_CREEE: 'intervention_creee',
  DOSSIER_FINALISE: 'dossier_finalise',
  INTERVENTION_PRISE_EN_CHARGE: 'intervention_prise_en_charge',
  INTERVENTION_RESOLUE: 'intervention_resolue',
  TACHE_ASSIGNEE: 'tache_assignee',
  TACHE_STATUT_CHANGE: 'tache_statut_change'
};

// Rôles destinataires
export const ROLES = {
  RECEPTION: 'reception',
  TECHNIQUE: 'technique',
  MENAGE: 'menage',
  DIRECTION: 'direction',
  CLIENT: 'client'
};

// Récupérer les préférences de notification depuis localStorage
export const getNotificationPreferences = (role) => {
  const stored = localStorage.getItem(`notification_prefs_${role}`);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Préférences par défaut
  return {
    inventaire_soumis: true,
    intervention_creee: true,
    dossier_finalise: true,
    intervention_prise_en_charge: false,
    intervention_resolue: true,
    email_enabled: false
  };
};

// Sauvegarder les préférences
export const saveNotificationPreferences = (role, preferences) => {
  localStorage.setItem(`notification_prefs_${role}`, JSON.stringify(preferences));
};

// Créer une notification d'inventaire soumis
export const notifierInventaireSoumis = async (inventaireData) => {
  const prefs = getNotificationPreferences(ROLES.RECEPTION);
  if (!prefs.inventaire_soumis) return;

  try {
    await base44.entities.Notification.create({
      destinataire_type: 'collaborateur',
      type: 'nouvelle_intervention',
      titre: `📋 Nouveau contrôle inventaire`,
      message: `${inventaireData.client_nom} ${inventaireData.client_prenom} - ${inventaireData.numero_locatif}`,
      metadata: {
        inventaire_id: inventaireData.id,
        numero_locatif: inventaireData.numero_locatif,
        client: `${inventaireData.client_nom} ${inventaireData.client_prenom}`,
        date_arrivee: inventaireData.date_arrivee,
        inventaire_complet: inventaireData.inventaire_complet,
        role_cible: ROLES.RECEPTION
      },
      lue: false,
      archivee: false
    });
  } catch (error) {
    console.error('Erreur création notification inventaire:', error);
  }
};

// Créer une notification d'intervention créée
export const notifierInterventionCreee = async (incidentData) => {
  const role = incidentData.type === 'technique' ? ROLES.TECHNIQUE : ROLES.MENAGE;
  const prefs = getNotificationPreferences(role);
  
  if (!prefs.intervention_creee) return;

  try {
    await base44.entities.Notification.create({
      destinataire_type: 'collaborateur',
      type: incidentData.urgent ? 'intervention_urgente' : 'nouvelle_intervention',
      titre: `${incidentData.urgent ? '🔴 URGENT' : '🔔'} Nouvelle intervention ${incidentData.type}`,
      message: `${incidentData.client_nom} ${incidentData.client_prenom} - ${incidentData.logement || incidentData.emplacement}`,
      incident_id: incidentData.id,
      hebergement: incidentData.logement || incidentData.emplacement,
      metadata: {
        incident_id: incidentData.id,
        type: incidentData.type,
        categorie: incidentData.categorie,
        urgent: incidentData.urgent,
        description: incidentData.description,
        origine: incidentData.origine,
        role_cible: role
      },
      lue: false,
      archivee: false
    });
  } catch (error) {
    console.error('Erreur création notification intervention:', error);
  }
};

// Créer une notification de dossier finalisé
export const notifierDossierFinalise = async (dossierData, stats) => {
  const prefs = getNotificationPreferences(ROLES.RECEPTION);
  if (!prefs.dossier_finalise) return;

  try {
    await base44.entities.Notification.create({
      destinataire_type: 'collaborateur',
      type: 'statut_change',
      titre: `✅ Dossier arrivée finalisé`,
      message: `${dossierData.client_nom} ${dossierData.client_prenom} - ${dossierData.numero_logement}`,
      metadata: {
        dossier_id: dossierData.id,
        code_dossier: dossierData.code_dossier,
        numero_logement: dossierData.numero_logement,
        interventions_menage: stats.interventions_menage || 0,
        interventions_technique: stats.interventions_technique || 0,
        inventaire_complet: stats.inventaire_complet,
        role_cible: ROLES.RECEPTION
      },
      lue: false,
      archivee: false
    });
  } catch (error) {
    console.error('Erreur création notification dossier:', error);
  }
};

// Notifier client que son intervention est prise en charge
export const notifierClientPriseEnCharge = async (incidentData, collaborateur) => {
  console.log('📧 Notification client - prise en charge:', {
    incident: incidentData.id,
    collaborateur,
    client: `${incidentData.client_nom} ${incidentData.client_prenom}`
  });
};

// Notifier client que son intervention est résolue
export const notifierClientResolution = async (incidentData) => {
  console.log('📧 Notification client - résolution:', {
    incident: incidentData.id,
    client: `${incidentData.client_nom} ${incidentData.client_prenom}`
  });
};

// Obtenir les notifications non lues pour un rôle
export const getNotificationsNonLues = async (role) => {
  try {
    const notifications = await base44.entities.Notification.filter({
      lue: false,
      archivee: false
    });
    
    return notifications.filter(notif => {
      if (!notif.metadata?.role_cible) return true;
      return notif.metadata.role_cible === role;
    });
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    return [];
  }
};

// Marquer une notification comme lue
export const marquerCommeLue = async (notificationId) => {
  try {
    await base44.entities.Notification.update(notificationId, { lue: true });
  } catch (error) {
    console.error('Erreur marquer notification lue:', error);
  }
};

// Marquer toutes les notifications comme lues pour un rôle
export const marquerToutesCommeLues = async (role) => {
  try {
    const notifications = await getNotificationsNonLues(role);
    await Promise.all(notifications.map(n => marquerCommeLue(n.id)));
  } catch (error) {
    console.error('Erreur marquer toutes lues:', error);
  }
};

// Notifier nouvelle tâche assignée
export const notifierNouvelleTache = async (tacheData) => {
  const role = tacheData.categorie === 'technique' ? ROLES.TECHNIQUE : 
                tacheData.categorie === 'menage' ? ROLES.MENAGE : 
                ROLES.RECEPTION;
  
  const prefs = getNotificationPreferences(role);
  
  try {
    await base44.entities.Notification.create({
      destinataire_type: 'collaborateur',
      destinataire_email: tacheData.assignee_email,
      type: 'intervention_assignee',
      titre: `✅ Nouvelle tâche ${tacheData.categorie}`,
      message: `${tacheData.titre} - Échéance: ${tacheData.date_echeance ? new Date(tacheData.date_echeance).toLocaleDateString('fr-FR') : 'Non définie'}`,
      metadata: {
        tache_id: tacheData.id,
        categorie: tacheData.categorie,
        priorite: tacheData.priorite,
        hebergement: tacheData.hebergement,
        role_cible: role
      },
      lue: false,
      archivee: false
    });

    // Email si activé
    if (prefs.email_enabled && tacheData.assignee_email) {
      await base44.integrations.Core.SendEmail({
        to: tacheData.assignee_email,
        subject: `Nouvelle tâche ${tacheData.categorie}: ${tacheData.titre}`,
        body: `
Bonjour ${tacheData.assignee},

Une nouvelle tâche vous a été assignée :

Titre: ${tacheData.titre}
Catégorie: ${tacheData.categorie}
Priorité: ${tacheData.priorite}
${tacheData.hebergement ? `Hébergement: ${tacheData.hebergement}` : ''}
Échéance: ${tacheData.date_echeance ? new Date(tacheData.date_echeance).toLocaleString('fr-FR') : 'Non définie'}

${tacheData.description ? `Description:\n${tacheData.description}` : ''}

Merci de traiter cette demande dans les meilleurs délais.

L'équipe Camping Paradis
        `
      });
    }
  } catch (error) {
    console.error('Erreur notification nouvelle tâche:', error);
  }
};

// Notifier changement de statut de tâche
export const notifierChangementStatutTache = async (tacheData, ancienStatut) => {
  if (ancienStatut === tacheData.statut) return;
  
  const role = tacheData.categorie === 'technique' ? ROLES.TECHNIQUE : 
                tacheData.categorie === 'menage' ? ROLES.MENAGE : 
                ROLES.RECEPTION;
  
  const prefs = getNotificationPreferences(role);
  
  try {
    const statutLabels = {
      'a_faire': '⏳ À faire',
      'en_cours': '🔵 En cours',
      'en_attente': '⏸️ En attente',
      'terminee': '✅ Terminée',
      'annulee': '❌ Annulée'
    };

    await base44.entities.Notification.create({
      destinataire_type: 'collaborateur',
      destinataire_email: tacheData.assignee_email,
      type: 'statut_change',
      titre: `Tâche ${statutLabels[tacheData.statut]}`,
      message: `${tacheData.titre}`,
      metadata: {
        tache_id: tacheData.id,
        ancien_statut: ancienStatut,
        nouveau_statut: tacheData.statut,
        categorie: tacheData.categorie,
        role_cible: role
      },
      lue: false,
      archivee: false
    });

    // Email pour statut "terminée" si activé
    if (prefs.email_enabled && tacheData.assignee_email && tacheData.statut === 'terminee') {
      await base44.integrations.Core.SendEmail({
        to: tacheData.assignee_email,
        subject: `Tâche terminée: ${tacheData.titre}`,
        body: `
Bonjour ${tacheData.assignee},

La tâche "${tacheData.titre}" a été marquée comme terminée.

Merci pour votre travail !

L'équipe Camping Paradis
        `
      });
    }
  } catch (error) {
    console.error('Erreur notification changement statut tâche:', error);
  }
};