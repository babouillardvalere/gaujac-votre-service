import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, Clock, Star, AlertTriangle, TrendingUp, Loader2, 
  Users, Home, Search, Building2, Filter, Calendar, CalendarDays,
  ChevronDown, ChevronUp, Eye, AlertCircle, MoreVertical, LogOut
} from 'lucide-react';
import InterventionActions from '../components/bureau/InterventionActions';
import BureauStatistiques from '../components/bureau/BureauStatistiques';
import BureauAvis from '../components/bureau/BureauAvis';
import { format, differenceInHours, differenceInMinutes, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { createPageUrl } from '../utils';

const COLORS = ['#00AEEF', '#FFD700', '#FFA500', '#10b981', '#8b5cf6', '#ec4899'];

const categoryLabels = {
  gaz: '🔥 Gaz', eau: '💧 Eau/Fuite', electricite: '⚡ Électricité', plomberie: '🔧 Plomberie',
  chauffe_eau: '🚿 Chauffe-eau', serrure: '🔐 Serrure', climatiseur: '❄️ Climatiseur', chauffage: '🔥 Chauffage',
  espace_vert: '🌿 Espace vert', divers_technique: '🛠 Divers', mobilier: '🧰 Mobilier', structurel: '🏚 Structurel',
  immobilier: '🏠 Immobilier', materiel: '📦 Matériel',
  souris: '🐭 Souris', guepes: '🐝 Guêpes', frelons: '🐝 Frelons', fourmis: '🐜 Fourmis', moustiques: '🦟 Moustiques',
  nuisibles: '🐀 Nuisibles',
  literie: '🛏 Literie', nettoyage: '🧽 Nettoyage', vaisselle: '🍽 Vaisselle', menage: '🧹 Ménage',
  poubelle: '🗑 Poubelle', produit_manquant: '🧴 Produit manquant',
  autre: '❓ Autre'
};

const categoryEmojis = {
  gaz: '🔥', eau: '💧', electricite: '⚡', plomberie: '🔧',
  chauffe_eau: '🚿', serrure: '🔐', climatiseur: '❄️', chauffage: '🔥',
  espace_vert: '🌿', divers_technique: '🛠', mobilier: '🧰', structurel: '🏚',
  immobilier: '🏠', materiel: '📦', nuisibles: '🐀',
  souris: '🐭', guepes: '🐝', frelons: '🐝', fourmis: '🐜', moustiques: '🦟',
  literie: '🛏', nettoyage: '🧽', vaisselle: '🍽', menage: '🧹',
  poubelle: '🗑', produit_manquant: '🧴', autre: '❓'
};

export default function Bureau() {
  const navigate = useNavigate();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeView, setActiveView] = useState('all'); // all, today, late
  
  const [filters, setFilters] = useState({
    nom: '',
    logement: '',
    type: 'tous',
    categories: [], // multiselect
    hebergementType: 'tous',
    statut: 'tous',
    urgent: 'tous',
    dateFrom: '',
    dateTo: '',
    heure: 'tous'
  });

  const allCategories = [
    { value: 'gaz', label: '🔥 Gaz' },
    { value: 'eau', label: '💧 Eau' },
    { value: 'electricite', label: '⚡ Électricité' },
    { value: 'chauffe_eau', label: '🚿 Chauffe-eau' },
    { value: 'serrure', label: '🔐 Serrure' },
    { value: 'climatiseur', label: '❄️ Climatiseur' },
    { value: 'chauffage', label: '🔥 Chauffage' },
    { value: 'menage', label: '🧹 Ménage' },
    { value: 'nuisibles', label: '🐀 Nuisibles' },
    { value: 'materiel', label: '📦 Matériel' },
    { value: 'immobilier', label: '🏠 Immobilier' },
    { value: 'autre', label: '❓ Autre' }
  ];

  const toggleCategory = (cat) => {
    setFilters(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat]
    }));
  };

  useEffect(() => {
    const collabAuth = sessionStorage.getItem('collaborateur_authenticated');
    const bureauAuth = sessionStorage.getItem('bureau_authenticated');
    
    if (collabAuth !== 'true') {
      navigate(createPageUrl('Collaborateur'));
      return;
    }
    
    if (bureauAuth !== 'true') {
      navigate(createPageUrl('MenuCollaborateur'));
      return;
    }
  }, [navigate]);

  const handleBureauLogout = () => {
    sessionStorage.removeItem('bureau_authenticated');
    sessionStorage.removeItem('bureau_auth_time');
    navigate(createPageUrl('MenuCollaborateur'));
  };

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['bureau-incidents'],
    queryFn: () => base44.entities.Incident.filter({}, '-date_saisie', 1000),
    refetchInterval: 30000
  });

  // Calcul des délais
  const getDelayStatus = (incident) => {
    if (incident.statut === 'resolu') return null;
    const hours = differenceInHours(new Date(), new Date(incident.date_saisie));
    if (hours >= 72) return 'critique';
    if (hours >= 24) return 'retard';
    if (hours >= 3) return 'lent';
    return null;
  };

  // Filtrage avancé
  const filteredIncidents = incidents.filter(i => {
    // Vue spéciale
    if (activeView === 'today') {
      if (!isToday(new Date(i.date_saisie))) return false;
      if (i.statut === 'resolu') return false;
    }
    if (activeView === 'late') {
      if (i.statut === 'resolu') return false;
      const hours = differenceInHours(new Date(), new Date(i.date_saisie));
      if (hours < 3) return false;
    }

    // Filtres standards
    if (filters.nom && !`${i.client_nom} ${i.client_prenom}`.toLowerCase().includes(filters.nom.toLowerCase())) return false;
    if (filters.logement && !(i.logement || i.emplacement || '').toLowerCase().includes(filters.logement.toLowerCase())) return false;
    if (filters.type !== 'tous' && i.type !== filters.type) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(i.categorie)) return false;
    if (filters.statut !== 'tous' && i.statut !== filters.statut) return false;
    if (filters.urgent !== 'tous') {
      if (filters.urgent === 'oui' && !i.urgent) return false;
      if (filters.urgent === 'non' && i.urgent) return false;
    }
    if (filters.hebergementType !== 'tous') {
      if (filters.hebergementType === 'emplacement' && !i.emplacement) return false;
      if (filters.hebergementType === 'mobilhome' && !i.logement) return false;
    }
    if (filters.dateFrom && new Date(i.date_saisie) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(i.date_saisie) > new Date(filters.dateTo + 'T23:59:59')) return false;
    if (filters.heure !== 'tous' && i.date_saisie) {
      const hour = new Date(i.date_saisie).getHours();
      if (filters.heure === 'matin' && (hour < 6 || hour >= 12)) return false;
      if (filters.heure === 'apres-midi' && (hour < 12 || hour >= 18)) return false;
      if (filters.heure === 'soir' && (hour < 18 || hour >= 22)) return false;
    }
    return true;
  });

  // Tri par priorité: priorite_bureau > urgents non pris > urgents en cours > normaux
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    // Priorité bureau d'abord
    const prioA = a.priorite_bureau || 0;
    const prioB = b.priorite_bureau || 0;
    if (prioB !== prioA) return prioB - prioA;
    
    // Ensuite par urgence et statut
    const getScore = (i) => {
      if (i.statut === 'resolu') return 0;
      if (i.statut === 'en_attente_materiel') return 1;
      if (i.statut === 'en_cours' && !i.urgent) return 2;
      if (i.statut === 'en_attente' && !i.urgent) return 3;
      if (i.statut === 'en_cours' && i.urgent) return 4;
      if (i.statut === 'en_attente' && i.urgent) return 5;
      return 0;
    };
    
    const scoreA = getScore(a);
    const scoreB = getScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    
    return new Date(b.date_saisie) - new Date(a.date_saisie);
  });

  // Stats
  const resolus = incidents.filter(i => i.statut === 'resolu' && i.date_resolution && i.date_saisie);
  const tempsResolution = resolus.map(i => differenceInHours(new Date(i.date_resolution), new Date(i.date_saisie)));
  const tempsMoyen = tempsResolution.length > 0 ? (tempsResolution.reduce((a, b) => a + b, 0) / tempsResolution.length).toFixed(1) : 0;

  const moins3h = tempsResolution.filter(t => t < 3).length;
  const moins24h = tempsResolution.filter(t => t >= 3 && t < 24).length;
  const plus3j = tempsResolution.filter(t => t >= 72).length;

  const avgNote = incidents.filter(i => i.note_client).length > 0
    ? (incidents.filter(i => i.note_client).reduce((s, i) => s + i.note_client, 0) / incidents.filter(i => i.note_client).length).toFixed(1)
    : 0;

  // Compteurs vues spéciales
  const todayCount = incidents.filter(i => isToday(new Date(i.date_saisie)) && i.statut !== 'resolu').length;
  const lateCount = incidents.filter(i => i.statut !== 'resolu' && differenceInHours(new Date(), new Date(i.date_saisie)) >= 3).length;
  const critiqueCount = incidents.filter(i => i.statut !== 'resolu' && differenceInHours(new Date(), new Date(i.date_saisie)) >= 72).length;

  // Par catégorie
  const parCategorie = Object.entries(
    incidents.reduce((acc, i) => {
      acc[i.categorie] = (acc[i.categorie] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: categoryLabels[name]?.replace(/^.+\s/, '') || name, value }))
    .sort((a, b) => b.value - a.value);

  // Par logement
  const parLogement = Object.entries(
    incidents.reduce((acc, i) => {
      const loc = i.logement || i.emplacement || 'Inconnu';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Par collaborateur
  const parCollab = Object.entries(
    resolus.reduce((acc, i) => {
      if (i.pris_par) acc[i.pris_par] = (acc[i.pris_par] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const resetFilters = () => {
    setFilters({
      nom: '', logement: '', type: 'tous', categories: [],
      hebergementType: 'tous', statut: 'tous', urgent: 'tous',
      dateFrom: '', dateTo: '', heure: 'tous'
    });
    setActiveView('all');
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  };

  return (
    <div className="min-h-screen pb-8" role="main" aria-label="Bureau - Gestion et historique des interventions">
      <h1 className="sr-only">Bureau - Historique et statistiques des interventions</h1>
      {/* Header */}
      <div className="bg-[#FFA500] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('MenuCollaborateur')} className="p-2 hover:bg-white/20 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-xl">Bureau - Gestion & Historique</h1>
              <p className="text-white/80 text-sm font-body">{incidents.length} intervention(s) au total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              onClick={handleBureauLogout}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-lg"
              title="Déconnexion Bureau"
            >
              <LogOut className="w-5 h-5" />
            </Button>
            <Building2 className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Boutons d'accès rapide */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Button
            variant={activeView === 'today' ? 'default' : 'outline'}
            onClick={() => setActiveView(activeView === 'today' ? 'all' : 'today')}
            className={`h-auto py-3 rounded-xl ${activeView === 'today' ? 'bg-green-500 hover:bg-green-600' : 'border-green-500 text-green-600'}`}
          >
            <div className="text-center">
              <CalendarDays className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-heading block">Aujourd'hui</span>
              <Badge className="bg-white/20 text-inherit mt-1">{todayCount}</Badge>
            </div>
          </Button>
          
          <Button
            variant={activeView === 'late' ? 'default' : 'outline'}
            onClick={() => setActiveView(activeView === 'late' ? 'all' : 'late')}
            className={`h-auto py-3 rounded-xl ${activeView === 'late' ? 'bg-[#FFA500] hover:bg-[#e69500]' : 'border-[#FFA500] text-[#FFA500]'}`}
          >
            <div className="text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-heading block">En retard</span>
              <Badge className="bg-white/20 text-inherit mt-1">{lateCount}</Badge>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className={`h-auto py-3 rounded-xl border-red-500 ${critiqueCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'text-red-500'}`}
            onClick={() => { setActiveView('late'); setFilters(f => ({ ...f })); }}
          >
            <div className="text-center">
              <AlertCircle className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-heading block">Critiques (+3j)</span>
              <Badge className="bg-white/20 text-inherit mt-1">{critiqueCount}</Badge>
            </div>
          </Button>
        </div>

        <Tabs defaultValue="historique" className="space-y-6">
          <TabsList className="bg-[#FFA500]/20 p-1 rounded-xl border border-[#FFA500]/30">
            <TabsTrigger value="historique" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              Historique
            </TabsTrigger>
            <TabsTrigger value="statistiques" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="avis" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              ⭐ Avis
            </TabsTrigger>
          </TabsList>

          {/* Historique */}
          <TabsContent value="historique" className="space-y-4">
            {/* Filtres */}
            <Card className="border-2 border-[#FFA500]/30 rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Recherche & Filtres
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-gray-500">
                      Réinitialiser
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="text-[#00AEEF]"
                    >
                      {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Avancé
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Ligne 1: Filtres basiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Nom client"
                    value={filters.nom}
                    onChange={(e) => setFilters({ ...filters, nom: e.target.value })}
                    className="border-[#FFA500]/30 rounded-xl font-body"
                  />
                  <Input
                    placeholder="N° logement/emplacement"
                    value={filters.logement}
                    onChange={(e) => setFilters({ ...filters, logement: e.target.value })}
                    className="border-[#FFA500]/30 rounded-xl font-body"
                  />
                  <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                    <SelectTrigger className="border-[#FFA500]/30 rounded-xl font-body">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous types</SelectItem>
                      <SelectItem value="technique">🛠 Technique</SelectItem>
                      <SelectItem value="menage">🧹 Ménage</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.statut} onValueChange={(v) => setFilters({ ...filters, statut: v })}>
                    <SelectTrigger className="border-[#FFA500]/30 rounded-xl font-body">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous statuts</SelectItem>
                      <SelectItem value="en_attente">🟠 En attente</SelectItem>
                      <SelectItem value="en_cours">🔵 En cours</SelectItem>
                      <SelectItem value="en_attente_materiel">⏳ En attente (reporté)</SelectItem>
                      <SelectItem value="resolu">✅ Résolu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtres avancés */}
                {showAdvancedFilters && (
                  <div className="space-y-4 pt-3 border-t border-gray-100">
                    {/* Filtre par catégories (multiselect) */}
                    <div>
                      <label className="text-xs font-heading text-[#0077A8] mb-2 block">Catégories (sélection multiple)</label>
                      <div className="flex flex-wrap gap-2">
                        {allCategories.map(cat => (
                          <button
                            key={cat.value}
                            onClick={() => toggleCategory(cat.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-body transition-all ${
                              filters.categories.includes(cat.value)
                                ? 'bg-[#FFA500] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                      {filters.categories.length > 0 && (
                        <button
                          onClick={() => setFilters(f => ({ ...f, categories: [] }))}
                          className="text-xs text-red-500 mt-1 hover:underline"
                        >
                          Effacer les catégories
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Select value={filters.hebergementType} onValueChange={(v) => setFilters({ ...filters, hebergementType: v })}>
                        <SelectTrigger className="border-[#FFA500]/30 rounded-xl font-body">
                          <SelectValue placeholder="Type hébergement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tous">Tous hébergements</SelectItem>
                          <SelectItem value="emplacement">⛺ Emplacement</SelectItem>
                          <SelectItem value="mobilhome">🏠 Mobil-home</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filters.urgent} onValueChange={(v) => setFilters({ ...filters, urgent: v })}>
                        <SelectTrigger className="border-[#FFA500]/30 rounded-xl font-body">
                          <SelectValue placeholder="Urgence" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tous">Tous</SelectItem>
                          <SelectItem value="oui">🚨 Urgents uniquement</SelectItem>
                          <SelectItem value="non">Non urgents</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filters.heure} onValueChange={(v) => setFilters({ ...filters, heure: v })}>
                        <SelectTrigger className="border-[#FFA500]/30 rounded-xl font-body">
                          <SelectValue placeholder="Période journée" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tous">Toute la journée</SelectItem>
                          <SelectItem value="matin">🌅 Matin (6h-12h)</SelectItem>
                          <SelectItem value="apres-midi">☀️ Après-midi (12h-18h)</SelectItem>
                          <SelectItem value="soir">🌙 Soir (18h-22h)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtre par intervalle de dates */}
                    <div className="bg-[#FFA500]/10 rounded-xl p-3">
                      <label className="text-xs font-heading text-[#0077A8] mb-2 block">📅 Intervalle de dates</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-body text-gray-500">Du</label>
                          <Input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className="border-[#FFA500]/30 rounded-xl font-body bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-body text-gray-500">Au</label>
                          <Input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            className="border-[#FFA500]/30 rounded-xl font-body bg-white"
                          />
                        </div>
                      </div>
                      {(filters.dateFrom || filters.dateTo) && (
                        <button
                          onClick={() => setFilters(f => ({ ...f, dateFrom: '', dateTo: '' }))}
                          className="text-xs text-red-500 mt-2 hover:underline"
                        >
                          Effacer les dates
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 font-body">
                  {sortedIncidents.length} résultat(s) trouvé(s)
                </p>
              </CardContent>
            </Card>

            {/* Tableau */}
            <Card className="border-2 border-[#FFA500]/30 rounded-xl overflow-hidden">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FFA500]" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#FFA500]/10">
                        <tr className="text-left text-xs font-heading text-[#0077A8]">
                          <th className="p-3">Date</th>
                          <th className="p-3">Client</th>
                          <th className="p-3">Hébergement</th>
                          <th className="p-3">Catégorie</th>
                          <th className="p-3">Urgence</th>
                          <th className="p-3">Statut</th>
                          <th className="p-3">Temps</th>
                          <th className="p-3">Avis</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedIncidents.slice(0, 100).map(incident => {
                          const temps = incident.date_resolution && incident.date_saisie
                            ? differenceInMinutes(new Date(incident.date_resolution), new Date(incident.date_saisie))
                            : null;
                          const delayStatus = getDelayStatus(incident);
                          
                          return (
                            <tr 
                              key={incident.id} 
                              className={`border-t hover:bg-[#FFA500]/5 cursor-pointer font-body ${
                                delayStatus === 'critique' ? 'bg-red-50' :
                                delayStatus === 'retard' ? 'bg-orange-50' :
                                delayStatus === 'lent' ? 'bg-yellow-50' : ''
                              }`}
                              onClick={() => setSelectedIncident(incident)}
                            >
                              <td className="p-3 text-xs">
                                <div>{incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM/yy')}</div>
                                <div className="text-gray-400">{incident.date_saisie && format(new Date(incident.date_saisie), 'HH:mm')}</div>
                              </td>
                              <td className="p-3 text-sm">
                                <div>{incident.client_prenom} {incident.client_nom}</div>
                                <div className="text-xs text-gray-400">
                                  {incident.date_arrivee && format(new Date(incident.date_arrivee), 'dd/MM')} → {incident.date_depart && format(new Date(incident.date_depart), 'dd/MM')}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="font-heading text-[#0077A8]">
                                  {incident.logement ? '🏠' : '⛺'} {incident.logement || incident.emplacement}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-lg">{categoryEmojis[incident.categorie]}</span>
                                  <Badge className={incident.type === 'technique' ? 'bg-[#00AEEF] text-white text-xs' : 'bg-[#FFD700] text-[#0077A8] text-xs'}>
                                    {incident.categorie}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-3">
                                {incident.urgent && (
                                  <Badge className="bg-red-500 text-white text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    URGENT
                                  </Badge>
                                )}
                                {delayStatus === 'critique' && (
                                  <Badge className="bg-red-600 text-white text-xs mt-1">🚨 +3j</Badge>
                                )}
                                {delayStatus === 'retard' && (
                                  <Badge className="bg-orange-500 text-white text-xs mt-1">⚠️ +24h</Badge>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <Badge className={
                                    incident.statut === 'resolu' ? 'bg-green-500 text-white' :
                                    incident.statut === 'en_cours' ? 'bg-[#00AEEF] text-white' :
                                    incident.statut === 'en_attente_materiel' ? 'bg-gray-500 text-white' :
                                    'bg-[#FFA500] text-white'
                                  }>
                                    {incident.statut === 'en_attente_materiel' ? '⏳ Reporté' : incident.statut}
                                  </Badge>
                                  {incident.statut === 'en_attente_materiel' && incident.motif_attente && (
                                    <p className="text-xs text-gray-500 max-w-[120px] truncate" title={incident.motif_attente}>
                                      {incident.motif_attente}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-sm">
                                <div className="space-y-1">
                                  {temps !== null && <div>Total: {formatDuration(temps)}</div>}
                                  {incident.temps_prise_en_charge && (
                                    <div className="text-xs text-gray-400">
                                      Attente: {formatDuration(incident.temps_prise_en_charge)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                {incident.note_client && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-[#FFD700] fill-[#FFD700]" />
                                    <span className="text-sm">{incident.note_client}</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <InterventionActions incident={incident} onRefresh={() => {}} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistiques */}
          <TabsContent value="statistiques" className="space-y-6">
            <BureauStatistiques incidents={incidents} />
          </TabsContent>

          {/* Avis */}
          <TabsContent value="avis" className="space-y-6">
            <BureauAvis />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog détail */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <span className="text-xl">{selectedIncident && categoryEmojis[selectedIncident.categorie]}</span>
              Fiche intervention #{selectedIncident?.logement || selectedIncident?.emplacement}
            </DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              {/* Client */}
              <div className="bg-[#e6f7ff] rounded-xl p-4">
                <h4 className="font-heading text-[#0077A8] mb-2">👤 Client</h4>
                <div className="grid grid-cols-2 gap-2 text-sm font-body">
                  <div><span className="text-gray-500">Nom:</span> {selectedIncident.client_prenom} {selectedIncident.client_nom}</div>
                  <div><span className="text-gray-500">Séjour:</span> {selectedIncident.date_arrivee && format(new Date(selectedIncident.date_arrivee), 'dd/MM/yyyy')} → {selectedIncident.date_depart && format(new Date(selectedIncident.date_depart), 'dd/MM/yyyy')}</div>
                </div>
              </div>

              {/* Hébergement */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-heading text-[#0077A8] mb-2">🏠 Hébergement</h4>
                <div className="grid grid-cols-2 gap-2 text-sm font-body">
                  <div><span className="text-gray-500">Type:</span> {selectedIncident.logement ? 'Mobil-home' : 'Emplacement'}</div>
                  <div><span className="text-gray-500">Numéro:</span> <strong>{selectedIncident.logement || selectedIncident.emplacement}</strong></div>
                </div>
              </div>

              {/* Intervention */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-heading text-[#0077A8] mb-2">🛠 Intervention</h4>
                <div className="space-y-2 text-sm font-body">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Catégorie:</span>
                    <Badge className={selectedIncident.type === 'technique' ? 'bg-[#00AEEF]' : 'bg-[#FFD700] text-[#0077A8]'}>
                      {categoryLabels[selectedIncident.categorie]}
                    </Badge>
                    {selectedIncident.urgent && <Badge className="bg-red-500 text-white">URGENT</Badge>}
                  </div>
                  {selectedIncident.sous_categorie && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-500">Icônes:</span>
                      {selectedIncident.sous_categorie.split(', ').map(cat => (
                        <span key={cat} className="text-xl" title={cat}>{categoryEmojis[cat]}</span>
                      ))}
                    </div>
                  )}
                  <div><span className="text-gray-500">Description:</span></div>
                  <p className="bg-white p-3 rounded-lg border">{selectedIncident.description}</p>
                </div>
              </div>

              {/* Timing */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-heading text-[#0077A8] mb-2">⏱ Timing</h4>
                <div className="grid grid-cols-2 gap-2 text-sm font-body">
                  <div><span className="text-gray-500">Signalé:</span> {selectedIncident.date_saisie && format(new Date(selectedIncident.date_saisie), 'dd/MM/yyyy HH:mm')}</div>
                  <div><span className="text-gray-500">Pris en charge:</span> {selectedIncident.date_debut ? format(new Date(selectedIncident.date_debut), 'HH:mm') : '-'}</div>
                  <div><span className="text-gray-500">Résolu:</span> {selectedIncident.date_resolution ? format(new Date(selectedIncident.date_resolution), 'dd/MM/yyyy HH:mm') : '-'}</div>
                  <div>
                    <span className="text-gray-500">Durée:</span>{' '}
                    {selectedIncident.date_resolution && selectedIncident.date_saisie 
                      ? formatDuration(differenceInMinutes(new Date(selectedIncident.date_resolution), new Date(selectedIncident.date_saisie)))
                      : '-'}
                  </div>
                </div>
              </div>

              {/* Motif d'attente */}
              {selectedIncident.statut === 'en_attente_materiel' && selectedIncident.motif_attente && (
                <div className="bg-[#FFA500]/10 rounded-xl p-4 border border-[#FFA500]/30">
                  <h4 className="font-heading text-[#FFA500] mb-2">⏳ Intervention en attente</h4>
                  <p className="font-body text-gray-700"><strong>Motif :</strong> {selectedIncident.motif_attente}</p>
                  {selectedIncident.attente_materiel_detail && (
                    <p className="font-body text-gray-600 text-sm mt-1">Matériel nécessaire : {selectedIncident.attente_materiel_detail}</p>
                  )}
                  {selectedIncident.attente_delai && (
                    <p className="font-body text-gray-500 text-xs mt-1">Délai estimé : {selectedIncident.attente_delai}</p>
                  )}
                  {selectedIncident.attente_date && (
                    <p className="font-body text-gray-400 text-xs mt-1">Mis en attente le : {format(new Date(selectedIncident.attente_date), 'dd/MM/yyyy HH:mm')}</p>
                  )}
                </div>
              )}

              {/* Collaborateur */}
              {selectedIncident.pris_par && (
                <div className="bg-[#00AEEF]/10 rounded-xl p-4">
                  <h4 className="font-heading text-[#0077A8] mb-2">👷 Intervenant</h4>
                  <p className="font-heading text-[#0077A8]">{selectedIncident.pris_par}</p>
                  {selectedIncident.commentaire_interne && (
                    <p className="text-sm font-body text-gray-600 mt-2">Note: {selectedIncident.commentaire_interne}</p>
                  )}
                </div>
              )}

              {/* Avis client */}
              {selectedIncident.note_client && (
                <div className="bg-[#FFD700]/20 rounded-xl p-4">
                  <h4 className="font-heading text-[#0077A8] mb-2">⭐ Avis client</h4>
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-5 h-5 ${s <= selectedIncident.note_client ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
                    ))}
                    <span className="ml-2 font-heading text-[#0077A8]">{selectedIncident.note_client}/5</span>
                  </div>
                  {selectedIncident.commentaire_client && (
                    <p className="font-body text-gray-700 bg-white p-3 rounded-lg">"{selectedIncident.commentaire_client}"</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}