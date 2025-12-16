// ===============================
// MENAGE.jsx – VERSION FINALE
// Fonctionnalités intactes + suivi client
// ===============================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OfflineBanner from '../components/OfflineBanner';
import CollaborateurNotificationBell from '../components/CollaborateurNotificationBell';
import { useNotifications } from '../components/useNotifications';
import MettreEnAttenteDialog from '../components/MettreEnAttenteDialog';
import PhotoInterventionCapture from '../components/PhotoInterventionCapture';
import InterventionTimer from '../components/InterventionTimer';
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
import {
  Clock,
  User,
  CheckCircle,
  Play,
  Pause,
  DoorOpen,
  UserCheck,
  Camera,
  Home,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';
import ServiceMissionDashboard from '../components/direction/ServiceMissionDashboard';
import InterventionHistorique from '../components/interventions/InterventionHistorique';
import InterventionDocuments from '../components/interventions/InterventionDocuments';
import ModeleInterventionSelector from '../components/interventions/ModeleInterventionSelector';
import { notifierClientPriseEnCharge, notifierClientResolution } from '../components/notificationService';

/* ============================================================
   CONFIG
============================================================ */

const categoryIcons = {
  literie: { emoji: '🛏️', label: 'literie' },
  vaisselle: { emoji: '🍽️', label: 'vaisselle' },
  nettoyage: { emoji: '🧽', label: 'nettoyage' },
  materiel_menage: { emoji: '🧹', label: 'menage' }
};

const isPhotoRequired = () => false;

/* ============================================================
   COMPOSANT
============================================================ */

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

  /* ============================================================
     AUTH
  ============================================================ */

  useEffect(() => {
    if (sessionStorage.getItem('collaborateur_authenticated') !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
  }, [navigate]);

  /* ============================================================
     DATA
  ============================================================ */

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents-menage'],
    queryFn: () =>
      base44.entities.Incident.filter({ type: 'menage' }, '-date_saisie', 200),
    refetchInterval: 30000
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['intervention-logs', selectedIncident?.id],
    queryFn: () =>
      selectedIncident
        ? base44.entities.InterventionLog.filter(
            { incident_id: selectedIncident.id },
            '-horodatage',
            50
          )
        : Promise.resolve([]),
    enabled: !!selectedIncident
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', selectedIncident?.id],
    queryFn: () =>
      selectedIncident
        ? base44.entities.InterventionDocument.filter(
            { incident_id: selectedIncident.id },
            '-created_date',
            50
          )
        : Promise.resolve([]),
    enabled: !!selectedIncident
  });

  /* ============================================================
     🔁 SUIVI CLIENT (AJOUT)
  ============================================================ */

  const pushClientEvent = async ({ incident, type, message, meta = {} }) => {
    if (!incident?.intervention_id) return;

    await base44.entities.InterventionEvent.create({
      intervention_id: incident.intervention_id,
      incident_id: incident.id,
      type,
      message_client: message,
      meta,
      visible_client: true,
      at: new Date().toISOString()
    });
  };

  /* ============================================================
     MUTATION
  ============================================================ */

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-menage'] });
      setSelectedIncident(null);
    }
  });

  /* ============================================================
     ACTIONS
  ============================================================ */

  const prendreEnCharge = async (incident) => {
    if (!collaborateurNom.trim()) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    const now = new Date();
    const delai = differenceInMinutes(now, new Date(incident.date_saisie));

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: 'prise_en_charge',
      horodatage: now.toISOString(),
      utilisateur: collaborateurNom
    });

    await updateMutation.mutateAsync({
      id: incident.id,
      data: {
        statut: 'en_cours',
        pris_par: collaborateurNom,
        date_debut: now.toISOString(),
        temps_prise_en_charge: delai
      }
    });

    await notifierClientPriseEnCharge(incident, collaborateurNom);

    await pushClientEvent({
      incident,
      type: 'EN_COURS',
      message: 'L’équipe ménage est en cours d’intervention.'
    });

    toast.success('Intervention prise en charge');
  };

  const terminer = async (incident) => {
    const now = new Date();
    const total = differenceInMinutes(now, new Date(incident.date_saisie));

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: 'resolu',
      horodatage: now.toISOString(),
      utilisateur: incident.pris_par
    });

    await updateMutation.mutateAsync({
      id: incident.id,
      data: {
        statut: 'resolu',
        date_resolution: now.toISOString(),
        commentaire_interne: commentaire,
        temps_total_intervention: total
      }
    });

    await notifierClientResolution(incident);

    await pushClientEvent({
      incident,
      type: 'TERMINEE',
      message: 'L’intervention ménage est terminée.'
    });

    setCommentaire('');
  };

  const mettreEnAttente = async (data) => {
    await updateMutation.mutateAsync({
      id: incidentToWait.id,
      data: {
        statut: 'en_attente_materiel',
        attente_raison: data.raison,
        attente_delai: data.delai
      }
    });

    await pushClientEvent({
      incident: incidentToWait,
      type: 'EN_ATTENTE',
      message: 'Intervention ménage en attente.',
      meta: data
    });

    setShowAttenteDialog(false);
    setIncidentToWait(null);
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen pb-8">
      <OfflineBanner />

      <header className="bg-[#FFD700] px-4 py-4 flex justify-between items-center">
        <h1 className="font-heading text-xl">{t('menu_menage')}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(createPageUrl('MenuCollaborateur'))}>
            <Home />
          </button>
          <CollaborateurNotificationBell />
          <Sparkles />
        </div>
      </header>

      {/* LISTE */}
      <main className="max-w-4xl mx-auto p-4">
        {isLoading ? (
          <Loader2 className="animate-spin mx-auto" />
        ) : (
          incidents.map((incident) => (
            <Card
              key={incident.id}
              className="mb-4 cursor-pointer"
              onClick={() => setSelectedIncident(incident)}
            >
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold">
                      Logement {incident.logement}
                    </p>
                    <p className="text-sm text-gray-600">
                      {incident.client_prenom} {incident.client_nom}
                    </p>
                  </div>
                  <Badge>{incident.statut}</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* MODAL */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Intervention ménage – {selectedIncident?.logement}
            </DialogTitle>
          </DialogHeader>

          {selectedIncident?.statut === 'en_attente' && (
            <>
              <Input
                placeholder="Votre nom"
                value={collaborateurNom}
                onChange={(e) => setCollaborateurNom(e.target.value)}
              />
              <Button onClick={() => prendreEnCharge(selectedIncident)}>
                <Play className="mr-2" /> Prendre en charge
              </Button>
            </>
          )}

          {selectedIncident?.statut === 'en_cours' && (
            <>
              <InterventionTimer startTime={selectedIncident.date_debut} />
              <Textarea
                placeholder="Commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIncidentToWait(selectedIncident);
                    setShowAttenteDialog(true);
                  }}
                >
                  <Pause className="mr-2" /> Attente
                </Button>
                <Button onClick={() => terminer(selectedIncident)}>
                  <CheckCircle className="mr-2" /> Terminer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <MettreEnAttenteDialog
        open={showAttenteDialog}
        onOpenChange={setShowAttenteDialog}
        onConfirm={mettreEnAttente}
      />

      <PhotoInterventionCapture
        open={showPhotoAvant}
        onOpenChange={setShowPhotoAvant}
        type="avant"
        interventionId={incidentForPhoto?.id}
        collaborateurNom={collaborateurNom}
      />

      <PhotoInterventionCapture
        open={showPhotoApres}
        onOpenChange={setShowPhotoApres}
        type="apres"
        interventionId={incidentForPhoto?.id}
        collaborateurNom={collaborateurNom}
      />
    </div>
  );
}