import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, User, CheckCircle, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { forceRecalcAllMissions } from '../components/missions/forceRecalcAllMissions';
import { toast } from 'sonner';

export default function DirectionSuiviDeshivernage() {
  const navigate = useNavigate();
  const [filterService, setFilterService] = useState('tous');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [isRecalculating, setIsRecalculating] = useState(false);

  const { data: missions = [], isLoading, refetch } = useQuery({
    queryKey: ['suivi-deshivernage'],
    queryFn: () => base44.entities.MissionDirection.filter(
      { type_mission: 'DESHIVERNAGE' },
      '-created_date',
      200
    ),
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // 🔄 TEMPS RÉEL : Abonnement aux changements MissionDirection
  React.useEffect(() => {
    const unsubscribe = base44.entities.MissionDirection.subscribe((event) => {
      console.log('[DirectionSuiviDeshivernage] 🔄 MissionDirection changée:', event.type, event.id);
      refetch();
    });
    return unsubscribe;
  }, [refetch]);

  // 🔄 TEMPS RÉEL : Abonnement aux changements WorkItem (impact indirect)
  React.useEffect(() => {
    const unsubscribe = base44.entities.WorkItem.subscribe((event) => {
      console.log('[DirectionSuiviDeshivernage] 🔄 WorkItem changé:', event.type, event.id);
      refetch();
    });
    return unsubscribe;
  }, [refetch]);

  // Récupérer tous les WorkItems pour savoir quels services sont concernés
  const { data: allWorkItems = [] } = useQuery({
    queryKey: ['workitems-deshivernage'],
    queryFn: () => base44.entities.WorkItem.filter({ type: 'MISSION_DIRECTION' }, '-created_date', 1000),
    refetchInterval: 3000
  });

  const filtered = missions.filter(m => {
    // Filtrer par service basé sur les WorkItems liés
    if (filterService !== 'tous') {
      const missionWorkItems = allWorkItems.filter(wi => wi.mission_direction_id === m.id);
      const hasService = missionWorkItems.some(wi => wi.service === filterService);
      if (!hasService) return false;
    }
    
    // Filtrer par statut
    if (filterStatut !== 'tous') {
      if (filterStatut === 'EN_ATTENTE') {
        if (m.statut !== 'EN_ATTENTE' && m.has_blocking !== true) return false;
      } else {
        if (m.statut !== filterStatut) return false;
      }
    }
    return true;
  });

  const stats = {
    total: missions.length,
    technique: missions.filter(m => {
      const missionWorkItems = allWorkItems.filter(wi => wi.mission_direction_id === m.id);
      return missionWorkItems.some(wi => wi.service === 'TECHNIQUE');
    }).length,
    menage: missions.filter(m => {
      const missionWorkItems = allWorkItems.filter(wi => wi.mission_direction_id === m.id);
      return missionWorkItems.some(wi => wi.service === 'MENAGE');
    }).length,
    termine: missions.filter(m => m.statut === 'TERMINEE').length,
    enCours: missions.filter(m => m.statut === 'EN_COURS').length,
    enAttente: missions.filter(m => m.statut === 'EN_ATTENTE' || m.has_blocking === true).length,
    aFaire: missions.filter(m => m.statut === 'A_FAIRE').length
  };

  console.log('[DirectionSuiviDeshivernage] Stats:', stats, 'Missions:', missions.length);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(createPageUrl('DirectionMenu'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">Retour</span>
          </button>
          
          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFD700] text-center mb-2">
            🌞 Suivi Déshivernage
          </h1>
          <p className="text-center text-gray-600 font-body">Vue supervision - Lecture seule</p>
          
          <div className="flex justify-center mt-4">
            <Button
              onClick={async () => {
                setIsRecalculating(true);
                console.log('[RECALCUL] Début du recalcul forcé...');
                try {
                  const result = await forceRecalcAllMissions();
                  console.log('[RECALCUL] Résultat:', result);
                  
                  // Attendre 500ms pour laisser la BDD se synchroniser
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Forcer le rechargement complet
                  await refetch();
                  
                  if (result.success) {
                    toast.success(`✅ ${result.updated} missions mises à jour`);
                    console.log('[RECALCUL] ✅ Terminé avec succès');
                  } else {
                    toast.error('❌ Erreur lors du recalcul');
                    console.error('[RECALCUL] ❌ Échec');
                  }
                } catch (error) {
                  console.error('[RECALCUL] ❌ Exception:', error);
                  toast.error('❌ Erreur: ' + error.message);
                } finally {
                  setIsRecalculating(false);
                }
              }}
              disabled={isRecalculating}
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              {isRecalculating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recalcul en cours...
                </>
              ) : (
                '🔄 Recalculer tous les statuts'
              )}
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.technique}</p>
              <p className="text-xs text-gray-600">🧰 Technique</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-700">{stats.menage}</p>
              <p className="text-xs text-gray-600">🧽 Ménage</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.termine}</p>
              <p className="text-xs text-gray-600">✔️ Terminées</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-700">{stats.enCours}</p>
              <p className="text-xs text-gray-600">⏱ En cours</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.enAttente}</p>
              <p className="text-xs text-gray-600">⏸️ En attente</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            onClick={() => setFilterService('tous')}
            variant={filterService === 'tous' ? 'default' : 'outline'}
            size="sm"
          >
            Tous services
          </Button>
          <Button
            onClick={() => setFilterService('TECHNIQUE')}
            variant={filterService === 'TECHNIQUE' ? 'default' : 'outline'}
            size="sm"
          >
            🧰 Technique
          </Button>
          <Button
            onClick={() => setFilterService('MENAGE')}
            variant={filterService === 'MENAGE' ? 'default' : 'outline'}
            size="sm"
          >
            🧽 Ménage
          </Button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            onClick={() => setFilterStatut('tous')}
            variant={filterStatut === 'tous' ? 'default' : 'outline'}
            size="sm"
          >
            Tous statuts
          </Button>
          <Button
            onClick={() => setFilterStatut('A_FAIRE')}
            variant={filterStatut === 'A_FAIRE' ? 'default' : 'outline'}
            size="sm"
          >
            À faire
          </Button>
          <Button
            onClick={() => setFilterStatut('EN_COURS')}
            variant={filterStatut === 'EN_COURS' ? 'default' : 'outline'}
            size="sm"
          >
            En cours
          </Button>
          <Button
            onClick={() => setFilterStatut('EN_ATTENTE')}
            variant={filterStatut === 'EN_ATTENTE' ? 'default' : 'outline'}
            size="sm"
          >
            En attente
          </Button>
          <Button
            onClick={() => setFilterStatut('TERMINEE')}
            variant={filterStatut === 'TERMINEE' ? 'default' : 'outline'}
            size="sm"
          >
            Terminées
          </Button>
        </div>

        {/* Debug info */}
        {filtered.length === 0 && (
          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Aucune mission pour les filtres sélectionnés</p>
              <p className="text-xs text-gray-500 mt-2">Total chargé: {missions.length} missions</p>
            </CardContent>
          </Card>
        )}

        {/* Liste */}
        <div className="space-y-3">
          {filtered.map(mission => {
            // CORRECTION: Utiliser les WorkItems pour afficher les services, pas services_intervenants
            const missionWorkItems = allWorkItems.filter(wi => wi.mission_direction_id === mission.id);
            const servicesBadges = [];
            
            // Technique
            const techniqueWI = missionWorkItems.find(wi => wi.service === 'TECHNIQUE');
            if (techniqueWI) {
              servicesBadges.push({
                service: 'TECHNIQUE',
                agent: techniqueWI.collaborateur || 'Non assigné',
                statut: techniqueWI.statut
              });
            }
            
            // Ménage
            const menageWI = missionWorkItems.find(wi => wi.service === 'MENAGE');
            if (menageWI) {
              servicesBadges.push({
                service: 'MENAGE',
                agent: menageWI.collaborateur || 'Non assigné',
                statut: menageWI.statut
              });
            }
            
            return (
            <Card key={mission.id} className="border-2 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {servicesBadges.map((sb, idx) => (
                        <Badge key={idx} className={sb.service === 'TECHNIQUE' ? 'bg-blue-500' : 'bg-yellow-500'}>
                          {sb.service === 'TECHNIQUE' ? '🧰 Technique' : '🧽 Ménage'} - {sb.agent}
                        </Badge>
                      ))}
                      {(mission.priorite === 'URGENTE' || mission.priorite === 'CRITIQUE') && (
                        <Badge className="bg-red-500">⚠️ Urgent</Badge>
                      )}
                    </div>
                    <h3 className="font-heading text-lg">
                      {mission.zones?.map(z => `${z.categorie || z.type_zone} ${z.numero}`).join(', ') || 'Multi-zones'}
                    </h3>
                    <p className="text-sm text-gray-600">{mission.titre}</p>
                    {mission.objectif && (
                      <p className="text-xs text-gray-500 mt-1">{mission.objectif}</p>
                    )}
                  </div>
                  
                  <Badge variant={mission.statut === 'TERMINEE' ? 'default' : 'outline'} className={
                    mission.statut === 'EN_ATTENTE' || mission.has_blocking ? 'bg-amber-500 text-white' :
                    mission.statut === 'EN_COURS' ? 'bg-orange-500 text-white' :
                    mission.statut === 'TERMINEE' ? 'bg-green-500 text-white' : ''
                  }>
                    {mission.statut === 'A_FAIRE' ? 'À faire' :
                     mission.statut === 'EN_COURS' ? '⏱ En cours' :
                     mission.statut === 'EN_ATTENTE' || mission.has_blocking ? `⏸️ En attente${mission.motif_attente ? ' - ' + mission.motif_attente : ''}` : '✔️ Terminée'}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>📋 {mission.actions_prevues?.length || 0} action(s)</p>
                  <p>🏢 {mission.zones?.length || 0} zone(s)</p>
                  {mission.temps_reel_minutes > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {mission.temps_reel_minutes} min
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}