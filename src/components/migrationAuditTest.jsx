/**
 * Script de migration : marquer les interventions existantes comme réelles
 * 
 * À exécuter UNE FOIS pour retrouver compatibilité historique
 * Tous les Incident/WorkItem existants = INTERVENTION_REELLE (par défaut)
 */

import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export const runMigrationAuditTestFlag = async () => {
  console.log('🔄 Démarrage migration flag is_audit_ou_test...');
  
  try {
    // 1️⃣ Migrer les Incidents
    const incidents = await base44.entities.Incident.list('-created_date', 1000);
    let migratedIncidents = 0;

    for (const incident of incidents) {
      if (incident.is_audit_ou_test === undefined || incident.type_source === undefined) {
        await base44.entities.Incident.update(incident.id, {
          is_audit_ou_test: false,
          type_source: 'INTERVENTION_REELLE'
        });
        migratedIncidents++;
      }
    }

    console.log(`✅ ${migratedIncidents} Incidents migrés`);

    // 2️⃣ Migrer les WorkItems
    const workItems = await base44.entities.WorkItem.list('-created_date', 1000);
    let migratedWorkItems = 0;

    for (const wi of workItems) {
      if (wi.is_audit_ou_test === undefined || wi.type_source === undefined) {
        await base44.entities.WorkItem.update(wi.id, {
          is_audit_ou_test: false,
          type_source: 'INTERVENTION_REELLE'
        });
        migratedWorkItems++;
      }
    }

    console.log(`✅ ${migratedWorkItems} WorkItems migrés`);
    toast.success(`Migration complétée: ${migratedIncidents + migratedWorkItems} éléments`);

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    toast.error('Erreur lors de la migration');
  }
};

/**
 * Marquer une intervention comme audit/test
 */
export const markAsAudit = async (incidentId) => {
  await base44.entities.Incident.update(incidentId, {
    is_audit_ou_test: true,
    type_source: 'AUDIT'
  });
  toast.success('Marqué comme audit');
};

/**
 * Marquer une intervention comme test
 */
export const markAsTest = async (incidentId) => {
  await base44.entities.Incident.update(incidentId, {
    is_audit_ou_test: true,
    type_source: 'TEST'
  });
  toast.success('Marqué comme test');
};