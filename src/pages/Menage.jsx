import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import OfflineBanner from '../components/OfflineBanner';
import CollaborateurNotificationBell from '../components/CollaborateurNotificationBell';
import { useNotifications } from '../components/useNotifications';
import MettreEnAttenteDialog from '../components/MettreEnAttenteDialog';
import PhotoInterventionCapture from '../components/PhotoInterventionCapture';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServiceMissionDashboard from '../components/direction/ServiceMissionDashboard';
import { 
  ArrowLeft, Clock, User, CheckCircle, Play, Loader2, Sparkles, Bed, UtensilsCrossed, Pause, DoorOpen, UserCheck, Camera, Home
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';
import InterventionTimer from '../components/InterventionTimer';
import { notifierClientPriseEnCharge, notifierClientResolution } from '../components/notificationService';

const categoryIcons = {
  literie: { emoji: '🛏️', label: 'literie' },
  vaisselle: { emoji: '🍽️', label: 'vaisselle' },
  nettoyage: { emoji: '🧽', label: 'nettoyage' },
  materiel_menage: { emoji: '🧹', label: 'menage' }
};

const isPhotoRequired = () => false;

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
  const [activeTab, setActiveTab] = useState('interventions');
  const [tacheFilters, setTacheFilters] = useState({
    statut: 'tous',
    priorite: 'tous',
    tri: 'echeance'
  });

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
  }, [navigate]);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents-menage'],
    queryFn: () => base44.entities.Incident.filter({ type: 'menage' }, '-date_saisie', 200),
    refetchInterval: 30000
  });

  const { data: taches = [] } = useQuery({
    queryKey: ['taches-menage'],
    queryFn: () => base44.entities.Tache.filter({ categorie: 'menage' }, '-created_date', 100),
    refetchInterval: 30000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-menage'] });
      toast.success(t('intervention_mise_a_jour'));
      setSelectedIncident(null);
    }
  });

  const updateTacheMutation = useMutation({
    mutationFn: async ({ id, data, ancienStatut }) => {
      await base44.entities.Tache.update(id, data);
      return { id, data, ancienStatut };
    },
    onSuccess: async ({ id, data, ancienStatut }) => {
      queryClient.invalidateQueries({ queryKey: ['taches-menage'] });
      toast.success(lang === 'fr' ? 'Tâche mise à jour' : 'Task updated');
      
      // Notifier changement de statut
      if (ancienStatut && data.statut) {
        const { notifierChangementStatutTache } = await import('../components/notificationService');
        const tache = await base44.entities.Tache.filter({ id });
        if (tache.length > 0) {
          await notifierChangementStatutTache(tache[0], ancienStatut);
        }
      }
    }
  });

  const handlePrendreEnCharge = (incident) => {
    if (!collaborateurNom.trim()) {
      toast.error(t('champs_obligatoires'));
      return;
    }
    handlePrendreEnChargeSansPhoto(incident);
  };

  const handlePrendreEnChargeSansPhoto = async (incident) => {
    const now = new Date();
    const tempsPriseEnCharge = incident.date_saisie 
      ? differenceInMinutes(now, new Date(incident.date_saisie))
      : 0;
    
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
      }
    });
    
    await notifierClientPriseEnCharge(incident, collaborateurNom);
  };

  const handlePhotoAvantUploaded = async (photoData) => {
    if (!incidentForPhoto) return;
    
    const now = new Date();
    const tempsPriseEnCharge = incidentForPhoto.date_saisie 
      ? differenceInMinutes(now, new Date(incidentForPhoto.date_saisie))
      : 0;
    
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
      }
    });
    setIncidentForPhoto(null);
  };

  const handleTerminer = (incident) => {
    handleTerminerSansPhoto(incident);
  };

  const handleTerminerSansPhoto = async (incident) => {
    const now = new Date();
    const tempsTotal = incident.date_saisie 
      ? differenceInMinutes(now, new Date(incident.date_saisie))
      : 0;
    
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
      }
    });
    setCommentaire('');
    
    await notifierClientResolution(incident);
  };

  const handlePhotoApresUploaded = async (photoData) => {
    if (!incidentForPhoto) return;
    
    const now = new Date();
    const tempsTotal = incidentForPhoto.date_saisie 
      ? differenceInMinutes(now, new Date(incidentForPhoto.date_saisie))
      : 0;
    
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
      }
    });
    setIncidentForPhoto(null);
    setCommentaire('');
  };

  const handleMettreEnAttente = (incident) => {
    setIncidentToWait(incident);
    setShowAttenteDialog(true);
  };

  const confirmMettreEnAttente = (formData) => {
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
      }
    });
    setShowAttenteDialog(false);
    setIncidentToWait(null);
  };

  const getPlageHoraireStart = (plage) => {
    if (!plage) return 24;
    const match = plage.match(/(\d{2})h(\d{2})/);
    if (match) {
      return parseInt(match[1]) + parseInt(match[2]) / 60;
    }
    return 24;
  };

  const getPriorityType = (incident) => {
    if (incident.urgent) return 'urgent';
    if (incident.autorisation_acces === 'non' && incident.plage_horaire_client) return 'plage_horaire';
    return 'normal';
  };

  const sortByPriority = (a, b) => {
    if ((a.priorite_bureau || 0) !== (b.priorite_bureau || 0)) {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return (b.priorite_bureau || 0) - (a.priorite_bureau || 0);
    }

    const typeA = getPriorityType(a);
    const typeB = getPriorityType(b);

    if (a.statut === 'resolu' && b.statut !== 'resolu') return 1;
    if (a.statut !== 'resolu' && b.statut === 'resolu') return -1;
    if (a.statut === 'resolu' && b.statut === 'resolu') {
      return new Date(b.date_resolution) - new Date(a.date_resolution);
    }

    if (a.statut === 'en_attente_materiel' && b.statut !== 'en_attente_materiel' && b.statut !== 'resolu') return 1;
    if (a.statut !== 'en_attente_materiel' && a.statut !== 'resolu' && b.statut === 'en_attente_materiel') return -1;

    if (typeA === 'urgent' && typeB !== 'urgent') return -1;
    if (typeA !== 'urgent' && typeB === 'urgent') return 1;
    if (typeA === 'urgent' && typeB === 'urgent') {
      return new Date(a.date_saisie) - new Date(b.date_saisie);
    }

    if (typeA === 'plage_horaire' && typeB === 'normal') {
      const plageStart = getPlageHoraireStart(a.plage_horaire_client);
      const normalHour = new Date(b.date_saisie).getHours() + new Date(b.date_saisie).getMinutes() / 60;
      if (plageStart > normalHour) return 1;
      return -1;
    }
    if (typeA === 'normal' && typeB === 'plage_horaire') {
      const plageStart = getPlageHoraireStart(b.plage_horaire_client);
      const normalHour = new Date(a.date_saisie).getHours() + new Date(a.date_saisie).getMinutes() / 60;
      if (plageStart > normalHour) return -1;
      return 1;
    }

    if (typeA === 'plage_horaire' && typeB === 'plage_horaire') {
      return getPlageHoraireStart(a.plage_horaire_client) - getPlageHoraireStart(b.plage_horaire_client);
    }

    return new Date(a.date_saisie) - new Date(b.date_saisie);
  };

  const filteredIncidents = incidents
    .filter(i => {
      if (filter === 'tous') return true;
      return i.statut === filter;
    })
    .sort(sortByPriority);

  const getCategoryInfo = (cat) => {
    const info = categoryIcons[cat] || { emoji: '🧹', label: 'menage' };
    return { ...info, label: t(info.label) };
  };

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'en_attente':
        return <Badge className="bg-[#FFA500] text-white">{t('en_attente')}</Badge>;
      case 'en_cours':
        return <Badge className="bg-[#FFD700] text-[#0077A8]">{t('en_cours')}</Badge>;
      case 'en_attente_materiel':
        return <Badge className="bg-gray-500 text-white"><Clock className="w-3 h-3 mr-1" />{t('en_attente_materiel')}</Badge>;
      case 'resolu':
        return <Badge className="bg-green-500 text-white">{t('resolu')}</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  return (
    <div className="min-h-screen pb-8" role="main" aria-label="Accueil > Collaborateur > Ménage">
      <h1 className="sr-only">Accueil > Collaborateur > Ménage</h1>
      <OfflineBanner />
      
      <div className="bg-[#FFD700] text-[#0077A8] px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-heading text-xl">{t('menu_menage')}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              className="p-2 hover:bg-white/30 rounded-lg"
              title="Retour menu collaborateur"
            >
              <Home className="w-6 h-6" />
            </button>
            <CollaborateurNotificationBell />
            <Sparkles className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="interventions">
              {lang === 'fr' ? 'Interventions' : 'Interventions'}
            </TabsTrigger>
            <TabsTrigger value="taches">
              ✅ {lang === 'fr' ? 'Tâches' : 'Tasks'} ({taches.filter(t => t.statut !== 'terminee').length})
            </TabsTrigger>
            <TabsTrigger value="missions">
              {lang === 'fr' ? 'Missions' : 'Missions'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interventions">
            <Tabs value={filter} onValueChange={setFilter} className="mb-6">
              <TabsList className="bg-[#FFF4B2] p-1 rounded-xl border border-[#FFD700]/50 w-full grid grid-cols-4">
                <TabsTrigger value="en_attente" className="rounded-lg font-heading text-xs data-[state=active]:bg-[#FFA500] data-[state=active]:text-white relative">
                  {t('en_attente')}
                  <span className="ml-1 min-w-5 h-5 inline-flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-[#E63946] text-white">
                    {incidents.filter(i => i.statut === 'en_attente').length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="en_cours" className="rounded-lg font-heading text-xs data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0077A8] relative">
                  {t('en_cours')}
                  <span className="ml-1 min-w-5 h-5 inline-flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-[#E63946] text-white">
                    {incidents.filter(i => i.statut === 'en_cours').length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="en_attente_materiel" className="rounded-lg font-heading text-xs data-[state=active]:bg-gray-500 data-[state=active]:text-white relative">
                  ⏳ {t('menu_attente')}
                  <span className="ml-1 min-w-5 h-5 inline-flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-[#E63946] text-white">
                    {incidents.filter(i => i.statut === 'en_attente_materiel').length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="resolu" className="rounded-lg font-heading text-xs data-[state=active]:bg-green-500 data-[state=active]:text-white relative">
                  {t('resolu')}
                  <span className="ml-1 min-w-5 h-5 inline-flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-[#E63946] text-white">
                    {incidents.filter(i => i.statut === 'resolu').length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

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
                  
                  const priorityStyles = {
                    urgent: 'border-red-500 bg-red-500/10',
                    plage_horaire: 'border-blue-500 bg-blue-500/10',
                    normal: 'border-yellow-500 bg-yellow-500/10'
                  };
                  
                  const origineColor = incident.origine === 'arrivee' ? 'border-l-8 border-l-green-500' : 
                                       incident.origine === 'depart' ? 'border-l-8 border-l-orange-500' : 
                                       'border-l-8 border-l-blue-500';
                  
                  return (
                    <motion.div key={incident.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className={`border-2 rounded-xl cursor-pointer hover:shadow-lg transition-all ${priorityStyles[priorityType]} ${origineColor}`} onClick={() => setSelectedIncident(incident)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{catInfo.emoji}</span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-heading text-[#0077A8]">{incident.logement || incident.emplacement}</span>
                                  {priorityType === 'urgent' && (
                                    <Badge className="bg-red-500 text-white text-xs">⚠️ Urgent</Badge>
                                  )}
                                  {priorityType === 'plage_horaire' && (
                                    <Badge className="bg-blue-500 text-white text-xs">⏰ {incident.plage_horaire_client}</Badge>
                                  )}
                                  {priorityType === 'normal' && (
                                    <Badge className="bg-yellow-500 text-black text-xs">🧹 Normal</Badge>
                                  )}
                                  {incident.origine === 'arrivee' && (
                                    <Badge className="bg-green-600 text-white text-xs">🏁 {t('date_arrivee')}</Badge>
                                  )}
                                  {incident.origine === 'depart' && (
                                    <Badge className="bg-orange-600 text-white text-xs">🚪 {t('date_depart')}</Badge>
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
                            <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-body ${
                              incident.autorisation_acces === 'oui' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {incident.autorisation_acces === 'oui' ? (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  {t('acces_autorise')}
                                </>
                              ) : (
                                <>
                                  <DoorOpen className="w-3 h-3" />
                                  {t('acces_non_autorise')}
                                  {incident.plage_horaire_client && (
                                    <span className="ml-1">— {t('plage_demandee')}: {incident.plage_horaire_client}</span>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                          {incident.pris_par && incident.statut === 'en_cours' && (
                            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                              <p className="text-xs font-body text-[#FFD700]">{t('pris_en_charge_par')}: {incident.pris_par}</p>
                              <InterventionTimer startTime={incident.date_debut} isActive={true} />
                            </div>
                          )}
                          {incident.statut === 'en_attente_materiel' && incident.motif_attente && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-xs font-body text-[#FFA500] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                ⏳ {t('motif_label')} : {incident.motif_attente}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="taches">
            <Card className="border-2 border-[#FFD700]/30 rounded-xl mb-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-heading text-[#0077A8] mb-1 block">
                      {lang === 'fr' ? 'Statut' : 'Status'}
                    </label>
                    <select
                      value={tacheFilters.statut}
                      onChange={(e) => setTacheFilters({...tacheFilters, statut: e.target.value})}
                      className="w-full px-3 py-2 border border-[#FFD700]/30 rounded-lg text-sm"
                    >
                      <option value="tous">{lang === 'fr' ? 'Tous' : 'All'}</option>
                      <option value="a_faire">⏳ {lang === 'fr' ? 'À faire' : 'To do'}</option>
                      <option value="en_cours">🔵 {lang === 'fr' ? 'En cours' : 'In progress'}</option>
                      <option value="terminee">✅ {lang === 'fr' ? 'Terminées' : 'Completed'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-heading text-[#0077A8] mb-1 block">
                      {lang === 'fr' ? 'Priorité' : 'Priority'}
                    </label>
                    <select
                      value={tacheFilters.priorite}
                      onChange={(e) => setTacheFilters({...tacheFilters, priorite: e.target.value})}
                      className="w-full px-3 py-2 border border-[#FFD700]/30 rounded-lg text-sm"
                    >
                      <option value="tous">{lang === 'fr' ? 'Toutes' : 'All'}</option>
                      <option value="urgente">🔴 {lang === 'fr' ? 'Urgente' : 'Urgent'}</option>
                      <option value="haute">⬆️ {lang === 'fr' ? 'Haute' : 'High'}</option>
                      <option value="normale">➡️ {lang === 'fr' ? 'Normale' : 'Normal'}</option>
                      <option value="basse">⬇️ {lang === 'fr' ? 'Basse' : 'Low'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-heading text-[#0077A8] mb-1 block">
                      {lang === 'fr' ? 'Trier par' : 'Sort by'}
                    </label>
                    <select
                      value={tacheFilters.tri}
                      onChange={(e) => setTacheFilters({...tacheFilters, tri: e.target.value})}
                      className="w-full px-3 py-2 border border-[#FFD700]/30 rounded-lg text-sm"
                    >
                      <option value="echeance">📅 {lang === 'fr' ? 'Échéance' : 'Deadline'}</option>
                      <option value="creation">🆕 {lang === 'fr' ? 'Date création' : 'Creation date'}</option>
                      <option value="priorite">⚡ {lang === 'fr' ? 'Priorité' : 'Priority'}</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {(() => {
                const filteredTaches = taches
                  .filter(t => {
                    if (tacheFilters.statut !== 'tous' && t.statut !== tacheFilters.statut) return false;
                    if (tacheFilters.priorite !== 'tous' && t.priorite !== tacheFilters.priorite) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    if (tacheFilters.tri === 'priorite') {
                      const prioriteOrder = { urgente: 4, haute: 3, normale: 2, basse: 1 };
                      return (prioriteOrder[b.priorite] || 2) - (prioriteOrder[a.priorite] || 2);
                    } else if (tacheFilters.tri === 'creation') {
                      return new Date(b.created_date) - new Date(a.created_date);
                    } else {
                      if (!a.date_echeance) return 1;
                      if (!b.date_echeance) return -1;
                      return new Date(a.date_echeance) - new Date(b.date_echeance);
                    }
                  });

                return filteredTaches.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-[#FFD700] mx-auto mb-4" />
                    <p className="font-heading text-[#0077A8]">{lang === 'fr' ? 'Aucune tâche trouvée' : 'No tasks found'}</p>
                  </div>
                ) : (
                  filteredTaches.map(tache => (
                  <Card key={tache.id} className="border-2 border-[#FFD700]/30 rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-heading text-[#0077A8]">{tache.titre}</h3>
                        <Badge className={
                          tache.statut === 'terminee' ? 'bg-green-500 text-white' :
                          tache.statut === 'en_cours' ? 'bg-blue-500 text-white' :
                          'bg-orange-500 text-white'
                        }>
                          {tache.statut === 'a_faire' ? (lang === 'fr' ? '⏳ À faire' : '⏳ To do') :
                           tache.statut === 'en_cours' ? (lang === 'fr' ? '🔵 En cours' : '🔵 In progress') :
                           tache.statut === 'terminee' ? (lang === 'fr' ? '✅ Terminée' : '✅ Completed') :
                           tache.statut}
                        </Badge>
                      </div>
                      {tache.description && (
                        <p className="text-sm text-gray-600 whitespace-pre-line mb-3">{tache.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tache.priorite && (
                          <Badge className={
                            tache.priorite === 'urgente' ? 'bg-red-100 text-red-700' :
                            tache.priorite === 'haute' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {tache.priorite === 'urgente' ? '🔴 Urgent' :
                             tache.priorite === 'haute' ? '⬆️ Haute' :
                             '➡️ Normale'}
                          </Badge>
                        )}
                        {tache.hebergement && (
                          <Badge variant="outline">🏠 {tache.hebergement}</Badge>
                        )}
                        {tache.date_echeance && (
                          <Badge variant="outline" className="text-xs">
                            📅 {format(new Date(tache.date_echeance), 'dd/MM à HH:mm')}
                          </Badge>
                        )}
                      </div>
                      {tache.statut !== 'terminee' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => {
                              updateTacheMutation.mutate({
                                id: tache.id,
                                data: { statut: 'en_cours', date_debut: new Date().toISOString() },
                                ancienStatut: tache.statut
                              });
                            }}
                            className="flex-1 bg-[#FFD700] hover:bg-[#FFA500] text-[#0077A8]"
                            disabled={tache.statut === 'en_cours'}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            {lang === 'fr' ? 'Commencer' : 'Start'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              updateTacheMutation.mutate({
                                id: tache.id,
                                data: { statut: 'terminee', date_fin: new Date().toISOString() },
                                ancienStatut: tache.statut
                              });
                            }}
                            className="flex-1 bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {lang === 'fr' ? 'Terminer' : 'Complete'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  ))
                );
              })()}
            </div>
          </TabsContent>

          <TabsContent value="missions">
            <ServiceMissionDashboard service="MENAGE" serviceLabel={t('menu_menage')} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <span className="text-2xl">{selectedIncident && getCategoryInfo(selectedIncident.categorie).emoji}</span>
              {t('demandes')} #{selectedIncident?.logement || selectedIncident?.emplacement}
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
                <div className="flex justify-between items-center">
                  <span className="text-[#0077A8]/70 font-body">Priorité</span>
                  {selectedIncident.urgent ? (
                    <Badge className="bg-red-500 text-white">🔴 Urgent</Badge>
                  ) : selectedIncident.autorisation_acces === 'non' && selectedIncident.plage_horaire_client ? (
                    <Badge className="bg-blue-500 text-white">🔵 Programmée</Badge>
                  ) : (
                    <Badge className="bg-yellow-500 text-black">🟡 Normal</Badge>
                  )}
                </div>
                <div className={`flex items-center gap-2 p-2 rounded-lg mt-2 ${
                  selectedIncident.autorisation_acces === 'oui' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {selectedIncident.autorisation_acces === 'oui' ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span className="font-body text-sm">{t('acces_autorise')}</span>
                    </>
                  ) : (
                    <>
                      <DoorOpen className="w-4 h-4" />
                      <span className="font-body text-sm">
                        {t('acces_non_autorise')}
                        {selectedIncident.plage_horaire_client && (
                          <span className="block text-xs mt-1">📅 {t('plage_demandee')}: {selectedIncident.plage_horaire_client}</span>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8]">{t('description')}</label>
                <p className="font-body text-gray-700 bg-gray-50 p-3 rounded-xl mt-1">{selectedIncident.description}</p>
              </div>

              {selectedIncident.photo_url && (
                <div>
                  <label className="text-sm font-heading text-[#0077A8]">{t('photo')}</label>
                  <img src={selectedIncident.photo_url} alt="Photo" className="w-full h-40 object-cover rounded-xl mt-1" />
                </div>
              )}

              {selectedIncident.photo_avant_url && (
                <div>
                  <label className="text-sm font-heading text-[#0077A8]">📸 Photo AVANT intervention</label>
                  <img src={selectedIncident.photo_avant_url} alt="Avant" className="w-full h-40 object-cover rounded-xl mt-1" />
                </div>
              )}

              {selectedIncident.photo_apres_url && (
                <div>
                  <label className="text-sm font-heading text-[#0077A8]">📸 Photo APRÈS intervention</label>
                  <img src={selectedIncident.photo_apres_url} alt="Après" className="w-full h-40 object-cover rounded-xl mt-1" />
                </div>
              )}

              {selectedIncident.commentaire_interne && (
                <div>
                  <label className="text-sm font-heading text-[#0077A8]">{t('commentaire_interne')}</label>
                  <p className="font-body text-gray-700 bg-gray-50 p-3 rounded-xl mt-1">{selectedIncident.commentaire_interne}</p>
                </div>
              )}

              {selectedIncident.statut === 'en_attente' && (
                <div className="space-y-3 pt-4 border-t">
                  <Input
                    value={collaborateurNom}
                    onChange={(e) => setCollaborateurNom(e.target.value)}
                    placeholder={t('votre_nom')}
                    className="border-[#FFD700]/50 rounded-xl font-body"
                  />
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-xs font-heading text-yellow-700 flex items-center gap-2 mb-1">
                      <Camera className="w-4 h-4" />
                      📸 Photos avant/après intervention
                    </p>
                    <p className="text-xs text-yellow-600 font-body">
                      Facultatives pour le ménage. Elles protègent votre travail et garantissent la transparence en cas de contestation.
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => handlePrendreEnCharge(selectedIncident)}
                    disabled={!collaborateurNom.trim() || updateMutation.isPending}
                    className="w-full bg-[#FFD700] hover:bg-[#FFA500] text-[#0077A8] rounded-xl font-heading"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t('prendre_en_charge')}
                  </Button>
                  
                  <Button 
                    onClick={() => { setIncidentForPhoto(selectedIncident); setShowPhotoAvant(true); }}
                    variant="outline" 
                    className="w-full border-yellow-300 text-yellow-700 rounded-xl font-body text-sm"
                    disabled={!collaborateurNom.trim()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Prendre en charge avec photo avant (recommandé)
                  </Button>
                </div>
              )}

              {selectedIncident.statut === 'en_cours' && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-body text-[#FFD700]">{t('pris_en_charge_par')}: {selectedIncident.pris_par}</p>
                    <InterventionTimer startTime={selectedIncident.date_debut} isActive={true} />
                  </div>
                  <Textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder={t('commentaire_optionnel')}
                    className="border-[#FFD700]/50 rounded-xl font-body"
                  />
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-xs text-yellow-600 font-body">
                      📸 Photo après : facultative mais recommandée pour attester de votre travail.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleMettreEnAttente(selectedIncident)} variant="outline" className="border-gray-400 text-gray-600 rounded-xl font-heading">
                      <Pause className="w-4 h-4 mr-2" />
                      {t('mettre_en_attente')}
                    </Button>
                    <Button onClick={() => handleTerminer(selectedIncident)} disabled={updateMutation.isPending} className="bg-green-500 hover:bg-green-600 rounded-xl font-heading">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('terminer')}
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={() => { setIncidentForPhoto(selectedIncident); setShowPhotoApres(true); }}
                    variant="outline" 
                    className="w-full border-yellow-300 text-yellow-700 rounded-xl font-body text-sm"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Terminer avec photo après (recommandé)
                  </Button>
                </div>
              )}

              {selectedIncident.statut === 'en_attente_materiel' && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="bg-[#FFA500]/10 p-4 rounded-xl border border-[#FFA500]/30">
                    <p className="text-sm font-heading text-[#FFA500] mb-2">⏳ {t('intervention_en_attente')}</p>
                    <p className="font-body text-gray-700"><strong>{t('motif_label')} :</strong> {selectedIncident.motif_attente}</p>
                    {selectedIncident.attente_materiel_detail && (
                      <p className="font-body text-gray-600 text-sm mt-1">{t('materiel_necessaire')} : {selectedIncident.attente_materiel_detail}</p>
                    )}
                    {selectedIncident.attente_delai && (
                      <p className="font-body text-gray-500 text-xs mt-1">{t('delai_estime')} : {selectedIncident.attente_delai}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => {
                        updateMutation.mutate({
                          id: selectedIncident.id,
                          data: { statut: 'en_cours' }
                        });
                      }}
                      className="bg-[#FFD700] hover:bg-[#FFA500] text-[#0077A8] rounded-xl font-heading"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {t('reprendre')}
                    </Button>
                    <Button 
                      onClick={() => handleMettreEnAttente(selectedIncident)}
                      variant="outline"
                      className="border-[#FFA500] text-[#FFA500] rounded-xl font-heading"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      {t('modifier_motif')}
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handleTerminer(selectedIncident)}
                    disabled={updateMutation.isPending}
                    className="w-full bg-green-500 hover:bg-green-600 rounded-xl font-heading"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('passer_resolu')}
                  </Button>
                </div>
              )}

              {selectedIncident.statut === 'resolu' && (
                <div className="bg-green-50 p-3 rounded-xl">
                  <p className="text-sm font-body text-green-700">
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