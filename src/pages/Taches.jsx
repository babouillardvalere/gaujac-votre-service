import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, Search, Filter, Calendar as CalendarIcon, Clock, User, CheckCircle, 
  Circle, Pause, XCircle, AlertTriangle, ArrowLeft, Trash2, Edit, Link,
  Bell, ListTodo, Loader2, Home, BarChart3
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, addDays, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const prioriteConfig = {
  basse: { color: 'bg-gray-100 text-gray-700', label: 'Basse', icon: '⬇️' },
  normale: { color: 'bg-blue-100 text-blue-700', label: 'Normale', icon: '➡️' },
  haute: { color: 'bg-orange-100 text-orange-700', label: 'Haute', icon: '⬆️' },
  urgente: { color: 'bg-red-100 text-red-700', label: 'Urgente', icon: '🔴' }
};

const statutConfig = {
  a_faire: { color: 'bg-gray-200 text-gray-700', label: 'À faire', icon: Circle },
  en_cours: { color: 'bg-blue-500 text-white', label: 'En cours', icon: Clock },
  en_attente: { color: 'bg-orange-500 text-white', label: 'En attente', icon: Pause },
  terminee: { color: 'bg-green-500 text-white', label: 'Terminée', icon: CheckCircle },
  annulee: { color: 'bg-red-200 text-red-700', label: 'Annulée', icon: XCircle }
};

const categorieConfig = {
  technique: { color: 'bg-purple-100 text-purple-700', label: '🔧 Technique' },
  menage: { color: 'bg-pink-100 text-pink-700', label: '🧹 Ménage' },
  administratif: { color: 'bg-indigo-100 text-indigo-700', label: '📋 Administratif' },
  achat: { color: 'bg-green-100 text-green-700', label: '🛒 Achat' },
  autre: { color: 'bg-gray-100 text-gray-700', label: '📝 Autre' }
};

export default function Taches() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('toutes');
  const [filters, setFilters] = useState({
    search: '',
    priorite: 'all',
    categorie: 'all',
    assignee: 'all'
  });

  const collaborateurNom = sessionStorage.getItem('collaborateur_nom') || '';

  const { data: taches = [], isLoading } = useQuery({
    queryKey: ['taches'],
    queryFn: () => base44.entities.Tache.filter({}, '-date_echeance', 200)
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents-for-tasks'],
    queryFn: () => base44.entities.Incident.filter({}, '-date_saisie', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tache.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taches'] });
      toast.success('Tâche créée');
      setShowCreateDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tache.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taches'] });
      toast.success('Tâche mise à jour');
      setEditingTask(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tache.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taches'] });
      toast.success('Tâche supprimée');
    }
  });

  // Filtrage des tâches
  const filteredTaches = useMemo(() => {
    return taches.filter(t => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!t.titre?.toLowerCase().includes(searchLower) && 
            !t.description?.toLowerCase().includes(searchLower) &&
            !t.assignee?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (filters.priorite !== 'all' && t.priorite !== filters.priorite) return false;
      if (filters.categorie !== 'all' && t.categorie !== filters.categorie) return false;
      if (filters.assignee !== 'all' && t.assignee !== filters.assignee) return false;
      return true;
    });
  }, [taches, filters]);

  // Tâches par onglet
  const tachesParTab = useMemo(() => {
    const now = new Date();
    return {
      toutes: filteredTaches.filter(t => t.statut !== 'terminee' && t.statut !== 'annulee'),
      miennes: filteredTaches.filter(t => t.assignee === collaborateurNom && t.statut !== 'terminee'),
      urgentes: filteredTaches.filter(t => {
        if (t.statut === 'terminee' || t.statut === 'annulee') return false;
        if (t.priorite === 'urgente') return true;
        if (t.date_echeance && isPast(new Date(t.date_echeance))) return true;
        if (t.date_echeance && differenceInHours(new Date(t.date_echeance), now) < 24) return true;
        return false;
      }),
      terminees: filteredTaches.filter(t => t.statut === 'terminee')
    };
  }, [filteredTaches, collaborateurNom]);

  // Stats
  const stats = useMemo(() => ({
    total: taches.filter(t => t.statut !== 'terminee' && t.statut !== 'annulee').length,
    miennes: taches.filter(t => t.assignee === collaborateurNom && t.statut !== 'terminee').length,
    urgentes: tachesParTab.urgentes.length,
    terminees: taches.filter(t => t.statut === 'terminee').length
  }), [taches, tachesParTab, collaborateurNom]);

  // Liste des assignees uniques
  const assignees = useMemo(() => {
    return [...new Set(taches.map(t => t.assignee).filter(Boolean))];
  }, [taches]);

  const getEcheanceLabel = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isPast(d)) return { label: 'En retard', className: 'text-red-600 font-bold' };
    if (isToday(d)) return { label: "Aujourd'hui", className: 'text-orange-600 font-medium' };
    if (isTomorrow(d)) return { label: 'Demain', className: 'text-yellow-600' };
    return { label: format(d, 'dd/MM', { locale: fr }), className: 'text-gray-600' };
  };

  const TaskCard = ({ task }) => {
    const echeance = getEcheanceLabel(task.date_echeance);
    const StatutIcon = statutConfig[task.statut]?.icon || Circle;
    const linkedIncident = task.incident_id ? incidents.find(i => i.id === task.incident_id) : null;

    return (
      <Card className={`border rounded-xl hover:shadow-md transition-all ${task.priorite === 'urgente' ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <button
                onClick={() => {
                  const newStatut = task.statut === 'terminee' ? 'a_faire' : 'terminee';
                  updateMutation.mutate({ 
                    id: task.id, 
                    data: { 
                      statut: newStatut,
                      date_fin: newStatut === 'terminee' ? new Date().toISOString() : null
                    } 
                  });
                }}
                className="mt-1"
              >
                <StatutIcon className={`w-5 h-5 ${task.statut === 'terminee' ? 'text-green-500' : 'text-gray-400'}`} />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className={`font-heading text-[#0077A8] ${task.statut === 'terminee' ? 'line-through opacity-60' : ''}`}>
                  {task.titre}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-500 font-body line-clamp-2 mt-1">{task.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={prioriteConfig[task.priorite]?.color}>
                    {prioriteConfig[task.priorite]?.icon} {prioriteConfig[task.priorite]?.label}
                  </Badge>
                  <Badge className={categorieConfig[task.categorie]?.color}>
                    {categorieConfig[task.categorie]?.label}
                  </Badge>
                  {task.assignee && (
                    <Badge variant="outline" className="text-xs">
                      <User className="w-3 h-3 mr-1" />
                      {task.assignee}
                    </Badge>
                  )}
                  {linkedIncident && (
                    <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                      <Link className="w-3 h-3 mr-1" />
                      {linkedIncident.logement || linkedIncident.emplacement}
                    </Badge>
                  )}
                </div>
                {echeance && (
                  <p className={`text-xs mt-2 flex items-center gap-1 ${echeance.className}`}>
                    <CalendarIcon className="w-3 h-3" />
                    Échéance: {echeance.label}
                    {task.date_echeance && (
                      <span className="text-gray-400 ml-1">
                        ({format(new Date(task.date_echeance), 'HH:mm')})
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingTask(task)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500"
                onClick={() => deleteMutation.mutate(task.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TaskForm = ({ task, onClose }) => {
    const [formData, setFormData] = useState(task || {
      titre: '',
      description: '',
      priorite: 'normale',
      statut: 'a_faire',
      categorie: 'autre',
      assignee: collaborateurNom,
      date_echeance: null,
      incident_id: '',
      hebergement: ''
    });

    const handleSubmit = () => {
      if (!formData.titre || !formData.assignee || !formData.date_echeance) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
      if (task) {
        updateMutation.mutate({ id: task.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    };

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8]">
              {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-heading text-[#0077A8] mb-1 block">Titre *</label>
              <Input
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                placeholder="Titre de la tâche..."
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-heading text-[#0077A8] mb-1 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée..."
                className="rounded-xl"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">Priorité</label>
                <Select value={formData.priorite} onValueChange={(v) => setFormData({ ...formData, priorite: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(prioriteConfig).map(([key, { label, icon }]) => (
                      <SelectItem key={key} value={key}>{icon} {label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">Catégorie</label>
                <Select value={formData.categorie} onValueChange={(v) => setFormData({ ...formData, categorie: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categorieConfig).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">Assigné à *</label>
                <Input
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  placeholder="Nom du collaborateur"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-1 block">Statut</label>
                <Select value={formData.statut} onValueChange={(v) => setFormData({ ...formData, statut: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statutConfig).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-heading text-[#0077A8] mb-1 block">Date d'échéance *</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full rounded-xl justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {formData.date_echeance ? format(new Date(formData.date_echeance), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Sélectionner...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date_echeance ? new Date(formData.date_echeance) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        date.setHours(18, 0, 0, 0);
                        setFormData({ ...formData, date_echeance: date.toISOString() });
                      }
                    }}
                    locale={fr}
                  />
                  <div className="p-3 border-t">
                    <Input
                      type="time"
                      value={formData.date_echeance ? format(new Date(formData.date_echeance), 'HH:mm') : '18:00'}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(':');
                        const d = formData.date_echeance ? new Date(formData.date_echeance) : new Date();
                        d.setHours(parseInt(h), parseInt(m));
                        setFormData({ ...formData, date_echeance: d.toISOString() });
                      }}
                      className="rounded-lg"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-heading text-[#0077A8] mb-1 block">Lier à une intervention</label>
              <Select 
                value={formData.incident_id || 'none'} 
                onValueChange={(v) => setFormData({ ...formData, incident_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  <SelectItem value="none">Aucune intervention</SelectItem>
                  {incidents.slice(0, 30).map(inc => (
                    <SelectItem key={inc.id} value={inc.id}>
                      {inc.logement || inc.emplacement} - {inc.client_nom} ({inc.statut})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-heading text-[#0077A8] mb-1 block">Hébergement concerné</label>
              <Input
                value={formData.hebergement}
                onChange={(e) => setFormData({ ...formData, hebergement: e.target.value })}
                placeholder="Ex: MH42, E15..."
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="rounded-xl">Annuler</Button>
            <Button onClick={handleSubmit} className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl">
              {task ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-[#00AEEF] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(createPageUrl('MenuCollaborateur'))} className="p-2 hover:bg-white/20 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-xl flex items-center gap-2">
                <ListTodo className="w-5 h-5" />
                Gestion des tâches
              </h1>
              <p className="text-white/80 text-sm">{stats.total} tâche(s) en cours</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-white text-[#00AEEF] hover:bg-gray-100 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="border-2 border-gray-200 rounded-xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-heading text-[#0077A8]">{stats.total}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 rounded-xl bg-blue-50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-heading text-blue-600">{stats.miennes}</p>
              <p className="text-xs text-gray-500">Mes tâches</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-200 rounded-xl bg-red-50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-heading text-red-600">{stats.urgentes}</p>
              <p className="text-xs text-gray-500">Urgentes</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 rounded-xl bg-green-50">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-heading text-green-600">{stats.terminees}</p>
              <p className="text-xs text-gray-500">Terminées</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="border border-gray-200 rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 rounded-xl"
                />
              </div>
              <Select value={filters.priorite} onValueChange={(v) => setFilters({ ...filters, priorite: v })}>
                <SelectTrigger className="w-32 rounded-xl">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {Object.entries(prioriteConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.categorie} onValueChange={(v) => setFilters({ ...filters, categorie: v })}>
                <SelectTrigger className="w-36 rounded-xl">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {Object.entries(categorieConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.assignee} onValueChange={(v) => setFilters({ ...filters, assignee: v })}>
                <SelectTrigger className="w-36 rounded-xl">
                  <SelectValue placeholder="Assigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {assignees.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#00AEEF]/20 rounded-xl w-full">
            <TabsTrigger value="toutes" className="flex-1 rounded-lg data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white">
              Toutes ({tachesParTab.toutes.length})
            </TabsTrigger>
            <TabsTrigger value="miennes" className="flex-1 rounded-lg data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white">
              Mes tâches ({tachesParTab.miennes.length})
            </TabsTrigger>
            <TabsTrigger value="urgentes" className="flex-1 rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white">
              🔴 Urgentes ({tachesParTab.urgentes.length})
            </TabsTrigger>
            <TabsTrigger value="terminees" className="flex-1 rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white">
              ✅ Terminées
            </TabsTrigger>
          </TabsList>

          {['toutes', 'miennes', 'urgentes', 'terminees'].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
                </div>
              ) : tachesParTab[tab].length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune tâche</p>
                </div>
              ) : (
                tachesParTab[tab].map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Dialogs */}
      {showCreateDialog && <TaskForm onClose={() => setShowCreateDialog(false)} />}
      {editingTask && <TaskForm task={editingTask} onClose={() => setEditingTask(null)} />}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t z-20">
        <div className="max-w-4xl mx-auto">
          <Button 
            onClick={() => navigate(createPageUrl('MenuCollaborateur'))} 
            className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading"
          >
            <Home className="w-5 h-5 mr-2" />
            Retour au menu
          </Button>
        </div>
      </div>
    </div>
  );
}