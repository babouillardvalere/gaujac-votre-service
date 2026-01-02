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
import NotificationsPanelCollab from '../components/NotificationsPanelCollab';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import {
  Clock, User, AlertTriangle, CheckCircle, Play, Pause, Camera, Home, Loader2,
  Sparkles, DoorOpen, UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

const categoryIcons = {
  literie: { emoji: '🛏️', label: 'literie' },
  vaisselle: { emoji: '🍽️', label: 'vaisselle' },
  nettoyage: { emoji: '🧽', label: 'nettoyage' },
  materiel_menage: { emoji: '🧹', label: 'menage' },
  poubelle: { emoji: '🗑', label: 'poubelle' },
  produit_manquant: { emoji: '🧴', label: 'produit_manquant' }
};

export default function Menage() {
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
    queryKey: ['incidents-menage', filter],
    queryFn: async () => {
      const query = filter === 'resolu' 
        ? { type: 'menage', statut: 'resolu' }
        : { type: 'menage' };
      return await base44.entities.Incident.filter(query, '-date_saisie', 250);
    },
    refetchInterval: filter === 'resolu' ? 120000 : 45000,
    staleTime: 30000
  });

  const { data: interventionsClients = [] } = useQuery({
    queryKey: ['interventions-clients-menage', filter],
    queryFn: async () => {
      console.log('🔍 FETCH InterventionClient MENAGE, filtre:', filter);
      const result = await base44.entities.InterventionClient.filter({ 
        service: 'MENAGE'
      }, '-created_date', 250);
      console.log('✅ InterventionClient MENAGE récupérées:', result.length, 'intervention(s)');
      result.forEach(ic => {
        console.log(`  - ID: ${ic.id}, Statut: ${ic.statut}, Type: ${ic.type_intervention}, Hébergement: ${ic.numero_hebergement}`);
      });
      return result;
    },
    refetchInterval: 30000,
    staleTime: 15000
  });

  const { data: missions = [] } = useQuery({
    queryKey: ['missions-internes', 'MENAGE'],
    queryFn: () => base44.entities.MissionInterne.filter({ service: 'MENAGE' }, '-date_debut', 250),
    refetchInterval: 60000,
    staleTime: 45000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, isInterventionClient }) => {
      if (isInterventionClient) {
        const clientData = {};
        if (data.statut) {
          const mapping = {
            'en_attente': 'A_FAIRE',
            'en_cours': 'EN_COURS',
            'en_attente_materiel': 'EN_ATTENTE',
            'resolu': 'TERMINEE'
          };
          clientData.statut = mapping[data.statut] || 'A_FAIRE';
        }
        if (data.pris_par) clientData.pris_en_charge_par = data.pris_par;
        if (data.date_debut) clientData.date_prise_en_charge = data.date_debut;
        if (data.date_resolution) clientData.date_terminee = data.date_resolution;
        if (data.temps_prise_en_charge !== undefined) clientData.temps_ecoule_minutes = data.temps_prise_en_charge;
        if (data.temps_total_intervention !== undefined) clientData.temps_ecoule_minutes = data.temps_total_intervention;
        
        return base44.entities.InterventionClient.update(id, clientData);
      }
      return base44.entities.Incident.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-menage'] });
      queryClient.invalidateQueries({ queryKey: ['interventions-clients-menage'] });
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

    toast.loading(lang === 'fr' ? 'Prise en charge...' : 'Taking over...', { id: 'prise-charge' });
    
    try {
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
      isInterventionClient: incident.isInterventionClient
    });

    await pushClientEvent({
      incident,
      type: 'PRISE_EN_CHARGE',
      message: "L'équipe ménage est en cours d'intervention."
    });

    await notifyBureau(`Intervention ménage prise en charge par ${collaborateurNom} - ${incident.logement || incident.emplacement}`);
      toast.dismiss('prise-charge');
    } catch (error) {
      toast.dismiss('prise-charge');
      toast.error(lang === 'fr' ? 'Erreur de prise en charge' : 'Take over error');
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
      isInterventionClient: incidentForPhoto.isInterventionClient
    });

    await pushClientEvent({
      incident: incidentForPhoto,
      type: 'PRISE_EN_CHARGE',
      message: "L'équipe ménage est en cours d'intervention."
    });

    await notifyBureau(`Intervention ménage prise en charge par ${collaborateurNom} (avec photo)`);
    setIncidentForPhoto(null);
  };

  const handleTerminer = async (incident) => {
    toast.loading(lang === 'fr' ? 'Clôture...' : 'Closing...', { id: 'terminer' });
    
    try {
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
      isInterventionClient: incident.isInterventionClient
    });

    await pushClientEvent({
      incident,
      type: 'TERMINEE',
      message: "L'intervention ménage est terminée."
    });

    await notifyBureau(`Intervention ménage clôturée (${incident.logement || incident.emplacement})`);
      setCommentaire('');
      toast.dismiss('terminer');
    } catch (error) {
      toast.dismiss('terminer');
      toast.error(lang === 'fr' ? 'Erreur de clôture' : 'Closing error');
    }
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
      isInterventionClient: incidentForPhoto.isInterventionClient
    });

    await pushClientEvent({
      incident: incidentForPhoto,
      type: 'TERMINEE',
      message: "L'intervention ménage est terminée."
    });

    await notifyBureau(`Intervention ménage clôturée avec photo (${incidentForPhoto.logement || incidentForPhoto.emplacement})`);
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
      isInterventionClient: incidentToWait.isInterventionClient
    });

    await pushClientEvent({
      incident: incidentToWait,
      type: 'EN_ATTENTE',
      message: "Intervention ménage en attente.",
      attenteRaison: formData.raison,
      delaiEstime: formData.delai
    });

    await notifyBureau(`Intervention ménage en attente - ${formData.raison} (${incidentToWait.logement})`);

    setShowAttenteDialog(false);
    setIncidentToWait(null);
  };

  const handleReprendre = async (incident) => {
    updateMutation.mutate({
      id: incident.id,
      data: { statut: 'en_cours' },
      isInterventionClient: incident.isInterventionClient
    });

    await pushClientEvent({
      incident,
      type: 'REPRISE',
      message: "L'équipe ménage a repris l'intervention."
    });

    await notifyBureau(`Intervention ménage reprise (${incident.logement || incident.emplacement})`);
    toast.success(lang === 'fr' ? 'Intervention reprise' : 'Intervention resumed');
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

  // Conversion des InterventionClient en format compatible Incident
  const convertedInterventionsClients = interventionsClients
    .filter(ic => {
      const statutMapping = {
        'A_FAIRE': 'en_attente',
        'EN_COURS': 'en_cours',
        'EN_ATTENTE': 'en_attente_materiel',
        'TERMINEE': 'resolu'
      };
      const mappedStatut = statutMapping[ic.statut] || 'en_attente';
      if (filter !== 'tous' && mappedStatut !== filter) return false;
      return true;
    })
    .map(ic => ({
      id: ic.id,
      type: 'menage',
      categorie: 'materiel_menage',
      description: ic.description,
      urgent: ic.priorite === 'URGENTE',
      client_nom: ic.client_nom,
      client_prenom: ic.client_prenom,
      logement: ic.numero_hebergement,
      emplacement: null,
      date_saisie: ic.created_date,
      date_arrivee: ic.date_arrivee,
      date_depart: ic.date_depart,
      pris_par: ic.pris_en_charge_par,
      date_debut: ic.date_prise_en_charge,
      date_resolution: ic.date_terminee,
      statut: ic.statut === 'A_FAIRE' ? 'en_attente' : 
              ic.statut === 'EN_COURS' ? 'en_cours' :
              ic.statut === 'EN_ATTENTE' ? 'en_attente_materiel' : 'resolu',
      autorisation_acces: ic.autorisation_acces,
      plage_horaire_client: ic.plages_horaires?.join(', '),
      commentaire_interne: '',
      motif_attente: '',
      intervention_id: ic.id,
      fiche_arrivee_id: ic.fiche_arrivee_id,
      isInterventionClient: true,
      taches: ic.taches || []
    }));

  const allIncidents = [...incidents, ...convertedInterventionsClients];

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
    const info = categoryIcons[cat] || { emoji: '🧹', label: 'menage' };
    return { ...info, label: t(info.label) };
  };

  const getStatusBadge = (statut) => {
    const badges = {
      en_attente: <Badge className="bg-[#FFA500] text-white">{t('en_attente')}</Badge>,
      en_cours: <Badge className="bg-[#FFD700] text-[#0077A8]">{t('en_cours')}</Badge>,
      en_attente_materiel: <Badge className="bg-gray-500 text-white"><Clock className="w-3 h-3 mr-1" />{t('en_attente_materiel')}</Badge>,
      resolu: <Badge className="bg-green-500 text-white">{t('resolu')}</Badge>
    };
    return badges[statut] || <Badge>{statut}</Badge>;
  };

  return (
    <div className="min-h-screen pb-8">
      <OfflineBanner />

      <div className="bg-[#FFD700] text-[#0077A8] px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-heading text-xl">{t('menu_menage')}</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(createPageUrl('MenuCollaborateur'))} className="p-2 hover:bg-white/30 rounded-lg">
              <Home className="w-6 h-6" />
            </button>
            <CollaborateurNotificationBell />
            <Sparkles className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Panneau notifications */}
        <div className="mb-6">
          <NotificationsPanelCollab service="MENAGE" />
        </div>

        <ServiceTabs
          service="MENAGE"
          interventionsCount={incidents.filter(i => i.statut === 'en_attente').length}
          missionsCount={missions.filter(m => m.statut === 'A_FAIRE').length}
          lang={lang}
          interventionsContent={
            <>
              {/* Barre de recherche */}
              <div className="mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'fr' ? "🔍 Rechercher par logement ou client..." : "🔍 Search by accommodation or guest..."}
            className="w-full border-2 border-[#FFD700]/30 rounded-xl"
          />
        </div>

        {/* Filtres rapides statut */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['en_attente', 'en_cours', 'en_attente_materiel', 'resolu'].map((s) => (
            <Button
              key={s}
              onClick={() => setFilter(s)}
              variant={filter === s ? 'default' : 'outline'}
              className={filter === s ? 'bg-[#FFD700] text-[#0077A8]' : ''}
            >
              {t(s)} ({incidents.filter(i => i.statut === s).length})
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
          <Card className="mb-6 border-2 border-[#FFD700]/30">
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
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-[#FFD700] mx-auto mb-4" />
            <p className="font-heading text-[#0077A8]">{t('aucun')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => {
              const catInfo = getCategoryInfo(incident.categorie);
              const priorityType = getPriorityType(incident);

              return (
                <motion.div key={incident.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card
                    className={`border-2 rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                      priorityType === 'urgent' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{catInfo.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-heading text-[#0077A8]">{incident.logement || incident.emplacement}</span>
                              {incident.urgent && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />Urgent
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-body text-gray-600">{catInfo.label}</p>
                          </div>
                        </div>
                        {getStatusBadge(incident.statut)}
                      </div>

                      <p className="font-body text-gray-700 mb-3 line-clamp-2">{incident.description}</p>

                      <div className="flex items-center justify-between text-xs text-gray-500 font-body">
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
                          <p className="text-xs text-[#FFD700]">{t('pris_en_charge_par')}: {incident.pris_par}</p>
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
            <MissionsDirectionService service="MENAGE" />
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
              <div className="bg-[#FFF4B2] rounded-xl p-4 space-y-2">
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
                    className="border-[#FFD700]/50 rounded-xl"
                  />
                  <Button
                    onClick={() => handlePrendreEnCharge(selectedIncident)}
                    disabled={!collaborateurNom.trim() || updateMutation.isPending}
                    className="w-full bg-[#FFD700] hover:bg-[#FFA500] text-[#0077A8] rounded-xl"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t('prendre_en_charge')}
                  </Button>
                </div>
              )}

              {selectedIncident.statut === 'en_cours' && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#FFD700]">{t('pris_en_charge_par')}: {selectedIncident.pris_par}</p>
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
                    className="border-[#FFD700]/50 rounded-xl"
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
                  <Button onClick={() => handleReprendre(selectedIncident)} className="w-full bg-[#FFD700] text-[#0077A8]">
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