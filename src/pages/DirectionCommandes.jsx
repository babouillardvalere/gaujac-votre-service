import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Package, CheckCircle, Clock, User, ShoppingCart, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DirectionCommandes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterStatut, setFilterStatut] = useState('A_COMMANDER');
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: commandes = [], isLoading } = useQuery({
    queryKey: ['commandes-direction'],
    queryFn: async () => {
      const all = await base44.entities.CommandeDirection.list('-created_date', 200);
      return all;
    }
  });

  const deleteCommandeMutation = useMutation({
    mutationFn: (id) => base44.entities.CommandeDirection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes-direction'] });
      setShowDetails(false);
      setSelectedCommande(null);
      toast.success('Commande supprimée ✅');
    }
  });

  const updateStatutMutation = useMutation({
    mutationFn: async ({ id, statut, notes }) => {
      const updateData = { statut, notes };
      if (statut === 'COMMANDEE') {
        updateData.date_commande = new Date().toISOString();
      } else if (statut === 'RECUE') {
        updateData.date_reception = new Date().toISOString();
      }
      return await base44.entities.CommandeDirection.update(id, updateData);
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commandes-direction'] });
      
      // Si commande marquée comme reçue, débloquer les WorkItems liés
      if (variables.statut === 'RECUE') {
        try {
          const commande = commandes.find(c => c.id === variables.id);
          if (commande?.mission_id) {
            // Récupérer tous les WorkItems de cette mission
            const workItems = await base44.entities.WorkItem.filter({ 
              mission_direction_id: commande.mission_id,
              service: commande.service_demandeur
            });
            
            // Débloquer les WorkItems EN_ATTENTE de cette mission
            const workItemsEnAttente = workItems.filter(w => w.statut === 'EN_ATTENTE');
            
            if (workItemsEnAttente.length > 0) {
              await Promise.all(
                workItemsEnAttente.map(w => 
                  base44.entities.WorkItem.update(w.id, { statut: 'A_FAIRE' })
                )
              );
              
              queryClient.invalidateQueries({ queryKey: ['workitems-service'] });
              queryClient.invalidateQueries({ queryKey: ['bureau-workitems'] });
              
              // Vérifier si la mission peut repasser EN_COURS
              const autresWorkItemsEnAttente = await base44.entities.WorkItem.filter({
                mission_direction_id: commande.mission_id,
                statut: 'EN_ATTENTE'
              });
              
              // CRITIQUE: Ne JAMAIS modifier automatiquement le statut d'une mission bloquée
              if (autresWorkItemsEnAttente.length === 0) {
                const mission = await base44.entities.MissionDirection.filter({ id: commande.mission_id });
                if (mission?.[0]?.is_blocked_logistique !== true) {
                  await base44.entities.MissionDirection.update(commande.mission_id, {
                    statut: 'EN_COURS'
                  });
                  queryClient.invalidateQueries({ queryKey: ['missions-direction-list'] });
                } else {
                  console.warn('Mission bloquée logistique - recalcul ignoré', commande.mission_id);
                }
              }
              
              toast.success(`🔁 ${workItemsEnAttente.length} tâche(s) débloquée(s) !`);
            }
          }
        } catch (error) {
          console.error('Erreur déblocage WorkItems:', error);
        }
      }
      
      setShowDetails(false);
      setSelectedCommande(null);
      toast.success('Commande mise à jour ✅');
    }
  });

  const filteredCommandes = commandes.filter(c => {
    if (filterStatut === 'tous') return true;
    return c.statut === filterStatut;
  });

  const counts = {
    A_COMMANDER: commandes.filter(c => c.statut === 'A_COMMANDER').length,
    COMMANDEE: commandes.filter(c => c.statut === 'COMMANDEE').length,
    RECUE: commandes.filter(c => c.statut === 'RECUE').length
  };

  const handleOpenDetails = (commande) => {
    setSelectedCommande(commande);
    setNotes(commande.notes || '');
    setShowDetails(true);
  };

  const handleUpdateStatut = (statut) => {
    updateStatutMutation.mutate({
      id: selectedCommande.id,
      statut,
      notes: notes.trim()
    });
  };

  const handleDeleteCommande = () => {
    if (!selectedCommande) return;
    
    if (confirm('Supprimer cette commande ?')) {
      deleteCommandeMutation.mutate(selectedCommande.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-5xl mx-auto">
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
          
          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-2">
            📦 Commandes Matériel
          </h1>
          <p className="text-center text-gray-600 font-body">
            Gestion des commandes issues des missions Direction
          </p>
        </motion.div>

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap mb-6">
          <Button
            onClick={() => setFilterStatut('A_COMMANDER')}
            variant={filterStatut === 'A_COMMANDER' ? 'default' : 'outline'}
            className={filterStatut === 'A_COMMANDER' ? 'bg-red-600' : ''}
            size="sm"
          >
            À commander ({counts.A_COMMANDER})
          </Button>
          <Button
            onClick={() => setFilterStatut('COMMANDEE')}
            variant={filterStatut === 'COMMANDEE' ? 'default' : 'outline'}
            className={filterStatut === 'COMMANDEE' ? 'bg-orange-600' : ''}
            size="sm"
          >
            Commandée ({counts.COMMANDEE})
          </Button>
          <Button
            onClick={() => setFilterStatut('RECUE')}
            variant={filterStatut === 'RECUE' ? 'default' : 'outline'}
            className={filterStatut === 'RECUE' ? 'bg-green-600' : ''}
            size="sm"
          >
            Reçue ({counts.RECUE})
          </Button>
        </div>

        {/* Liste commandes */}
        {filteredCommandes.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-gray-200">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="font-heading text-xl text-gray-700 mb-2">
              Aucune commande
            </h3>
            <p className="text-gray-500 text-sm">
              {filterStatut === 'tous' 
                ? 'Aucune commande enregistrée'
                : `Aucune commande avec le statut "${filterStatut}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCommandes.map(commande => (
              <Card key={commande.id} className="border-2 border-purple-200 hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={
                          commande.type_intervention === 'HIVERNAGE' ? 'bg-blue-500' : 
                          commande.type_intervention === 'DESHIVERNAGE' ? 'bg-yellow-500' : 'bg-purple-500'
                        }>
                          {commande.type_intervention === 'HIVERNAGE' ? '❄️ Hivernage' : 
                           commande.type_intervention === 'DESHIVERNAGE' ? '🌞 Déshivernage' : '🔧 Intervention'}
                        </Badge>
                        <Badge className={
                          commande.statut === 'A_COMMANDER' ? 'bg-red-500' :
                          commande.statut === 'COMMANDEE' ? 'bg-orange-500' : 'bg-green-500'
                        }>
                          {commande.statut === 'A_COMMANDER' ? 'À commander' :
                           commande.statut === 'COMMANDEE' ? 'Commandée' : 'Reçue'}
                        </Badge>
                      </div>
                      
                      <h3 className="font-heading text-lg text-purple-700 mb-1">
                        {commande.type_hebergement} - {commande.hebergement}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className={commande.service_demandeur === 'TECHNIQUE' ? 'text-blue-600' : 'text-yellow-600'}>
                            {commande.service_demandeur === 'TECHNIQUE' ? '🧰 Technique' : '🧽 Ménage'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {commande.agent}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(commande.created_date), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>

                      {commande.tache_texte && (
                        <p className="text-xs text-gray-500 italic mb-2">
                          Tâche #{commande.tache_numero}: {commande.tache_texte}
                        </p>
                      )}

                      {/* Articles à commander */}
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-xs font-bold text-purple-700 mb-2">📦 Articles demandés:</p>
                        <div className="flex flex-wrap gap-2">
                          {commande.articles?.map((article, idx) => (
                            <Badge key={idx} variant="outline" className="bg-white">
                              {article}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleOpenDetails(commande)}
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-600 text-purple-600"
                  >
                    Gérer la commande
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog détails commande */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-heading text-purple-700">
                📦 Détails de la commande
              </DialogTitle>
            </DialogHeader>

            {selectedCommande && (
              <div className="space-y-4">
                {/* Info mission */}
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-bold">
                        {selectedCommande.type_intervention === 'HIVERNAGE' ? '❄️ Hivernage' : 
                         selectedCommande.type_intervention === 'DESHIVERNAGE' ? '🌞 Déshivernage' : '🔧 Intervention'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Hébergement:</span>
                      <span className="ml-2 font-bold">{selectedCommande.type_hebergement} - {selectedCommande.hebergement}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Service:</span>
                      <span className="ml-2 font-bold">{selectedCommande.service_demandeur}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Agent:</span>
                      <span className="ml-2 font-bold">{selectedCommande.agent}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Date demande:</span>
                      <span className="ml-2 font-bold">{format(new Date(selectedCommande.created_date), 'dd/MM/yyyy à HH:mm')}</span>
                    </div>
                  </div>
                </div>

                {/* Tâche concernée */}
                {selectedCommande.tache_texte && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Tâche #{selectedCommande.tache_numero}:</p>
                    <p className="text-sm font-medium">{selectedCommande.tache_texte}</p>
                  </div>
                )}

                {/* Articles */}
                <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                  <h3 className="font-heading text-purple-700 mb-3">📦 Articles à commander</h3>
                  <div className="space-y-2">
                    {selectedCommande.articles?.map((article, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
                        <ShoppingCart className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">{article}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes Direction */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">
                    📝 Notes Direction
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes internes, fournisseur, délai..."
                    rows={3}
                  />
                </div>

                {/* Actions selon statut */}
                <div className="space-y-2">
                  {selectedCommande.statut === 'A_COMMANDER' && (
                    <Button
                      onClick={() => handleUpdateStatut('COMMANDEE')}
                      disabled={updateStatutMutation.isPending}
                      className="w-full bg-orange-600 hover:bg-orange-700 h-12"
                    >
                      {updateStatutMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <ShoppingCart className="w-5 h-5 mr-2" />
                      )}
                      Marquer comme commandée
                    </Button>
                  )}
                  
                  {selectedCommande.statut === 'COMMANDEE' && (
                    <Button
                      onClick={() => handleUpdateStatut('RECUE')}
                      disabled={updateStatutMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 h-12"
                    >
                      {updateStatutMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      Marquer comme reçue
                    </Button>
                  )}

                  {selectedCommande.statut === 'RECUE' && (
                    <>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm font-bold text-green-700">Commande reçue ✅</p>
                        {selectedCommande.date_reception && (
                          <p className="text-xs text-gray-600 mt-1">
                            Reçue le {format(new Date(selectedCommande.date_reception), 'dd/MM/yyyy à HH:mm')}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        onClick={handleDeleteCommande}
                        disabled={deleteCommandeMutation.isPending}
                        variant="outline"
                        className="w-full border-red-500 text-red-500 hover:bg-red-50"
                      >
                        {deleteCommandeMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Supprimer la commande
                      </Button>
                    </>
                  )}

                  {/* Bouton enregistrer notes (toujours disponible) */}
                  {selectedCommande.statut !== 'RECUE' && (
                    <Button
                      onClick={() => updateStatutMutation.mutate({
                        id: selectedCommande.id,
                        statut: selectedCommande.statut,
                        notes: notes.trim()
                      })}
                      variant="outline"
                      className="w-full"
                    >
                      💾 Enregistrer les notes
                    </Button>
                  )}
                </div>

                {/* Dates */}
                {selectedCommande.date_commande && (
                  <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                    <p>📅 Commandée le: {format(new Date(selectedCommande.date_commande), 'dd/MM/yyyy à HH:mm')}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}