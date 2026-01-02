
import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2, ArrowUp, ArrowDown, CheckSquare, Square, Home, ListTodo, CheckCircle, User, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import SuiviInventaireStaff from '../components/staff/SuiviInventaireStaff';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import InterventionActions from '../components/bureau/InterventionActions';
import BureauStatistiques from '../components/bureau/BureauStatistiques';
import BureauStatistiquesClients from '../components/bureau/BureauStatistiquesClients';
import BureauRapports from '../components/bureau/BureauRapports';
import BureauFrequentation from '../components/bureau/BureauFrequentation';
import BureauDemographie from '../components/bureau/BureauDemographie';
import BureauFichesPDF from '../components/bureau/BureauFichesPDF';
import WorkItemManager from '../components/bureau/WorkItemManager';

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
  const [activeTab, setActiveTab] = useState('interventions');

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

  const { data: historique = [], isLoading: loadingHistorique, error: incidentsError } = useQuery({
    queryKey: ['bureau-historique'],
    queryFn: () => base44.entities.HistoriqueEvent.filter({}, '-created_date', 250),
    refetchInterval: 60000,
    staleTime: 45000,
    retry: 2,
    retryDelay: 1000
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['bureau-incidents'],
    queryFn: () => base44.entities.Incident.filter({}, '-date_saisie', 250),
    refetchInterval: 60000,
    staleTime: 45000
  });

  const { data: interventionsClients = [], isLoading: loadingInterventions } = useQuery({
    queryKey: ['bureau-interventions-clients'],
    queryFn: async () => {
      const data = await base44.entities.InterventionClient.filter({}, '-created_date', 250);
      console.log('[BUREAU] InterventionClient récupérées:', data.length);
      console.log('[BUREAU] Détail par statut:', {
        A_FAIRE: data.filter(i => i.statut === 'A_FAIRE').length,
        EN_COURS: data.filter(i => i.statut === 'EN_COURS').length,
        EN_ATTENTE: data.filter(i => i.statut === 'EN_ATTENTE').length,
        TERMINEE: data.filter(i => i.statut === 'TERMINEE').length
      });
      return data;
    },
    refetchInterval: 30000,
    staleTime: 20000
  });

  const isLoading = loadingHistorique || loadingInterventions;

  const { data: avis = [] } = useQuery({
    queryKey: ['bureau-avis'],
    queryFn: () => base44.entities.Avis.filter({}, '-created_date', 250),
    staleTime: 120000
  });

  const { data: taches = [] } = useQuery({
    queryKey: ['bureau-taches'],
    queryFn: () => base44.entities.Tache.filter({}, '-created_date', 250),
    staleTime: 60000
  });

  const { data: missionsDirection = [] } = useQuery({
    queryKey: ['bureau-interventions-direction'],
    queryFn: () => base44.entities.InterventionDirection.filter({}, '-created_date', 250),
    refetchInterval: 120000,
    staleTime: 60000
  });

  // Mutations pour actions de groupe
  const updateIncidentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HistoriqueEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bureau-historique'] });
    }
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: (id) => base44.entities.HistoriqueEvent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bureau-historique'] });
      toast.success(lang === 'fr' ? 'Événement supprimé' : 'Event deleted');
    }
  });

  const deleteInterventionDirectionMutation = useMutation({
    mutationFn: (id) => base44.entities.InterventionDirection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bureau-interventions-direction'] });
      toast.success(lang === 'fr' ? 'Intervention supprimée' : 'Intervention deleted');
    }
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
      selectedIncidents.forEach((inc) => {
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

      selectedIncidents.forEach((inc) => {
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
  // const getDelayStatus = (incident) => { // This function is not used. Removing to avoid linting warning.
  //   if (incident.statut === 'resolu') return null;
  //   const hours = differenceInHours(new Date(), new Date(incident.date_saisie));
  //   if (hours >= 72) return 'critique';
  //   if (hours >= 24) return 'retard';
  //   if (hours >= 3) return 'lent';
  //   return null;
  // };

  // Filtrage Interventions Clients
  const filteredInterventionsClients = useMemo(() => {
    const filtered = interventionsClients.filter(i => {
      // Filtres standards
      if (filters.nom && !`${i.client_nom || ''} ${i.client_prenom || ''}`.toLowerCase().includes(filters.nom.toLowerCase())) return false;
      if (filters.logement && !(i.numero_hebergement || '').toLowerCase().includes(filters.logement.toLowerCase())) return false;
      if (filters.type !== 'tous' && i.service?.toUpperCase() !== filters.type.toUpperCase()) return false;
      if (filters.statut !== 'tous' && i.statut !== filters.statut) return false;
      if (filters.urgent !== 'tous') {
        const isUrgent = i.priorite === 'URGENTE';
        if (filters.urgent === 'oui' && !isUrgent) return false;
        if (filters.urgent === 'non' && isUrgent) return false;
      }
      if (filters.dateFrom && new Date(i.created_date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(i.created_date) > new Date(filters.dateTo + 'T23:59:59')) return false;

      // Vue spéciale
      if (activeView === 'today' && !isToday(new Date(i.created_date))) return false;

      return true;
    });

    console.log('[BUREAU] Interventions après filtres:', filtered.length, 'filtres actifs:', filters);
    return filtered;
  }, [interventionsClients, activeView, filters]);

  // Filtrage avancé - OPTIMISÉ avec useMemo
  const filteredIncidents = useMemo(() => historique.filter(i => {
    // Vue spéciale
    if (activeView === 'today') {
      if (!isToday(new Date(i.created_date))) return false;
    }
    // `late` view specifically for 'incidents' (active incidents), not 'historique'
    // if (activeView === 'late') { /* ... */ }

    // Filters standards
    if (filters.nom && !`${i.client_nom || ''} ${i.client_prenom || ''}`.toLowerCase().includes(filters.nom.toLowerCase())) return false;
    if (filters.logement && !(i.hebergement || '').toLowerCase().includes(filters.logement.toLowerCase())) return false;
    if (filters.type !== 'tous' && i.service?.toLowerCase() !== filters.type) return false;
    // 'statut' filter is for active incidents, not for general HistoriqueEvent
    // if (filters.statut !== 'tous') return false; // Not applicable for HistoriqueEvent as it doesn't have a 'statut' in the same way
    if (filters.urgent !== 'tous') {
      if (filters.urgent === 'oui' && !i.urgent) return false;
      if (filters.urgent === 'non' && i.urgent) return false;
    }
    if (filters.dateFrom && new Date(i.created_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(i.created_date) > new Date(filters.dateTo + 'T23:59:59')) return false;
    if (filters.heure !== 'tous' && i.created_date) {
      const hour = new Date(i.created_date).getHours();
      if (filters.heure === 'matin' && (hour < 6 || hour >= 12)) return false;
      if (filters.heure === 'apres-midi' && (hour < 12 || hour >= 18)) return false;
      if (filters.heure === 'soir' && (hour < 18 || hour >= 22)) return false;
    }
    return true;
  }), [historique, activeView, filters]);

  // Tri par priorité - OPTIMISÉ avec useMemo
  const sortedIncidents = useMemo(() => [...filteredIncidents].sort((a, b) => {
    // Urgents avant non-urgents
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;

    // Tri chronologique (récent → ancien)
    return new Date(b.created_date) - new Date(a.created_date);
  }), [filteredIncidents]);

  // Stats (These stats seem to be based on 'incidents' which are distinct from 'historique' in this file)
  const resolus = incidents.filter(i => i.statut === 'resolu' && i.date_resolution && i.date_saisie);
  const tempsResolution = resolus.map(i => differenceInHours(new Date(i.date_resolution), new Date(i.date_saisie)));
  // const tempsMoyen = tempsResolution.length > 0 ? (tempsResolution.reduce((a, b) => a + b, 0) / tempsResolution.length).toFixed(1) : 0; // Not used

  // const moins3h = tempsResolution.filter(t => t < 3).length; // Not used
  // const moins24h = tempsResolution.filter(t => t >= 3 && t < 24).length; // Not used
  // const plus3j = tempsResolution.filter(t => t >= 72).length; // Not used

  // const avgNote = incidents.filter(i => i.note_client).length > 0 // Not used
  //   ? (incidents.filter(i => i.note_client).reduce((s, i) => s + i.note_client, 0) / incidents.filter(i => i.note_client).length).toFixed(1)
  //   : 0;

  // Compteurs vues spéciales
  const todayCount = historique.filter(i => isToday(new Date(i.created_date))).length;
  const lateCount = incidents.filter(i => i.statut !== 'resolu' && differenceInHours(new Date(), new Date(i.date_saisie)) >= 3).length;
  const critiqueCount = incidents.filter(i => i.statut !== 'resolu' && differenceInHours(new Date(), new Date(i.date_saisie)) >= 72).length;

  // Par catégorie (uses 'incidents')
  // const parCategorie = Object.entries( // Not used
  //   incidents.reduce((acc, i) => {
  //     acc[i.categorie] = (acc[i.categorie] || 0) + 1;
  //     return acc;
  //   }, {})
  // ).map(([name, value]) => ({ name: categoryLabels[name]?.replace(/^.+\s/, '') || name, value }))
  //   .sort((a, b) => b.value - a.value);

  // Par logement (uses 'incidents')
  // const parLogement = Object.entries( // Not used
  //   incidents.reduce((acc, i) => {
  //     const loc = i.logement || i.emplacement || 'Inconnu';
  //     acc[loc] = (acc[loc] || 0) + 1;
  //     return acc;
  //   }, {})
  // ).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Par collaborateur (uses 'incidents')
  // const parCollab = Object.entries( // Not used
  //   resolus.reduce((acc, i) => {
  //     if (i.pris_par) acc[i.pris_par] = (acc[i.pris_par] || 0) + 1;
  //     return acc;
  //   }, {})
  // ).sort((a, b) => b[1] - a[1]);

  // Group interventions by collaborator for the new tab
  const { collabsList } = useMemo(() => {
    const interventionsParCollab = {};

    incidents.forEach(inc => {
      if (inc.statut === 'resolu') return; // Ignore resolved ones

      const collab = inc.pris_par || (lang === 'fr' ? 'Non assigné' : 'Unassigned');
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

    return { interventionsParCollab, collabsList };
  }, [incidents, lang]);


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
              <p className="text-white/80 text-sm font-body">{historique.length} {lang === 'fr' ? 'événement(s) au total' : 'total event(s)'}</p>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#FFA500]/20 p-1 rounded-xl border border-[#FFA500]/30 flex-wrap h-auto">
            <TabsTrigger value="interventions" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              🎯 {lang === 'fr' ? 'Interventions' : 'Interventions'} ({interventionsClients.filter(i => i.statut !== 'TERMINEE').length})
            </TabsTrigger>
            <TabsTrigger value="historique" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              📋 {t('historique')} ({historique.length})
            </TabsTrigger>
            <TabsTrigger value="taches" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              ✅ {lang === 'fr' ? 'Tâches' : 'Tasks'} ({taches.filter(t => t.statut !== 'terminee').length})
            </TabsTrigger>
            <TabsTrigger value="missions-direction" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              🔧 Direction ({missionsDirection.filter(m => m.statut !== 'TERMINEE').length})
            </TabsTrigger>
            <TabsTrigger value="suivis" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              📦 Suivis
            </TabsTrigger>
            <TabsTrigger value="collaborateurs" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              👥 Collabs ({collabsList.length})
            </TabsTrigger>
            <TabsTrigger value="statistiques" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              📊 Stats
            </TabsTrigger>
            <TabsTrigger value="fiches" className="rounded-lg font-heading data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              📄 PDF
            </TabsTrigger>
          </TabsList>

          {/* Interventions Direction */}
          <TabsContent value="missions-direction" className="space-y-4">
            <Card className="border-2 border-purple-300 rounded-xl">
              <CardHeader>
                <CardTitle className="font-heading text-purple-700">
                  🔧 {lang === 'fr' ? 'Interventions Direction' : 'Direction Interventions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {missionsDirection.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{lang === 'fr' ? 'Aucune intervention Direction' : 'No direction interventions'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {missionsDirection.map(intervention => {
                      const tachesCompletees = intervention.taches?.filter(t => t.faite).length || 0;
                      const tachesTotal = intervention.taches?.length || 0;
                      const progress = tachesTotal > 0 ? Math.round((tachesCompletees / tachesTotal) * 100) : 0;

                      return (
                        <Card key={intervention.id} className="border rounded-xl">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge className={
                                    intervention.type_intervention === 'HIVERNAGE' ? 'bg-blue-500' : 'bg-yellow-500'
                                  }>
                                    {intervention.type_intervention === 'HIVERNAGE' ? '❄️ Hivernage' : '🌞 Déshivernage'}
                                  </Badge>
                                  <Badge className={
                                    intervention.service === 'TECHNIQUE' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                  }>
                                    {intervention.service === 'TECHNIQUE' ? '🧰 Technique' : '🧽 Ménage'}
                                  </Badge>
                                  {intervention.priorite === 'URGENTE' && (
                                    <Badge className="bg-red-500 text-white">⚠️ Urgent</Badge>
                                  )}
                                  <Badge className={
                                    intervention.statut === 'TERMINEE' ? 'bg-green-500 text-white' :
                                      intervention.statut === 'EN_COURS' ? 'bg-blue-500 text-white' :
                                        intervention.statut === 'EN_ATTENTE' ? 'bg-orange-500 text-white' :
                                          'bg-gray-500 text-white'
                                  }>
                                    {intervention.statut === 'A_FAIRE' ? (lang === 'fr' ? 'À faire' : 'To do') :
                                      intervention.statut === 'EN_COURS' ? (lang === 'fr' ? 'En cours' : 'In progress') :
                                        intervention.statut === 'EN_ATTENTE' ? (lang === 'fr' ? 'En attente' : 'On hold') :
                                          (lang === 'fr' ? 'Terminée' : 'Completed')}
                                  </Badge>
                                </div>

                                <h3 className="font-heading text-lg text-purple-700">
                                  {intervention.type_hebergement} - {intervention.numero_hebergement}
                                </h3>

                                {intervention.description && (
                                  <p className="text-sm text-gray-600 mt-2">{intervention.description}</p>
                                )}

                                <div className="mt-3 space-y-1">
                                  <p className="text-xs text-gray-600">
                                    📋 {tachesTotal} tâche(s) - {tachesCompletees} terminée(s)
                                  </p>
                                  {intervention.pris_en_charge_par && (
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {intervention.pris_en_charge_par}
                                      </span>
                                      {intervention.temps_ecoule_minutes > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {intervention.temps_ecoule_minutes} min
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Barre de progression */}
                                {tachesTotal > 0 && (
                                  <div className="mt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-purple-600 h-2 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  if (confirm(lang === 'fr'
                                    ? `Supprimer l'intervention "${intervention.type_hebergement} - ${intervention.numero_hebergement}" ?`
                                    : `Delete intervention "${intervention.type_hebergement} - ${intervention.numero_hebergement}"?`)) {
                                    await deleteInterventionDirectionMutation.mutateAsync(intervention.id);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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

          {/* Interventions Clients */}
          <TabsContent value="interventions" className="space-y-4">
            <Card className="border-2 border-[#00AEEF] rounded-xl mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-[#0077A8]">
                    🎯 {lang === 'fr' ? 'Interventions Clients (Services)' : 'Client Interventions (Services)'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {interventionsClients.length} {lang === 'fr' ? 'intervention(s) totale(s)' : 'total intervention(s)'} •
                    {filteredInterventionsClients.length} {lang === 'fr' ? 'après filtres' : 'after filters'}
                  </p>
                </div>
                <WorkItemManager lang={lang} />
              </CardHeader>
              <CardContent>
                {loadingInterventions ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00AEEF]" />
                  </div>
                ) : filteredInterventionsClients.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-semibold mb-2">
                      {lang === 'fr' ? 'Aucune intervention trouvée' : 'No interventions found'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {interventionsClients.length === 0
                        ? (lang === 'fr' ? 'Aucune intervention dans la base' : 'No interventions in database')
                        : (lang === 'fr' ? 'Essayez de modifier les filtres' : 'Try changing filters')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#00AEEF]/10 font-heading">
                        <tr>
                          <th className="p-3 text-left">N°</th>
                          <th className="p-3 text-left">Date</th>
                          <th className="p-3 text-left">Client</th>
                          <th className="p-3 text-left">Hébergement</th>
                          <th className="p-3 text-left">Service</th>
                          <th className="p-3 text-left">Type</th>
                          <th className="p-3 text-left">Statut</th>
                          <th className="p-3 text-left">Priorité</th>
                          <th className="p-3 text-left">Tâches</th>
                          <th className="p-3 text-left">Agent</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInterventionsClients.map((inter, idx) => (
                          <tr
                            key={inter.id}
                            className={`border-t hover:bg-[#FFA500]/5 cursor-pointer ${
                              inter.priorite === 'URGENTE' ? 'bg-red-50' : ''
                            }`}
                            onClick={() => setSelectedIncident(inter)}
                          >
                            <td className="p-3">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                inter.priorite === 'URGENTE' ? 'bg-red-500 text-white' : 'bg-[#00AEEF]/20 text-[#0077A8]'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="p-3 text-xs">
                              <div className="font-medium">{format(new Date(inter.created_date), 'dd/MM/yy')}</div>
                              <div className="text-[#00AEEF]">{format(new Date(inter.created_date), 'HH:mm')}</div>
                            </td>
                            <td className="p-3 text-sm">
                              <div>{inter.client_prenom} {inter.client_nom}</div>
                              <div className="text-xs text-gray-400">
                                {inter.date_arrivee && format(new Date(inter.date_arrivee), 'dd/MM')} →
                                {inter.date_depart && format(new Date(inter.date_depart), 'dd/MM')}
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-heading text-[#0077A8]">
                                🏠 {inter.numero_hebergement}
                              </span>
                            </td>
                            <td className="p-3">
                              <Badge className={
                                inter.service === 'TECHNIQUE' ? 'bg-blue-500 text-white' :
                                  inter.service === 'MENAGE' ? 'bg-yellow-500 text-white' :
                                    'bg-green-500 text-white'
                              }>
                                {inter.service}
                              </Badge>
                            </td>
                            <td className="p-3 text-xs">
                              {inter.type_intervention}
                            </td>
                            <td className="p-3">
                              <Badge className={
                                inter.statut === 'TERMINEE' ? 'bg-green-500 text-white' :
                                  inter.statut === 'EN_COURS' ? 'bg-[#00AEEF] text-white' :
                                    inter.statut === 'EN_ATTENTE' ? 'bg-gray-500 text-white' :
                                      'bg-[#FFA500] text-white'
                              }>
                                {inter.statut}
                              </Badge>
                            </td>
                            <td className="p-3">
                              {inter.priorite === 'URGENTE' && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  URGENT
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              {inter.taches?.length > 0 && (
                                <span className="text-xs text-gray-600">
                                  📋 {inter.taches.filter(t => t.faite).length}/{inter.taches.length}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-xs text-gray-600">
                              {inter.pris_en_charge_par || '-'}
                            </td>
                            <td className="p-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIncident(inter);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Historique */}
          <TabsContent value="historique" className="space-y-4">
            <Card className="border-2 border-[#00AEEF] rounded-xl mb-6">
              <CardHeader>
                <CardTitle className="font-heading text-[#0077A8]">
                  🎯 {lang === 'fr' ? 'Pilotage des demandes actives' : 'Active requests management'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WorkItemManager lang={lang} />
              </CardContent>
            </Card>
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
                      <SelectItem value="tous">{lang === 'fr' ? 'Tous services' : 'All services'}</SelectItem>
                      <SelectItem value="TECHNIQUE">🛠 Technique</SelectItem>
                      <SelectItem value="MENAGE">🧹 Ménage</SelectItem>
                      <SelectItem value="RECEPTION">🏠 Réception</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.statut} onValueChange={(v) => setFilters({ ...filters, statut: v })}>
                    <SelectTrigger className="border-[#FFA500]/30 rounded-xl font-body">
                      <SelectValue placeholder={t('statut')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">{lang === 'fr' ? 'Tous statuts' : 'All statuses'}</SelectItem>
                      <SelectItem value="A_FAIRE">🟠 {lang === 'fr' ? 'À faire' : 'To do'}</SelectItem>
                      <SelectItem value="EN_COURS">🔵 {t('en_cours')}</SelectItem>
                      <SelectItem value="EN_ATTENTE">⏸ {t('en_attente')}</SelectItem>
                      <SelectItem value="TERMINEE">✅ {lang === 'fr' ? 'Terminée' : 'Completed'}</SelectItem>
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
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FFA500] mb-3" />
                    <p className="text-sm text-gray-500">
                      {lang === 'fr' ? 'Chargement des interventions...' : 'Loading interventions...'}
                    </p>
                  </div>
                ) : incidentsError ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                    <p className="text-sm text-gray-600 mb-4">
                      {lang === 'fr' ? 'Erreur de chargement' : 'Loading error'}
                    </p>
                    <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['bureau-incidents'] })}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {lang === 'fr' ? 'Réessayer' : 'Retry'}
                    </Button>
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
                          <th className="p-3">Type</th>
                          <th className="p-3">Urgence</th>
                          <th className="p-3">Événement</th>
                          <th className="p-3">Détails</th>
                          <th className="p-3"></th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedIncidents.slice(0, 100).map((event, index) => {
                          const eventIcon = {
                            'CONTROLE_INVENTAIRE_VALIDE': '📋',
                            'INTERVENTION_CLIENT_CREEE': '🆕',
                            'MISSION_DIRECTION_CREEE': '🔧',
                            'MISSION_DIRECTION_PRISE_EN_CHARGE': '▶️',
                            'MISSION_DIRECTION_VALIDEE': '✅',
                            'TACHE_VALIDEE': '✓',
                            'INTERVENTION_PRISE_EN_CHARGE': '🟢',
                            'INTERVENTION_MISE_EN_ATTENTE': '⏸',
                            'INTERVENTION_REPRISE': '▶️',
                            'INTERVENTION_CLOTUREE': '✅',
                            'PDF_GENERE': '📄'
                          }[event.type_event] || '•';

                          const serviceColor = {
                            'TECHNIQUE': 'bg-blue-100 text-blue-700',
                            'MENAGE': 'bg-yellow-100 text-yellow-700',
                            'RECEPTION': 'bg-green-100 text-green-700',
                            'DIRECTION': 'bg-purple-100 text-purple-700'
                          }[event.service] || 'bg-gray-100 text-gray-700';

                          return (
                            <tr
                              key={event.id}
                              className={`border-t hover:bg-[#FFA500]/5 cursor-pointer font-body ${
                                event.urgent ? 'bg-red-50' : ''
                              } ${selectedIds.includes(event.id) ? 'bg-[#e6f7ff]' : ''}`}
                              onClick={() => setSelectedIncident(event)}
                            >
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => toggleSelect(event.id, e)}
                                  className="p-1 hover:bg-[#00AEEF]/20 rounded transition-colors"
                                >
                                  {selectedIds.includes(event.id) ? (
                                    <CheckSquare className="w-5 h-5 text-[#00AEEF]" />
                                  ) : (
                                    <Square className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                  event.urgent ? 'bg-red-500 text-white' : 'bg-[#00AEEF]/20 text-[#0077A8]'
                                }`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="p-3 text-xs">
                                <div className="font-medium">{format(new Date(event.created_date), 'dd/MM/yy')}</div>
                                <div className="text-[#00AEEF] font-heading">{format(new Date(event.created_date), 'HH:mm')}</div>
                              </td>
                              <td className="p-3 text-sm">
                                <div>{event.client_prenom} {event.client_nom}</div>
                              </td>
                              <td className="p-3">
                                <span className="font-heading text-[#0077A8]">
                                  {event.hebergement}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-lg">{eventIcon}</span>
                                  <Badge className={serviceColor}>
                                    {event.service}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-3">
                                {event.urgent && (
                                  <Badge className="bg-red-500 text-white text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    URGENT
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="text-xs font-semibold text-gray-700">
                                  {event.titre}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {event.description}
                                </div>
                              </td>
                              <td className="p-3 text-sm">
                                {event.collaborateur && (
                                  <div className="text-xs text-gray-600">
                                    <User className="w-3 h-3 inline mr-1" />
                                    {event.collaborateur}
                                  </div>
                                )}
                                {event.metadata?.duree_minutes && (
                                  <div className="text-xs text-gray-500">
                                    {formatDuration(event.metadata.duree_minutes)}
                                  </div>
                                )}
                              </td>
                              <td className="p-3"></td>
                              <td className="p-3"></td>
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

          {/* Statistiques Globales */}
          <TabsContent value="statistiques" className="space-y-6">
            <Statistiques embedded={true} />
          </TabsContent>

          {/* Fiches PDF */}
          <TabsContent value="fiches" className="space-y-6">
            <BureauFichesPDF lang={lang} />
          </TabsContent>

          {/* Collaborateurs */}
          <TabsContent value="collaborateurs" className="space-y-6">
            <div className="space-y-4">
              <Card className="border-2 border-[#00AEEF] rounded-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-heading text-[#0077A8]">
                    👷 {lang === 'fr' ? 'Interventions par collaborateur' : 'Interventions by staff member'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {lang === 'fr' ? 'Vue d\'overview des interventions actives de chaque collaborateur' : 'Overview of active interventions for each staff member'}
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
              {lang === 'fr' ? 'Fiche intervention' : 'Intervention details'} #{selectedIncident?.hebergement || selectedIncident?.numero_hebergement}
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
                  <div><span className="text-gray-500">{lang === 'fr' ? 'Numéro' : 'Number'}:</span> <strong>{selectedIncident.logement || selectedIncident.emplacement || selectedIncident.hebergement || selectedIncident.numero_hebergement}</strong></div>
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
                    {[1, 2, 3, 4, 5].map(s => (
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
