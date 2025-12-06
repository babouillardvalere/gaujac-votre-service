import { base44 } from '@/api/base44Client';

// Types de notifications
export const NOTIFICATION_TYPES = {
  INVENTAIRE_SOUMIS: 'inventaire_soumis',
  INTERVENTION_CREEE: 'intervention_creee',
  DOSSIER_FINALISE: 'dossier_finalise',
  INTERVENTION_PRISE_EN_CHARGE: 'intervention_prise_en_charge',
  INTERVENTION_RESOLUE: 'intervention_resolue'
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