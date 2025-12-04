import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  ArrowLeft, Package, Plus, Edit, Trash2, AlertTriangle, CheckCircle,
  Loader2, Clock, History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';

export default function Materiel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  
  const [showAddStock, setShowAddStock] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [stockForm, setStockForm] = useState({
    nom_article: '', categorie: 'technique', quantite: 0, seuil_alerte: 5, unite: 'unité'
  });

  const categoriesStock = [
    { value: 'technique', label: t('cat_technique') },
    { value: 'menage', label: t('cat_menage') },
    { value: 'literie', label: t('cat_literie') },
    { value: 'vaisselle', label: t('cat_vaisselle') },
    { value: 'divers', label: t('cat_divers') }
  ];

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
  }, [navigate]);

  const { data: incidentsAttente = [] } = useQuery({
    queryKey: ['incidents-attente-materiel'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente_materiel', attente_materiel: true }, '-attente_date', 100)
  });

  const { data: stock = [], isLoading: stockLoading } = useQuery({
    queryKey: ['stock'],
    queryFn: () => base44.entities.Stock.list('-created_date', 200)
  });

  const { data: historique = [] } = useQuery({
    queryKey: ['historique-materiel'],
    queryFn: () => base44.entities.HistoriqueMateriel.list('-date_utilisation', 100)
  });

  const createStockMutation = useMutation({
    mutationFn: (data) => base44.entities.Stock.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success(t('article_ajoute'));
      setShowAddStock(false);
      resetForm();
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Stock.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success(t('article_modifie'));
      setEditingStock(null);
      resetForm();
    }
  });

  const deleteStockMutation = useMutation({
    mutationFn: (id) => base44.entities.Stock.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success(t('article_supprime'));
    }
  });

  const updateIncidentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents-attente-materiel'] });
      toast.success(t('intervention_mise_a_jour'));
    }
  });

  const resetForm = () => {
    setStockForm({ nom_article: '', categorie: 'technique', quantite: 0, seuil_alerte: 5, unite: 'unité' });
  };

  const handleSaveStock = () => {
    if (!stockForm.nom_article.trim()) {
      toast.error(t('nom_requis'));
      return;
    }
    if (editingStock) {
      updateStockMutation.mutate({ id: editingStock.id, data: stockForm });
    } else {
      createStockMutation.mutate(stockForm);
    }
  };

  const handleEditStock = (item) => {
    setStockForm({
      nom_article: item.nom_article,
      categorie: item.categorie,
      quantite: item.quantite,
      seuil_alerte: item.seuil_alerte,
      unite: item.unite || 'unité'
    });
    setEditingStock(item);
    setShowAddStock(true);
  };

  const handleMaterielReceptionne = (incident) => {
    updateIncidentMutation.mutate({
      id: incident.id,
      data: {
        statut: 'en_cours',
        attente_materiel: false
      }
    });
  };

  const getStockStatus = (item) => {
    if (item.quantite === 0) return { label: t('rupture'), color: 'bg-red-500' };
    if (item.quantite <= item.seuil_alerte) return { label: t('faible'), color: 'bg-[#FFA500]' };
    return { label: t('ok'), color: 'bg-green-500' };
  };

  const stockAlerts = stock.filter(s => s.quantite <= s.seuil_alerte);

  return (
    <div className="min-h-screen pb-8">
      <div className="bg-[#0077A8] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('MenuCollaborateur')} className="p-2 hover:bg-white/20 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-xl">{t('gestion_materiel')}</h1>
              <p className="text-white/80 text-sm font-body">
                {stockAlerts.length > 0 && <span className="text-[#FFD700]">{stockAlerts.length} {t('alertes').toLowerCase()}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Package className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="demandes" className="space-y-6">
          <TabsList className="bg-[#0077A8]/10 p-1 rounded-xl border border-[#0077A8]/30">
            <TabsTrigger value="demandes" className="rounded-lg font-heading data-[state=active]:bg-[#0077A8] data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />
              {t('demandes')} ({incidentsAttente.length})
            </TabsTrigger>
            <TabsTrigger value="stock" className="rounded-lg font-heading data-[state=active]:bg-[#0077A8] data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />
              {t('stock')}
            </TabsTrigger>
            <TabsTrigger value="historique" className="rounded-lg font-heading data-[state=active]:bg-[#0077A8] data-[state=active]:text-white">
              <History className="w-4 h-4 mr-2" />
              {t('historique')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demandes" className="space-y-4">
            {incidentsAttente.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="font-heading text-[#0077A8]">{t('aucune_demande_materiel')}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {incidentsAttente.map((incident) => (
                  <Card key={incident.id} className="border-2 border-red-300 rounded-xl bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-red-500 text-white">
                              <Package className="w-3 h-3 mr-1" />
                              {t('materiel_requis')}
                            </Badge>
                            <span className="font-heading text-[#0077A8]">
                              {incident.logement || incident.emplacement}
                            </span>
                          </div>
                          <p className="font-body text-red-700 font-medium mb-2">
                            {incident.attente_materiel_detail || t('materiel_non_specifie')}
                          </p>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{t('categorie')}: {incident.categorie}</p>
                            <p>{t('signale_par')}: {incident.pris_par}</p>
                            <p>{t('date')}: {incident.attente_date && format(new Date(incident.attente_date), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleMaterielReceptionne(incident)}
                            className="bg-green-500 hover:bg-green-600 rounded-xl font-heading text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {t('receptionne')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            {stockAlerts.length > 0 && (
              <Card className="border-2 border-red-300 rounded-xl bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {t('alertes_stock')} ({stockAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stockAlerts.map(item => (
                      <Badge key={item.id} className={`${item.quantite === 0 ? 'bg-red-500' : 'bg-[#FFA500]'} text-white`}>
                        {item.nom_article}: {item.quantite} {item.unite}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => { resetForm(); setEditingStock(null); setShowAddStock(true); }}
                className="bg-[#0077A8] hover:bg-[#005f85] rounded-xl font-heading"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('ajouter_article')}
              </Button>
            </div>

            <Card className="border-2 border-[#0077A8]/30 rounded-xl overflow-hidden">
              <CardContent className="p-0">
                {stockLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0077A8]" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0077A8]/10">
                        <tr className="text-left text-sm font-heading text-[#0077A8]">
                          <th className="p-3">{t('article')}</th>
                          <th className="p-3">{t('categorie')}</th>
                          <th className="p-3">{t('quantite')}</th>
                          <th className="p-3">{t('seuil_alerte')}</th>
                          <th className="p-3">{t('statut')}</th>
                          <th className="p-3">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stock.map(item => {
                          const status = getStockStatus(item);
                          return (
                            <tr key={item.id} className="border-t font-body hover:bg-gray-50">
                              <td className="p-3 font-heading text-[#0077A8]">{item.nom_article}</td>
                              <td className="p-3">{categoriesStock.find(c => c.value === item.categorie)?.label || item.categorie}</td>
                              <td className="p-3">{item.quantite} {item.unite}</td>
                              <td className="p-3">{item.seuil_alerte}</td>
                              <td className="p-3">
                                <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditStock(item)}>
                                    <Edit className="w-4 h-4 text-[#0077A8]" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteStockMutation.mutate(item.id)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historique" className="space-y-4">
            <Card className="border-2 border-[#0077A8]/30 rounded-xl overflow-hidden">
              <CardContent className="p-0">
                {historique.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="font-body text-gray-500">{t('aucun_historique')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0077A8]/10">
                        <tr className="text-left text-sm font-heading text-[#0077A8]">
                          <th className="p-3">{t('date')}</th>
                          <th className="p-3">{t('article')}</th>
                          <th className="p-3">{t('quantite')}</th>
                          <th className="p-3">{t('hebergement')}</th>
                          <th className="p-3">{t('collaborateur_label')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historique.map(item => (
                          <tr key={item.id} className="border-t font-body">
                            <td className="p-3 text-sm">
                              {item.date_utilisation && format(new Date(item.date_utilisation), 'dd/MM/yy HH:mm')}
                            </td>
                            <td className="p-3">{item.article}</td>
                            <td className="p-3">{item.quantite}</td>
                            <td className="p-3 font-heading text-[#0077A8]">{item.hebergement}</td>
                            <td className="p-3">{item.collaborateur}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAddStock} onOpenChange={setShowAddStock}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8]">
              {editingStock ? t('modifier_article') : t('ajouter_article')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">{t('nom_article')} *</label>
              <Input
                value={stockForm.nom_article}
                onChange={(e) => setStockForm({ ...stockForm, nom_article: e.target.value })}
                placeholder="Ex: Ampoule LED"
                className="border-[#00AEEF]/30 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">{t('categorie')}</label>
              <Select value={stockForm.categorie} onValueChange={(v) => setStockForm({ ...stockForm, categorie: v })}>
                <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoriesStock.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-heading text-[#0077A8]">{t('quantite')}</label>
                <Input
                  type="number"
                  value={stockForm.quantite}
                  onChange={(e) => setStockForm({ ...stockForm, quantite: parseInt(e.target.value) || 0 })}
                  className="border-[#00AEEF]/30 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-heading text-[#0077A8]">{t('seuil_alerte')}</label>
                <Input
                  type="number"
                  value={stockForm.seuil_alerte}
                  onChange={(e) => setStockForm({ ...stockForm, seuil_alerte: parseInt(e.target.value) || 5 })}
                  className="border-[#00AEEF]/30 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">{t('unite')}</label>
              <Input
                value={stockForm.unite}
                onChange={(e) => setStockForm({ ...stockForm, unite: e.target.value })}
                placeholder="unité, kg, L..."
                className="border-[#00AEEF]/30 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStock(false)} className="rounded-xl">
              {t('annuler')}
            </Button>
            <Button
              onClick={handleSaveStock}
              disabled={createStockMutation.isPending || updateStockMutation.isPending}
              className="bg-[#0077A8] hover:bg-[#005f85] rounded-xl font-heading"
            >
              {editingStock ? t('modifier') : t('ajouter')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}