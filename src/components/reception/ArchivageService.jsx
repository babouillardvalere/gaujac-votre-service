import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Service d'archivage automatique des fiches de plus de 30 jours
 * 
 * STRATEGY:
 * - Archive les fiches > 30 jours depuis date_depart
 * - Conserve uniquement les URLs (PDF, photos) et données essentielles
 * - Supprime les fiches originales après archivage
 * - Libère la charge de la base principale
 */

const ARCHIVE_THRESHOLD_DAYS = 30;

/**
 * Calcule si une date est éligible pour archivage (> 30 jours)
 */
export const isEligibleForArchiving = (dateDepart) => {
  if (!dateDepart) return false;
  
  const departDate = new Date(dateDepart);
  const today = new Date();
  const diffDays = Math.floor((today - departDate) / (1000 * 60 * 60 * 24));
  
  return diffDays > ARCHIVE_THRESHOLD_DAYS;
};

/**
 * Archive une fiche d'arrivée
 * Compresse les données (garde uniquement URLs, pas les blobs)
 */
export const archiveFicheArrivee = async (fiche) => {
  try {
    // Créer l'archive avec données compressées
    await base44.entities.ArchiveFicheArrivee.create({
      client_nom: fiche.client_nom,
      client_prenom: fiche.client_prenom,
      date_arrivee: fiche.date_arrivee,
      date_depart: fiche.date_depart,
      numero_logement: fiche.numero_logement,
      categorie_logement: fiche.categorie_logement,
      type_logement: fiche.type_logement,
      evaluation_proprete: fiche.evaluation_proprete,
      pdf_url: fiche.pdf_url, // URL uniquement, pas le contenu
      date_validation: fiche.date_validation,
      date_archivage: new Date().toISOString(),
      fiche_originale_id: fiche.id,
      donnees_compressees: {
        // Conserver uniquement les données légères
        inventaire_objets_valides: fiche.inventaire_objets_valides?.length || 0,
        inventaire_objets_manquants: fiche.inventaire_objets_manquants?.length || 0,
        photos_count: fiche.photos_pieces ? Object.keys(fiche.photos_pieces).length : 0,
        commentaire_proprete: fiche.commentaire_proprete,
        remarques_client: fiche.remarques_client
      }
    });
    
    // Supprimer la fiche originale
    await base44.entities.FicheArrivee.delete(fiche.id);
    
    return { success: true };
  } catch (error) {
    console.error('Erreur archivage fiche arrivée:', error);
    return { success: false, error };
  }
};

/**
 * Archive une fiche de départ
 */
export const archiveFicheDepart = async (fiche) => {
  try {
    await base44.entities.ArchiveFicheDepart.create({
      client_nom: fiche.client_nom,
      client_prenom: fiche.client_prenom,
      date_arrivee: fiche.date_arrivee,
      date_depart: fiche.date_depart,
      numero_logement: fiche.numero_logement,
      categorie_logement: fiche.categorie_logement,
      type_logement: fiche.type_logement,
      evaluation_proprete: fiche.evaluation_proprete,
      degats_signales: fiche.degats_signales,
      pdf_url: fiche.pdf_url, // URL uniquement
      date_validation: fiche.date_validation,
      date_archivage: new Date().toISOString(),
      fiche_originale_id: fiche.id,
      donnees_compressees: {
        photos_count: fiche.photos_depart ? Object.keys(fiche.photos_depart).length : 0,
        remarques_staff: fiche.remarques_staff,
        inventaire_count: fiche.inventaire_objets_etat?.length || 0
      }
    });
    
    await base44.entities.FicheDepart.delete(fiche.id);
    
    return { success: true };
  } catch (error) {
    console.error('Erreur archivage fiche départ:', error);
    return { success: false, error };
  }
};

/**
 * Lance l'archivage automatique de toutes les fiches éligibles
 * À appeler périodiquement (ex: daily cron, ou au chargement de la page Réception)
 */
export const runAutoArchiving = async (options = { showToast: false }) => {
  try {
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(today.getDate() - ARCHIVE_THRESHOLD_DAYS);
    const thresholdISO = thresholdDate.toISOString().split('T')[0];
    
    // Récupérer les fiches éligibles pour archivage
    const fichesArrivee = await base44.entities.FicheArrivee.filter(
      { date_depart: { $lt: thresholdISO } },
      '-date_depart',
      100
    );
    
    const fichesDepart = await base44.entities.FicheDepart.filter(
      { date_depart: { $lt: thresholdISO } },
      '-date_depart',
      100
    );
    
    let archivedCount = 0;
    
    // Archiver les fiches d'arrivée
    for (const fiche of fichesArrivee) {
      const result = await archiveFicheArrivee(fiche);
      if (result.success) archivedCount++;
    }
    
    // Archiver les fiches de départ
    for (const fiche of fichesDepart) {
      const result = await archiveFicheDepart(fiche);
      if (result.success) archivedCount++;
    }
    
    if (options.showToast && archivedCount > 0) {
      toast.success(`📦 ${archivedCount} fiche(s) archivée(s) automatiquement`);
    }
    
    return { archived: archivedCount };
  } catch (error) {
    console.error('Erreur lors de l\'archivage automatique:', error);
    return { archived: 0, error };
  }
};

/**
 * Récupère les archives avec pagination
 */
export const getArchivedFiches = async (type = 'arrivee', page = 1, limit = 20) => {
  const entity = type === 'arrivee' ? 'ArchiveFicheArrivee' : 'ArchiveFicheDepart';
  
  try {
    const archives = await base44.entities[entity].list(
      '-date_archivage',
      limit,
      (page - 1) * limit
    );
    
    return archives;
  } catch (error) {
    console.error('Erreur récupération archives:', error);
    return [];
  }
};