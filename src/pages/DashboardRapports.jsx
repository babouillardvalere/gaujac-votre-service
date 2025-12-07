import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, Users, Clock, Star, AlertCircle, Home, Calendar, Download } from 'lucide-react';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import { motion } from 'framer-motion';

const COLORS = ['#00AEEF', '#22c55e', '#FFA500', '#f43f5e', '#8b5cf6', '#06b6d4'];

export default function DashboardRapports() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [dateDebut, setDateDebut] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
  const [filterTypeLogement, setFilterTypeLogement] = useState('all');
  const [filterCategorieIntervention, setFilterCategorieIntervention] = useState('all');

  // Fetch data
  const { data: fichesArrivee = [] } = useQuery({
    queryKey: ['fiches-arrivee-dashboard'],
    queryFn: () => base44.entities.FicheArrivee.list('-date_validation', 1000)
  });

  const { data: fichesDepart = [] } = useQuery({
    queryKey: ['fiches-depart-dashboard'],
    queryFn: () => base44.entities.FicheDepart.list('-date_validation', 1000)
  });

  const { data: interventions = [] } = useQuery({
    queryKey: ['interventions-dashboard'],
    queryFn: () => base44.entities.Incident.list('-date_saisie', 1000)
  });

  const { data: avis = [] } = useQuery({
    queryKey: ['avis-dashboard'],
    queryFn: () => base44.entities.Avis.list('-created_date', 1000)
  });

  // Filter data by date range and filters
  const filteredData = useMemo(() => {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    fin.setHours(23, 59, 59);

    const fichesArriveeFiltered = fichesArrivee.filter(f => {
      const dateValidation = new Date(f.date_validation);
      const matchDate = dateValidation >= debut && dateValidation <= fin;
      const matchType = filterTypeLogement === 'all' || f.type_logement === filterTypeLogement;
      return matchDate && matchType;
    });

    const fichesDepartFiltered = fichesDepart.filter(f => {
      const dateValidation = new Date(f.date_validation);
      const matchDate = dateValidation >= debut && dateValidation <= fin;
      const matchType = filterTypeLogement === 'all' || f.type_logement === filterTypeLogement;
      return matchDate && matchType;
    });

    const interventionsFiltered = interventions.filter(i => {
      const dateSaisie = new Date(i.date_saisie);
      const matchDate = dateSaisie >= debut && dateSaisie <= fin;
      const matchCategorie = filterCategorieIntervention === 'all' || i.categorie === filterCategorieIntervention;
      return matchDate && matchCategorie;
    });

    const avisFiltered = avis.filter(a => {
      const dateCreation = new Date(a.created_date);
      return dateCreation >= debut && dateCreation <= fin;
    });

    return {
      fichesArrivee: fichesArriveeFiltered,
      fichesDepart: fichesDepartFiltered,
      interventions: interventionsFiltered,
      avis: avisFiltered
    };
  }, [fichesArrivee, fichesDepart, interventions, avis, dateDebut, dateFin, filterTypeLogement, filterCategorieIntervention]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalArrivees = filteredData.fichesArrivee.length;
    const totalDeparts = filteredData.fichesDepart.length;
    const totalInterventions = filteredData.interventions.length;

    // Satisfaction moyenne
    const satisfactionMoyenne = filteredData.avis.length > 0
      ? (filteredData.avis.reduce((sum, a) => sum + (a.note_globale || 0), 0) / filteredData.avis.length).toFixed(1)
      : 0;

    // Temps de réponse moyen
    const interventionsAvecTemps = filteredData.interventions.filter(i => i.temps_prise_en_charge);
    const tempsReponseMoyen = interventionsAvecTemps.length > 0
      ? Math.round(interventionsAvecTemps.reduce((sum, i) => sum + i.temps_prise_en_charge, 0) / interventionsAvecTemps.length)
      : 0;

    // Taux d'occupation (approximatif)
    const totalLogements = 150; // À adapter
    const tauxOccupation = Math.round((totalArrivees / totalLogements) * 100);

    // Problèmes propreté
    const problemesPropreteArrivee = filteredData.fichesArrivee.filter(f => f.evaluation_proprete === 'pas_satisfaisant').length;
    const problemesPropreteDepart = filteredData.fichesDepart.filter(f => f.evaluation_proprete === 'pas_satisfaisant').length;

    return {
      totalArrivees,
      totalDeparts,
      totalInterventions,
      satisfactionMoyenne,
      tempsReponseMoyen,
      tauxOccupation,
      problemesPropreteArrivee,
      problemesPropreteDepart
    };
  }, [filteredData]);

  // Data pour graphiques
  const interventionsParType = useMemo(() => {
    const grouped = filteredData.interventions.reduce((acc, i) => {
      const type = i.type === 'technique' ? (lang === 'fr' ? 'Technique' : 'Technical') : (lang === 'fr' ? 'Ménage' : 'Housekeeping');
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [filteredData.interventions, lang]);

  const interventionsParCategorie = useMemo(() => {
    const grouped = filteredData.interventions.reduce((acc, i) => {
      acc[i.categorie] = (acc[i.categorie] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [filteredData.interventions]);

  const evolutionArrivees = useMemo(() => {
    const grouped = {};
    filteredData.fichesArrivee.forEach(f => {
      const date = new Date(f.date_validation).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [filteredData.fichesArrivee]);

  const repartitionSatisfaction = useMemo(() => {
    const grouped = filteredData.avis.reduce((acc, a) => {
      const note = Math.floor(a.note_globale || 0);
      acc[note] = (acc[note] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([note, count]) => ({
      name: `${note} ${lang === 'fr' ? 'étoiles' : 'stars'}`,
      value: count
    }));
  }, [filteredData.avis, lang]);

  const tempsReponseParType = useMemo(() => {
    const grouped = filteredData.interventions.reduce((acc, i) => {
      if (!i.temps_prise_en_charge) return acc;
      const type = i.type === 'technique' ? (lang === 'fr' ? 'Technique' : 'Technical') : (lang === 'fr' ? 'Ménage' : 'Housekeeping');
      if (!acc[type]) acc[type] = { total: 0, count: 0 };
      acc[type].total += i.temps_prise_en_charge;
      acc[type].count += 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, data]) => ({
      name,
      temps: Math.round(data.total / data.count)
    }));
  }, [filteredData.interventions, lang]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <Button onClick={() => navigate(createPageUrl('MenuCollaborateur'))} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('retour')}
            </Button>
          </div>

          <Logo className="h-16 mb-6" />

          <div className="text-center mb-8">
            <h1 className="font-handwritten text-5xl text-[#00AEEF] mb-2">
              📊 {lang === 'fr' ? 'Tableau de Bord' : 'Dashboard'}
            </h1>
            <p className="text-gray-600 font-body text-lg">
              {lang === 'fr' ? 'Analyse et statistiques' : 'Analytics and statistics'}
            </p>
          </div>

          {/* Filtres */}
          <Card className="mb-6 border-2 border-[#00AEEF]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {lang === 'fr' ? 'Filtres' : 'Filters'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-heading mb-2 block">
                    {lang === 'fr' ? 'Date début' : 'Start date'}
                  </label>
                  <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-heading mb-2 block">
                    {lang === 'fr' ? 'Date fin' : 'End date'}
                  </label>
                  <Input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-heading mb-2 block">
                    {lang === 'fr' ? 'Type logement' : 'Accommodation type'}
                  </label>
                  <Select value={filterTypeLogement} onValueChange={setFilterTypeLogement}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{lang === 'fr' ? 'Tous' : 'All'}</SelectItem>
                      <SelectItem value="mobilhome">Mobil-home</SelectItem>
                      <SelectItem value="emplacement">{lang === 'fr' ? 'Emplacement' : 'Pitch'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-heading mb-2 block">
                    {lang === 'fr' ? 'Catégorie intervention' : 'Intervention category'}
                  </label>
                  <Select value={filterCategorieIntervention} onValueChange={setFilterCategorieIntervention}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{lang === 'fr' ? 'Toutes' : 'All'}</SelectItem>
                      <SelectItem value="technique">Technique</SelectItem>
                      <SelectItem value="menage">{lang === 'fr' ? 'Ménage' : 'Housekeeping'}</SelectItem>
                      <SelectItem value="electricite">{lang === 'fr' ? 'Électricité' : 'Electricity'}</SelectItem>
                      <SelectItem value="plomberie">{lang === 'fr' ? 'Plomberie' : 'Plumbing'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Home className="w-8 h-8 text-blue-600" />
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.tauxOccupation}%</p>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Taux occupation' : 'Occupancy rate'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.satisfactionMoyenne}/5</p>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Satisfaction' : 'Satisfaction'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.tempsReponseMoyen}</p>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Temps réponse (min)' : 'Response time (min)'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalInterventions}</p>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Interventions' : 'Interventions'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <Tabs defaultValue="interventions" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="interventions">{lang === 'fr' ? 'Interventions' : 'Interventions'}</TabsTrigger>
              <TabsTrigger value="satisfaction">{lang === 'fr' ? 'Satisfaction' : 'Satisfaction'}</TabsTrigger>
              <TabsTrigger value="tendances">{lang === 'fr' ? 'Tendances' : 'Trends'}</TabsTrigger>
              <TabsTrigger value="proprete">{lang === 'fr' ? 'Propreté' : 'Cleanliness'}</TabsTrigger>
            </TabsList>

            <TabsContent value="interventions">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{lang === 'fr' ? 'Répartition par type' : 'By type'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={interventionsParType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {interventionsParType.map((entry, index) => (
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
                    <CardTitle>{lang === 'fr' ? 'Top catégories' : 'Top categories'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={interventionsParCategorie}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#00AEEF" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{lang === 'fr' ? 'Temps réponse par type' : 'Response time by type'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={tempsReponseParType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="temps" fill="#FFA500" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="satisfaction">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{lang === 'fr' ? 'Distribution des notes' : 'Rating distribution'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={repartitionSatisfaction} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {repartitionSatisfaction.map((entry, index) => (
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
                    <CardTitle>{lang === 'fr' ? 'Statistiques satisfaction' : 'Satisfaction statistics'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                        <span className="font-heading">{lang === 'fr' ? 'Moyenne globale' : 'Overall average'}</span>
                        <span className="text-2xl font-bold text-green-600">{metrics.satisfactionMoyenne}/5</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                        <span className="font-heading">{lang === 'fr' ? 'Total avis' : 'Total reviews'}</span>
                        <span className="text-2xl font-bold text-blue-600">{filteredData.avis.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tendances">
              <Card>
                <CardHeader>
                  <CardTitle>{lang === 'fr' ? 'Évolution des arrivées' : 'Arrivals evolution'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={evolutionArrivees}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#00AEEF" strokeWidth={2} name={lang === 'fr' ? 'Arrivées' : 'Arrivals'} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="proprete">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{lang === 'fr' ? 'Arrivées' : 'Arrivals'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm">😊 {lang === 'fr' ? 'Très propre' : 'Very clean'}</span>
                        <span className="font-bold text-green-600">
                          {filteredData.fichesArrivee.filter(f => f.evaluation_proprete === 'tres_propre').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-sm">😐 {lang === 'fr' ? 'Correct' : 'OK'}</span>
                        <span className="font-bold text-yellow-600">
                          {filteredData.fichesArrivee.filter(f => f.evaluation_proprete === 'correct').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-sm">😞 {lang === 'fr' ? 'Pas satisfaisant' : 'Unsatisfactory'}</span>
                        <span className="font-bold text-red-600">{metrics.problemesPropreteArrivee}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{lang === 'fr' ? 'Départs' : 'Departures'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm">😊 {lang === 'fr' ? 'Très propre' : 'Very clean'}</span>
                        <span className="font-bold text-green-600">
                          {filteredData.fichesDepart.filter(f => f.evaluation_proprete === 'tres_propre').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-sm">😐 {lang === 'fr' ? 'Correct' : 'OK'}</span>
                        <span className="font-bold text-yellow-600">
                          {filteredData.fichesDepart.filter(f => f.evaluation_proprete === 'correct').length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-sm">😞 {lang === 'fr' ? 'Pas satisfaisant' : 'Unsatisfactory'}</span>
                        <span className="font-bold text-red-600">{metrics.problemesPropreteDepart}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{lang === 'fr' ? 'Taux conformité' : 'Compliance rate'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <p className="text-4xl font-bold text-green-600">
                          {filteredData.fichesArrivee.length > 0 
                            ? Math.round(((filteredData.fichesArrivee.length - metrics.problemesPropreteArrivee) / filteredData.fichesArrivee.length) * 100)
                            : 0}%
                        </p>
                        <p className="text-sm text-gray-600 mt-2">{lang === 'fr' ? 'Arrivées conformes' : 'Compliant arrivals'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}