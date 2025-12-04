import React, { useState } from 'react';
import { useTranslation } from '../translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package, Plus, AlertTriangle, Edit, Trash2, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

export default function BureauStock() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    nom_article: '',
    categorie: 'technique',
    quantite: 0,
    seuil_alerte: 5,
    unite: 'pièces'
  });

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ['stock'],
    queryFn: () => base44.entities.Stock.filter({}, 'nom_article', 500)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Stock.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setShowAddDialog(false);
      resetForm();
      toast.success('Article ajouté');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Stock.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setEditingItem(null);
      resetForm();
      toast.success('Article mis à jour');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Stock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Article supprimé');
    }
  });

  const resetForm = () => {
    setFormData({
      nom_article: '',
      categorie: 'technique',
      quantite: 0,
      seuil_alerte: 5,
      unite: 'pièces'
    });
  };

  const handleSubmit = () => {
    if (!formData.nom_article) return;
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      nom_article: item.nom_article,
      categorie: item.categorie,
      quantite: item.quantite,
      seuil_alerte: item.seuil_alerte,
      unite: item.unite || 'pièces'
    });
    setShowAddDialog(true);
  };

  const lowStockItems = stock.filter(item => item.quantite <= item.seuil_alerte);
  const categories = ['technique', 'menage', 'literie', 'vaisselle', 'divers'];

  const groupedStock = categories.reduce((acc, cat) => {
    acc[cat] = stock.filter(item => item.categorie === cat);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              {t('alerte_stock')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <Badge key={item.id} variant="destructive" className="px-3 py-1">
                  {item.nom_article}: {item.quantite} {item.unite}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t('stock')}
            </CardTitle>
            <Dialog open={showAddDialog} onOpenChange={(open) => {
              setShowAddDialog(open);
              if (!open) {
                setEditingItem(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Modifier article' : 'Ajouter un article'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm text-slate-600">Nom de l'article</label>
                    <Input
                      value={formData.nom_article}
                      onChange={(e) => setFormData({ ...formData, nom_article: e.target.value })}
                      className="mt-1"
                      placeholder="Ex: Ampoule LED"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-600">Catégorie</label>
                      <Select 
                        value={formData.categorie} 
                        onValueChange={(v) => setFormData({ ...formData, categorie: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{t(cat)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Unité</label>
                      <Input
                        value={formData.unite}
                        onChange={(e) => setFormData({ ...formData, unite: e.target.value })}
                        className="mt-1"
                        placeholder="pièces"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-600">{t('quantite')}</label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.quantite}
                        onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">{t('seuil')}</label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.seuil_alerte}
                        onChange={(e) => setFormData({ ...formData, seuil_alerte: parseInt(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!formData.nom_article || createMutation.isPending || updateMutation.isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingItem ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map(cat => {
                const items = groupedStock[cat];
                if (!items || items.length === 0) return null;
                
                return (
                  <div key={cat}>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 uppercase">{t(cat)}</h3>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div 
                          key={item.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            item.quantite <= item.seuil_alerte 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.quantite <= item.seuil_alerte && (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="font-medium">{item.nom_article}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`font-semibold ${
                              item.quantite <= item.seuil_alerte ? 'text-red-600' : 'text-slate-700'
                            }`}>
                              {item.quantite} {item.unite}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => deleteMutation.mutate(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {stock.length === 0 && (
                <p className="text-center text-slate-500 py-8">Aucun article en stock</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}