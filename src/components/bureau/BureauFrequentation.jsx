import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Home, Calendar, TrendingUp, PawPrint } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, getMonth, getYear, getISOWeek } from 'date-fns';

const COLORS = ['#00AEEF', '#FFD700', '#FFA500', '#22c55e', '#8b5cf6'];

export default function BureauFrequentation({ lang }) {
  const isFrench = lang === 'fr';
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: dossiersArrivee = [] } = useQuery({
    queryKey: ['dossiers-arrivee-bureau'],
    queryFn: () => base44.entities.DossierArrivee.list()
  });

  // Filtrer les dossiers
  const filteredDossiers = dossiersArrivee.filter(d => {
    if (selectedMonth !== 'all') {
      const month = new Date(d.date_arrivee).getMonth() + 1;
      if (month !== parseInt(selectedMonth)) return false;
    }
    if (selectedCategory !== 'all' && d.categorie_logement !== selectedCategory) return false;
    return true;
  });

  // Calculer les statistiques
  const stats = {
    totalArrivees: filteredDossiers.length,
    totalPersonnes: filteredDossiers.reduce((acc, d) => 
      acc + (d.nombre_adultes || 0) + (d.nombre_adolescents || 0) + (d.nombre_enfants || 0) + (d.nombre_bebes || 0), 0
    ),
    totalAnimaux: filteredDossiers.reduce((acc, d) => acc + (d.nombre_animaux || 0), 0),
    totalChiens: filteredDossiers.reduce((acc, d) => acc + (d.nombre_chiens || 0), 0),
    totalChats: filteredDossiers.reduce((acc, d) => acc + (d.nombre_chats || 0), 0)
  };

  // Données par catégorie
  const categoriesData = {};
  filteredDossiers.forEach(d => {
    const cat = d.categorie_logement || 'Non défini';
    if (!categoriesData[cat]) categoriesData[cat] = 0;
    categoriesData[cat]++;
  });

  const pieData = Object.entries(categoriesData).map(([name, value]) => ({ name, value }));

  // Répartition par durée de séjour
  const durationData = { '2-3j': 0, '1sem': 0, '2sem': 0, '3sem': 0, '1mois+': 0 };
  filteredDossiers.forEach(d => {
    const days = Math.ceil((new Date(d.date_depart) - new Date(d.date_arrivee)) / (1000 * 60 * 60 * 24));
    if (days <= 3) durationData['2-3j']++;
    else if (days <= 7) durationData['1sem']++;
    else if (days <= 14) durationData['2sem']++;
    else if (days <= 21) durationData['3sem']++;
    else durationData['1mois+']++;
  });

  const durationChartData = Object.entries(durationData).map(([name, value]) => ({ name, value }));

  // Taux par tranche d'âge par mois
  const tauxParMois = useMemo(() => {
    const moisData = {};
    
    dossiersArrivee.forEach(d => {
      if (!d.date_arrivee) return;
      const month = getMonth(parseISO(d.date_arrivee));
      const year = getYear(parseISO(d.date_arrivee));
      const key = `${year}-${month + 1}`;
      
      if (!moisData[key]) {
        moisData[key] = {
          mois: `${['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'][month]} ${year}`,
          adultes: 0,
          adolescents: 0,
          enfants: 0,
          bebes: 0,
          total: 0
        };
      }
      
      moisData[key].adultes += d.nombre_adultes || 0;
      moisData[key].adolescents += d.nombre_adolescents || 0;
      moisData[key].enfants += d.nombre_enfants || 0;
      moisData[key].bebes += d.nombre_bebes || 0;
      moisData[key].total += (d.nombre_adultes || 0) + (d.nombre_adolescents || 0) + (d.nombre_enfants || 0) + (d.nombre_bebes || 0);
    });
    
    return Object.entries(moisData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, data]) => ({
        ...data,
        tauxAdultes: data.total > 0 ? ((data.adultes / data.total) * 100).toFixed(1) : 0,
        tauxAdolescents: data.total > 0 ? ((data.adolescents / data.total) * 100).toFixed(1) : 0,
        tauxEnfants: data.total > 0 ? ((data.enfants / data.total) * 100).toFixed(1) : 0,
        tauxBebes: data.total > 0 ? ((data.bebes / data.total) * 100).toFixed(1) : 0
      }));
  }, [dossiersArrivee]);

  // Taux par tranche d'âge par semaine
  const tauxParSemaine = useMemo(() => {
    const semaineData = {};
    
    dossiersArrivee.forEach(d => {
      if (!d.date_arrivee) return;
      const date = parseISO(d.date_arrivee);
      const year = getYear(date);
      const week = getISOWeek(date);
      const key = `${year}-W${week}`;
      
      if (!semaineData[key]) {
        semaineData[key] = {
          semaine: `S${week} ${year}`,
          adultes: 0,
          adolescents: 0,
          enfants: 0,
          bebes: 0,
          total: 0
        };
      }
      
      semaineData[key].adultes += d.nombre_adultes || 0;
      semaineData[key].adolescents += d.nombre_adolescents || 0;
      semaineData[key].enfants += d.nombre_enfants || 0;
      semaineData[key].bebes += d.nombre_bebes || 0;
      semaineData[key].total += (d.nombre_adultes || 0) + (d.nombre_adolescents || 0) + (d.nombre_enfants || 0) + (d.nombre_bebes || 0);
    });
    
    return Object.entries(semaineData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, data]) => ({
        ...data,
        tauxAdultes: data.total > 0 ? ((data.adultes / data.total) * 100).toFixed(1) : 0,
        tauxAdolescents: data.total > 0 ? ((data.adolescents / data.total) * 100).toFixed(1) : 0,
        tauxEnfants: data.total > 0 ? ((data.enfants / data.total) * 100).toFixed(1) : 0,
        tauxBebes: data.total > 0 ? ((data.bebes / data.total) * 100).toFixed(1) : 0
      }))
      .slice(-12); // 12 dernières semaines
  }, [dossiersArrivee]);

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={isFrench ? 'Mois' : 'Month'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isFrench ? 'Tous les mois' : 'All months'}</SelectItem>
            <SelectItem value="5">{isFrench ? 'Mai' : 'May'}</SelectItem>
            <SelectItem value="6">{isFrench ? 'Juin' : 'June'}</SelectItem>
            <SelectItem value="7">{isFrench ? 'Juillet' : 'July'}</SelectItem>
            <SelectItem value="8">{isFrench ? 'Août' : 'August'}</SelectItem>
            <SelectItem value="9">{isFrench ? 'Septembre' : 'September'}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={isFrench ? 'Catégorie' : 'Category'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isFrench ? 'Toutes catégories' : 'All categories'}</SelectItem>
            <SelectItem value="Emplacement 6A">Emplacement 6A</SelectItem>
            <SelectItem value="Emplacement 10A">Emplacement 10A</SelectItem>
            <SelectItem value="Chalet Eco">Chalet Éco</SelectItem>
            <SelectItem value="Mobil-home Eco">MH Éco</SelectItem>
            <SelectItem value="Premium 2ch">Premium 2ch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Home className="w-4 h-4 text-[#00AEEF]" />
              {isFrench ? 'Arrivées' : 'Arrivals'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{stats.totalArrivees}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-[#22c55e]" />
              {isFrench ? 'Personnes' : 'People'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{stats.totalPersonnes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PawPrint className="w-4 h-4 text-[#FFA500]" />
              {isFrench ? 'Animaux' : 'Pets'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{stats.totalAnimaux}</p>
            <p className="text-xs text-gray-500">🐕 {stats.totalChiens} • 🐈 {stats.totalChats}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FFD700]" />
              {isFrench ? 'Moyenne/séjour' : 'Avg/stay'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">
              {stats.totalArrivees > 0 ? (stats.totalPersonnes / stats.totalArrivees).toFixed(1) : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isFrench ? 'Répartition par catégorie' : 'Distribution by category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isFrench ? 'Durée de séjour' : 'Stay duration'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={durationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#00AEEF" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tableaux taux par tranche d'âge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Par mois */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isFrench ? '👥 Taux par tranche d\'âge par mois' : '👥 Age group rates by month'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left font-heading">Mois</th>
                    <th className="p-2 text-right font-heading">Adultes</th>
                    <th className="p-2 text-right font-heading">Ados</th>
                    <th className="p-2 text-right font-heading">Enfants</th>
                    <th className="p-2 text-right font-heading">Bébés</th>
                    <th className="p-2 text-right font-heading">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {tauxParMois.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-2 font-body">{row.mois}</td>
                      <td className="p-2 text-right">
                        <span className="font-heading text-[#0077A8]">{row.tauxAdultes}%</span>
                        <span className="text-xs text-gray-500 ml-1">({row.adultes})</span>
                      </td>
                      <td className="p-2 text-right">
                        <span className="font-heading text-[#00AEEF]">{row.tauxAdolescents}%</span>
                        <span className="text-xs text-gray-500 ml-1">({row.adolescents})</span>
                      </td>
                      <td className="p-2 text-right">
                        <span className="font-heading text-[#FFD700]">{row.tauxEnfants}%</span>
                        <span className="text-xs text-gray-500 ml-1">({row.enfants})</span>
                      </td>
                      <td className="p-2 text-right">
                        <span className="font-heading text-[#FFA500]">{row.tauxBebes}%</span>
                        <span className="text-xs text-gray-500 ml-1">({row.bebes})</span>
                      </td>
                      <td className="p-2 text-right font-bold">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Par semaine */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isFrench ? '👥 Taux par tranche d\'âge par semaine' : '👥 Age group rates by week'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left font-heading">Semaine</th>
                    <th className="p-2 text-right font-heading">Adultes</th>
                    <th className="p-2 text-right font-heading">Ados</th>
                    <th className="p-2 text-right font-heading">Enfants</th>
                    <th className="p-2 text-right font-heading">Bébés</th>
                    <th className="p-2 text-right font-heading">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {tauxParSemaine.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-2 font-body">{row.semaine}</td>
                      <td className="p-2 text-right">
                        <span className="font-heading text-[#0077A8]">{row.tauxAdultes}%</span>
                        <span className="text-xs text-gray-500 ml-1">({row.adultes})</span>
                      </td>
                      <td className="p-2 text-right">
                        <span className="font-heading text-[#00AEEF]">{row.tauxAdolescents}%</span>
                        <span className="text-xs text-gray-500 ml-1">({row.adolescents})</span>
                      </td>
                      <td className="p-2 text-right">
                        <span className="font-heading text-[#FFD700]">{row.tauxEnfants}%</span>
                        <span className="text-xs text-gray-500 ml-1">({row.enfants})</span>
                      </td>
                      <td className="p-2 text-right">
                        <span className="font-heading text-[#FFA500]">{row.tauxBebes}%</span>
                        <span className="text-xs text-gray-500 ml-1">({row.bebes})</span>
                      </td>
                      <td className="p-2 text-right font-bold">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}