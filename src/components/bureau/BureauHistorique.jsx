import React, { useState } from 'react';
import { useTranslation } from '../translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, Filter, AlertTriangle, Calendar, Clock, User, Home,
  Star, MessageSquare, Camera, Loader2, Trash2, X
} from 'lucide-react';
import Pagination from '../Pagination';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BureauHistorique() {
  const { t, lang } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    hebergement: '',
    type: 'all',
    urgentOnly: false,
    searchName: ''
  });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const { data: incidents = [], isLoading: loadingIncidents } = useQuery({
    queryKey: ['all-incidents'],
    queryFn: async () => {
      try {
        console.log('🔍 FETCH Incidents pour historique');
        const result = await base44.entities.Incident.filter({}, '-created_date', 1000);
        console.log('✅ Incidents récupérés:', result.length);
        return result;
      } catch (error) {
        console.warn('Erreur chargement incidents:', error);
        return [];
      }
    },
    staleTime: 60000
  });

  const { data: workItems = [], isLoading: loadingWorkItems } = useQuery({
    queryKey: ['all-workitems-bureau'],
    queryFn: async () => {
      try {
        console.log('🔍 FETCH WorkItems pour historique');
        const result = await base44.entities.WorkItem.filter({}, '-created_date', 1000);
        // GARDE ANTI-ORPHELINS : exclure WorkItems annulés
        const filtered = result.filter(wi => wi.statut !== 'ANNULEE');
        console.log('✅ WorkItems actifs pour historique:', filtered.length, '/', result.length);
        return filtered;
      } catch (error) {
        console.warn('Erreur chargement workitems:', error);
        return [];
      }
    },
    staleTime: 60000
  });

  const { data: avis = [] } = useQuery({
    queryKey: ['all-avis'],
    queryFn: async () => {
      try {
        return await base44.entities.Avis.filter({}, '-created_date', 500);
      } catch (error) {
        console.warn('Erreur chargement avis:', error);
        return [];
      }
    }
  });

  const isLoading = loadingIncidents || loadingWorkItems;
  const queryClient = useQueryClient();

  const deleteGroupMutation = useMutation({
    mutationFn: async (ids) => {
      console.log('[HISTORIQUE] Suppression groupe:', ids);
      for (const id of ids) {
        const item = allInterventions.find(i => i.id === id);
        if (item?.isWorkItem) {
          await base44.entities.WorkItem.delete(id);
        } else {
          await base44.entities.Incident.delete(id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['all-workitems-bureau'] });
      setSelectedItems([]);
      toast.success(lang === 'fr' ? 'Éléments supprimés' : 'Items deleted');
    },
    onError: (err) => {
      console.error('[HISTORIQUE] Erreur suppression:', err);
      toast.error(lang === 'fr' ? 'Erreur de suppression' : 'Deletion error');
    }
  });

  const handleDeleteGroup = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Supprimer ${selectedItems.length} élément(s) ?`)) return;
    setDeletingGroup(true);
    await deleteGroupMutation.mutateAsync(selectedItems);
    setDeletingGroup(false);
  };

  const toggleSelection = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === paginatedIncidents.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedIncidents.map(i => i.id));
    }
  };

  // Convertir WorkItems en format compatible Incident pour affichage
  const convertedWorkItems = workItems.map(wi => ({
    id: wi.id,
    created_date: wi.created_date,
    hebergement_numero: wi.hebergement,
    client_nom: wi.client_nom,
    client_prenom: wi.client_prenom,
    date_arrivee: wi.date_arrivee,
    date_depart: wi.date_depart,
    categorie_probleme: wi.type === 'INTERVENTION_CLIENT' ? 'inventaire_arrivee' : 
                        wi.type === 'MISSION_DIRECTION' ? 'mission_direction' : 'autre',
    sous_categorie: wi.service?.toLowerCase() || 'divers',
    statut: wi.statut === 'A_FAIRE' ? 'nouveau' :
            wi.statut === 'EN_COURS' ? 'en_cours' :
            wi.statut === 'EN_ATTENTE' ? 'en_attente' :
            wi.statut === 'TERMINEE' ? 'termine' : 'nouveau',
    probleme_urgent: wi.priorite === 'URGENTE',
    duree_minutes: wi.duree_minutes,
    pris_par: wi.collaborateur,
    isWorkItem: true,
    workItemData: wi
  }));

  // Fusionner Incidents + WorkItems convertis
  const allInterventions = [...incidents, ...convertedWorkItems];
  console.log('📊 Historique total:', {
    incidents: incidents.length,
    workItems: workItems.length,
    total: allInterventions.length
  });

  const getAvisForIncident = (incidentId) => {
    return avis.find(a => a.incident_id === incidentId);
  };

  const filteredIncidents = allInterventions.filter(incident => {
    if (filters.dateFrom && new Date(incident.created_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(incident.created_date) > new Date(filters.dateTo)) return false;
    if (filters.hebergement && !incident.hebergement_numero.includes(filters.hebergement)) return false;
    if (filters.type !== 'all' && incident.categorie_probleme !== filters.type) return false;
    if (filters.urgentOnly && !incident.probleme_urgent) return false;
    if (filters.searchName) {
      const name = `${incident.client_prenom} ${incident.client_nom}`.toLowerCase();
      if (!name.includes(filters.searchName.toLowerCase())) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedIncidents = filteredIncidents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Réinitialiser la page si les filtres changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const getStatusColor = (status) => {
    const colors = {
      nouveau: 'bg-blue-100 text-blue-700',
      en_route: 'bg-amber-100 text-amber-700',
      en_cours: 'bg-purple-100 text-purple-700',
      termine: 'bg-emerald-100 text-emerald-700'
    };
    return colors[status] || colors.nouveau;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-xs text-slate-500">Date début</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Date fin</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">N° Logement</label>
              <Input
                placeholder="123"
                value={filters.hebergement}
                onChange={(e) => setFilters({ ...filters, hebergement: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Type</label>
              <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="technique">{t('technique')}</SelectItem>
                  <SelectItem value="nuisibles">{t('nuisibles')}</SelectItem>
                  <SelectItem value="menage">{t('menage')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Nom client</label>
              <Input
                placeholder="Rechercher..."
                value={filters.searchName}
                onChange={(e) => setFilters({ ...filters, searchName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-lg">
                <Checkbox
                  checked={filters.urgentOnly}
                  onCheckedChange={(c) => setFilters({ ...filters, urgentOnly: c })}
                />
                <span className="text-sm">{t('urgence')}</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('historique')}</CardTitle>
            <div className="flex items-center gap-3">
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">{selectedItems.length} événement(s) sélectionné(s)</span>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleDeleteGroup}
                    disabled={deletingGroup}
                  >
                    {deletingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Supprimer groupe
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedItems([])}
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </Button>
                </div>
              )}
              <span className="text-sm text-slate-500">{filteredIncidents.length} résultats</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-slate-500">
                    <th className="pb-3 font-medium w-12">
                      <Checkbox 
                        checked={selectedItems.length === paginatedIncidents.length && paginatedIncidents.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="pb-3 font-medium">N°</th>
                    <th className="pb-3 font-medium">Date / Heure</th>
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Hébergement</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Urgence</th>
                    <th className="pb-3 font-medium">Événement</th>
                    <th className="pb-3 font-medium">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIncidents.map((incident, index) => {
                    const avisClient = getAvisForIncident(incident.id);
                    const isSelected = selectedItems.includes(incident.id);
                    return (
                      <tr 
                        key={incident.id} 
                        className={`border-b hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="py-3">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleSelection(incident.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="py-3 text-sm font-medium">{startIndex + index + 1}</td>
                        <td className="py-3 text-sm">
                          <div>{format(new Date(incident.created_date), 'dd/MM/yy', { locale: fr })}</div>
                          <div className="text-xs text-slate-500">{format(new Date(incident.created_date), 'HH:mm', { locale: fr })}</div>
                        </td>
                        <td className="py-3 text-sm">
                          {incident.client_nom} {incident.client_prenom}
                        </td>
                        <td className="py-3 font-medium">{incident.hebergement_numero}</td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs">
                            {incident.isWorkItem ? (
                              <>
                                <span className="mr-1">🆕</span>
                                {incident.workItemData?.service || 'Divers'}
                              </>
                            ) : (
                              t(incident.sous_categorie)
                            )}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {incident.probleme_urgent && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </td>
                        <td className="py-3 text-sm">
                          <div className="font-medium">
                            {incident.isWorkItem ? (
                              `${incident.workItemData?.service || 'Divers'} - ${incident.hebergement_numero}`
                            ) : (
                              `${t(incident.sous_categorie)} - ${incident.hebergement_numero}`
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setSelectedIncident(incident)}
                          >
                            {incident.isWorkItem && incident.workItemData?.type === 'INTERVENTION_CLIENT' 
                              ? `INVENTAIRE_ARRIVEE - ${incident.workItemData?.taches?.length || 0} tâche(s)`
                              : incident.description_probleme?.substring(0, 30) || '-'
                            }
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {!isLoading && filteredIncidents.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredIncidents.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Intervention #{selectedIncident?.hebergement_numero}
            </DialogTitle>
          </DialogHeader>
          
          {selectedIncident && (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> Client
                  </div>
                  <p className="font-medium">{selectedIncident.client_prenom} {selectedIncident.client_nom}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Séjour
                  </div>
                  <p className="font-medium text-sm">
                    {selectedIncident.date_arrivee && format(new Date(selectedIncident.date_arrivee), 'dd/MM')} - {selectedIncident.date_depart && format(new Date(selectedIncident.date_depart), 'dd/MM/yy')}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Type</div>
                  <p className="font-medium">{t(selectedIncident.categorie_probleme)} - {t(selectedIncident.sous_categorie)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Durée
                  </div>
                  <p className="font-medium">{selectedIncident.duree_minutes || '-'} min</p>
                </div>
              </div>

              {/* Description */}
              {selectedIncident.isWorkItem && selectedIncident.workItemData ? (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedIncident.workItemData.description || '-'}</p>
                  {selectedIncident.workItemData.taches?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <h5 className="text-sm font-medium text-slate-500">Tâches :</h5>
                      {selectedIncident.workItemData.taches.map((t, idx) => (
                        <div key={idx} className="bg-slate-50 p-2 rounded text-sm">
                          <span className="font-medium">#{t.numero}</span> {t.texte}
                          {t.faite && <span className="ml-2 text-green-600">✓ Faite</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="font-medium mb-2">Description du problème</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedIncident.description_probleme}</p>
                </div>
              )}

              {/* Photos client */}
              {selectedIncident.photo_client_url && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Photo client
                  </h4>
                  <img 
                    src={selectedIncident.photo_client_url}
                    alt="Photo client"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Commentaire collaborateur */}
              {selectedIncident.commentaire_collaborateur && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Commentaire intervention
                  </h4>
                  <p className="text-slate-600 bg-emerald-50 p-3 rounded-lg">{selectedIncident.commentaire_collaborateur}</p>
                </div>
              )}

              {/* Photos intervention */}
              {selectedIncident.photos_intervention?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Photos intervention</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedIncident.photos_intervention.map((url, idx) => (
                      <img 
                        key={idx}
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Avis client */}
              {(() => {
                const avisClient = getAvisForIncident(selectedIncident.id);
                if (avisClient) {
                  return (
                    <div className="bg-amber-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" /> Avis client
                      </h4>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`w-5 h-5 ${star <= avisClient.note ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                      {avisClient.commentaire && (
                        <p className="text-slate-600 text-sm">{avisClient.commentaire}</p>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}