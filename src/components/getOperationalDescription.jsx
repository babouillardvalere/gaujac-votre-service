// Fonction utilitaire pour récupérer la description opérationnelle d'une intervention
// Consolide tâches et description pour garantir un descriptif exploitable

export const getOperationalDescription = (incident) => {
  // Priorité 1 : Tâches (format structuré)
  if (incident.taches && incident.taches.length > 0) {
    return incident.taches
      .map((t, idx) => `${idx + 1}. ${t.texte || t.label || 'Tâche sans description'}`)
      .join('\n');
  }
  
  // Priorité 2 : Description textuelle
  if (incident.description && incident.description.trim()) {
    return incident.description;
  }
  
  // Priorité 3 : Titre (WorkItem)
  if (incident.titre && incident.titre.trim() && incident.titre !== 'Intervention à traiter') {
    return incident.titre;
  }
  
  // Aucun descriptif opérationnel
  return null;
};

// Validation CRITICAL : une intervention DOIT avoir un descriptif opérationnel
export const validateOperationalDescription = (incident) => {
  const desc = getOperationalDescription(incident);
  
  if (!desc) {
    return {
      valid: false,
      error: '🚨 VALIDATION BLOQUANTE: Une intervention doit avoir un descriptif opérationnel (tâches OU description)',
      severity: 'CRITICAL'
    };
  }
  
  return { valid: true };
};