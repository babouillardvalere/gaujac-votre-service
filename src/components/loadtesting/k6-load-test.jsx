/**
 * 🔥 K6 LOAD TEST SCRIPT - CAMPING PARADIS
 * 
 * Simule 500 utilisateurs simultanés avec scénarios réalistes
 * 
 * INSTALLATION:
 * $ brew install k6        (macOS)
 * $ choco install k6       (Windows)
 * $ sudo apt install k6    (Linux)
 * 
 * EXÉCUTION:
 * $ k6 run k6-load-test.js --out json=results.json
 * 
 * IMPORTANT: Remplacer BASE_URL par l'URL de votre environnement de test
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ====== CONFIGURATION ======
const BASE_URL = 'https://your-preproduction-env.base44.app';

// Métriques custom
const errorRate = new Rate('errors');
const pdfGenerationTime = new Trend('pdf_generation_time');
const inventaireLoadTime = new Trend('inventaire_load_time');
const notificationDelay = new Trend('notification_delay');
const failedRequests = new Counter('failed_requests');

// ====== OPTIONS DE TEST ======
export const options = {
  stages: [
    // Phase 1: Rampe douce (0-5 min)
    { duration: '5m', target: 100 },
    
    // Phase 2: Montée en charge (5-15 min)
    { duration: '10m', target: 300 },
    
    // Phase 3: Pic (15-25 min)
    { duration: '10m', target: 500 },
    
    // Phase 4: Maintien stress (25-85 min)
    { duration: '60m', target: 500 },
    
    // Phase 5: Descente (85-95 min)
    { duration: '10m', target: 0 }
  ],
  
  thresholds: {
    // 95% des requêtes < 2s
    http_req_duration: ['p(95)<2000'],
    
    // 99% des requêtes < 5s
    'http_req_duration{type:critical}': ['p(99)<5000'],
    
    // Taux d'erreur < 1%
    'errors': ['rate<0.01'],
    
    // Génération PDF < 10s dans 95% des cas
    'pdf_generation_time': ['p(95)<10000'],
    
    // Temps de chargement inventaire < 1.5s
    'inventaire_load_time': ['p(95)<1500']
  },
  
  // Répartition des scénarios (proportions réalistes)
  scenarios: {
    client_signalement: {
      executor: 'ramping-vus',
      exec: 'clientSignalement',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 35 },  // 35% de 100
        { duration: '10m', target: 105 }, // 35% de 300
        { duration: '10m', target: 175 }, // 35% de 500
        { duration: '60m', target: 175 },
        { duration: '10m', target: 0 }
      ]
    },
    
    client_inventaire_arrivee: {
      executor: 'ramping-vus',
      exec: 'clientInventaireArrivee',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 25 },  // 25% de 100
        { duration: '10m', target: 75 }, // 25% de 300
        { duration: '10m', target: 125 }, // 25% de 500
        { duration: '60m', target: 125 },
        { duration: '10m', target: 0 }
      ]
    },
    
    collab_interventions: {
      executor: 'ramping-vus',
      exec: 'collabInterventions',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 12 },  // 40% de 30 collabs
        { duration: '10m', target: 36 }, // 40% de 90 collabs
        { duration: '10m', target: 60 }, // 40% de 150 collabs
        { duration: '60m', target: 60 },
        { duration: '10m', target: 0 }
      ]
    },
    
    reception_fiches: {
      executor: 'ramping-vus',
      exec: 'receptionFiches',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 10 },
        { duration: '10m', target: 31 },
        { duration: '10m', target: 52 },
        { duration: '60m', target: 52 },
        { duration: '10m', target: 0 }
      ]
    },
    
    bureau_stats: {
      executor: 'ramping-vus',
      exec: 'bureauStats',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 5 },
        { duration: '10m', target: 15 },
        { duration: '10m', target: 25 },
        { duration: '60m', target: 25 },
        { duration: '10m', target: 0 }
      ]
    }
  }
};

// ====== DONNÉES DE TEST ======
const categoriesLogement = [
  'Chalet Eco', 'Mobil-home Classique', 'Premium 2ch', 'Premium 3ch'
];

const numerosLogement = Array.from({length: 100}, (_, i) => `MH${String(i+1).padStart(3, '0')}`);

const nomsFamille = [
  'Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas',
  'Robert', 'Richard', 'Petit', 'Durand', 'Leroy'
];

const prenoms = [
  'Jean', 'Marie', 'Pierre', 'Sophie', 'Paul',
  'Julie', 'Luc', 'Anne', 'Marc', 'Claire'
];

const categoriesIncident = [
  'gaz', 'eau', 'electricite', 'plomberie', 'literie',
  'nettoyage', 'vaisselle', 'mobilier'
];

// ====== FONCTIONS UTILITAIRES ======
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString().split('T')[0];
}

function simulateThinkTime(min, max) {
  sleep(min + Math.random() * (max - min));
}

// ====== SCÉNARIOS ======

/**
 * SCÉNARIO 1: Client - Signalement d'incident
 */
export function clientSignalement() {
  group('Client Signalement', function() {
    const nom = randomItem(nomsFamille);
    const prenom = randomItem(prenoms);
    const logement = randomItem(numerosLogement);
    const categorie = randomItem(categoriesIncident);
    
    // 1. Chargement page signalement
    let res = http.get(`${BASE_URL}/pages/SignalementClient`);
    check(res, {
      'Signalement page loads': (r) => r.status === 200,
      'Signalement page fast': (r) => r.timings.duration < 2000
    });
    errorRate.add(res.status !== 200);
    
    simulateThinkTime(3, 8); // Remplissage formulaire
    
    // 2. Création incident
    const incident = {
      type: Math.random() > 0.7 ? 'technique' : 'menage',
      categorie: categorie,
      description: `Problème ${categorie} dans ${logement}`,
      urgent: Math.random() > 0.8, // 20% urgents
      client_nom: nom,
      client_prenom: prenom,
      logement: logement,
      date_saisie: new Date().toISOString(),
      statut: 'en_attente',
      autorisation_acces: Math.random() > 0.3 ? 'oui' : 'non'
    };
    
    res = http.post(
      `${BASE_URL}/entities/Incident`,
      JSON.stringify(incident),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(res, {
      'Incident created': (r) => r.status === 201 || r.status === 200,
      'Incident creation fast': (r) => r.timings.duration < 1500
    });
    errorRate.add(res.status >= 400);
    
    if (res.status >= 400) {
      failedRequests.add(1);
    }
    
    simulateThinkTime(2, 5);
  });
}

/**
 * SCÉNARIO 2: Client - Inventaire arrivée complet
 */
export function clientInventaireArrivee() {
  group('Client Inventaire Arrivée', function() {
    const nom = randomItem(nomsFamille);
    const prenom = randomItem(prenoms);
    const categorie = randomItem(categoriesLogement);
    const numero = randomItem(numerosLogement);
    
    // 1. Création dossier arrivée
    const dossier = {
      code_dossier: `ARR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      client_nom: nom,
      client_prenom: prenom,
      date_arrivee: randomDate(new Date(), new Date(Date.now() + 7*24*60*60*1000)),
      date_depart: randomDate(new Date(Date.now() + 7*24*60*60*1000), new Date(Date.now() + 14*24*60*60*1000)),
      type_logement: 'mobilhome',
      categorie_logement: categorie,
      numero_logement: numero,
      etape_actuelle: 3
    };
    
    let res = http.post(
      `${BASE_URL}/entities/DossierArrivee`,
      JSON.stringify(dossier),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(res, { 'Dossier created': (r) => r.status === 201 || r.status === 200 });
    errorRate.add(res.status >= 400);
    
    simulateThinkTime(2, 5);
    
    // 2. Chargement inventaire (simulation - le plus lourd)
    const startInventaire = Date.now();
    res = http.get(`${BASE_URL}/components/inventaireCategories?categorie=${categorie}`);
    const inventaireTime = Date.now() - startInventaire;
    inventaireLoadTime.add(inventaireTime);
    
    check(res, {
      'Inventaire loads': (r) => r.status === 200,
      'Inventaire fast': (r) => r.timings.duration < 1500
    });
    
    simulateThinkTime(15, 30); // Contrôle visuel des objets
    
    // 3. Validation inventaire
    const inventaire = {
      numero_locatif: numero,
      categorie_locatif: categorie,
      client_nom: nom,
      client_prenom: prenom,
      objets_valides: Array.from({length: 45}, (_, i) => `objet_${i}`), // 45 objets OK
      objets_manquants: Math.random() > 0.7 ? [{ objet: 'Torchon', commentaire: 'Manquant' }] : [],
      evaluation_proprete: Math.random() > 0.9 ? 'pas_satisfaisant' : 'tres_propre',
      date_validation: new Date().toISOString()
    };
    
    res = http.post(
      `${BASE_URL}/entities/ControleInventaireArrivee`,
      JSON.stringify(inventaire),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(res, { 'Inventaire validated': (r) => r.status === 201 || r.status === 200 });
    errorRate.add(res.status >= 400);
    
    simulateThinkTime(2, 4);
  });
}

/**
 * SCÉNARIO 3: Collaborateur - Gestion interventions
 */
export function collabInterventions() {
  group('Collaborateur Interventions', function() {
    // 1. Liste interventions en attente
    let res = http.get(`${BASE_URL}/entities/Incident?statut=en_attente&_limit=30&_sort=-date_saisie`);
    
    check(res, {
      'Interventions list loads': (r) => r.status === 200,
      'Interventions list fast': (r) => r.timings.duration < 1500
    });
    errorRate.add(res.status !== 200);
    
    simulateThinkTime(5, 10);
    
    // 2. Prise en charge d'une intervention aléatoire
    if (res.status === 200 && res.json().length > 0) {
      const incidents = res.json();
      const incident = randomItem(incidents);
      
      // Mettre en cours
      res = http.patch(
        `${BASE_URL}/entities/Incident/${incident.id}`,
        JSON.stringify({
          statut: 'en_cours',
          date_debut: new Date().toISOString(),
          pris_par: randomItem(prenoms)
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      check(res, { 'Intervention taken': (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
      
      simulateThinkTime(15, 30); // Durée intervention
      
      // Résoudre
      res = http.patch(
        `${BASE_URL}/entities/Incident/${incident.id}`,
        JSON.stringify({
          statut: 'resolu',
          date_resolution: new Date().toISOString()
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      check(res, { 'Intervention resolved': (r) => r.status === 200 });
      errorRate.add(res.status !== 200);
    }
    
    simulateThinkTime(3, 7);
  });
}

/**
 * SCÉNARIO 4: Réception - Traitement fiches
 */
export function receptionFiches() {
  group('Réception Fiches', function() {
    // 1. Liste fiches arrivée
    let res = http.get(`${BASE_URL}/entities/FicheArrivee?_limit=30&_sort=-date_validation`);
    
    check(res, {
      'Fiches list loads': (r) => r.status === 200,
      'Fiches list fast': (r) => r.timings.duration < 1500
    });
    errorRate.add(res.status !== 200);
    
    simulateThinkTime(10, 20);
    
    // 2. Génération PDF (simulation - opération lourde)
    if (res.status === 200 && res.json().length > 0) {
      const fiches = res.json();
      const fiche = randomItem(fiches);
      
      const startPDF = Date.now();
      res = http.post(
        `${BASE_URL}/pdf/generateArrivee`,
        JSON.stringify({ fiche_id: fiche.id }),
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: '30s' // PDF peut prendre du temps
        }
      );
      const pdfTime = Date.now() - startPDF;
      pdfGenerationTime.add(pdfTime);
      
      check(res, {
        'PDF generated': (r) => r.status === 200 || r.status === 201,
        'PDF generation acceptable': (r) => r.timings.duration < 10000
      });
      errorRate.add(res.status >= 400);
      
      if (res.status >= 400) {
        failedRequests.add(1);
      }
    }
    
    simulateThinkTime(5, 10);
  });
}

/**
 * SCÉNARIO 5: Bureau - Statistiques & rapports
 */
export function bureauStats() {
  group('Bureau Statistiques', function() {
    // 1. Dashboard avec agrégations
    let res = http.get(`${BASE_URL}/pages/Bureau`);
    
    check(res, {
      'Bureau page loads': (r) => r.status === 200,
      'Bureau page acceptable': (r) => r.timings.duration < 3000
    });
    errorRate.add(res.status !== 200);
    
    simulateThinkTime(10, 20);
    
    // 2. Statistiques interventions (requête lourde)
    res = http.get(`${BASE_URL}/entities/Incident?_limit=500&_sort=-date_saisie`);
    
    check(res, {
      'Stats data loads': (r) => r.status === 200,
      'Stats query fast': (r) => r.timings.duration < 2500
    });
    errorRate.add(res.status !== 200);
    
    simulateThinkTime(15, 30);
    
    // 3. Génération rapport PDF (lourd)
    const startRapport = Date.now();
    res = http.post(
      `${BASE_URL}/pdf/generateRapport`,
      JSON.stringify({
        type: 'hebdomadaire',
        date_debut: randomDate(new Date(Date.now() - 7*24*60*60*1000), new Date()),
        date_fin: new Date().toISOString().split('T')[0]
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: '45s'
      }
    );
    const rapportTime = Date.now() - startRapport;
    pdfGenerationTime.add(rapportTime);
    
    check(res, {
      'Rapport generated': (r) => r.status === 200 || r.status === 201,
      'Rapport generation acceptable': (r) => r.timings.duration < 15000
    });
    errorRate.add(res.status >= 400);
    
    simulateThinkTime(20, 40);
  });
}

/**
 * Fonction teardown - affiche un résumé
 */
export function handleSummary(data) {
  console.log('===== RÉSUMÉ DU TEST DE CHARGE =====');
  console.log(`Requêtes totales: ${data.metrics.http_reqs.values.count}`);
  console.log(`Requêtes échouées: ${data.metrics.failed_requests?.values.count || 0}`);
  console.log(`Taux d'erreur: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%`);
  console.log(`Temps réponse médian: ${data.metrics.http_req_duration.values.med.toFixed(0)}ms`);
  console.log(`Temps réponse P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms`);
  console.log(`Temps réponse P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(0)}ms`);
  
  if (data.metrics.pdf_generation_time) {
    console.log(`\nGénération PDF moyenne: ${data.metrics.pdf_generation_time.values.avg.toFixed(0)}ms`);
    console.log(`Génération PDF P95: ${data.metrics.pdf_generation_time.values['p(95)'].toFixed(0)}ms`);
  }
  
  if (data.metrics.inventaire_load_time) {
    console.log(`\nChargement inventaire moyen: ${data.metrics.inventaire_load_time.values.avg.toFixed(0)}ms`);
  }
  
  return {
    'summary.json': JSON.stringify(data, null, 2),
  };
}