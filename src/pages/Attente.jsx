import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import MettreEnAttenteDialog from '../components/MettreEnAttenteDialog';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Clock, User, CheckCircle, Play, Loader2, Package, 
  AlertTriangle, Edit, Home
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';

const categoryEmojis = {
  gaz: '🔥', eau: '💧', electricite: '⚡', plomberie: '🔧',
  espace_vert: '🌿', divers_technique: '🛠', mobilier: '🧰', structurel: '🏚',
  souris: '🐭', guepes: '🐝', frelons: '🐝', fourmis: '🐜', moustiques: '🦟',
  literie: '🛏', nettoyage: '🧽', vaisselle: '🍽', poubelle: '🗑', produit_manquant: '🧴'
};

export default function Attente() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  const raisonLabels = {
    materiel_manquant: t('raison_materiel_manquant'),
    client_absent: t('raison_client_absent'),
    intervention_impossible: t('raison_intervention_impossible'),
    attente_fournisseur: t('raison_attente_fournisseur'),
    autre: t('raison_autre')
  };

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
  }, [navigate]);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents-attente'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente_materiel' }, '-attente_date', 200),
    refetchInterval: 30000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-attente'] });
      toast.success(t('intervention_mise_a_jour'));
      setSelectedIncident(null);
      setEditMode(false);
    }
  });

  const handleInterventionPrete = (incident) => {
    updateMutation.mutate({
      id: incident.id,
      data: {
        statut: 'en_cours',
        attente_raison: null,
        attente_materiel: false,
        attente_materiel_detail: null,
        attente_delai: null
      }
    });
  };

  const handleUpdateAttente = () => {
    updateMutation.mutate({
      id: selectedIncident.id,
      data: {
        attente_commentaire: editData.commentaire,
        attente_materiel_detail: editData.materielDetail,
        attente_delai: editData.delai
      }
    });
  };

  const openEditMode = (incident) => {
    setEditData({
      commentaire: incident.attente_commentaire || '',
      materielDetail: incident.attente_materiel_detail || '',
      delai: incident.attente_delai || ''
    });
    setEditMode(true);
  };

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-[#FFA500] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('MenuCollaborateur')} className="p-2 hover:bg-white/20 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-xl">{t('interventions_en_attente')}</h1>
              <p className="text-white/80 text-sm font-body">{incidents.length} {t('en_attente').toLowerCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Clock className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFA500]" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="font-heading text-[#0077A8]">{t('aucune_intervention_attente')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`border-2 rounded-xl ${
                  incident.attente_materiel ? 'border-red-400 bg-red-50' : 'border-[#FFA500]/50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{categoryEmojis[incident.categorie]}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-[#0077A8]">
                              {incident.logement || incident.emplacement}
                            </span>
                            <Badge className="bg-[#FFA500] text-white">
                              <Clock className="w-3 h-3 mr-1" />
                              {t('en_attente')}
                            </Badge>
                            {incident.attente_materiel && (
                              <Badge className="bg-red-500 text-white">
                                <Package className="w-3 h-3 mr-1" />
                                {t('menu_materiel')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-body text-gray-600">
                            {raisonLabels[incident.attente_raison] || incident.attente_raison}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 rounded-lg p-3 mb-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-body">{incident.client_prenom} {incident.client_nom}</span>
                      </div>
                      {incident.attente_materiel_detail && (
                        <div className="flex items-start gap-2 text-sm">
                          <Package className="w-4 h-4 text-red-500 mt-0.5" />
                          <span className="font-body text-red-600">{incident.attente_materiel_detail}</span>
                        </div>
                      )}
                      {incident.attente_commentaire && (
                        <p className="text-sm font-body text-gray-600 italic">
                          "{incident.attente_commentaire}"
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{t('delai_label')}: {incident.attente_delai || t('non_defini')}</span>
                        <span>{t('depuis')}: {incident.attente_date && format(new Date(incident.attente_date), 'dd/MM HH:mm', { locale: fr })}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleInterventionPrete(incident)}
                        disabled={updateMutation.isPending}
                        className="flex-1 bg-green-500 hover:bg-green-600 rounded-xl font-heading"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {t('intervention_prete')}
                      </Button>
                      <Button
                        onClick={() => { setSelectedIncident(incident); openEditMode(incident); }}
                        variant="outline"
                        className="border-[#FFA500] text-[#FFA500] rounded-xl font-heading"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {t('modifier')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8]">
              {t('mettre_a_jour_attente')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">{t('detail_materiel')}</label>
              <Input
                value={editData.materielDetail}
                onChange={(e) => setEditData({ ...editData, materielDetail: e.target.value })}
                placeholder={t('detail_materiel_placeholder')}
                className="border-[#00AEEF]/30 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">{t('delai_estime_label')}</label>
              <Input
                value={editData.delai}
                onChange={(e) => setEditData({ ...editData, delai: e.target.value })}
                placeholder="Ex: 2 jours"
                className="border-[#00AEEF]/30 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">{t('commentaire')}</label>
              <Textarea
                value={editData.commentaire}
                onChange={(e) => setEditData({ ...editData, commentaire: e.target.value })}
                className="border-[#00AEEF]/30 rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1 rounded-xl">
              {t('annuler')}
            </Button>
            <Button
              onClick={handleUpdateAttente}
              disabled={updateMutation.isPending}
              className="flex-1 bg-[#FFA500] hover:bg-[#e69500] rounded-xl font-heading"
            >
              {t('enregistrer')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}