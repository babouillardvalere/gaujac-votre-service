// Optimisations des requêtes pour éviter les ralentissements

export const QUERY_LIMITS = {
  INCIDENTS_ACTIFS: 50,  // Seulement les incidents actifs
  MISSIONS_ACTIVES: 30,
  ARCHIVES: 20
};

export const REFETCH_INTERVALS = {
  ACTIF: 45000,      // 45s pour les données actives
  ARCHIVE: 120000,   // 2min pour les archives
  STATS: 300000      // 5min pour les stats
};

export const buildIncidentQuery = (service, statut) => {
  const baseQuery = { type: service };
  
  // Ne charger que les non-résolus par défaut
  if (statut && statut !== 'tous') {
    baseQuery.statut = statut;
  } else {
    // Exclure les résolus de plus de 7 jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    // Note: Cette logique nécessiterait un filter côté serveur plus sophistiqué
  }
  
  return baseQuery;
};

export const optimizedIncidentFetch = async (service) => {
  // Charger seulement les incidents actifs récents
  const incidents = await base44.entities.Incident.filter(
    { 
      type: service,
      statut: { $in: ['en_attente', 'en_cours', 'en_attente_materiel'] }
    }, 
    '-date_saisie', 
    QUERY_LIMITS.INCIDENTS_ACTIFS
  );
  
  return incidents;
};