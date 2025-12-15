import { base44 } from "@/api/base44Client";
import type {
  Intervention,
  InterventionEvent,
  ServiceIntervention,
  TimelineType,
  AttenteRaison
} from "./interventionTypes";

export async function searchInterventionsBySejour(params: {
  sejourId: string;
  clientNom?: string;
  clientPrenom?: string;
  dateArrivee?: string;
  dateDepart?: string;
}) {
  const filter: any = { sejour_id: params.sejourId };

  if (params.clientNom) filter.client_nom = params.clientNom;
  if (params.clientPrenom) filter.client_prenom = params.clientPrenom;
  if (params.dateArrivee) filter.date_arrivee = params.dateArrivee;
  if (params.dateDepart) filter.date_depart = params.dateDepart;

  return await base44.entities.Intervention.filter(filter, "-created_date", 100);
}

export async function getIntervention(interventionId: string) {
  const interventions = await base44.entities.Intervention.list();
  return interventions.find((i: any) => i.id === interventionId);
}

export async function listEvents(interventionId: string, service: ServiceIntervention) {
  const allEvents = await base44.entities.InterventionEvent.list();
  return allEvents.filter((e: any) => 
    e.intervention_id === interventionId && e.service === service
  ).sort((a: any, b: any) => (a.at || "").localeCompare(b.at || ""));
}

export async function addEvent(input: {
  interventionId: string;
  service: ServiceIntervention;
  type: TimelineType;
  auteur: string;
  message: string;
  attente?: {
    raison: AttenteRaison;
    motif: string;
    delai: string;
  };
  photoUrl?: string;
}) {
  const payload: any = {
    intervention_id: input.interventionId,
    service: input.service,
    type: input.type,
    at: new Date().toISOString(),
    auteur: input.auteur,
    message: input.message,
    photo_url: input.photoUrl
  };

  if (input.type === "MISE_EN_ATTENTE" && input.attente) {
    payload.attente_raison = input.attente.raison;
    payload.attente_motif = input.attente.motif;
    payload.attente_delai = input.attente.delai;
  }

  const ev = await base44.entities.InterventionEvent.create(payload);

  await updateServiceStatusFromEvent(input.interventionId, input.service, input.type);

  await createNotification({
    interventionId: input.interventionId,
    service: input.service,
    type: input.type,
    message: input.message
  });

  return ev;
}

async function updateServiceStatusFromEvent(
  interventionId: string, 
  service: ServiceIntervention, 
  type: TimelineType
) {
  const patch: any = { updated_date: new Date().toISOString() };

  const toStatut = (t: TimelineType) => {
    if (t === "TERMINEE" || t === "DEPART_SERVICE") return "TERMINEE";
    if (t === "MISE_EN_ATTENTE") return "EN_ATTENTE";
    if (t === "DEMANDE_RECUE") return "OUVERTE";
    return "EN_COURS";
  };

  const statut = toStatut(type);

  if (service === "MENAGE") patch.menage_statut = statut;
  if (service === "TECHNIQUE") patch.technique_statut = statut;

  await base44.entities.Intervention.update(interventionId, patch);
}

async function createNotification(input: {
  interventionId: string;
  service: ServiceIntervention;
  type: TimelineType;
  message: string;
}) {
  try {
    await base44.entities.Notification.create({
      intervention_id: input.interventionId,
      service: input.service,
      type: input.type,
      message: input.message,
      created_date: new Date().toISOString(),
      lu: false
    });
  } catch {
    // Si l'entité n'existe pas, ne bloque pas le flux
  }
}