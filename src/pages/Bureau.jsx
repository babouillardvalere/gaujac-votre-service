import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, Clock, Star, AlertTriangle, TrendingUp, Loader2, 
  Users, Home, Search, Building2, Filter
} from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { createPageUrl } from '../utils';

const COLORS = ['#00AEEF', '#FFD700', '#FFA500', '#10b981', '#8b5cf6', '#ec4899'];

const categoryLabels = {
  gaz: 'Gaz', eau: 'Eau/Fuite', electricite: 'Électricité', plomberie: 'Plomberie',
  espace_vert: 'Espace vert', divers_technique: 'Divers', souris: 'Souris', 
  guepes: 'Guêpes', frelons: 'Frelons', literie: 'Literie', vaisselle: 'Vaisselle',
  nettoyage: 'Nettoyage', materiel_menage: 'Matériel ménage'
};

export default function Bureau() {
  const navigate = useNavigate();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filters, setFilters] = useState({
    nom: '',
    logement: '',
    type: 'tous',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
  }, [navigate]);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['bureau-incidents'],
    queryFn: () => base44.entities.Incident.filter({}, '-date_saisie', 1000)
  });

  // Filtrage
  const filteredIncidents = incidents.filter(i => {
    if (filters.nom && !`${i.client_nom} ${i.client_prenom}`.toLowerCase().includes(filters.nom.toLowerCase())) return false;
    if (filters.logement && !(i.logement || i.emplacement || '').toLowerCase().includes(filters.logement.toLowerCase())) return false;
    if (filters.type !== 'tous' && i.type !== filters.type) return false;
    if (filters.dateFrom && new Date(i.date_saisie) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(i.date_saisie) > new Date(filters.dateTo)) return false;
    return true;
  });

  // Stats
  const resolus = incidents.filter(i => i.statut === 'resolu' && i.date_resolution && i.date_saisie);
  
  const tempsResolution = resolus.map(i => differenceInHours(new Date(i.date_resolution), new Date(i.date_saisie)));
  const tempsMoyen = tempsResolution.length > 0 ? (tempsResolution.reduce((a, b) => a + b, 0) / tempsResolution.length).toFixed(1) : 0;

  const moins3h = tempsResolution.filter(t => t < 3).length;
  const moins24h = tempsResolution.filter(t => t >= 3 && t < 24).length;
  const plus3j = tempsResolution.filter(t => t >= 72).length;

  const avgNote = incidents.filter(i => i.note_client).length > 0
    ? (incidents.filter(i => i.note_client).reduce((s, i) => s + i.note_client, 0) / incidents.filter(i => i.note_client).length).toFixed(1)
    : 0;

  // Par catégorie
  const parCategorie = Object.entries(
    incidents.reduce((acc, i) => {
      acc[i.categorie] = (acc[i.categorie] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: categoryLabels[name] || name, value }))
    .sort((a, b) => b.value - a.value);

  // Par logement
  const parLogement = Object.entries(
    incidents.reduce((acc, i) => {
      const loc = i.logement || i.emplacement || 'Inconnu';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Par collaborateur
  const parCollab = Object.entries(
    resolus.reduce((acc, i) => {
      if (i.pris_par) acc[i.pris_par] = (acc[i.pris_par] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-[#FFA500] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('MenuCollaborateur')} className="p-2 hover:bg-white/20 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-xl">Bureau - Gestion & Historique</h1>
              <p className="text-white/80 text-sm font-body">{incidents.length} intervention(s) au total</p>
            </div>
          </div>
          <Building2 className="w-8 h-8" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="historique" className="space-y-6">
          <TabsList className="bg-[#FFA500]/20 p-1 rounded-xl border border-[#FFA500]/30">
            <TabsTrigger value="historique" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              Historique
            </TabsTrigger>
            <TabsTrigger value="statistiques" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              Statistiques
            </TabsTrigger>
          </TabsList>

          {/* Historique */}
          <TabsContent value="historique" className="space-y-4">
            {/* Filtres */}
            <Card className="border-2 border-[#FFA500]/30 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Recherche & Filtres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Input
                    placeholder="Nom client"
                    value={filters.nom}
                    onChange={(e) => setFilters({ ...filters, nom: e.target.value })}
                    className="border-[#FFA500]/30 rounded-xl font-body"
                  />
                  <Input
                    placeholder="Logement"
                    value={filters.logement}
                    onChange={(e) => setFilters({ ...filters, logement: e.target.value })}
                    className="border-[#FFA500]/30 rounded-xl font-body"
                  />
                  <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                    <SelectTrigger className="border-[#FFA500]/30 rounded-xl font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous types</SelectItem>
                      <SelectItem value="technique">Technique</SelectItem>
                      <SelectItem value="menage">Ménage</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="border-[#FFA500]/30 rounded-xl font-body"
                  />
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="border-[#FFA500]/30 rounded-xl font-body"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tableau */}
            <Card className="border-2 border-[#FFA500]/30 rounded-xl overflow-hidden">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FFA500]" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#FFA500]/10">
                        <tr className="text-left text-sm font-heading text-[#0077A8]">
                          <th className="p-3">Date</th>
                          <th className="p-3">Client</th>
                          <th className="p-3">Logement</th>
                          <th className="p-3">Catégorie</th>
                          <th className="p-3">Urgent</th>
                          <th className="p-3">Statut</th>
                          <th className="p-3">Temps</th>
                          <th className="p-3">Avis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIncidents.slice(0, 100).map(incident => {
                          const temps = incident.date_resolution && incident.date_saisie
                            ? differenceInHours(new Date(incident.date_resolution), new Date(incident.date_saisie))
                            : null;
                          return (
                            <tr 
                              key={incident.id} 
                              className="border-t hover:bg-[#FFA500]/5 cursor-pointer font-body"
                              onClick={() => setSelectedIncident(incident)}
                            >
                              <td className="p-3 text-sm">
                                {incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM/yy HH:mm')}
                              </td>
                              <td className="p-3">{incident.client_prenom} {incident.client_nom}</td>
                              <td className="p-3 font-heading text-[#0077A8]">{incident.logement || incident.emplacement}</td>
                              <td className="p-3">
                                <Badge className={incident.type === 'technique' ? 'bg-[#00AEEF] text-white' : 'bg-[#FFD700] text-[#0077A8]'}>
                                  {categoryLabels[incident.categorie] || incident.categorie}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {incident.urgent && <AlertTriangle className="w-4 h-4 text-[#FFA500]" />}
                              </td>
                              <td className="p-3">
                                <Badge className={
                                  incident.statut === 'resolu' ? 'bg-green-500 text-white' :
                                  incident.statut === 'en_cours' ? 'bg-[#00AEEF] text-white' :
                                  'bg-[#FFA500] text-white'
                                }>
                                  {incident.statut}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">
                                {temps !== null ? `${temps}h` : '-'}
                              </td>
                              <td className="p-3">
                                {incident.note_client && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-[#FFD700] fill-[#FFD700]" />
                                    <span className="text-sm">{incident.note_client}</span>
                                  </div>
                                )}
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

          {/* Statistiques */}
          <TabsContent value="statistiques" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2 border-[#00AEEF] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00AEEF] rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-body text-[#0077A8]">Total interventions</p>
                      <p className="text-2xl font-heading text-[#0077A8]">{incidents.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#FFD700] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFD700] rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#0077A8]" />
                    </div>
                    <div>
                      <p className="text-xs font-body text-[#0077A8]">Temps moyen</p>
                      <p className="text-2xl font-heading text-[#0077A8]">{tempsMoyen}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#FFA500] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFA500] rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-body text-[#0077A8]">Note moyenne</p>
                      <p className="text-2xl font-heading text-[#0077A8]">{avgNote}/5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-500 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-body text-[#0077A8]">{"<3h"}</p>
                      <p className="text-2xl font-heading text-[#0077A8]">
                        {resolus.length > 0 ? Math.round(moins3h / resolus.length * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Par catégorie */}
              <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading text-[#0077A8]">Problèmes les plus fréquents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={parCategorie.slice(0, 8)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#00AEEF" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Rapidité */}
              <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading text-[#0077A8]">Rapidité d'intervention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Moins de 3h', value: moins3h, color: 'bg-green-500', pct: resolus.length > 0 ? Math.round(moins3h / resolus.length * 100) : 0 },
                      { label: 'Moins de 24h', value: moins24h, color: 'bg-[#00AEEF]', pct: resolus.length > 0 ? Math.round(moins24h / resolus.length * 100) : 0 },
                      { label: 'Plus de 3 jours', value: plus3j, color: 'bg-[#FFA500]', pct: resolus.length > 0 ? Math.round(plus3j / resolus.length * 100) : 0 }
                    ].map(cat => (
                      <div key={cat.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-body">{cat.label}</span>
                          <span className="font-heading text-[#0077A8]">{cat.value} ({cat.pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Par logement */}
              <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Logements les plus signalés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {parLogement.map(([num, count], idx) => (
                      <div key={num} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            idx < 3 ? 'bg-[#FFA500] text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="font-heading text-[#0077A8]">#{num}</span>
                        </div>
                        <span className="text-sm font-body">{count} incident(s)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Par collaborateur */}
              <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Interventions par collaborateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {parCollab.slice(0, 8).map(([name, count], idx) => (
                      <div key={name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            ['bg-[#00AEEF] text-white', 'bg-[#FFD700] text-[#0077A8]', 'bg-[#FFA500] text-white'][idx % 3]
                          }`}>
                            {name[0].toUpperCase()}
                          </div>
                          <span className="font-body">{name}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog détail */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8]">
              Détail intervention #{selectedIncident?.logement || selectedIncident?.emplacement}
            </DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Client</p>
                <p className="font-heading text-[#0077A8]">{selectedIncident.client_prenom} {selectedIncident.client_nom}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Catégorie</p>
                <p className="font-heading text-[#0077A8]">{categoryLabels[selectedIncident.categorie]}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Signalé le</p>
                <p className="font-body">{selectedIncident.date_saisie && format(new Date(selectedIncident.date_saisie), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Résolu le</p>
                <p className="font-body">{selectedIncident.date_resolution ? format(new Date(selectedIncident.date_resolution), 'dd/MM/yyyy HH:mm') : '-'}</p>
              </div>
              <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Description</p>
                <p className="font-body">{selectedIncident.description}</p>
              </div>
              {selectedIncident.pris_par && (
                <div className="col-span-2 bg-[#00AEEF]/10 p-3 rounded-lg">
                  <p className="text-xs text-[#0077A8]">Intervenant</p>
                  <p className="font-heading text-[#0077A8]">{selectedIncident.pris_par}</p>
                </div>
              )}
              {selectedIncident.note_client && (
                <div className="col-span-2 bg-[#FFD700]/20 p-3 rounded-lg">
                  <p className="text-xs text-[#0077A8]">Avis client</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= selectedIncident.note_client ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  {selectedIncident.commentaire_client && (
                    <p className="font-body text-sm mt-2">{selectedIncident.commentaire_client}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}