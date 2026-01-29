import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { deepDiagnostic } from '../components/missions/deepDiagnostic';
import { toast } from 'sonner';

export default function DirectionSuiviDeshivernage() {
  const navigate = useNavigate();
  const [filterService, setFilterService] = useState('tous');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [isRecalculating, setIsRecalculating] = useState(false);

  const queryClient = useQueryClient();
  
  const { data: missions = [], isLoading, refetch } = useQuery({
    queryKey: ['suivi-deshivernage'],
    queryFn: async () => {
      // Récupérer TOUTES les missions - peu importe le type
      const allMissions = await base44.entities.MissionDirection.list('-created_date', 200);
      console.log(`[DirectionSuiviDeshivernage] 📊 ${allMissions.length} missions chargées`);

      // Compter par type
      const byType = {};
      allMissions.forEach(m => {
        byType[m.type_mission] = (byType[m.type_mission] || 0) + 1;
      });
      console.log('[DirectionSuiviDeshivernage] Par type:', byType);

      // Debug rollups
      console.log('[DirectionSuiviDeshivernage] Rollups:', allMissions.map(m => ({
        id: m.id.substring(0, 8),
        hebergement: m.zones?.[0]?.numero || 'N/A',
        status_rollup: m.status_rollup,
        services_rollup: m.services_rollup
      })));

      return allMissions;
    },
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0
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

  // Récupérer tous les WorkItems LIÉS AUX MISSIONS
  const { data: allWorkItems = [] } = useQuery({
    queryKey: ['workitems-deshivernage', missions.length],
    queryFn: async () => {
      const wis = [];
      for (const mission of missions) {
        const missionWIs = await base44.entities.WorkItem.filter(
          { mission_direction_id: mission.id },
          '-created_date',
          100
        );
        wis.push(...missionWIs);
      }
      return wis;
    },
    enabled: missions.length > 0,
    refetchInterval: 2000,
    staleTime: 0
  });

  // ⭐ FILTRAGE BASÉ SUR LES ROLLUPS
  const filtered = missions.filter(m => {
    // Filtrer par service (depuis rollup)
    if (filterService !== 'tous') {
      if (!m.services_rollup?.includes(filterService)) return false;
    }
    
    // Filtrer par statut (depuis rollup)
    if (filterStatut !== 'tous') {
      if (m.status_rollup !== filterStatut) return false;
    }
    return true;
  });

  // ⭐ STATS BASÉES SUR LES ROLLUPS (source de vérité persistée en BDD)
  const stats = {
    total: missions.length,
    technique: missions.filter(m => m.services_rollup?.includes('TECHNIQUE')).length,
    menage: missions.filter(m => m.services_rollup?.includes('MENAGE')).length,
    termine: missions.filter(m => m.status_rollup === 'TERMINEE').length,
    enCours: missions.filter(m => m.status_rollup === 'EN_COURS').length,
    enAttente: missions.filter(m => m.status_rollup === 'EN_ATTENTE').length,
    aFaire: missions.filter(m => m.status_rollup === 'A_FAIRE').length
  };
  
  console.log('[Stats] 📊 Comptage depuis ROLLUPS:', stats);

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
          
          <div className="flex justify-center gap-3 mt-4">
            <Button
              onClick={async () => {
                try {
                  const result = await deepDiagnostic();
                  if (result.success) {
                    toast.info(`📊 ${result.problemes} problème(s) - Voir console (F12)`, {
                      description: result.problemes > 0 ? 'Cliquez "Recalculer"' : '✅ Tout OK'
                    });
                  } else {
                    toast.error('Erreur: ' + result.error);
                  }
                } catch (error) {
                  console.error('❌ ERREUR:', error);
                  toast.error('❌ Erreur: ' + error.message);
                }
              }}
              variant="outline"
              size="sm"
            >
              🔍 Diagnostic
            </Button>
            <Button
              onClick={async () => {
                setIsRecalculating(true);
                console.log('[RECALCUL] 🚀 Début du recalcul forcé GLOBAL...');
                console.log('[RECALCUL] ⚠️ Ouvrez la console (F12) pour voir les détails');
                try {
                  const result = await forceRecalcAllMissions();
                  console.log('[RECALCUL] 📊 Résultat:', result);
                  
                  // Attendre 1 seconde pour laisser la BDD se synchroniser
                  console.log('[RECALCUL] ⏳ Attente synchronisation BDD...');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Vider le cache et forcer un rechargement TOTAL
                  console.log('[RECALCUL] 🔄 Vidage cache + rechargement...');
                  queryClient.invalidateQueries({ queryKey: ['suivi-deshivernage'] });
                  queryClient.invalidateQueries({ queryKey: ['workitems-deshivernage'] });
                  await new Promise(resolve => setTimeout(resolve, 500));
                  await refetch();
                  
                  if (result.success) {
                    const msg = result.changes?.length > 0 
                      ? `✅ ${result.changes.length} mission(s) corrigée(s)` 
                      : '✅ Toutes les missions déjà à jour';
                    toast.success(msg, {
                      description: 'Vérifiez la console (F12) pour les détails'
                    });
                    console.log('[RECALCUL] ✅ TERMINÉ AVEC SUCCÈS');
                  } else {
                    toast.error('❌ Erreur lors du recalcul');
                    console.error('[RECALCUL] ❌ ÉCHEC');
                  }
                } catch (error) {
                  console.error('[RECALCUL] ❌ EXCEPTION:', error);
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
                  
                  <Badge variant={mission.status_rollup === 'TERMINEE' ? 'default' : 'outline'} className={
                    mission.status_rollup === 'EN_ATTENTE' ? 'bg-amber-500 text-white' :
                    mission.status_rollup === 'EN_COURS' ? 'bg-orange-500 text-white' :
                    mission.status_rollup === 'TERMINEE' ? 'bg-green-500 text-white' : ''
                  }>
                    {mission.status_rollup === 'A_FAIRE' ? 'À faire' :
                     mission.status_rollup === 'EN_COURS' ? '⏱ En cours' :
                     mission.status_rollup === 'EN_ATTENTE' ? `⏸️ En attente${mission.motif_attente ? ' - ' + mission.motif_attente : ''}` : '✔️ Terminée'}
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