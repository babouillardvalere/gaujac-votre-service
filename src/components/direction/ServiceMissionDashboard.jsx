import React, { useState } from 'react';
import { useTranslation } from '../translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, CheckCircle2, Clock, Circle, AlertCircle, Plus, Loader2, Edit, Trash2, Filter, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceMissionDashboard({ service, serviceLabel }) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [filters, setFilters] = useState({
    statut: 'tous',
    tri: 'echeance'
  });

  const [newMission, setNewMission] = useState({
    titre: '',
    description: '',
    date_debut: '',
    date_fin: '',
    services: [service],
    statut: 'A_FAIRE',
    type: 'SAISON'
  });

  const { data: allMissions = [], isLoading } = useQuery({
    queryKey: ['missions', service],
    queryFn: () => base44.entities.Mission.list('-created_date', 200),
    refetchInterval: 60000
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', service],
    queryFn: async () => {
      const allNotifs = await base44.entities.Notification.list();
      return allNotifs.filter(n => 
        n.metadata?.service === service && !n.archivee
      ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Mission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions', service] });
      toast.success('Mission créée avec succès');
      setShowCreateDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Mission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions', service] });
      toast.success('Mission mise à jour');
      setShowEditDialog(false);
      setSelectedMission(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Mission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions', service] });
      toast.success('Mission supprimée');
    }
  });

  const resetForm = () => {
    setNewMission({
      titre: '',
      description: '',
      date_debut: '',
      date_fin: '',
      services: [service],
      statut: 'A_FAIRE',
      type: 'SAISON'
    });
  };

  const handleCreateMission = () => {
    if (!newMission.titre || !newMission.date_debut || !newMission.date_fin) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    createMutation.mutate(newMission);
  };

  const handleEditMission = () => {
    if (!selectedMission) return;
    updateMutation.mutate({
      id: selectedMission.id,
      data: selectedMission
    });
  };

  const missions = allMissions.filter(m => m.services?.includes(service));

  const filteredMissions = missions
    .filter(m => {
      if (filters.statut !== 'tous' && m.statut !== filters.statut) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.tri === 'creation') {
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (filters.tri === 'statut') {
        const statutOrder = { A_FAIRE: 0, EN_COURS: 1, TERMINE: 2 };
        return (statutOrder[a.statut] || 0) - (statutOrder[b.statut] || 0);
      } else {
        if (!a.date_fin) return 1;
        if (!b.date_fin) return -1;
        return new Date(a.date_fin) - new Date(b.date_fin);
      }
    });

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'A_FAIRE':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Circle className="w-3 h-3" /> {lang === 'fr' ? 'À faire' : 'To do'}
          </Badge>
        );
      case 'EN_COURS':
        return (
          <Badge className="bg-blue-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {lang === 'fr' ? 'En cours' : 'In progress'}
          </Badge>
        );
      case 'TERMINE':
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {lang === 'fr' ? 'Terminé' : 'Done'}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type) => {
    const config = {
      DESHIVERNAGE: { icon: '🌞', label: lang === 'fr' ? 'Déshivernage' : 'Spring Opening' },
      HIVERNAGE: { icon: '❄️', label: lang === 'fr' ? 'Hivernage' : 'Winter Closing' },
      SAISON: { icon: '🌊', label: 'Saison' }
    };
    const conf = config[type] || config.SAISON;
    return <span>{conf.icon} {conf.label}</span>;
  };

  const missionsEnCours = missions.filter(m => m.statut === 'EN_COURS');
  const missionsAFaire = missions.filter(m => m.statut === 'A_FAIRE');
  const notificationsNonLues = notifications.filter(n => !n.lue);

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-800">
              {missionsEnCours.length}
            </div>
            <div className="text-sm text-blue-700">
              {lang === 'fr' ? 'En cours' : 'In progress'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">
              {missionsAFaire.length}
            </div>
            <div className="text-sm text-gray-700">
              {lang === 'fr' ? 'À faire' : 'To do'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-800">
              {notificationsNonLues.length}
            </div>
            <div className="text-sm text-orange-700">
              {lang === 'fr' ? 'Non lues' : 'Unread'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bouton Créer Mission + Filtres */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une mission personnalisée
        </Button>
      </div>

      {/* Filtres */}
      <Card className="border-2 border-purple-300/30 rounded-xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-heading text-purple-700 mb-1 block flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Statut
              </label>
              <Select value={filters.statut} onValueChange={(v) => setFilters({...filters, statut: v})}>
                <SelectTrigger className="border-purple-300/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="A_FAIRE">⏳ À faire</SelectItem>
                  <SelectItem value="EN_COURS">🔵 En cours</SelectItem>
                  <SelectItem value="TERMINE">✅ Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-heading text-purple-700 mb-1 block">
                Trier par
              </label>
              <Select value={filters.tri} onValueChange={(v) => setFilters({...filters, tri: v})}>
                <SelectTrigger className="border-purple-300/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="echeance">📅 Échéance</SelectItem>
                  <SelectItem value="creation">🆕 Création</SelectItem>
                  <SelectItem value="statut">📊 Statut</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {filteredMissions.length} mission(s) trouvée(s)
          </p>
        </CardContent>
      </Card>

      {/* Notifications récentes */}
      {notifications.length > 0 && (
        <Card className="border-2 border-orange-300/30">
          <CardHeader>
            <CardTitle className="font-heading text-orange-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {lang === 'fr' ? 'Notifications récentes' : 'Recent notifications'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.slice(0, 5).map(notif => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg border ${
                  notif.lue ? 'bg-white border-gray-200' : 'bg-orange-50 border-orange-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-[#0077A8]">{notif.titre}</h4>
                    <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                  </div>
                  {!notif.lue && (
                    <Badge className="bg-orange-500 text-xs">New</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Liste des missions */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : filteredMissions.length === 0 ? (
        <Card className="border-2 border-gray-200">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              {lang === 'fr' ? 'Aucune mission trouvée' : 'No missions found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredMissions.map(mission => (
            <Card
              key={mission.id}
              className="border-2 border-purple-200 hover:border-purple-400 transition-colors rounded-xl"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-heading text-base text-purple-800">
                        {mission.titre}
                      </h4>
                      {getStatutBadge(mission.statut)}
                    </div>
                    {mission.description && (
                      <p className="text-sm text-gray-600 mb-2">{mission.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{mission.date_debut} → {mission.date_fin}</span>
                  </div>
                  <div className="text-xs">
                    {getTypeBadge(mission.type)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {mission.statut === 'A_FAIRE' && (
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: mission.id, data: { statut: 'EN_COURS' } })}
                      className="bg-blue-500 hover:bg-blue-600"
                      disabled={updateMutation.isPending}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Commencer
                    </Button>
                  )}
                  {mission.statut === 'EN_COURS' && (
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: mission.id, data: { statut: 'TERMINE' } })}
                      className="bg-green-500 hover:bg-green-600"
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Terminer
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedMission(mission);
                      setShowEditDialog(true);
                    }}
                    className="border-purple-500 text-purple-600"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Supprimer cette mission ?')) {
                        deleteMutation.mutate(mission.id);
                      }
                    }}
                    className="border-red-500 text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog Créer Mission */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-purple-700">
              <Plus className="w-5 h-5 inline mr-2" />
              Créer une nouvelle mission
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-heading text-purple-700 mb-2 block">
                Titre de la mission *
              </label>
              <Input
                value={newMission.titre}
                onChange={(e) => setNewMission({...newMission, titre: e.target.value})}
                placeholder="Ex: Préparation hivernage hébergements"
                className="border-2 border-purple-300/50"
              />
            </div>

            <div>
              <label className="text-sm font-heading text-purple-700 mb-2 block">
                Description
              </label>
              <Textarea
                value={newMission.description}
                onChange={(e) => setNewMission({...newMission, description: e.target.value})}
                placeholder="Détails de la mission..."
                rows={4}
                className="border-2 border-purple-300/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-purple-700 mb-2 block">
                  Type de mission *
                </label>
                <Select value={newMission.type} onValueChange={(v) => setNewMission({...newMission, type: v})}>
                  <SelectTrigger className="border-2 border-purple-300/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESHIVERNAGE">🌸 Déshivernage</SelectItem>
                    <SelectItem value="HIVERNAGE">❄️ Hivernage</SelectItem>
                    <SelectItem value="SAISON">☀️ Saison</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-heading text-purple-700 mb-2 block">
                  Service assigné *
                </label>
                <Select 
                  value={newMission.services[0]} 
                  onValueChange={(v) => setNewMission({...newMission, services: [v]})}
                >
                  <SelectTrigger className="border-2 border-purple-300/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TECHNIQUE">🔧 Technique</SelectItem>
                    <SelectItem value="MENAGE">🧹 Ménage</SelectItem>
                    <SelectItem value="ACCUEIL">🎯 Accueil</SelectItem>
                    <SelectItem value="ANIMATION">🎨 Animation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-purple-700 mb-2 block">
                  Date de début *
                </label>
                <Input
                  type="date"
                  value={newMission.date_debut}
                  onChange={(e) => setNewMission({...newMission, date_debut: e.target.value})}
                  className="border-2 border-purple-300/50"
                />
              </div>

              <div>
                <label className="text-sm font-heading text-purple-700 mb-2 block">
                  Date de fin (échéance) *
                </label>
                <Input
                  type="date"
                  value={newMission.date_fin}
                  onChange={(e) => setNewMission({...newMission, date_fin: e.target.value})}
                  className="border-2 border-purple-300/50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="flex-1"
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateMission}
                disabled={createMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Créer la mission
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Éditer Mission */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-purple-700">
              <Edit className="w-5 h-5 inline mr-2" />
              Modifier la mission
            </DialogTitle>
          </DialogHeader>

          {selectedMission && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-heading text-purple-700 mb-2 block">
                  Titre de la mission *
                </label>
                <Input
                  value={selectedMission.titre}
                  onChange={(e) => setSelectedMission({...selectedMission, titre: e.target.value})}
                  className="border-2 border-purple-300/50"
                />
              </div>

              <div>
                <label className="text-sm font-heading text-purple-700 mb-2 block">
                  Description
                </label>
                <Textarea
                  value={selectedMission.description || ''}
                  onChange={(e) => setSelectedMission({...selectedMission, description: e.target.value})}
                  rows={4}
                  className="border-2 border-purple-300/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-heading text-purple-700 mb-2 block">
                    Date de début *
                  </label>
                  <Input
                    type="date"
                    value={selectedMission.date_debut}
                    onChange={(e) => setSelectedMission({...selectedMission, date_debut: e.target.value})}
                    className="border-2 border-purple-300/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-heading text-purple-700 mb-2 block">
                    Date de fin *
                  </label>
                  <Input
                    type="date"
                    value={selectedMission.date_fin}
                    onChange={(e) => setSelectedMission({...selectedMission, date_fin: e.target.value})}
                    className="border-2 border-purple-300/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-heading text-purple-700 mb-2 block">
                  Statut
                </label>
                <Select 
                  value={selectedMission.statut} 
                  onValueChange={(v) => setSelectedMission({...selectedMission, statut: v})}
                >
                  <SelectTrigger className="border-2 border-purple-300/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A_FAIRE">⏳ À faire</SelectItem>
                    <SelectItem value="EN_COURS">🔵 En cours</SelectItem>
                    <SelectItem value="TERMINE">✅ Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedMission(null);
                  }}
                  className="flex-1"
                  disabled={updateMutation.isPending}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleEditMission}
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}