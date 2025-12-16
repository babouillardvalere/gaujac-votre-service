import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OfflineBanner from '../components/OfflineBanner';
import CollaborateurNotificationBell from '../components/CollaborateurNotificationBell';
import { useNotifications } from '../components/useNotifications';
import MettreEnAttenteDialog from '../components/MettreEnAttenteDialog';
import InterventionTimer from '../components/InterventionTimer';
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
import InterventionHistorique from '../components/interventions/InterventionHistorique';
import InterventionDocuments from '../components/interventions/InterventionDocuments';
import ModeleInterventionSelector from '../components/interventions/ModeleInterventionSelector';
import {
  Clock, User, AlertTriangle, CheckCircle,
  Play, Copy, Loader2, Flame, Droplets, Zap,
  Wrench, TreePine, Bug, Pause, DoorOpen,
  UserCheck, Camera, Home
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';
import { notifierClientPriseEnCharge, notifierClientResolution } from '../components/notificationService';

const categoryIcons = {
  gaz: { emoji: '🔥', label: 'gaz' },
  eau: { emoji: '💧', label: 'eau_plomberie' },
  electricite: { emoji: '⚡', label: 'electricite' },
  plomberie: { emoji: '🪠', label: 'eau_plomberie' },
  espace_vert: { emoji: '🌿', label: 'espace_vert' },
  divers_technique: { emoji: '🔧', label: 'autres' },
  souris: { emoji: '🐭', label: 'souris' },
  guepes: { emoji: '🐝', label: 'guepes' },
  frelons: { emoji: '🐝', label: 'frelons' }
};

const CASSE_CATEGORIES = ['mobilier', 'structurel', 'immobilier'];
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
  const [activeTab, setActiveTab] = useState('interventions');

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
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

  const handleCopyAvisLink = (incident) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}${createPageUrl('Avis')}?id=${incident.id}`;
    navigator.clipboard.writeText(link);
    toast.success(t('lien_avis_copie'));
  };

  const getCategoryInfo = (cat) => {
    const info = categoryIcons[cat] || { emoji: '❓', label: 'autres' };
    return { ...info, label: t(info.label) };
  };

  return (
    <div className="min-h-screen pb-8">
      <OfflineBanner />

      <div className="bg-[#00AEEF] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-heading text-xl">{t('menu_technique')}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <Home className="w-6 h-6" />
            </button>
            <CollaborateurNotificationBell />
            <Wrench className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            <TabsTrigger value="taches">Tâches</TabsTrigger>
            <TabsTrigger value="missions">Missions</TabsTrigger>
          </TabsList>

          <TabsContent value="interventions">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => {
                  const catInfo = getCategoryInfo(incident.categorie);

                  return (
                    <motion.div key={incident.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <Card
                        className={`border-2 rounded-xl cursor-pointer hover:shadow-lg transition-all`}
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{catInfo.emoji}</span>
                              <div>
                                <p className="font-heading text-[#0077A8]">
                                  {incident.logement || incident.emplacement}
                                </p>
                                <p className="text-sm text-gray-600">{catInfo.label}</p>
                              </div>
                            </div>
                            <Badge>{incident.statut}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="missions">
            <ServiceMissionDashboard
              service="TECHNIQUE"
              serviceLabel={t('menu_technique')}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Intervention #{selectedIncident?.logement || selectedIncident?.emplacement}
            </DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <Button
              onClick={() => handleCopyAvisLink(selectedIncident)}
              className="mt-4"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copier le lien d’avis
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}