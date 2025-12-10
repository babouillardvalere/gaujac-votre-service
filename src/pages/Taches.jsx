import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../components/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Plus, ListTodo, Play, CheckCircle, Trash2, 
  Calendar, AlertCircle, Loader2, Home, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { createPageUrl } from '../utils';
import { notifierNouvelleTache, notifierChangementStatutTache } from '../components/notificationService';

export default function Taches() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    service: 'tous',
    statut: 'actives',
    priorite: 'tous',
    tri: 'echeance'
  });

  const [newTache, setNewTache] = useState({
    titre: '',
    description: '',
    categorie: 'technique',
    priorite: 'normale',
    assignee: '',
    assignee_email: '',
    hebergement: '',
    date_echeance: ''
  });

  const { data: taches = [], isLoading } = useQuery({
    queryKey: ['all-taches'],
    queryFn: () => base44.entities.Tache.list('-created_date', 500),
    refetchInterval: 30000
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tache.create(data),
    onSuccess: async (newTache) => {
      queryClient.invalidateQueries({ queryKey: ['all-taches'] });
      toast.success(lang === 'fr' ? 'Tâche créée' : 'Task created');
      setShowAddDialog(false);
      setNewTache({
        titre: '',
        description: '',
        categorie: 'technique',
        priorite: 'normale',
        assignee: '',
        assignee_email: '',
        hebergement: '',
        date_echeance: ''
      });
      
      // Notifier
      try {
        await notifierNouvelleTache(newTache);
      } catch (e) {
        console.warn('Erreur notification:', e);
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, ancienStatut }) => {
      await base44.entities.Tache.update(id, data);
      return { id, data, ancienStatut };
    },
    onSuccess: async ({ id, data, ancienStatut }) => {
      queryClient.invalidateQueries({ queryKey: ['all-taches'] });
      toast.success(lang === 'fr' ? 'Tâche mise à jour' : 'Task updated');
      
      // Notifier changement statut
      if (ancienStatut && data.statut && ancienStatut !== data.statut) {
        try {
          const tachesUpdated = await base44.entities.Tache.filter({ id });
          if (tachesUpdated.length > 0) {
            await notifierChangementStatutTache(tachesUpdated[0], ancienStatut);
          }
        } catch (e) {
          console.warn('Erreur notification statut:', e);
        }
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tache.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-taches'] });
      toast.success(lang === 'fr' ? 'Tâche supprimée' : 'Task deleted');
    }
  });

  const handleCreateTache = () => {
    if (!newTache.titre || !newTache.assignee || !newTache.date_echeance) {
      toast.error(lang === 'fr' ? 'Remplissez tous les champs obligatoires' : 'Fill all required fields');
      return;
    }

    createMutation.mutate({
      ...newTache,
      statut: 'a_faire'
    });
  };

  const filteredTaches = taches
    .filter(t => {
      if (filters.service !== 'tous' && t.categorie !== filters.service) return false;
      if (filters.statut === 'actives' && (t.statut === 'terminee' || t.statut === 'annulee')) return false;
      if (filters.statut !== 'tous' && filters.statut !== 'actives' && t.statut !== filters.statut) return false;
      if (filters.priorite !== 'tous' && t.priorite !== filters.priorite) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.tri === 'priorite') {
        const prioriteOrder = { urgente: 4, haute: 3, normale: 2, basse: 1 };
        return (prioriteOrder[b.priorite] || 2) - (prioriteOrder[a.priorite] || 2);
      } else if (filters.tri === 'creation') {
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (filters.tri === 'service') {
        return (a.categorie || '').localeCompare(b.categorie || '');
      } else {
        if (!a.date_echeance) return 1;
        if (!b.date_echeance) return -1;
        return new Date(a.date_echeance) - new Date(b.date_echeance);
      }
    });

  const getPriorityBadge = (priorite) => {
    const badges = {
      urgente: { bg: 'bg-red-100 text-red-700', label: '🔴 Urgent', icon: '🔴' },
      haute: { bg: 'bg-orange-100 text-orange-700', label: '⬆️ Haute', icon: '⬆️' },
      normale: { bg: 'bg-blue-100 text-blue-700', label: '➡️ Normale', icon: '➡️' },
      basse: { bg: 'bg-gray-100 text-gray-700', label: '⬇️ Basse', icon: '⬇️' }
    };
    const badge = badges[priorite] || badges.normale;
    return <Badge className={badge.bg}>{badge.label}</Badge>;
  };

  const getStatutBadge = (statut) => {
    const badges = {
      a_faire: { bg: 'bg-orange-500 text-white', label: lang === 'fr' ? '⏳ À faire' : '⏳ To do' },
      en_cours: { bg: 'bg-blue-500 text-white', label: lang === 'fr' ? '🔵 En cours' : '🔵 In progress' },
      en_attente: { bg: 'bg-yellow-500 text-white', label: lang === 'fr' ? '⏸️ En attente' : '⏸️ Paused' },
      terminee: { bg: 'bg-green-500 text-white', label: lang === 'fr' ? '✅ Terminée' : '✅ Completed' },
      annulee: { bg: 'bg-gray-500 text-white', label: lang === 'fr' ? '❌ Annulée' : '❌ Cancelled' }
    };
    const badge = badges[statut] || badges.a_faire;
    return <Badge className={badge.bg}>{badge.label}</Badge>;
  };

  const getCategoryColor = (categorie) => {
    return categorie === 'technique' ? 'border-[#00AEEF]' : 
           categorie === 'menage' ? 'border-[#FFD700]' : 
           'border-gray-300';
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00AEEF] to-[#0077A8] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl">
              ✅ {lang === 'fr' ? 'Gestion des Tâches' : 'Task Management'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <Home className="w-6 h-6" />
            </button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-white text-[#00AEEF] hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Nouvelle tâche' : 'New task'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-2 border-orange-300">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {taches.filter(t => t.statut === 'a_faire').length}
              </div>
              <p className="text-xs text-gray-600">{lang === 'fr' ? 'À faire' : 'To do'}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-300">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {taches.filter(t => t.statut === 'en_cours').length}
              </div>
              <p className="text-xs text-gray-600">{lang === 'fr' ? 'En cours' : 'In progress'}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-300">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {taches.filter(t => t.priorite === 'urgente' && t.statut !== 'terminee').length}
              </div>
              <p className="text-xs text-gray-600">{lang === 'fr' ? 'Urgentes' : 'Urgent'}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-300">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {taches.filter(t => t.statut === 'terminee').length}
              </div>
              <p className="text-xs text-gray-600">{lang === 'fr' ? 'Terminées' : 'Completed'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {lang === 'fr' ? 'Filtres et tri' : 'Filters and sorting'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="text-[#00AEEF]"
              >
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-heading text-[#0077A8] mb-1 block">
                  {lang === 'fr' ? 'Service' : 'Service'}
                </label>
                <Select value={filters.service} onValueChange={(v) => setFilters({...filters, service: v})}>
                  <SelectTrigger className="border-[#00AEEF]/30 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">{lang === 'fr' ? 'Tous services' : 'All services'}</SelectItem>
                    <SelectItem value="technique">🔧 Technique</SelectItem>
                    <SelectItem value="menage">🧹 Ménage</SelectItem>
                    <SelectItem value="administratif">📋 Administratif</SelectItem>
                    <SelectItem value="achat">🛒 Achat</SelectItem>
                    <SelectItem value="autre">❓ Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-heading text-[#0077A8] mb-1 block">
                  {lang === 'fr' ? 'Statut' : 'Status'}
                </label>
                <Select value={filters.statut} onValueChange={(v) => setFilters({...filters, statut: v})}>
                  <SelectTrigger className="border-[#00AEEF]/30 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actives">{lang === 'fr' ? 'Actives uniquement' : 'Active only'}</SelectItem>
                    <SelectItem value="tous">{lang === 'fr' ? 'Tous statuts' : 'All statuses'}</SelectItem>
                    <SelectItem value="a_faire">⏳ {lang === 'fr' ? 'À faire' : 'To do'}</SelectItem>
                    <SelectItem value="en_cours">🔵 {lang === 'fr' ? 'En cours' : 'In progress'}</SelectItem>
                    <SelectItem value="en_attente">⏸️ {lang === 'fr' ? 'En attente' : 'Paused'}</SelectItem>
                    <SelectItem value="terminee">✅ {lang === 'fr' ? 'Terminées' : 'Completed'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-heading text-[#0077A8] mb-1 block">
                  {lang === 'fr' ? 'Priorité' : 'Priority'}
                </label>
                <Select value={filters.priorite} onValueChange={(v) => setFilters({...filters, priorite: v})}>
                  <SelectTrigger className="border-[#00AEEF]/30 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">{lang === 'fr' ? 'Toutes' : 'All'}</SelectItem>
                    <SelectItem value="urgente">🔴 {lang === 'fr' ? 'Urgente' : 'Urgent'}</SelectItem>
                    <SelectItem value="haute">⬆️ {lang === 'fr' ? 'Haute' : 'High'}</SelectItem>
                    <SelectItem value="normale">➡️ {lang === 'fr' ? 'Normale' : 'Normal'}</SelectItem>
                    <SelectItem value="basse">⬇️ {lang === 'fr' ? 'Basse' : 'Low'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-heading text-[#0077A8] mb-1 block">
                  {lang === 'fr' ? 'Trier par' : 'Sort by'}
                </label>
                <Select value={filters.tri} onValueChange={(v) => setFilters({...filters, tri: v})}>
                  <SelectTrigger className="border-[#00AEEF]/30 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="echeance">📅 {lang === 'fr' ? 'Échéance' : 'Deadline'}</SelectItem>
                    <SelectItem value="priorite">⚡ {lang === 'fr' ? 'Priorité' : 'Priority'}</SelectItem>
                    <SelectItem value="creation">🆕 {lang === 'fr' ? 'Création' : 'Creation'}</SelectItem>
                    <SelectItem value="service">🏢 {lang === 'fr' ? 'Service' : 'Service'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              {filteredTaches.length} {lang === 'fr' ? 'tâche(s) trouvée(s)' : 'task(s) found'}
            </p>
          </CardContent>
        </Card>

        {/* Liste des tâches */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
          </div>
        ) : filteredTaches.length === 0 ? (
          <div className="text-center py-12">
            <ListTodo className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{lang === 'fr' ? 'Aucune tâche trouvée' : 'No tasks found'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTaches.map(tache => (
              <motion.div
                key={tache.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`border-2 ${getCategoryColor(tache.categorie)} rounded-xl`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className="font-heading text-lg text-[#0077A8]">{tache.titre}</h3>
                          {getStatutBadge(tache.statut)}
                        </div>
                        {tache.description && (
                          <p className="text-sm text-gray-600 whitespace-pre-line mb-3">{tache.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {getPriorityBadge(tache.priorite)}
                          <Badge className={
                            tache.categorie === 'technique' ? 'bg-purple-100 text-purple-700' :
                            tache.categorie === 'menage' ? 'bg-pink-100 text-pink-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {tache.categorie === 'technique' ? '🔧 Technique' :
                             tache.categorie === 'menage' ? '🧹 Ménage' :
                             tache.categorie === 'administratif' ? '📋 Admin' :
                             tache.categorie === 'achat' ? '🛒 Achat' :
                             '❓ Autre'}
                          </Badge>
                          {tache.assignee && (
                            <Badge variant="outline">👤 {tache.assignee}</Badge>
                          )}
                          {tache.hebergement && (
                            <Badge variant="outline">🏠 {tache.hebergement}</Badge>
                          )}
                          {tache.date_echeance && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(new Date(tache.date_echeance), 'dd/MM/yyyy HH:mm')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {tache.statut !== 'terminee' && tache.statut !== 'annulee' && (
                      <div className="flex gap-2 pt-3 border-t">
                        {tache.statut === 'a_faire' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              updateMutation.mutate({
                                id: tache.id,
                                data: { statut: 'en_cours', date_debut: new Date().toISOString() },
                                ancienStatut: tache.statut
                              });
                            }}
                            className="flex-1 bg-blue-500 hover:bg-blue-600"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            {lang === 'fr' ? 'Commencer' : 'Start'}
                          </Button>
                        )}
                        {tache.statut === 'en_cours' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              updateMutation.mutate({
                                id: tache.id,
                                data: { statut: 'en_attente' },
                                ancienStatut: tache.statut
                              });
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            {lang === 'fr' ? 'Pause' : 'Pause'}
                          </Button>
                        )}
                        {tache.statut === 'en_attente' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              updateMutation.mutate({
                                id: tache.id,
                                data: { statut: 'en_cours' },
                                ancienStatut: tache.statut
                              });
                            }}
                            className="flex-1 bg-blue-500 hover:bg-blue-600"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            {lang === 'fr' ? 'Reprendre' : 'Resume'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            updateMutation.mutate({
                              id: tache.id,
                              data: { statut: 'terminee', date_fin: new Date().toISOString() },
                              ancienStatut: tache.statut
                            });
                          }}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {lang === 'fr' ? 'Terminer' : 'Complete'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(lang === 'fr' ? 'Supprimer cette tâche ?' : 'Delete this task?')) {
                              deleteMutation.mutate(tache.id);
                            }
                          }}
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Nouvelle Tâche */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-[#0077A8]">
              <Plus className="w-5 h-5 inline mr-2" />
              {lang === 'fr' ? 'Créer une nouvelle tâche' : 'Create a new task'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                {lang === 'fr' ? 'Titre' : 'Title'} *
              </label>
              <Input
                value={newTache.titre}
                onChange={(e) => setNewTache({...newTache, titre: e.target.value})}
                placeholder={lang === 'fr' ? 'Ex: Réparer lave-vaisselle MH12' : 'Ex: Fix dishwasher MH12'}
                className="border-2"
              />
            </div>

            <div>
              <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                {lang === 'fr' ? 'Description' : 'Description'}
              </label>
              <Textarea
                value={newTache.description}
                onChange={(e) => setNewTache({...newTache, description: e.target.value})}
                placeholder={lang === 'fr' ? 'Détails de la tâche...' : 'Task details...'}
                rows={4}
                className="border-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Service' : 'Service'} *
                </label>
                <Select value={newTache.categorie} onValueChange={(v) => {
                  setNewTache({
                    ...newTache, 
                    categorie: v,
                    assignee: v === 'technique' ? 'Service Technique' : 
                              v === 'menage' ? 'Service Ménage' : '',
                    assignee_email: v === 'technique' ? 'technique@campingparadis.com' : 
                                     v === 'menage' ? 'menage@campingparadis.com' : ''
                  });
                }}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technique">🔧 Technique</SelectItem>
                    <SelectItem value="menage">🧹 Ménage</SelectItem>
                    <SelectItem value="administratif">📋 Administratif</SelectItem>
                    <SelectItem value="achat">🛒 Achat</SelectItem>
                    <SelectItem value="autre">❓ Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Priorité' : 'Priority'}
                </label>
                <Select value={newTache.priorite} onValueChange={(v) => setNewTache({...newTache, priorite: v})}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgente">🔴 {lang === 'fr' ? 'Urgente' : 'Urgent'}</SelectItem>
                    <SelectItem value="haute">⬆️ {lang === 'fr' ? 'Haute' : 'High'}</SelectItem>
                    <SelectItem value="normale">➡️ {lang === 'fr' ? 'Normale' : 'Normal'}</SelectItem>
                    <SelectItem value="basse">⬇️ {lang === 'fr' ? 'Basse' : 'Low'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Assigné à' : 'Assigned to'} *
                </label>
                <Input
                  value={newTache.assignee}
                  onChange={(e) => setNewTache({...newTache, assignee: e.target.value})}
                  placeholder={lang === 'fr' ? 'Nom du collaborateur' : 'Staff name'}
                  className="border-2"
                />
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Email (optionnel)' : 'Email (optional)'}
                </label>
                <Input
                  type="email"
                  value={newTache.assignee_email}
                  onChange={(e) => setNewTache({...newTache, assignee_email: e.target.value})}
                  placeholder="email@exemple.com"
                  className="border-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Hébergement (optionnel)' : 'Accommodation (optional)'}
                </label>
                <Input
                  value={newTache.hebergement}
                  onChange={(e) => setNewTache({...newTache, hebergement: e.target.value})}
                  placeholder={lang === 'fr' ? 'Ex: MH12, C3' : 'Ex: MH12, C3'}
                  className="border-2"
                />
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Échéance' : 'Deadline'} *
                </label>
                <Input
                  type="datetime-local"
                  value={newTache.date_echeance}
                  onChange={(e) => setNewTache({...newTache, date_echeance: e.target.value})}
                  className="border-2"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
                disabled={createMutation.isPending}
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
              <Button
                onClick={handleCreateTache}
                disabled={createMutation.isPending}
                className="flex-1 bg-[#00AEEF] hover:bg-[#0077A8]"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {lang === 'fr' ? 'Créer la tâche' : 'Create task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}