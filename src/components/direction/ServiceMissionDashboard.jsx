import React from 'react';
import { useTranslation } from '../translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock, Circle, AlertCircle } from 'lucide-react';

export default function ServiceMissionDashboard({ service, serviceLabel }) {
  const { lang } = useTranslation();

  // Récupération des missions assignées à ce service
  const { data: missions = [] } = useQuery({
    queryKey: ['missions', service],
    queryFn: async () => {
      const allMissions = await base44.entities.Mission.list();
      return allMissions.filter(m => m.services?.includes(service));
    }
  });

  // Récupération des notifications pour ce service
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', service],
    queryFn: async () => {
      const allNotifs = await base44.entities.Notification.list();
      return allNotifs.filter(n => 
        n.metadata?.service === service && !n.archivee
      ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
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

      {/* Notifications récentes */}
      {notifications.length > 0 && (
        <Card className="border-2 border-[#00AEEF]/30">
          <CardHeader>
            <CardTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {lang === 'fr' ? 'Notifications récentes' : 'Recent notifications'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.slice(0, 5).map(notif => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg border ${
                  notif.lue ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-300'
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
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(notif.created_date).toLocaleString(lang)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Missions assignées */}
      <Card className="border-2 border-[#00AEEF]/30">
        <CardHeader>
          <CardTitle className="font-heading text-[#0077A8] flex items-center justify-between">
            <span>{lang === 'fr' ? 'Missions assignées' : 'Assigned missions'}</span>
            <Badge variant="outline">{missions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {missions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {lang === 'fr' ? 'Aucune mission assignée' : 'No assigned missions'}
            </p>
          ) : (
            <div className="space-y-3">
              {missions.map(mission => (
                <div
                  key={mission.id}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-[#00AEEF] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-heading text-base text-[#0077A8]">
                          {mission.titre}
                        </h4>
                        {getStatutBadge(mission.statut)}
                      </div>
                      <p className="text-sm text-gray-600">{mission.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{mission.date_debut} → {mission.date_fin}</span>
                    </div>
                    <div className="text-xs">
                      {getTypeBadge(mission.type)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                  Services assignés *
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
                  Date de fin *
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
                  value={selectedMission.description}
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
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="border-2 border-purple-300 rounded-xl mb-4">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-purple-700">
            🎯 Missions {serviceLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>