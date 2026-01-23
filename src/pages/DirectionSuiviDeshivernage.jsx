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

export default function DirectionSuiviDeshivernage() {
  const navigate = useNavigate();
  const [filterService, setFilterService] = useState('tous');
  const [filterStatut, setFilterStatut] = useState('tous');

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['suivi-deshivernage'],
    queryFn: () => base44.entities.MissionDirection.filter(
      { type_mission: 'DESHIVERNAGE' },
      '-created_date',
      200
    ),
    refetchInterval: 60000
  });

  const filtered = missions.filter(m => {
    if (filterService !== 'tous' && !m.services_intervenants?.some(s => s.service === filterService)) return false;
    if (filterStatut !== 'tous' && m.statut !== filterStatut) return false;
    return true;
  });

  const stats = {
    total: missions.length,
    technique: missions.filter(m => m.services_intervenants?.some(s => s.service === 'TECHNIQUE')).length,
    menage: missions.filter(m => m.services_intervenants?.some(s => s.service === 'MENAGE')).length,
    termine: missions.filter(m => m.statut === 'TERMINEE').length,
    enCours: missions.filter(m => m.statut === 'EN_COURS').length,
    aFaire: missions.filter(m => m.statut === 'A_FAIRE').length
  };

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
        </motion.div>

        {/* Stats identiques à Hivernage */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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
            onClick={() => setFilterStatut('TERMINEE')}
            variant={filterStatut === 'TERMINEE' ? 'default' : 'outline'}
            size="sm"
          >
            Terminées
          </Button>
        </div>

        {/* Liste */}
        <div className="space-y-3">
          {filtered.map(mission => (
            <Card key={mission.id} className="border-2 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {mission.services_intervenants?.map((si, idx) => (
                        <Badge key={idx} className={si.service === 'TECHNIQUE' ? 'bg-blue-500' : 'bg-yellow-500'}>
                          {si.service === 'TECHNIQUE' ? '🧰 Technique' : '🧽 Ménage'} - {si.agent || 'Non assigné'}
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
                  
                  <Badge variant={mission.statut === 'TERMINEE' ? 'default' : 'outline'}>
                    {mission.statut === 'A_FAIRE' ? 'À faire' :
                     mission.statut === 'EN_COURS' ? 'En cours' :
                     mission.statut === 'EN_ATTENTE' ? 'En attente' : '✔️ Terminée'}
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
          ))}
        </div>
      </div>
    </div>
  );
}