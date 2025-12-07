/**
 * Système de file d'attente pour génération PDF asynchrone
 * Évite la surcharge lors de génération massive (50+ PDFs en même temps)
 */

import { base44 } from '@/api/base44Client';

const PDF_STATUS = {
  EN_ATTENTE: 'en_attente',
  EN_COURS: 'en_cours',
  TERMINE: 'termine',
  ERREUR: 'erreur'
};

// File d'attente en mémoire (pour le client)
const pdfQueue = [];
let isProcessing = false;

/**
 * Ajoute une demande de génération PDF à la file
 */
export const addPDFToQueue = async ({ type, entityId, entityData, generatorFn }) => {
  const queueItem = {
    id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type, // 'arrivee' ou 'depart'
    entityId,
    entityData,
    generatorFn,
    status: PDF_STATUS.EN_ATTENTE,
    addedAt: new Date().toISOString(),
    attempts: 0
  };

  pdfQueue.push(queueItem);
  
  console.log(`📋 PDF ajouté à la file: ${queueItem.id} (${type})`);
  
  // Démarrer le traitement si pas déjà actif
  if (!isProcessing) {
    processQueue();
  }

  return queueItem.id;
};

/**
 * Traite la file d'attente
 */
const processQueue = async () => {
  if (isProcessing || pdfQueue.length === 0) return;
  
  isProcessing = true;
  console.log(`🔄 Traitement de ${pdfQueue.length} PDF(s) en file...`);

  while (pdfQueue.length > 0) {
    const item = pdfQueue.shift();
    
    try {
      // Mettre à jour le statut en "en_cours"
      item.status = PDF_STATUS.EN_COURS;
      await updatePDFStatus(item.type, item.entityId, PDF_STATUS.EN_COURS);

      // Générer le PDF
      console.log(`📝 Génération PDF ${item.id}...`);
      const pdfUrl = await item.generatorFn();

      // Mettre à jour avec le PDF généré
      item.status = PDF_STATUS.TERMINE;
      await updatePDFStatus(item.type, item.entityId, PDF_STATUS.TERMINE, pdfUrl);

      // Notifier la réception
      await notifyPDFReady(item.type, item.entityData, pdfUrl);

      console.log(`✅ PDF généré avec succès: ${item.id}`);
      
      // Pause de 500ms entre chaque PDF pour éviter surcharge
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Erreur génération PDF ${item.id}:`, error);
      item.attempts++;
      
      // Réessayer jusqu'à 3 fois
      if (item.attempts < 3) {
        console.log(`🔄 Nouvelle tentative (${item.attempts}/3)...`);
        pdfQueue.push(item);
      } else {
        item.status = PDF_STATUS.ERREUR;
        await updatePDFStatus(item.type, item.entityId, PDF_STATUS.ERREUR, null, error.message);
        await notifyPDFError(item.type, item.entityData, error.message);
      }
    }
  }

  isProcessing = false;
  console.log('✅ File d\'attente PDF terminée');
};

/**
 * Met à jour le statut du PDF dans l'entité
 */
const updatePDFStatus = async (type, entityId, status, pdfUrl = null, errorMessage = null) => {
  const entityName = type === 'arrivee' ? 'FicheArrivee' : 'FicheDepart';
  
  const updateData = {
    pdf_status: status,
    pdf_status_updated: new Date().toISOString()
  };

  if (status === PDF_STATUS.TERMINE && pdfUrl) {
    updateData.pdf_url = pdfUrl;
  }

  if (status === PDF_STATUS.ERREUR && errorMessage) {
    updateData.pdf_error = errorMessage;
  }

  await base44.entities[entityName].update(entityId, updateData);
};

/**
 * Notifie la réception que le PDF est prêt
 */
const notifyPDFReady = async (type, entityData, pdfUrl) => {
  try {
    await base44.entities.Notification.create({
      destinataire_type: 'collaborateur',
      type: 'pdf_genere',
      titre: `📄 PDF ${type === 'arrivee' ? 'd\'arrivée' : 'de départ'} généré`,
      message: `${entityData.client_nom} ${entityData.client_prenom} - ${entityData.numero_logement}`,
      metadata: {
        type,
        fiche_id: entityData.id,
        pdf_url: pdfUrl,
        client: `${entityData.client_nom} ${entityData.client_prenom}`,
        numero_logement: entityData.numero_logement,
        role_cible: 'reception'
      },
      lue: false,
      archivee: false
    });
  } catch (error) {
    console.error('Erreur notification PDF ready:', error);
  }
};

/**
 * Notifie la réception d'une erreur de génération
 */
const notifyPDFError = async (type, entityData, errorMessage) => {
  try {
    await base44.entities.Notification.create({
      destinataire_type: 'collaborateur',
      type: 'pdf_erreur',
      titre: `❌ Erreur génération PDF ${type === 'arrivee' ? 'd\'arrivée' : 'de départ'}`,
      message: `${entityData.client_nom} ${entityData.client_prenom} - ${entityData.numero_logement}`,
      metadata: {
        type,
        fiche_id: entityData.id,
        error: errorMessage,
        client: `${entityData.client_nom} ${entityData.client_prenom}`,
        numero_logement: entityData.numero_logement,
        role_cible: 'reception'
      },
      lue: false,
      archivee: false
    });
  } catch (error) {
    console.error('Erreur notification PDF error:', error);
  }
};

/**
 * Récupère le statut de la file d'attente
 */
export const getQueueStatus = () => {
  return {
    pending: pdfQueue.length,
    isProcessing,
    items: pdfQueue.map(item => ({
      id: item.id,
      type: item.type,
      status: item.status,
      attempts: item.attempts
    }))
  };
};

/**
 * Vide la file d'attente (en cas d'urgence)
 */
export const clearQueue = () => {
  pdfQueue.length = 0;
  isProcessing = false;
  console.log('🗑️ File d\'attente PDF vidée');
};

export { PDF_STATUS };