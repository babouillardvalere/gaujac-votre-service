/**
 * WORKFLOW EMPLACEMENTS NUS
 * Mapping automatique : Problème → Service → Mission
 */

// Mapping FIXE : Problème → Service
const PROBLEME_SERVICE_MAP = {
  // Techniques pures
  'gaz': 'TECHNIQUE',
  'eau_plomberie': 'TECHNIQUE',
  'electricite': 'TECHNIQUE',
  'technique_divers': 'TECHNIQUE',
  'probleme_structurel': 'TECHNIQUE',
  
  // Environnement / Espaces verts
  'espace_vert': 'ESPACES_VERTS',
  
  // Mobilier / Matériel
  'mobilier_casse': 'TECHNIQUE',
  
  // Nuisances
  'souris': 'TECHNIQUE',
  'guepes': 'TECHNIQUE',  // Peut nécessiter intervention spécialisée mais ordonnée via Technique
  'fourmis': 'TECHNIQUE',
  'moustiques': 'TECHNIQUE'
};

/**
 * Détermine si une validation déclenche la création de missions
 * Critères :
 * - Au moins 1 problème sélectionné
 * - OU appréciation globale ≠ "bon" (correct ou insatisfaisant)
 */
export function shouldCreateMissions(problemes, appreciationEtat) {
  const hasProblems = Object.values(problemes).some(v => v);
  const isNotExcellent = appreciationEtat && appreciationEtat !== 'bon';
  
  return hasProblems || isNotExcellent;
}

/**
 * Crée les missions/WorkItems pour un emplacement nu
 * Une mission par service concerné
 */
export async function createEmplacementNuMissions({
  numero,
  categorie,
  clientNom,
  clientPrenom,
  dateArrivee,
  dateDepart,
  problemes,
  urgences,
  appreciationEtat,
  commentaire,
  autorisationAcces,
  lang,
  base44
}) {
  const createdMissions = [];
  const { createWorkItem } = await import('../workItemCreator');

  // Grouper problèmes par service
  const problemesByService = {};
  
  // Recenser tous les problèmes sélectionnés
  Object.entries(problemes).forEach(([problemeId, isSelected]) => {
    if (!isSelected) return;
    
    const service = PROBLEME_SERVICE_MAP[problemeId];
    if (!service) return;
    
    if (!problemesByService[service]) {
      problemesByService[service] = [];
    }
    problemesByService[service].push({
      id: problemeId,
      urgent: urgences[problemeId] || false
    });
  });

  // Si appréciation ≠ bon, créer une mission "État général"
  if (appreciationEtat && appreciationEtat !== 'bon') {
    const appreciationMap = {
      'insatisfaisant': '😠 Insatisfaisant',
      'correct': '😐 Correct'
    };
    
    if (!problemesByService['TECHNIQUE']) {
      problemesByService['TECHNIQUE'] = [];
    }
    
    problemesByService['TECHNIQUE'].push({
      id: `appreciation_${appreciationEtat}`,
      label: appreciationMap[appreciationEtat],
      isAppreciation: true,
      urgent: appreciationEtat === 'insatisfaisant'
    });
  }

  // Créer une mission par service
  for (const [service, problemesListe] of Object.entries(problemesByService)) {
    const hasUrgent = problemesListe.some(p => p.urgent);
    
    // Construire description opérationnelle RICHE
    const taches = problemesListe.map((p, idx) => ({
      numero: idx + 1,
      texte: p.label || p.id,
      probleme_id: p.id,
      urgent: p.urgent
    }));

    const descriptionDetail = problemesListe
      .map(p => {
        let line = `• ${p.label || p.id}`;
        if (p.urgent) line += ' 🔴 URGENT';
        return line;
      })
      .join('\n');

    const stayId = `EMP-${numero}-${dateArrivee.replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const descriptionOperationnelle = `📍 EMPLACEMENT NU - ${categorie} N°${numero}
👤 ${clientPrenom} ${clientNom}
📅 ${dateArrivee} → ${dateDepart}

🔐 Accès: ${autorisationAcces === 'oui' ? '✅ Autorisé' : '❌ Non autorisé'}

⚠️ PROBLÈMES SIGNALÉS:
${descriptionDetail}

${appreciationEtat ? `\n😊 État: ${appreciationEtat === 'insatisfaisant' ? 'Insatisfaisant' : appreciationEtat === 'correct' ? 'Correct' : 'Très bon'}\n` : ''}
${commentaire ? `💬 Remarques client: ${commentaire}\n` : ''}

📋 Source: Contrôle inventaire emplacement nu`;

    // Créer WorkItem via factory
    const workItem = await createWorkItem({
      type: 'INTERVENTION_CLIENT',
      service,
      statut: 'A_FAIRE',
      priorite: hasUrgent ? 'URGENTE' : 'NORMALE',
      rank: hasUrgent ? -1000 : 0,
      description_operationnelle: descriptionOperationnelle,
      titre: `🏕️ ${service} - ${numero} - ${problemesListe.length} problème(s)`,
      description: descriptionDetail,
      hebergement: numero,
      type_hebergement: `Emplacement nu - ${categorie}`,
      client_nom: clientNom,
      client_prenom: clientPrenom,
      date_arrivee: dateArrivee,
      date_depart: dateDepart,
      autorisation_acces: autorisationAcces,
      plages_horaires: [],
      taches,
      stay_id: stayId
    });

    createdMissions.push({
      service,
      workItemId: workItem.id,
      hasUrgent,
      problemCount: problemesListe.length
    });

    // Notification immédiate au service
    const serviceLabel = service === 'TECHNIQUE' ? '🔧 Technique' 
                        : service === 'ESPACES_VERTS' ? '🌿 Espaces verts'
                        : service;

    await base44.entities.Notification.create({
      type: hasUrgent ? 'INCIDENT_URGENT' : 'NOUVEAU_INCIDENT',
      titre: `${hasUrgent ? '🔴 URGENT - ' : ''}${serviceLabel} - Emplacement ${numero}`,
      message: `📍 ${categorie} N°${numero}
👤 ${clientPrenom} ${clientNom}
📅 ${dateArrivee} → ${dateDepart}
🔐 ${autorisationAcces === 'oui' ? '✅ Accès autorisé' : '❌ Présence requise'}

⚠️ ${problemesListe.length} problème(s):
${descriptionDetail}

${commentaire ? `💬 ${commentaire}` : ''}

📄 Contrôle emplacement nu`,
      destinataire_role: service,
      statut: 'non_lu',
      priorite: hasUrgent ? 'URGENTE' : 'NORMALE'
    });

    console.log(`[EMP_NUL_MISSION] ${service} créée:`, {
      workItemId: workItem.id,
      problemes: problemesListe.length,
      urgent: hasUrgent
    });
  }

  return createdMissions;
}

/**
 * Récupère le label d'un problème (pour affichage)
 */
export function getProblemLabel(problemeId, lang = 'fr') {
  const labels = {
    'gaz': { fr: 'Gaz', en: 'Gas' },
    'eau_plomberie': { fr: 'Eau / Fuite / Plomberie', en: 'Water / Leak / Plumbing' },
    'electricite': { fr: 'Électricité', en: 'Electricity' },
    'technique_divers': { fr: 'Problème technique divers', en: 'Other technical issue' },
    'espace_vert': { fr: 'Espace vert', en: 'Green space' },
    'mobilier_casse': { fr: 'Mobilier cassé / matériel', en: 'Broken furniture / equipment' },
    'probleme_structurel': { fr: 'Problème structurel', en: 'Structural issue' },
    'souris': { fr: 'Souris', en: 'Mice' },
    'guepes': { fr: 'Guêpes / Frelons', en: 'Wasps / Hornets' },
    'fourmis': { fr: 'Fourmis', en: 'Ants' },
    'moustiques': { fr: 'Moustiques (zone emplacement)', en: 'Mosquitoes (area)' }
  };

  return labels[problemeId]?.[lang] || problemeId;
}