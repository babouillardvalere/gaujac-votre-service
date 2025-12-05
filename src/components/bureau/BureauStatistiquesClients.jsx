import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Dog, Cat, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0077A8', '#00AEEF', '#22c55e', '#FFD700', '#FFA500'];

export default function BureauStatistiquesClients({ lang = 'fr' }) {
  const [moisFiltre, setMoisFiltre] = useState(new Date().getMonth() + 1);

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers-arrivee-stats'],
    queryFn: () => base44.entities.DossierArrivee.list()
  });

  const statsParLocatif = useMemo(() => {
    return dossiers
      .filter(d => d.statut === 'finalise')
      .map(d => ({
        locatif: d.numero_logement,
        categorie: d.categorie_logement,
        adultes: d.nombre_adultes || 0,
        enfants: (d.nombre_enfants || 0) + (d.nombre_adolescents || 0) + (d.nombre_bebes || 0),
        animaux: d.nombre_animaux || 0,
        total: (d.nombre_adultes || 0) + (d.nombre_enfants || 0) + (d.nombre_adolescents || 0) + (d.nombre_bebes || 0)
      }));
  }, [dossiers]);

  const statsParMois = useMemo(() => {
    const groupes = {};
    dossiers
      .filter(d => d.statut === 'finalise')
      .forEach(d => {
        const mois = new Date(d.date_arrivee).getMonth() + 1;
        if (!groupes[mois]) {
          groupes[mois] = {
            mois,
            totalPersonnes: 0,
            adultes: 0,
            enfants: 0,
            animaux: 0,
            dossiers: 0
          };
        }
        groupes[mois].totalPersonnes += (d.nombre_adultes || 0) + (d.nombre_enfants || 0) + 
                                        (d.nombre_adolescents || 0) + (d.nombre_bebes || 0);
        groupes[mois].adultes += d.nombre_adultes || 0;
        groupes[mois].enfants += (d.nombre_enfants || 0) + (d.nombre_adolescents || 0) + (d.nombre_bebes || 0);
        groupes[mois].animaux += d.nombre_animaux || 0;
        groupes[mois].dossiers += 1;
      });

    return Object.values(groupes).map(g => ({
      ...g,
      nomMois: lang === 'fr' 
        ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][g.mois - 1]
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][g.mois - 1]
    }));
  }, [dossiers, lang]);

  const statsAnimaux = useMemo(() => {
    let totalChiens = 0;
    let totalChats = 0;
    let logementAvecAnimaux = 0;

    dossiers
      .filter(d => d.statut === 'finalise')
      .forEach(d => {
        totalChiens += d.nombre_chiens || 0;
        totalChats += d.nombre_chats || 0;
        if ((d.nombre_animaux || 0) > 0) logementAvecAnimaux += 1;
      });

    return {
      chiens: totalChiens,
      chats: totalChats,
      total: totalChiens + totalChats,
      pourcentage: dossiers.length > 0 ? Math.round((logementAvecAnimaux / dossiers.length) * 100) : 0
    };
  }, [dossiers]);

  const repartitionAges = useMemo(() => {
    let adultes = 0;
    let adolescents = 0;
    let enfants = 0;
    let bebes = 0;

    dossiers
      .filter(d => d.statut === 'finalise')
      .forEach(d => {
        adultes += d.nombre_adultes || 0;
        adolescents += d.nombre_adolescents || 0;
        enfants += d.nombre_enfants || 0;
        bebes += d.nombre_bebes || 0;
      });

    return [
      { name: lang === 'fr' ? 'Adultes (18+)' : 'Adults (18+)', value: adultes },
      { name: lang === 'fr' ? 'Ados (13-17)' : 'Teens (13-17)', value: adolescents },
      { name: lang === 'fr' ? 'Enfants (3-12)' : 'Children (3-12)', value: enfants },
      { name: lang === 'fr' ? 'Bébés (0-2)' : 'Babies (0-2)', value: bebes }
    ].filter(x => x.value > 0);
  }, [dossiers, lang]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="locatifs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="locatifs">
            {lang === 'fr' ? 'Par locatif' : 'By accommodation'}
          </TabsTrigger>
          <TabsTrigger value="mois">
            {lang === 'fr' ? 'Par mois' : 'By month'}
          </TabsTrigger>
          <TabsTrigger value="ages">
            {lang === 'fr' ? 'Tranches d\'âge' : 'Age groups'}
          </TabsTrigger>
          <TabsTrigger value="animaux">
            {lang === 'fr' ? 'Animaux' : 'Pets'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locatifs" className="space-y-6 mt-6">
          <Card className="border-2 border-blue-300">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg text-[#0077A8] mb-4">
                {lang === 'fr' ? 'Statistiques par locatif' : 'Statistics by accommodation'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">{lang === 'fr' ? 'Locatif' : 'Accommodation'}</th>
                      <th className="p-2 text-left">{lang === 'fr' ? 'Catégorie' : 'Category'}</th>
                      <th className="p-2 text-right">{lang === 'fr' ? 'Adultes' : 'Adults'}</th>
                      <th className="p-2 text-right">{lang === 'fr' ? 'Enfants' : 'Children'}</th>
                      <th className="p-2 text-right">{lang === 'fr' ? 'Animaux' : 'Pets'}</th>
                      <th className="p-2 text-right">{lang === 'fr' ? 'Total' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsParLocatif.map((stat, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 font-bold">{stat.locatif}</td>
                        <td className="p-2">{stat.categorie}</td>
                        <td className="p-2 text-right">{stat.adultes}</td>
                        <td className="p-2 text-right">{stat.enfants}</td>
                        <td className="p-2 text-right">
                          {stat.animaux > 0 && <span>🐾 {stat.animaux}</span>}
                        </td>
                        <td className="p-2 text-right font-bold">{stat.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mois" className="space-y-6 mt-6">
          <Card className="border-2 border-green-300">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg text-[#0077A8] mb-4">
                {lang === 'fr' ? 'Évolution mensuelle' : 'Monthly evolution'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsParMois}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nomMois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="adultes" fill="#0077A8" name={lang === 'fr' ? 'Adultes' : 'Adults'} />
                  <Bar dataKey="enfants" fill="#22c55e" name={lang === 'fr' ? 'Enfants' : 'Children'} />
                  <Bar dataKey="animaux" fill="#FFA500" name={lang === 'fr' ? 'Animaux' : 'Pets'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ages" className="space-y-6 mt-6">
          <Card className="border-2 border-purple-300">
            <CardContent className="p-6">
              <h3 className="font-heading text-lg text-[#0077A8] mb-4">
                {lang === 'fr' ? 'Répartition par âge' : 'Age distribution'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartitionAges}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {repartitionAges.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="animaux" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-orange-300">
              <CardContent className="p-6 text-center">
                <Dog className="w-12 h-12 mx-auto mb-2 text-orange-600" />
                <p className="text-3xl font-bold text-orange-600">{statsAnimaux.chiens}</p>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Chiens' : 'Dogs'}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-pink-300">
              <CardContent className="p-6 text-center">
                <Cat className="w-12 h-12 mx-auto mb-2 text-pink-600" />
                <p className="text-3xl font-bold text-pink-600">{statsAnimaux.chats}</p>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Chats' : 'Cats'}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-300">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold text-green-600">{statsAnimaux.pourcentage}%</p>
                <p className="text-sm text-gray-600">
                  {lang === 'fr' ? 'Locatifs avec animaux' : 'Accommodations with pets'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}