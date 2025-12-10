import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import CollaborateurNotificationBell from '../components/CollaborateurNotificationBell';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../components/translations';
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
  Users, Home as HomeIcon, Search, Building2, Filter, Calendar, CalendarDays,
  ChevronDown, ChevronUp, Eye, AlertCircle, MoreVertical, LogOut,
  Trash2, ArrowUp, ArrowDown, CheckSquare, Square, Home, ListTodo, CheckCircle
} from 'lucide-react';
import SuiviInventaireStaff from '../components/staff/SuiviInventaireStaff';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import InterventionActions from '../components/bureau/InterventionActions';
import BureauStatistiques from '../components/bureau/BureauStatistiques';
import BureauStatistiquesClients from '../components/bureau/BureauStatistiquesClients';
import BureauRapports from '../components/bureau/BureauRapports';
import BureauFrequentation from '../components/bureau/BureauFrequentation';
import BureauDemographie from '../components/bureau/BureauDemographie';
import BureauFichesPDF from '../components/bureau/BureauFichesPDF';

import Statistiques from './Statistiques';
import { format, differenceInHours, differenceInMinutes, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { createPageUrl } from '../utils';
import { useQuery as useReactQuery } from '@tanstack/react-query';

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
  const { t, lang } = useTranslation();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeView, setActiveView] = useState('all'); // all, today, late
  const [selectedIds, setSelectedIds] = useState([]); // Sélection multiple
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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

  const queryClient = useQueryClient();

  // Récupérer l'utilisateur connecté
  const { data: user } = useReactQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['bureau-incidents'],
    queryFn: () => base44.entities.Incident.filter({}, '-date_saisie', 1000),
    refetchInterval: 30000
  });

  const { data: avis = [] } = useQuery({
    queryKey: ['bureau-avis'],
    queryFn: () => base44.entities.Avis.filter({}, '-created_date', 500)
  });

  const { data: taches = [] } = useQuery({
    queryKey: ['bureau-taches'],
    queryFn: () => base44.entities.Tache.filter({}, '-created_date', 200)
  });

  // Mutations pour actions de groupe
  const updateIncidentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: (id) => base44.entities.Incident.delete(id),
  });

  // Sélection
  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = sortedIncidents.slice(0, 100).map(i => i.id);
    if (selectedIds.length === visibleIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleIds);
    }
  };

  // Actions de groupe
  const handleGroupMove = async (direction) => {
    if (selectedIds.length === 0) return;
    
    const selectedIncidents = sortedIncidents.filter(i => selectedIds.includes(i.id));
    const nonSelectedIncidents = sortedIncidents.filter(i => !selectedIds.includes(i.id) && i.statut !== 'resolu');
    
    // Recalculer les ordres
    const updates = [];
    
    if (direction === 'up') {
      // Trouver le plus petit ordre parmi les sélectionnés
      const minOrder = Math.min(...selectedIncidents.map(i => i.priorite_ordre || sortedIncidents.indexOf(i) + 1));
      if (minOrder <= 1) return; // Déjà en haut
      
      // Déplacer chaque sélectionné vers le haut
      selectedIncidents.forEach((inc, idx) => {
        const currentOrder = inc.priorite_ordre || sortedIncidents.indexOf(inc) + 1;
        updates.push({ id: inc.id, data: { priorite_ordre: currentOrder - 1 } });
      });
      
      // Décaler les non-sélectionnés qui sont maintenant en conflit
      nonSelectedIncidents.forEach(inc => {
        const currentOrder = inc.priorite_ordre || sortedIncidents.indexOf(inc) + 1;
        const conflicting = selectedIncidents.some(sel => {
          const selNewOrder = (sel.priorite_ordre || sortedIncidents.indexOf(sel) + 1) - 1;
          return selNewOrder === currentOrder;
        });
        if (conflicting) {
          updates.push({ id: inc.id, data: { priorite_ordre: currentOrder + 1 } });
        }
      });
    } else {
      // Descendre
      const maxOrder = Math.max(...selectedIncidents.map(i => i.priorite_ordre || sortedIncidents.indexOf(i) + 1));
      const totalNonResolved = sortedIncidents.filter(i => i.statut !== 'resolu').length;
      if (maxOrder >= totalNonResolved) return; // Déjà en bas
      
      selectedIncidents.forEach((inc, idx) => {
        const currentOrder = inc.priorite_ordre || sortedIncidents.indexOf(inc) + 1;
        updates.push({ id: inc.id, data: { priorite_ordre: currentOrder + 1 } });
      });
      
      nonSelectedIncidents.forEach(inc => {
        const currentOrder = inc.priorite_ordre || sortedIncidents.indexOf(inc) + 1;
        const conflicting = selectedIncidents.some(sel => {
          const selNewOrder = (sel.priorite_ordre || sortedIncidents.indexOf(sel) + 1) + 1;
          return selNewOrder === currentOrder;
        });
        if (conflicting) {
          updates.push({ id: inc.id, data: { priorite_ordre: currentOrder - 1 } });
        }
      });
    }
    
    // Exécuter les updates
    await Promise.all(updates.map(u => updateIncidentMutation.mutateAsync(u)));
    queryClient.invalidateQueries({ queryKey: ['bureau-incidents'] });
  };

  const handleGroupDelete = async () => {
    if (selectedIds.length === 0) return;
    
    await Promise.all(selectedIds.map(id => deleteIncidentMutation.mutateAsync(id)));
    setSelectedIds([]);
    setShowDeleteConfirm(false);
    queryClient.invalidateQueries({ queryKey: ['bureau-incidents'] });
  };

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

  // Tri par priorité:
  // 1. priorite_ordre manuel (si défini par Bureau)
  // 2. Urgents en premier (triés par date chronologique ancienne → récente)
  // 3. Non-urgents par date chronologique (ancienne → récente)
  // 4. Résolus en dernier
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    // Les résolus toujours à la fin
    if (a.statut === 'resolu' && b.statut !== 'resolu') return 1;
    if (b.statut === 'resolu' && a.statut !== 'resolu') return -1;
    
    // Si priorite_ordre est défini, l'utiliser
    if (a.priorite_ordre !== undefined && b.priorite_ordre !== undefined) {
      if (a.priorite_ordre !== b.priorite_ordre) return a.priorite_ordre - b.priorite_ordre;
    }
    
    // Priorité bureau manuelle (1=prioritaire, 0=normal, -1=basse)
    const prioA = a.priorite_bureau || 0;
    const prioB = b.priorite_bureau || 0;
    if (prioB !== prioA) return prioB - prioA;
    
    // Urgents avant non-urgents
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    
    // Dans chaque groupe (urgents ou non-urgents), tri chronologique (ancien → récent)
    return new Date(a.date_saisie) - new Date(b.date_saisie);
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
    <div className="min-h-screen pb-8" role="main" aria-label="Accueil > Collaborateur > Bureau">
      <h1 className="sr-only">Accueil > Collaborateur > Bureau - Historique et statistiques</h1>
      {/* Header */}
      <div className="bg-[#FFA500] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('MenuCollaborateur')} className="p-2 hover:bg-white/20 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading text-xl">{t('bureau_title')} - {lang === 'fr' ? 'Gestion & Historique' : 'Management & History'}</h1>
              <p className="text-white/80 text-sm font-body">{incidents.length} {lang === 'fr' ? 'intervention(s) au total' : 'total intervention(s)'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              className="p-2 hover:bg-white/20 rounded-lg"
              title="Retour menu collaborateur"
            >
              <Home className="w-6 h-6" />
            </button>
            <CollaborateurNotificationBell />
            <Button
              onClick={handleBureauLogout}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-lg"
              title={lang === 'fr' ? 'Déconnexion Bureau' : 'Office Logout'}
            >
              <LogOut className="w-5 h-5" />
            </Button>
            <Building2 className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Bouton Gestion Utilisateurs (Admin uniquement) */}
        {user?.role === 'admin' && (
          <Card 
            className="border-2 border-purple-300 rounded-xl hover:shadow-lg transition-all cursor-pointer mb-6"
            onClick={() => navigate(createPageUrl('GestionUtilisateurs'))}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">👥</span>
              </div>
              <h3 className="font-heading text-xl text-purple-900 mb-2">
                {lang === 'fr' ? 'Gestion Utilisateurs' : 'User Management'}
              </h3>
              <p className="text-sm text-gray-600">
                {lang === 'fr' ? 'Rôles et permissions' : 'Roles and permissions'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Boutons d'accès rapide */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Button
            variant={activeView === 'today' ? 'default' : 'outline'}
            onClick={() => setActiveView(activeView === 'today' ? 'all' : 'today')}
            className={`h-auto py-3 rounded-xl ${activeView === 'today' ? 'bg-green-500 hover:bg-green-600' : 'border-green-500 text-green-600'}`}
          >
            <div className="text-center">
              <CalendarDays className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-heading block">{t('aujourd_hui')}</span>
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
              <span className="text-xs font-heading block">{t('en_retard')}</span>
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
              <span className="text-xs font-heading block">{lang === 'fr' ? 'Critiques (+3j)' : 'Critical (+3d)'}</span>
              <Badge className="bg-white/20 text-inherit mt-1">{critiqueCount}</Badge>
            </div>
          </Button>
        </div>

        <Tabs defaultValue="historique" className="space-y-6">
          <TabsList className="bg-[#FFA500]/20 p-1 rounded-xl border border-[#FFA500]/30 flex-wrap h-auto">
            <TabsTrigger value="historique" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              📋 {t('historique')}
            </TabsTrigger>
            <TabsTrigger value="taches" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              ✅ {lang === 'fr' ? 'Tâches' : 'Tasks'} ({taches.filter(t => t.statut !== 'terminee').length})
            </TabsTrigger>
            <TabsTrigger value="suivis" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              📦 {lang === 'fr' ? 'Suivis inventaires' : 'Inventory tracking'}
            </TabsTrigger>
            <TabsTrigger value="frequentation" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              🔹 {lang === 'fr' ? 'Fréquentation' : 'Attendance'}
            </TabsTrigger>
            <TabsTrigger value="interventions" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              🔹 {t('interventions')}
            </TabsTrigger>
            <TabsTrigger value="statistiques" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              📊 {t('statistiques')}
            </TabsTrigger>
            <TabsTrigger value="demographie" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              👨‍👩‍👧 {lang === 'fr' ? 'Démographie' : 'Demographics'}
            </TabsTrigger>
            <TabsTrigger value="fiches" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              📄 {lang === 'fr' ? 'Fiches PDF' : 'PDF Files'}
            </TabsTrigger>
            <TabsTrigger value="rapports" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              📦 {lang === 'fr' ? 'Rapports' : 'Reports'}
            </TabsTrigger>
            <TabsTrigger value="collaborateurs" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              👷 {lang === 'fr' ? 'Collaborateurs' : 'Staff'}
            </TabsTrigger>
          </TabsList>

          {/* Tâches d'inventaire */}
          <TabsContent value="taches" className="space-y-4">
            <Card className="border-2 border-[#00AEEF] rounded-xl">
              <CardHeader>
                <CardTitle className="font-heading text-[#0077A8]">
                  ✅ {lang === 'fr' ? 'Tâches d\'inventaire' : 'Inventory tasks'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {taches.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{lang === 'fr' ? 'Aucune tâche' : 'No tasks'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {taches.map(tache => (
                      <Card key={tache.id} className="border rounded-xl">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-heading text-[#0077A8]">{tache.titre}</h3>
                              {tache.description && (
                                <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{tache.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Badge className={
                                  tache.statut === 'terminee' ? 'bg-green-500 text-white' :
                                  tache.statut === 'en_cours' ? 'bg-blue-500 text-white' :
                                  'bg-orange-500 text-white'
                                }>
                                  {tache.statut === 'a_faire' ? (lang === 'fr' ? 'À faire' : 'To do') :
                                   tache.statut === 'en_cours' ? (lang === 'fr' ? 'En cours' : 'In progress') :
                                   tache.statut === 'terminee' ? (lang === 'fr' ? 'Terminée' : 'Completed') :
                                   tache.statut}
                                </Badge>
                                <Badge className={
                                  tache.categorie === 'technique' ? 'bg-purple-100 text-purple-700' :
                                  tache.categorie === 'menage' ? 'bg-pink-100 text-pink-700' :
                                  'bg-gray-100 text-gray-700'
                                }>
                                  {tache.categorie === 'technique' ? '🔧 Technique' :
                                   tache.categorie === 'menage' ? '🧹 Ménage' :
                                   tache.categorie}
                                </Badge>
                                {tache.priorite && (
                                  <Badge className={
                                    tache.priorite === 'urgente' ? 'bg-red-100 text-red-700' :
                                    tache.priorite === 'haute' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                  }>
                                    {tache.priorite === 'urgente' ? '🔴 Urgent' :
                                     tache.priorite === 'haute' ? '⬆️ Haute' :
                                     tache.priorite === 'normale' ? '➡️ Normale' :
                                     '⬇️ Basse'}
                                  </Badge>
                                )}
                                {tache.assignee && (
                                  <Badge variant="outline">{tache.assignee}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Button
              onClick={() => navigate(createPageUrl('Taches'))}
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading"
            >
              <ListTodo className="w-5 h-5 mr-2" />
              {lang === 'fr' ? 'Voir toutes les tâches' : 'View all tasks'}
            </Button>
          </TabsContent>

          {/* Suivis inventaires */}
          <TabsContent value="suivis" className="space-y-4">
            <Card className="border-2 border-purple-300 rounded-xl">
              <CardHeader>
                <CardTitle className="font-heading text-[#0077A8]">
                  📦 {lang === 'fr' ? 'Suivis d\'inventaires clients' : 'Client inventory tracking'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SuiviInventaireStaff serviceFilter="all" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historique */}
          <TabsContent value="historique" className="space-y-4">
            {/* Filtres */}
            <Card className="border-2 border-[#FFA500]/30 rounded-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-heading text-[#0077A8] flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {t('recherche_avancee')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-gray-500">
                      {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="text-[#00AEEF]"
                    >
                      {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {lang === 'fr' ? 'Avancé' : 'Advanced'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Ligne 1: Filtres basiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input
                    placeholder={lang === 'fr' ? 'Nom client' : 'Guest name'}
                    value={filters.nom}
                    onChange={(e) => setFilters({ ...filters, nom: e.target.value })}
                    className="border-[#FFA500]/30 rounded-xl font-body"
                  />
                  <Input
                    placeholder={lang === 'fr' ? 'N° logement/emplacement' : 'Accommodation number'}
                    value={filters.logement}
                    onChange={(e) => setFilters({ ...filters, logement: e.target.value })}
                    className="border-[#FFA500]/30 rounded-xl font-body"
                  />
                  <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                    <SelectTrigger className="border-[#FFA500]/30 rounded-xl font-body">
                      <SelectValue placeholder={lang === 'fr' ? 'Type' : 'Type'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">{lang === 'fr' ? 'Tous types' : 'All types'}</SelectItem>
                      <SelectItem value="technique">🛠 {t('technique')}</SelectItem>
                      <SelectItem value="menage">🧹 {t('menage')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.statut} onValueChange={(v) => setFilters({ ...filters, statut: v })}>
                    <SelectTrigger className="border-[#FFA500]/30 rounded-xl font-body">
                      <SelectValue placeholder={t('statut')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">{lang === 'fr' ? 'Tous statuts' : 'All statuses'}</SelectItem>
                      <SelectItem value="en_attente">🟠 {t('en_attente')}</SelectItem>
                      <SelectItem value="en_cours">🔵 {t('en_cours')}</SelectItem>
                      <SelectItem value="en_attente_materiel">⏳ {lang === 'fr' ? 'Reporté' : 'Postponed'}</SelectItem>
                      <SelectItem value="resolu">✅ {t('resolu')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtres avancés */}
                {showAdvancedFilters && (
                  <div className="space-y-4 pt-3 border-t border-gray-100">
                    {/* Filtre par catégories (multiselect) */}
                    <div>
                      <label className="text-xs font-heading text-[#0077A8] mb-2 block">{lang === 'fr' ? 'Catégories (sélection multiple)' : 'Categories (multiple selection)'}</label>
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
                          {lang === 'fr' ? 'Effacer les catégories' : 'Clear categories'}
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
                          {lang === 'fr' ? 'Effacer les dates' : 'Clear dates'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 font-body">
                  {sortedIncidents.length} {lang === 'fr' ? 'résultat(s) trouvé(s)' : 'result(s) found'}
                </p>
              </CardContent>
            </Card>

            {/* Barre d'actions de groupe */}
            {selectedIds.length > 0 && (
              <Card className="border-2 border-[#00AEEF] bg-[#e6f7ff] rounded-xl mb-4">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <span className="font-heading text-[#0077A8] text-sm">
                      {selectedIds.length} {lang === 'fr' ? 'intervention(s) sélectionnée(s)' : 'intervention(s) selected'}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGroupMove('up')}
                        className="border-[#00AEEF] text-[#0077A8] hover:bg-[#00AEEF] hover:text-white"
                        disabled={updateIncidentMutation.isPending}
                      >
                        <ArrowUp className="w-4 h-4 mr-1" />
                        {lang === 'fr' ? 'Monter groupe' : 'Move up'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGroupMove('down')}
                        className="border-[#00AEEF] text-[#0077A8] hover:bg-[#00AEEF] hover:text-white"
                        disabled={updateIncidentMutation.isPending}
                      >
                        <ArrowDown className="w-4 h-4 mr-1" />
                        {lang === 'fr' ? 'Descendre groupe' : 'Move down'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        disabled={deleteIncidentMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {t('supprimer')} {lang === 'fr' ? 'groupe' : 'group'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedIds([])}
                        className="text-gray-500"
                      >
                        {t('annuler')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                          <th className="p-3 w-10">
                            <button
                              onClick={toggleSelectAll}
                              className="p-1 hover:bg-[#FFA500]/20 rounded transition-colors"
                              title="Tout sélectionner"
                            >
                              {selectedIds.length === sortedIncidents.slice(0, 100).length && selectedIds.length > 0 ? (
                                <CheckSquare className="w-5 h-5 text-[#00AEEF]" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </th>
                          <th className="p-3">N°</th>
                          <th className="p-3">Date / Heure</th>
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
                        {sortedIncidents.slice(0, 100).map((incident, index) => {
                          const temps = incident.date_resolution && incident.date_saisie
                            ? differenceInMinutes(new Date(incident.date_resolution), new Date(incident.date_saisie))
                            : null;
                          const delayStatus = getDelayStatus(incident);
                          const tempsAttente = incident.date_saisie && incident.statut !== 'resolu'
                            ? differenceInMinutes(new Date(), new Date(incident.date_saisie))
                            : null;
                          
                          return (
                            <tr 
                              key={incident.id} 
                              className={`border-t hover:bg-[#FFA500]/5 cursor-pointer font-body ${
                                delayStatus === 'critique' ? 'bg-red-50' :
                                delayStatus === 'retard' ? 'bg-orange-50' :
                                delayStatus === 'lent' ? 'bg-yellow-50' : ''
                              } ${selectedIds.includes(incident.id) ? 'bg-[#e6f7ff]' : ''}`}
                              onClick={() => setSelectedIncident(incident)}
                            >
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => toggleSelect(incident.id, e)}
                                  className="p-1 hover:bg-[#00AEEF]/20 rounded transition-colors"
                                >
                                  {selectedIds.includes(incident.id) ? (
                                    <CheckSquare className="w-5 h-5 text-[#00AEEF]" />
                                  ) : (
                                    <Square className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                  incident.urgent ? 'bg-red-500 text-white' : 
                                  incident.statut === 'resolu' ? 'bg-green-100 text-green-700' :
                                  'bg-[#00AEEF]/20 text-[#0077A8]'
                                }`}>
                                  {incident.priorite_ordre || index + 1}
                                </span>
                              </td>
                              <td className="p-3 text-xs">
                                <div className="font-medium">{incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM/yy')}</div>
                                <div className="text-[#00AEEF] font-heading">{incident.date_saisie && format(new Date(incident.date_saisie), 'HH:mm')}</div>
                                {tempsAttente !== null && incident.statut !== 'resolu' && (
                                  <div className={`text-xs mt-1 ${tempsAttente > 180 ? 'text-red-500' : tempsAttente > 60 ? 'text-orange-500' : 'text-gray-400'}`}>
                                    ⏱ {formatDuration(tempsAttente)}
                                  </div>
                                )}
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

          {/* Fréquentation */}
          <TabsContent value="frequentation" className="space-y-6">
            <BureauFrequentation lang={lang} />
          </TabsContent>

          {/* Statistiques Interventions */}
          <TabsContent value="interventions" className="space-y-6">
            <BureauStatistiques incidents={incidents} />
          </TabsContent>

          {/* Statistiques Globales */}
          <TabsContent value="statistiques" className="space-y-6">
            <Statistiques embedded={true} />
          </TabsContent>

          {/* Démographie */}
          <TabsContent value="demographie" className="space-y-6">
            <BureauDemographie lang={lang} />
          </TabsContent>

          {/* Fiches PDF */}
          <TabsContent value="fiches" className="space-y-6">
            <BureauFichesPDF lang={lang} />
          </TabsContent>

          {/* Rapports */}
          <TabsContent value="rapports" className="space-y-6">
            <BureauRapports incidents={incidents} avis={avis} />
          </TabsContent>

          {/* Collaborateurs */}
          <TabsContent value="collaborateurs" className="space-y-6">
            {(() => {
              // Grouper les interventions par collaborateur
              const interventionsParCollab = {};
              
              incidents.forEach(inc => {
                if (inc.statut === 'resolu') return; // Ignorer les résolus
                
                const collab = inc.pris_par || 'Non assigné';
                if (!interventionsParCollab[collab]) {
                  interventionsParCollab[collab] = {
                    enAttente: [],
                    enCours: [],
                    reportees: []
                  };
                }
                
                if (inc.statut === 'en_attente') {
                  interventionsParCollab[collab].enAttente.push(inc);
                } else if (inc.statut === 'en_cours') {
                  interventionsParCollab[collab].enCours.push(inc);
                } else if (inc.statut === 'en_attente_materiel') {
                  interventionsParCollab[collab].reportees.push(inc);
                }
              });
              
              const collabsList = Object.entries(interventionsParCollab).sort((a, b) => {
                const totalA = a[1].enAttente.length + a[1].enCours.length + a[1].reportees.length;
                const totalB = b[1].enAttente.length + b[1].enCours.length + b[1].reportees.length;
                return totalB - totalA;
              });
              
              return (
                <div className="space-y-4">
                  <Card className="border-2 border-[#00AEEF] rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-heading text-[#0077A8]">
                        👷 {lang === 'fr' ? 'Interventions par collaborateur' : 'Interventions by staff member'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        {lang === 'fr' ? 'Vue d\'ensemble des interventions actives de chaque collaborateur' : 'Overview of active interventions for each staff member'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collabsList.map(([collab, data]) => {
                      const total = data.enAttente.length + data.enCours.length + data.reportees.length;
                      const hasUrgent = [...data.enAttente, ...data.enCours, ...data.reportees].some(i => i.urgent);
                      
                      return (
                        <Card key={collab} className={`border-2 rounded-xl ${hasUrgent ? 'border-red-500 animate-pulse' : 'border-[#00AEEF]/30'}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base font-heading text-[#0077A8]">
                                👤 {collab}
                              </CardTitle>
                              {total > 0 && (
                                <Badge className={hasUrgent ? 'bg-red-500 text-white' : 'bg-[#00AEEF] text-white'}>
                                  {total}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* En attente */}
                            {data.enAttente.length > 0 && (
                              <div className="bg-[#FFA500]/10 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-heading text-[#FFA500]">🟠 {t('en_attente')}</span>
                                  <Badge className="bg-[#FFA500] text-white text-xs">{data.enAttente.length}</Badge>
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {data.enAttente.map(inc => (
                                    <div key={inc.id} className="text-xs bg-white rounded p-2 flex items-start justify-between">
                                      <div className="flex-1">
                                        <span className="font-heading text-[#0077A8]">{inc.logement || inc.emplacement}</span>
                                        <span className="text-gray-500 ml-2">{categoryEmojis[inc.categorie]}</span>
                                        {inc.urgent && <span className="ml-1 text-red-500">🚨</span>}
                                      </div>
                                      <span className="text-gray-400 text-xs">
                                        {differenceInHours(new Date(), new Date(inc.date_saisie))}h
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* En cours */}
                            {data.enCours.length > 0 && (
                              <div className="bg-[#00AEEF]/10 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-heading text-[#00AEEF]">🔵 {t('en_cours')}</span>
                                  <Badge className="bg-[#00AEEF] text-white text-xs">{data.enCours.length}</Badge>
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {data.enCours.map(inc => (
                                    <div key={inc.id} className="text-xs bg-white rounded p-2 flex items-start justify-between">
                                      <div className="flex-1">
                                        <span className="font-heading text-[#0077A8]">{inc.logement || inc.emplacement}</span>
                                        <span className="text-gray-500 ml-2">{categoryEmojis[inc.categorie]}</span>
                                        {inc.urgent && <span className="ml-1 text-red-500">🚨</span>}
                                      </div>
                                      <span className="text-gray-400 text-xs">
                                        {inc.date_debut && differenceInMinutes(new Date(), new Date(inc.date_debut))}min
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Reportées */}
                            {data.reportees.length > 0 && (
                              <div className="bg-gray-100 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-heading text-gray-600">⏳ {lang === 'fr' ? 'Reportées' : 'Postponed'}</span>
                                  <Badge className="bg-gray-500 text-white text-xs">{data.reportees.length}</Badge>
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {data.reportees.map(inc => (
                                    <div key={inc.id} className="text-xs bg-white rounded p-2">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <span className="font-heading text-[#0077A8]">{inc.logement || inc.emplacement}</span>
                                          <span className="text-gray-500 ml-2">{categoryEmojis[inc.categorie]}</span>
                                        </div>
                                      </div>
                                      {inc.motif_attente && (
                                        <p className="text-gray-400 mt-1 truncate" title={inc.motif_attente}>
                                          {inc.motif_attente}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {total === 0 && (
                              <p className="text-center text-gray-400 text-sm py-4">
                                ✓ {lang === 'fr' ? 'Aucune intervention active' : 'No active intervention'}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {collabsList.length === 0 && (
                    <Card className="border-2 border-gray-200 rounded-xl">
                      <CardContent className="py-12 text-center">
                        <p className="text-gray-500">{lang === 'fr' ? 'Aucune intervention active pour le moment' : 'No active intervention at the moment'}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog confirmation suppression groupe */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {lang === 'fr' ? 'Confirmer la suppression' : 'Confirm deletion'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="font-body text-gray-700">
              ⚠️ {lang === 'fr' 
                ? `Voulez-vous vraiment supprimer les ${selectedIds.length} intervention(s) sélectionnée(s) ?`
                : `Do you really want to delete the ${selectedIds.length} selected intervention(s)?`}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {lang === 'fr' ? 'Cette action est irréversible.' : 'This action is irreversible.'}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-xl"
            >
              {t('non')}
            </Button>
            <Button
              onClick={handleGroupDelete}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
              disabled={deleteIncidentMutation.isPending}
            >
              {deleteIncidentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {lang === 'fr' ? 'Oui, supprimer' : 'Yes, delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog détail */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <span className="text-xl">{selectedIncident && categoryEmojis[selectedIncident.categorie]}</span>
              {lang === 'fr' ? 'Fiche intervention' : 'Intervention details'} #{selectedIncident?.logement || selectedIncident?.emplacement}
            </DialogTitle>
          </DialogHeader>
          {selectedIncident && (
            <div className="space-y-4">
              {/* Client */}
              <div className="bg-[#e6f7ff] rounded-xl p-4">
                <h4 className="font-heading text-[#0077A8] mb-2">👤 {t('client_label')}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm font-body">
                  <div><span className="text-gray-500">{t('nom')}:</span> {selectedIncident.client_prenom} {selectedIncident.client_nom}</div>
                  <div><span className="text-gray-500">{lang === 'fr' ? 'Séjour' : 'Stay'}:</span> {selectedIncident.date_arrivee && format(new Date(selectedIncident.date_arrivee), 'dd/MM/yyyy')} → {selectedIncident.date_depart && format(new Date(selectedIncident.date_depart), 'dd/MM/yyyy')}</div>
                </div>
              </div>

              {/* Hébergement */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-heading text-[#0077A8] mb-2">🏠 {t('hebergement')}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm font-body">
                  <div><span className="text-gray-500">{lang === 'fr' ? 'Type' : 'Type'}:</span> {selectedIncident.logement ? (lang === 'fr' ? 'Mobil-home' : 'Mobile home') : (lang === 'fr' ? 'Emplacement' : 'Pitch')}</div>
                  <div><span className="text-gray-500">{lang === 'fr' ? 'Numéro' : 'Number'}:</span> <strong>{selectedIncident.logement || selectedIncident.emplacement}</strong></div>
                </div>
              </div>

              {/* Chronologie */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-heading text-[#0077A8] mb-3">📋 {lang === 'fr' ? 'Chronologie détaillée' : 'Detailed timeline'}</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00AEEF] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-heading text-sm text-[#0077A8]">Demande créée</p>
                      <p className="text-xs text-gray-500">{selectedIncident.date_saisie && format(new Date(selectedIncident.date_saisie), 'dd/MM/yyyy à HH:mm')}</p>
                      {selectedIncident.urgent && <Badge className="bg-red-500 text-white text-xs mt-1">URGENT</Badge>}
                    </div>
                  </div>
                  
                  {selectedIncident.date_debut && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#FFA500] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-heading text-sm text-[#0077A8]">Prise en charge</p>
                        <p className="text-xs text-gray-500">{format(new Date(selectedIncident.date_debut), 'dd/MM/yyyy à HH:mm')}</p>
                        {selectedIncident.pris_par && <p className="text-xs text-gray-600">par {selectedIncident.pris_par}</p>}
                        {selectedIncident.temps_prise_en_charge && (
                          <p className="text-xs text-[#FFA500]">Temps d'attente: {formatDuration(selectedIncident.temps_prise_en_charge)}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedIncident.attente_date && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">⏳</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-heading text-sm text-gray-600">Mise en attente</p>
                        <p className="text-xs text-gray-500">{format(new Date(selectedIncident.attente_date), 'dd/MM/yyyy à HH:mm')}</p>
                        {selectedIncident.motif_attente && <p className="text-xs text-gray-600">Motif: {selectedIncident.motif_attente}</p>}
                      </div>
                    </div>
                  )}
                  
                  {selectedIncident.date_resolution && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-heading text-sm text-green-600">Résolu</p>
                        <p className="text-xs text-gray-500">{format(new Date(selectedIncident.date_resolution), 'dd/MM/yyyy à HH:mm')}</p>
                        {selectedIncident.temps_total_intervention && (
                          <p className="text-xs text-green-600">Temps d'intervention: {formatDuration(selectedIncident.temps_total_intervention)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Intervention */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-heading text-[#0077A8] mb-2">🛠 {lang === 'fr' ? 'Intervention' : 'Intervention'}</h4>
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

              {/* Preuves visuelles (photos avant/après) */}
              {(selectedIncident.photo_avant_url || selectedIncident.photo_apres_url || selectedIncident.photo_url) && (
                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <h4 className="font-heading text-[#0077A8] mb-3 flex items-center gap-2">
                    📷 Preuves visuelles
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Photo client */}
                    {selectedIncident.photo_url && (
                      <div className="space-y-2">
                        <p className="text-xs font-heading text-gray-600">📸 Photo client (signalement)</p>
                        <img 
                          src={selectedIncident.photo_url} 
                          alt="Photo signalement" 
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                        />
                      </div>
                    )}
                    
                    {/* Photo AVANT */}
                    {selectedIncident.photo_avant_url && (
                      <div className="space-y-2">
                        <p className="text-xs font-heading text-orange-600">📷 Photo AVANT intervention</p>
                        <img 
                          src={selectedIncident.photo_avant_url} 
                          alt="Photo avant" 
                          className="w-full h-32 object-cover rounded-lg border-2 border-orange-300"
                        />
                        {selectedIncident.photo_avant_timestamp && (
                          <p className="text-xs text-gray-500">
                            {format(new Date(selectedIncident.photo_avant_timestamp), 'dd/MM/yyyy HH:mm:ss')}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Photo APRÈS */}
                    {selectedIncident.photo_apres_url && (
                      <div className="space-y-2">
                        <p className="text-xs font-heading text-green-600">📷 Photo APRÈS intervention</p>
                        <img 
                          src={selectedIncident.photo_apres_url} 
                          alt="Photo après" 
                          className="w-full h-32 object-cover rounded-lg border-2 border-green-300"
                        />
                        {selectedIncident.photo_apres_timestamp && (
                          <p className="text-xs text-gray-500">
                            {format(new Date(selectedIncident.photo_apres_timestamp), 'dd/MM/yyyy HH:mm:ss')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Garanties juridiques */}
                  {(selectedIncident.photo_avant_hash || selectedIncident.photo_apres_hash) && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-xs font-heading text-[#0077A8] mb-2">🔐 Garanties juridiques</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>✓ Filigrane intégré (date, ID, collaborateur)</li>
                        <li>✓ Hash SHA-256 enregistré</li>
                        {selectedIncident.photo_avant_hash && (
                          <li className="font-mono text-xs text-gray-400 truncate">
                            Avant: {selectedIncident.photo_avant_hash.substring(0, 24)}...
                          </li>
                        )}
                        {selectedIncident.photo_apres_hash && (
                          <li className="font-mono text-xs text-gray-400 truncate">
                            Après: {selectedIncident.photo_apres_hash.substring(0, 24)}...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Avis client */}
              {selectedIncident.note_client && (
                <div className="bg-[#FFD700]/20 rounded-xl p-4">
                  <h4 className="font-heading text-[#0077A8] mb-2">⭐ {lang === 'fr' ? 'Avis client' : 'Guest review'}</h4>
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