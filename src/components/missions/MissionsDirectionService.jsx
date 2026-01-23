import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, User, CheckCircle, X, Camera, Loader2, AlertTriangle, Upload, Play } from 'lucide-react';
import { format, differenceInMinutes, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import MissionFilters from './MissionFilters';
import MissionCalendarView from './MissionCalendarView';
import MissionListView from './MissionListView';

export default function MissionsDirectionService({ service }) {
  const queryClient = useQueryClient();
  const [selectedMission, setSelectedMission] = useState(null);
  const [modeTraitement, setModeTraitement] = useState(false); // true = en traitement
  const [prenomAgent, setPrenomAgent] = useState('');
  const [tachesEtat, setTachesEtat] = useState({});
  const [filterStatut, setFilterStatut] = useState('A_FAIRE');
  const [tempsEcoule, setTempsEcoule] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [commandesArticles, setCommandesArticles] = useState({});
  const [nouvelArticle, setNouvelArticle] = useState({});
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const { data: missions = [], isLoading, error } = useQuery({
    queryKey: ['interventions-direction', service, filterStatut],
    queryFn: async () => {
      // Récupérer toutes les MissionDirection qui concernent ce service
      const allMissions = await base44.entities.MissionDirection.filter(
        { mission_direction: true },
        '-created_date',
        250
      );
      
      // Filtrer côté client pour garder uniquement celles qui ont ce service
      const missionsFiltered = allMissions.filter(m => 
        m.services_intervenants?.some(s => s.service === service)
      );
      
      // Filtrer par statut si nécessaire
      if (filterStatut !== 'TERMINEE') {
        return missionsFiltered.filter(m => ['A_FAIRE', 'EN_COURS', 'EN_ATTENTE'].includes(m.statut));
      }
      
      return missionsFiltered;
    },
    refetchInterval: filterStatut === 'TERMINEE' ? 120000 : 45000,
    staleTime: 30000
  });

  // Timer temps réel
  useEffect(() => {
    if (modeTraitement && selectedMission?.date_debut_reelle) {
      const calculerTemps = () => {
        const minutes = differenceInMinutes(new Date(), new Date(selectedMission.date_debut_reelle));
        setTempsEcoule(minutes);
      };
      
      calculerTemps();
      const interval = setInterval(calculerTemps, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedMission, modeTraitement]);

  const priseEnChargeMutation = useMutation({
    mutationFn: async ({ id, prenom, service }) => {
      // Mettre à jour la MissionDirection avec l'agent dans services_intervenants
      const mission = missions.find(m => m.id === id);
      const servicesIntervenants = mission.services_intervenants || [];
      
      // Ajouter ou mettre à jour l'intervenant pour ce service
      const existingIndex = servicesIntervenants.findIndex(s => s.service === service);
      if (existingIndex >= 0) {
        servicesIntervenants[existingIndex].agent = prenom;
        servicesIntervenants[existingIndex].date_intervention = new Date().toISOString();
      } else {
        servicesIntervenants.push({
          service,
          agent: prenom,
          date_intervention: new Date().toISOString()
        });
      }
      
      return await base44.entities.MissionDirection.update(id, {
        statut: 'EN_COURS',
        services_intervenants: servicesIntervenants,
        date_debut_reelle: mission.date_debut_reelle || new Date().toISOString()
      });
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interventions-direction', service] });
      toast.success('Mission prise en charge ⏱️');
      const missionUpdated = { ...selectedMission, ...data };
      setSelectedMission(missionUpdated);
      const etat = {};
      missionUpdated.taches.forEach(t => {
        etat[t.numero] = {
          faite: t.faite !== undefined ? t.faite : undefined,
          justification: t.justification || '',
          photo_url: t.photo_url || ''
        };
      });
      setTachesEtat(etat);
      setModeTraitement(true);
      setPrenomAgent('');
      
      // Notification: Mission prise en charge
      base44.entities.Notification.create({
        type: 'MISSION_CREATED',
        titre: `🚀 Mission ${data.type_mission} prise en charge`,
        message: `${variables.prenom} a pris en charge la mission pour ${data.zones?.[0]?.numero || 'zone inconnue'}`,
        destinataire_role: 'DIRECTION',
        priorite: data.priorite === 'URGENTE' || data.priorite === 'CRITIQUE' ? 'URGENTE' : 'NORMALE',
        metadata: { mission_id: data.id, service }
      }).catch(err => console.error('Erreur notification:', err));
    }
  });

  const finalisationMutation = useMutation({
    mutationFn: async ({ id, service, statut, resultats, tempsMinutes }) => {
      const now = new Date().toISOString();
      const missionActuelle = missions.find(m => m.id === id);
      
      // Mettre à jour services_intervenants avec les résultats
      const servicesIntervenants = [...(missionActuelle.services_intervenants || [])];
      const existingIndex = servicesIntervenants.findIndex(s => s.service === service);
      
      if (existingIndex >= 0) {
        servicesIntervenants[existingIndex].resultat = resultats;
        servicesIntervenants[existingIndex].temps_minutes = tempsMinutes;
      }
      
      // Mettre à jour actions_prevues avec les états
      const actionsPrevues = [...(missionActuelle.actions_prevues || [])];
      Object.keys(tachesEtat).forEach(idx => {
        if (actionsPrevues[idx]) {
          actionsPrevues[idx].effectuee = tachesEtat[idx].effectuee;
        }
      });

      const updateData = {
        statut,
        services_intervenants: servicesIntervenants,
        actions_prevues: actionsPrevues,
        temps_reel_minutes: (missionActuelle.temps_reel_minutes || 0) + tempsMinutes
      };

      if (statut === 'TERMINEE') {
        updateData.date_fin_reelle = now;
      }

      return await base44.entities.MissionDirection.update(id, updateData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interventions-direction', service] });
      setModeTraitement(false);
      setSelectedMission(null);
      setTachesEtat({});
      setCommandesArticles({});
      setNouvelArticle({});
      
      if (variables.statut === 'TERMINEE') {
        toast.success('✅ Mission terminée');
        
        // Notification: Mission terminée
        base44.entities.Notification.create({
          type: 'MISSION_COMPLETE',
          titre: `✅ Mission ${data.type_mission} terminée`,
          message: `Mission ${data.zones?.[0]?.numero || 'zone'} terminée avec résultat: ${variables.resultats}`,
          destinataire_role: 'DIRECTION',
          priorite: 'NORMALE',
          metadata: { mission_id: data.id, service: variables.service, resultat: variables.resultats }
        }).catch(err => console.error('Erreur notification:', err));
      } else if (variables.statut === 'EN_ATTENTE') {
        toast.success('⏸️ Mission mise en attente');
        
        // Notification: Mission en attente
        base44.entities.Notification.create({
          type: 'MISSION_REACTIVATED',
          titre: `⏸️ Mission ${data.type_mission} en attente`,
          message: `Mission ${data.zones?.[0]?.numero || 'zone'} mise en attente par ${variables.service}`,
          destinataire_role: 'DIRECTION',
          priorite: 'URGENTE',
          metadata: { mission_id: data.id, service: variables.service }
        }).catch(err => console.error('Erreur notification:', err));
      }
    }
  });

  const genererPDFIntervention = async ({ mission, service, tempsTotal }) => {
    // Importer jsPDF dynamiquement
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();

    // Ajouter le logo en haut
    const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6930cc5060a27d8dfd0bf5fd/aa24decb4_logo.png';

    try {
      // Charger l'image en base64
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const logoBase64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Ajouter le logo (centré, en haut)
      doc.addImage(logoBase64, 'PNG', 70, 10, 70, 25);
    } catch (error) {
      console.error('Erreur chargement logo:', error);
    }

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(0, 119, 168);
    doc.text('FICHE INTERVENTION DIRECTION', 105, 45, { align: 'center' });

    // Informations générales
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    let y = 60;

    doc.setFont(undefined, 'bold');
    doc.text(`TYPE: ${mission.type_intervention === 'HIVERNAGE' ? 'HIVERNAGE' : 'DESHIVERNAGE'}`, 20, y);
    y += 8;
    doc.text(`HEBERGEMENT: ${mission.type_hebergement} - ${mission.numero_hebergement}`, 20, y);
    y += 8;
    doc.text(`SERVICE: ${service === 'TECHNIQUE' ? 'Technique' : 'Menage'}`, 20, y);
    y += 8;
    doc.text(`AGENT: ${mission.pris_en_charge_par}`, 20, y);
    y += 8;
    doc.text(`PRIORITE: ${mission.priorite}`, 20, y);
    y += 8;
    doc.text(`TEMPS TOTAL: ${Math.floor(tempsTotal / 60)}h ${tempsTotal % 60}min`, 20, y);
    y += 8;
    doc.text(`DATE: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, y);
    y += 12;

    // Description
    if (mission.description) {
      doc.setFont(undefined, 'bold');
      doc.text('DESCRIPTION:', 20, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      const descLines = doc.splitTextToSize(mission.description, 170);
      doc.text(descLines, 20, y);
      y += descLines.length * 6 + 10;
    }

    // Tâches
    doc.setFont(undefined, 'bold');
    doc.text('TACHES REALISEES:', 20, y);
    y += 8;

    const tachesData = mission.taches.map(t => [
      t.numero.toString(),
      t.texte,
      t.faite ? 'FAIT' : 'PAS FAIT',
      t.justification || '-'
    ]);

    doc.autoTable({
      startY: y,
      head: [['N°', 'Tache', 'Statut', 'Justification']],
      body: tachesData,
      theme: 'grid',
      headStyles: { fillColor: [0, 174, 239], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 }
    });

    // Signature
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFont(undefined, 'italic');
    doc.setFontSize(10);
    doc.text('Camping Paradis - Le Domaine de Gaujac', 105, finalY, { align: 'center' });

    return doc.output('blob');
  };

  const handlePrendreEnCharge = (mission) => {
    setSelectedMission(mission);
    const etat = {};
    const actions = mission.actions_prevues || [];
    actions.forEach((action, idx) => {
      etat[idx] = {
        effectuee: action.effectuee || false
      };
    });
    setTachesEtat(etat);
    setModeTraitement(true);
  };

  const handleRetourListe = () => {
    setModeTraitement(false);
    setSelectedMission(null);
    setTachesEtat({});
    setCommandesArticles({});
    setNouvelArticle({});
    setPrenomAgent('');
  };

  const handleDemarrerMission = () => {
    if (!prenomAgent.trim()) {
      toast.error('Prénom obligatoire');
      return;
    }
    priseEnChargeMutation.mutate({ id: selectedMission.id, prenom: prenomAgent.trim(), service });
  };

  const handleToggleTache = (idx, effectuee) => {
    setTachesEtat({
      ...tachesEtat,
      [idx]: {
        effectuee
      }
    });
  };

  const handleToggleCommande = (numero, necessaire) => {
    setTachesEtat({
      ...tachesEtat,
      [numero]: {
        ...tachesEtat[numero],
        commandeNecessaire: necessaire
      }
    });

    // Réinitialiser les articles si on passe à "non"
    if (!necessaire && commandesArticles[numero]) {
      const newCommandes = { ...commandesArticles };
      delete newCommandes[numero];
      setCommandesArticles(newCommandes);
    }
  };

  const handleAjouterArticle = (numero) => {
    const article = nouvelArticle[numero]?.trim();
    if (!article) {
      toast.error('Nom d\'article requis');
      return;
    }

    const articles = commandesArticles[numero] || [];
    setCommandesArticles({
      ...commandesArticles,
      [numero]: [...articles, article]
    });
    setNouvelArticle({ ...nouvelArticle, [numero]: '' });
  };

  const handleSupprimerArticle = (numero, index) => {
    const articles = [...(commandesArticles[numero] || [])];
    articles.splice(index, 1);
    setCommandesArticles({
      ...commandesArticles,
      [numero]: articles
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

  const handleValiderTraitement = async () => {
    const actionsPrevu = selectedMission.actions_prevues || [];
    
    if (actionsPrevu.length === 0) {
      toast.error('⚠️ Aucune action définie dans cette mission');
      return;
    }
    
    // Calculer le résultat global
    const actionsFaites = actionsPrevu.filter(a => a.effectuee).length;
    const toutesReussies = actionsFaites === actionsPrevu.length;
    const resultat = toutesReussies ? 'conforme' : actionsFaites > 0 ? 'partiel' : 'echoue';
    
    const tempsTotal = selectedMission.date_debut_reelle 
      ? differenceInMinutes(new Date(), new Date(selectedMission.date_debut_reelle))
      : 0;
    
    // Déterminer le statut final de la mission
    const tousServicesTermines = selectedMission.services_intervenants?.every(s => 
      s.resultat && ['conforme', 'partiel', 'echoue'].includes(s.resultat)
    ) || false;
    
    const nouveauStatut = tousServicesTermines ? 'TERMINEE' : 'EN_COURS';

    finalisationMutation.mutate({
      id: selectedMission.id,
      service,
      statut: nouveauStatut,
      resultats: resultat,
      tempsMinutes: tempsTotal
    });
  };

  const agents = useMemo(() => {
    const agentSet = new Set();
    missions.forEach(m => {
      if (m.pris_en_charge_par) {
        agentSet.add(m.pris_en_charge_par);
      }
    });
    return Array.from(agentSet).sort();
  }, [missions]);

  const filteredMissions = useMemo(() => {
    return missions.filter(m => {
      if (m.statut !== filterStatut) return false;

      if (filterDateDebut && m.created_date) {
        const missionDate = startOfDay(parseISO(m.created_date));
        const filterDate = startOfDay(new Date(filterDateDebut));
        if (isBefore(missionDate, filterDate)) return false;
      }

      if (filterDateFin && m.created_date) {
        const missionDate = endOfDay(parseISO(m.created_date));
        const filterDate = endOfDay(new Date(filterDateFin));
        if (isAfter(missionDate, filterDate)) return false;
      }

      if (filterAgent && m.pris_en_charge_par !== filterAgent) return false;

      return true;
    });
  }, [missions, filterStatut, filterDateDebut, filterDateFin, filterAgent]);

  const counts = useMemo(() => ({
    A_FAIRE: missions.filter(m => m.statut === 'A_FAIRE').length,
    EN_COURS: missions.filter(m => m.statut === 'EN_COURS').length,
    EN_ATTENTE: missions.filter(m => m.statut === 'EN_ATTENTE').length,
    TERMINEE: missions.filter(m => m.statut === 'TERMINEE').length
  }), [missions]);

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

  // Mode traitement - afficher UNIQUEMENT la page de traitement
  if (modeTraitement && selectedMission) {
    const actionsTraitees = Object.keys(tachesEtat).length;

    return (
      <div className="space-y-4">
        {/* Header avec retour */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRetourListe}
            variant="outline"
            size="sm"
          >
            ← Retour
          </Button>
          <h2 className="font-heading text-xl text-purple-700">
            Traitement de la mission
          </h2>
        </div>

        {/* En-tête mission */}
        <Card className="border-2 border-purple-300 bg-purple-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className={selectedMission.type_mission === 'HIVERNAGE' ? 'bg-blue-500' : 'bg-yellow-500'}>
                    {selectedMission.type_mission === 'HIVERNAGE' ? '❄️ Hivernage' : '🌞 Déshivernage'}
                  </Badge>
                  {(selectedMission.priorite === 'URGENTE' || selectedMission.priorite === 'CRITIQUE') && (
                    <Badge className="bg-red-500">⚠️ URGENT</Badge>
                  )}
                </div>
                <h3 className="font-heading text-lg text-purple-900">
                  {selectedMission.titre}
                </h3>
                <p className="text-sm text-purple-600">
                  {selectedMission.zones?.map(z => `${z.categorie || z.type_zone} ${z.numero}`).join(', ')}
                </p>
              </div>
              
              {selectedMission.date_debut_reelle && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-lg">
                    <Clock className="w-5 h-5 animate-pulse" />
                    {Math.floor(tempsEcoule / 60)}h {tempsEcoule % 60}min
                  </div>
                  <p className="text-xs text-purple-600">Temps écoulé</p>
                </div>
              )}
            </div>

            {selectedMission.objectif && (
              <p className="text-sm text-purple-700 italic border-t border-purple-200 pt-2">
                🎯 {selectedMission.objectif}
              </p>
            )}

            {selectedMission.services_intervenants && selectedMission.services_intervenants.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-purple-200 pt-2">
                {selectedMission.services_intervenants.map((si, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-purple-100 px-2 py-1 rounded">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-purple-900">{si.service}: {si.agent || 'Non assigné'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prise en charge si pas encore fait pour ce service */}
        {!selectedMission.services_intervenants?.some(s => s.service === service && s.agent) && (
          <Card className="border-2 border-yellow-400 bg-yellow-50">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-heading text-lg text-yellow-900">
                📝 Identification requise
              </h3>
              <Input
                value={prenomAgent}
                onChange={(e) => setPrenomAgent(e.target.value)}
                placeholder="Votre prénom *"
                className="h-12 bg-white"
                autoFocus
              />
              <Button
                onClick={handleDemarrerMission}
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
            </CardContent>
          </Card>
        )}

        {/* Progression */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-sm font-bold text-blue-900">
            📋 Progression: {Object.keys(tachesEtat).length}/{selectedMission.actions_prevues?.length || 0} actions traitées
          </p>
        </div>

        {/* Liste des actions */}
        <div className="space-y-4">
          {(selectedMission.actions_prevues || []).map((action, idx) => {
            const etat = tachesEtat[idx];
            const estEffectuee = etat?.effectuee === true;

            return (
              <Card key={idx} className={`border-2 ${
                estEffectuee ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'
              }`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      estEffectuee ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-lg">{action.action}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleToggleTache(idx, true)}
                      variant={estEffectuee ? 'default' : 'outline'}
                      className={`flex-1 h-12 text-base ${estEffectuee ? 'bg-green-600 hover:bg-green-700' : 'border-2 border-green-600 text-green-600 hover:bg-green-50'}`}
                    >
                      ✔️ Effectuée
                    </Button>
                    <Button
                      onClick={() => handleToggleTache(idx, false)}
                      variant={!estEffectuee && etat !== undefined ? 'default' : 'outline'}
                      className={`flex-1 h-12 text-base ${!estEffectuee && etat !== undefined ? 'bg-red-600 hover:bg-red-700' : 'border-2 border-red-600 text-red-600 hover:bg-red-50'}`}
                    >
                      ✖️ Non faite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bouton validation final */}
        <Card className="border-2 border-purple-400 bg-purple-50 sticky bottom-4">
          <CardContent className="p-4">
            <Button 
              onClick={handleValiderTraitement}
              disabled={finalisationMutation.isPending || !selectedMission.services_intervenants?.some(s => s.service === service && s.agent)}
              className="w-full bg-purple-600 hover:bg-purple-700 h-14 text-lg font-bold"
            >
              {finalisationMutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-6 h-6 mr-2" />
              )}
              Valider la mission
            </Button>
            <p className="text-xs text-purple-700 text-center mt-2">
              {actionsTraitees < (selectedMission.actions_prevues?.length || 0) ? (
                `⚠️ ${(selectedMission.actions_prevues?.length || 0) - actionsTraitees} action(s) restante(s)`
              ) : (
                '✅ Toutes les actions traitées'
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mode liste - afficher la liste ou le calendrier
  return (
    <div className="space-y-4">
      <MissionFilters
        filterStatut={filterStatut}
        setFilterStatut={setFilterStatut}
        filterDateDebut={filterDateDebut}
        setFilterDateDebut={setFilterDateDebut}
        filterDateFin={filterDateFin}
        setFilterDateFin={setFilterDateFin}
        filterAgent={filterAgent}
        setFilterAgent={setFilterAgent}
        agents={agents}
        counts={counts}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {viewMode === 'calendar' ? (
        <MissionCalendarView
          missions={filteredMissions}
          onMissionClick={handlePrendreEnCharge}
        />
      ) : (
        <MissionListView
          missions={filteredMissions}
          onPrendreEnCharge={handlePrendreEnCharge}
          onContinuer={handlePrendreEnCharge}
          loading={false}
        />
      )}
    </div>
  );
}