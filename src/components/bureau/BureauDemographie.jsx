import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Baby, Dog, Cat } from 'lucide-react';

export default function BureauDemographie({ lang }) {
  const isFrench = lang === 'fr';
  const [selectedMonth, setSelectedMonth] = useState('all');

  const { data: dossiersArrivee = [] } = useQuery({
    queryKey: ['dossiers-arrivee-demo'],
    queryFn: () => base44.entities.DossierArrivee.list()
  });

  const filteredDossiers = dossiersArrivee.filter(d => {
    if (selectedMonth !== 'all') {
      const month = new Date(d.date_arrivee).getMonth() + 1;
      if (month !== parseInt(selectedMonth)) return false;
    }
    return true;
  });

  // Statistiques démographiques
  const stats = {
    adultes: filteredDossiers.reduce((acc, d) => acc + (d.nombre_adultes || 0), 0),
    adolescents: filteredDossiers.reduce((acc, d) => acc + (d.nombre_adolescents || 0), 0),
    enfants: filteredDossiers.reduce((acc, d) => acc + (d.nombre_enfants || 0), 0),
    bebes: filteredDossiers.reduce((acc, d) => acc + (d.nombre_bebes || 0), 0),
    chiens: filteredDossiers.reduce((acc, d) => acc + (d.nombre_chiens || 0), 0),
    chats: filteredDossiers.reduce((acc, d) => acc + (d.nombre_chats || 0), 0),
    animauxTotal: filteredDossiers.reduce((acc, d) => acc + (d.nombre_animaux || 0), 0)
  };

  const totalPersonnes = stats.adultes + stats.adolescents + stats.enfants + stats.bebes;
  const tauxFamillesAnimaux = filteredDossiers.length > 0 
    ? ((filteredDossiers.filter(d => (d.nombre_animaux || 0) > 0).length / filteredDossiers.length) * 100).toFixed(1)
    : 0;

  // Données pour graphiques
  const ageData = [
    { name: '0-2 ans', value: stats.bebes },
    { name: '3-12 ans', value: stats.enfants },
    { name: '13-17 ans', value: stats.adolescents },
    { name: '18+ ans', value: stats.adultes }
  ];

  const animalData = [
    { name: isFrench ? 'Chiens' : 'Dogs', value: stats.chiens },
    { name: isFrench ? 'Chats' : 'Cats', value: stats.chats },
    { name: isFrench ? 'Autres' : 'Others', value: stats.animauxTotal - stats.chiens - stats.chats }
  ];

  // Moyenne par locatif
  const moyenneParLocatif = filteredDossiers.length > 0 ? (totalPersonnes / filteredDossiers.length).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Filtre mois */}
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

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00AEEF]" />
              {isFrench ? 'Total personnes' : 'Total people'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{totalPersonnes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Baby className="w-4 h-4 text-[#FFD700]" />
              {isFrench ? 'Enfants 0-12' : 'Kids 0-12'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{stats.bebes + stats.enfants}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Dog className="w-4 h-4 text-[#FFA500]" />
              {isFrench ? 'Animaux' : 'Pets'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{stats.animauxTotal}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-[#22c55e]" />
              {isFrench ? 'Moy./locatif' : 'Avg/rental'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{moyenneParLocatif}</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isFrench ? 'Répartition par âge' : 'Age distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#00AEEF" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isFrench ? 'Animaux par type' : 'Pets by type'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={animalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#FFA500" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{isFrench ? 'Analyses' : 'Analysis'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-heading text-gray-700">
              {isFrench ? 'Taux de familles avec animaux' : 'Families with pets rate'}
            </span>
            <span className="text-2xl font-bold text-[#0077A8]">{tauxFamillesAnimaux}%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="font-heading text-gray-700">
              {isFrench ? 'Ratio adultes/enfants' : 'Adults/children ratio'}
            </span>
            <span className="text-2xl font-bold text-[#0077A8]">
              {stats.enfants + stats.bebes > 0 ? (stats.adultes / (stats.enfants + stats.bebes)).toFixed(2) : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}