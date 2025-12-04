import React from 'react';
import { useTranslation } from '../translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Star, AlertTriangle, Wrench, Bug, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export default function BureauStatistiques() {
  const { t } = useTranslation();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['stats-incidents'],
    queryFn: () => base44.entities.Incident.filter({}, '-created_date', 1000)
  });

  const { data: avis = [] } = useQuery({
    queryKey: ['stats-avis'],
    queryFn: () => base44.entities.Avis.filter({}, '-created_date', 500)
  });

  // Stats calculations
  const completedIncidents = incidents.filter(i => i.statut === 'termine');
  
  const avgDuration = completedIncidents.length > 0
    ? Math.round(completedIncidents.reduce((sum, i) => sum + (i.duree_minutes || 0), 0) / completedIncidents.length)
    : 0;

  const avgRating = avis.length > 0
    ? (avis.reduce((sum, a) => sum + a.note, 0) / avis.length).toFixed(1)
    : 0;

  const urgentCount = incidents.filter(i => i.probleme_urgent).length;
  const urgentPercent = incidents.length > 0 ? Math.round((urgentCount / incidents.length) * 100) : 0;

  // Problem types distribution
  const problemTypes = incidents.reduce((acc, i) => {
    const key = i.sous_categorie || 'autre';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const typeData = Object.entries(problemTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name: t(name), value }));

  // Category distribution
  const categoryData = [
    { name: t('technique'), value: incidents.filter(i => i.categorie_probleme === 'technique').length },
    { name: t('nuisibles'), value: incidents.filter(i => i.categorie_probleme === 'nuisibles').length },
    { name: t('menage'), value: incidents.filter(i => i.categorie_probleme === 'menage').length }
  ].filter(d => d.value > 0);

  // Problematic accommodations
  const accommodationIssues = incidents.reduce((acc, i) => {
    const key = i.hebergement_numero;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topProblematic = Object.entries(accommodationIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Monthly trend
  const monthlyData = incidents.reduce((acc, i) => {
    const month = new Date(i.created_date).toLocaleString('fr', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const trendData = Object.entries(monthlyData)
    .slice(-6)
    .map(([name, value]) => ({ name, value }));

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
                <p className="text-xs text-sky-600">{t('temps_moyen')}</p>
                <p className="text-2xl font-bold text-sky-700">{avgDuration} min</p>
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
                <p className="text-xs text-amber-600">{t('satisfaction')}</p>
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
                <p className="text-xs text-emerald-600">{t('interventions_total')}</p>
                <p className="text-2xl font-bold text-emerald-700">{incidents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Problem Types */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Types de problèmes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical">
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

        {/* Category Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Problematic Accommodations */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Logements à problèmes récurrents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProblematic.map(([num, count], idx) => (
                <div key={num} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-red-100 text-red-700' : 
                      idx === 1 ? 'bg-amber-100 text-amber-700' : 
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-medium">Logement #{num}</span>
                  </div>
                  <span className="text-sm text-slate-500">{count} incidents</span>
                </div>
              ))}
              {topProblematic.length === 0 && (
                <p className="text-center text-slate-500 py-4">Aucune donnée disponible</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}