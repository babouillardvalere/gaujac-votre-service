import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUp, ArrowDown, Edit, Trash2, AlertTriangle, Clock, User, CheckCircle, 
  Loader2, X, Check, TrendingUp, Home, Wrench, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { recomputeMissionRollup } from '../missions/recomputeMissionRollup';

export default function WorkItemManager({ lang }) {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');
  const [periodeStats, setPeriodeStats] = useState('7'); // 7, 30 jours
  const [selectedHebergement, setSelectedHebergement] = useState(null);

  const { data: workItems = [], isLoading, error } = useQuery({
    queryKey: ['work-items'],
    queryFn: async () => {
      const result = await base44.entities.WorkItem.filter({}, 'rank', 250);
      // GARDE ANTI-ORPHELINS : exclure WorkItems annulés
      return result.filter(wi => wi.statut !== 'ANNULEE');
    },
    refetchInterval: 30000,
    retry: 2,
    onError: (err) => {
      console.error('[WorkItemManager] Error loading work items:', err);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updated = await base44.entities.WorkItem.update(id, data);
      if (updated?.mission_direction_id) {
        await recomputeMissionRollup(updated.mission_direction_id);
      }
      return updated;
    },
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
    
    const [updated1, updated2] = await Promise.all([
      base44.entities.WorkItem.update(item.id, { rank: targetItem.rank }),
      base44.entities.WorkItem.update(targetItem.id, { rank: item.rank })
    ]);
    
    // Recalculer rollups si missions liées
    if (updated1?.mission_direction_id) await recomputeMissionRollup(updated1.mission_direction_id);
    if (updated2?.mission_direction_id) await recomputeMissionRollup(updated2.mission_direction_id);
    
    queryClient.invalidateQueries(['work-items']);
  };

  const activeItems = (workItems ?? []).filter(w => w.statut !== 'ANNULEE');

  // Calcul des statistiques par hébergement
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - parseInt(periodeStats));
  
  const workItemsPeriode = (workItems ?? []).filter(w => {
    if (!w.created_date) return false;
    const createdDate = new Date(w.created_date);
    return createdDate >= dateLimit;
  });

  const statsByHebergement = {};
  workItemsPeriode.forEach(item => {
    const hebergement = item.hebergement || 'Non spécifié';
    if (!statsByHebergement[hebergement]) {
      statsByHebergement[hebergement] = {
        hebergement,
        type_hebergement: item.type_hebergement || 'N/A',
        interventions: [],
        services: new Set()
      };
    }
    statsByHebergement[hebergement].interventions.push(item);
    if (item.service) statsByHebergement[hebergement].services.add(item.service);
  });

  const statsArray = Object.values(statsByHebergement)
    .map(stat => ({
      ...stat,
      count: stat.interventions.length,
      services: Array.from(stat.services).join(', ')
    }))
    .sort((a, b) => b.count - a.count);

  const totalInterventions = workItemsPeriode.length;
  const techniqueCount = workItemsPeriode.filter(w => w.service === 'TECHNIQUE').length;
  const menageCount = workItemsPeriode.filter(w => w.service === 'MENAGE').length;

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
    <div className="space-y-6">
      {/* Statistiques par hébergement */}
      <Card className="border-2 border-purple-300">
        <CardHeader>
          <CardTitle className="font-heading text-purple-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              {lang === 'fr' ? 'Statistiques par hébergement' : 'Stats by accommodation'}
            </div>
            <Select value={periodeStats} onValueChange={setPeriodeStats}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Indicateurs globaux */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="text-xs text-blue-700 mb-1">{lang === 'fr' ? 'Total interventions' : 'Total interventions'}</div>
              <div className="text-2xl font-bold text-blue-900">{totalInterventions}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
              <div className="flex items-center gap-1 text-xs text-orange-700 mb-1">
                <Wrench className="w-3 h-3" />
                Technique
              </div>
              <div className="text-2xl font-bold text-orange-900">{techniqueCount}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
              <div className="flex items-center gap-1 text-xs text-yellow-700 mb-1">
                <Sparkles className="w-3 h-3" />
                Ménage
              </div>
              <div className="text-2xl font-bold text-yellow-900">{menageCount}</div>
            </div>
          </div>

          {/* Graphiques de synthèse */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Graphique barres */}
            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <h3 className="font-bold text-sm text-gray-700 mb-4">
                📊 {lang === 'fr' ? 'Interventions par hébergement (Top 10)' : 'Interventions by accommodation (Top 10)'}
              </h3>
              {statsArray.length > 0 ? (
                <div className="space-y-2">
                  {statsArray.slice(0, 10).map((stat, index) => {
                    const techniqueCount = stat.interventions.filter(i => i.service === 'TECHNIQUE').length;
                    const menageCount = stat.interventions.filter(i => i.service === 'MENAGE').length;
                    const maxCount = Math.max(...statsArray.map(s => s.count));
                    const percentage = (stat.count / maxCount) * 100;
                    
                    return (
                      <div key={stat.hebergement} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700 truncate max-w-[120px]">
                            {stat.hebergement}
                          </span>
                          <span className="text-gray-500">{stat.count}</span>
                        </div>
                        <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                          {techniqueCount > 0 && (
                            <div 
                              className="bg-orange-500 flex items-center justify-center text-white text-xs font-bold"
                              style={{ width: `${(techniqueCount / stat.count) * percentage}%` }}
                              title={`Technique: ${techniqueCount}`}
                            >
                              {techniqueCount > 0 && techniqueCount}
                            </div>
                          )}
                          {menageCount > 0 && (
                            <div 
                              className="bg-yellow-500 flex items-center justify-center text-white text-xs font-bold"
                              style={{ width: `${(menageCount / stat.count) * percentage}%` }}
                              title={`Ménage: ${menageCount}`}
                            >
                              {menageCount > 0 && menageCount}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">Aucune donnée</p>
              )}
            </div>

            {/* Graphique camembert */}
            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <h3 className="font-bold text-sm text-gray-700 mb-4">
                🥧 {lang === 'fr' ? 'Répartition par service' : 'Distribution by service'}
              </h3>
              {totalInterventions > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {techniqueCount > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="20"
                            strokeDasharray={`${(techniqueCount / totalInterventions) * 251.2} 251.2`}
                          />
                        )}
                        {menageCount > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#eab308"
                            strokeWidth="20"
                            strokeDasharray={`${(menageCount / totalInterventions) * 251.2} 251.2`}
                            strokeDashoffset={`-${(techniqueCount / totalInterventions) * 251.2}`}
                          />
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{totalInterventions}</div>
                          <div className="text-xs text-gray-500">total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-sm text-gray-700">Technique</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {techniqueCount} ({Math.round((techniqueCount / totalInterventions) * 100)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm text-gray-700">Ménage</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {menageCount} ({Math.round((menageCount / totalInterventions) * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">Aucune donnée</p>
              )}
            </div>
          </div>

          {/* Tableau principal - Interventions par hébergement */}
          <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
            <div className="bg-purple-50 px-4 py-3 border-b-2 border-purple-200">
              <h3 className="font-bold text-sm text-purple-900">
                📋 {lang === 'fr' ? 'Tableau des interventions par hébergement' : 'Interventions by accommodation table'}
              </h3>
            </div>
            {statsArray.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {lang === 'fr' ? 'Type' : 'Type'}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {lang === 'fr' ? 'Catégorie' : 'Category'}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">N°</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">
                        {lang === 'fr' ? 'Total' : 'Total'}
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">
                        {lang === 'fr' ? 'Technique' : 'Technical'}
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">
                        {lang === 'fr' ? 'Ménage' : 'Housekeeping'}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        {lang === 'fr' ? 'Dernière interv.' : 'Last interv.'}
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsArray.map((stat, index) => {
                      const techniqueCount = stat.interventions.filter(i => i.service === 'TECHNIQUE').length;
                      const menageCount = stat.interventions.filter(i => i.service === 'MENAGE').length;
                      const lastInterv = stat.interventions.sort((a, b) => 
                        new Date(b.created_date || 0) - new Date(a.created_date || 0)
                      )[0];
                      
                      return (
                        <React.Fragment key={stat.hebergement}>
                          <tr 
                            className={`border-b hover:bg-purple-50 cursor-pointer ${
                              selectedHebergement?.hebergement === stat.hebergement ? 'bg-purple-100' : ''
                            }`}
                            onClick={() => setSelectedHebergement(
                              selectedHebergement?.hebergement === stat.hebergement ? null : stat
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                index === 1 ? 'bg-gray-300 text-gray-700' :
                                index === 2 ? 'bg-orange-300 text-orange-900' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {stat.hebergement.startsWith('E') || stat.hebergement.startsWith('e') ? 'Emplacement' : 'Mobil-home'}
                            </td>
                            <td className="px-4 py-3 text-gray-900 font-medium">{stat.type_hebergement}</td>
                            <td className="px-4 py-3 text-gray-900 font-bold">{stat.hebergement}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-900 rounded-full font-bold">
                                {stat.count}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-orange-700 font-semibold">{techniqueCount}</td>
                            <td className="px-4 py-3 text-center text-yellow-700 font-semibold">{menageCount}</td>
                            <td className="px-4 py-3 text-gray-600">
                              {lastInterv?.created_date ? format(new Date(lastInterv.created_date), 'dd/MM/yyyy') : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button className="text-purple-600 hover:text-purple-800 text-xs">
                                {selectedHebergement?.hebergement === stat.hebergement ? '▼' : '▶'}
                              </button>
                            </td>
                          </tr>
                          {selectedHebergement?.hebergement === stat.hebergement && (
                            <tr>
                              <td colSpan="9" className="px-4 py-4 bg-purple-50">
                                <div className="space-y-2">
                                  <div className="text-xs font-bold text-purple-900 mb-2">
                                    {lang === 'fr' ? 'Historique des interventions:' : 'Intervention history:'}
                                  </div>
                                  {stat.interventions.slice(0, 10).map(interv => (
                                    <div key={interv.id} className="text-xs bg-white p-3 rounded border">
                                      <div className="flex items-center justify-between mb-1">
                                        <Badge className={statusColor[interv.statut] + ' text-white text-xs'}>
                                          {interv.statut}
                                        </Badge>
                                        <span className="text-gray-500">
                                          {interv.created_date ? format(new Date(interv.created_date), 'dd/MM/yyyy HH:mm') : 'N/A'}
                                        </span>
                                      </div>
                                      <div className="font-semibold text-gray-800">{interv.titre || 'Sans titre'}</div>
                                      <div className="text-gray-600">{interv.description || 'Pas de description'}</div>
                                      {interv.collaborateur && (
                                        <div className="text-gray-500 mt-1">👤 {interv.collaborateur}</div>
                                      )}
                                    </div>
                                  ))}
                                  {stat.interventions.length > 10 && (
                                    <div className="text-xs text-center text-gray-500 italic">
                                      ... et {stat.interventions.length - 10} autres
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                {lang === 'fr' ? 'Aucun hébergement avec interventions sur cette période' : 'No accommodations with interventions for this period'}
              </div>
            )}
          </div>

          {/* Tableau secondaire - Par service */}
          <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden mt-4">
            <div className="bg-blue-50 px-4 py-3 border-b-2 border-blue-200">
              <h3 className="font-bold text-sm text-blue-900">
                📊 {lang === 'fr' ? 'Récapitulatif par service' : 'Summary by service'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Service</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      {lang === 'fr' ? 'En cours' : 'In progress'}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      {lang === 'fr' ? 'Terminées' : 'Completed'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-orange-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">🔧 Technique</td>
                    <td className="px-4 py-3 text-center font-bold text-orange-700">{techniqueCount}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {workItemsPeriode.filter(w => w.service === 'TECHNIQUE' && w.statut === 'EN_COURS').length}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {workItemsPeriode.filter(w => w.service === 'TECHNIQUE' && w.statut === 'TERMINEE').length}
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-yellow-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">🧹 Ménage</td>
                    <td className="px-4 py-3 text-center font-bold text-yellow-700">{menageCount}</td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {workItemsPeriode.filter(w => w.service === 'MENAGE' && w.statut === 'EN_COURS').length}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {workItemsPeriode.filter(w => w.service === 'MENAGE' && w.statut === 'TERMINEE').length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des interventions actives */}
      <div className="space-y-3">
        <h3 className="font-heading text-xl text-[#0077A8]">
          {lang === 'fr' ? '📋 Demandes actives' : '📋 Active requests'}
        </h3>
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
    </div>
  );
}