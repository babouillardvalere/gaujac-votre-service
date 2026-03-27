/**
 * Utilitaires centralisés pour les WorkItems
 */

import { toUIStatus } from '@/components/workItemStatusMapping';
import { filterActive } from '@/components/interventionDeletion';

/**
 * Normalise un statut backend vers statut UI
 */
export function normalizeBackendStatus(statut) {
  return toUIStatus(statut);
}

/**
 * Récupère la meilleure description disponible pour un WorkItem/Incident
 * Priorité : description_operationnelle > description_probleme > description > tâches
 * @param {Object} item
 * @returns {string|null}
 */
export function getBestDescription(item) {
  if (!item) return null;
  if (item.description_operationnelle?.trim()) return item.description_operationnelle.trim();
  if (item.description_probleme?.trim()) return item.description_probleme.trim();
  if (item.description?.trim()) return item.description.trim();
  // Construire depuis tâches
  if (item.taches?.length > 0) {
    return item.taches.map((t, i) => `${i + 1}. ${t.texte || t.label || 'Tâche'}`).join('\n');
  }
  return null;
}

/**
 * Indique si un item a une description exploitable
 */
export function hasValidDescription(item) {
  return !!getBestDescription(item);
}

/**
 * Filtre les WorkItems visibles pour un service donné
 * @param {Array} workItems - liste déjà normalisée (statuts UI)
 * @param {string} service - 'MENAGE' | 'TECHNIQUE' | etc.
 * @param {string} statut - statut UI à filtrer, ou 'tous'
 * @param {string} searchTerm - recherche textuelle
 */
export function filterVisibleWorkItems(workItems, service, statut, searchTerm = '') {
  let items = filterActive(workItems).filter(wi => wi.statut !== 'ANNULEE');

  if (statut && statut !== 'tous') {
    items = items.filter(wi => wi.statut === statut);
  }

  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    items = items.filter(wi => {
      const logement = (wi.hebergement || wi.logement || wi.emplacement || '').toLowerCase();
      const client = `${wi.client_prenom || ''} ${wi.client_nom || ''}`.toLowerCase();
      return logement.includes(q) || client.includes(q);
    });
  }

  return items;
}