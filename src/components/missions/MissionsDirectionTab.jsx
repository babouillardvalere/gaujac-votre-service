import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MissionInterneCard from './MissionInterneCard';
import MissionInterneDialog from './MissionInterneDialog';
import { Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MissionsDirectionTab({ service, lang = 'fr' }) {
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState(null);
  const [dialogAction, setDialogAction] = useState(null);
  const [filterStatut, setFilterStatut] = useState('A_FAIRE');

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['missions-internes', service],
    queryFn: () => base44.entities.MissionInterne.filter({ service }, '-date_debut', 100),
    refetchInterval: 60000
  });

  const handlePrendreEnCharge = (mission) => {
    setSelectedMission(mission);
    setDialogAction('prendre_en_charge');
  };

  const handleCloturer = (mission) => {
    setSelectedMission(mission);
    setDialogAction('cloturer');
  };

  const handleVoirDetails = (mission) => {
    // Pour l'instant, juste afficher les détails
    setSelectedMission(mission);
    setDialogAction('details');
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['missions-internes', service] });
    setSelectedMission(null);
    setDialogAction(null);
  };

  const filteredMissions = missions.filter(m => {
    if (filterStatut === 'tous') return true;
    return m.statut === filterStatut;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap">
        {['A_FAIRE', 'EN_COURS', 'TERMINE'].map(statut => (
          <Button
            key={statut}
            onClick={() => setFilterStatut(statut)}
            variant={filterStatut === statut ? 'default' : 'outline'}
            className={filterStatut === statut ? 'bg-purple-600' : ''}
            size="sm"
          >
            {statut === 'A_FAIRE' ? (lang === 'fr' ? 'À faire' : 'To do') :
             statut === 'EN_COURS' ? (lang === 'fr' ? 'En cours' : 'In progress') :
             (lang === 'fr' ? 'Terminées' : 'Completed')}
            <span className="ml-2 bg-white/20 px-1.5 rounded-full text-xs">
              {missions.filter(m => m.statut === statut).length}
            </span>
          </Button>
        ))}
        <Button
          onClick={() => setFilterStatut('tous')}
          variant={filterStatut === 'tous' ? 'default' : 'outline'}
          className={filterStatut === 'tous' ? 'bg-purple-600' : ''}
          size="sm"
        >
          {lang === 'fr' ? 'Toutes' : 'All'}
        </Button>
      </div>

      {/* Liste des missions */}
      {filteredMissions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {lang === 'fr' 
              ? 'Aucune mission Direction pour le moment' 
              : 'No management missions at the moment'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMissions.map(mission => (
            <MissionInterneCard
              key={mission.id}
              mission={mission}
              onPrendreEnCharge={handlePrendreEnCharge}
              onCloturer={handleCloturer}
              onVoirDetails={handleVoirDetails}
            />
          ))}
        </div>
      )}

      {/* Dialog de gestion */}
      {dialogAction !== 'details' && (
        <MissionInterneDialog
          open={!!selectedMission && !!dialogAction}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedMission(null);
              setDialogAction(null);
            }
          }}
          mission={selectedMission}
          action={dialogAction}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}