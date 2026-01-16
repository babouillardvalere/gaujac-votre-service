import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { useTranslation } from '../components/translations';
import { useNotifications } from '../components/useNotifications';

import OfflineBanner from '../components/OfflineBanner';
import CollaborateurNotificationBell from '../components/CollaborateurNotificationBell';
import MettreEnAttenteDialog from '../components/MettreEnAttenteDialog';
import PhotoInterventionCapture from '../components/PhotoInterventionCapture';
import InterventionTimer from '../components/InterventionTimer';
import ServiceTabs from '../components/missions/ServiceTabs';
import MissionsDirectionService from '../components/missions/MissionsDirectionService';
import WorkItemsServiceView from '../components/missions/WorkItemsServiceView';
import NotificationsPanelCollab from '../components/NotificationsPanelCollab';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import {
  Clock, User, AlertTriangle, CheckCircle, Play, Pause, Camera, Home, Loader2,
  Flame, Droplets, Zap, Wrench, TreePine, Bug, DoorOpen, UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

const categoryIcons = {
  gaz: { emoji: '🔥', label: 'gaz' },
  eau: { emoji: '💧', label: 'eau_plomberie' },
  electricite: { emoji: '⚡', label: 'electricite' },
  plomberie: { emoji: '🪠', label: 'eau_plomberie' },
  espace_vert: { emoji: '🌿', label: 'espace_vert' },
  divers_technique: { emoji: '🔧', label: 'autres' },
  mobilier: { emoji: '🧰', label: 'mobilier_casse' },
  structurel: { emoji: '🏚', label: 'probleme_structurel' },
  souris: { emoji: '🐭', label: 'souris' },
  guepes: { emoji: '🐝', label: 'guepes' },
  frelons: { emoji: '🐝', label: 'frelons' },
  fourmis: { emoji: '🐜', label: 'fourmis' },
  moustiques: { emoji: '🦟', label: 'moustiques' }
};

const CASSE_CATEGORIES = ['mobilier', 'structurel'];
const isPhotoRequired = (categorie) => CASSE_CATEGORIES.includes(categorie);

export default function Technique() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();
  const { counts } = useNotifications();

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [collaborateurNom, setCollaborateurNom] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [filter, setFilter] = useState('en_attente');
  const [showAttenteDialog, setShowAttenteDialog] = useState(false);
  const [incidentToWait, setIncidentToWait] = useState(null);
  const [showPhotoAvant, setShowPhotoAvant] = useState(false);
  const [showPhotoApres, setShowPhotoApres] = useState(false);
  const [incidentForPhoto, setIncidentForPhoto] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('tous');
  const [filterCollaborateur, setFilterCollaborateur] = useState('tous');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') navigate(createPageUrl('Collaborateur'));
  }, [navigate]);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents-technique', filter],
    queryFn: async () => {
      const query = filter === 'resolu' 
        ? { type: 'technique', statut: 'resolu' }
        : { type: 'technique' };
      return await base44.entities.Incident.filter(query, '-date_saisie', 250);
    },
    refetchInterval: filter === 'resolu' ? 120000 : 45000,
    staleTime: 30000
  });

  const { data: workItemsTechnique = [] } = useQuery({
    queryKey: ['workitems-technique', filter],
    queryFn: async () => {
      console.log('🔍 FETCH WorkItems TECHNIQUE, filtre:', filter);
      const result = await base44.entities.WorkItem.filter({ 
        service: 'TECHNIQUE'
      }, '-created_date', 250);
      // FILTRE ANTI-ORPHELINS: exclure les WorkItems annulés
      const filtered = result.filter(wi => wi.statut !== 'ANNULEE');
      console.log('✅ WorkItems TECHNIQUE actifs:', filtered.length, '/', result.length, 'workitem(s)');
      filtered.forEach(wi => {
        console.log(`  - ID: ${wi.id}, Statut: ${wi.statut}, Type: ${wi.type}, Hébergement: ${wi.hebergement}`);
      });
      return filtered;
    },
    refetchInterval: 30000,
    staleTime: 15000
  });

  const { data: missionsDirection = [] } = useQuery({
    queryKey: ['interventions-direction', 'TECHNIQUE'],
    queryFn: () => base44.entities.InterventionDirection.filter({ service: 'TECHNIQUE' }, '-created_date', 250),
    refetchInterval: 60000,
    staleTime: 45000
  });

  const { data: missionsDirectionGlobal = [] } = useQuery({
    queryKey: ['missions-direction-global'],
    queryFn: () => base44.entities.MissionDirection.filter({ mission_direction: true }, '-created_date', 250),
    refetchInterval: 60000,
    staleTime: 45000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, isWorkItem, workItemId }) => {
      if (isWorkItem) {
        const workItemData = {};
        if (data.statut) {
          const mapping = {
            'en_attente': 'A_FAIRE',
            'en_cours': 'EN_COURS',
            'en_attente_materiel': 'EN_ATTENTE',
            'resolu': 'TERMINEE'
          };
          workItemData.statut = mapping[data.statut] || 'A_FAIRE';
        }
        if (data.pris_par) workItemData.collaborateur = data.pris_par;
        if (data.date_debut) workItemData.date_prise_en_charge = data.date_debut;
        if (data.date_resolution) workItemData.date_terminee = data.date_resolution;
        if (data.temps_total_intervention !== undefined) workItemData.duree_minutes = data.temps_total_intervention;
        
        return base44.entities.WorkItem.update(workItemId, workItemData);
      }
      return base44.entities.Incident.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-technique'] });
      queryClient.invalidateQueries({ queryKey: ['workitems-technique'] });
      toast.success(t('intervention_mise_a_jour'));
      setSelectedIncident(null);
    }
  });

  const pushClientEvent = async ({ incident, type, message, attenteRaison, delaiEstime }) => {
    if (!incident?.intervention_id) return;
    await base44.entities.InterventionEvent.create({
      intervention_id: incident.intervention_id,
      fiche_arrivee_id: incident.fiche_arrivee_id,
      type,
      message_client: message,
      attente_raison: attenteRaison,
      delai_estime: delaiEstime,
      visible_client: true,
      at: new Date().toISOString()
    });
  };

  const notifyBureau = async (message, urgent = false) => {
    await base44.entities.Notification.create({
      type: urgent ? 'INCIDENT_URGENT' : 'NOUVEAU_INCIDENT',
      titre: message,
      message,
      destinataire_role: 'RECEPTION',
      statut: 'non_lu'
    });
  };

  const handlePrendreEnCharge = async (incident) => {
    if (!collaborateurNom.trim()) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    if (isPhotoRequired(incident.categorie)) {
      setIncidentForPhoto(incident);
      setShowPhotoAvant(true);
      return;
    }

    toast.loading(lang === 'fr' ? 'Prise en charge...' : 'Taking over...', { id: 'prise-charge' });
    
    try {
      await prendreEnChargeSansPhoto(incident);
      toast.dismiss('prise-charge');
    } catch (error) {
      toast.dismiss('prise-charge');
      toast.error(lang === 'fr' ? 'Erreur de prise en charge' : 'Take over error');
    }
  };

  const prendreEnChargeSansPhoto = async (incident) => {
    const now = new Date();
    const tempsPriseEnCharge = incident.date_saisie ? differenceInMinutes(now, new Date(incident.date_saisie)) : 0;

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: 'prise_en_charge',
      horodatage: now.toISOString(),
      utilisateur: collaborateurNom,
      commentaire: 'Intervention prise en charge'
    });

    updateMutation.mutate({
      id: incident.id,
      data: {
        pris_par: collaborateurNom,
        date_debut: now.toISOString(),
        statut: 'en_cours',
        temps_prise_en_charge: tempsPriseEnCharge
      },
      isWorkItem: incident.isWorkItem,
      workItemId: incident.workItemId
    });

    await pushClientEvent({
      incident,
      type: 'PRISE_EN_CHARGE',
      message: "L'intervention technique a commencé."
    });

    await notifyBureau(`Intervention technique prise en charge par ${collaborateurNom} - ${incident.logement || incident.emplacement}`);
    
    await base44.entities.HistoriqueEvent.create({
      type_event: 'INTERVENTION_PRISE_EN_CHARGE',
      titre: `Intervention prise en charge - ${incident.logement || incident.emplacement}`,
      description: `${collaborateurNom} - ${incident.categorie}`,
      service: 'TECHNIQUE',
      hebergement: incident.logement || incident.emplacement,
      client_nom: incident.client_nom,
      client_prenom: incident.client_prenom,
      collaborateur: collaborateurNom,
      urgent: incident.urgent,
      incident_id: incident.id,
      intervention_client_id: incident.isInterventionClient ? incident.id : null
    });

    // Synchroniser vers SuiviInventaire (visibilité client)
    if (incident.fiche_arrivee_id) {
      const suivis = await base44.entities.SuiviInventaire.filter({
        fiche_arrivee_id: incident.fiche_arrivee_id
      });
      
      if (suivis.length > 0) {
        const suivi = suivis[0];
        const currentTimeline = suivi.timeline_technique || [];
        
        await base44.entities.SuiviInventaire.update(suivi.id, {
          statut_technique: 'en_cours',
          timeline_technique: [
            ...currentTimeline,
            {
              timestamp: Date.now(),
              status: 'prise_en_charge',
              detail: `Prise en charge par ${collaborateurNom}`,
              utilisateur: collaborateurNom
            }
          ],
          date_derniere_maj: now.toISOString()
        });
        console.log('✅ SuiviInventaire synchronisé (prise en charge TECHNIQUE)');
      }
    }
    
  };

  const handlePhotoAvantUploaded = async (photoData) => {
    if (!incidentForPhoto) return;

    const now = new Date();
    const tempsPriseEnCharge = incidentForPhoto.date_saisie ? differenceInMinutes(now, new Date(incidentForPhoto.date_saisie)) : 0;

    await base44.entities.InterventionLog.create({
      incident_id: incidentForPhoto.id,
      action: 'prise_en_charge',
      horodatage: now.toISOString(),
      utilisateur: collaborateurNom,
      commentaire: 'Intervention prise en charge avec photo AVANT'
    });

    updateMutation.mutate({
      id: incidentForPhoto.id,
      data: {
        pris_par: collaborateurNom,
        date_debut: now.toISOString(),
        statut: 'en_cours',
        temps_prise_en_charge: tempsPriseEnCharge,
        photo_avant_url: photoData.url,
        photo_avant_timestamp: photoData.timestamp,
        photo_avant_hash: photoData.hash
      },
      isWorkItem: incidentForPhoto.isWorkItem,
      workItemId: incidentForPhoto.workItemId
    });

    await pushClientEvent({
      incident: incidentForPhoto,
      type: 'PRISE_EN_CHARGE',
      message: "L'intervention technique a commencé."
    });

    await notifyBureau(`Intervention prise en charge par ${collaborateurNom} (avec photo)`);
    setIncidentForPhoto(null);
  };

  const handleTerminer = async (incident) => {
    if (isPhotoRequired(incident.categorie)) {
      setIncidentForPhoto(incident);
      setShowPhotoApres(true);
      return;
    }

    toast.loading(lang === 'fr' ? 'Clôture...' : 'Closing...', { id: 'terminer' });
    
    try {
      await terminerSansPhoto(incident);
      toast.dismiss('terminer');
    } catch (error) {
      toast.dismiss('terminer');
      toast.error(lang === 'fr' ? 'Erreur de clôture' : 'Closing error');
    }
  };

  const terminerSansPhoto = async (incident) => {
    const now = new Date();
    const tempsTotal = incident.date_saisie ? differenceInMinutes(now, new Date(incident.date_saisie)) : 0;

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: 'resolu',
      horodatage: now.toISOString(),
      utilisateur: incident.pris_par || collaborateurNom,
      commentaire: 'Intervention résolue'
    });

    updateMutation.mutate({
      id: incident.id,
      data: {
        date_resolution: now.toISOString(),
        statut: 'resolu',
        commentaire_interne: commentaire || incident.commentaire_interne,
        temps_total_intervention: tempsTotal
      },
      isWorkItem: incident.isWorkItem,
      workItemId: incident.workItemId
    });

    await pushClientEvent({
      incident,
      type: 'TERMINEE',
      message: "Intervention technique clôturée."
    });

    await notifyBureau(`Intervention clôturée (${incident.logement || incident.emplacement})`);
    
    await base44.entities.HistoriqueEvent.create({
      type_event: 'INTERVENTION_CLOTUREE',
      titre: `Intervention cloturee - ${incident.logement || incident.emplacement}`,
      description: `${incident.pris_par || collaborateurNom} - ${incident.categorie} - ${tempsTotal}min`,
      service: 'TECHNIQUE',
      hebergement: incident.logement || incident.emplacement,
      client_nom: incident.client_nom,
      client_prenom: incident.client_prenom,
      collaborateur: incident.pris_par || collaborateurNom,
      urgent: incident.urgent,
      metadata: { duree_minutes: tempsTotal },
      incident_id: incident.id,
      intervention_client_id: incident.isInterventionClient ? incident.id : null
    });

    // Synchroniser vers SuiviInventaire (visibilité client)
    if (incident.fiche_arrivee_id) {
      const suivis = await base44.entities.SuiviInventaire.filter({
        fiche_arrivee_id: incident.fiche_arrivee_id
      });
      
      if (suivis.length > 0) {
        const suivi = suivis[0];
        const currentTimeline = suivi.timeline_technique || [];
        
        await base44.entities.SuiviInventaire.update(suivi.id, {
          statut_technique: 'termine',
          timeline_technique: [
            ...currentTimeline,
            {
              timestamp: Date.now(),
              status: 'intervention_terminee',
              detail: 'Problème résolu',
              utilisateur: incident.pris_par || collaborateurNom
            }
          ],
          message_client: 'Votre demande technique a été traitée avec succès !',
          date_derniere_maj: now.toISOString()
        });
        console.log('✅ SuiviInventaire synchronisé (clôture TECHNIQUE)');
      }
    }
    
    setCommentaire('');
  };

  const handlePhotoApresUploaded = async (photoData) => {
    if (!incidentForPhoto) return;

    const now = new Date();
    const tempsTotal = incidentForPhoto.date_saisie ? differenceInMinutes(now, new Date(incidentForPhoto.date_saisie)) : 0;

    await base44.entities.InterventionLog.create({
      incident_id: incidentForPhoto.id,
      action: 'resolu',
      horodatage: now.toISOString(),
      utilisateur: incidentForPhoto.pris_par || collaborateurNom,
      commentaire: 'Intervention résolue avec photo APRES'
    });

    updateMutation.mutate({
      id: incidentForPhoto.id,
      data: {
        date_resolution: now.toISOString(),
        statut: 'resolu',
        commentaire_interne: commentaire || incidentForPhoto.commentaire_interne,
        temps_total_intervention: tempsTotal,
        photo_apres_url: photoData.url,
        photo_apres_timestamp: photoData.timestamp,
        photo_apres_hash: photoData.hash
      },
      isWorkItem: incidentForPhoto.isWorkItem,
      workItemId: incidentForPhoto.workItemId
    });

    await pushClientEvent({
      incident: incidentForPhoto,
      type: 'TERMINEE',
      message: "Intervention technique clôturée."
    });

    await notifyBureau(`Intervention clôturée avec photo (${incidentForPhoto.logement || incidentForPhoto.emplacement})`);
    setIncidentForPhoto(null);
    setCommentaire('');
  };

  const handleMettreEnAttente = (incident) => {
    setIncidentToWait(incident);
    setShowAttenteDialog(true);
  };

  const confirmMettreEnAttente = async (formData) => {
    if (!incidentToWait) return;

    updateMutation.mutate({
      id: incidentToWait.id,
      data: {
        statut: 'en_attente_materiel',
        attente_raison: formData.raison,
        motif_attente: formData.motifAttente,
        attente_materiel: formData.materiel,
        attente_materiel_detail: formData.materielDetail,
        attente_delai: formData.delai,
        attente_commentaire: formData.commentaire,
        attente_date: new Date().toISOString()
      },
      isWorkItem: incidentToWait.isWorkItem,
      workItemId: incidentToWait.workItemId
    });

    await pushClientEvent({
      incident: incidentToWait,
      type: 'EN_ATTENTE',
      message: "Intervention temporairement en attente.",
      attenteRaison: formData.raison,
      delaiEstime: formData.delai
    });

    await notifyBureau(`Intervention en attente - ${formData.raison} (${incidentToWait.logement})`);
    
    await base44.entities.HistoriqueEvent.create({
      type_event: 'INTERVENTION_MISE_EN_ATTENTE',
      titre: `Intervention mise en attente - ${incidentToWait.logement || incidentToWait.emplacement}`,
      description: `${formData.raison} - ${formData.motifAttente}`,
      service: 'TECHNIQUE',
      hebergement: incidentToWait.logement || incidentToWait.emplacement,
      client_nom: incidentToWait.client_nom,
      client_prenom: incidentToWait.client_prenom,
      collaborateur: incidentToWait.pris_par,
      urgent: incidentToWait.urgent,
      metadata: { raison: formData.raison, delai: formData.delai },
      incident_id: incidentToWait.id,
      intervention_client_id: incidentToWait.isInterventionClient ? incidentToWait.id : null
    });

    // Synchroniser vers SuiviInventaire (visibilité client)
    if (incidentToWait.fiche_arrivee_id) {
      const suivis = await base44.entities.SuiviInventaire.filter({
        fiche_arrivee_id: incidentToWait.fiche_arrivee_id
      });
      
      if (suivis.length > 0) {
        const suivi = suivis[0];
        const currentTimeline = suivi.timeline_technique || [];
        
        const messageClient = formData.delai ? 
          `Intervention reportée. Délai estimé: ${formData.delai}` : 
          'Intervention en attente';
        
        await base44.entities.SuiviInventaire.update(suivi.id, {
          statut_technique: 'en_attente_materiel',
          timeline_technique: [
            ...currentTimeline,
            {
              timestamp: Date.now(),
              status: 'en_attente',
              detail: `En attente: ${formData.raison}`,
              utilisateur: incidentToWait.pris_par || ''
            }
          ],
          message_client: messageClient,
          date_derniere_maj: new Date().toISOString()
        });
        console.log('✅ SuiviInventaire synchronisé (mise en attente TECHNIQUE)');
      }
    }

    setShowAttenteDialog(false);
    setIncidentToWait(null);
  };

  const handleReprendre = async (incident) => {
    updateMutation.mutate({
      id: incident.id,
      data: { statut: 'en_cours' },
      isWorkItem: incident.isWorkItem,
      workItemId: incident.workItemId
    });

    await pushClientEvent({
      incident,
      type: 'REPRISE',
      message: "L'intervention a repris."
    });

    await notifyBureau(`Intervention reprise (${incident.logement || incident.emplacement})`);
    toast.success(lang === 'fr' ? 'Intervention reprise' : 'Intervention resumed');
  };

  // CLÔTURE EN CASCADE D'UNE MISSION REGROUPÉE
  const handleCloturerMission = async (missionGroup) => {
    if (!missionGroup.workItems || missionGroup.workItems.length === 0) return;
    
    const confirmText = lang === 'fr' 
      ? `Confirmer la clôture de ${missionGroup.workItems.length} intervention(s) ?`
      : `Confirm closure of ${missionGroup.workItems.length} intervention(s)?`;
    
    if (!window.confirm(confirmText)) return;
    
    toast.loading(lang === 'fr' ? 'Clôture en cours...' : 'Closing...', { id: 'cloture-mission' });
    
    try {
      const now = new Date();
      const intervenant = collaborateurNom || missionGroup.pris_par || 'Agent';
      
      // Clôturer tous les WorkItems du groupe
      for (const wi of missionGroup.workItems) {
        const tempsTotal = wi.date_saisie ? differenceInMinutes(now, new Date(wi.date_saisie)) : 0;
        
        await base44.entities.WorkItem.update(wi.workItemId, {
          statut: 'TERMINEE',
          date_terminee: now.toISOString(),
          duree_minutes: tempsTotal
        });
        
        await base44.entities.InterventionLog.create({
          incident_id: wi.id,
          action: 'resolu',
          horodatage: now.toISOString(),
          utilisateur: intervenant,
          commentaire: 'Clôturé via mission regroupée'
        });
        
        // Event client
        await pushClientEvent({
          incident: wi,
          type: 'TERMINEE',
          message: "Intervention technique clôturée."
        });
      }
      
      // Générer le rapport de passage
      const interventionsDetail = missionGroup.workItems.map(wi => {
        const tache = wi.taches?.[0];
        const catInfo = getCategoryInfo(tache?.objet_id || wi.categorie || 'divers_technique');
        return {
          workitem_id: wi.workItemId,
          categorie: tache?.objet_id || wi.categorie || 'divers_technique',
          description: tache?.texte || wi.description,
          urgent: wi.urgent,
          emoji: catInfo.emoji
        };
      });
      
      const rapport = await base44.entities.ServiceReport.create({
        service: 'TECHNIQUE',
        logement: missionGroup.logement || missionGroup.emplacement,
        type_hebergement: missionGroup.type_hebergement || '',
        client_nom: missionGroup.client_nom,
        client_prenom: missionGroup.client_prenom,
        fiche_arrivee_id: missionGroup.fiche_arrivee_id,
        date_intervention: now.toISOString(),
        intervenant,
        workitems_ids: missionGroup.workItems.map(wi => wi.workItemId),
        interventions_detail: interventionsDetail,
        mission_urgente: missionGroup.urgent,
        duree_totale_minutes: missionGroup.workItems.reduce((sum, wi) => {
          const duree = wi.date_saisie ? differenceInMinutes(now, new Date(wi.date_saisie)) : 0;
          return sum + duree;
        }, 0),
        visible_client: true,
        visible_bureau: true
      });
      
      await notifyBureau(`Mission clôturée - ${missionGroup.logement} - ${missionGroup.workItems.length} intervention(s)`);
      
      await base44.entities.HistoriqueEvent.create({
        type_event: 'INTERVENTION_CLOTUREE',
        titre: `Mission technique clôturée - ${missionGroup.logement}`,
        description: `${intervenant} - ${missionGroup.workItems.length} intervention(s)`,
        service: 'TECHNIQUE',
        hebergement: missionGroup.logement,
        client_nom: missionGroup.client_nom,
        client_prenom: missionGroup.client_prenom,
        collaborateur: intervenant,
        urgent: missionGroup.urgent,
        metadata: { rapport_id: rapport.id, nb_interventions: missionGroup.workItems.length }
      });
      
      queryClient.invalidateQueries({ queryKey: ['workitems-technique'] });
      queryClient.invalidateQueries({ queryKey: ['incidents-technique'] });
      
      toast.dismiss('cloture-mission');
      toast.success(lang === 'fr' ? 'Mission clôturée avec succès' : 'Mission closed successfully');
      
    } catch (error) {
      toast.dismiss('cloture-mission');
      toast.error(lang === 'fr' ? 'Erreur lors de la clôture' : 'Error closing mission');
      console.error(error);
    }
  };

  const getPriorityType = (incident) => {
    if (incident.urgent) return 'urgent';
    if (incident.autorisation_acces === 'non' && incident.plage_horaire_client) return 'plage_horaire';
    return 'normal';
  };

  const sortByPriority = (a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    if (a.statut === 'resolu' && b.statut !== 'resolu') return 1;
    if (a.statut !== 'resolu' && b.statut === 'resolu') return -1;
    return new Date(a.date_saisie) - new Date(b.date_saisie);
  };

  const collaborateurs = [...new Set(incidents.map(i => i.pris_par).filter(Boolean))];

  // Fonction de regroupement VISUEL des WorkItems avec PRIORISATION
  const groupWorkItems = (items) => {
    const groups = {};
    
    items.forEach(item => {
      // Clé de regroupement: service + logement + date + client + statut
      const dateKey = item.date_saisie ? new Date(item.date_saisie).toISOString().split('T')[0] : 'no-date';
      const groupKey = `${item.type}_${item.logement || item.emplacement}_${dateKey}_${item.client_nom}_${item.client_prenom}_${item.statut}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          type: item.type,
          logement: item.logement,
          emplacement: item.emplacement,
          client_nom: item.client_nom,
          client_prenom: item.client_prenom,
          date_saisie: item.date_saisie,
          date_arrivee: item.date_arrivee,
          date_depart: item.date_depart,
          statut: item.statut,
          urgent: false,
          autorisation_acces: item.autorisation_acces,
          plage_horaire_client: item.plage_horaire_client,
          pris_par: item.pris_par,
          date_debut: item.date_debut,
          date_resolution: item.date_resolution,
          fiche_arrivee_id: item.fiche_arrivee_id,
          type_hebergement: item.type_hebergement,
          isGrouped: true,
          workItems: []
        };
      }
      
      // Ajouter au groupe
      groups[groupKey].workItems.push(item);
      
      // Propager l'urgence si au moins 1 urgent
      if (item.urgent) groups[groupKey].urgent = true;
      
      // Prendre la date de début la plus ancienne
      if (item.date_debut && (!groups[groupKey].date_debut || item.date_debut < groups[groupKey].date_debut)) {
        groups[groupKey].date_debut = item.date_debut;
      }
      
      // Prendre le collaborateur du premier item
      if (!groups[groupKey].pris_par && item.pris_par) {
        groups[groupKey].pris_par = item.pris_par;
      }
      
      // Conserver fiche_arrivee_id et type_hebergement
      if (!groups[groupKey].fiche_arrivee_id && item.fiche_arrivee_id) {
        groups[groupKey].fiche_arrivee_id = item.fiche_arrivee_id;
      }
      if (!groups[groupKey].type_hebergement && item.type_hebergement) {
        groups[groupKey].type_hebergement = item.type_hebergement;
      }
    });
    
    // PRIORISATION : urgent d'abord, puis date la plus ancienne
    return Object.values(groups).sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(a.date_saisie) - new Date(b.date_saisie);
    });
  };

  // GARDE ANTI-ORPHELINS : filtrer WorkItems sans lien ou supprimés
  const safeWorkItemsTechnique = workItemsTechnique.filter(wi =>
    wi.intervention_client_id &&
    wi.statut !== 'SUPPRIME'
  );

  // Conversion des WorkItems en format compatible Incident
  const convertedWorkItems = safeWorkItemsTechnique
    .filter(wi => {
      const statutMapping = {
        'A_FAIRE': 'en_attente',
        'EN_COURS': 'en_cours',
        'EN_ATTENTE': 'en_attente_materiel',
        'TERMINEE': 'resolu'
      };
      const mappedStatut = statutMapping[wi.statut] || 'en_attente';
      if (filter !== 'tous' && mappedStatut !== filter) return false;
      return true;
    })
    .map(wi => ({
      id: wi.id,
      type: 'technique',
      categorie: 'divers_technique',
      description: wi.description,
      urgent: wi.priorite === 'URGENTE',
      client_nom: wi.client_nom,
      client_prenom: wi.client_prenom,
      logement: wi.hebergement,
      emplacement: null,
      date_saisie: wi.created_date,
      date_arrivee: wi.date_arrivee,
      date_depart: wi.date_depart,
      pris_par: wi.collaborateur,
      date_debut: wi.date_prise_en_charge,
      date_resolution: wi.date_terminee,
      statut: wi.statut === 'A_FAIRE' ? 'en_attente' : 
              wi.statut === 'EN_COURS' ? 'en_cours' :
              wi.statut === 'EN_ATTENTE' ? 'en_attente_materiel' : 'resolu',
      autorisation_acces: wi.autorisation_acces,
      plage_horaire_client: wi.plages_horaires?.join(', '),
      commentaire_interne: '',
      motif_attente: '',
      intervention_id: wi.intervention_client_id,
      fiche_arrivee_id: wi.fiche_arrivee_id,
      isWorkItem: true,
      workItemId: wi.id,
      taches: wi.taches || []
    }));

  // Convertir les MissionDirection en format compatible
  const convertedMissionsDirection = missionsDirectionGlobal
    .filter(m => {
      // Inclure missions qui ont des intervenants TECHNIQUE dans services_intervenants
      return m.services_intervenants?.some(s => s.service === 'TECHNIQUE') || false;
    })
    .map(m => ({
      id: m.id,
      type: 'technique',
      categorie: 'divers_technique',
      description: `[MISSION DIRECTION] ${m.type_mission}: ${m.titre}`,
      urgent: m.priorite === 'URGENTE' || m.priorite === 'CRITIQUE',
      client_nom: '',
      client_prenom: '',
      logement: m.zones?.[0]?.numero || (lang === 'fr' ? 'Multi-zones' : 'Multi-zones'),
      emplacement: null,
      date_saisie: m.date_creation || m.created_date,
      date_arrivee: null,
      date_depart: null,
      pris_par: m.services_intervenants?.find(s => s.service === 'TECHNIQUE')?.agent || '',
      date_debut: m.date_debut_reelle,
      date_resolution: m.date_fin_reelle,
      statut: m.statut === 'A_FAIRE' ? 'en_attente' :
              m.statut === 'EN_COURS' ? 'en_cours' :
              m.statut === 'EN_ATTENTE' ? 'en_attente_materiel' :
              m.statut === 'TERMINEE' ? 'resolu' : 'en_attente',
      autorisation_acces: 'oui',
      plage_horaire_client: null,
      commentaire_interne: m.commentaire_direction || '',
      motif_attente: '',
      intervention_id: null,
      fiche_arrivee_id: null,
      isMissionDirection: true,
      missionDirectionData: m
    }));

  // Regrouper visuellement les WorkItems
  const groupedWorkItems = groupWorkItems(convertedWorkItems);
  
  // Combiner incidents, groupes WorkItems et missions Direction
  const allIncidents = [...incidents, ...groupedWorkItems, ...convertedMissionsDirection];

  const filteredIncidents = allIncidents
    .filter(i => {
      // Filtre statut
      if (filter !== 'tous' && i.statut !== filter) return false;
      
      // Filtre catégorie
      if (filterCategorie !== 'tous' && i.categorie !== filterCategorie) return false;
      
      // Filtre collaborateur
      if (filterCollaborateur !== 'tous' && i.pris_par !== filterCollaborateur) return false;
      
      // Filtre date début
      if (filterDateDebut && i.date_saisie) {
        const dateSignalement = new Date(i.date_saisie).toISOString().split('T')[0];
        if (dateSignalement < filterDateDebut) return false;
      }
      
      // Filtre date fin
      if (filterDateFin && i.date_saisie) {
        const dateSignalement = new Date(i.date_saisie).toISOString().split('T')[0];
        if (dateSignalement > filterDateFin) return false;
      }
      
      // Recherche textuelle
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const logement = (i.logement || i.emplacement || '').toLowerCase();
        const client = `${i.client_prenom} ${i.client_nom}`.toLowerCase();
        if (!logement.includes(query) && !client.includes(query)) return false;
      }
      
      return true;
    })
    .sort(sortByPriority);

  const getCategoryInfo = (cat) => {
    const info = categoryIcons[cat] || { emoji: '🔧', label: 'autres' };
    return { ...info, label: t(info.label) };
  };

  const getStatusBadge = (statut) => {
    const badges = {
      en_attente: <Badge className="bg-[#FFA500] text-white">{t('en_attente')}</Badge>,
      en_cours: <Badge className="bg-[#00AEEF] text-white">{t('en_cours')}</Badge>,
      en_attente_materiel: <Badge className="bg-gray-500 text-white"><Clock className="w-3 h-3 mr-1" />{t('en_attente_materiel')}</Badge>,
      resolu: <Badge className="bg-green-500 text-white">{t('resolu')}</Badge>
    };
    return badges[statut] || <Badge>{statut}</Badge>;
  };

  return (
    <div className="min-h-screen pb-8">
      <OfflineBanner />

      <div className="bg-[#00AEEF] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-heading text-xl">{t('menu_technique')}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(createPageUrl('MenuCollaborateur'))} className="p-2 hover:bg-white/20 rounded-lg">
              <Home className="w-6 h-6" />
            </button>
            <CollaborateurNotificationBell />
            <Wrench className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Panneau notifications */}
        <div className="mb-6">
          <NotificationsPanelCollab service="TECHNIQUE" />
        </div>

        <ServiceTabs
          service="TECHNIQUE"
          interventionsCount={allIncidents.filter(i => i.statut === 'en_attente').length}
          missionsCount={missionsDirection.filter(m => m.statut === 'A_FAIRE').length}
          lang={lang}
          interventionsContent={
            <>
              {/* Barre de recherche */}
              <div className="mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'fr' ? "🔍 Rechercher par logement ou client..." : "🔍 Search by accommodation or guest..."}
            className="w-full border-2 border-[#00AEEF]/30 rounded-xl"
          />
        </div>

        {/* Filtres rapides statut */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['en_attente', 'en_cours', 'en_attente_materiel', 'resolu'].map((s) => (
            <Button
              key={s}
              onClick={() => setFilter(s)}
              variant={filter === s ? 'default' : 'outline'}
              className={filter === s ? 'bg-[#00AEEF]' : ''}
            >
              {t(s)} ({allIncidents.filter(i => i.statut === s).length})
            </Button>
          ))}
        </div>

        {/* Bouton filtres avancés */}
        <div className="mb-4">
          <Button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            variant="outline"
            className="w-full"
          >
            {showAdvancedFilters ? '▼' : '▶'} {lang === 'fr' ? 'Filtres avancés' : 'Advanced filters'}
          </Button>
        </div>

        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <Card className="mb-6 border-2 border-[#00AEEF]/30">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Filtre catégorie */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    {lang === 'fr' ? 'Catégorie' : 'Category'}
                  </label>
                  <select
                    value={filterCategorie}
                    onChange={(e) => setFilterCategorie(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="tous">{lang === 'fr' ? 'Toutes' : 'All'}</option>
                    {Object.keys(categoryIcons).map(cat => (
                      <option key={cat} value={cat}>{categoryIcons[cat].emoji} {t(categoryIcons[cat].label)}</option>
                    ))}
                  </select>
                </div>

                {/* Filtre collaborateur */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    {lang === 'fr' ? 'Collaborateur' : 'Staff'}
                  </label>
                  <select
                    value={filterCollaborateur}
                    onChange={(e) => setFilterCollaborateur(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="tous">{lang === 'fr' ? 'Tous' : 'All'}</option>
                    {collaborateurs.map(collab => (
                      <option key={collab} value={collab}>{collab}</option>
                    ))}
                  </select>
                </div>

                {/* Date début */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    {lang === 'fr' ? 'Du' : 'From'}
                  </label>
                  <Input
                    type="date"
                    value={filterDateDebut}
                    onChange={(e) => setFilterDateDebut(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Date fin */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">
                    {lang === 'fr' ? 'Au' : 'To'}
                  </label>
                  <Input
                    type="date"
                    value={filterDateFin}
                    onChange={(e) => setFilterDateFin(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Bouton réinitialiser */}
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategorie('tous');
                  setFilterCollaborateur('tous');
                  setFilterDateDebut('');
                  setFilterDateFin('');
                  setFilter('en_attente');
                }}
                variant="outline"
                className="w-full"
              >
                {lang === 'fr' ? '🔄 Réinitialiser les filtres' : '🔄 Reset filters'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-[#00AEEF] mx-auto mb-4" />
            <p className="font-heading text-[#0077A8]">{t('aucun')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => {
              const catInfo = getCategoryInfo(incident.categorie);
              const priorityType = getPriorityType(incident);
              const isGrouped = incident.isGrouped && incident.workItems?.length > 1;

              return (
                <motion.div key={incident.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card
                    className={`border-2 rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                      priorityType === 'urgent' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedIncident(isGrouped ? incident.workItems[0] : incident)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{isGrouped ? '📦' : catInfo.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-heading text-[#0077A8]">{incident.logement || incident.emplacement}</span>
                              {isGrouped && (
                                <Badge className="bg-[#00AEEF] text-white text-xs">
                                  {incident.workItems.length} interventions
                                </Badge>
                              )}
                              {incident.urgent && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />⚠️ Urgent
                                </Badge>
                              )}
                            </div>
                            {!isGrouped && <p className="text-sm font-body text-gray-600">{catInfo.label}</p>}
                          </div>
                        </div>
                        {getStatusBadge(incident.statut)}
                      </div>

                      {isGrouped ? (
                        <>
                          <div className="space-y-2 mb-3">
                            {incident.workItems.map((wi, idx) => {
                              const tache = wi.taches?.[0];
                              const tacheLabel = tache ? tache.texte : wi.description;
                              return (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                  <span className="text-lg">{tache?.objet_id ? getCategoryInfo(tache.objet_id).emoji : '🔧'}</span>
                                  <span className="font-body text-gray-700 flex-1 line-clamp-1">{tacheLabel}</span>
                                </div>
                              );
                            })}
                          </div>
                          {incident.statut === 'en_cours' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloturerMission(incident);
                              }}
                              className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {lang === 'fr' ? 'Clôturer la mission' : 'Close mission'}
                            </Button>
                          )}
                        </>
                      ) : (
                        <p className="font-body text-gray-700 mb-3 line-clamp-2">{incident.description}</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 font-body mt-3">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {incident.client_prenom} {incident.client_nom}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM HH:mm', { locale: fr })}
                        </div>
                      </div>

                      {incident.autorisation_acces && (
                        <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          incident.autorisation_acces === 'oui' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {incident.autorisation_acces === 'oui' ? (
                            <><UserCheck className="w-3 h-3" />{t('acces_autorise')}</>
                          ) : (
                            <><DoorOpen className="w-3 h-3" />{t('acces_non_autorise')}</>
                          )}
                        </div>
                      )}

                      {incident.pris_par && (incident.statut === 'en_cours' || incident.statut === 'resolu') && (
                        <div className="mt-2 pt-2 border-t flex items-center justify-between">
                          <p className="text-xs text-[#00AEEF]">{t('pris_en_charge_par')}: {incident.pris_par}</p>
                          {incident.date_debut && (
                            <InterventionTimer 
                              startTime={incident.date_debut} 
                              endTime={incident.date_resolution}
                              isActive={incident.statut === 'en_cours'} 
                            />
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
            </>
          }
          missionsContent={
            <WorkItemsServiceView service="TECHNIQUE" />
          }
        />
      </div>

      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <span className="text-2xl">{selectedIncident && getCategoryInfo(selectedIncident.categorie).emoji}</span>
              {t('interventions')} #{selectedIncident?.logement || selectedIncident?.emplacement}
            </DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <div className="bg-[#e6f7ff] rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#0077A8]/70 font-body">{t('client_label')}</span>
                  <span className="font-heading text-[#0077A8]">{selectedIncident.client_prenom} {selectedIncident.client_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0077A8]/70 font-body">{t('date_signalement')}</span>
                  <span className="font-body text-[#0077A8]">
                    {selectedIncident.date_saisie && format(new Date(selectedIncident.date_saisie), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8]">{t('description')}</label>
                <p className="font-body text-gray-700 bg-gray-50 p-3 rounded-xl mt-1">{selectedIncident.description}</p>
              </div>

              {selectedIncident.statut === 'en_attente' && (
                <div className="space-y-3 pt-4 border-t">
                  <Input
                    value={collaborateurNom}
                    onChange={(e) => setCollaborateurNom(e.target.value)}
                    placeholder={t('votre_nom')}
                    className="border-[#00AEEF]/30 rounded-xl"
                  />
                  <Button
                    onClick={() => handlePrendreEnCharge(selectedIncident)}
                    disabled={!collaborateurNom.trim() || updateMutation.isPending}
                    className="w-full bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t('prendre_en_charge')}
                  </Button>
                </div>
              )}

              {selectedIncident.statut === 'en_cours' && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#00AEEF]">{t('pris_en_charge_par')}: {selectedIncident.pris_par}</p>
                    <InterventionTimer 
                      startTime={selectedIncident.date_debut} 
                      endTime={selectedIncident.date_resolution}
                      isActive 
                    />
                  </div>
                  <Textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder={t('commentaire_optionnel')}
                    className="border-[#00AEEF]/30 rounded-xl"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleMettreEnAttente(selectedIncident)} variant="outline">
                      <Pause className="w-4 h-4 mr-2" />{t('mettre_en_attente')}
                    </Button>
                    <Button onClick={() => handleTerminer(selectedIncident)} className="bg-green-500 hover:bg-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />{t('terminer')}
                    </Button>
                  </div>
                </div>
              )}

              {selectedIncident.statut === 'en_attente_materiel' && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="bg-[#FFA500]/10 p-4 rounded-xl border border-[#FFA500]/30">
                    <p className="text-sm font-heading text-[#FFA500] mb-2">⏳ {t('intervention_en_attente')}</p>
                    <p className="font-body text-gray-700"><strong>{t('motif_label')} :</strong> {selectedIncident.motif_attente}</p>
                  </div>
                  <Button onClick={() => handleReprendre(selectedIncident)} className="w-full bg-[#00AEEF]">
                    <Play className="w-4 h-4 mr-2" />{t('reprendre')}
                  </Button>
                </div>
              )}

              {selectedIncident.statut === 'resolu' && (
                <div className="bg-green-50 p-3 rounded-xl">
                  <p className="text-sm text-green-700">
                    {t('resolu')} - {selectedIncident.pris_par} - {selectedIncident.date_resolution && format(new Date(selectedIncident.date_resolution), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MettreEnAttenteDialog
        open={showAttenteDialog}
        onOpenChange={setShowAttenteDialog}
        onConfirm={confirmMettreEnAttente}
        isLoading={updateMutation.isPending}
      />

      <PhotoInterventionCapture
        open={showPhotoAvant}
        onOpenChange={(open) => {
          setShowPhotoAvant(open);
          if (!open) setIncidentForPhoto(null);
        }}
        type="avant"
        interventionId={incidentForPhoto?.id || ''}
        collaborateurNom={collaborateurNom}
        onPhotoUploaded={handlePhotoAvantUploaded}
      />

      <PhotoInterventionCapture
        open={showPhotoApres}
        onOpenChange={(open) => {
          setShowPhotoApres(open);
          if (!open) setIncidentForPhoto(null);
        }}
        type="apres"
        interventionId={incidentForPhoto?.id || ''}
        collaborateurNom={incidentForPhoto?.pris_par || collaborateurNom}
        onPhotoUploaded={handlePhotoApresUploaded}
      />
    </div>
  );
}