import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

import Logo from '../components/Logo';
import OfflineBanner from '../components/OfflineBanner';
import CollaborateurNotificationBell from '../components/CollaborateurNotificationBell';
import InterventionTimer from '../components/InterventionTimer';
import MettreEnAttenteDialog from '../components/MettreEnAttenteDialog';
import { useTranslation } from '../components/translations';
import { createPageUrl } from '../utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import {
  Play,
  Pause,
  CheckCircle,
  Loader2
} from 'lucide-react';

import { toast } from 'sonner';

/* ============================================================
   MENAGE – INTERVENTIONS
============================================================ */

export default function Menage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [collaborateurNom, setCollaborateurNom] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [incidentToWait, setIncidentToWait] = useState(null);
  const [showAttenteDialog, setShowAttenteDialog] = useState(false);

  /* =======================
     AUTH
  ======================= */
  useEffect(() => {
    if (sessionStorage.getItem('collaborateur_authenticated') !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
  }, [navigate]);

  /* =======================
     DATA
  ======================= */
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['menage-incidents'],
    queryFn: () =>
      base44.entities.Incident.filter(
        { type: 'menage' },
        '-date_saisie',
        200
      ),
    refetchInterval: 30000
  });

  /* =======================
     CLIENT TIMELINE
  ======================= */
  const pushClientEvent = async ({
    incident,
    type,
    message,
    attenteRaison = null,
    delaiEstime = null
  }) => {
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

  /* =======================
     MUTATION
  ======================= */
  const updateIncident = useMutation({
    mutationFn: ({ id, data }) =>
      base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menage-incidents'] });
    }
  });

  /* =======================
     ACTIONS
  ======================= */

  const prendreEnCharge = async (incident) => {
    if (!collaborateurNom.trim()) {
      toast.error('Nom obligatoire');
      return;
    }

    if (!incident?.date_saisie) {
      toast.error('Date de signalement manquante');
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

    await updateIncident.mutateAsync({
      id: incident.id,
      data: {
        statut: 'en_cours',
        pris_par: collaborateurNom,
        date_debut: now.toISOString(),
        temps_prise_en_charge: delai
      }
    });

    await pushClientEvent({
      incident,
      type: 'EN_COURS',
      message: 'L’équipe ménage est en cours d’intervention.'
    });

    toast.success('Intervention prise en charge');
    setSelectedIncident(null);
  };

  const terminer = async (incident) => {
    if (!incident?.date_saisie) return;

    const now = new Date();
    const total = differenceInMinutes(now, new Date(incident.date_saisie));

    await base44.entities.InterventionLog.create({
      incident_id: incident.id,
      action: 'resolu',
      horodatage: now.toISOString(),
      utilisateur: incident.pris_par
    });

    await updateIncident.mutateAsync({
      id: incident.id,
      data: {
        statut: 'resolu',
        date_resolution: now.toISOString(),
        commentaire_interne: commentaire,
        temps_total_intervention: total
      }
    });

    await pushClientEvent({
      incident,
      type: 'TERMINEE',
      message: 'L’intervention ménage est terminée.'
    });

    toast.success('Intervention terminée');
    setCommentaire('');
    setSelectedIncident(null);
  };

  const mettreEnAttente = async (data) => {
    if (!incidentToWait) return;

    await updateIncident.mutateAsync({
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
      attenteRaison: data.raison,
      delaiEstime: data.delai
    });

    toast.success('Intervention mise en attente');
    setShowAttenteDialog(false);
    setIncidentToWait(null);
  };

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineBanner />

      <header className="bg-yellow-400 px-4 py-4 flex justify-between items-center">
        <Logo />
        <CollaborateurNotificationBell />
      </header>

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
              <CardContent className="flex justify-between items-center">
                <div>
                  <p className="font-bold">
                    Logement {incident.logement || '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {incident.client_prenom} {incident.client_nom}
                  </p>
                </div>
                <Badge>
                  {incident.statut === 'en_attente'
                    ? '⏳ En attente'
                    : incident.statut === 'en_cours'
                    ? '▶️ En cours'
                    : incident.statut === 'en_attente_materiel'
                    ? '⏸️ Attente'
                    : '✅ Terminé'}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* =======================
          MODAL DETAIL
      ======================= */}
      <Dialog
        open={!!selectedIncident}
        onOpenChange={() => setSelectedIncident(null)}
      >
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
                <Play className="mr-2 h-4 w-4" />
                Prendre en charge
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
                  <Pause className="mr-2 h-4 w-4" />
                  Attente
                </Button>
                <Button onClick={() => terminer(selectedIncident)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Terminer
                </Button>
              </div>
            </>
          )}

          {selectedIncident?.statut === 'resolu' && (
            <p className="text-green-600">
              Intervention terminée le{' '}
              {selectedIncident.date_resolution &&
                format(
                  new Date(selectedIncident.date_resolution),
                  'dd/MM/yyyy HH:mm',
                  { locale: fr }
                )}
            </p>
          )}
        </DialogContent>
      </Dialog>

      <MettreEnAttenteDialog
        open={showAttenteDialog}
        onOpenChange={setShowAttenteDialog}
        onConfirm={mettreEnAttente}
      />
    </div>
  );
}