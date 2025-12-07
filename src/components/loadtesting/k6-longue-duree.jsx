/**
 * ⏱️ K6 TEST LONGUE DURÉE - 2-6 HEURES
 * 
 * Détecte fuites mémoire, dégradations progressives, instabilités
 * 
 * EXÉCUTION:
 * $ k6 run --duration 6h k6-longue-duree.js --out json=results-6h.json
 * 
 * MONITORING PARALLÈLE (important):
 * - Surveiller mémoire serveur: htop, free -m
 * - Surveiller CPU: top, mpstat
 * - Logs BDD: connexions actives, requêtes lentes
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const BASE_URL = 'https://your-preproduction-env.base44.app';

// Métriques custom
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const memoryUsage = Gauge('memory_usage_mb');
const activeConnections = Gauge('active_connections');
const failedRequests = new Counter('failed_requests');

export const options = {
  // 200 utilisateurs constants pendant 6 heures
  stages: [
    { duration: '10m', target: 200 },  // Montée progressive
    { duration: '6h', target: 200 },   // Maintien 6h
    { duration: '10m', target: 0 }     // Descente
  ],
  
  thresholds: {
    // Temps réponse doit rester stable
    'response_time': ['p(95)<2000', 'p(99)<5000'],
    
    // Taux erreur constant < 1%
    'errors': ['rate<0.01'],
    
    // Pas d'augmentation progressive erreurs
    'failed_requests': ['count<100']
  }
};

// Scénarios utilisateur réalistes
const scenarios = [
  { name: 'client_suivi', weight: 40 },
  { name: 'collab_interventions', weight: 30 },
  { name: 'reception_fiches', weight: 20 },
  { name: 'bureau_stats', weight: 10 }
];

function randomScenario() {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (rand < cumulative) return scenario.name;
  }
  return scenarios[0].name;
}

export default function() {
  const scenario = randomScenario();
  
  switch(scenario) {
    case 'client_suivi':
      clientSuivi();
      break;
    case 'collab_interventions':
      collabInterventions();
      break;
    case 'reception_fiches':
      receptionFiches();
      break;
    case 'bureau_stats':
      bureauStats();
      break;
  }
}

/**
 * Scénario 1: Client consulte suivi
 */
function clientSuivi() {
  const start = performance.now();
  
  const res = http.get(`${BASE_URL}/entities/Incident?logement=MH042&statut=en_attente`);
  
  const duration = performance.now() - start;
  responseTime.add(duration);
  
  check(res, {
    'Suivi loads': (r) => r.status === 200,
    'Suivi fast': (r) => r.timings.duration < 2000
  });
  
  errorRate.add(res.status !== 200);
  if (res.status >= 400) failedRequests.add(1);
  
  sleep(Math.random() * 10 + 5); // 5-15s think time
}

/**
 * Scénario 2: Collaborateur gère interventions
 */
function collabInterventions() {
  const start = performance.now();
  
  let res = http.get(`${BASE_URL}/entities/Incident?statut=en_attente&_limit=30`);
  
  responseTime.add(performance.now() - start);
  
  check(res, { 'Interventions list': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  
  sleep(Math.random() * 20 + 10); // 10-30s
  
  // Mettre à jour une intervention
  if (res.status === 200 && res.json().length > 0) {
    const incident = res.json()[0];
    res = http.patch(
      `${BASE_URL}/entities/Incident/${incident.id}`,
      JSON.stringify({ statut: 'en_cours' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    check(res, { 'Update intervention': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  }
  
  sleep(Math.random() * 15 + 5);
}

/**
 * Scénario 3: Réception traite fiches
 */
function receptionFiches() {
  const start = performance.now();
  
  const res = http.get(`${BASE_URL}/entities/FicheArrivee?_limit=30&_sort=-date_validation`);
  
  responseTime.add(performance.now() - start);
  
  check(res, { 'Fiches list': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  
  sleep(Math.random() * 30 + 15); // 15-45s
}

/**
 * Scénario 4: Bureau consulte stats
 */
function bureauStats() {
  const start = performance.now();
  
  const res = http.get(`${BASE_URL}/entities/Incident?_limit=200&_sort=-date_saisie`);
  
  responseTime.add(performance.now() - start);
  
  check(res, { 'Stats data': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  
  sleep(Math.random() * 40 + 20); // 20-60s
}

/**
 * Fonction summary avec analyse dégradation
 */
export function handleSummary(data) {
  const metrics = data.metrics;
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 RÉSULTATS TEST LONGUE DURÉE (6H)');
  console.log('='.repeat(70));
  
  console.log(`\n📈 REQUÊTES:`);
  console.log(`   Total: ${metrics.http_reqs.values.count}`);
  console.log(`   Taux: ${(metrics.http_reqs.values.rate).toFixed(2)} req/s`);
  console.log(`   Échecs: ${metrics.failed_requests?.values.count || 0}`);
  console.log(`   Taux erreur: ${(metrics.errors.values.rate * 100).toFixed(2)}%`);
  
  console.log(`\n⏱️ TEMPS RÉPONSE:`);
  console.log(`   Médian: ${metrics.http_req_duration.values.med.toFixed(0)}ms`);
  console.log(`   Moyenne: ${metrics.http_req_duration.values.avg.toFixed(0)}ms`);
  console.log(`   P95: ${metrics.http_req_duration.values['p(95)'].toFixed(0)}ms`);
  console.log(`   P99: ${metrics.http_req_duration.values['p(99)'].toFixed(0)}ms`);
  console.log(`   Max: ${metrics.http_req_duration.values.max.toFixed(0)}ms`);
  
  // Analyse stabilité (comparer début vs fin)
  console.log(`\n🔍 ANALYSE STABILITÉ:`);
  console.log(`   ⚠️ À vérifier manuellement:`);
  console.log(`      - Mémoire serveur stable sur 6h (monitoring externe)`);
  console.log(`      - CPU moyen < 60% (monitoring externe)`);
  console.log(`      - Connexions BDD stables (logs BDD)`);
  console.log(`      - Pas d'augmentation progressive temps réponse`);
  
  // Verdict
  const conforme = {
    taux_erreur: metrics.errors.values.rate < 0.01,
    p95_ok: metrics.http_req_duration.values['p(95)'] < 2000,
    p99_ok: metrics.http_req_duration.values['p(99)'] < 5000
  };
  
  const verdict = Object.values(conforme).every(c => c);
  
  console.log(`\n${verdict ? '✅' : '❌'} VERDICT: ${verdict ? 'TEST RÉUSSI' : 'PROBLÈMES DÉTECTÉS'}`);
  
  if (!conforme.taux_erreur) {
    console.log(`   ❌ Taux erreur trop élevé: ${(metrics.errors.values.rate * 100).toFixed(2)}%`);
  }
  if (!conforme.p95_ok) {
    console.log(`   ❌ P95 trop lent: ${metrics.http_req_duration.values['p(95)'].toFixed(0)}ms`);
  }
  if (!conforme.p99_ok) {
    console.log(`   ❌ P99 trop lent: ${metrics.http_req_duration.values['p(99)'].toFixed(0)}ms`);
  }
  
  console.log(`\n📋 VÉRIFICATIONS POST-TEST MANUELLES:`);
  console.log(`   1. Vérifier mémoire serveur n'a pas augmenté > 20%`);
  console.log(`   2. Vérifier CPU moyen resté < 60%`);
  console.log(`   3. Vérifier logs BDD: pas de connexions leak`);
  console.log(`   4. Vérifier stockage disque stable`);
  console.log(`   5. Analyser graphiques monitoring: dégradation progressive?`);
  
  return {
    'summary-6h.json': JSON.stringify(data, null, 2)
  };
}