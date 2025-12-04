import React from 'react';
import { useTranslation } from '../translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, AlertTriangle, TrendingUp, Loader2, Users, Home, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { problemTypes } from '../mobilhomeData';

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function BureauStatistiques() {
  const { t } = useTranslation();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['bureau-stats-incidents'],
    queryFn: () => base44.entities.Incident.filter({}, '-created_date', 1000)
  });

  const { data: satisfactions = [] } = useQuery({
    queryKey: ['bureau-stats-satisfaction'],
    queryFn: () => base44.entities.Satisfaction.filter({}, '-created_date', 500)
  });

  const resolus = incidents.filter(i => i.statut === 'resolu');
  
  // Temps moyen de résolution
  const avgDuration = resolus.filter(i => i.duree_resolution_heures).length > 0
    ? (resolus.filter(i => i.duree_resolution_heures).reduce((sum, i) => sum + i.duree_resolution_heures, 0) / resolus.filter(i => i.duree_resolution_heures).length).toFixed(1)
    : 0;

  // Satisfaction moyenne
  const avgRating = satisfactions.length > 0
    ? (satisfactions.reduce((sum, a) => sum + a.note, 0) / satisfactions.length).toFixed(1)
    : 0;

  // Urgences
  const urgentCount = incidents.filter(i => i.urgence).length;
  const urgentPercent = incidents.length > 0 ? Math.round((urgentCount / incidents.length) * 100) : 0;

  // Rapidité de résolution
  const tempsCategories = {
    'Quelques heures': resolus.filter(i => i.duree_resolution_heures && i.duree_resolution_heures < 4).length,
    'Moins de 24h': resolus.filter(i => i.duree_resolution_heures && i.duree_resolution_heures >= 4 && i.duree_resolution_heures < 24).length,
    'Plus d\'une journée': resolus.filter(i => i.duree_resolution_heures && i.duree_resolution_heures >= 24 && i.duree_resolution_heures < 72).length,
    'Plus de 3 jours': resolus.filter(i => i.duree_resolution_heures && i.duree_resolution_heures >= 72).length
  };

  const tempsData = Object.entries(tempsCategories).map(([name, value]) => ({ name, value }));

  // Par type de problème
  const parType = problemTypes.map(type => ({
    name: type.label,
    value: incidents.filter(i => i.type_probleme === type.id).length
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  // Par technicien
  const parTechnicien = resolus.reduce((acc, i) => {
    if (i.technicien) {
      if (!acc[i.technicien]) {
        acc[i.technicien] = { count: 0, totalHours: 0 };
      }
      acc[i.technicien].count++;
      acc[i.technicien].totalHours += i.duree_resolution_heures || 0;
    }
    return acc;
  }, {});

  const technicienData = Object.entries(parTechnicien)
    .map(([name, data]) => ({
      name,
      count: data.count,
      avgHours: data.count > 0 ? (data.totalHours / data.count).toFixed(1) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Logements à problèmes récurrents
  const parLogement = incidents.reduce((acc, i) => {
    acc[i.mobilhome_id] = (acc[i.mobilhome_id] || 0) + 1;
    return acc;
  }, {});

  const topLogements = Object.entries(parLogement)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Matériel utilisé
  const materielUtilise = resolus.reduce((acc, i) => {
    if (i.materiel_utilise) {
      i.materiel_utilise.forEach(m => {
        acc[m] = (acc[m] || 0) + 1;
      });
    }
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-sky-50 to-sky-100 border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-sky-600">Temps moyen</p>
                <p className="text-2xl font-bold text-sky-700">{avgDuration}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-amber-600">Satisfaction</p>
                <p className="text-2xl font-bold text-amber-700">{avgRating}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-red-600">Urgences</p>
                <p className="text-2xl font-bold text-red-700">{urgentPercent}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-600">Total interventions</p>
                <p className="text-2xl font-bold text-emerald-700">{incidents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Types de problèmes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={parType.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rapidité d'intervention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tempsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                  >
                    {tempsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#0ea5e9', '#f59e0b', '#ef4444'][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                { label: 'Quelques heures', color: 'bg-emerald-500' },
                { label: '<24h', color: 'bg-sky-500' },
                { label: '>1 jour', color: 'bg-amber-500' },
                { label: '>3 jours', color: 'bg-red-500' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1 text-xs">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Charge par technicien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {technicienData.slice(0, 6).map((tech, idx) => (
                <div key={tech.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600', 'bg-amber-100 text-amber-600'][idx % 4]
                    }`}>
                      {tech.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{tech.name}</p>
                      <p className="text-xs text-slate-500">Moy: {tech.avgHours}h</p>
                    </div>
                  </div>
                  <Badge variant="outline">{tech.count} interventions</Badge>
                </div>
              ))}
              {technicienData.length === 0 && (
                <p className="text-center text-slate-500 py-4">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="w-4 h-4" />
              Logements à problèmes récurrents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topLogements.map(([num, count], idx) => (
                <div key={num} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-medium">#{num}</span>
                  </div>
                  <span className="text-sm text-slate-500">{count} incidents</span>
                </div>
              ))}
              {topLogements.length === 0 && (
                <p className="text-center text-slate-500 py-4">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matériel utilisé */}
      {Object.keys(materielUtilise).length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Matériel remplacé (saison)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(materielUtilise).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([nom, count]) => (
                <div key={nom} className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-700">{count}</p>
                  <p className="text-xs text-slate-500">{nom}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}