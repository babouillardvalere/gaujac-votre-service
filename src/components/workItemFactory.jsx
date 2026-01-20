/**
 * WorkItem Factory - Générateur d'interventions pour missions Direction
 * Règle : 1 zone sélectionnée = 1 WorkItem créé
 */

/**
 * Construit la description opérationnelle obligatoire
 */
export function buildDescriptionOperationnelle({ typeMission, zoneLabel, taches, descriptionDetaillee }) {
  const header = `${typeMission} - ${zoneLabel}`;
  const tasksText = (taches || []).map(t => `• ${t.texte}`).join('\n');
  const detail = descriptionDetaillee?.trim() ? `\n\nDétails:\n${descriptionDetaillee.trim()}` : '';
  const out = `${header}\n${tasksText}${detail}`.trim();
  return out.length ? out : null;
}

/**
 * Génère les WorkItems pour une mission Direction
 * @returns {ok: boolean, workItems?: array, error?: string}
 */
export function prepareWorkItemsForMission(form) {
  const {
    typeMission, // 'HIVERNAGE' | 'DESHIVERNAGE' | 'INTERVENTION'
    datePlanifiee, // ISO string or yyyy-mm-dd
    typeHebergement, // Type hébergement
    numerosHebergement, // array of string, multi select
    service, // 'TECHNIQUE' | 'MENAGE'
    priorite, // 'NORMALE' | 'URGENTE'
    taches, // array { numero, texte }
    description, // optional
  } = form;

  // Validations bloquantes QA
  if (!typeMission) return { ok: false, error: "Type de mission manquant" };
  if (!datePlanifiee) return { ok: false, error: "Date planifiée manquante" };
  if (!typeHebergement) return { ok: false, error: "Type d'hébergement manquant" };
  if (!Array.isArray(numerosHebergement) || numerosHebergement.length === 0) {
    return { ok: false, error: "Aucune zone sélectionnée pour générer les interventions" };
  }
  if (!service) return { ok: false, error: "Service assigné manquant" };
  if (!Array.isArray(taches) || taches.length === 0) {
    return { ok: false, error: "Ajoutez au moins une tâche pour cette mission" };
  }

  // Génération automatique : 1 WorkItem par zone
  const workItems = numerosHebergement.map(numero => {
    const zoneLabel = `${typeHebergement} ${numero}`;
    const description_operationnelle = buildDescriptionOperationnelle({
      typeMission,
      zoneLabel,
      taches,
      descriptionDetaillee: description
    });

    if (!description_operationnelle) {
      return null; // Filtre plus bas
    }

    return {
      type: 'MISSION_DIRECTION',
      service,
      statut: 'A_FAIRE',
      priorite: priorite || 'NORMALE',
      rank: 0,

      // Description unique obligatoire
      description_operationnelle,
      titre: `${typeMission} - ${numero}`,
      description: description || `${typeMission} - ${taches.length} tâche(s)`,

      // Zone cible
      hebergement: numero,
      type_hebergement: typeHebergement,

      // Contenu
      taches,

      // Métadonnées mission
      mission_direction_id: `direction_${typeMission}_${Date.now()}`,
      client_nom: 'Direction',
      client_prenom: typeMission,
      
      metadata: {
        type_mission: typeMission,
        date_planifiee: datePlanifiee,
        source: 'direction_workflow'
      }
    };
  }).filter(Boolean);

  if (workItems.length === 0) {
    return { ok: false, error: "Aucune intervention valide à créer" };
  }

  return { ok: true, workItems };
}