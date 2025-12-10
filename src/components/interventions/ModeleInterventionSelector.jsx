import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit, Trash2, Copy, Clock } from 'lucide-react';
import { useTranslation } from '../translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ModeleInterventionSelector({ onSelectModele }) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingModele, setEditingModele] = useState(null);
  
  const [newModele, setNewModele] = useState({
    nom: '',
    description: '',
    type: 'technique',
    categorie: 'autre',
    description_probleme: '',
    instructions: '',
    materiel_requis: [],
    duree_estimee: 30,
    urgent: false
  });

  const { data: modeles = [] } = useQuery({
    queryKey: ['modeles-intervention'],
    queryFn: () => base44.entities.ModeleIntervention.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ModeleIntervention.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modeles-intervention'] });
      toast.success('Modèle créé avec succès');
      setShowCreateDialog(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ModeleIntervention.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modeles-intervention'] });
      toast.success('Modèle mis à jour');
      setEditingModele(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ModeleIntervention.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modeles-intervention'] });
      toast.success('Modèle supprimé');
    }
  });

  const resetForm = () => {
    setNewModele({
      nom: '',
      description: '',
      type: 'technique',
      categorie: 'autre',
      description_probleme: '',
      instructions: '',
      materiel_requis: [],
      duree_estimee: 30,
      urgent: false
    });
  };

  const handleUseModele = async (modele) => {
    await updateMutation.mutateAsync({
      id: modele.id,
      data: { utilise_count: (modele.utilise_count || 0) + 1 }
    });
    
    if (onSelectModele) {
      onSelectModele({
        description: modele.description_probleme,
        categorie: modele.categorie,
        type: modele.type,
        urgent: modele.urgent
      });
    }
    
    toast.success(`Modèle "${modele.nom}" appliqué`);
  };

  const modelesActifs = modeles.filter(m => m.actif !== false);

  return (
    <>
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-heading text-purple-700 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {lang === 'fr' ? 'Modèles d\'intervention' : 'Intervention templates'}
              <Badge variant="outline">{modelesActifs.length}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowManageDialog(true)}
                className="border-purple-500 text-purple-600"
              >
                <Edit className="w-4 h-4 mr-1" />
                Gérer
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Créer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {modelesActifs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucun modèle disponible
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {modelesActifs.map((modele) => (
                <div
                  key={modele.id}
                  className="border-2 border-purple-200 rounded-lg p-3 hover:border-purple-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-purple-800">{modele.nom}</h4>
                      {modele.description && (
                        <p className="text-xs text-gray-600 mt-1">{modele.description}</p>
                      )}
                    </div>
                    {modele.urgent && (
                      <Badge className="bg-red-500 text-xs">Urgent</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Badge variant="outline">{modele.type}</Badge>
                    <Badge variant="outline">{modele.categorie}</Badge>
                    {modele.duree_estimee && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {modele.duree_estimee}min
                      </span>
                    )}
                  </div>

                  {modele.utilise_count > 0 && (
                    <p className="text-xs text-gray-500 mb-2">
                      Utilisé {modele.utilise_count} fois
                    </p>
                  )}

                  <Button
                    size="sm"
                    onClick={() => handleUseModele(modele)}
                    className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Utiliser ce modèle
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Créer Modèle */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-purple-700">
              <Plus className="w-5 h-5 inline mr-2" />
              Créer un modèle d'intervention
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nom du modèle *</label>
              <Input
                value={newModele.nom}
                onChange={(e) => setNewModele({...newModele, nom: e.target.value})}
                placeholder="Ex: Fuite d'eau standard"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Input
                value={newModele.description}
                onChange={(e) => setNewModele({...newModele, description: e.target.value})}
                placeholder="Description courte"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type *</label>
                <Select value={newModele.type} onValueChange={(v) => setNewModele({...newModele, type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technique">🔧 Technique</SelectItem>
                    <SelectItem value="menage">🧹 Ménage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie *</label>
                <Select value={newModele.categorie} onValueChange={(v) => setNewModele({...newModele, categorie: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gaz">Gaz</SelectItem>
                    <SelectItem value="eau">Eau</SelectItem>
                    <SelectItem value="electricite">Électricité</SelectItem>
                    <SelectItem value="plomberie">Plomberie</SelectItem>
                    <SelectItem value="literie">Literie</SelectItem>
                    <SelectItem value="vaisselle">Vaisselle</SelectItem>
                    <SelectItem value="nettoyage">Nettoyage</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description du problème</label>
              <Textarea
                value={newModele.description_probleme}
                onChange={(e) => setNewModele({...newModele, description_probleme: e.target.value})}
                placeholder="Description type du problème..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Instructions</label>
              <Textarea
                value={newModele.instructions}
                onChange={(e) => setNewModele({...newModele, instructions: e.target.value})}
                placeholder="Instructions pour résoudre le problème..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Durée estimée (minutes)</label>
              <Input
                type="number"
                value={newModele.duree_estimee}
                onChange={(e) => setNewModele({...newModele, duree_estimee: parseInt(e.target.value)})}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newModele.urgent}
                onChange={(e) => setNewModele({...newModele, urgent: e.target.checked})}
                className="w-4 h-4"
              />
              <label className="text-sm">Marquer comme urgent par défaut</label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => createMutation.mutate(newModele)}
                disabled={!newModele.nom || createMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Créer le modèle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Gérer Modèles */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-purple-700">
              Gérer les modèles
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {modeles.map((modele) => (
              <Card key={modele.id} className="border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-purple-800">{modele.nom}</h4>
                      <p className="text-sm text-gray-600">{modele.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{modele.type}</Badge>
                        <Badge variant="outline">{modele.categorie}</Badge>
                        <span className="text-xs text-gray-500">
                          Utilisé {modele.utilise_count || 0} fois
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Supprimer ce modèle ?')) {
                            deleteMutation.mutate(modele.id);
                          }
                        }}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}