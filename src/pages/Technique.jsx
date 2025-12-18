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

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') navigate(createPageUrl('Collaborateur'));
  }, [navigate]);

  const { data: incidents = [], isLoading } = useQuery({
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

    await prendreEnChargeSansPhoto(incident);
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
      }
    });

    await pushClientEvent({
      incident,
      type: 'PRISE_EN_CHARGE',
      message: "L'intervention technique a commencé."
    });

    await notifyBureau(`Intervention prise en charge par ${collaborateurNom}`);
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
      }
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

    await terminerSansPhoto(incident);
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
      }
    });

    await pushClientEvent({
      incident,
      type: 'TERMINEE',
      message: "Intervention technique clôturée."
    });

    await notifyBureau(`Intervention clôturée (${incident.logement || incident.emplacement})`);
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
      }
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
      }
    });

    await pushClientEvent({
      incident: incidentToWait,
      type: 'EN_ATTENTE',
      message: "Intervention temporairement en attente.",
      attenteRaison: formData.raison,
      delaiEstime: formData.delai
    });

    await notifyBureau(`Intervention en attente - ${formData.raison} (${incidentToWait.logement})`);

    setShowAttenteDialog(false);
    setIncidentToWait(null);
  };

  const handleReprendre = async (incident) => {
    updateMutation.mutate({
      id: incident.id,
      data: { statut: 'en_cours' }
    });

    await pushClientEvent({
      incident,
      type: 'REPRISE',
      message: "L'intervention a repris."
    });

    await notifyBureau(`Intervention reprise (${incident.logement || incident.emplacement})`);
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

  const filteredIncidents = incidents
    .filter(i => filter === 'tous' ? true : i.statut === filter)
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
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['en_attente', 'en_cours', 'en_attente_materiel', 'resolu'].map((s) => (
            <Button
              key={s}
              onClick={() => setFilter(s)}
              variant={filter === s ? 'default' : 'outline'}
              className={filter === s ? 'bg-[#00AEEF]' : ''}
            >
              {t(s)} ({incidents.filter(i => i.statut === s).length})
            </Button>
          ))}
        </div>

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
                                  <AlertTriangle className="w-3 h-3 mr-1" />⚠️ Urgent
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

                      {incident.pris_par && incident.statut === 'en_cours' && (
                        <div className="mt-2 pt-2 border-t flex items-center justify-between">
                          <p className="text-xs text-[#00AEEF]">{t('pris_en_charge_par')}: {incident.pris_par}</p>
                          {incident.date_debut && <InterventionTimer startTime={incident.date_debut} isActive />}
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
                    <InterventionTimer startTime={selectedIncident.date_debut} isActive />
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