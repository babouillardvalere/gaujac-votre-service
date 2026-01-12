import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Home, Plus, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { createPageUrl } from '../utils';
import { useTranslation } from '../components/translations';
import CollaborateurNotificationBell from '../components/CollaborateurNotificationBell';
import MissionDirectionFiche from '../components/missions/MissionDirectionFiche';

export default function MissionsDirection() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [selectedMission, setSelectedMission] = useState(null);
  const [filterStatut, setFilterStatut] = useState('tous');

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions-direction-list'],
    queryFn: () => base44.entities.MissionDirection.filter({ mission_direction: true }, '-created_date', 250),
    refetchInterval: 45000
  });

  const filteredMissions = missions.filter(m => {
    if (filterStatut === 'tous') return true;
    return m.statut === filterStatut;
  });

  const getStatutBadge = (statut) => {
    const badges = {
      'A_FAIRE': <Badge className="bg-orange-500">À faire</Badge>,
      'EN_COURS': <Badge className="bg-blue-500">En cours</Badge>,
      'EN_ATTENTE': <Badge className="bg-gray-500">En attente</Badge>,
      'TERMINEE': <Badge className="bg-green-500">Terminée</Badge>,
      'ANNULEE': <Badge className="bg-red-500">Annulée</Badge>
    };
    return badges[statut] || <Badge>{statut}</Badge>;
  };

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-purple-600 text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(createPageUrl('DirectionMenu'))} className="p-2 hover:bg-white/20 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-xl">
                🏢 {lang === 'fr' ? 'Missions Direction' : 'Management Missions'}
              </h1>
              <p className="text-white/80 text-sm">{missions.length} mission(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(createPageUrl('MenuCollaborateur'))} className="p-2 hover:bg-white/20 rounded-lg">
              <Home className="w-6 h-6" />
            </button>
            <CollaborateurNotificationBell />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filtres rapides */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['tous', 'A_FAIRE', 'EN_COURS', 'EN_ATTENTE', 'TERMINEE', 'ANNULEE'].map(s => (
            <Button
              key={s}
              onClick={() => setFilterStatut(s)}
              variant={filterStatut === s ? 'default' : 'outline'}
              className={filterStatut === s ? 'bg-purple-600' : ''}
              size="sm"
            >
              {s === 'tous' ? (lang === 'fr' ? 'Toutes' : 'All') : s.replace(/_/g, ' ')}
              ({missions.filter(m => s === 'tous' || m.statut === s).length})
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredMissions.length === 0 ? (
          <Card className="border-2 border-purple-200">
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">
                {lang === 'fr' ? 'Aucune mission trouvée' : 'No mission found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMissions.map(mission => {
              const zonesCount = mission.zones?.length || 0;
              const servicesCount = mission.services_intervenants?.length || 0;
              const actionsCompletees = mission.actions_prevues?.filter(a => a.effectuee).length || 0;
              const actionsTotal = mission.actions_prevues?.length || 0;

              return (
                <motion.div key={mission.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card
                    className={`border-2 rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                      mission.priorite === 'URGENTE' || mission.priorite === 'CRITIQUE' ? 'border-red-500 bg-red-50' : 'border-purple-300'
                    }`}
                    onClick={() => setSelectedMission(mission)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">
                            {mission.type_mission === 'HIVERNAGE' ? '❄️' : '🌞'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-heading text-purple-700 text-lg">{mission.titre}</span>
                              {(mission.priorite === 'URGENTE' || mission.priorite === 'CRITIQUE') && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Urgent
                                </Badge>
                              )}
                              <Badge className="bg-purple-100 text-purple-700">
                                Mission Direction
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{mission.type_mission}</p>
                          </div>
                        </div>
                        {getStatutBadge(mission.statut)}
                      </div>

                      {mission.description && (
                        <p className="text-gray-700 mb-3 line-clamp-2">{mission.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">📍 Zones:</span>
                          <span className="font-bold">{zonesCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">👷 Services:</span>
                          <span className="font-bold">{servicesCount}</span>
                        </div>
                        {actionsTotal > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">✓ Actions:</span>
                            <span className="font-bold">{actionsCompletees}/{actionsTotal}</span>
                          </div>
                        )}
                        {mission.date_planifiee && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">{format(new Date(mission.date_planifiee), 'dd/MM/yyyy')}</span>
                          </div>
                        )}
                      </div>

                      {mission.createur && (
                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                          <span className="text-purple-600">
                            Créateur: {mission.createur}
                          </span>
                          {mission.date_creation && (
                            <span className="text-gray-500">
                              {format(new Date(mission.date_creation), 'dd/MM/yyyy HH:mm')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Indicateur de validation clôture */}
                      {mission.statut !== 'TERMINEE' && mission.statut !== 'ANNULEE' && (
                        <div className="mt-3">
                          {mission.validation_cloture?.cloture_autorisee ? (
                            <div className="bg-green-50 border border-green-300 rounded-lg p-2 text-xs text-green-700">
                              ✓ Prête à clôturer
                            </div>
                          ) : (
                            <div className="bg-orange-50 border border-orange-300 rounded-lg p-2 text-xs text-orange-700">
                              ⚠️ {lang === 'fr' ? 'Informations manquantes pour clôture' : 'Missing information to close'}
                            </div>
                          )}
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

      {/* Dialog détail */}
      <Dialog open={!!selectedMission} onOpenChange={() => setSelectedMission(null)}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-purple-700 text-2xl">
              {selectedMission && (
                <>
                  {selectedMission.type_mission === 'HIVERNAGE' ? '❄️' : '🌞'} Mission Direction - {selectedMission.titre}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedMission && (
            <MissionDirectionFiche 
              mission={selectedMission}
              onClose={() => setSelectedMission(null)}
              lang={lang}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}