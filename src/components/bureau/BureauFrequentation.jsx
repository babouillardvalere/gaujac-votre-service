import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Home, Calendar, TrendingUp, PawPrint } from 'lucide-react';

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
    </div>
  );
}