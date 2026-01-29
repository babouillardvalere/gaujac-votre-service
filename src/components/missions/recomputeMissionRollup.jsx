import { base44 } from '@/api/base44Client';

/**
 * ⭐ RECALCUL AUTOMATIQUE DES ROLLUPS
 * Appelé automatiquement après chaque modification de WorkItem
 */
export async function recomputeMissionRollup(missionId) {
  if (!missionId) return;

  const workItems = await base44.entities.WorkItem.filter({
    mission_direction_id: missionId
  }, '-created_date', 100);

  if (!workItems || workItems.length === 0) {
    // Cas bord : aucune tâche → mission terminée
    await base44.entities.MissionDirection.update(missionId, {
      status_rollup: 'TERMINEE',
      services_rollup: []
    });
    return;
  }

  const servicesSet = new Set();
  let nbEnAttente = 0;
  let nbEnCours = 0;
  let nbAFaire = 0;

  for (const wi of workItems) {
    if (wi.service) servicesSet.add(wi.service);

    switch (wi.statut) {
      case 'EN_ATTENTE':
        nbEnAttente++;
        break;
      case 'EN_COURS':
        nbEnCours++;
        break;
      case 'A_FAIRE':
        nbAFaire++;
        break;
    }
  }

  // ✅ PRIORITÉ MÉTIER CORRECTE (EN_ATTENTE > EN_COURS > A_FAIRE > TERMINEE)
  let status_rollup;
  if (nbEnAttente > 0) status_rollup = 'EN_ATTENTE';
  else if (nbEnCours > 0) status_rollup = 'EN_COURS';
  else if (nbAFaire > 0) status_rollup = 'A_FAIRE';
  else status_rollup = 'TERMINEE';

  await base44.entities.MissionDirection.update(missionId, {
    status_rollup,
    services_rollup: Array.from(servicesSet)
  });
}