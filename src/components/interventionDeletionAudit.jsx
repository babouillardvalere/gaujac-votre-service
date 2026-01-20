/**
 * Audit logging pour suppressions en cascade
 * Trace complète de qui a supprimé quoi et quand
 */

import { base44 } from '@/api/base44Client';

/**
 * Logger une suppression cascade avec tous les détails
 */
export const logDeletionCascade = async (interventionId, deletedWorkItems, userId = 'SYSTEM') => {
  try {
    // Récupérer les détails de l'intervention supprimée
    const incidents = await base44.entities.Incident.filter({ id: interventionId });
    const incident = incidents?.[0];

    const auditLog = {
      action: 'DELETE_INTERVENTION_CASCADE',
      timestamp: new Date().toISOString(),
      userId,
      incident: {
        id: interventionId,
        type: incident?.type,
        categorie: incident?.categorie,
        client_nom: incident?.client_nom,
        client_prenom: incident?.client_prenom,
        logement: incident?.logement,
        emplacement: incident?.emplacement,
        statut: incident?.statut
      },
      cascade: {
        incidentsDeleted: 1,
        workItemsDeleted: deletedWorkItems.length,
        workItemIds: deletedWorkItems.map(wi => wi.id || wi)
      }
    };

    // Créer un enregistrement d'audit
    await base44.entities.InterventionLog.create({
      incident_id: interventionId,
      action: 'suppression_cascade',
      horodatage: new Date().toISOString(),
      utilisateur: userId,
      commentaire: `Suppression cascade: 1 incident + ${deletedWorkItems.length} WorkItems`,
      metadata: auditLog
    });

    console.log('📝 Audit log créé:', auditLog);
    return auditLog;
  } catch (error) {
    console.error('❌ Erreur audit logging:', error);
    // Ne pas lever, juste logger l'erreur
  }
};

/**
 * Récupérer l'historique des suppressions
 */
export const getSuppressionHistory = async (limit = 50) => {
  try {
    const logs = await base44.entities.InterventionLog.filter(
      { action: 'suppression_cascade' },
      '-horodatage',
      limit
    );
    
    return logs;
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    return [];
  }
};

/**
 * Compter les suppressions aujourd'hui
 */
export const getSuppressionCountToday = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const logs = await base44.entities.InterventionLog.filter(
      { action: 'suppression_cascade' },
      '-horodatage',
      1000
    );
    
    const todayLogs = logs.filter(log => {
      const logDate = new Date(log.horodatage);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });
    
    return {
      count: todayLogs.length,
      totalWorkItems: todayLogs.reduce((sum, log) => {
        // Essayer d'extraire du metadata ou commentaire
        return sum + (log.metadata?.cascade?.workItemsDeleted || 1);
      }, 0)
    };
  } catch (error) {
    console.error('❌ Erreur décompte:', error);
    return { count: 0, totalWorkItems: 0 };
  }
};