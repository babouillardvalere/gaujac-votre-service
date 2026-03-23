/**
 * 🔁 MAPPING CENTRALISÉ DES STATUTS WORKITEM
 *
 * ─────────────────────────────────────────────────────
 * Backend (BDD)      │  UI (affichage / filtres)
 * ─────────────────────────────────────────────────────
 * A_FAIRE            │  en_attente
 * EN_COURS           │  en_cours
 * EN_ATTENTE         │  en_attente_materiel
 * TERMINEE           │  resolu
 * ─────────────────────────────────────────────────────
 *
 * RÈGLE : ne jamais mélanger les deux espaces dans une même comparaison.
 * - groupByLogement / filtres UI → utiliser les statuts UI
 * - updateMutation / API calls   → utiliser les statuts backend
 */

/** Statuts backend → statuts UI */
export const BACKEND_TO_UI = {
  A_FAIRE:  'en_attente',
  EN_COURS: 'en_cours',
  EN_ATTENTE: 'en_attente_materiel',
  TERMINEE: 'resolu',
  ANNULEE:  'resolu'
};

/** Statuts UI → statuts backend */
export const UI_TO_BACKEND = {
  en_attente:          'A_FAIRE',
  en_cours:            'EN_COURS',
  en_attente_materiel: 'EN_ATTENTE',
  resolu:              'TERMINEE'
};

/** Priorité d'affichage (plus petit = plus prioritaire) */
export const UI_STATUS_PRIORITY = {
  en_attente:          0,
  en_cours:            1,
  en_attente_materiel: 2,
  resolu:              3
};

/**
 * Convertit un statut backend en statut UI.
 * Tolérant : si déjà en format UI, le retourne tel quel.
 */
export function toUIStatus(statut) {
  if (!statut) return 'en_attente';
  return BACKEND_TO_UI[statut] ?? statut;
}

/**
 * Convertit un statut UI en statut backend.
 * Tolérant : si déjà en format backend, le retourne tel quel.
 */
export function toBackendStatus(statut) {
  if (!statut) return 'A_FAIRE';
  return UI_TO_BACKEND[statut] ?? statut;
}