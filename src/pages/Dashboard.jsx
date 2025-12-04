import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Lock, Eye, EyeOff, Filter, Clock, Star, AlertTriangle, 
  TrendingUp, Users, Home, Loader2, BarChart3, Package, Droplet
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { problemTypes } from '../components/mobilhomeData';

const PASSWORD = '2024TECH';
const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [filters, setFilters] = useState({
    mobilhome: '',
    type: 'all',
    statut: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('tech_authenticated');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['dashboard-incidents'],
    queryFn: () => base44.entities.Incident.filter({}, '-date_signalement', 1000),
    enabled: isAuthenticated
  });

  const { data: satisfactions = [] } = useQuery({
    queryKey: ['dashboard-satisfactions'],
    queryFn: () => base44.entities.Satisfaction.filter({}, '-created_date', 500),
    enabled: isAuthenticated
  });

  const handleLogin = () => {
    if (password === PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('tech_authenticated', 'true');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-xl border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="text-center pb-2 bg-[#00AEEF]">
            <Logo className="h-16 mb-4" />
            <CardTitle className="text-xl font-heading text-white">Dashboard Administration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00AEEF]" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Mot de passe"
                className="pl-10 pr-10 h-12 border-[#00AEEF]/30 rounded-xl font-body"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff className="w-4 h-4 text-[#00AEEF]" /> : <Eye className="w-4 h-4 text-[#00AEEF]" />}
              </button>
            </div>
            <Button onClick={handleLogin} className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading">
              Accéder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stats
  const resolus = incidents.filter(i => i.statut === 'resolu');
  const enCours = incidents.filter(i => i.statut !== 'resolu');
  const avgSatisfaction = satisfactions.length > 0 
    ? (satisfactions.reduce((s, a) => s + a.note, 0) / satisfactions.length).toFixed(1) 
    : 0;

  // Temps de résolution
  const tempsCategories = {
    'quelques_heures': resolus.filter(i => i.duree_resolution_heures && i.duree_resolution_heures < 4).length,
    'moins_24h': resolus.filter(i => i.duree_resolution_heures && i.duree_resolution_heures >= 4 && i.duree_resolution_heures < 24).length,
    'plus_1_jour': resolus.filter(i => i.duree_resolution_heures && i.duree_resolution_heures >= 24 && i.duree_resolution_heures < 72).length,
    'plus_3_jours': resolus.filter(i => i.duree_resolution_heures && i.duree_resolution_heures >= 72).length
  };

  // Par type
  const parType = problemTypes.map(t => ({
    name: t.label,
    value: incidents.filter(i => i.type_probleme === t.id).length
  })).filter(d => d.value > 0);

  // Par technicien
  const parTechnicien = resolus.reduce((acc, i) => {
    if (i.technicien) {
      acc[i.technicien] = (acc[i.technicien] || 0) + 1;
    }
    return acc;
  }, {});

  // Par logement (top 10)
  const parLogement = incidents.reduce((acc, i) => {
    acc[i.mobilhome_id] = (acc[i.mobilhome_id] || 0) + 1;
    return acc;
  }, {});
  const topLogements = Object.entries(parLogement).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Filter incidents
  const filteredIncidents = incidents.filter(i => {
    if (filters.mobilhome && !i.mobilhome_id.toLowerCase().includes(filters.mobilhome.toLowerCase())) return false;
    if (filters.type !== 'all' && i.type_probleme !== filters.type) return false;
    if (filters.statut !== 'all' && i.statut !== filters.statut) return false;
    if (filters.dateFrom && new Date(i.date_signalement) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(i.date_signalement) > new Date(filters.dateTo)) return false;
    return true;
  });

  const getProblemLabel = (id) => problemTypes.find(t => t.id === id)?.label || id;
  const getProblemEmoji = (id) => problemTypes.find(t => t.id === id)?.emoji || '❓';

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-[#00AEEF] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo className="h-10" />
          <h1 className="text-lg font-heading text-white">Dashboard Administration</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#e6f7ff] p-1 rounded-xl border border-[#00AEEF]/30">
            <TabsTrigger value="overview" className="rounded-lg font-heading data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="incidents" className="rounded-lg font-heading data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white">Incidents</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg font-heading data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white">Statistiques</TabsTrigger>
            <TabsTrigger value="satisfaction" className="rounded-lg font-heading data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white">Satisfaction</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-2 border-[#00AEEF] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00AEEF] rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-body text-[#0077A8]">En cours</p>
                      <p className="text-2xl font-heading text-[#0077A8]">{enCours.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-[#00AEEF] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00AEEF] rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-body text-[#0077A8]">Résolus</p>
                      <p className="text-2xl font-heading text-[#0077A8]">{resolus.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-[#FFD700] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFD700] rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-[#0077A8]" />
                    </div>
                    <div>
                      <p className="text-xs font-body text-[#0077A8]">Satisfaction</p>
                      <p className="text-2xl font-heading text-[#0077A8]">{avgSatisfaction}/5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-[#FFA500] rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFA500] rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-body text-[#0077A8]">{"<24h"}</p>
                      <p className="text-2xl font-heading text-[#0077A8]">
                        {resolus.length > 0 ? Math.round((tempsCategories.quelques_heures + tempsCategories.moins_24h) / resolus.length * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="shadow-sm border-2 border-[#00AEEF]/30 rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading text-[#0077A8]">Interventions par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={parType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {parType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-2 border-[#00AEEF]/30 rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-heading text-[#0077A8]">Rapidité de résolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: 'Quelques heures', value: tempsCategories.quelques_heures, color: 'bg-emerald-500' },
                      { label: 'Moins de 24h', value: tempsCategories.moins_24h, color: 'bg-blue-500' },
                      { label: 'Plus d\'une journée', value: tempsCategories.plus_1_jour, color: 'bg-amber-500' },
                      { label: 'Plus de 3 jours', value: tempsCategories.plus_3_jours, color: 'bg-red-500' }
                    ].map(cat => (
                      <div key={cat.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                          <span className="text-sm">{cat.label}</span>
                        </div>
                        <span className="font-semibold">{cat.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Input placeholder="N° Logement" value={filters.mobilhome} onChange={(e) => setFilters({ ...filters, mobilhome: e.target.value })} />
                  <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                    <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous types</SelectItem>
                      {problemTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.emoji} {t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filters.statut} onValueChange={(v) => setFilters({ ...filters, statut: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      <SelectItem value="nouveau">Nouveau</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="resolu">Résolu</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
                  <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-slate-500">
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Logement</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Client</th>
                          <th className="pb-3">Statut</th>
                          <th className="pb-3">Durée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIncidents.slice(0, 50).map(incident => (
                          <tr key={incident.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedIncident(incident)}>
                            <td className="py-3 text-sm">{format(new Date(incident.date_signalement), 'dd/MM HH:mm')}</td>
                            <td className="py-3 font-medium">
                              <div className="flex items-center gap-2">
                                #{incident.mobilhome_id}
                                {incident.urgence && <AlertTriangle className="w-4 h-4 text-red-500" />}
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="flex items-center gap-1">
                                {getProblemEmoji(incident.type_probleme)} {getProblemLabel(incident.type_probleme)}
                              </span>
                            </td>
                            <td className="py-3 text-sm">{incident.client_prenom} {incident.client_nom}</td>
                            <td className="py-3">
                              <Badge className={incident.statut === 'resolu' ? 'bg-emerald-100 text-emerald-700' : incident.statut === 'en_cours' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                                {incident.statut}
                              </Badge>
                            </td>
                            <td className="py-3 text-sm text-slate-500">
                              {incident.duree_resolution_heures ? `${incident.duree_resolution_heures}h` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Charge par technicien</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(parTechnicien).sort((a, b) => b[1] - a[1]).map(([tech, count], idx) => (
                      <div key={tech} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600'][idx % 3]}`}>
                            {tech[0].toUpperCase()}
                          </div>
                          <span className="font-medium">{tech}</span>
                        </div>
                        <Badge variant="outline">{count} interventions</Badge>
                      </div>
                    ))}
                    {Object.keys(parTechnicien).length === 0 && (
                      <p className="text-center text-slate-500 py-4">Aucune donnée</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Logements les plus concernés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topLogements.map(([num, count], idx) => (
                      <div key={num} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}>
                            {idx + 1}
                          </span>
                          <span className="font-medium">#{num}</span>
                        </div>
                        <span className="text-sm text-slate-500">{count} incidents</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Satisfaction Tab */}
          <TabsContent value="satisfaction" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Avis clients récents</CardTitle>
              </CardHeader>
              <CardContent>
                {satisfactions.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Aucun avis pour le moment</p>
                ) : (
                  <div className="space-y-4">
                    {satisfactions.slice(0, 20).map(avis => (
                      <div key={avis.id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{avis.client_prenom} {avis.client_nom}</span>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-4 h-4 ${s <= avis.note ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                            ))}
                          </div>
                        </div>
                        {avis.commentaire && <p className="text-sm text-slate-600">{avis.commentaire}</p>}
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                          <span>Logement #{avis.mobilhome_id}</span>
                          {avis.technicien && <span>Technicien: {avis.technicien}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incident #{selectedIncident?.mobilhome_id}</DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="font-medium">{getProblemEmoji(selectedIncident.type_probleme)} {getProblemLabel(selectedIncident.type_probleme)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Client</p>
                  <p className="font-medium">{selectedIncident.client_prenom} {selectedIncident.client_nom}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Signalé le</p>
                  <p className="font-medium">{format(new Date(selectedIncident.date_signalement), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                {selectedIncident.date_resolution && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-500">Résolu le</p>
                    <p className="font-medium">{format(new Date(selectedIncident.date_resolution), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedIncident.description}</p>
              </div>
              {selectedIncident.photo_client_url && (
                <div>
                  <p className="text-sm font-medium mb-1">Photo client</p>
                  <img src={selectedIncident.photo_client_url} alt="Client" className="w-full h-48 object-cover rounded-lg" />
                </div>
              )}
              {selectedIncident.commentaire_technicien && (
                <div>
                  <p className="text-sm font-medium mb-1">Commentaire technicien</p>
                  <p className="text-slate-600 bg-emerald-50 p-3 rounded-lg">{selectedIncident.commentaire_technicien}</p>
                </div>
              )}
              {selectedIncident.photo_intervention_url && (
                <div>
                  <p className="text-sm font-medium mb-1">Photo après intervention</p>
                  <img src={selectedIncident.photo_intervention_url} alt="Intervention" className="w-full h-48 object-cover rounded-lg" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}