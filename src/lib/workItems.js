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