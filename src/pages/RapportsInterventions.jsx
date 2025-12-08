import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../components/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Filter, Calendar, Users, Wrench, Sparkles, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function RapportsInterventions() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  // États des filtres
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [collaborateur, setCollaborateur] = useState('tous');
  const [statut, setStatut] = useState('tous');
  const [categorie, setCategorie] = useState('tous');
  const [typeIntervention, setTypeIntervention] = useState('tous');

  // Récupérer toutes les interventions
  const { data: interventions = [], isLoading } = useQuery({
    queryKey: ['interventions-rapport'],
    queryFn: async () => {
      const incidents = await base44.entities.Incident.list('-date_saisie', 1000);
      return incidents;
    },
    refetchInterval: 30000
  });

  // Filtrer les interventions
  const interventionsFiltrees = useMemo(() => {
    return interventions.filter(intervention => {
      // Filtre par date
      if (dateDebut) {
        const dateIntervention = new Date(intervention.date_saisie);
        const dateDebutFilter = new Date(dateDebut);
        if (dateIntervention < dateDebutFilter) return false;
      }
      if (dateFin) {
        const dateIntervention = new Date(intervention.date_saisie);
        const dateFinFilter = new Date(dateFin);
        dateFinFilter.setHours(23, 59, 59);
        if (dateIntervention > dateFinFilter) return false;
      }

      // Filtre par collaborateur
      if (collaborateur !== 'tous' && intervention.pris_par !== collaborateur) {
        return false;
      }

      // Filtre par statut
      if (statut !== 'tous' && intervention.statut !== statut) {
        return false;
      }

      // Filtre par catégorie
      if (categorie !== 'tous' && intervention.categorie !== categorie) {
        return false;
      }

      // Filtre par type
      if (typeIntervention !== 'tous' && intervention.type !== typeIntervention) {
        return false;
      }

      return true;
    });
  }, [interventions, dateDebut, dateFin, collaborateur, statut, categorie, typeIntervention]);

  // Calculer les statistiques
  const statistiques = useMemo(() => {
    const total = interventionsFiltrees.length;
    const resolues = interventionsFiltrees.filter(i => i.statut === 'resolu').length;
    const enCours = interventionsFiltrees.filter(i => i.statut === 'en_cours').length;
    const enAttente = interventionsFiltrees.filter(i => i.statut === 'en_attente' || i.statut === 'en_attente_materiel').length;
    
    // Temps moyen de traitement
    const interventionsAvecTemps = interventionsFiltrees.filter(i => i.temps_total_intervention);
    const tempsTotal = interventionsAvecTemps.reduce((sum, i) => sum + (i.temps_total_intervention || 0), 0);
    const tempsMoyen = interventionsAvecTemps.length > 0 ? Math.round(tempsTotal / interventionsAvecTemps.length) : 0;

    // Par type
    const techniques = interventionsFiltrees.filter(i => i.type === 'technique').length;
    const menage = interventionsFiltrees.filter(i => i.type === 'menage').length;

    // Interventions urgentes
    const urgentes = interventionsFiltrees.filter(i => i.urgent).length;

    return {
      total,
      resolues,
      enCours,
      enAttente,
      tempsMoyen,
      techniques,
      menage,
      urgentes,
      tauxResolution: total > 0 ? Math.round((resolues / total) * 100) : 0
    };
  }, [interventionsFiltrees]);

  // Liste unique des collaborateurs
  const collaborateurs = useMemo(() => {
    const names = interventions
      .map(i => i.pris_par)
      .filter(n => n && n !== '');
    return [...new Set(names)].sort();
  }, [interventions]);

  // Liste unique des catégories
  const categories = useMemo(() => {
    const cats = interventions
      .map(i => i.categorie)
      .filter(c => c && c !== '');
    return [...new Set(cats)].sort();
  }, [interventions]);

  // Export CSV
  const exporterCSV = () => {
    const headers = [
      'Date',
      'Type',
      'Catégorie',
      'Client',
      'Logement',
      'Statut',
      'Collaborateur',
      'Urgent',
      'Temps (min)',
      'Description'
    ];

    const rows = interventionsFiltrees.map(intervention => [
      new Date(intervention.date_saisie).toLocaleString(lang),
      intervention.type,
      intervention.categorie,
      `${intervention.client_prenom} ${intervention.client_nom}`,
      intervention.logement || intervention.emplacement,
      intervention.statut,
      intervention.pris_par || 'Non assigné',
      intervention.urgent ? 'Oui' : 'Non',
      intervention.temps_total_intervention || '',
      `"${(intervention.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport_interventions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Réinitialiser les filtres
  const reinitialiserFiltres = () => {
    setDateDebut('');
    setDateFin('');
    setCollaborateur('tous');
    setStatut('tous');
    setCategorie('tous');
    setTypeIntervention('tous');
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('retour')}
            </Button>
            <div>
              <h1 className="font-heading text-3xl text-[#0077A8]">
                📊 {lang === 'fr' ? 'Rapports Interventions' : 'Interventions Reports'}
              </h1>
              <p className="text-gray-600 text-sm">
                {lang === 'fr' ? 'Analyse et export des données' : 'Analysis and data export'}
              </p>
            </div>
          </div>
          <Button
            onClick={exporterCSV}
            disabled={interventionsFiltrees.length === 0}
            className="gap-2 bg-[#22c55e] hover:bg-[#16a34a]"
          >
            <Download className="w-4 h-4" />
            {lang === 'fr' ? 'Exporter CSV' : 'Export CSV'}
          </Button>
        </div>

        {/* Filtres */}
        <Card className="border-2 border-[#00AEEF]/30 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0077A8]">
              <Filter className="w-5 h-5" />
              {lang === 'fr' ? 'Filtres' : 'Filters'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ligne 1 - Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-gray-700 mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {lang === 'fr' ? 'Date début' : 'Start date'}
                </label>
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-heading text-gray-700 mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {lang === 'fr' ? 'Date fin' : 'End date'}
                </label>
                <Input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </div>
            </div>

            {/* Ligne 2 - Type et Statut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-gray-700 mb-2 block">
                  {lang === 'fr' ? 'Type d\'intervention' : 'Intervention type'}
                </label>
                <Select value={typeIntervention} onValueChange={setTypeIntervention}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">{lang === 'fr' ? 'Tous les types' : 'All types'}</SelectItem>
                    <SelectItem value="technique">
                      <Wrench className="w-4 h-4 inline mr-2" />
                      {lang === 'fr' ? 'Technique' : 'Technical'}
                    </SelectItem>
                    <SelectItem value="menage">
                      <Sparkles className="w-4 h-4 inline mr-2" />
                      {lang === 'fr' ? 'Ménage' : 'Housekeeping'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-heading text-gray-700 mb-2 block">
                  {lang === 'fr' ? 'Statut' : 'Status'}
                </label>
                <Select value={statut} onValueChange={setStatut}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">{t('tous_statuts') || (lang === 'fr' ? 'Tous les statuts' : 'All statuses')}</SelectItem>
                    <SelectItem value="en_attente">{t('en_attente')}</SelectItem>
                    <SelectItem value="en_cours">{t('en_cours')}</SelectItem>
                    <SelectItem value="en_attente_materiel">{t('en_attente_materiel')}</SelectItem>
                    <SelectItem value="resolu">{t('resolu')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ligne 3 - Collaborateur et Catégorie */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-heading text-gray-700 mb-2 block">
                  <Users className="w-4 h-4 inline mr-1" />
                  {lang === 'fr' ? 'Collaborateur' : 'Staff member'}
                </label>
                <Select value={collaborateur} onValueChange={setCollaborateur}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">{lang === 'fr' ? 'Tous les collaborateurs' : 'All staff'}</SelectItem>
                    {collaborateurs.map(collab => (
                      <SelectItem key={collab} value={collab}>
                        {collab}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-heading text-gray-700 mb-2 block">
                  {lang === 'fr' ? 'Catégorie' : 'Category'}
                </label>
                <Select value={categorie} onValueChange={setCategorie}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">{t('toutes_categories') || (lang === 'fr' ? 'Toutes les catégories' : 'All categories')}</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bouton réinitialiser */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={reinitialiserFiltres}
                className="gap-2"
              >
                {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Total' : 'Total'}</p>
                  <p className="text-3xl font-bold text-blue-600">{statistiques.total}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Résolues' : 'Resolved'}</p>
                  <p className="text-3xl font-bold text-green-600">{statistiques.resolues}</p>
                  <p className="text-xs text-gray-500">{statistiques.tauxResolution}%</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  ✓
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'En cours' : 'In progress'}</p>
                  <p className="text-3xl font-bold text-orange-600">{statistiques.enCours}</p>
                </div>
                <Clock className="w-10 h-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{lang === 'fr' ? 'Temps moyen' : 'Avg. time'}</p>
                  <p className="text-3xl font-bold text-purple-600">{statistiques.tempsMoyen}</p>
                  <p className="text-xs text-gray-500">{lang === 'fr' ? 'minutes' : 'minutes'}</p>
                </div>
                <Clock className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <Wrench className="w-4 h-4 inline mr-1" />
                    {lang === 'fr' ? 'Techniques' : 'Technical'}
                  </p>
                  <p className="text-2xl font-bold text-[#00AEEF]">{statistiques.techniques}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    {lang === 'fr' ? 'Ménage' : 'Housekeeping'}
                  </p>
                  <p className="text-2xl font-bold text-[#22c55e]">{statistiques.menage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    🔴 {lang === 'fr' ? 'Urgentes' : 'Urgent'}
                  </p>
                  <p className="text-2xl font-bold text-red-600">{statistiques.urgentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des interventions */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-[#0077A8]">
              {lang === 'fr' ? 'Détails des interventions' : 'Interventions details'} ({interventionsFiltrees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-gray-500">{t('chargement')}</p>
            ) : interventionsFiltrees.length === 0 ? (
              <p className="text-center py-8 text-gray-500">
                {lang === 'fr' ? 'Aucune intervention trouvée avec ces filtres' : 'No intervention found with these filters'}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {interventionsFiltrees.map(intervention => (
                  <div
                    key={intervention.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={intervention.type === 'technique' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                          {intervention.type === 'technique' ? <Wrench className="w-3 h-3 mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                          {intervention.categorie}
                        </Badge>
                        {intervention.urgent && (
                          <Badge className="bg-red-100 text-red-700">
                            🔴 {lang === 'fr' ? 'Urgent' : 'Urgent'}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {intervention.logement || intervention.emplacement}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">
                        {intervention.client_prenom} {intervention.client_nom}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(intervention.date_saisie).toLocaleDateString(lang)}
                        {intervention.pris_par && ` • ${intervention.pris_par}`}
                        {intervention.temps_total_intervention && ` • ${intervention.temps_total_intervention} min`}
                      </p>
                    </div>
                    <Badge className={
                      intervention.statut === 'resolu' ? 'bg-green-100 text-green-700' :
                      intervention.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                      intervention.statut === 'en_attente_materiel' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }>
                      {t(intervention.statut)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}