import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '../components/translations';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreerMissionDialog from '../components/missions/CreerMissionDialog';
import { Home, Plus, Target, Users, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SERVICES_LABELS = {
  TECHNIQUE: '🧰 Technique',
  MENAGE: '🧽 Ménage',
  BNSSA: '🏊 BNSSA',
  BAR: '☕ Bar',
  ANIMATIONS: '🎵 Animations',
  RECEPTION: '🏠 Réception',
  TOUS: '🎯 Tous'
};

const TYPE_LABELS = {
  DESHIVERNAGE: '🌞 Déshivernage',
  HIVERNAGE: '❄️ Hivernage',
  SAISON: '🏖️ Saison',
  DIRECTIVE_GLOBALE: '📢 Directive'
};

const PRIORITE_COLORS = {
  BASSE: 'bg-gray-100 text-gray-700',
  NORMALE: 'bg-blue-100 text-blue-700',
  HAUTE: 'bg-orange-100 text-orange-700',
  CRITIQUE: 'bg-red-100 text-red-700'
};

export default function DirectionMissions() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);

  // Récupérer toutes les missions mères (service = 'TOUS')
  const { data: missionsMeres = [], isLoading } = useQuery({
    queryKey: ['missions-meres'],
    queryFn: () => base44.entities.MissionInterne.filter({ service: 'TOUS' }, '-date_debut', 200),
    refetchInterval: 30000
  });

  // Pour chaque mission mère sélectionnée, récupérer ses sous-missions
  const { data: sousMissions = [] } = useQuery({
    queryKey: ['sous-missions', selectedMission?.id],
    queryFn: () => selectedMission
      ? base44.entities.MissionInterne.filter({ mission_mere_id: selectedMission.id }, '-created_date', 50)
      : Promise.resolve([]),
    enabled: !!selectedMission,
    refetchInterval: 15000
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['missions-meres'] });
    setShowCreateDialog(false);
  };

  const getStatutBadge = (statut) => {
    const badges = {
      A_FAIRE: <Badge className="bg-orange-100 text-orange-700"><Clock className="w-3 h-3 mr-1" />{lang === 'fr' ? 'À faire' : 'To do'}</Badge>,
      EN_COURS: <Badge className="bg-blue-100 text-blue-700"><Target className="w-3 h-3 mr-1" />{lang === 'fr' ? 'En cours' : 'In progress'}</Badge>,
      TERMINE: <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />{lang === 'fr' ? 'Terminé' : 'Completed'}</Badge>,
      ANNULEE: <Badge className="bg-gray-100 text-gray-700">{lang === 'fr' ? 'Annulée' : 'Cancelled'}</Badge>
    };
    return badges[statut] || <Badge>{statut}</Badge>;
  };

  const getAvancementGlobal = (missionId) => {
    const relatedMissions = sousMissions.filter(m => m.mission_mere_id === missionId);
    if (relatedMissions.length === 0) return { pct: 0, terminées: 0, total: 0 };
    const terminées = relatedMissions.filter(m => m.statut === 'TERMINE').length;
    const total = relatedMissions.length;
    const pct = Math.round((terminées / total) * 100);
    return { pct, terminées, total };
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8" />
            <div>
              <h1 className="font-heading text-xl">
                {lang === 'fr' ? 'Missions Direction' : 'Management Missions'}
              </h1>
              <p className="text-xs text-purple-200">
                {lang === 'fr' ? 'Pilotage & distribution' : 'Control & distribution'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Nouvelle mission' : 'New mission'}
            </Button>
            <button
              onClick={() => navigate(createPageUrl('DirectionMenu'))}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <Home className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Liste des missions mères */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : missionsMeres.length === 0 ? (
            <Card className="border-2 border-purple-200">
              <CardContent className="py-12 text-center">
                <Target className="w-16 h-16 text-purple-200 mx-auto mb-4" />
                <p className="text-gray-500">
                  {lang === 'fr' ? 'Aucune mission Direction créée' : 'No management missions created'}
                </p>
              </CardContent>
            </Card>
          ) : (
            missionsMeres.map(mission => {
              const avancement = getAvancementGlobal(mission.id);
              const isSelected = selectedMission?.id === mission.id;

              return (
                <Card
                  key={mission.id}
                  className={`border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedMission(isSelected ? null : mission)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-2xl">{TYPE_LABELS[mission.type_mission]?.split(' ')[0]}</span>
                          <CardTitle className="font-heading text-lg">
                            {mission.titre}
                          </CardTitle>
                          <Badge className={PRIORITE_COLORS[mission.priorite]}>
                            {mission.priorite}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {TYPE_LABELS[mission.type_mission]}
                        </p>
                      </div>
                      {getStatutBadge(mission.statut)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {mission.description && (
                      <p className="text-sm text-gray-700 line-clamp-2">{mission.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(mission.date_debut), 'dd/MM/yyyy', { locale: fr })}
                        {' → '}
                        {format(new Date(mission.date_fin), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                      {mission.hebergement_concerne && (
                        <div className="flex items-center gap-1">
                          🏠 {mission.hebergement_concerne}
                        </div>
                      )}
                    </div>

                    {/* Avancement global si missions distribuées */}
                    {isSelected && sousMissions.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            {lang === 'fr' ? 'Avancement global' : 'Overall progress'}
                          </span>
                          <span className="text-sm text-gray-600">
                            {avancement.terminées} / {avancement.total} {lang === 'fr' ? 'services' : 'services'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${avancement.pct}%` }}
                          />
                        </div>

                        {/* Liste des sous-missions par service */}
                        <div className="mt-4 space-y-2">
                          {sousMissions.map(sm => (
                            <div key={sm.id} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{SERVICES_LABELS[sm.service]}</span>
                              </div>
                              {getStatutBadge(sm.statut)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <CreerMissionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleSuccess}
        lang={lang}
      />
    </div>
  );
}