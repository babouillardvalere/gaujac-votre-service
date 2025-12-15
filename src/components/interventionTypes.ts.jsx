export type ContexteIntervention = "ARRIVEE" | "SEJOUR" | "DEPART";
export type ServiceIntervention = "MENAGE" | "TECHNIQUE";
export type StatutGlobal = "OUVERTE" | "EN_COURS" | "EN_ATTENTE" | "TERMINEE";

export type TimelineType =
  | "DEMANDE_RECUE"
  | "PRISE_EN_CHARGE"
  | "ARRIVEE_SUR_SITE"
  | "EN_COURS"
  | "MISE_EN_ATTENTE"
  | "REPRISE"
  | "TERMINEE"
  | "DEPART_SERVICE";

export type AttenteRaison =
  | "attente_materiel"
  | "attente_fournisseur"
  | "client_absent"
  | "piece_specifique"
  | "second_technicien"
  | "autre";

export interface Intervention {
  id: string;
  sejour_id: string;
  date_arrivee: string;
  date_depart: string;
  client_nom: string;
  client_prenom: string;
  logement_numero: string;
  categorie_logement: string;
  contexte: ContexteIntervention;
  urgent: boolean;
  menage_statut: StatutGlobal;
  technique_statut: StatutGlobal;
  created_date: string;
  updated_date: string;
}

export interface InterventionEvent {
  id: string;
  intervention_id: string;
  service: ServiceIntervention;
  type: TimelineType;
  at: string;
  auteur: string;
  message: string;
  attente_raison?: AttenteRaison;
  attente_motif?: string;
  attente_delai?: string;
  photo_url?: string;
}