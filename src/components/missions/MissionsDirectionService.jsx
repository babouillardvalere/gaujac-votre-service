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
    if (modeTraitement && selectedMission?.date_prise_en_charge) {
      const calculerTemps = () => {
        const minutes = differenceInMinutes(new Date(), new Date(selectedMission.date_prise_en_charge));
        setTempsEcoule(minutes);
      };
      
      calculerTemps();
      const interval = setInterval(calculerTemps, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedMission, modeTraitement]);

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
    }
  });

  const finalisationMutation = useMutation({
    mutationFn: async ({ id, taches, statut, motifAttente }) => {
      const now = new Date().toISOString();
      const missionActuelle = missions.find(m => m.id === id);
      const dureeMinutes = missionActuelle?.date_prise_en_charge 
        ? Math.floor((new Date() - new Date(missionActuelle.date_prise_en_charge)) / 60000)
        : 0;

      // PAYLOAD COMPLET pour éviter blocage QA
      const updateData = {
        ...missionActuelle,
        taches,
        statut,
        temps_ecoule_minutes: dureeMinutes
      };

      if (statut === 'TERMINEE') {
        updateData.date_terminee = now;
        
        // Générer le PDF automatiquement
        try {
          const pdfBlob = await genererPDFIntervention({
            mission: { ...missionActuelle, taches },
            service,
            tempsTotal: dureeMinutes
          });

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
      setModeTraitement(false);
      setSelectedMission(null);
      setTachesEtat({});
      setCommandesArticles({});
      setNouvelArticle({});
      
      if (variables.statut === 'TERMINEE') {
        toast.success('✅ Mission terminée - PDF généré');
      } else if (variables.statut === 'EN_ATTENTE') {
        toast.success('⏸️ Mission mise en attente');
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
    mission.taches.forEach(t => {
      etat[t.numero] = {
        faite: t.faite !== undefined ? t.faite : undefined,
        justification: t.justification || '',
        photo_url: t.photo_url || ''
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
    priseEnChargeMutation.mutate({ id: selectedMission.id, prenom: prenomAgent.trim() });
  };

  const handleToggleTache = (numero, newStatus) => {
    setTachesEtat({
      ...tachesEtat,
      [numero]: {
        ...tachesEtat[numero],
        faite: newStatus,
        justification: newStatus ? '' : tachesEtat[numero]?.justification || '',
        commandeNecessaire: newStatus ? undefined : tachesEtat[numero]?.commandeNecessaire
      }
    });
    
    // Réinitialiser les articles si on repasse à "fait"
    if (newStatus && commandesArticles[numero]) {
      const newCommandes = { ...commandesArticles };
      delete newCommandes[numero];
      setCommandesArticles(newCommandes);
    }
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

    const tachesSansJustification = tachesUpdated.filter(t => !t.faite && !t.justification?.trim());
    if (tachesSansJustification.length > 0) {
      toast.error(`⚠️ Justification obligatoire pour les tâches non faites (${tachesSansJustification.map(t => t.numero).join(', ')})`);
      return;
    }

    const tachesSansArticles = selectedMission.taches.filter(t => {
      const etat = tachesEtat[t.numero];
      return !etat?.faite && etat?.commandeNecessaire === true && (!commandesArticles[t.numero] || commandesArticles[t.numero].length === 0);
    });

    if (tachesSansArticles.length > 0) {
      toast.error(`⚠️ Ajoutez au moins un article pour les commandes nécessaires (tâche(s) ${tachesSansArticles.map(t => t.numero).join(', ')})`);
      return;
    }

    // Commande nécessaire est maintenant optionnel - on considère "non" si non renseigné

    const touteFait = tachesUpdated.every(t => t.faite);
    const tachesAvecCommande = selectedMission.taches.filter(t => {
      const etat = tachesEtat[t.numero];
      return !etat?.faite && etat?.commandeNecessaire === true;
    });

    let nouveauStatut, motifAttente;

    if (touteFait) {
      nouveauStatut = 'TERMINEE';
      motifAttente = null;
    } else if (tachesAvecCommande.length > 0) {
      // Des commandes sont nécessaires → EN_ATTENTE
      const tachesNonFaites = tachesUpdated.filter(t => !t.faite);
      const justifications = tachesNonFaites.map(t => `Tâche ${t.numero}: ${t.justification}`).join('\n');
      nouveauStatut = 'EN_ATTENTE';
      motifAttente = justifications;
    } else {
      // Tâches non faites SANS commande nécessaire → TERMINEE avec échec partiel
      nouveauStatut = 'TERMINEE';
      motifAttente = null;
    }

    try {
      const commandesACreer = selectedMission.taches
        .filter(t => {
          const etat = tachesEtat[t.numero];
          return !etat?.faite && etat?.commandeNecessaire === true && commandesArticles[t.numero]?.length > 0;
        })
        .map(t => ({
          mission_id: selectedMission.id,
          type_intervention: selectedMission.type_intervention,
          hebergement: selectedMission.numero_hebergement,
          type_hebergement: selectedMission.type_hebergement,
          service_demandeur: service,
          agent: selectedMission.pris_en_charge_par,
          tache_numero: t.numero,
          tache_texte: t.texte,
          articles: commandesArticles[t.numero],
          statut: 'A_COMMANDER'
        }));

      if (commandesACreer.length > 0) {
        await base44.entities.CommandeDirection.bulkCreate(commandesACreer);
        toast.success(`📦 ${commandesACreer.length} commande(s) créée(s)`);
      }
    } catch (error) {
      console.error('Erreur création commandes:', error);
      toast.error('Erreur lors de la création des commandes');
      return;
    }

    finalisationMutation.mutate({
      id: selectedMission.id,
      taches: tachesUpdated,
      statut: nouveauStatut,
      motifAttente
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
    const tachesRepondues = selectedMission.taches.filter(t => tachesEtat[t.numero]?.faite !== undefined).length;

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
                  <Badge className={selectedMission.type_intervention === 'HIVERNAGE' ? 'bg-blue-500' : 'bg-yellow-500'}>
                    {selectedMission.type_intervention === 'HIVERNAGE' ? '❄️ Hivernage' : '🌞 Déshivernage'}
                  </Badge>
                  {selectedMission.priorite === 'URGENTE' && (
                    <Badge className="bg-red-500">⚠️ URGENT</Badge>
                  )}
                </div>
                <h3 className="font-heading text-lg text-purple-900">
                  {selectedMission.type_hebergement} - {selectedMission.numero_hebergement}
                </h3>
              </div>
              
              {selectedMission.date_prise_en_charge && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-lg">
                    <Clock className="w-5 h-5 animate-pulse" />
                    {Math.floor(tempsEcoule / 60)}h {tempsEcoule % 60}min
                  </div>
                  <p className="text-xs text-purple-600">Temps écoulé</p>
                </div>
              )}
            </div>

            {selectedMission.description && (
              <p className="text-sm text-purple-700 italic border-t border-purple-200 pt-2">
                {selectedMission.description}
              </p>
            )}

            {selectedMission.pris_en_charge_par && (
              <div className="flex items-center gap-2 text-sm border-t border-purple-200 pt-2">
                <User className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-purple-900">{selectedMission.pris_en_charge_par}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prise en charge si pas encore fait */}
        {!selectedMission.pris_en_charge_par && (
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
            📋 Progression: {tachesRepondues}/{selectedMission.taches.length} tâches traitées
          </p>
        </div>

        {/* Liste des tâches */}
        <div className="space-y-4">
          {selectedMission.taches.map(tache => {
            const etat = tachesEtat[tache.numero];
            const estRepondu = etat?.faite !== undefined;
            const estFait = etat?.faite === true;
            const estPasFait = etat?.faite === false;

            return (
              <Card key={tache.numero} className={`border-2 ${
                estRepondu ? (estFait ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50') : 'border-gray-300 bg-white'
              }`}>
                <CardContent className="p-4 space-y-3">
                  {/* En-tête tâche */}
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      estRepondu ? (estFait ? 'bg-green-600 text-white' : 'bg-orange-600 text-white') : 'bg-gray-300 text-gray-700'
                    }`}>
                      {tache.numero}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-lg">{tache.texte}</p>
                      {!estRepondu && (
                        <p className="text-sm text-red-600 font-bold mt-1">⚠️ À traiter</p>
                      )}
                    </div>
                  </div>

                  {/* Boutons Fait / Pas fait */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleToggleTache(tache.numero, true)}
                      variant={estFait ? 'default' : 'outline'}
                      className={`flex-1 h-12 text-base ${estFait ? 'bg-green-600 hover:bg-green-700' : 'border-2 border-green-600 text-green-600 hover:bg-green-50'}`}
                    >
                      ✔️ Fait
                    </Button>
                    <Button
                      onClick={() => handleToggleTache(tache.numero, false)}
                      variant={estPasFait ? 'default' : 'outline'}
                      className={`flex-1 h-12 text-base ${estPasFait ? 'bg-red-600 hover:bg-red-700' : 'border-2 border-red-600 text-red-600 hover:bg-red-50'}`}
                    >
                      ✖️ Pas fait
                    </Button>
                  </div>

                  {/* Section "Pas fait" */}
                  {estPasFait && (
                    <div className="space-y-3 pl-2 border-l-4 border-orange-400">
                      {/* Justification */}
                      <div className="pl-3">
                        <label className="text-sm font-bold text-orange-700 mb-1 block">
                          ✍️ Justification obligatoire *
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
                          className="bg-white border-2 border-orange-300"
                        />
                      </div>

                      {/* Commande nécessaire */}
                      <div className="pl-3 bg-purple-50 rounded-lg p-3 border-2 border-purple-300">
                        <label className="text-sm font-bold text-purple-800 mb-2 block">
                          🛒 Une commande est-elle nécessaire ? (optionnel)
                        </label>
                        <div className="flex gap-2 mb-3">
                          <Button
                            onClick={() => handleToggleCommande(tache.numero, false)}
                            variant={etat?.commandeNecessaire === false ? 'default' : 'outline'}
                            className={etat?.commandeNecessaire === false ? 'bg-gray-700 flex-1' : 'border-2 border-gray-600 text-gray-600 flex-1'}
                            size="sm"
                          >
                            Non
                          </Button>
                          <Button
                            onClick={() => handleToggleCommande(tache.numero, true)}
                            variant={etat?.commandeNecessaire === true ? 'default' : 'outline'}
                            className={etat?.commandeNecessaire === true ? 'bg-green-600 flex-1' : 'border-2 border-green-600 text-green-600 flex-1'}
                            size="sm"
                          >
                            Oui
                          </Button>
                        </div>

                        {/* Ajout articles */}
                        {etat?.commandeNecessaire === true && (
                          <div className="space-y-2">
                            {commandesArticles[tache.numero]?.map((article, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2 border-2 border-purple-200">
                                <span className="flex-1 text-sm font-medium">{article}</span>
                                <button
                                  onClick={() => handleSupprimerArticle(tache.numero, idx)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}

                            <div className="flex gap-2">
                              <Input
                                value={nouvelArticle[tache.numero] || ''}
                                onChange={(e) => setNouvelArticle({ ...nouvelArticle, [tache.numero]: e.target.value })}
                                placeholder="Nom de l'article..."
                                className="flex-1 bg-white"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAjouterArticle(tache.numero);
                                  }
                                }}
                              />
                              <Button
                                onClick={() => handleAjouterArticle(tache.numero)}
                                size="sm"
                                className="bg-purple-600"
                              >
                                ➕
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Photo */}
                  <div className="flex items-center gap-3">
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
                        disabled={uploadingPhoto === tache.numero}
                        type="button"
                        asChild
                      >
                        <span>
                          {uploadingPhoto === tache.numero ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Camera className="w-4 h-4 mr-2" />
                          )}
                          Photo (facultatif)
                        </span>
                      </Button>
                    </label>
                    {etat?.photo_url && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Ajoutée
                      </span>
                    )}
                  </div>

                  {etat?.photo_url && (
                    <img src={etat.photo_url} alt={`Tâche ${tache.numero}`} className="w-40 h-40 object-cover rounded-lg border-2 border-gray-300" />
                  )}
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
              disabled={finalisationMutation.isPending || !selectedMission.pris_en_charge_par}
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
              {tachesRepondues < selectedMission.taches.length ? (
                `⚠️ ${selectedMission.taches.length - tachesRepondues} tâche(s) restante(s)`
              ) : (
                '✅ Toutes les tâches traitées'
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