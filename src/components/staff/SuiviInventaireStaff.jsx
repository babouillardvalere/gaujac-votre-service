import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Clock, CheckCircle, Loader2, Package, Wrench, Sparkles, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const statutOptions = [
  { value: 'en_attente', label: 'En attente', color: 'bg-orange-100 text-orange-700' },
  { value: 'en_cours', label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  { value: 'termine', label: 'Terminé', color: 'bg-green-100 text-green-700' },
  { value: 'non_requis', label: 'Non requis', color: 'bg-gray-100 text-gray-500' }
];

export default function SuiviInventaireStaff({ serviceFilter = 'all' }) {
  const queryClient = useQueryClient();
  const [editingSuivi, setEditingSuivi] = useState(null);
  const [formData, setFormData] = useState({
    statut_menage: '',
    statut_technique: '',
    message_client: '',
    commentaire_interne: ''
  });

  const { data: suivis = [], isLoading } = useQuery({
    queryKey: ['suivis-inventaire-staff', serviceFilter],
    queryFn: async () => {
      const allSuivis = await base44.entities.SuiviInventaire.list('-created_date', 100);
      
      if (serviceFilter === 'menage') {
        return allSuivis.filter(s => s.items_menage && s.items_menage.length > 0);
      }
      if (serviceFilter === 'technique') {
        return allSuivis.filter(s => s.items_technique && s.items_technique.length > 0);
      }
      return allSuivis;
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SuiviInventaire.update(id, {
      ...data,
      date_derniere_maj: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suivis-inventaire-staff'] });
      toast.success('Suivi mis à jour');
      setEditingSuivi(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SuiviInventaire.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suivis-inventaire-staff'] });
      toast.success('Suivi supprimé');
    }
  });

  const handleEdit = (suivi) => {
    setEditingSuivi(suivi);
    setFormData({
      statut_menage: suivi.statut_menage,
      statut_technique: suivi.statut_technique,
      message_client: suivi.message_client || '',
      commentaire_interne: suivi.commentaire_interne || ''
    });
  };

  const handleUpdate = () => {
    updateMutation.mutate({ id: editingSuivi.id, data: formData });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {suivis.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun suivi d'inventaire</p>
        </div>
      ) : (
        suivis.map(suivi => {
          const menageConfig = statutOptions.find(s => s.value === suivi.statut_menage);
          const techniqueConfig = statutOptions.find(s => s.value === suivi.statut_technique);

          return (
            <Card key={suivi.id} className="border-2 border-gray-200 rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-heading text-lg text-[#0077A8]">
                      {suivi.type_inventaire === 'ARRIVEE' ? '🏡 Arrivée' : '🚗 Départ'} - {suivi.logement}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {suivi.client_nom} {suivi.client_prenom} • {suivi.date_arrivee} → {suivi.date_depart}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(suivi.created_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(suivi)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-500"
                      onClick={() => {
                        if (confirm('Supprimer ce suivi ?')) {
                          deleteMutation.mutate(suivi.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Items Ménage */}
                {suivi.items_menage && suivi.items_menage.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-pink-600" />
                      <span className="font-heading text-sm">🧹 Ménage</span>
                      <Badge className={menageConfig.color}>{menageConfig.label}</Badge>
                    </div>
                    <div className="pl-6 space-y-1">
                      {suivi.items_menage.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          • {item.label} ({item.motif})
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Technique */}
                {suivi.items_technique && suivi.items_technique.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="w-4 h-4 text-purple-600" />
                      <span className="font-heading text-sm">🔧 Technique</span>
                      <Badge className={techniqueConfig.color}>{techniqueConfig.label}</Badge>
                    </div>
                    <div className="pl-6 space-y-1">
                      {suivi.items_technique.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          • {item.label} ({item.motif})
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commentaire interne */}
                {suivi.commentaire_interne && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-3">
                    <p className="text-xs text-gray-600">
                      <strong>Note interne:</strong> {suivi.commentaire_interne}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Dialog édition */}
      {editingSuivi && (
        <Dialog open={true} onOpenChange={() => setEditingSuivi(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-[#0077A8]">
                Modifier le suivi - {editingSuivi.logement}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingSuivi.items_menage && editingSuivi.items_menage.length > 0 && (
                <div>
                  <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                    Statut Ménage
                  </label>
                  <Select value={formData.statut_menage} onValueChange={(v) => setFormData({ ...formData, statut_menage: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statutOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editingSuivi.items_technique && editingSuivi.items_technique.length > 0 && (
                <div>
                  <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                    Statut Technique
                  </label>
                  <Select value={formData.statut_technique} onValueChange={(v) => setFormData({ ...formData, statut_technique: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statutOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  Message client (visible)
                </label>
                <Textarea
                  value={formData.message_client}
                  onChange={(e) => setFormData({ ...formData, message_client: e.target.value })}
                  placeholder="Ex: Intervention planifiée pour demain matin"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  Commentaire interne (invisible client)
                </label>
                <Textarea
                  value={formData.commentaire_interne}
                  onChange={(e) => setFormData({ ...formData, commentaire_interne: e.target.value })}
                  placeholder="Notes internes pour l'équipe..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSuivi(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate} className="bg-[#00AEEF] hover:bg-[#0077A8]">
                Mettre à jour
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}