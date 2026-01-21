/**
 * 🔒 PROTECTION ANTI-LEGACY: Empêche la création d'Incidents pendant un contrôle inventaire
 * 
 * Ce module intercepte les créations d'Incidents pour s'assurer que SEULS les WorkItems
 * sont créés lors des contrôles d'inventaire.
 */

import { base44 } from '@/api/base44Client';

let isProtectionActive = false;

export function activateInventoryProtection() {
  if (isProtectionActive) return;
  isProtectionActive = true;

  const forbiddenDuringInventory = ['Incident'];

  for (const entityName of forbiddenDuringInventory) {
    const entityApi = base44.entities[entityName];
    if (!entityApi || !entityApi.create) continue;

    const originalCreate = entityApi.create.bind(entityApi);

    // Intercepter la création
    entityApi.create = async function (payload) {
      // Bloquer si origine = contrôle inventaire
      if (
        payload?.source === 'CONTROLE_INVENTAIRE' ||
        payload?.origine === 'arrivee' ||
        payload?.origine === 'INVENTAIRE_ARRIVEE' ||
        payload?.type_intervention === 'INVENTAIRE_ARRIVEE'
      ) {
        console.error(`🚨 PROTECTION ACTIVÉE: Tentative de création ${entityName} pendant contrôle inventaire`, payload);
        throw new Error(
          `INTERDIT: La création de ${entityName} est bloquée pendant un contrôle inventaire. Utilisez WorkItem uniquement.`
        );
      }

      // Sinon, appeler la méthode originale
      return originalCreate(payload);
    };

    console.log(`✅ Protection inventaire activée pour ${entityName}`);
  }
}

// Auto-activation au chargement du module
activateInventoryProtection();