import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, Wrench, Sparkles, Clock, ThumbsUp, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import moment from 'moment';

const COLORS = ['#00AEEF', '#22c55e', '#FFD700', '#FFA500', '#8B5CF6', '#EC4899'];

export default function Statistiques({ embedded = false }) {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [dateDebut, setDateDebut] = useState(
    moment().subtract(3, 'months').format('YYYY-MM-DD')
  );
  const [dateFin, setDateFin] = useState(moment().format('YYYY-MM-DD'));

  // Récupérer toutes les données
  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers-arrivee'],
    queryFn: () => base44.entities.DossierArrivee.list()
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents-stats'],
    queryFn: () => base44.entities.Incident.list()
  });

  const { data: controles = [] } = useQuery({
    queryKey: ['controles-inventaire'],
    queryFn: () => base44.entities.ControleInventaireArrivee.list()
  });

  const { data: mobilhomes = [] } = useQuery({
    queryKey: ['mobilhomes'],
    queryFn: () => base44.entities.Mobilhome.list()
  });

  // Filtrer les données par dates
  const dossiersFiltres = useMemo(() => {
    return dossiers.filter(d => {
      const dateArrivee = moment(d.date_arrivee);
      return dateArrivee.isBetween(dateDebut, dateFin, 'day', '[]');
    });
  }, [dossiers, dateDebut, dateFin]);

  const incidentsFiltres = useMemo(() => {
    return incidents.filter(i => {
      const dateSaisie = moment(i.date_saisie || i.created_date);
      return dateSaisie.isBetween(dateDebut, dateFin, 'day', '[]');
    });
  }, [incidents, dateDebut, dateFin]);

  // 1. TAUX D'OCCUPATION
  const tauxOccupation = useMemo(() => {
    const totalLogements = mobilhomes.length;
    const moisData = {};

    dossiersFiltres.forEach(dossier => {
      const debut = moment(dossier.date_arrivee);
      const fin = moment(dossier.date_depart);
      
      let current = debut.clone();
      while (current.isSameOrBefore(fin, 'day')) {
        const moisKey = current.format('YYYY-MM');
        if (!moisData[moisKey]) {
          moisData[moisKey] = new Set();
        }
        moisData[moisKey].add(dossier.numero_logement);
        current.add(1, 'day');
      }
    });

    return Object.keys(moisData)
      .sort()
      .map(mois => ({
        mois: moment(mois, 'YYYY-MM').format('MMM YYYY'),
        taux: totalLogements > 0 ? Math.round((moisData[mois].size / totalLogements) * 100) : 0,
        logements: moisData[mois].size
      }));
  }, [dossiersFiltres, mobilhomes]);

  // 2. INTERVENTIONS PAR CATÉGORIE ET MOIS
  const interventionsParMois = useMemo(() => {
    const moisData = {};

    incidentsFiltres.forEach(incident => {
      const mois = moment(incident.date_saisie || incident.created_date).format('YYYY-MM');
      if (!moisData[mois]) {
        moisData[mois] = { technique: 0, menage: 0 };
      }
      if (incident.type === 'technique') {
        moisData[mois].technique++;
      } else if (incident.type === 'menage') {
        moisData[mois].menage++;
      }
    });

    return Object.keys(moisData)
      .sort()
      .map(mois => ({
        mois: moment(mois, 'YYYY-MM').format('MMM YYYY'),
        technique: moisData[mois].technique,
        menage: moisData[mois].menage,
        total: moisData[mois].technique + moisData[mois].menage
      }));
  }, [incidentsFiltres]);

  // 3. INTERVENTIONS PAR CATÉGORIE (camembert)
  const interventionsParCategorie = useMemo(() => {
    const categorieData = {};

    incidentsFiltres.forEach(incident => {
      const cat = incident.categorie || 'Autre';
      categorieData[cat] = (categorieData[cat] || 0) + 1;
    });

    return Object.entries(categorieData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [incidentsFiltres]);

  // 4. TEMPS MOYEN DE RÉSOLUTION
  const tempsResolution = useMemo(() => {
    const incidentsResolus = incidentsFiltres.filter(i => 
      i.statut === 'resolu' && i.date_saisie && i.date_resolution
    );

    if (incidentsResolus.length === 0) return 0;

    const totalMinutes = incidentsResolus.reduce((sum, incident) => {
      const debut = moment(incident.date_saisie);
      const fin = moment(incident.date_resolution);
      return sum + fin.diff(debut, 'minutes');
    }, 0);

    return Math.round(totalMinutes / incidentsResolus.length);
  }, [incidentsFiltres]);

  // Distribution des temps de résolution
  const distributionTemps = useMemo(() => {
    const ranges = {
      '< 1h': 0,
      '1-2h': 0,
      '2-4h': 0,
      '4-8h': 0,
      '8-24h': 0,
      '> 24h': 0
    };

    incidentsFiltres.forEach(incident => {
      if (incident.statut === 'resolu' && incident.date_saisie && incident.date_resolution) {
        const minutes = moment(incident.date_resolution).diff(moment(incident.date_saisie), 'minutes');
        const heures = minutes / 60;

        if (heures < 1) ranges['< 1h']++;
        else if (heures < 2) ranges['1-2h']++;
        else if (heures < 4) ranges['2-4h']++;
        else if (heures < 8) ranges['4-8h']++;
        else if (heures < 24) ranges['8-24h']++;
        else ranges['> 24h']++;
      }
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  }, [incidentsFiltres]);

  // 5. SATISFACTION CLIENT
  const satisfaction = useMemo(() => {
    const evaluations = controles.filter(c => {
      const date = moment(c.date_validation || c.created_date);
      return date.isBetween(dateDebut, dateFin, 'day', '[]') && c.evaluation_proprete;
    });

    const counts = {
      pas_satisfaisant: 0,
      correct: 0,
      tres_propre: 0
    };

    evaluations.forEach(c => {
      counts[c.evaluation_proprete]++;
    });

    const total = evaluations.length;
    const moyenneScore = total > 0
      ? ((counts.tres_propre * 5 + counts.correct * 3 + counts.pas_satisfaisant * 1) / total).toFixed(1)
      : 0;

    return {
      distribution: [
        { name: '😠 Pas satisfaisant', value: counts.pas_satisfaisant, color: '#EF4444' },
        { name: '😐 Correct', value: counts.correct, color: '#F59E0B' },
        { name: '😊 Très propre', value: counts.tres_propre, color: '#22C55E' }
      ],
      moyenne: moyenneScore,
      total
    };
  }, [controles, dateDebut, dateFin]);

  // KPIs
  const kpis = useMemo(() => ({
    totalDossiers: dossiersFiltres.length,
    totalInterventions: incidentsFiltres.length,
    interventionsResolues: incidentsFiltres.filter(i => i.statut === 'resolu').length,
    tauxResolution: incidentsFiltres.length > 0
      ? Math.round((incidentsFiltres.filter(i => i.statut === 'resolu').length / incidentsFiltres.length) * 100)
      : 0
  }), [dossiersFiltres, incidentsFiltres]);

  const content = (
    <>
      {!embedded && (
        <>
          <button
            onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-4xl text-[#00AEEF] text-center mb-2">
            📊 {lang === 'fr' ? 'Statistiques' : 'Statistics'}
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {lang === 'fr' ? 'Vue d\'ensemble des données du camping' : 'Overview of camping data'}
          </p>
        </>
      )}

          {/* Filtres de date */}
          <Card className="mb-6 border-2 border-[#00AEEF]/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-[#00AEEF]" />
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">{lang === 'fr' ? 'Date début' : 'Start date'}</Label>
                    <Input
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="border-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">{lang === 'fr' ? 'Date fin' : 'End date'}</Label>
                    <Input
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="border-2"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">{lang === 'fr' ? 'Arrivées' : 'Arrivals'}</p>
                    <p className="text-3xl font-bold">{kpis.totalDossiers}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">{lang === 'fr' ? 'Interventions' : 'Interventions'}</p>
                    <p className="text-3xl font-bold">{kpis.totalInterventions}</p>
                  </div>
                  <Wrench className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">{lang === 'fr' ? 'Taux résolution' : 'Resolution rate'}</p>
                    <p className="text-3xl font-bold">{kpis.tauxResolution}%</p>
                  </div>
                  <Clock className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">{lang === 'fr' ? 'Satisfaction' : 'Satisfaction'}</p>
                    <p className="text-3xl font-bold">{satisfaction.moyenne}/5</p>
                  </div>
                  <ThumbsUp className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <Tabs defaultValue="occupation" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="occupation">
                {lang === 'fr' ? 'Occupation' : 'Occupancy'}
              </TabsTrigger>
              <TabsTrigger value="interventions">
                {lang === 'fr' ? 'Interventions' : 'Interventions'}
              </TabsTrigger>
              <TabsTrigger value="temps">
                {lang === 'fr' ? 'Temps' : 'Time'}
              </TabsTrigger>
              <TabsTrigger value="satisfaction">
                {lang === 'fr' ? 'Satisfaction' : 'Satisfaction'}
              </TabsTrigger>
            </TabsList>

            {/* 1. OCCUPATION */}
            <TabsContent value="occupation">
              <Card>
                <CardHeader>
                  <CardTitle>
                    📈 {lang === 'fr' ? 'Taux d\'occupation par mois' : 'Occupancy rate by month'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tauxOccupation.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={tauxOccupation}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mois" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="taux" stroke="#00AEEF" strokeWidth={3} name={lang === 'fr' ? 'Taux (%)' : 'Rate (%)'} />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="mt-4 text-center text-sm text-gray-600">
                        {lang === 'fr' 
                          ? `Basé sur ${mobilhomes.length} logements disponibles`
                          : `Based on ${mobilhomes.length} available accommodations`
                        }
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      {lang === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 2. INTERVENTIONS */}
            <TabsContent value="interventions">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      📊 {lang === 'fr' ? 'Interventions par mois' : 'Interventions by month'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interventionsParMois.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={interventionsParMois}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mois" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="technique" fill="#00AEEF" name={lang === 'fr' ? 'Technique' : 'Technical'} />
                          <Bar dataKey="menage" fill="#FFD700" name={lang === 'fr' ? 'Ménage' : 'Housekeeping'} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        {lang === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      🥧 {lang === 'fr' ? 'Répartition par catégorie' : 'Distribution by category'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interventionsParCategorie.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={interventionsParCategorie}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {interventionsParCategorie.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        {lang === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 3. TEMPS */}
            <TabsContent value="temps">
              <Card>
                <CardHeader>
                  <CardTitle>
                    ⏱ {lang === 'fr' ? 'Distribution des temps de résolution' : 'Resolution time distribution'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <p className="text-4xl font-bold text-[#00AEEF]">
                      {Math.floor(tempsResolution / 60)}h {tempsResolution % 60}min
                    </p>
                    <p className="text-sm text-gray-600">
                      {lang === 'fr' ? 'Temps moyen de résolution' : 'Average resolution time'}
                    </p>
                  </div>

                  {distributionTemps.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={distributionTemps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#22c55e" name={lang === 'fr' ? 'Interventions' : 'Interventions'} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      {lang === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 4. SATISFACTION */}
            <TabsContent value="satisfaction">
              <Card>
                <CardHeader>
                  <CardTitle>
                    😊 {lang === 'fr' ? 'Satisfaction client - Propreté' : 'Customer satisfaction - Cleanliness'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {satisfaction.total > 0 ? (
                    <>
                      <div className="flex justify-center mb-6">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={satisfaction.distribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {satisfaction.distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        {satisfaction.distribution.map((item, index) => (
                          <div key={index} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${item.color}15` }}>
                            <p className="text-2xl mb-1">{item.name.split(' ')[0]}</p>
                            <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
                            <p className="text-xs text-gray-600">{item.name.split(' ').slice(1).join(' ')}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 text-center text-sm text-gray-600">
                        {lang === 'fr' 
                          ? `Basé sur ${satisfaction.total} évaluations`
                          : `Based on ${satisfaction.total} evaluations`
                        }
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      {lang === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
    </>
  );

  if (embedded) {
    return <div className="px-4 py-4">{content}</div>;
  }

  return (
    <div className="min-h-screen px-6 py-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {content}
        </motion.div>
      </div>
    </div>
  );
}