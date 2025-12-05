import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import OfflineBanner from '../components/OfflineBanner';
import NotificationCenter from '../components/NotificationCenter';
import MettreEnAttenteDialog from '../components/MettreEnAttenteDialog';
import InterventionTimer from '../components/InterventionTimer';
import PhotoInterventionCapture from '../components/PhotoInterventionCapture';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Clock, User, Home, AlertTriangle, CheckCircle, 
  Play, Copy, Loader2, Flame, Droplets, Zap, Wrench, TreePine, Bug, Pause, DoorOpen, UserCheck, Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';

const categoryIcons = {
  gaz: { icon: Flame, emoji: '🔥', label: 'gaz' },
  eau: { icon: Droplets, emoji: '💧', label: 'eau_plomberie' },
  electricite: { icon: Zap, emoji: '⚡', label: 'electricite' },
  plomberie: { icon: Wrench, emoji: '🪠', label: 'eau_plomberie' },
  espace_vert: { icon: TreePine, emoji: '🌿', label: 'espace_vert' },
  divers_technique: { icon: Wrench, emoji: '🔧', label: 'autres' },
  souris: { icon: Bug, emoji: '🐭', label: 'souris' },
  guepes: { icon: Bug, emoji: '🐝', label: 'guepes' },
  frelons: { icon: Bug, emoji: '🐝', label: 'frelons' }
};

export default function Technique() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [collaborateurNom, setCollaborateurNom] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [filter, setFilter] = useState('en_attente');
  const [showAttenteDialog, setShowAttenteDialog] = useState(false);
  const [incidentToWait, setIncidentToWait] = useState(null);
  const [showPhotoAvant, setShowPhotoAvant] = useState(false);
  const [showPhotoApres, setShowPhotoApres] = useState(false);
  const [incidentForPhoto, setIncidentForPhoto] = useState(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
  }, [navigate]);

  const { data: incidents = [], isLoading, refetch } = useQuery({
    queryKey: ['incidents-technique'],
    queryFn: () => base44.entities.Incident.filter({ type: 'technique' }, '-date_saisie', 200),
    refetchInterval: 30000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-technique'] });
      toast.success(t('intervention_mise_a_jour'));
      setSelectedIncident(null);
    }
  });

  const handlePrendreEnCharge = (incident) => {
    if (!collaborateurNom.trim()) {
      toast.error(t('champs_obligatoires'));
      return;
    }
    // Ouvrir la capture photo AVANT obligatoire
    setIncidentForPhoto(incident);
    setShowPhotoAvant(true);
  };

  const handlePhotoAvantUploaded = async (photoData) => {
    if (!incidentForPhoto) return;
    
    const now = new Date();
    const tempsPriseEnCharge = incidentForPhoto.date_saisie 
      ? differenceInMinutes(now, new Date(incidentForPhoto.date_saisie))
      : 0;
    
    // Créer un log de prise en charge
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
    // Ouvrir la capture photo APRES obligatoire
    setIncidentForPhoto(incident);
    setShowPhotoApres(true);
  };

  const handlePhotoApresUploaded = async (photoData) => {
    if (!incidentForPhoto) return;
    
    const now = new Date();
    const tempsTotal = incidentForPhoto.date_saisie 
      ? differenceInMinutes(now, new Date(incidentForPhoto.date_saisie))
      : 0;
    
    // Créer un log de résolution
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

  const handleCopyAvisLink = (incident) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}${createPageUrl('Avis')}?id=${incident.id}`;
    navigator.clipboard.writeText(link);
    toast.success(t('lien_avis_copie'));
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

  // Tri par priorité: urgents non pris en charge > urgents en cours > normaux non pris > normaux en cours > attente > résolus
  const sortByPriority = (a, b) => {
    const getPriorityScore = (i) => {
      if (i.statut === 'resolu') return 0;
      if (i.statut === 'en_attente_materiel') return 1;
      if (i.statut === 'en_cours' && !i.urgent) return 2;
      if (i.statut === 'en_attente' && !i.urgent) return 3;
      if (i.statut === 'en_cours' && i.urgent) return 4;
      if (i.statut === 'en_attente' && i.urgent) return 5;
      return 0;
    };
    // Prendre en compte priorite_bureau
    const prioA = (a.priorite_bureau || 0) + getPriorityScore(a);
    const prioB = (b.priorite_bureau || 0) + getPriorityScore(b);
    if (prioB !== prioA) return prioB - prioA;
    return new Date(b.date_saisie) - new Date(a.date_saisie);
  };

  const filteredIncidents = incidents
    .filter(i => {
      if (filter === 'tous') return true;
      return i.statut === filter;
    })
    .sort(sortByPriority);

  const getCategoryInfo = (cat) => {
    const info = categoryIcons[cat] || { emoji: '❓', label: 'autres' };
    return { ...info, label: t(info.label) };
  };

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'en_attente':
        return <Badge className="bg-[#FFA500] text-white">{t('en_attente')}</Badge>;
      case 'en_cours':
        return <Badge className="bg-[#00AEEF] text-white">{t('en_cours')}</Badge>;
      case 'en_attente_materiel':
        return <Badge className="bg-gray-500 text-white"><Clock className="w-3 h-3 mr-1" />{t('en_attente_materiel')}</Badge>;
      case 'resolu':
        return <Badge className="bg-green-500 text-white">{t('resolu')}</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  return (
    <div className="min-h-screen pb-8" role="main" aria-label="Gestion des interventions techniques">
      <h1 className="sr-only">Interventions techniques - Liste et gestion</h1>
      <OfflineBanner />
      
      <div className="bg-[#00AEEF] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('MenuCollaborateur')} className="p-2 hover:bg-white/20 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-xl">{t('menu_technique')} - {t('interventions')}</h1>
              <p className="text-white/80 text-sm font-body">{filteredIncidents.length} intervention(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter userType="collaborateur" />
            <Wrench className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-[#e6f7ff] p-1 rounded-xl border border-[#00AEEF]/30 w-full grid grid-cols-4">
            <TabsTrigger value="en_attente" className="rounded-lg font-heading text-xs data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              {t('en_attente')} ({incidents.filter(i => i.statut === 'en_attente').length})
            </TabsTrigger>
            <TabsTrigger value="en_cours" className="rounded-lg font-heading text-xs data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white">
              {t('en_cours')} ({incidents.filter(i => i.statut === 'en_cours').length})
            </TabsTrigger>
            <TabsTrigger value="en_attente_materiel" className="rounded-lg font-heading text-xs data-[state=active]:bg-gray-500 data-[state=active]:text-white">
              ⏳ {t('menu_attente')} ({incidents.filter(i => i.statut === 'en_attente_materiel').length})
            </TabsTrigger>
            <TabsTrigger value="resolu" className="rounded-lg font-heading text-xs data-[state=active]:bg-green-500 data-[state=active]:text-white">
              {t('resolu')} ({incidents.filter(i => i.statut === 'resolu').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
              return (
                <motion.div key={incident.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card 
                    className={`border-2 rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                      incident.urgent ? 'border-[#FFA500] bg-[#FFA500]/5' : 'border-[#00AEEF]/30'
                    }`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{catInfo.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-[#0077A8]">{incident.logement || incident.emplacement}</span>
                              {incident.urgent && <Badge className="bg-[#FFA500] text-white text-xs">{t('urgent_label')}</Badge>}
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
                      {/* Badge autorisation d'accès */}
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
                      {incident.pris_par && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                          <p className="text-xs font-body text-[#00AEEF]">{t('pris_en_charge_par')}: {incident.pris_par}</p>
                          {incident.statut === 'en_cours' && incident.date_debut && (
                            <InterventionTimer startTime={incident.date_debut} isActive={true} />
                          )}
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
      </div>

      <MettreEnAttenteDialog
        open={showAttenteDialog}
        onOpenChange={setShowAttenteDialog}
        onConfirm={confirmMettreEnAttente}
        isLoading={updateMutation.isPending}
      />

      {/* Dialog photo AVANT */}
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

      {/* Dialog photo APRES */}
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

      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                {selectedIncident.urgent && (
                  <div className="flex items-center gap-2 text-white bg-[#FFA500] p-2 rounded-lg mt-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-heading">{t('urgent_label')}</span>
                  </div>
                )}
                {/* Autorisation d'accès */}
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

              {selectedIncident.statut === 'en_attente' && (
                <div className="space-y-3 pt-4 border-t">
                  <Input
                    value={collaborateurNom}
                    onChange={(e) => setCollaborateurNom(e.target.value)}
                    placeholder={t('votre_nom')}
                    className="border-[#00AEEF]/30 rounded-xl font-body"
                  />
                  <Button
                    onClick={() => handlePrendreEnCharge(selectedIncident)}
                    disabled={!collaborateurNom.trim() || updateMutation.isPending}
                    className="w-full bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t('prendre_en_charge')}
                  </Button>
                </div>
              )}

              {selectedIncident.statut === 'en_cours' && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-body text-[#00AEEF]">{t('pris_en_charge_par')}: {selectedIncident.pris_par}</p>
                    <InterventionTimer startTime={selectedIncident.date_debut} isActive={true} />
                  </div>
                  <Textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder={t('commentaire_optionnel')}
                    className="border-[#00AEEF]/30 rounded-xl font-body"
                  />
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
                      className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading"
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
                <div className="space-y-3 pt-4 border-t">
                  <div className="bg-green-50 p-3 rounded-xl">
                    <p className="text-sm font-body text-green-700">
                      {t('resolu')} - {selectedIncident.pris_par} - {selectedIncident.date_resolution && format(new Date(selectedIncident.date_resolution), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <Button onClick={() => handleCopyAvisLink(selectedIncident)} variant="outline" className="w-full border-[#00AEEF] text-[#0077A8] rounded-xl font-heading">
                    <Copy className="w-4 h-4 mr-2" />
                    {t('lien_avis_copie')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}