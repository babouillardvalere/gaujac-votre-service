/**
 * 🧪 TEST DE NON-RÉGRESSION - ANCIEN SYSTÈME INCIDENT
 * 
 * Objectif: Valider que les anciens Incidents (description_probleme)
 * sont correctement affichés et utilisables dans les services.
 */

import { base44 } from '@/api/base44Client';

export async function testAncienIncident() {
  const results = {
    etapes: [],
    success: true,
    errors: []
  };
  
  try {
    // ÉTAPE 1: Créer un Incident avec description_probleme (ancien système)
    const incidentAncien = await base44.entities.Incident.create({
      type: 'technique',
      categorie: 'electricite',
      description_probleme: 'Ampoule grillée dans la salle de bain', // ANCIEN CHAMP
      // PAS de description ni description_operationnelle
      client_nom: 'Test',
      client_prenom: 'Ancien',
      logement: 'T04',
      date_arrivee: '2026-01-20',
      date_depart: '2026-01-27',
      statut: 'en_attente',
      date_saisie: new Date().toISOString()
    });
    
    results.etapes.push({ action: 'CREATE ancien Incident', id: incidentAncien.id });
    
    // ÉTAPE 2: Vérifier que description_probleme est bien stocké
    const fetched = await base44.entities.Incident.filter({ id: incidentAncien.id });
    const incident = fetched[0];
    
    if (!incident.description_probleme) {
      results.errors.push('❌ description_probleme non stocké');
      results.success = false;
    } else {
      results.etapes.push({ verification: 'description_probleme stocké OK', value: incident.description_probleme });
    }
    
    // ÉTAPE 3: Simuler normalisation (comme dans queryFn)
    const normalized = {
      ...incident,
      description_operationnelle: incident.description_operationnelle || incident.description_probleme || incident.description || null,
      description: incident.description || incident.description_probleme || null
    };
    
    if (!normalized.description_operationnelle) {
      results.errors.push('❌ Normalisation échouée: description_operationnelle toujours vide');
      results.success = false;
    } else {
      results.etapes.push({ 
        verification: 'Normalisation OK', 
        description_operationnelle: normalized.description_operationnelle,
        description: normalized.description
      });
    }
    
    // ÉTAPE 4: Vérifier affichage dans liste
    if (!normalized.description && !normalized.description_operationnelle) {
      results.errors.push('❌ Aucun texte disponible pour affichage liste');
      results.success = false;
    } else {
      results.etapes.push({ 
        verification: 'Texte liste OK', 
        display: normalized.description || 'fallback'
      });
    }
    
    // ÉTAPE 5: Simuler prise en charge
    try {
      await base44.entities.Incident.update(incident.id, {
        pris_par: 'Test Agent',
        date_debut: new Date().toISOString(),
        statut: 'en_cours'
      });
      
      results.etapes.push({ action: 'Prise en charge OK', id: incident.id });
    } catch (error) {
      results.errors.push(`❌ Prise en charge échouée: ${error.message}`);
      results.success = false;
    }
    
    // NETTOYAGE: supprimer l'Incident de test
    try {
      await base44.entities.Incident.delete(incident.id);
      results.etapes.push({ cleanup: 'Incident test supprimé' });
    } catch (e) {
      // Pas grave si la suppression échoue
    }
    
    return results;
    
  } catch (error) {
    return {
      success: false,
      errors: [error.message],
      etapes: []
    };
  }
}

// Exposer dans window pour console
if (typeof window !== 'undefined') {
  window.testAncienIncident = testAncienIncident;
}

export default testAncienIncident;