/**
 * 🌱 SCRIPT DE GÉNÉRATION DE DONNÉES DE TEST
 * 
 * Génère une volumétrie réaliste pour test de charge haute saison
 * 
 * USAGE:
 * 1. Exécuter dans la console du navigateur sur environnement de test
 * 2. Ou créer une page admin dédiée pour lancer le seed
 * 
 * ⚠️ NE JAMAIS exécuter en production !
 */

import { base44 } from '@/api/base44Client';

// Configuration volumétrie
const CONFIG = {
  nb_fiches_arrivee: 300,
  nb_fiches_depart: 250,
  nb_incidents: 500,
  nb_avis: 200,
  nb_mobilhomes: 80,
  nb_emplacements: 120
};

const categoriesLogement = [
  'Chalet Eco',
  'Mobil-home Classique',
  'Mobil-home Classique Clim',
  'Confort+ 2ch',
  'Premium 2ch',
  'Premium 3ch',
  'Cottage Premium'
];

const categoriesEmplacement = [
  'Emplacement 6A',
  'Emplacement 10A',
  'Emplacement Eau+10A'
];

const noms = [
  'Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas',
  'Robert', 'Richard', 'Petit', 'Durand', 'Leroy',
  'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel',
  'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent'
];

const prenoms = [
  'Jean', 'Marie', 'Pierre', 'Sophie', 'Paul',
  'Julie', 'Luc', 'Anne', 'Marc', 'Claire',
  'Thomas', 'Emma', 'Nicolas', 'Laura', 'Alexandre'
];

const categoriesIncident = [
  { type: 'technique', cat: 'gaz', urgent: true },
  { type: 'technique', cat: 'eau', urgent: true },
  { type: 'technique', cat: 'electricite', urgent: true },
  { type: 'technique', cat: 'plomberie', urgent: false },
  { type: 'technique', cat: 'divers_technique', urgent: false },
  { type: 'menage', cat: 'literie', urgent: false },
  { type: 'menage', cat: 'nettoyage', urgent: true },
  { type: 'menage', cat: 'vaisselle', urgent: false },
  { type: 'menage', cat: 'poubelle', urgent: false }
];

// Utilitaires
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  return date.toISOString().split('T')[0];
};

/**
 * Génère des fiches d'arrivée
 */
export async function seedFichesArrivee(count = CONFIG.nb_fiches_arrivee) {
  console.log(`🌱 Génération de ${count} fiches d'arrivée...`);
  
  const fiches = [];
  for (let i = 0; i < count; i++) {
    const typeLogement = Math.random() > 0.6 ? 'mobilhome' : 'emplacement';
    const dateArrivee = randomDate(45);
    const dateDepart = new Date(dateArrivee);
    dateDepart.setDate(dateDepart.getDate() + randomInt(3, 14));
    
    fiches.push({
      client_nom: random(noms),
      client_prenom: random(prenoms),
      date_arrivee: dateArrivee,
      date_depart: dateDepart.toISOString().split('T')[0],
      numero_logement: typeLogement === 'mobilhome' 
        ? `MH${String(randomInt(1, 80)).padStart(3, '0')}`
        : `E${String(randomInt(1, 120)).padStart(3, '0')}`,
      categorie_logement: typeLogement === 'mobilhome' 
        ? random(categoriesLogement)
        : random(categoriesEmplacement),
      type_logement: typeLogement,
      nombre_adultes: randomInt(1, 4),
      nombre_adolescents: randomInt(0, 2),
      nombre_enfants: randomInt(0, 3),
      nombre_bebes: randomInt(0, 1),
      nombre_animaux: randomInt(0, 2),
      inventaire_objets_valides: Array.from({length: randomInt(40, 48)}, (_, j) => `objet_${j}`),
      inventaire_objets_manquants: Math.random() > 0.8 ? [{ objet: 'Torchon', commentaire: 'Manquant' }] : [],
      evaluation_proprete: Math.random() > 0.9 ? 'pas_satisfaisant' : (Math.random() > 0.5 ? 'tres_propre' : 'correct'),
      date_validation: new Date(dateArrivee).toISOString()
    });
  }
  
  // Insertion par batch de 50 pour éviter timeout
  for (let i = 0; i < fiches.length; i += 50) {
    const batch = fiches.slice(i, i + 50);
    await base44.entities.FicheArrivee.bulkCreate(batch);
    console.log(`✅ ${Math.min(i + 50, fiches.length)}/${count} fiches arrivée créées`);
  }
  
  console.log(`✅ ${count} fiches d'arrivée générées`);
}

/**
 * Génère des incidents
 */
export async function seedIncidents(count = CONFIG.nb_incidents) {
  console.log(`🌱 Génération de ${count} incidents...`);
  
  const incidents = [];
  for (let i = 0; i < count; i++) {
    const incident = random(categoriesIncident);
    const dateCreation = randomDate(30);
    const estResolu = Math.random() > 0.4; // 60% résolus
    
    incidents.push({
      type: incident.type,
      categorie: incident.cat,
      description: `Problème ${incident.cat} - Test de charge`,
      urgent: incident.urgent && Math.random() > 0.8,
      client_nom: random(noms),
      client_prenom: random(prenoms),
      date_arrivee: randomDate(45),
      date_depart: randomDate(-10),
      logement: `MH${String(randomInt(1, 80)).padStart(3, '0')}`,
      date_saisie: dateCreation,
      statut: estResolu ? 'resolu' : (Math.random() > 0.5 ? 'en_attente' : 'en_cours'),
      date_debut: estResolu ? dateCreation : null,
      date_resolution: estResolu ? new Date(dateCreation).toISOString() : null,
      pris_par: estResolu ? random(prenoms) : null,
      temps_prise_en_charge: estResolu ? randomInt(10, 120) : null,
      temps_total_intervention: estResolu ? randomInt(30, 180) : null,
      autorisation_acces: Math.random() > 0.3 ? 'oui' : 'non'
    });
  }
  
  // Batch insert
  for (let i = 0; i < incidents.length; i += 50) {
    const batch = incidents.slice(i, i + 50);
    await base44.entities.Incident.bulkCreate(batch);
    console.log(`✅ ${Math.min(i + 50, incidents.length)}/${count} incidents créés`);
  }
  
  console.log(`✅ ${count} incidents générés`);
}

/**
 * Génère des avis clients
 */
export async function seedAvis(count = CONFIG.nb_avis) {
  console.log(`🌱 Génération de ${count} avis...`);
  
  const avis = [];
  for (let i = 0; i < count; i++) {
    const noteReactivite = randomInt(3, 5);
    const noteAmabilite = randomInt(3, 5);
    const noteIntervention = randomInt(3, 5);
    const noteGlobale = Math.round((noteReactivite + noteAmabilite + noteIntervention) / 3);
    
    avis.push({
      client_nom: random(noms),
      client_prenom: random(prenoms),
      logement_ou_emplacement: `MH${String(randomInt(1, 80)).padStart(3, '0')}`,
      date_arrivee: randomDate(60),
      date_depart: randomDate(40),
      note_reactivite: noteReactivite,
      note_amabilite: noteAmabilite,
      note_intervention: noteIntervention,
      note_globale: noteGlobale,
      commentaire: Math.random() > 0.5 
        ? 'Excellent séjour, équipe très réactive et professionnelle.'
        : 'Bon séjour dans l\'ensemble, intervention rapide.',
      visible: Math.random() > 0.2, // 80% visibles
      mis_en_avant: noteGlobale >= 5 && Math.random() > 0.7
    });
  }
  
  // Batch insert
  for (let i = 0; i < avis.length; i += 50) {
    const batch = avis.slice(i, i + 50);
    await base44.entities.Avis.bulkCreate(batch);
    console.log(`✅ ${Math.min(i + 50, avis.length)}/${count} avis créés`);
  }
  
  console.log(`✅ ${count} avis générés`);
}

/**
 * Génère des mobilhomes
 */
export async function seedMobilhomes(count = CONFIG.nb_mobilhomes) {
  console.log(`🌱 Génération de ${count} mobilhomes...`);
  
  const mobilhomes = [];
  for (let i = 1; i <= count; i++) {
    mobilhomes.push({
      numero: `MH${String(i).padStart(3, '0')}`,
      categorie: random(categoriesLogement),
      capacite: randomInt(4, 8),
      surface: randomInt(25, 45),
      annee: randomInt(2015, 2023),
      nb_chambres: randomInt(2, 3),
      equipements: ['TV', 'Terrasse'],
      localisation: `Zone ${randomInt(1, 5)}`
    });
  }
  
  await base44.entities.Mobilhome.bulkCreate(mobilhomes);
  console.log(`✅ ${count} mobilhomes générés`);
}

/**
 * FONCTION PRINCIPALE - Génère toutes les données
 */
export async function generateAllTestData() {
  console.log('🚀 Démarrage génération données de test...\n');
  
  const startTime = Date.now();
  
  try {
    await seedMobilhomes();
    await seedFichesArrivee();
    await seedIncidents();
    await seedAvis();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ GÉNÉRATION TERMINÉE');
    console.log(`⏱️ Durée: ${duration}s`);
    console.log('\n📊 Volumétrie générée:');
    console.log(`- ${CONFIG.nb_mobilhomes} mobilhomes`);
    console.log(`- ${CONFIG.nb_fiches_arrivee} fiches arrivée`);
    console.log(`- ${CONFIG.nb_incidents} incidents`);
    console.log(`- ${CONFIG.nb_avis} avis`);
    console.log('\n🔥 Prêt pour test de charge avec K6');
    
    return { success: true, duration };
  } catch (error) {
    console.error('❌ Erreur génération données:', error);
    return { success: false, error };
  }
}

export default generateAllTestData;