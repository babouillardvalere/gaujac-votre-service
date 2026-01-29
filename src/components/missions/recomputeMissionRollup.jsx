import { base44 } from '@/api/base44Client';

/**
 * ⭐ RECALCUL AUTOMATIQUE DES ROLLUPS
 * Appelé automatiquement après chaque modification de WorkItem
 */
export async function recomputeMissionRollup(missionId) {
  if (!missionId) return;

  const workItems = await base44.entities.WorkItem.filter({
    mission_direction_id: missionId
  });

  if (!workItems || workItems.length === 0) {
    // Cas bord : aucune tâche → mission terminée
    await base44.entities.MissionDirection.update(missionId, {
      status_rollup: 'TERMINEE',
      services_rollup: []
    });
    return;
  }

  const servicesSet = new Set();
  let hasAttente = false;
  let hasEnCours = false;
  let hasAFaire = false;

  for (const wi of workItems) {
    if (wi.service) servicesSet.add(wi.service);

    switch (wi.statut) {
      case 'EN_ATTENTE':
        hasAttente = true;
        break;
      case 'EN_COURS':
        hasEnCours = true;
        break;
      case 'A_FAIRE':
        hasAFaire = true;
        break;
    }
  }

  // ✅ PRIORITÉ MÉTIER CORRECTE (EN_ATTENTE > EN_COURS)
  let status_rollup = 'TERMINEE';
  if (hasAttente) status_rollup = 'EN_ATTENTE';
  else if (hasEnCours) status_rollup = 'EN_COURS';
  else if (hasAFaire) status_rollup = 'A_FAIRE';

  await base44.entities.MissionDirection.update(missionId, {
    status_rollup,
    services_rollup: Array.from(servicesSet)
  });
}