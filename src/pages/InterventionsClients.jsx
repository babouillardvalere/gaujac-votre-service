import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Play, CheckCircle, Pause, AlertTriangle, Package, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import PhotoInterventionCapture from '../components/PhotoInterventionCapture';

export default function InterventionsClients() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [service, setService] = useState('TECHNIQUE');
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [modeTraitement, setModeTraitement] = useState(false);
  const [nomAgent, setNomAgent] = useState('');
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const { data: interventions = [], isLoading } = useQuery({
    queryKey: ['interventions-clients', service],
    queryFn: () => base44.entities.InterventionClient.filter({ service }),
    refetchInterval: 30000
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InterventionClient.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['interventions-clients']);
      toast.success('Intervention mise à jour');
    }
  });

  useEffect(() => {
    let interval;
    if (isTimerRunning && selectedIntervention) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, selectedIntervention]);

  const handlePrendreEnCharge = () => {
    if (!nomAgent.trim()) {
      toast.error('Veuillez entrer votre prénom');
      return;
    }
    updateMutation.mutate({
      id: selectedIntervention.id,
      data: {
        statut: 'EN_COURS',
        pris_en_charge_par: nomAgent,
        date_prise_en_charge: new Date().toISOString()
      }
    });
    setIsTimerRunning(true);
    setModeTraitement(true);
  };

  const handleTaskToggle = (taskIndex, value) => {
    const updatedTaches = [...selectedIntervention.taches];
    updatedTaches[taskIndex] = { ...updatedTaches[taskIndex], faite: value };
    
    updateMutation.mutate({
      id: selectedIntervention.id,
      data: { taches: updatedTaches }
    });
    
    setSelectedIntervention(prev => ({ ...prev, taches: updatedTaches }));
  };

  const handleJustificationChange = (taskIndex, justification) => {
    const updatedTaches = [...selectedIntervention.taches];
    updatedTaches[taskIndex] = { ...updatedTaches[taskIndex], justification };
    
    setSelectedIntervention(prev => ({ ...prev, taches: updatedTaches }));
  };

  const handleCommandeRequise = (taskIndex, value) => {
    const updatedTaches = [...selectedIntervention.taches];
    updatedTaches[taskIndex] = { ...updatedTaches[taskIndex], commande_requise: value };
    
    setSelectedIntervention(prev => ({ ...prev, taches: updatedTaches }));
  };

  const handlePhotoTask = (taskIndex, photoUrl) => {
    const updatedTaches = [...selectedIntervention.taches];
    updatedTaches[taskIndex] = { ...updatedTaches[taskIndex], photo_url: photoUrl };
    
    updateMutation.mutate({
      id: selectedIntervention.id,
      data: { taches: updatedTaches }
    });
    
    setSelectedIntervention(prev => ({ ...prev, taches: updatedTaches }));
  };

  const handleValiderIntervention = async () => {
    const tachesNonFaites = selectedIntervention.taches.filter(t => !t.faite);
    
    // Vérifier que toutes les tâches non faites ont une justification
    const manqueJustification = tachesNonFaites.some(t => !t.justification || !t.justification.trim());
    if (manqueJustification) {
      toast.error('Veuillez justifier toutes les tâches non effectuées');
      return;
    }

    // Créer les commandes si nécessaire
    const tachesAvecCommande = selectedIntervention.taches.filter(t => !t.faite && t.commande_requise);
    
    for (const tache of tachesAvecCommande) {
      await base44.entities.CommandeDirection.create({
        mission_id: selectedIntervention.id,
        type_intervention: 'INTERVENTION',
        hebergement: selectedIntervention.numero_hebergement,
        type_hebergement: selectedIntervention.type_hebergement,
        service_demandeur: selectedIntervention.service,
        agent: selectedIntervention.pris_en_charge_par,
        tache_numero: tache.numero,
        tache_texte: tache.texte,
        articles: [tache.justification],
        statut: 'A_COMMANDER'
      });
    }

    const nouveauStatut = tachesNonFaites.length > 0 ? 'EN_ATTENTE' : 'TERMINEE';
    
    updateMutation.mutate({
      id: selectedIntervention.id,
      data: {
        statut: nouveauStatut,
        temps_ecoule_minutes: timer,
        date_terminee: nouveauStatut === 'TERMINEE' ? new Date().toISOString() : undefined,
        taches: selectedIntervention.taches
      }
    });

    setIsTimerRunning(false);
    setModeTraitement(false);
    setSelectedIntervention(null);
    setTimer(0);
    
    if (tachesAvecCommande.length > 0) {
      toast.success(`Intervention ${nouveauStatut === 'TERMINEE' ? 'terminée' : 'en attente'} - ${tachesAvecCommande.length} commande(s) créée(s)`);
    } else {
      toast.success('Intervention terminée avec succès');
    }
  };

  const interventionsAFaire = interventions.filter(i => i.statut === 'A_FAIRE');
  const interventionsEnCours = interventions.filter(i => i.statut === 'EN_COURS');
  const interventionsEnAttente = interventions.filter(i => i.statut === 'EN_ATTENTE');
  const interventionsTerminees = interventions.filter(i => i.statut === 'TERMINEE');

  if (modeTraitement && selectedIntervention) {
    return (
      <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
        <Button onClick={() => {
          setModeTraitement(false);
          setSelectedIntervention(null);
          setIsTimerRunning(false);
        }} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2" /> Retour
        </Button>

        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardTitle className="flex items-center justify-between">
              <span>🔧 {selectedIntervention.type_hebergement} {selectedIntervention.numero_hebergement}</span>
              <Badge className="bg-white/20">
                <Clock className="w-4 h-4 mr-1" />
                {timer} min
              </Badge>
            </CardTitle>
            <p className="text-sm mt-2">👤 {selectedIntervention.client_prenom} {selectedIntervention.client_nom}</p>
            <p className="text-xs mt-1">📅 {selectedIntervention.date_arrivee} → {selectedIntervention.date_depart}</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 p-3 bg-orange-50 border-2 border-orange-300 rounded-lg">
              <p className="font-semibold text-orange-800">
                🔐 {selectedIntervention.autorisation_acces === 'oui' ? '✅ Accès autorisé' : '❌ Présence client requise'}
              </p>
              {selectedIntervention.plages_horaires?.length > 0 && (
                <p className="text-xs text-orange-700 mt-1">
                  ⏰ Plages: {selectedIntervention.plages_horaires.join(', ')}
                </p>
              )}
            </div>

            <h3 className="font-semibold mb-4">📋 Tâches ({selectedIntervention.taches.length})</h3>
            
            <div className="space-y-4">
              {selectedIntervention.taches.map((tache, idx) => (
                <Card key={idx} className={`border-2 ${tache.faite ? 'border-green-300 bg-green-50' : tache.justification ? 'border-orange-300 bg-orange-50' : 'border-gray-300'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={tache.faite}
                        onCheckedChange={(checked) => handleTaskToggle(idx, checked)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium whitespace-pre-line">{tache.texte}</p>
                        
                        {!tache.faite && (
                          <div className="mt-3 space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Justification *
                              </label>
                              <Textarea
                                value={tache.justification || ''}
                                onChange={(e) => handleJustificationChange(idx, e.target.value)}
                                placeholder="Pourquoi cette tâche n'est-elle pas faite ?"
                                className="text-sm"
                              />
                            </div>

                            <label className="flex items-center gap-2">
                              <Checkbox
                                checked={tache.commande_requise || false}
                                onCheckedChange={(checked) => handleCommandeRequise(idx, checked)}
                              />
                              <span className="text-sm font-medium">🛒 Une commande est nécessaire</span>
                            </label>
                          </div>
                        )}

                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCurrentTaskIndex(idx);
                              setShowPhotoCapture(true);
                            }}
                          >
                            <Camera className="w-4 h-4 mr-1" />
                            {tache.photo_url ? 'Modifier photo' : 'Ajouter photo'}
                          </Button>
                          {tache.photo_url && (
                            <img src={tache.photo_url} alt="Preuve" className="w-16 h-16 object-cover rounded border" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={handleValiderIntervention} className="w-full mt-6 bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2" />
              Valider l'intervention
            </Button>
          </CardContent>
        </Card>

        {showPhotoCapture && currentTaskIndex !== null && (
          <PhotoInterventionCapture
            open={showPhotoCapture}
            onClose={() => setShowPhotoCapture(false)}
            onPhotoCapture={(photoUrl) => {
              handlePhotoTask(currentTaskIndex, photoUrl);
              setShowPhotoCapture(false);
            }}
            interventionId={selectedIntervention.id}
            collaborateurName={selectedIntervention.pris_en_charge_par}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <Button onClick={() => navigate(createPageUrl('MenuCollaborateur'))} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2" /> Menu
        </Button>

        <h1 className="text-3xl font-bold mb-6">🔧 Interventions Clients</h1>

        <div className="flex gap-2 mb-6">
          <Button 
            variant={service === 'TECHNIQUE' ? 'default' : 'outline'}
            onClick={() => setService('TECHNIQUE')}
            className={service === 'TECHNIQUE' ? 'bg-blue-600' : ''}
          >
            🔧 Technique
          </Button>
          <Button 
            variant={service === 'MENAGE' ? 'default' : 'outline'}
            onClick={() => setService('MENAGE')}
            className={service === 'MENAGE' ? 'bg-yellow-600' : ''}
          >
            🧹 Ménage
          </Button>
          <Button 
            variant={service === 'RECEPTION' ? 'default' : 'outline'}
            onClick={() => setService('RECEPTION')}
            className={service === 'RECEPTION' ? 'bg-green-600' : ''}
          >
            🏠 Réception
          </Button>
        </div>

        {/* À faire */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📋 À faire
            <Badge>{interventionsAFaire.length}</Badge>
          </h2>
          <div className="grid gap-4">
            {interventionsAFaire.map(intervention => (
              <Card key={intervention.id} className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-orange-300" onClick={() => setSelectedIntervention(intervention)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{intervention.type_hebergement} {intervention.numero_hebergement}</h3>
                        {intervention.priorite === 'URGENTE' && (
                          <Badge className="bg-red-500">🔴 URGENT</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">👤 {intervention.client_prenom} {intervention.client_nom}</p>
                      <p className="text-xs text-gray-500">📅 {intervention.date_arrivee} → {intervention.date_depart}</p>
                      <p className="text-sm mt-2 text-gray-700">{intervention.description}</p>
                      <div className="mt-2">
                        <Badge variant="outline">{intervention.taches.length} tâche(s)</Badge>
                        {intervention.autorisation_acces === 'non' && (
                          <Badge variant="outline" className="ml-2 bg-orange-50">⏰ Présence requise</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {interventionsAFaire.length === 0 && (
              <p className="text-center text-gray-500 py-8">Aucune intervention à faire</p>
            )}
          </div>
        </div>

        {/* En cours */}
        {interventionsEnCours.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              ⚡ En cours
              <Badge className="bg-blue-500">{interventionsEnCours.length}</Badge>
            </h2>
            <div className="grid gap-4">
              {interventionsEnCours.map(intervention => (
                <Card key={intervention.id} className="border-2 border-blue-400 cursor-pointer" onClick={() => {
                  setSelectedIntervention(intervention);
                  setModeTraitement(true);
                  setNomAgent(intervention.pris_en_charge_par);
                  setIsTimerRunning(true);
                  setTimer(intervention.temps_ecoule_minutes || 0);
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold">{intervention.type_hebergement} {intervention.numero_hebergement}</h3>
                        <p className="text-sm text-gray-600">👤 {intervention.client_prenom} {intervention.client_nom}</p>
                        <p className="text-xs text-gray-500">🔧 {intervention.pris_en_charge_par}</p>
                        <Badge className="mt-2 bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3 mr-1" />
                          {intervention.temps_ecoule_minutes || 0} min
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* En attente */}
        {interventionsEnAttente.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              ⏸️ En attente
              <Badge className="bg-orange-500">{interventionsEnAttente.length}</Badge>
            </h2>
            <div className="grid gap-4">
              {interventionsEnAttente.map(intervention => (
                <Card key={intervention.id} className="border-2 border-orange-400">
                  <CardContent className="p-4">
                    <h3 className="font-bold">{intervention.type_hebergement} {intervention.numero_hebergement}</h3>
                    <p className="text-sm text-gray-600">👤 {intervention.client_prenom} {intervention.client_nom}</p>
                    <Badge className="mt-2 bg-orange-100 text-orange-800">
                      <Package className="w-3 h-3 mr-1" />
                      Attente matériel
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Terminées */}
        {interventionsTerminees.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              ✅ Terminées
              <Badge className="bg-green-500">{interventionsTerminees.length}</Badge>
            </h2>
            <div className="grid gap-4">
              {interventionsTerminees.slice(0, 5).map(intervention => (
                <Card key={intervention.id} className="border-2 border-green-300 opacity-60">
                  <CardContent className="p-4">
                    <h3 className="font-bold">{intervention.type_hebergement} {intervention.numero_hebergement}</h3>
                    <p className="text-sm text-gray-600">👤 {intervention.client_prenom} {intervention.client_nom}</p>
                    <p className="text-xs text-gray-500">✅ Par {intervention.pris_en_charge_par} • {intervention.temps_ecoule_minutes}min</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Dialog pour prise en charge */}
        <Dialog open={selectedIntervention && !modeTraitement} onOpenChange={(open) => {
          if (!open) setSelectedIntervention(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Prendre en charge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedIntervention && (
                <>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="font-bold">{selectedIntervention.type_hebergement} {selectedIntervention.numero_hebergement}</p>
                    <p className="text-sm text-gray-600">👤 {selectedIntervention.client_prenom} {selectedIntervention.client_nom}</p>
                    <p className="text-sm mt-2">{selectedIntervention.description}</p>
                    <p className="text-xs text-gray-500 mt-2">📋 {selectedIntervention.taches.length} tâche(s) à effectuer</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Votre prénom *</label>
                    <Input
                      value={nomAgent}
                      onChange={(e) => setNomAgent(e.target.value)}
                      placeholder="Ex: Pierre"
                    />
                  </div>

                  <Button onClick={handlePrendreEnCharge} className="w-full bg-blue-600">
                    <Play className="mr-2" />
                    Prendre en charge
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}