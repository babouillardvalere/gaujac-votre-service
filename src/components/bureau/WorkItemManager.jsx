import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUp, ArrowDown, Edit, Trash2, AlertTriangle, Clock, User, CheckCircle, 
  Loader2, X, Check 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function WorkItemManager({ lang }) {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');

  const { data: workItems = [], isLoading, error } = useQuery({
    queryKey: ['work-items'],
    queryFn: () => base44.entities.WorkItem.filter({}, 'rank', 250),
    refetchInterval: 30000,
    retry: 2,
    onError: (err) => {
      console.error('[WorkItemManager] Error loading work items:', err);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['work-items']);
      toast.success(lang === 'fr' ? 'Mis à jour' : 'Updated');
      setEditingItem(null);
    },
    onError: (err) => {
      console.error('[WorkItemManager] Update error:', err);
      toast.error(lang === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, motif, user }) => {
      const workItem = (workItems ?? []).find(w => w.id === id);
      if (workItem) {
        await base44.entities.HistoriqueEvent.create({
          type_event: 'INTERVENTION_ANNULEE',
          titre: `Intervention annulee`,
          description: motif,
          service: workItem.service,
          hebergement: workItem.hebergement,
          collaborateur: user,
          metadata: { workitem_id: id }
        });
      }
      return base44.entities.WorkItem.update(id, {
        statut: 'ANNULEE',
        motif_annulation: motif,
        annulee_par: user,
        date_annulation: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-items']);
      toast.success(lang === 'fr' ? 'Annulée' : 'Cancelled');
      setShowCancelDialog(null);
      setMotifAnnulation('');
    },
    onError: (err) => {
      console.error('[WorkItemManager] Cancel error:', err);
      toast.error(lang === 'fr' ? 'Erreur lors de l\'annulation' : 'Cancellation error');
    }
  });

  const moveItem = async (id, direction) => {
    const item = (workItems ?? []).find(w => w.id === id);
    if (!item) return;
    const activeItems = (workItems ?? []).filter(w => w.statut !== 'ANNULEE' && w.statut !== 'TERMINEE');
    const currentIndex = activeItems.findIndex(w => w.id === id);
    
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === activeItems.length - 1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetItem = activeItems[targetIndex];
    
    await Promise.all([
      base44.entities.WorkItem.update(item.id, { rank: targetItem.rank }),
      base44.entities.WorkItem.update(targetItem.id, { rank: item.rank })
    ]);
    
    queryClient.invalidateQueries(['work-items']);
  };

  const activeItems = (workItems ?? []).filter(w => w.statut !== 'ANNULEE');

  const statusColor = {
    'A_FAIRE': 'bg-orange-500',
    'EN_COURS': 'bg-blue-500',
    'EN_ATTENTE': 'bg-gray-500',
    'TERMINEE': 'bg-green-500',
    'ANNULEE': 'bg-red-500'
  };

  const priorityColor = {
    'NORMALE': 'bg-blue-100 text-blue-700',
    'URGENTE': 'bg-orange-100 text-orange-700',
    'CRITIQUE': 'bg-red-100 text-red-700'
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFA500]" />
      </div>
    );
  }

  if (error) {
    console.error('[WorkItemManager] Render error:', error);
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <p className="text-sm">{lang === 'fr' ? 'Erreur de chargement' : 'Loading error'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{lang === 'fr' ? 'Aucune demande active' : 'No active requests'}</p>
        </div>
      ) : (
        activeItems.map((item, index) => (
          <Card key={item.id} className={`border-2 ${item.priorite === 'URGENTE' ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Numéro d'ordre */}
                <div className="flex flex-col gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    item.priorite === 'URGENTE' ? 'bg-red-500 text-white' : 'bg-[#00AEEF] text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveItem(item.id, 'up')}
                    disabled={index === 0}
                    className="h-6 w-8"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveItem(item.id, 'down')}
                    disabled={index === activeItems.length - 1}
                    className="h-6 w-8"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={statusColor[item.statut] + ' text-white'}>
                        {item.statut.replace('_', ' ')}
                      </Badge>
                      <Badge className={priorityColor[item.priorite]}>
                        {item.priorite}
                      </Badge>
                      <Badge variant="outline">
                        {item.service}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingItem(item)}
                        className="h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setShowCancelDialog(item)}
                        className="h-8 w-8 text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{item.titre}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span>🏠 {item.hebergement}</span>
                    {item.client_nom && <span>👤 {item.client_prenom} {item.client_nom}</span>}
                    {item.collaborateur && <span><User className="w-3 h-3 inline mr-1" />{item.collaborateur}</span>}
                    {item.taches?.length > 0 && <span>📋 {item.taches.length} tâche(s)</span>}
                  </div>

                  {item.autorisation_acces === 'non' && item.plages_horaires?.length > 0 && (
                    <div className="mt-2 text-xs bg-orange-50 border border-orange-200 rounded p-2">
                      <span className="font-semibold">⏰ Créneaux: </span>
                      {item.plages_horaires.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog Edition */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{lang === 'fr' ? 'Modifier la demande' : 'Edit request'}</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Service</label>
                  <Select
                    value={editingItem.service}
                    onValueChange={(v) => setEditingItem({ ...editingItem, service: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TECHNIQUE">TECHNIQUE</SelectItem>
                      <SelectItem value="MENAGE">MENAGE</SelectItem>
                      <SelectItem value="RECEPTION">RECEPTION</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">{lang === 'fr' ? 'Priorité' : 'Priority'}</label>
                  <Select
                    value={editingItem.priorite}
                    onValueChange={(v) => setEditingItem({ ...editingItem, priorite: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMALE">NORMALE</SelectItem>
                      <SelectItem value="URGENTE">URGENTE</SelectItem>
                      <SelectItem value="CRITIQUE">CRITIQUE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">{lang === 'fr' ? 'Hébergement' : 'Accommodation'}</label>
                <Input
                  value={editingItem.hebergement}
                  onChange={(e) => setEditingItem({ ...editingItem, hebergement: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1 block">Description</label>
                <Textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => updateMutation.mutate({ id: editingItem.id, data: editingItem })}
                  disabled={updateMutation.isPending}
                  className="bg-[#00AEEF]"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {lang === 'fr' ? 'Enregistrer' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Annulation */}
      <Dialog open={!!showCancelDialog} onOpenChange={() => setShowCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {lang === 'fr' ? 'Annuler la demande' : 'Cancel request'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {lang === 'fr' 
                ? 'Vous êtes sur le point d\'annuler cette demande. Cette action sera tracée dans l\'historique.'
                : 'You are about to cancel this request. This action will be logged in history.'}
            </p>
            <div>
              <label className="text-sm font-semibold mb-1 block">
                {lang === 'fr' ? 'Motif d\'annulation *' : 'Cancellation reason *'}
              </label>
              <Textarea
                value={motifAnnulation}
                onChange={(e) => setMotifAnnulation(e.target.value)}
                placeholder={lang === 'fr' ? 'Expliquez pourquoi cette demande est annulée...' : 'Explain why this request is cancelled...'}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowCancelDialog(null); setMotifAnnulation(''); }}>
                {lang === 'fr' ? 'Retour' : 'Back'}
              </Button>
              <Button
                onClick={async () => {
                  if (!motifAnnulation.trim()) {
                    toast.error(lang === 'fr' ? 'Motif obligatoire' : 'Reason required');
                    return;
                  }
                  const user = await base44.auth.me();
                  cancelMutation.mutate({
                    id: showCancelDialog.id,
                    motif: motifAnnulation,
                    user: user.full_name || user.email
                  });
                }}
                disabled={cancelMutation.isPending || !motifAnnulation.trim()}
                className="bg-red-500 hover:bg-red-600"
              >
                {cancelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {lang === 'fr' ? 'Confirmer l\'annulation' : 'Confirm cancellation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}