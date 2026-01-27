import { base44 } from '@/api/base44Client';

/**
 * Diagnostic complet - retourne les données RÉELLES pour affichage UI
 */
export async function runDiagnosisCheck() {
  try {
    // 1. Récupérer les missions affichées
    const missions = await base44.entities.MissionDirection.filter(
      { type_mission: 'DESHIVERNAGE' },
      '-created_date',
      200
    );

    // 2. Pour CHAQUE mission, récupérer ses WorkItems EXACTS
    const missionDetails = [];
    
    for (const mission of missions) {
      const relatedWI = await base44.entities.WorkItem.filter(
        { mission_direction_id: mission.id },
        '-created_date',
        100
      );

      missionDetails.push({
        mission: {
          id: mission.id,
          hebergement: mission.zones?.[0]?.numero || 'N/A',
          statut: mission.statut,
          type: mission.type_mission,
          has_blocking: mission.has_blocking,
          motif_attente: mission.motif_attente
        },
        workitems: relatedWI.map(wi => ({
          id: wi.id,
          service: wi.service,
          statut: wi.statut,
          collaborateur: wi.collaborateur
        })),
        problemDetected: relatedWI.length === 0 || !relatedWI.some(wi => wi.statut === mission.statut)
      });
    }

    // 3. Analyser les problèmes
    const problems = missionDetails.filter(m => m.problemDetected);
    
    return {
      success: true,
      totalMissions: missions.length,
      problemMissions: problems.length,
      details: missionDetails,
      problems: problems
    };

  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    return {
      success: false,
      error: error.message
    };
  }
}