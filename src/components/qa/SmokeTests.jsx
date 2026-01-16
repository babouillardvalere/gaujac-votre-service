import { base44 } from '@/api/base44Client';
import errorLogger from './ErrorLogger';

// Smoke tests automatisés pour les parcours critiques
export class SmokeTests {
  constructor() {
    this.results = [];
    this.testData = {
      testInterventionIds: [],
      testWorkItemIds: [],
      testMissionIds: []
    };
  }

  async runAllTests() {
    this.results = [];
    console.log('🧪 Démarrage des smoke tests...');

    await this.testBureauWorkflow();
    await this.testTechniqueWorkflow();
    await this.testDirectionWorkflow();
    await this.testDataIntegrity();
    await this.testNotifications();

    await this.cleanup();

    return this.getReport();
  }

  // Enregistrement résultat test
  recordTest(name, passed, details = {}) {
    const result = {
      name,
      passed,
      timestamp: new Date().toISOString(),
      details
    };
    this.results.push(result);

    if (!passed) {
      errorLogger.log('error', 'smoke_test', `Test échoué: ${name}`, details);
    } else {
      errorLogger.logUserAction(`Test réussi: ${name}`, details);
    }

    return result;
  }

  // TEST 1: Bureau - Création intervention client
  async testBureauWorkflow() {
    console.log('📋 Test Bureau Workflow...');

    try {
      // Création intervention avec tâches
      const intervention = await base44.entities.InterventionClient.create({
        type_intervention: 'SIGNALEMENT_SEJOUR',
        type_hebergement: 'Test MH Premium',
        numero_hebergement: 'TEST-01',
        client_nom: 'Test',
        client_prenom: 'QA',
        date_arrivee: '2026-01-15',
        date_depart: '2026-01-20',
        service: 'TECHNIQUE',
        priorite: 'NORMALE',
        description: 'Test smoke intervention',
        taches: [
          { numero: 1, texte: 'Tâche test 1', faite: false },
          { numero: 2, texte: 'Tâche test 2', faite: false }
        ]
      });

      this.testData.testInterventionIds.push(intervention.id);

      // Vérif: intervention créée avec tâches
      this.recordTest(
        'Bureau: Création intervention avec tâches',
        intervention.taches?.length === 2,
        { interventionId: intervention.id, tachesCount: intervention.taches?.length }
      );

      // Vérif: WorkItems générés
      const workItems = await base44.entities.WorkItem.filter({
        intervention_client_id: intervention.id
      });

      this.recordTest(
        'Bureau: WorkItems générés automatiquement',
        workItems.length > 0,
        { workItemsCount: workItems.length }
      );

      this.testData.testWorkItemIds.push(...workItems.map(w => w.id));

    } catch (error) {
      this.recordTest('Bureau: Création intervention', false, { error: error.message });
    }
  }

  // TEST 2: Technique - Workflow complet
  async testTechniqueWorkflow() {
    console.log('🔧 Test Technique Workflow...');

    if (this.testData.testWorkItemIds.length === 0) {
      this.recordTest('Technique: Pré-requis manquants', false, { reason: 'Pas de WorkItem créé' });
      return;
    }

    try {
      const workItemId = this.testData.testWorkItemIds[0];
      let workItem = await base44.entities.WorkItem.filter({ id: workItemId });
      workItem = workItem[0];

      // Vérif: Tâches visibles
      this.recordTest(
        'Technique: Tâches visibles dans WorkItem',
        workItem.taches?.length > 0,
        { tachesCount: workItem.taches?.length }
      );

      // Vérif: Description présente
      this.recordTest(
        'Technique: Description présente',
        !!workItem.description || !!workItem.titre,
        { hasDescription: !!workItem.description, hasTitre: !!workItem.titre }
      );

      // Prise en charge
      await base44.entities.WorkItem.update(workItemId, {
        statut: 'EN_COURS',
        collaborateur: 'QA Test',
        date_prise_en_charge: new Date().toISOString()
      });

      workItem = (await base44.entities.WorkItem.filter({ id: workItemId }))[0];

      this.recordTest(
        'Technique: Prise en charge change statut',
        workItem.statut === 'EN_COURS',
        { statut: workItem.statut }
      );

      // Mise en attente
      await base44.entities.WorkItem.update(workItemId, {
        statut: 'EN_ATTENTE'
      });

      workItem = (await base44.entities.WorkItem.filter({ id: workItemId }))[0];

      this.recordTest(
        'Technique: Mise en attente fonctionne',
        workItem.statut === 'EN_ATTENTE',
        { statut: workItem.statut }
      );

    } catch (error) {
      this.recordTest('Technique: Workflow', false, { error: error.message });
    }
  }

  // TEST 3: Direction - Création intervention opérationnelle
  async testDirectionWorkflow() {
    console.log('👔 Test Direction Workflow...');

    try {
      const mission = await base44.entities.MissionDirection.create({
        type_mission: 'INTERVENTION',
        titre: 'Test QA Mission Direction',
        description: 'Test smoke mission',
        zones: [
          {
            type_zone: 'hebergement',
            numero: 'TEST-02',
            categorie: 'Test Premium'
          }
        ],
        statut: 'A_FAIRE',
        priorite: 'NORMALE',
        mission_direction: true
      });

      this.testData.testMissionIds.push(mission.id);

      this.recordTest(
        'Direction: Création mission opérationnelle',
        !!mission.id && mission.mission_direction === true,
        { missionId: mission.id }
      );

      // Vérif: Champs obligatoires présents
      this.recordTest(
        'Direction: Zones définies',
        mission.zones?.length > 0,
        { zonesCount: mission.zones?.length }
      );

    } catch (error) {
      this.recordTest('Direction: Création mission', false, { error: error.message });
    }
  }

  // TEST 4: Intégrité des données
  async testDataIntegrity() {
    console.log('🛡️ Test Intégrité données...');

    try {
      // Vérif: Interventions sans tâches
      const interventionsSansTaches = await base44.entities.InterventionClient.filter({});
      const sansTaches = interventionsSansTaches.filter(i => !i.taches || i.taches.length === 0);

      this.recordTest(
        'Data: Aucune intervention sans tâches',
        sansTaches.length === 0,
        { interventionsSansTaches: sansTaches.length }
      );

      // Vérif: WorkItems orphelins
      const workItems = await base44.entities.WorkItem.filter({});
      const orphelins = workItems.filter(w => 
        !w.intervention_client_id && !w.mission_direction_id && !w.incident_id
      );

      this.recordTest(
        'Data: Aucun WorkItem orphelin',
        orphelins.length === 0,
        { workItemsOrphelins: orphelins.length }
      );

    } catch (error) {
      this.recordTest('Data: Intégrité', false, { error: error.message });
    }
  }

  // TEST 5: Notifications
  async testNotifications() {
    console.log('🔔 Test Notifications...');

    try {
      const notif = await base44.entities.Notification.create({
        type: 'NOUVEAU_INCIDENT',
        titre: 'Test QA Notification',
        message: 'Message de test smoke',
        destinataire_role: 'RECEPTION',
        statut: 'non_lu',
        priorite: 'NORMALE'
      });

      this.recordTest(
        'Notifications: Création réussie',
        !!notif.id,
        { notificationId: notif.id }
      );

      // Cleanup notif test
      await base44.entities.Notification.delete(notif.id);

    } catch (error) {
      this.recordTest('Notifications: Création', false, { error: error.message });
    }
  }

  // Nettoyage données test
  async cleanup() {
    console.log('🧹 Nettoyage données test...');

    try {
      // Suppression WorkItems test
      for (const id of this.testData.testWorkItemIds) {
        try {
          await base44.entities.WorkItem.delete(id);
        } catch (e) {
          console.warn('Impossible de supprimer WorkItem:', id);
        }
      }

      // Suppression Interventions test
      for (const id of this.testData.testInterventionIds) {
        try {
          await base44.entities.InterventionClient.delete(id);
        } catch (e) {
          console.warn('Impossible de supprimer Intervention:', id);
        }
      }

      // Suppression Missions test
      for (const id of this.testData.testMissionIds) {
        try {
          await base44.entities.MissionDirection.delete(id);
        } catch (e) {
          console.warn('Impossible de supprimer Mission:', id);
        }
      }

    } catch (error) {
      console.error('Erreur cleanup:', error);
    }
  }

  // Génération rapport
  getReport() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    return {
      summary: {
        total,
        passed,
        failed,
        passRate: `${passRate}%`,
        timestamp: new Date().toISOString()
      },
      tests: this.results,
      criticalFailures: this.results.filter(r => !r.passed && r.name.includes('Création'))
    };
  }
}

export default new SmokeTests();