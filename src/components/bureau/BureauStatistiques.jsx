import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Star, Home, Users, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { differenceInHours, isThisWeek, isThisMonth, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const COLORS = ['#00AEEF', '#FFD700', '#FFA500', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#6366f1'];

export default function BureauStatistiques({ incidents }) {
  const [periodeFilter, setPeriodeFilter] = useState('tout');
  const [categorieFilter, setCategorieFilter] = useState('tous');

  // Filtrage par période
  const filterByPeriode = (inc) => {
    if (periodeFilter === 'tout') return true;
    if (!inc.date_saisie) return false;
    const date = parseISO(inc.date_saisie);
    const now = new Date();
    if (periodeFilter === 'semaine') {
      return isWithinInterval(date, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
    }
    if (periodeFilter === 'mois') {
      return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) });
    }
    if (periodeFilter === 'saison') {
      const startSaison = new Date(now.getFullYear(), 5, 1); // 1er juin
      const endSaison = new Date(now.getFullYear(), 8, 30); // 30 septembre
      return isWithinInterval(date, { start: startSaison, end: endSaison });
    }
    return true;
  };

  const filteredIncidents = incidents.filter(filterByPeriode);

  // Stats par mobil-home
  const mobilhomeStats = Object.entries(
    filteredIncidents
      .filter(i => i.logement)
      .reduce((acc, i) => {
        acc[i.logement] = (acc[i.logement] || 0) + 1;
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Stats par emplacement
  const emplacementStats = Object.entries(
    filteredIncidents
      .filter(i => i.emplacement)
      .reduce((acc, i) => {
        acc[i.emplacement] = (acc[i.emplacement] || 0) + 1;
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Stats avis (1 à 5 étoiles)
  const avisStats = [1, 2, 3, 4, 5].map(note => ({
    name: `${note} ⭐`,
    value: filteredIncidents.filter(i => i.note_client === note).length,
    note
  }));

  const totalAvis = avisStats.reduce((sum, a) => sum + a.value, 0);
  const scoreMoyen = totalAvis > 0
    ? (avisStats.reduce((sum, a) => sum + (a.note * a.value), 0) / totalAvis).toFixed(2)
    : 0;

  // KPIs
  const resolus = filteredIncidents.filter(i => i.statut === 'resolu' && i.date_resolution && i.date_saisie);
  const tempsResolution = resolus.map(i => differenceInHours(new Date(i.date_resolution), new Date(i.date_saisie)));
  const tempsMoyen = tempsResolution.length > 0 ? (tempsResolution.reduce((a, b) => a + b, 0) / tempsResolution.length).toFixed(1) : 0;
  const moins3h = tempsResolution.filter(t => t < 3).length;

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
          <SelectTrigger className="w-40 border-[#FFA500]/30 rounded-xl">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tout">📅 Toute période</SelectItem>
            <SelectItem value="semaine">📆 Cette semaine</SelectItem>
            <SelectItem value="mois">🗓 Ce mois</SelectItem>
            <SelectItem value="saison">☀️ Saison (juin-sept)</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                <p className="text-2xl font-heading text-[#0077A8]">{filteredIncidents.length}</p>
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
                <p className="text-2xl font-heading text-[#0077A8]">{scoreMoyen}/5</p>
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
        {/* Graphique 1: Interventions par mobil-home */}
        <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
              <Home className="w-4 h-4" />
              📊 Interventions par Mobil-home
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mobilhomeStats.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mobilhomeStats.slice(0, 15)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={60} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00AEEF" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Graphique 2: Interventions par emplacement */}
        <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              📊 Interventions par Emplacement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emplacementStats.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emplacementStats.slice(0, 15)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={60} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FFD700" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aucune donnée</p>
            )}
          </CardContent>
        </Card>

        {/* Graphique 3: Répartition des avis */}
        <Card className="border-2 border-[#00AEEF]/30 rounded-xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
              <Star className="w-4 h-4" />
              ⭐ Répartition des avis clients
              <Badge className="bg-[#FFD700] text-[#0077A8] ml-2">
                Moyenne: {scoreMoyen}/5
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Camembert */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={avisStats.filter(a => a.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {avisStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Barres horizontales */}
              <div className="space-y-3">
                {avisStats.map((avis, idx) => (
                  <div key={avis.note}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-body">{avis.name}</span>
                      <span className="font-heading text-[#0077A8]">
                        {avis.value} ({totalAvis > 0 ? Math.round(avis.value / totalAvis * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all" 
                        style={{ 
                          width: `${totalAvis > 0 ? (avis.value / totalAvis * 100) : 0}%`,
                          backgroundColor: COLORS[idx]
                        }} 
                      />
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-[#FFD700]/20 rounded-xl">
                  <p className="text-sm font-body text-[#0077A8]">
                    <strong>Total avis:</strong> {totalAvis} | <strong>Score global:</strong> {scoreMoyen}/5 ⭐
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}