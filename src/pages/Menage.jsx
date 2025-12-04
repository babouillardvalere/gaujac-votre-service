import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import OfflineBanner from '../components/OfflineBanner';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Clock, User, CheckCircle, Play, Loader2, Sparkles, Bed, UtensilsCrossed
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';

const categoryIcons = {
  literie: { emoji: '🛏️', label: 'Literie' },
  vaisselle: { emoji: '🍽️', label: 'Vaisselle/Cuisine' },
  nettoyage: { emoji: '🧽', label: 'Nettoyage' },
  materiel_menage: { emoji: '🧹', label: 'Matériel ménage' }
};

export default function Menage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [collaborateurNom, setCollaborateurNom] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [filter, setFilter] = useState('en_attente');

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-menage'] });
      toast.success('Intervention mise à jour');
      setSelectedIncident(null);
    }
  });

  const handlePrendreEnCharge = (incident) => {
    if (!collaborateurNom.trim()) {
      toast.error('Veuillez entrer votre nom');
      return;
    }
    updateMutation.mutate({
      id: incident.id,
      data: {
        pris_par: collaborateurNom,
        date_debut: new Date().toISOString(),
        statut: 'en_cours'
      }
    });
  };

  const handleTerminer = (incident) => {
    updateMutation.mutate({
      id: incident.id,
      data: {
        date_resolution: new Date().toISOString(),
        statut: 'resolu',
        commentaire_interne: commentaire || incident.commentaire_interne
      }
    });
  };

  const filteredIncidents = incidents.filter(i => {
    if (filter === 'tous') return true;
    return i.statut === filter;
  });

  const getCategoryInfo = (cat) => categoryIcons[cat] || { emoji: '🧹', label: cat };

  const getStatusBadge = (statut) => {
    switch (statut) {
      case 'en_attente':
        return <Badge className="bg-[#FFA500] text-white">En attente</Badge>;
      case 'en_cours':
        return <Badge className="bg-[#FFD700] text-[#0077A8]">En cours</Badge>;
      case 'resolu':
        return <Badge className="bg-green-500 text-white">Résolu</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <OfflineBanner />
      
      {/* Header */}
      <div className="bg-[#FFD700] text-[#0077A8] px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('MenuCollaborateur')} className="p-2 hover:bg-white/30 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-xl">Demandes Ménage</h1>
              <p className="text-[#0077A8]/70 text-sm font-body">{filteredIncidents.length} demande(s)</p>
            </div>
          </div>
          <Sparkles className="w-8 h-8" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filtres */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-[#FFF4B2] p-1 rounded-xl border border-[#FFD700]/50 w-full">
            <TabsTrigger value="en_attente" className="flex-1 rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              En attente ({incidents.filter(i => i.statut === 'en_attente').length})
            </TabsTrigger>
            <TabsTrigger value="en_cours" className="flex-1 rounded-lg font-heading data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0077A8]">
              En cours ({incidents.filter(i => i.statut === 'en_cours').length})
            </TabsTrigger>
            <TabsTrigger value="resolu" className="flex-1 rounded-lg font-heading data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Résolus ({incidents.filter(i => i.statut === 'resolu').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Liste */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-[#FFD700] mx-auto mb-4" />
            <p className="font-heading text-[#0077A8]">Aucune demande</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => {
              const catInfo = getCategoryInfo(incident.categorie);
              return (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className="border-2 border-[#FFD700]/50 rounded-xl cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{catInfo.emoji}</span>
                          <div>
                            <span className="font-heading text-[#0077A8]">
                              {incident.logement || incident.emplacement}
                            </span>
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
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog détail */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <span className="text-2xl">{selectedIncident && getCategoryInfo(selectedIncident.categorie).emoji}</span>
              Demande #{selectedIncident?.logement || selectedIncident?.emplacement}
            </DialogTitle>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <div className="bg-[#FFF4B2] rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#0077A8]/70 font-body">Client</span>
                  <span className="font-heading text-[#0077A8]">{selectedIncident.client_prenom} {selectedIncident.client_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0077A8]/70 font-body">Signalé le</span>
                  <span className="font-body text-[#0077A8]">
                    {selectedIncident.date_saisie && format(new Date(selectedIncident.date_saisie), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8]">Description</label>
                <p className="font-body text-gray-700 bg-gray-50 p-3 rounded-xl mt-1">{selectedIncident.description}</p>
              </div>

              {selectedIncident.statut === 'en_attente' && (
                <div className="space-y-3 pt-4 border-t">
                  <Input
                    value={collaborateurNom}
                    onChange={(e) => setCollaborateurNom(e.target.value)}
                    placeholder="Votre nom"
                    className="border-[#FFD700]/50 rounded-xl font-body"
                  />
                  <Button
                    onClick={() => handlePrendreEnCharge(selectedIncident)}
                    disabled={!collaborateurNom.trim() || updateMutation.isPending}
                    className="w-full bg-[#FFD700] hover:bg-[#FFA500] text-[#0077A8] rounded-xl font-heading"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Prendre en charge
                  </Button>
                </div>
              )}

              {selectedIncident.statut === 'en_cours' && (
                <div className="space-y-3 pt-4 border-t">
                  <p className="text-sm font-body text-[#FFD700]">
                    Pris en charge par: {selectedIncident.pris_par}
                  </p>
                  <Textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Commentaire interne (optionnel)"
                    className="border-[#FFD700]/50 rounded-xl font-body"
                  />
                  <Button
                    onClick={() => handleTerminer(selectedIncident)}
                    disabled={updateMutation.isPending}
                    className="w-full bg-green-500 hover:bg-green-600 rounded-xl font-heading"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Terminer
                  </Button>
                </div>
              )}

              {selectedIncident.statut === 'resolu' && (
                <div className="bg-green-50 p-3 rounded-xl">
                  <p className="text-sm font-body text-green-700">
                    Résolu par {selectedIncident.pris_par} le {selectedIncident.date_resolution && format(new Date(selectedIncident.date_resolution), 'dd/MM/yyyy HH:mm')}
                  </p>
                  {selectedIncident.commentaire_interne && (
                    <p className="text-sm font-body text-gray-600 mt-2">Note: {selectedIncident.commentaire_interne}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}