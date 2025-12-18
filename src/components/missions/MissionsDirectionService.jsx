import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, User, CheckCircle, X, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function MissionsDirectionService({ service }) {
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState(null);
  const [showPriseEnCharge, setShowPriseEnCharge] = useState(false);
  const [showTraitement, setShowTraitement] = useState(false);
  const [prenomAgent, setPrenomAgent] = useState('');
  const [tachesEtat, setTachesEtat] = useState({});
  const [filterStatut, setFilterStatut] = useState('A_FAIRE');

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ['interventions-direction', service],
    queryFn: () => base44.entities.InterventionDirection.filter({ service }, '-created_date', 100),
    refetchInterval: 30000
  });

  const priseEnChargeMutation = useMutation({
    mutationFn: async ({ id, prenom }) => {
      return await base44.entities.InterventionDirection.update(id, {
        statut: 'EN_COURS',
        pris_en_charge_par: prenom,
        date_prise_en_charge: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions-direction', service] });
      setShowPriseEnCharge(false);
      setPrenomAgent('');
      toast.success('Mission prise en charge');
    }
  });

  const finalisationMutation = useMutation({
    mutationFn: async ({ id, taches, statut }) => {
      const now = new Date().toISOString();
      const missionActuelle = missions.find(m => m.id === id);
      const dureeMinutes = missionActuelle?.date_prise_en_charge 
        ? Math.floor((new Date() - new Date(missionActuelle.date_prise_en_charge)) / 60000)
        : 0;

      return await base44.entities.InterventionDirection.update(id, {
        taches,
        statut,
        date_terminee: statut === 'TERMINEE' ? now : null,
        temps_ecoule_minutes: (missionActuelle?.temps_ecoule_minutes || 0) + dureeMinutes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions-direction', service] });
      setShowTraitement(false);
      setSelectedMission(null);
      setTachesEtat({});
      toast.success('Mission finalisée');
    }
  });

  const handlePrendreEnCharge = (mission) => {
    setSelectedMission(mission);
    setShowPriseEnCharge(true);
  };

  const handleCommencerTraitement = (mission) => {
    setSelectedMission(mission);
    // Initialiser l'état des tâches
    const etat = {};
    mission.taches.forEach(t => {
      etat[t.numero] = {
        faite: t.faite || false,
        justification: t.justification || '',
        photo_url: t.photo_url || ''
      };
    });
    setTachesEtat(etat);
    setShowTraitement(true);
  };

  const handleValiderPriseEnCharge = () => {
    if (!prenomAgent.trim()) {
      toast.error('Prénom obligatoire');
      return;
    }
    priseEnChargeMutation.mutate({ id: selectedMission.id, prenom: prenomAgent.trim() });
  };

  const handleToggleTache = (numero) => {
    setTachesEtat({
      ...tachesEtat,
      [numero]: {
        ...tachesEtat[numero],
        faite: !tachesEtat[numero].faite
      }
    });
  };

  const handleValiderTraitement = () => {
    const tachesUpdated = selectedMission.taches.map(t => ({
      ...t,
      faite: tachesEtat[t.numero].faite,
      justification: tachesEtat[t.numero].justification,
      photo_url: tachesEtat[t.numero].photo_url
    }));

    const touteFait = tachesUpdated.every(t => t.faite);
    const auMoinsUnePasFaite = tachesUpdated.some(t => !t.faite);

    // Validation: si pas fait, justification obligatoire
    for (const t of tachesUpdated) {
      if (!t.faite && !t.justification?.trim()) {
        toast.error(`Justification obligatoire pour la tâche ${t.numero}`);
        return;
      }
    }

    const nouveauStatut = touteFait ? 'TERMINEE' : (auMoinsUnePasFaite ? 'EN_ATTENTE' : 'EN_COURS');

    finalisationMutation.mutate({
      id: selectedMission.id,
      taches: tachesUpdated,
      statut: nouveauStatut
    });
  };

  const filteredMissions = missions.filter(m => {
    if (filterStatut === 'tous') return true;
    return m.statut === filterStatut;
  });

  const counts = {
    A_FAIRE: missions.filter(m => m.statut === 'A_FAIRE').length,
    EN_COURS: missions.filter(m => m.statut === 'EN_COURS').length,
    TERMINEE: missions.filter(m => m.statut === 'TERMINEE').length
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {['A_FAIRE', 'EN_COURS', 'TERMINEE', 'EN_ATTENTE'].map(statut => (
          <Button
            key={statut}
            onClick={() => setFilterStatut(statut)}
            variant={filterStatut === statut ? 'default' : 'outline'}
            className={filterStatut === statut ? 'bg-purple-600' : ''}
            size="sm"
          >
            {statut === 'A_FAIRE' ? 'À faire' : 
             statut === 'EN_COURS' ? 'En cours' :
             statut === 'EN_ATTENTE' ? 'En attente' : 'Terminées'}
            {counts[statut] > 0 && (
              <Badge className="ml-2 bg-white/20">{counts[statut]}</Badge>
            )}
          </Button>
        ))}
        <Button
          onClick={() => setFilterStatut('tous')}
          variant={filterStatut === 'tous' ? 'default' : 'outline'}
          className={filterStatut === 'tous' ? 'bg-purple-600' : ''}
          size="sm"
        >
          Toutes
        </Button>
      </div>

      {/* Liste missions */}
      {filteredMissions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Aucune mission Direction</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMissions.map(mission => (
            <Card key={mission.id} className="border-2 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={
                        mission.type_intervention === 'HIVERNAGE' ? 'bg-blue-500' : 'bg-yellow-500'
                      }>
                        {mission.type_intervention === 'HIVERNAGE' ? '❄️ Hivernage' : '🌞 Déshivernage'}
                      </Badge>
                      {mission.priorite === 'URGENTE' && (
                        <Badge className="bg-red-500">⚠️ Urgent</Badge>
                      )}
                    </div>
                    <h3 className="font-heading text-lg text-purple-700">
                      {mission.type_hebergement} - {mission.numero_hebergement}
                    </h3>
                    <p className="text-sm text-gray-600">{mission.description}</p>
                  </div>
                  
                  <Badge variant={
                    mission.statut === 'TERMINEE' ? 'default' :
                    mission.statut === 'EN_COURS' ? 'secondary' : 'outline'
                  }>
                    {mission.statut === 'A_FAIRE' ? 'À faire' :
                     mission.statut === 'EN_COURS' ? 'En cours' :
                     mission.statut === 'EN_ATTENTE' ? 'En attente' : 'Terminée'}
                  </Badge>
                </div>

                {/* Tâches */}
                <div className="space-y-1 mb-3">
                  {mission.taches?.map(t => (
                    <div key={t.numero} className="flex items-center gap-2 text-sm">
                      {t.faite ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={t.faite ? 'line-through text-gray-400' : ''}>
                        {t.numero}. {t.texte}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Infos agent */}
                {mission.pris_en_charge_par && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {mission.pris_en_charge_par}
                    </div>
                    {mission.temps_ecoule_minutes > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {mission.temps_ecoule_minutes} min
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {mission.statut === 'A_FAIRE' && (
                  <Button 
                    onClick={() => handlePrendreEnCharge(mission)}
                    className="w-full bg-purple-600"
                  >
                    ▶️ Prendre en charge
                  </Button>
                )}
                {mission.statut === 'EN_COURS' && (
                  <Button 
                    onClick={() => handleCommencerTraitement(mission)}
                    className="w-full bg-green-600"
                  >
                    ✔️ Traiter les tâches
                  </Button>
                )}
                {mission.statut === 'EN_ATTENTE' && (
                  <Button 
                    onClick={() => handleCommencerTraitement(mission)}
                    variant="outline"
                    className="w-full"
                  >
                    🔄 Reprendre
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog prise en charge */}
      <Dialog open={showPriseEnCharge} onOpenChange={setShowPriseEnCharge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prise en charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={prenomAgent}
              onChange={(e) => setPrenomAgent(e.target.value)}
              placeholder="Votre prénom *"
            />
            <Button 
              onClick={handleValiderPriseEnCharge}
              disabled={priseEnChargeMutation.isPending}
              className="w-full bg-purple-600"
            >
              {priseEnChargeMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                '▶️ Valider'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog traitement tâches */}
      <Dialog open={showTraitement} onOpenChange={setShowTraitement}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Traitement des tâches</DialogTitle>
          </DialogHeader>

          {selectedMission && (
            <div className="space-y-4">
              {selectedMission.taches.map(tache => (
                <Card key={tache.numero} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="font-bold text-purple-600">{tache.numero}.</span>
                    <p className="flex-1">{tache.texte}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleToggleTache(tache.numero)}
                        variant={tachesEtat[tache.numero]?.faite ? 'default' : 'outline'}
                        className={tachesEtat[tache.numero]?.faite ? 'bg-green-600' : ''}
                      >
                        ✔️ Fait
                      </Button>
                      <Button
                        onClick={() => handleToggleTache(tache.numero)}
                        variant={!tachesEtat[tache.numero]?.faite ? 'default' : 'outline'}
                        className={!tachesEtat[tache.numero]?.faite ? 'bg-red-600' : ''}
                      >
                        ✖️ Pas fait
                      </Button>
                    </div>

                    {!tachesEtat[tache.numero]?.faite && (
                      <Textarea
                        value={tachesEtat[tache.numero]?.justification || ''}
                        onChange={(e) => setTachesEtat({
                          ...tachesEtat,
                          [tache.numero]: {
                            ...tachesEtat[tache.numero],
                            justification: e.target.value
                          }
                        })}
                        placeholder="Justification obligatoire *"
                        rows={2}
                      />
                    )}
                  </div>
                </Card>
              ))}

              <Button 
                onClick={handleValiderTraitement}
                disabled={finalisationMutation.isPending}
                className="w-full bg-purple-600"
              >
                {finalisationMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  '✔️ Valider'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}