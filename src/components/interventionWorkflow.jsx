import { base44 } from "@/api/base44Client";

/**
 * Met à jour le statut d'une intervention
 * + crée automatiquement l'event client
 */
export async function updateInterventionStatus({
  interventionId,
  newStatus,
  messageClient,
  attenteRaison = null,
  delaiEstime = null,
  visibleClient = true
}) {
  // 1️⃣ Mise à jour intervention
  const intervention = await base44.entities.Intervention.update(interventionId, {
    statut: newStatus
  });

  // 2️⃣ Création event chronologique
  await base44.entities.InterventionEvent.create({
    intervention_id: interventionId,
    fiche_arrivee_id: intervention.fiche_arrivee_id,
    type: newStatus,
    message_client: messageClient,
    attente_raison: attenteRaison,
    delai_estime: delaiEstime,
    visible_client: visibleClient,
    at: new Date().toISOString()
  });

  return intervention;
}