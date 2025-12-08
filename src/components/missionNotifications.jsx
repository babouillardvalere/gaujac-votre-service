import { base44 } from '@/api/base44Client';

// Mapping des services Mission vers les types de destinataires
const SERVICE_TO_NOTIFICATION_TYPE = {
  'TECHNIQUE': 'collaborateur',
  'MENAGE': 'collaborateur',
  'ACCUEIL': 'collaborateur',
  'ANIMATION': 'collaborateur',
  'BAR': 'collaborateur'
};

// Mapping des services vers les emails des équipes (à personnaliser)
const SERVICE_TO_TEAM = {
  'TECHNIQUE': 'technique',
  'MENAGE': 'menage',
  'ACCUEIL': 'reception',
  'ANIMATION': 'animation',
  'BAR': 'bar'
};

/**
 * Envoie des notifications à tous les services assignés à une mission
 */
export async function notifyMissionServices(mission, lang = 'fr') {
  if (!mission.services || mission.services.length === 0) {
    return;
  }

  const missionTypeLabels = {
    'DESHIVERNAGE': lang === 'fr' ? 'Déshivernage' : 'Spring Opening',
    'HIVERNAGE': lang === 'fr' ? 'Winter Closing' : 'Winter Closing',
    'SAISON': lang === 'fr' ? 'Saison' : 'Season'
  };

  const typeLabel = missionTypeLabels[mission.type] || mission.type;
  
  const notifications = [];

  for (const service of mission.services) {
    const notification = {
      destinataire_type: SERVICE_TO_NOTIFICATION_TYPE[service] || 'collaborateur',
      type: 'nouvelle_mission_direction',
      titre: lang === 'fr' 
        ? `Nouvelle mission ${typeLabel} : ${mission.titre}`
        : `New ${typeLabel} mission: ${mission.titre}`,
      message: lang === 'fr'
        ? `${mission.description || ''}\nPériode : ${mission.date_debut} → ${mission.date_fin}\nService : ${service}`
        : `${mission.description || ''}\nPeriod: ${mission.date_debut} → ${mission.date_fin}\nService: ${service}`,
      metadata: {
        mission_id: mission.id,
        mission_type: mission.type,
        service: service,
        team: SERVICE_TO_TEAM[service],
        lien: `/direction/menu`
      },
      lue: false,
      archivee: false
    };

    notifications.push(notification);
  }

  // Envoi en batch
  try {
    await Promise.all(
      notifications.map(notif => base44.entities.Notification.create(notif))
    );
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Erreur envoi notifications mission:', error);
    return { success: false, error };
  }
}

/**
 * Envoie une notification de mise à jour de statut de mission
 */
export async function notifyMissionStatusChange(mission, newStatus, lang = 'fr') {
  if (!mission.services || mission.services.length === 0) {
    return;
  }

  const statusLabels = {
    'A_FAIRE': lang === 'fr' ? 'À faire' : 'To do',
    'EN_COURS': lang === 'fr' ? 'En cours' : 'In progress',
    'TERMINE': lang === 'fr' ? 'Terminée' : 'Completed'
  };

  const notifications = [];

  for (const service of mission.services) {
    const notification = {
      destinataire_type: SERVICE_TO_NOTIFICATION_TYPE[service] || 'collaborateur',
      type: 'mission_status_change',
      titre: lang === 'fr'
        ? `Mission ${mission.titre} : ${statusLabels[newStatus]}`
        : `Mission ${mission.titre}: ${statusLabels[newStatus]}`,
      message: lang === 'fr'
        ? `Le statut de la mission a changé : ${statusLabels[newStatus]}`
        : `Mission status changed: ${statusLabels[newStatus]}`,
      metadata: {
        mission_id: mission.id,
        mission_type: mission.type,
        service: service,
        old_status: mission.statut,
        new_status: newStatus,
        lien: `/direction/menu`
      },
      lue: false,
      archivee: false
    };

    notifications.push(notification);
  }

  try {
    await Promise.all(
      notifications.map(notif => base44.entities.Notification.create(notif))
    );
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Erreur envoi notifications statut mission:', error);
    return { success: false, error };
  }
}