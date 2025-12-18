import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, User, CheckCircle, X, Camera, Loader2, AlertTriangle, Upload, Play } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInMinutes } from 'date-fns';

export default function MissionsDirectionService({ service }) {
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState(null);
  const [showPriseEnCharge, setShowPriseEnCharge] = useState(false);
  const [showTraitement, setShowTraitement] = useState(false);
  const [prenomAgent, setPrenomAgent] = useState('');
  const [tachesEtat, setTachesEtat] = useState({});
  const [filterStatut, setFilterStatut] = useState('tous');
  const [tempsEcoule, setTempsEcoule] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(null);

  const { data: missions = [], isLoading, error } = useQuery({
    queryKey: ['interventions-direction', service],
    queryFn: async () => {
      console.log('🚀 Début fetch missions pour service:', service);
      try {
        const allMissions = await base44.entities.InterventionDirection.list('-created_date', 200);
        console.log('🔍 TOUTES les missions reçues:', allMissions);
        console.log('📊 Nombre total:', allMissions.length);
        console.log('🎯 Service recherché:', service);
        
        const filtered = allMissions.filter(m => {
          console.log('Mission:', m.id, '- Service:', m.service, '- Match:', m.service === service);
          return m.service === service;
        });
        
        console.log('✅ Missions filtrées pour', service, ':', filtered);
        console.log('📈 Nombre filtré:', filtered.length);
        return filtered;
      } catch (err) {
        console.error('❌ ERREUR fetch missions:', err);
        throw err;
      }
    },
    refetchInterval: 30000
  });

  // Timer temps réel
  useEffect(() => {
    if (selectedMission?.statut === 'EN_COURS' && selectedMission?.date_prise_en_charge) {
      const interval = setInterval(() => {
        const minutes = differenceInMinutes(new Date(), new Date(selectedMission.date_prise_en_charge));
        setTempsEcoule(minutes);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedMission]);

  const priseEnChargeMutation = useMutation({
    mutationFn: async ({ id, prenom }) => {
      return await base44.entities.InterventionDirection.update(id, {
        statut: 'EN_COURS',
        pris_en_charge_par: prenom,
        date_prise_en_charge: new Date().toISOString(),
        temps_ecoule_minutes: 0
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interventions-direction', service] });
      setShowPriseEnCharge(false);
      toast.success('Mission prise en charge - Timer démarré ⏱️');
      // Ouvrir directement le traitement
      const missionUpdated = { ...selectedMission, ...data };
      setSelectedMission(missionUpdated);
      const etat = {};
      missionUpdated.taches.forEach(t => {
        etat[t.numero] = {
          faite: t.faite || false,
          justification: t.justification || '',
          photo_url: t.photo_url || ''
        };
      });
      setTachesEtat(etat);
      setShowTraitement(true);
    }
  });

  const finalisationMutation = useMutation({
    mutationFn: async ({ id, taches, statut, motifAttente }) => {
      const now = new Date().toISOString();
      const missionActuelle = missions.find(m => m.id === id);
      const dureeMinutes = missionActuelle?.date_prise_en_charge 
        ? Math.floor((new Date() - new Date(missionActuelle.date_prise_en_charge)) / 60000)
        : 0;

      const updateData = {
        taches,
        statut,
        temps_ecoule_minutes: dureeMinutes
      };

      if (statut === 'TERMINEE') {
        updateData.date_terminee = now;
        
        // Générer le PDF automatiquement
        try {
          const pdfContent = await genererPDFIntervention({
            mission: { ...missionActuelle, taches },
            service,
            tempsTotal: dureeMinutes
          });
          
          const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
          const pdfFile = new File([pdfBlob], `intervention_${id}.pdf`, { type: 'application/pdf' });
          const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
          
          updateData.pdf_url = file_url;
          toast.success('PDF généré automatiquement ✅');
        } catch (error) {
          console.error('Erreur génération PDF:', error);
          toast.error('Mission validée mais erreur PDF');
        }
      } else if (statut === 'EN_ATTENTE') {
        updateData.description = motifAttente ? `${missionActuelle.description}\n\n⚠️ En attente: ${motifAttente}` : missionActuelle.description;
      }

      return await base44.entities.InterventionDirection.update(id, updateData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interventions-direction', service] });
      setShowTraitement(false);
      setSelectedMission(null);
      setTachesEtat({});
      
      if (variables.statut === 'TERMINEE') {
        toast.success('✅ Mission terminée - PDF généré');
      } else if (variables.statut === 'EN_ATTENTE') {
        toast.success('⏸️ Mission mise en attente - À reprendre ultérieurement');
      }
    }
  });

  const genererPDFIntervention = async ({ mission, service, tempsTotal }) => {
    const prompt = `Génère un PDF professionnel d'intervention avec les données suivantes:
    
TYPE: ${mission.type_intervention}
HÉBERGEMENT: ${mission.type_hebergement} ${mission.numero_hebergement}
SERVICE: ${service}
AGENT: ${mission.pris_en_charge_par}
PRIORITÉ: ${mission.priorite}
TEMPS TOTAL: ${tempsTotal} minutes
DATE: ${format(new Date(), 'dd/MM/yyyy HH:mm')}

DESCRIPTION:
${mission.description}

TÂCHES:
${mission.taches.map(t => `
${t.numero}. ${t.texte}
   Statut: ${t.faite ? '✅ FAIT' : '❌ PAS FAIT'}
   ${t.justification ? `Justification: ${t.justification}` : ''}
   ${t.photo_url ? `Photo: Oui` : ''}
`).join('\n')}

Crée un document PDF formel avec logo camping, en-têtes, et signatures.`;

    const response = await base44.integrations.Core.InvokeLLM({ 
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          pdf_base64: { type: "string" }
        }
      }
    });

    return atob(response.pdf_base64);
  };

  const handlePrendreEnCharge = (mission) => {
    setSelectedMission(mission);
    setShowPriseEnCharge(true);
  };

  const handleCommencerTraitement = (mission) => {
    setSelectedMission(mission);
    // Initialiser l'état des tâches - NE PAS pré-remplir avec les anciennes valeurs
    const etat = {};
    mission.taches.forEach(t => {
      etat[t.numero] = {
        faite: t.faite !== undefined ? t.faite : undefined, // undefined = pas encore répondu
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

  const handleToggleTache = (numero, newStatus) => {
    setTachesEtat({
      ...tachesEtat,
      [numero]: {
        ...tachesEtat[numero],
        faite: newStatus,
        justification: newStatus ? '' : tachesEtat[numero]?.justification || ''
      }
    });
  };

  const handlePhotoUpload = async (numero, file) => {
    setUploadingPhoto(numero);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTachesEtat({
        ...tachesEtat,
        [numero]: {
          ...tachesEtat[numero],
          photo_url: file_url
        }
      });
      toast.success('Photo ajoutée ✅');
    } catch (error) {
      toast.error('Erreur upload photo');
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleValiderTraitement = () => {
    // Vérifier que TOUTES les tâches ont un statut
    const tachesNonRepondues = selectedMission.taches.filter(t => 
      tachesEtat[t.numero] === undefined || 
      (tachesEtat[t.numero].faite === undefined)
    );

    if (tachesNonRepondues.length > 0) {
      toast.error(`⚠️ Veuillez traiter toutes les tâches (${tachesNonRepondues.length} restante(s))`);
      return;
    }

    const tachesUpdated = selectedMission.taches.map(t => ({
      ...t,
      faite: tachesEtat[t.numero].faite,
      justification: tachesEtat[t.numero].justification,
      photo_url: tachesEtat[t.numero].photo_url
    }));

    // Validation: si pas fait, justification OBLIGATOIRE
    const tachesSansJustification = tachesUpdated.filter(t => !t.faite && !t.justification?.trim());
    if (tachesSansJustification.length > 0) {
      toast.error(`⚠️ Justification obligatoire pour les tâches non faites (${tachesSansJustification.map(t => t.numero).join(', ')})`);
      return;
    }

    const touteFait = tachesUpdated.every(t => t.faite);
    const auMoinsUnePasFaite = tachesUpdated.some(t => !t.faite);

    let nouveauStatut, motifAttente;

    if (touteFait) {
      nouveauStatut = 'TERMINEE';
      motifAttente = null;
    } else if (auMoinsUnePasFaite) {
      // Demander un motif global
      const motif = prompt('⚠️ Au moins une tâche non effectuée.\n\nMotif de mise en attente (obligatoire):');
      if (!motif?.trim()) {
        toast.error('Motif obligatoire pour mettre en attente');
        return;
      }
      nouveauStatut = 'EN_ATTENTE';
      motifAttente = motif.trim();
    } else {
      nouveauStatut = 'EN_COURS';
    }

    finalisationMutation.mutate({
      id: selectedMission.id,
      taches: tachesUpdated,
      statut: nouveauStatut,
      motifAttente
    });
  };

  const filteredMissions = missions.filter(m => {
    if (filterStatut === 'tous') return true;
    return m.statut === filterStatut;
  });

  const counts = {
    A_FAIRE: missions.filter(m => m.statut === 'A_FAIRE').length,
    EN_COURS: missions.filter(m => m.statut === 'EN_COURS').length,
    EN_ATTENTE: missions.filter(m => m.statut === 'EN_ATTENTE').length,
    TERMINEE: missions.filter(m => m.statut === 'TERMINEE').length
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-sm text-gray-500">Chargement missions {service}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-red-700 mb-2">Erreur de chargement</h3>
        <p className="text-sm text-red-600">{error.message}</p>
        <p className="text-xs text-gray-500 mt-2">Console: Voir les détails</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Debug info */}
      <div className="bg-blue-50 rounded-lg p-4 text-xs space-y-1 border-2 border-blue-300">
        <p className="font-bold text-blue-900 mb-2">🔍 DEBUG MISSIONS DIRECTION</p>
        <p>📊 Total missions chargées: <strong>{missions.length}</strong></p>
        <p>🎯 Service actuel: <strong>{service}</strong></p>
        <p>📋 Filtre appliqué: <strong>{filterStatut}</strong></p>
        <p>✅ Missions affichées: <strong>{filteredMissions.length}</strong></p>
        <p className="text-blue-700 pt-2 border-t border-blue-200">
          👉 Ouvrez la console (F12) pour voir les logs détaillés
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setFilterStatut('tous')}
          variant={filterStatut === 'tous' ? 'default' : 'outline'}
          className={filterStatut === 'tous' ? 'bg-purple-600' : ''}
          size="sm"
        >
          Toutes ({missions.length})
        </Button>
        {['A_FAIRE', 'EN_COURS', 'EN_ATTENTE', 'TERMINEE'].map(statut => (
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
                    className="w-full bg-purple-600 hover:bg-purple-700 h-12"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Prendre en charge
                  </Button>
                )}
                {mission.statut === 'EN_COURS' && (
                  <Button 
                    onClick={() => handleCommencerTraitement(mission)}
                    className="w-full bg-green-600 hover:bg-green-700 h-12"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Traiter les tâches
                  </Button>
                )}
                {mission.statut === 'EN_ATTENTE' && (
                  <div className="space-y-2">
                    {mission.description?.includes('⚠️ En attente:') && (
                      <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                        <p className="text-xs text-orange-700">
                          {mission.description.split('⚠️ En attente:')[1]?.trim()}
                        </p>
                      </div>
                    )}
                    <Button 
                      onClick={() => handleCommencerTraitement(mission)}
                      className="w-full bg-orange-500 hover:bg-orange-600 h-12"
                    >
                      🔄 Reprendre la mission
                    </Button>
                  </div>
                )}
                {mission.statut === 'TERMINEE' && mission.pdf_url && (
                  <Button 
                    onClick={() => window.open(mission.pdf_url, '_blank')}
                    variant="outline"
                    className="w-full border-green-500 text-green-700 h-10"
                    size="sm"
                  >
                    📄 Télécharger le PDF
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog prise en charge */}
      <Dialog open={showPriseEnCharge} onOpenChange={setShowPriseEnCharge}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading text-purple-700 flex items-center gap-2">
              <Play className="w-6 h-6" />
              Prise en charge
            </DialogTitle>
          </DialogHeader>
          
          {selectedMission && (
            <div className="space-y-4">
              {/* Récap mission */}
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className={selectedMission.type_intervention === 'HIVERNAGE' ? 'bg-blue-500' : 'bg-yellow-500'}>
                      {selectedMission.type_intervention === 'HIVERNAGE' ? '❄️ Hivernage' : '🌞 Déshivernage'}
                    </Badge>
                    {selectedMission.priorite === 'URGENTE' && (
                      <Badge className="bg-red-500">⚠️ URGENT</Badge>
                    )}
                  </div>
                  <p className="font-bold text-purple-700">
                    {selectedMission.type_hebergement} - {selectedMission.numero_hebergement}
                  </p>
                  <p className="text-gray-600">{selectedMission.taches.length} tâche(s) à effectuer</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Votre prénom *</label>
                <Input
                  value={prenomAgent}
                  onChange={(e) => setPrenomAgent(e.target.value)}
                  placeholder="Ex: Thomas"
                  className="h-12"
                  autoFocus
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                ℹ️ En validant, le timer démarre automatiquement et vous accéderez directement au traitement des tâches.
              </div>

              <Button 
                onClick={handleValiderPriseEnCharge}
                disabled={!prenomAgent.trim() || priseEnChargeMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12"
              >
                {priseEnChargeMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                Démarrer la mission
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog traitement tâches */}
      <Dialog open={showTraitement} onOpenChange={setShowTraitement}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading text-purple-700">
              ✅ Traitement des tâches
            </DialogTitle>
          </DialogHeader>

          {selectedMission && (
            <div className="space-y-4">
              {/* En-tête mission */}
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <Badge className={mission.type_intervention === 'HIVERNAGE' ? 'bg-blue-500 ml-2' : 'bg-yellow-500 ml-2'}>
                      {selectedMission.type_intervention === 'HIVERNAGE' ? '❄️ Hivernage' : '🌞 Déshivernage'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Hébergement:</span>
                    <span className="font-bold ml-2">{selectedMission.type_hebergement} - {selectedMission.numero_hebergement}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Service:</span>
                    <Badge className={service === 'TECHNIQUE' ? 'bg-blue-100 text-blue-700 ml-2' : 'bg-yellow-100 text-yellow-700 ml-2'}>
                      {service === 'TECHNIQUE' ? '🧰 Technique' : '🧽 Ménage'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Agent:</span>
                    <span className="font-bold ml-2">{selectedMission.pris_en_charge_par}</span>
                  </div>
                  {selectedMission.priorite === 'URGENTE' && (
                    <div className="col-span-2">
                      <Badge className="bg-red-500">⚠️ URGENT</Badge>
                    </div>
                  )}
                </div>
                
                {/* Timer en temps réel */}
                {selectedMission.date_prise_en_charge && (
                  <div className="mt-3 pt-3 border-t border-purple-200 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Temps écoulé:</span>
                    <div className="flex items-center gap-2 text-purple-700 font-bold">
                      <Clock className="w-4 h-4" />
                      {Math.floor(tempsEcoule / 60)}h {tempsEcoule % 60}min
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedMission.description && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm text-gray-700 italic">{selectedMission.description}</p>
                </div>
              )}

              {/* Liste des tâches */}
              <div className="space-y-3">
                <h3 className="font-heading text-purple-700 flex items-center gap-2">
                  📋 Tâches à traiter ({selectedMission.taches.filter(t => tachesEtat[t.numero]?.faite !== undefined).length}/{selectedMission.taches.length})
                </h3>
                
                {selectedMission.taches.map(tache => {
                  const etat = tachesEtat[tache.numero];
                  const estRepondu = etat?.faite !== undefined;
                  const estFait = etat?.faite === true;
                  const estPasFait = etat?.faite === false;

                  return (
                    <Card key={tache.numero} className={`p-4 border-2 ${
                      estRepondu ? (estFait ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50') : 'border-gray-300'
                    }`}>
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          estRepondu ? (estFait ? 'bg-green-600 text-white' : 'bg-orange-600 text-white') : 'bg-gray-300 text-gray-600'
                        }`}>
                          {tache.numero}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{tache.texte}</p>
                          {!estRepondu && (
                            <p className="text-xs text-red-500 mt-1">⚠️ À traiter</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 ml-11">
                        {/* Boutons Fait / Pas fait */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleToggleTache(tache.numero, true)}
                            variant={estFait ? 'default' : 'outline'}
                            className={estFait ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-600'}
                            size="sm"
                          >
                            ✔️ Fait
                          </Button>
                          <Button
                            onClick={() => handleToggleTache(tache.numero, false)}
                            variant={estPasFait ? 'default' : 'outline'}
                            className={estPasFait ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600'}
                            size="sm"
                          >
                            ✖️ Pas fait
                          </Button>
                        </div>

                        {/* Justification si pas fait */}
                        {estPasFait && (
                          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                            <label className="text-xs font-bold text-orange-700 mb-1 block">
                              Justification obligatoire *
                            </label>
                            <Textarea
                              value={etat?.justification || ''}
                              onChange={(e) => setTachesEtat({
                                ...tachesEtat,
                                [tache.numero]: {
                                  ...tachesEtat[tache.numero],
                                  justification: e.target.value
                                }
                              })}
                              placeholder="Pourquoi cette tâche n'a pas été effectuée..."
                              rows={2}
                              className="bg-white"
                            />
                          </div>
                        )}

                        {/* Photo facultative */}
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(tache.numero, file);
                              }}
                              disabled={uploadingPhoto === tache.numero}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              disabled={uploadingPhoto === tache.numero}
                              type="button"
                              onClick={(e) => e.currentTarget.previousSibling.click()}
                            >
                              {uploadingPhoto === tache.numero ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <Camera className="w-3 h-3 mr-1" />
                              )}
                              Photo (facultatif)
                            </Button>
                          </label>
                          {etat?.photo_url && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              Photo ajoutée
                            </div>
                          )}
                        </div>

                        {/* Aperçu photo */}
                        {etat?.photo_url && (
                          <img src={etat.photo_url} alt={`Tâche ${tache.numero}`} className="w-32 h-32 object-cover rounded-lg border-2" />
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Bouton validation */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleValiderTraitement}
                  disabled={finalisationMutation.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700 h-14 text-lg"
                >
                  {finalisationMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  )}
                  Valider la mission
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  ⚠️ Toutes les tâches doivent être traitées
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}