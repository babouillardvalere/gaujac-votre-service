import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Clock, Star, Home, MapPin, Calendar, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { differenceInHours, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format, getHours, getDay, getMonth, getYear, startOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subWeeks, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#00AEEF', '#FFD700', '#FFA500', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#6366f1'];
const HOUR_LABELS = ['0h', '1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h', '23h'];
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

export default function BureauStatistiques({ incidents }) {
  const [periodeFilter, setPeriodeFilter] = useState('tout');
  const [evolutionView, setEvolutionView] = useState('jour');
  const [compareMode, setCompareMode] = useState('none');

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
      const startSaison = new Date(now.getFullYear(), 5, 1);
      const endSaison = new Date(now.getFullYear(), 8, 30);
      return isWithinInterval(date, { start: startSaison, end: endSaison });
    }
    if (periodeFilter === 'annee') {
      return getYear(date) === getYear(now);
    }
    return true;
  };

  const filteredIncidents = incidents.filter(filterByPeriode);

  // Évolution par heure de la journée
  const evolutionParHeure = useMemo(() => {
    const data = Array(24).fill(0).map((_, i) => ({ name: HOUR_LABELS[i], interventions: 0, heure: i }));
    filteredIncidents.forEach(inc => {
      if (inc.date_saisie) {
        const hour = getHours(parseISO(inc.date_saisie));
        data[hour].interventions++;
      }
    });
    return data;
  }, [filteredIncidents]);

  // Évolution par jour de la semaine
  const evolutionParJour = useMemo(() => {
    const data = DAY_LABELS.map((name, i) => ({ name, interventions: 0, jour: i }));
    filteredIncidents.forEach(inc => {
      if (inc.date_saisie) {
        const day = getDay(parseISO(inc.date_saisie));
        data[day].interventions++;
      }
    });
    return data;
  }, [filteredIncidents]);

  // Évolution par mois
  const evolutionParMois = useMemo(() => {
    const data = MONTH_LABELS.map((name, i) => ({ name, interventions: 0, mois: i }));
    filteredIncidents.forEach(inc => {
      if (inc.date_saisie) {
        const month = getMonth(parseISO(inc.date_saisie));
        data[month].interventions++;
      }
    });
    return data;
  }, [filteredIncidents]);

  // Évolution chronologique (30 derniers jours)
  const evolutionChronologique = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({ start: subDays(now, 29), end: now });
    return days.map(day => {
      const count = filteredIncidents.filter(inc => {
        if (!inc.date_saisie) return false;
        const incDate = startOfDay(parseISO(inc.date_saisie));
        return incDate.getTime() === startOfDay(day).getTime();
      }).length;
      return { name: format(day, 'dd/MM'), interventions: count, date: day };
    });
  }, [filteredIncidents]);

  // Évolution par semaine (12 dernières semaines)
  const evolutionParSemaine = useMemo(() => {
    const now = new Date();
    const weeks = eachWeekOfInterval({ start: subWeeks(now, 11), end: now }, { weekStartsOn: 1 });
    return weeks.map(week => {
      const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
      const count = filteredIncidents.filter(inc => {
        if (!inc.date_saisie) return false;
        const incDate = parseISO(inc.date_saisie);
        return isWithinInterval(incDate, { start: week, end: weekEnd });
      }).length;
      return { name: `S${format(week, 'w')}`, interventions: count, semaine: week };
    });
  }, [filteredIncidents]);

  // Comparaison saisons
  const comparaisonSaisons = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const seasons = [
      { name: 'Hiver', start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 20) },
      { name: 'Printemps', start: new Date(currentYear, 2, 21), end: new Date(currentYear, 5, 20) },
      { name: 'Été', start: new Date(currentYear, 5, 21), end: new Date(currentYear, 8, 22) },
      { name: 'Automne', start: new Date(currentYear, 8, 23), end: new Date(currentYear, 11, 20) }
    ];
    return seasons.map(season => {
      const count = incidents.filter(inc => {
        if (!inc.date_saisie) return false;
        const date = parseISO(inc.date_saisie);
        return isWithinInterval(date, { start: season.start, end: season.end });
      }).length;
      return { ...season, interventions: count };
    });
  }, [incidents]);

  // Notes moyennes par période
  const notesMoyennesParMois = useMemo(() => {
    return MONTH_LABELS.map((name, i) => {
      const monthIncidents = incidents.filter(inc => inc.date_saisie && getMonth(parseISO(inc.date_saisie)) === i && inc.note_client);
      const avgNote = monthIncidents.length > 0 
        ? (monthIncidents.reduce((s, inc) => s + inc.note_client, 0) / monthIncidents.length).toFixed(1)
        : 0;
      return { name, note: parseFloat(avgNote), count: monthIncidents.length };
    });
  }, [incidents]);

  // Stats par mobil-home
  const mobilhomeStats = Object.entries(
    filteredIncidents.filter(i => i.logement).reduce((acc, i) => {
      acc[i.logement] = (acc[i.logement] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Stats par emplacement
  const emplacementStats = Object.entries(
    filteredIncidents.filter(i => i.emplacement).reduce((acc, i) => {
      acc[i.emplacement] = (acc[i.emplacement] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Stats avis
  const avisStats = [1, 2, 3, 4, 5].map(note => ({
    name: `${note} ⭐`,
    value: filteredIncidents.filter(i => i.note_client === note).length,
    note
  }));
  const totalAvis = avisStats.reduce((sum, a) => sum + a.value, 0);
  const scoreMoyen = totalAvis > 0 ? (avisStats.reduce((sum, a) => sum + (a.note * a.value), 0) / totalAvis).toFixed(2) : 0;

  // KPIs
  const resolus = filteredIncidents.filter(i => i.statut === 'resolu' && i.date_resolution && i.date_saisie);
  const tempsResolution = resolus.map(i => differenceInHours(new Date(i.date_resolution), new Date(i.date_saisie)));
  const tempsMoyen = tempsResolution.length > 0 ? (tempsResolution.reduce((a, b) => a + b, 0) / tempsResolution.length).toFixed(1) : 0;
  const moins3h = tempsResolution.filter(t => t < 3).length;

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={periodeFilter} onValueChange={setPeriodeFilter}>
          <SelectTrigger className="w-44 border-[#FFA500]/30 rounded-xl">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tout">📅 Toute période</SelectItem>
            <SelectItem value="semaine">📆 Cette semaine</SelectItem>
            <SelectItem value="mois">🗓 Ce mois</SelectItem>
            <SelectItem value="saison">☀️ Saison (juin-sept)</SelectItem>
            <SelectItem value="annee">📆 Cette année</SelectItem>
          </SelectContent>
        </Select>
        <Badge className="bg-[#FFA500]/20 text-[#0077A8]">{filteredIncidents.length} interventions</Badge>
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
                <p className="text-2xl font-heading text-[#0077A8]">{resolus.length > 0 ? Math.round(moins3h / resolus.length * 100) : 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques d'évolution interactifs */}
      <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
              <LineChartIcon className="w-4 h-4" />
              📈 Évolution des interventions
            </CardTitle>
            <div className="flex gap-2">
              <Select value={evolutionView} onValueChange={setEvolutionView}>
                <SelectTrigger className="w-36 h-8 text-xs border-[#00AEEF]/30 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heure">Par heure</SelectItem>
                  <SelectItem value="jour">Par jour semaine</SelectItem>
                  <SelectItem value="chronologique">30 derniers jours</SelectItem>
                  <SelectItem value="semaine">Par semaine</SelectItem>
                  <SelectItem value="mois">Par mois</SelectItem>
                  <SelectItem value="saison">Par saison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {evolutionView === 'heure' ? (
                <AreaChart data={evolutionParHeure}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="interventions" stroke="#00AEEF" fill="#00AEEF" fillOpacity={0.3} />
                </AreaChart>
              ) : evolutionView === 'jour' ? (
                <BarChart data={evolutionParJour}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="interventions" fill="#FFD700" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : evolutionView === 'chronologique' ? (
                <LineChart data={evolutionChronologique}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={9} angle={-45} textAnchor="end" height={50} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="interventions" stroke="#00AEEF" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              ) : evolutionView === 'semaine' ? (
                <BarChart data={evolutionParSemaine}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="interventions" fill="#FFA500" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : evolutionView === 'mois' ? (
                <BarChart data={evolutionParMois}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="interventions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={comparaisonSaisons}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="interventions" radius={[4, 4, 0, 0]}>
                    {comparaisonSaisons.map((entry, index) => (
                      <Cell key={index} fill={['#00AEEF', '#10b981', '#FFD700', '#FFA500'][index]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge className="bg-gray-100 text-gray-700">
              {evolutionView === 'heure' && '🕐 Pic: ' + HOUR_LABELS[evolutionParHeure.reduce((max, h, i, arr) => h.interventions > arr[max].interventions ? i : max, 0)]}
              {evolutionView === 'jour' && '📅 Jour le + chargé: ' + DAY_LABELS[evolutionParJour.reduce((max, d, i, arr) => d.interventions > arr[max].interventions ? i : max, 0)]}
              {evolutionView === 'mois' && '📆 Mois le + chargé: ' + MONTH_LABELS[evolutionParMois.reduce((max, m, i, arr) => m.interventions > arr[max].interventions ? i : max, 0)]}
              {evolutionView === 'saison' && '☀️ Saison la + chargée: ' + comparaisonSaisons.reduce((max, s) => s.interventions > max.interventions ? s : max, { interventions: 0 }).name}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Évolution des notes par mois */}
      <Card className="border-2 border-[#FFD700]/30 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
            <Star className="w-4 h-4" />
            ⭐ Évolution des notes par mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={notesMoyennesParMois}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis domain={[0, 5]} fontSize={10} />
                <Tooltip formatter={(value) => [`${value}/5`, 'Note moyenne']} />
                <Line type="monotone" dataKey="note" stroke="#FFD700" strokeWidth={3} dot={{ fill: '#FFD700', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Interventions par Mobil-home */}
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

        {/* Interventions par Emplacement */}
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

        {/* Répartition des avis */}
        <Card className="border-2 border-[#00AEEF]/30 rounded-xl lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
              <Star className="w-4 h-4" />
              ⭐ Répartition des avis clients
              <Badge className="bg-[#FFD700] text-[#0077A8] ml-2">Moyenne: {scoreMoyen}/5</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={avisStats.filter(a => a.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {avisStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {avisStats.map((avis, idx) => (
                  <div key={avis.note}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-body">{avis.name}</span>
                      <span className="font-heading text-[#0077A8]">{avis.value} ({totalAvis > 0 ? Math.round(avis.value / totalAvis * 100) : 0}%)</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full transition-all" style={{ width: `${totalAvis > 0 ? (avis.value / totalAvis * 100) : 0}%`, backgroundColor: COLORS[idx] }} />
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