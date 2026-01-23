import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, User, CheckCircle, X, Camera, Loader2, AlertTriangle, Play, ShoppingCart } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { 
  getDescriptionOperationnelle, 
  validateMissionClosure, 
  getWorkItemFinalStatus 
} from '../descriptionOperationnelleUtils';

export default function WorkItemsServiceView({ service }) {
  const queryClient = useQueryClient();
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const [modeTraitement, setModeTraitement] = useState(false);
  const [prenomAgent, setPrenomAgent] = useState('');
  const [tachesEtat, setTachesEtat] = useState({});
  const [tempsEcoule, setTempsEcoule] = useState(0);
  const [commandesArticles, setCommandesArticles] = useState({});
  const [nouvelArticle, setNouvelArticle] = useState({});
  const [filterStatut, setFilterStatut] = useState('A_FAIRE');
  const [compteRenduGlobal, setCompteRenduGlobal] = useState('');

  const { data: workItems = [], isLoading } = useQuery({
    queryKey: ['workitems-service', service],
    queryFn: async () => {
      const items = await base44.entities.WorkItem.filter({ 
        service,
        type: 'MISSION_DIRECTION'
      }, '-created_date', 250);
      return items;
    },
    refetchInterval: 30000
  });

  const { data: missions = [] } = useQuery({
    queryKey: ['missions-direction-for-workitems'],
    queryFn: () => base44.entities.MissionDirection.filter({ mission_direction: true }, '-created_date', 100),
    refetchInterval: 60000
  });

  // Timer
  useEffect(() => {
    if (modeTraitement && selectedWorkItem?.date_prise_en_charge) {
      const calculer = () => {
        const minutes = differenceInMinutes(new Date(), new Date(selectedWorkItem.date_prise_en_charge));
        setTempsEcoule(minutes);
      };
      calculer();
      const interval = setInterval(calculer, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedWorkItem, modeTraitement]);

  const priseEnChargeMutation = useMutation({
    mutationFn: async ({ id, prenom }) => {
      return await base44.entities.WorkItem.update(id, {
        statut: 'EN_COURS',
        collaborateur: prenom,
        date_prise_en_charge: new Date().toISOString()
      });
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workitems-service', service] });
      toast.success('Tâche prise en charge ⏱️');
      setSelectedWorkItem(data);
      setModeTraitement(true);
      setPrenomAgent('');
      
      const etat = {};
      (data.taches || []).forEach(t => {
        etat[t.numero] = {
          faite: t.faite !== undefined ? t.faite : undefined,
          justification: t.justification || '',
          photo_url: t.photo_url || ''
        };
      });
      setTachesEtat(etat);
      
      // Notification: Mission prise en charge
      base44.entities.Notification.create({
        type: 'MISSION_CREATED',
        titre: `🚀 Tâche ${data.hebergement} prise en charge`,
        message: `${variables.prenom} a pris en charge la tâche ${service} pour ${data.hebergement}`,
        destinataire_role: 'DIRECTION',
        priorite: data.priorite === 'URGENTE' || data.priorite === 'CRITIQUE' ? 'URGENTE' : 'NORMALE',
        metadata: { workitem_id: data.id, service }
      }).catch(err => console.error('Erreur notification:', err));
    }
  });

  const finalisationMutation = useMutation({
   mutationFn: async ({ id, taches, statut, commandesACreer, metadata, description_operationnelle }) => {
     const now = new Date().toISOString();
     const workItem = workItems.find(w => w.id === id);
     const dureeMinutes = workItem?.date_prise_en_charge 
       ? Math.floor((new Date() - new Date(workItem.date_prise_en_charge)) / 60000)
       : 0;

     const updateData = {
       taches,
       statut,
       duree_minutes: dureeMinutes,
       metadata: { ...workItem.metadata, ...metadata },
       description_operationnelle
     };

     if (statut === 'TERMINEE') {
       updateData.date_terminee = now;
     }

      // Créer les commandes si nécessaire
      if (commandesACreer && commandesACreer.length > 0) {
        const mission = missions.find(m => m.id === workItem.mission_direction_id);
        
        await base44.entities.CommandeDirection.bulkCreate(
          commandesACreer.map(cmd => ({
            mission_id: workItem.mission_direction_id,
            type_intervention: mission?.type_mission || 'INTERVENTION',
            hebergement: workItem.hebergement,
            type_hebergement: workItem.type_hebergement,
            service_demandeur: service,
            agent: workItem.collaborateur,
            tache_numero: cmd.tache_numero,
            tache_texte: cmd.tache_texte,
            articles: cmd.articles,
            statut: 'A_COMMANDER'
          }))
        );
        
        // Notification: Nouvelle commande nécessaire
        await base44.entities.Notification.create({
          type: 'STOCK_ALERTE',
          titre: `📦 ${commandesACreer.length} nouvelle(s) commande(s)`,
          message: `Commandes créées pour ${workItem.hebergement} par ${service} - ${commandesACreer.flatMap(c => c.articles).length} article(s)`,
          destinataire_role: 'DIRECTION',
          priorite: 'URGENTE',
          metadata: { 
            workitem_id: id,
            mission_id: workItem.mission_direction_id,
            nb_commandes: commandesACreer.length,
            articles: commandesACreer.flatMap(c => c.articles)
          }
        }).catch(err => console.error('Erreur notification:', err));
      }

      return await base44.entities.WorkItem.update(id, updateData);
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workitems-service', service] });
      queryClient.invalidateQueries({ queryKey: ['bureau-workitems'] });
      
      // Vérifier si la mission parent doit changer de statut
      const workItem = workItems.find(w => w.id === variables.id);
      if (workItem?.mission_direction_id) {
        const autresWorkItems = workItems.filter(w => 
          w.mission_direction_id === workItem.mission_direction_id && w.id !== variables.id
        );
        
        const tousTermines = autresWorkItems.every(w => w.statut === 'TERMINEE') && variables.statut === 'TERMINEE';
        const auMoinsUnEnAttente = autresWorkItems.some(w => w.statut === 'EN_ATTENTE') || variables.statut === 'EN_ATTENTE';
        
        let nouveauStatutMission = null;
        if (tousTermines) {
          nouveauStatutMission = 'TERMINEE';
        } else if (auMoinsUnEnAttente) {
          nouveauStatutMission = 'EN_ATTENTE';
        } else if (variables.statut === 'EN_COURS') {
          nouveauStatutMission = 'EN_COURS';
        }
        
        if (nouveauStatutMission) {
          try {
            await base44.entities.MissionDirection.update(workItem.mission_direction_id, {
              statut: nouveauStatutMission
            });
            queryClient.invalidateQueries({ queryKey: ['missions-direction-list'] });
          } catch (error) {
            console.error('Erreur MAJ statut mission:', error);
          }
        }
      }
      
      setModeTraitement(false);
      setSelectedWorkItem(null);
      setTachesEtat({});
      setCommandesArticles({});
      
      if (variables.statut === 'TERMINEE') {
        if (variables.metadata?.resultat === 'ECHEC_PARTIEL') {
          toast.success('✅ Mission terminée avec des tâches non réalisées');
        } else {
          toast.success('✅ Mission terminée avec succès');
        }
        
        // Notification: Mission terminée
        const workItem = workItems.find(w => w.id === variables.id);
        base44.entities.Notification.create({
          type: 'MISSION_COMPLETE',
          titre: `✅ Tâche ${workItem?.hebergement} terminée`,
          message: `Tâche ${service} terminée pour ${workItem?.hebergement} - Résultat: ${variables.metadata?.resultat || 'succès'}`,
          destinataire_role: 'DIRECTION',
          priorite: 'NORMALE',
          metadata: { workitem_id: variables.id, service, resultat: variables.metadata?.resultat }
        }).catch(err => console.error('Erreur notification:', err));
      } else if (variables.statut === 'EN_ATTENTE') {
        toast.success('⏸️ Mission en attente - Commande créée');
        
        // Notification: Mission en attente
        const workItem = workItems.find(w => w.id === variables.id);
        base44.entities.Notification.create({
          type: 'MISSION_REACTIVATED',
          titre: `⏸️ Tâche ${workItem?.hebergement} en attente`,
          message: `Tâche ${service} mise en attente - ${variables.commandesACreer?.length || 0} commande(s) créée(s)`,
          destinataire_role: 'DIRECTION',
          priorite: 'URGENTE',
          metadata: { 
            workitem_id: variables.id, 
            service,
            nb_commandes: variables.commandesACreer?.length || 0
          }
        }).catch(err => console.error('Erreur notification:', err));
      }
    }
  });

  const handlePrendreEnCharge = (workItem) => {
    setSelectedWorkItem(workItem);
    setModeTraitement(true);
    setCompteRenduGlobal(getDescriptionOperationnelle(workItem) || '');
    
    const etat = {};
    (workItem.taches || []).forEach(t => {
      etat[t.numero] = {
        faite: t.faite !== undefined ? t.faite : undefined,
        justification: t.justification || '',
        photo_url: t.photo_url || ''
      };
    });
    setTachesEtat(etat);
  };

  const handleDemarrer = () => {
    if (!prenomAgent.trim()) {
      toast.error('Prénom obligatoire');
      return;
    }
    priseEnChargeMutation.mutate({ id: selectedWorkItem.id, prenom: prenomAgent.trim() });
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
  };

  const handleToggleCommande = (numero, necessaire) => {
    setTachesEtat({
      ...tachesEtat,
      [numero]: {
        ...tachesEtat[numero],
        commandeNecessaire: necessaire
      }
    });

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

    setCommandesArticles({
      ...commandesArticles,
      [numero]: [...(commandesArticles[numero] || []), article]
    });
    setNouvelArticle({ ...nouvelArticle, [numero]: '' });
  };

  const handleValider = () => {
    // VALIDATION CRITIQUE 1 : Compte rendu global obligatoire
    if (!compteRenduGlobal.trim()) {
      toast.error('⚠️ Compte rendu de l\'intervention obligatoire');
      return;
    }

    // Validation stricte : toutes les tâches doivent avoir un statut
    const tachesUpdated = (selectedWorkItem.taches || []).map(t => {
      const etat = tachesEtat[t.numero];
      return {
        ...t,
        faite: etat?.faite,
        statut: etat?.faite === true ? 'FAIT' : etat?.faite === false ? 'NON_FAIT' : undefined,
        justification: etat?.justification || '',
        photo_url: etat?.photo_url || ''
      };
    });

    // Vérifier que toutes les tâches ont un statut
    const tachesSansStatut = tachesUpdated.filter(t => t.statut === undefined);
    if (tachesSansStatut.length > 0) {
      toast.error(`⚠️ ${tachesSansStatut.length} tâche(s) doivent être marquées Fait ou Pas fait`);
      return;
    }

    // Utiliser la fonction de validation centralisée
    const validation = validateMissionClosure(tachesUpdated);
    
    if (!validation.valid) {
      toast.error(`⚠️ ${validation.error}`);
      return;
    }

    // Déterminer le statut final
    let nouveauStatut;
    let commandesACreer = [];
    let metadata = {};

    if (!validation.hasFailures) {
      // Toutes les tâches sont FAIT
      nouveauStatut = 'TERMINEE';
      metadata.resultat = 'SUCCES_COMPLET';
    } else {
      // Au moins une tâche est PAS FAIT
      // Vérifier si des commandes sont nécessaires
      const tachesAvecCommande = tachesUpdated.filter(t => {
        const etat = tachesEtat[t.numero];
        return t.faite === false && etat?.commandeNecessaire === true;
      });

      if (tachesAvecCommande.length > 0) {
        // Valider que toutes ont des articles
        const tachesSansArticles = tachesAvecCommande.filter(t => 
          !commandesArticles[t.numero] || commandesArticles[t.numero].length === 0
        );

        if (tachesSansArticles.length > 0) {
          toast.error(`⚠️ Ajoutez des articles pour les tâches nécessitant une commande (${tachesSansArticles.map(t => `#${t.numero}`).join(', ')})`);
          return;
        }

        commandesACreer = tachesAvecCommande.map(t => ({
          tache_numero: t.numero,
          tache_texte: t.texte,
          articles: commandesArticles[t.numero]
        }));

        nouveauStatut = 'EN_ATTENTE';
        metadata.resultat = 'EN_ATTENTE_MATERIEL';
      } else {
        // Tâches non faites SANS commande = mission terminée avec échec partiel
        nouveauStatut = 'TERMINEE';
        metadata.resultat = 'ECHEC_PARTIEL';
        metadata.taches_echouees = tachesUpdated.filter(t => !t.faite).map(t => ({
          numero: t.numero,
          texte: t.texte,
          justification: t.justification
        }));
      }
    }

    finalisationMutation.mutate({
      id: selectedWorkItem.id,
      taches: tachesUpdated,
      statut: nouveauStatut,
      commandesACreer,
      metadata,
      description_operationnelle: compteRenduGlobal.trim()
    });
  };

  const filteredWorkItems = workItems.filter(w => {
    if (filterStatut === 'tous') return true;
    return w.statut === filterStatut;
  });

  const counts = {
    A_FAIRE: workItems.filter(w => w.statut === 'A_FAIRE').length,
    EN_COURS: workItems.filter(w => w.statut === 'EN_COURS').length,
    EN_ATTENTE: workItems.filter(w => w.statut === 'EN_ATTENTE').length,
    TERMINEE: workItems.filter(w => w.statut === 'TERMINEE').length
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Mode traitement
  if (modeTraitement && selectedWorkItem) {
    const mission = missions.find(m => m.id === selectedWorkItem.mission_direction_id);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={() => { setModeTraitement(false); setSelectedWorkItem(null); }} variant="outline" size="sm">
            ← Retour
          </Button>
          <h2 className="font-heading text-xl text-purple-700">Traitement de la tâche</h2>
        </div>

        <Card className="border-2 border-purple-300 bg-purple-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Badge className={mission?.type_mission === 'HIVERNAGE' ? 'bg-blue-500' : 'bg-yellow-500'}>
                  {mission?.type_mission || 'Mission'}
                </Badge>
                <h3 className="font-heading text-lg text-purple-900 mt-1">
                  {selectedWorkItem.hebergement} - {selectedWorkItem.type_hebergement}
                </h3>
                <p className="text-sm text-gray-600">{selectedWorkItem.titre}</p>
              </div>
              
              {selectedWorkItem.date_prise_en_charge && (
                <div className="text-right">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-lg">
                    <Clock className="w-5 h-5 animate-pulse" />
                    {Math.floor(tempsEcoule / 60)}h {tempsEcoule % 60}min
                  </div>
                </div>
              )}
            </div>

            {selectedWorkItem.collaborateur && (
              <div className="flex items-center gap-2 text-sm border-t border-purple-200 pt-2">
                <User className="w-4 h-4 text-purple-600" />
                <span className="font-bold">{selectedWorkItem.collaborateur}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {!selectedWorkItem.collaborateur ? (
          <Card className="border-2 border-yellow-400 bg-yellow-50">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-heading text-lg text-yellow-900">📝 Identification requise</h3>
              <Input
                value={prenomAgent}
                onChange={(e) => setPrenomAgent(e.target.value)}
                placeholder="Votre prénom *"
                className="h-12 bg-white"
                autoFocus
              />
              <Button
                onClick={handleDemarrer}
                disabled={!prenomAgent.trim() || priseEnChargeMutation.isPending}
                className="w-full bg-purple-600 h-12"
              >
                {priseEnChargeMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                Démarrer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
        {/* COMPTE RENDU GLOBAL */}
        <Card className="border-2 border-blue-400 bg-blue-50">
          <CardContent className="p-4">
            <label className="text-sm font-bold text-blue-900 mb-2 block">
              📋 Compte rendu de l'intervention *
            </label>
            <Textarea
              value={compteRenduGlobal}
              onChange={(e) => setCompteRenduGlobal(e.target.value)}
              placeholder="Décrivez ce qui a été réalisé ou non, et pourquoi..."
              rows={3}
              className="border-2 border-blue-300"
            />
            <p className="text-xs text-blue-600 mt-2">
              ℹ️ Ce champ est obligatoire et sera transmis au backend
            </p>
          </CardContent>
        </Card>

        {/* Tâches */}
         <div className="space-y-4">
           {(selectedWorkItem.taches || []).map(tache => {
            const etat = tachesEtat[tache.numero];
            const estFait = etat?.faite === true;
            const estPasFait = etat?.faite === false;

            return (
              <Card key={tache.numero} className={`border-2 ${
                estFait ? 'border-green-400 bg-green-50' : 
                estPasFait ? 'border-orange-400 bg-orange-50' : 
                'border-gray-300'
              }`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      estFait ? 'bg-green-600 text-white' : 
                      estPasFait ? 'bg-orange-600 text-white' : 
                      'bg-gray-300 text-gray-700'
                    }`}>
                      {tache.numero}
                    </div>
                    <p className="flex-1 font-medium text-lg">{tache.texte}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleToggleTache(tache.numero, true)}
                      variant={estFait ? 'default' : 'outline'}
                      className={`flex-1 h-12 ${estFait ? 'bg-green-600' : 'border-2 border-green-600 text-green-600'}`}
                    >
                      ✔️ Fait
                    </Button>
                    <Button
                      onClick={() => handleToggleTache(tache.numero, false)}
                      variant={estPasFait ? 'default' : 'outline'}
                      className={`flex-1 h-12 ${estPasFait ? 'bg-red-600' : 'border-2 border-red-600 text-red-600'}`}
                    >
                      ✖️ Pas fait
                    </Button>
                  </div>

                  {estPasFait && (
                    <div className="space-y-3 pl-2 border-l-4 border-orange-400">
                      <div className="pl-3">
                        <label className="text-sm font-bold text-orange-700 mb-1 block">
                          ✍️ Justification *
                        </label>
                        <Textarea
                          value={etat?.justification || ''}
                          onChange={(e) => setTachesEtat({
                            ...tachesEtat,
                            [tache.numero]: { ...tachesEtat[tache.numero], justification: e.target.value }
                          })}
                          placeholder="Pourquoi pas fait..."
                          rows={2}
                        />
                      </div>

                      <div className="pl-3 bg-purple-50 rounded-lg p-3 border-2 border-purple-300">
                        <label className="text-sm font-bold text-purple-800 mb-2 block">
                          🛒 Commande nécessaire ? (optionnel)
                        </label>
                        <div className="flex gap-2 mb-3">
                          <Button
                            onClick={() => handleToggleCommande(tache.numero, false)}
                            variant={etat?.commandeNecessaire === false ? 'default' : 'outline'}
                            className={etat?.commandeNecessaire === false ? 'bg-gray-700 flex-1' : 'flex-1'}
                            size="sm"
                          >
                            Non
                          </Button>
                          <Button
                            onClick={() => handleToggleCommande(tache.numero, true)}
                            variant={etat?.commandeNecessaire === true ? 'default' : 'outline'}
                            className={etat?.commandeNecessaire === true ? 'bg-green-600 flex-1' : 'flex-1'}
                            size="sm"
                          >
                            Oui
                          </Button>
                        </div>

                        {etat?.commandeNecessaire === true && (
                          <div className="space-y-2">
                            {(commandesArticles[tache.numero] || []).map((article, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white rounded p-2 border">
                                <span className="flex-1 text-sm">{article}</span>
                                <button
                                  onClick={() => {
                                    const articles = [...commandesArticles[tache.numero]];
                                    articles.splice(idx, 1);
                                    setCommandesArticles({ ...commandesArticles, [tache.numero]: articles });
                                  }}
                                  className="text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}

                            <div className="flex gap-2">
                              <Input
                                value={nouvelArticle[tache.numero] || ''}
                                onChange={(e) => setNouvelArticle({ ...nouvelArticle, [tache.numero]: e.target.value })}
                                placeholder="Nom article..."
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAjouterArticle(tache.numero);
                                  }
                                }}
                              />
                              <Button onClick={() => handleAjouterArticle(tache.numero)} size="sm" className="bg-purple-600">
                                ➕
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-2 border-purple-400 bg-purple-50 sticky bottom-4">
           <CardContent className="p-4 space-y-3">
             {!compteRenduGlobal.trim() && (
               <div className="bg-red-100 border-l-4 border-red-500 p-3 rounded text-red-700 text-sm font-semibold">
                 ⚠️ Remplissez le compte rendu (champ obligatoire) pour pouvoir valider
               </div>
             )}
             <Button
               onClick={handleValider}
               disabled={
                 finalisationMutation.isPending || 
                 !selectedWorkItem.collaborateur ||
                 !compteRenduGlobal.trim()
               }
               className="w-full bg-purple-600 h-14 text-lg font-bold"
               title={!compteRenduGlobal.trim() ? 'Remplissez le compte rendu' : ''}
             >
               {finalisationMutation.isPending ? (
                 <Loader2 className="w-6 h-6 animate-spin mr-2" />
               ) : (
                 <CheckCircle className="w-6 h-6 mr-2" />
               )}
               Valider
             </Button>
           </CardContent>
         </Card>
          </>
        )}
      </div>
    );
  }

  // Mode liste
  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {['A_FAIRE', 'EN_COURS', 'EN_ATTENTE', 'TERMINEE', 'tous'].map(s => (
          <Button
            key={s}
            onClick={() => setFilterStatut(s)}
            variant={filterStatut === s ? 'default' : 'outline'}
            className={filterStatut === s ? 'bg-purple-600' : ''}
            size="sm"
          >
            {s === 'tous' ? 'Toutes' : s.replace(/_/g, ' ')}
            ({s === 'tous' ? workItems.length : counts[s]})
          </Button>
        ))}
      </div>

      {filteredWorkItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucune tâche Direction</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkItems.map((workItem, idx) => {
            const mission = missions.find(m => m.id === workItem.mission_direction_id);
            const tachesCompletees = (workItem.taches || []).filter(t => t.faite).length;
            const tachesTotal = (workItem.taches || []).length;

            return (
              <Card key={workItem.id} className={`border-2 ${
                workItem.priorite === 'URGENTE' || workItem.priorite === 'CRITIQUE' ? 'border-red-500 bg-red-50' : 'border-purple-300'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={mission?.type_mission === 'HIVERNAGE' ? 'bg-blue-500' : 'bg-yellow-500'}>
                          {mission?.type_mission || 'MISSION'}
                        </Badge>
                        <Badge className={
                          workItem.statut === 'TERMINEE' ? 'bg-green-500' :
                          workItem.statut === 'EN_COURS' ? 'bg-blue-500' :
                          workItem.statut === 'EN_ATTENTE' ? 'bg-gray-500' :
                          'bg-orange-500'
                        }>
                          {workItem.statut.replace(/_/g, ' ')}
                        </Badge>
                        {(workItem.priorite === 'URGENTE' || workItem.priorite === 'CRITIQUE') && (
                          <Badge className="bg-red-500">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            URGENT
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-heading text-lg text-purple-700">
                        🏠 {workItem.hebergement} - {workItem.type_hebergement}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{workItem.titre}</p>
                      
                      {mission && (
                        <p className="text-xs text-purple-600 mt-2 italic">
                          📋 Mission: {mission.titre}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                        <span>📋 {tachesCompletees}/{tachesTotal} tâche(s)</span>
                        {workItem.collaborateur && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {workItem.collaborateur}
                          </span>
                        )}
                        {workItem.duree_minutes > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {workItem.duree_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {workItem.statut !== 'TERMINEE' && (
                    <Button
                      onClick={() => handlePrendreEnCharge(workItem)}
                      disabled={!getDescriptionOperationnelle(workItem)}
                      className="w-full bg-purple-600 h-12"
                      title={!getDescriptionOperationnelle(workItem) ? 'Description manquante' : ''}
                    >
                      {workItem.statut === 'A_FAIRE' ? 'Prendre en charge' : 'Continuer'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}