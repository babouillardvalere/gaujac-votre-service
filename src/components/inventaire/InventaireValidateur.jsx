import { CATEGORIES_INVENTAIRE, getLabelObjet, getCategorieObjet } from './InventaireCategoriesReferentiel';

/**
 * VALIDATION STRICTE DES DONNÉES D'INVENTAIRE
 * Bloque toute création d'objet hors catégorie
 */

export function validerInventaireComplet(inventaireData) {
  const erreurs = [];
  const avertissements = [];
  
  // Vérifier que tous les objets appartiennent à une catégorie
  Object.keys(inventaireData || {}).forEach(objetId => {
    const categorie = getCategorieObjet(objetId);
    if (!categorie) {
      erreurs.push(`❌ Objet "${objetId}" hors catégorie autorisée`);
    }
  });

  // Vérifier les doublons
  const objetsVus = new Set();
  Object.keys(inventaireData || {}).forEach(objetId => {
    if (objetsVus.has(objetId)) {
      erreurs.push(`❌ Doublon détecté: "${getLabelObjet(objetId)}"`);
    }
    objetsVus.add(objetId);
  });

  // Analyser les anomalies par catégorie
  const anomaliesParCategorie = {};
  
  CATEGORIES_INVENTAIRE.forEach(categorie => {
    const objetsCategorie = categorie.objets.filter(obj => inventaireData[obj]);
    const anomalies = objetsCategorie.filter(obj => {
      const data = inventaireData[obj];
      return (data.quantity || 0) !== (data.expected || 0);
    });
    
    if (anomalies.length > 0) {
      anomaliesParCategorie[categorie.id] = {
        nom: categorie.nom,
        icone: categorie.icone,
        service: categorie.service_responsable,
        objets: anomalies.map(obj => ({
          id: obj,
          label: getLabelObjet(obj),
          present: inventaireData[obj].quantity || 0,
          attendu: inventaireData[obj].expected || 0
        }))
      };
    }
  });

  return {
    valide: erreurs.length === 0,
    erreurs,
    avertissements,
    anomaliesParCategorie,
    stats: {
      totalObjets: Object.keys(inventaireData || {}).length,
      totalAnomalies: Object.values(anomaliesParCategorie).reduce((acc, cat) => acc + cat.objets.length, 0),
      categoriesAvecAnomalies: Object.keys(anomaliesParCategorie).length
    }
  };
}

/**
 * Génère les WorkItems à partir des anomalies détectées
 */
export function genererWorkItemsDepuisAnomalies(anomaliesParCategorie, clientInfo, hebergement) {
  const workItems = [];

  Object.values(anomaliesParCategorie).forEach(categorie => {
    if (categorie.objets.length === 0) return;

    const description = `${categorie.nom} - ${categorie.objets.length} anomalie(s) détectée(s):\n` +
      categorie.objets.map(obj => 
        `• ${obj.label}: ${obj.present}/${obj.attendu} (${obj.present < obj.attendu ? 'manquant' : 'excédent'})`
      ).join('\n');

    workItems.push({
      type: 'INTERVENTION_CLIENT',
      service: categorie.service,
      statut: 'A_FAIRE',
      priorite: 'NORMALE',
      description_operationnelle: description,
      titre: `${categorie.icone} ${categorie.nom}`,
      hebergement: hebergement.numero,
      type_hebergement: hebergement.categorie,
      client_nom: clientInfo.nom,
      client_prenom: clientInfo.prenom,
      date_arrivee: clientInfo.dateArrivee,
      date_depart: clientInfo.dateDepart,
      taches: categorie.objets.map((obj, idx) => ({
        numero: idx + 1,
        texte: `${obj.label}: remettre ${obj.attendu}`,
        faite: false
      }))
    });
  });

  return workItems;
}