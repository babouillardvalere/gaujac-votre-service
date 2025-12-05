import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText, Calendar as CalendarIcon, Download, Mail, Loader2, Plus, Trash2,
  Clock, CheckCircle, XCircle, Eye, Settings, Play, FileSpreadsheet,
  Filter, Search, ChevronDown, ChevronUp, BarChart3, Users, Wrench, Star, 
  RefreshCcw, Zap, Timer, TrendingUp
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import RapportPreview from './RapportPreview';

const translations = {
  fr: {
    title: 'Rapports automatiques',
    config: 'Configuration',
    historique: 'Historique',
    generer: 'Générer maintenant',
    quotidien: 'Quotidien',
    hebdomadaire: 'Hebdomadaire',
    mensuel: 'Mensuel',
    destinataires: 'Destinataires',
    ajouter_email: 'Ajouter un email',
    format_export: 'Format d\'export',
    heure_envoi: 'Heure d\'envoi',
    jour_envoi: 'Jour d\'envoi',
    activer: 'Activer',
    desactiver: 'Désactiver',
    enregistrer: 'Enregistrer',
    apercu: 'Aperçu',
    telecharger_pdf: 'Télécharger PDF',
    telecharger_csv: 'Télécharger CSV',
    envoyer_maintenant: 'Envoyer maintenant',
    derniere_generation: 'Dernière génération',
    aucun_rapport: 'Aucun rapport généré',
    rapport_genere: 'Rapport généré avec succès',
    rapport_envoye: 'Rapport envoyé avec succès',
    erreur_generation: 'Erreur lors de la génération',
    direction: 'Direction',
    bureau: 'Bureau',
    maintenance: 'Maintenance',
    menage: 'Ménage',
    lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', jeudi: 'Jeudi',
    vendredi: 'Vendredi', samedi: 'Samedi', dimanche: 'Dimanche',
    periode: 'Période',
    du: 'Du',
    au: 'au',
    total_interventions: 'Total interventions',
    urgences: 'Urgences',
    temps_moyen_reaction: 'Temps moyen réaction',
    temps_moyen_resolution: 'Temps moyen résolution',
    taux_non_resolu: 'Taux non résolu',
    langue: 'Langue du rapport',
    // New translations
    planification: 'Planification',
    metriques: 'Métriques incluses',
    filtres_avances: 'Filtres avancés',
    tous_types: 'Tous les types',
    tous_statuts: 'Tous les statuts',
    envoye: 'Envoyé',
    non_envoye: 'Non envoyé',
    rechercher: 'Rechercher...',
    date_debut: 'Date début',
    date_fin: 'Date fin',
    reinitialiser: 'Réinitialiser',
    appliquer: 'Appliquer',
    resultats: 'résultat(s)',
    recurrence: 'Récurrence',
    prochaine_execution: 'Prochaine exécution',
    configurer_metriques: 'Configurer les métriques',
    interventions_section: 'Section Interventions',
    temps_section: 'Section Temps',
    categories_section: 'Section Catégories',
    hebergements_section: 'Section Hébergements',
    collaborateurs_section: 'Section Collaborateurs',
    satisfaction_section: 'Section Satisfaction',
    top_interventions: 'Top interventions longues',
    activer_envoi_auto: 'Activer l\'envoi automatique',
    rappel_avant: 'Rappel avant envoi',
    aucun_rappel: 'Aucun rappel',
    minutes_avant: 'min avant',
    heures_avant: 'h avant',
    nouveau_rapport: 'Nouveau rapport',
    supprimer_rapport: 'Supprimer',
    confirmer_suppression: 'Confirmer la suppression ?',
    rapport_supprime: 'Rapport supprimé',
    exporter_selection: 'Exporter la sélection',
    // Litige
    rapport_litige: 'Rapport de litige',
    generer_litige: 'Générer un rapport de litige',
    selectionner_intervention: 'Sélectionner une intervention',
    aucune_intervention: 'Aucune intervention disponible',
    informations_litige: 'Informations du litige',
    telecharger_dossier: 'Télécharger le dossier complet',
    envoyer_email_litige: 'Envoyer par email',
    date_intervention: 'Date intervention',
    client_info: 'Client',
    hebergement_info: 'Hébergement',
    collaborateur_info: 'Intervenant',
    photos_preuves: 'Preuves photographiques',
    photo_avant: 'Photo AVANT',
    photo_apres: 'Photo APRÈS',
    hash_verification: 'Hash de vérification',
    rapport_litige_genere: 'Rapport de litige généré',
    copier_hash: 'Copier le hash'
  },
  en: {
    title: 'Automatic Reports',
    config: 'Configuration',
    historique: 'History',
    generer: 'Generate now',
    quotidien: 'Daily',
    hebdomadaire: 'Weekly',
    mensuel: 'Monthly',
    destinataires: 'Recipients',
    ajouter_email: 'Add an email',
    format_export: 'Export format',
    heure_envoi: 'Send time',
    jour_envoi: 'Send day',
    activer: 'Enable',
    desactiver: 'Disable',
    enregistrer: 'Save',
    apercu: 'Preview',
    telecharger_pdf: 'Download PDF',
    telecharger_csv: 'Download CSV',
    envoyer_maintenant: 'Send now',
    derniere_generation: 'Last generation',
    aucun_rapport: 'No report generated',
    rapport_genere: 'Report generated successfully',
    rapport_envoye: 'Report sent successfully',
    erreur_generation: 'Error during generation',
    direction: 'Management',
    bureau: 'Office',
    maintenance: 'Maintenance',
    menage: 'Housekeeping',
    lundi: 'Monday', mardi: 'Tuesday', mercredi: 'Wednesday', jeudi: 'Thursday',
    vendredi: 'Friday', samedi: 'Saturday', dimanche: 'Sunday',
    periode: 'Period',
    du: 'From',
    au: 'to',
    total_interventions: 'Total interventions',
    urgences: 'Emergencies',
    temps_moyen_reaction: 'Avg reaction time',
    temps_moyen_resolution: 'Avg resolution time',
    taux_non_resolu: 'Unresolved rate',
    langue: 'Report language',
    // New translations
    planification: 'Scheduling',
    metriques: 'Included metrics',
    filtres_avances: 'Advanced filters',
    tous_types: 'All types',
    tous_statuts: 'All statuses',
    envoye: 'Sent',
    non_envoye: 'Not sent',
    rechercher: 'Search...',
    date_debut: 'Start date',
    date_fin: 'End date',
    reinitialiser: 'Reset',
    appliquer: 'Apply',
    resultats: 'result(s)',
    recurrence: 'Recurrence',
    prochaine_execution: 'Next execution',
    configurer_metriques: 'Configure metrics',
    interventions_section: 'Interventions Section',
    temps_section: 'Time Section',
    categories_section: 'Categories Section',
    hebergements_section: 'Accommodations Section',
    collaborateurs_section: 'Collaborators Section',
    satisfaction_section: 'Satisfaction Section',
    top_interventions: 'Top longest interventions',
    activer_envoi_auto: 'Enable automatic sending',
    rappel_avant: 'Reminder before',
    aucun_rappel: 'No reminder',
    minutes_avant: 'min before',
    heures_avant: 'h before',
    nouveau_rapport: 'New report',
    supprimer_rapport: 'Delete',
    confirmer_suppression: 'Confirm deletion?',
    rapport_supprime: 'Report deleted',
    exporter_selection: 'Export selection',
    // Litige
    rapport_litige: 'Dispute Report',
    generer_litige: 'Generate Dispute Report',
    selectionner_intervention: 'Select an intervention',
    aucune_intervention: 'No intervention available',
    informations_litige: 'Dispute Information',
    telecharger_dossier: 'Download Complete File',
    envoyer_email_litige: 'Send by Email',
    date_intervention: 'Intervention Date',
    client_info: 'Client',
    hebergement_info: 'Accommodation',
    collaborateur_info: 'Technician',
    photos_preuves: 'Photo Evidence',
    photo_avant: 'BEFORE Photo',
    photo_apres: 'AFTER Photo',
    hash_verification: 'Verification Hash',
    rapport_litige_genere: 'Dispute report generated',
    copier_hash: 'Copy Hash'
  }
};

const defaultMetricsConfig = {
  interventions: true,
  temps: true,
  categories: true,
  hebergements: true,
  collaborateurs: true,
  satisfaction: true,
  topLongues: true
};

export default function BureauRapports({ incidents = [], avis = [] }) {
  const lang = sessionStorage.getItem('user_language') || 'fr';
  const t = (key) => translations[lang]?.[key] || translations['fr']?.[key] || key;
  
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('config');
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState('quotidien');
  const [previewData, setPreviewData] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [editingConfigType, setEditingConfigType] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [showLitigeDialog, setShowLitigeDialog] = useState(false);
  const [selectedIncidentForLitige, setSelectedIncidentForLitige] = useState(null);
  const [litigeEmail, setLitigeEmail] = useState('');
  const [litigeFilters, setLitigeFilters] = useState({
    search: '',
    categorie: 'all',
    dateStart: null,
    dateEnd: null,
    lieu: '',
    intervenant: 'all'
  });

  // Filtres historique
  const [historyFilters, setHistoryFilters] = useState({
    type: 'all',
    status: 'all',
    search: '',
    dateStart: null,
    dateEnd: null
  });

  const { data: configs = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ['rapport-configs'],
    queryFn: () => base44.entities.RapportConfig.list()
  });

  const { data: historique = [], isLoading: loadingHistorique } = useQuery({
    queryKey: ['rapport-historique'],
    queryFn: () => base44.entities.RapportHistorique.filter({}, '-date_generation', 100)
  });

  const createConfigMutation = useMutation({
    mutationFn: (data) => base44.entities.RapportConfig.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rapport-configs'] })
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RapportConfig.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rapport-configs'] })
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id) => base44.entities.RapportConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rapport-configs'] })
  });

  const createHistoriqueMutation = useMutation({
    mutationFn: (data) => base44.entities.RapportHistorique.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rapport-historique'] })
  });

  const deleteHistoriqueMutation = useMutation({
    mutationFn: (id) => base44.entities.RapportHistorique.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapport-historique'] });
      toast.success(t('rapport_supprime'));
    }
  });

  // Filtrage de l'historique
  const filteredHistorique = useMemo(() => {
    return historique.filter(rapport => {
      // Filtre type
      if (historyFilters.type !== 'all' && rapport.type !== historyFilters.type) return false;
      
      // Filtre statut
      if (historyFilters.status === 'envoye' && !rapport.envoi_reussi) return false;
      if (historyFilters.status === 'non_envoye' && rapport.envoi_reussi) return false;
      
      // Filtre recherche
      if (historyFilters.search) {
        const searchLower = historyFilters.search.toLowerCase();
        const matchPeriod = `${rapport.date_debut} ${rapport.date_fin}`.toLowerCase().includes(searchLower);
        const matchDestinataires = rapport.destinataires_envoyes?.some(d => d.toLowerCase().includes(searchLower));
        if (!matchPeriod && !matchDestinataires) return false;
      }
      
      // Filtre dates
      if (historyFilters.dateStart && rapport.date_generation) {
        const reportDate = new Date(rapport.date_generation);
        if (reportDate < historyFilters.dateStart) return false;
      }
      if (historyFilters.dateEnd && rapport.date_generation) {
        const reportDate = new Date(rapport.date_generation);
        if (reportDate > historyFilters.dateEnd) return false;
      }
      
      return true;
    });
  }, [historique, historyFilters]);

  const resetFilters = () => {
    setHistoryFilters({
      type: 'all',
      status: 'all',
      search: '',
      dateStart: null,
      dateEnd: null
    });
  };

  // Calcul des métriques pour une période
  const calculateMetrics = (dateDebut, dateFin, reportLang = 'fr', metricsConfig = defaultMetricsConfig) => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    
    const periodIncidents = incidents.filter(i => {
      const d = new Date(i.date_saisie);
      return d >= start && d <= end;
    });

    const resolus = periodIncidents.filter(i => i.statut === 'resolu');
    const urgents = periodIncidents.filter(i => i.urgent);
    const nonResolus = periodIncidents.filter(i => i.statut !== 'resolu');

    const result = {
      periode: { debut: dateDebut, fin: dateFin },
      langue: reportLang,
      metricsConfig
    };

    // Section Interventions
    if (metricsConfig.interventions) {
      result.total = periodIncidents.length;
      result.urgences = urgents.length;
      result.resolus = resolus.length;
      result.nonResolus = nonResolus.length;
      result.tauxNonResolu = periodIncidents.length > 0 
        ? ((nonResolus.length / periodIncidents.length) * 100).toFixed(1) 
        : 0;
    }

    // Section Temps
    if (metricsConfig.temps) {
      const tempsReaction = resolus
        .filter(i => i.temps_prise_en_charge)
        .map(i => i.temps_prise_en_charge);
      result.avgReaction = tempsReaction.length > 0 
        ? Math.round(tempsReaction.reduce((a, b) => a + b, 0) / tempsReaction.length)
        : 0;

      const tempsResolution = resolus
        .filter(i => i.temps_total_intervention)
        .map(i => i.temps_total_intervention);
      result.avgResolution = tempsResolution.length > 0
        ? Math.round(tempsResolution.reduce((a, b) => a + b, 0) / tempsResolution.length)
        : 0;
    }

    // Section Catégories
    if (metricsConfig.categories) {
      result.parCategorie = periodIncidents.reduce((acc, i) => {
        acc[i.categorie] = (acc[i.categorie] || 0) + 1;
        return acc;
      }, {});
    }

    // Section Hébergements
    if (metricsConfig.hebergements) {
      result.parHebergement = periodIncidents.reduce((acc, i) => {
        const loc = i.logement || i.emplacement || 'Inconnu';
        acc[loc] = (acc[loc] || 0) + 1;
        return acc;
      }, {});
    }

    // Section Top interventions longues
    if (metricsConfig.topLongues) {
      result.plusLongues = [...resolus]
        .filter(i => i.temps_total_intervention)
        .sort((a, b) => b.temps_total_intervention - a.temps_total_intervention)
        .slice(0, 5);
    }

    // Section Collaborateurs
    if (metricsConfig.collaborateurs) {
      result.parCollaborateur = resolus.reduce((acc, i) => {
        if (i.pris_par) acc[i.pris_par] = (acc[i.pris_par] || 0) + 1;
        return acc;
      }, {});
    }

    // Section Satisfaction
    if (metricsConfig.satisfaction) {
      const periodAvis = avis.filter(a => {
        const d = new Date(a.created_date);
        return d >= start && d <= end;
      });

      result.avis = {
        total: periodAvis.length,
        avgReactivite: periodAvis.length > 0
          ? (periodAvis.reduce((s, a) => s + (a.note_reactivite || 0), 0) / periodAvis.length).toFixed(1)
          : 0,
        avgAmabilite: periodAvis.length > 0
          ? (periodAvis.reduce((s, a) => s + (a.note_amabilite || 0), 0) / periodAvis.length).toFixed(1)
          : 0,
        avgQualite: periodAvis.length > 0
          ? (periodAvis.reduce((s, a) => s + (a.note_intervention || 0), 0) / periodAvis.length).toFixed(1)
          : 0,
        avgGlobale: periodAvis.length > 0
          ? (periodAvis.reduce((s, a) => s + (a.note_globale || 0), 0) / periodAvis.length).toFixed(1)
          : 0
      };
    }

    return result;
  };

  // Obtenir les dates pour un type de rapport
  const getPeriodDates = (type) => {
    const now = new Date();
    switch (type) {
      case 'quotidien':
        return {
          debut: format(subDays(now, 1), 'yyyy-MM-dd'),
          fin: format(subDays(now, 1), 'yyyy-MM-dd')
        };
      case 'hebdomadaire':
        return {
          debut: format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          fin: format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        };
      case 'mensuel':
        return {
          debut: format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
          fin: format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
        };
      default:
        return { debut: format(now, 'yyyy-MM-dd'), fin: format(now, 'yyyy-MM-dd') };
    }
  };

  // Calculer la prochaine exécution
  const getNextExecution = (config) => {
    if (!config?.actif) return null;
    
    const now = new Date();
    const [hours, minutes] = (config.heure_envoi || '08:00').split(':').map(Number);
    
    let nextDate = new Date(now);
    nextDate.setHours(hours, minutes, 0, 0);
    
    if (config.type === 'quotidien') {
      if (nextDate <= now) nextDate.setDate(nextDate.getDate() + 1);
    } else if (config.type === 'hebdomadaire') {
      const targetDay = config.jour_envoi || 1;
      const currentDay = now.getDay() || 7;
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0 || (daysToAdd === 0 && nextDate <= now)) {
        daysToAdd += 7;
      }
      nextDate.setDate(now.getDate() + daysToAdd);
    } else if (config.type === 'mensuel') {
      const targetDay = config.jour_envoi || 1;
      nextDate.setDate(targetDay);
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    }
    
    return nextDate;
  };

  // Générer un rapport
  const generateReport = async (type, config = null) => {
    setGenerating(true);
    try {
      const reportLang = config?.langue || lang;
      const metricsConfig = config?.metriques_config || defaultMetricsConfig;
      const { debut, fin } = getPeriodDates(type);
      const metriques = calculateMetrics(debut, fin, reportLang, metricsConfig);

      const rapport = await createHistoriqueMutation.mutateAsync({
        type,
        date_debut: debut,
        date_fin: fin,
        date_generation: new Date().toISOString(),
        metriques,
        destinataires_envoyes: config?.destinataires || [],
        envoi_reussi: false,
        langue: reportLang
      });

      if (config) {
        await updateConfigMutation.mutateAsync({
          id: config.id,
          data: { derniere_generation: new Date().toISOString() }
        });
      }

      toast.success(t('rapport_genere'));
      return rapport;
    } catch (error) {
      toast.error(t('erreur_generation'));
    } finally {
      setGenerating(false);
    }
  };

  // Envoyer le rapport par email
  const sendReport = async (rapport, destinataires) => {
    try {
      const reportLang = rapport.langue || 'fr';
      const tReport = (key) => translations[reportLang]?.[key] || key;
      
      const subject = `${tReport(rapport.type)} - ${rapport.date_debut} ${tReport('au')} ${rapport.date_fin}`;
      const body = generateEmailBody(rapport.metriques, reportLang);

      for (const email of destinataires) {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Camping Paradis - ${subject}`,
          body
        });
      }

      await base44.entities.RapportHistorique.update(rapport.id, {
        envoi_reussi: true,
        destinataires_envoyes: destinataires
      });

      toast.success(t('rapport_envoye'));
      queryClient.invalidateQueries({ queryKey: ['rapport-historique'] });
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  // Générer le corps de l'email
  const generateEmailBody = (metriques, reportLang = 'fr') => {
    const tReport = (key) => translations[reportLang]?.[key] || key;
    const mc = metriques.metricsConfig || defaultMetricsConfig;
    
    let body = `
RAPPORT D'ACTIVITÉ - CAMPING PARADIS
====================================

Période: ${metriques.periode.debut} ${tReport('au')} ${metriques.periode.fin}
`;

    if (mc.interventions && metriques.total !== undefined) {
      body += `
INTERVENTIONS
-------------
• ${tReport('total_interventions')}: ${metriques.total}
• ${tReport('urgences')}: ${metriques.urgences}
• Résolues: ${metriques.resolus}
• Non résolues: ${metriques.nonResolus} (${metriques.tauxNonResolu}%)
`;
    }

    if (mc.temps && metriques.avgReaction !== undefined) {
      body += `
TEMPS MOYENS
------------
• ${tReport('temps_moyen_reaction')}: ${metriques.avgReaction} min
• ${tReport('temps_moyen_resolution')}: ${metriques.avgResolution} min
`;
    }

    if (mc.categories && metriques.parCategorie) {
      body += `
PAR CATÉGORIE
-------------
${Object.entries(metriques.parCategorie).map(([k, v]) => `• ${k}: ${v}`).join('\n')}
`;
    }

    if (mc.satisfaction && metriques.avis) {
      body += `
SATISFACTION CLIENT
-------------------
• Réactivité: ${metriques.avis.avgReactivite}/5
• Amabilité: ${metriques.avis.avgAmabilite}/5
• Qualité: ${metriques.avis.avgQualite}/5
• Note globale: ${metriques.avis.avgGlobale}/5
`;
    }

    body += `
---
Rapport généré automatiquement par Camping Paradis`;

    return body.trim();
  };

  // Générer CSV
  const generateCSV = (metriques) => {
    const mc = metriques.metricsConfig || defaultMetricsConfig;
    const rows = [['Métrique', 'Valeur']];
    
    if (mc.interventions && metriques.total !== undefined) {
      rows.push(
        ['Total interventions', metriques.total],
        ['Urgences', metriques.urgences],
        ['Résolues', metriques.resolus],
        ['Non résolues', metriques.nonResolus],
        ['Taux non résolu (%)', metriques.tauxNonResolu]
      );
    }
    
    if (mc.temps && metriques.avgReaction !== undefined) {
      rows.push(
        ['Temps moyen réaction (min)', metriques.avgReaction],
        ['Temps moyen résolution (min)', metriques.avgResolution]
      );
    }
    
    if (mc.categories && metriques.parCategorie) {
      rows.push([''], ['Catégorie', 'Nombre']);
      Object.entries(metriques.parCategorie).forEach(([k, v]) => rows.push([k, v]));
    }
    
    if (mc.hebergements && metriques.parHebergement) {
      rows.push([''], ['Hébergement', 'Nombre']);
      Object.entries(metriques.parHebergement).forEach(([k, v]) => rows.push([k, v]));
    }
    
    if (mc.satisfaction && metriques.avis) {
      rows.push(
        [''], ['Satisfaction', 'Note'],
        ['Réactivité', metriques.avis.avgReactivite],
        ['Amabilité', metriques.avis.avgAmabilite],
        ['Qualité', metriques.avis.avgQualite],
        ['Note globale', metriques.avis.avgGlobale]
      );
    }

    return rows.map(r => r.join(';')).join('\n');
  };

  // Télécharger CSV
  const downloadCSV = (rapport) => {
    const csv = generateCSV(rapport.metriques);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${rapport.type}_${rapport.date_debut}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exporter sélection
  const exportSelectedReports = () => {
    const selected = filteredHistorique.filter(r => selectedReports.includes(r.id));
    if (selected.length === 0) return;
    
    let allCSV = '';
    selected.forEach((rapport, idx) => {
      if (idx > 0) allCSV += '\n\n--- NOUVEAU RAPPORT ---\n\n';
      allCSV += `Type: ${rapport.type}\nPériode: ${rapport.date_debut} - ${rapport.date_fin}\n\n`;
      allCSV += generateCSV(rapport.metriques);
    });
    
    const blob = new Blob([allCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapports_selection_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prévisualiser
  const handlePreview = (type) => {
    const config = configs.find(c => c.type === type);
    const reportLang = config?.langue || lang;
    const metricsConfig = config?.metriques_config || defaultMetricsConfig;
    const { debut, fin } = getPeriodDates(type);
    const metriques = calculateMetrics(debut, fin, reportLang, metricsConfig);
    setPreviewData({ type, metriques, langue: reportLang });
    setPreviewType(type);
    setShowPreview(true);
  };

  const getConfig = (type) => configs.find(c => c.type === type);

  // Toggle sélection rapport
  const toggleReportSelection = (id) => {
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // Sélectionner tous les rapports filtrés
  const toggleSelectAll = () => {
    if (selectedReports.length === filteredHistorique.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filteredHistorique.map(r => r.id));
    }
  };

  // Supprimer rapport
  const handleDeleteReport = async () => {
    if (reportToDelete) {
      await deleteHistoriqueMutation.mutateAsync(reportToDelete);
      setReportToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const ConfigCard = ({ type }) => {
    const config = getConfig(type);
    const [localConfig, setLocalConfig] = useState(config || {
      actif: false,
      destinataires: [],
      categories_destinataires: [],
      format: 'pdf',
      heure_envoi: '08:00',
      jour_envoi: 1,
      langue: lang,
      metriques_config: defaultMetricsConfig,
      rappel_avant: 0
    });

    const nextExec = getNextExecution(localConfig.actif ? localConfig : null);

    const handleSave = async () => {
      if (config) {
        await updateConfigMutation.mutateAsync({ id: config.id, data: localConfig });
      } else {
        await createConfigMutation.mutateAsync({ ...localConfig, type });
      }
      toast.success('Configuration enregistrée');
    };

    const addEmail = () => {
      if (newEmail && !localConfig.destinataires?.includes(newEmail)) {
        setLocalConfig({
          ...localConfig,
          destinataires: [...(localConfig.destinataires || []), newEmail]
        });
        setNewEmail('');
      }
    };

    const removeEmail = (email) => {
      setLocalConfig({
        ...localConfig,
        destinataires: localConfig.destinataires.filter(e => e !== email)
      });
    };

    const toggleCategory = (cat) => {
      const cats = localConfig.categories_destinataires || [];
      setLocalConfig({
        ...localConfig,
        categories_destinataires: cats.includes(cat)
          ? cats.filter(c => c !== cat)
          : [...cats, cat]
      });
    };

    const openMetricsConfig = () => {
      setEditingConfigType(type);
      setShowMetricsDialog(true);
    };

    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    return (
      <Card className="border-2 border-[#FFA500]/30 rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {t(type)}
            </CardTitle>
            <Badge className={localConfig.actif ? 'bg-green-500' : 'bg-gray-400'}>
              {localConfig.actif ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Activation avec switch */}
          <div className="flex items-center justify-between">
            <span className="font-body text-sm">{t('activer_envoi_auto')}</span>
            <Switch
              checked={localConfig.actif}
              onCheckedChange={(c) => setLocalConfig({ ...localConfig, actif: c })}
            />
          </div>

          {/* Prochaine exécution */}
          {nextExec && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <RefreshCcw className="w-4 h-4" />
                <span className="font-heading">{t('prochaine_execution')}:</span>
                <span className="font-body">{format(nextExec, 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
              </div>
            </div>
          )}

          {/* Langue */}
          <div>
            <label className="text-sm font-heading text-[#0077A8] block mb-1">{t('langue')}</label>
            <Select
              value={localConfig.langue || 'fr'}
              onValueChange={(v) => setLocalConfig({ ...localConfig, langue: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bouton Configurer métriques */}
          <Button
            variant="outline"
            onClick={openMetricsConfig}
            className="w-full rounded-xl border-[#00AEEF] text-[#00AEEF] hover:bg-[#00AEEF]/10"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {t('configurer_metriques')}
          </Button>

          {/* Catégories destinataires */}
          <div>
            <label className="text-sm font-heading text-[#0077A8] block mb-2">{t('destinataires')}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['direction', 'bureau', 'maintenance', 'menage'].map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    localConfig.categories_destinataires?.includes(cat)
                      ? 'bg-[#00AEEF] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t(cat)}
                </button>
              ))}
            </div>
          </div>

          {/* Emails personnalisés */}
          <div>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder={t('ajouter_email')}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="rounded-xl"
                type="email"
              />
              <Button onClick={addEmail} size="icon" className="rounded-xl bg-[#00AEEF]">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localConfig.destinataires?.map(email => (
                <Badge key={email} className="bg-gray-100 text-gray-700 pr-1">
                  {email}
                  <button onClick={() => removeEmail(email)} className="ml-1 text-red-500">×</button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="text-sm font-heading text-[#0077A8] block mb-1">{t('format_export')}</label>
            <Select
              value={localConfig.format}
              onValueChange={(v) => setLocalConfig({ ...localConfig, format: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="both">PDF + CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Planification */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-heading text-[#0077A8] block mb-1">{t('heure_envoi')}</label>
              <Input
                type="time"
                value={localConfig.heure_envoi}
                onChange={(e) => setLocalConfig({ ...localConfig, heure_envoi: e.target.value })}
                className="rounded-xl"
              />
            </div>
            {type === 'hebdomadaire' && (
              <div>
                <label className="text-sm font-heading text-[#0077A8] block mb-1">{t('jour_envoi')}</label>
                <Select
                  value={String(localConfig.jour_envoi || 1)}
                  onValueChange={(v) => setLocalConfig({ ...localConfig, jour_envoi: parseInt(v) })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jours.map((j, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{t(j)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {type === 'mensuel' && (
              <div>
                <label className="text-sm font-heading text-[#0077A8] block mb-1">{t('jour_envoi')}</label>
                <Select
                  value={String(localConfig.jour_envoi || 1)}
                  onValueChange={(v) => setLocalConfig({ ...localConfig, jour_envoi: parseInt(v) })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Dernière génération */}
          {config?.derniere_generation && (
            <p className="text-xs text-gray-500">
              {t('derniere_generation')}: {format(new Date(config.derniere_generation), 'dd/MM/yyyy HH:mm')}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl">
              <Settings className="w-4 h-4 mr-2" />
              {t('enregistrer')}
            </Button>
            <Button onClick={() => handlePreview(type)} variant="outline" className="rounded-xl">
              <Eye className="w-4 h-4 mr-2" />
              {t('apercu')}
            </Button>
            <Button
              onClick={() => generateReport(type, config)}
              variant="outline"
              className="rounded-xl border-green-500 text-green-600 hover:bg-green-50"
              disabled={generating}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Dialog de configuration des métriques
  const MetricsConfigDialog = () => {
    const config = editingConfigType ? getConfig(editingConfigType) : null;
    const [localMetrics, setLocalMetrics] = useState(config?.metriques_config || defaultMetricsConfig);

    const handleSaveMetrics = async () => {
      if (config) {
        await updateConfigMutation.mutateAsync({
          id: config.id,
          data: { metriques_config: localMetrics }
        });
      } else if (editingConfigType) {
        await createConfigMutation.mutateAsync({
          type: editingConfigType,
          actif: false,
          destinataires: [],
          categories_destinataires: [],
          format: 'pdf',
          heure_envoi: '08:00',
          jour_envoi: 1,
          langue: lang,
          metriques_config: localMetrics
        });
      }
      toast.success('Configuration des métriques enregistrée');
      setShowMetricsDialog(false);
    };

    const metricsOptions = [
      { key: 'interventions', label: t('interventions_section'), icon: Wrench },
      { key: 'temps', label: t('temps_section'), icon: Timer },
      { key: 'categories', label: t('categories_section'), icon: BarChart3 },
      { key: 'hebergements', label: t('hebergements_section'), icon: Users },
      { key: 'collaborateurs', label: t('collaborateurs_section'), icon: Users },
      { key: 'satisfaction', label: t('satisfaction_section'), icon: Star },
      { key: 'topLongues', label: t('top_interventions'), icon: TrendingUp },
    ];

    return (
      <Dialog open={showMetricsDialog} onOpenChange={setShowMetricsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8]">
              {t('configurer_metriques')} - {editingConfigType && t(editingConfigType)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {metricsOptions.map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Checkbox
                  checked={localMetrics[key]}
                  onCheckedChange={(c) => setLocalMetrics({ ...localMetrics, [key]: c })}
                />
                <Icon className="w-5 h-5 text-[#00AEEF]" />
                <span className="font-body">{label}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMetricsDialog(false)} className="rounded-xl">
              {t('annuler') || 'Annuler'}
            </Button>
            <Button onClick={handleSaveMetrics} className="bg-[#00AEEF] rounded-xl">
              {t('enregistrer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading text-2xl text-[#0077A8] flex items-center gap-2">
          <FileText className="w-6 h-6" />
          {t('title')}
        </h2>
        <Button
          onClick={() => setShowLitigeDialog(true)}
          className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
        >
          <Zap className="w-4 h-4 mr-2" />
          {t('generer_litige')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#FFA500]/20 rounded-xl">
          <TabsTrigger value="config" className="rounded-lg data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            {t('config')}
          </TabsTrigger>
          <TabsTrigger value="historique" className="rounded-lg data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            {t('historique')} ({filteredHistorique.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <ConfigCard type="quotidien" />
            <ConfigCard type="hebdomadaire" />
            <ConfigCard type="mensuel" />
          </div>
        </TabsContent>

        <TabsContent value="historique" className="mt-4 space-y-4">
          {/* Barre de filtres */}
          <Card className="border-2 border-[#FFA500]/30 rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Recherche */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={t('rechercher')}
                    value={historyFilters.search}
                    onChange={(e) => setHistoryFilters({ ...historyFilters, search: e.target.value })}
                    className="pl-10 rounded-xl"
                  />
                </div>

                {/* Filtre type */}
                <Select
                  value={historyFilters.type}
                  onValueChange={(v) => setHistoryFilters({ ...historyFilters, type: v })}
                >
                  <SelectTrigger className="w-40 rounded-xl">
                    <SelectValue placeholder={t('tous_types')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tous_types')}</SelectItem>
                    <SelectItem value="quotidien">{t('quotidien')}</SelectItem>
                    <SelectItem value="hebdomadaire">{t('hebdomadaire')}</SelectItem>
                    <SelectItem value="mensuel">{t('mensuel')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtre statut */}
                <Select
                  value={historyFilters.status}
                  onValueChange={(v) => setHistoryFilters({ ...historyFilters, status: v })}
                >
                  <SelectTrigger className="w-40 rounded-xl">
                    <SelectValue placeholder={t('tous_statuts')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tous_statuts')}</SelectItem>
                    <SelectItem value="envoye">{t('envoye')}</SelectItem>
                    <SelectItem value="non_envoye">{t('non_envoye')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Bouton filtres avancés */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="rounded-xl"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {t('filtres_avances')}
                  {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>

                {/* Réinitialiser */}
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="text-gray-500"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  {t('reinitialiser')}
                </Button>
              </div>

              {/* Filtres avancés */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
                  {/* Date début */}
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">{t('date_debut')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-40 rounded-xl justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {historyFilters.dateStart ? format(historyFilters.dateStart, 'dd/MM/yyyy') : '-'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={historyFilters.dateStart}
                          onSelect={(date) => setHistoryFilters({ ...historyFilters, dateStart: date })}
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date fin */}
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">{t('date_fin')}</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-40 rounded-xl justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {historyFilters.dateEnd ? format(historyFilters.dateEnd, 'dd/MM/yyyy') : '-'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={historyFilters.dateEnd}
                          onSelect={(date) => setHistoryFilters({ ...historyFilters, dateEnd: date })}
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Actions de sélection */}
              {selectedReports.length > 0 && (
                <div className="mt-4 pt-4 border-t flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {selectedReports.length} {t('resultats')} sélectionné(s)
                  </span>
                  <Button
                    variant="outline"
                    onClick={exportSelectedReports}
                    className="rounded-xl border-[#00AEEF] text-[#00AEEF]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('exporter_selection')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tableau historique */}
          <Card className="border-2 border-[#FFA500]/30 rounded-xl">
            <CardContent className="p-0">
              {loadingHistorique ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FFA500]" />
                </div>
              ) : filteredHistorique.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t('aucun_rapport')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#FFA500]/10">
                      <tr className="text-left text-xs font-heading text-[#0077A8]">
                        <th className="p-3 w-10">
                          <Checkbox
                            checked={selectedReports.length === filteredHistorique.length && filteredHistorique.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-3">Type</th>
                        <th className="p-3">{t('periode')}</th>
                        <th className="p-3">Généré le</th>
                        <th className="p-3">Envoi</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistorique.map(rapport => (
                        <tr key={rapport.id} className="border-t hover:bg-[#FFA500]/5">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedReports.includes(rapport.id)}
                              onCheckedChange={() => toggleReportSelection(rapport.id)}
                            />
                          </td>
                          <td className="p-3">
                            <Badge className="bg-[#00AEEF] text-white">{t(rapport.type)}</Badge>
                          </td>
                          <td className="p-3 text-sm font-body">
                            {rapport.date_debut} → {rapport.date_fin}
                          </td>
                          <td className="p-3 text-sm font-body">
                            {rapport.date_generation && format(new Date(rapport.date_generation), 'dd/MM/yy HH:mm')}
                          </td>
                          <td className="p-3">
                            {rapport.envoi_reussi ? (
                              <Badge className="bg-green-500 text-white">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('envoye')}
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-400 text-white">
                                <XCircle className="w-3 h-3 mr-1" />
                                {t('non_envoye')}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setPreviewData({ type: rapport.type, metriques: rapport.metriques, langue: rapport.langue });
                                  setShowPreview(true);
                                }}
                                title={t('apercu')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadCSV(rapport)}
                                title={t('telecharger_csv')}
                              >
                                <FileSpreadsheet className="w-4 h-4" />
                              </Button>
                              {!rapport.envoi_reussi && rapport.metriques && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const config = getConfig(rapport.type);
                                    if (config?.destinataires?.length > 0) {
                                      sendReport(rapport, config.destinataires);
                                    } else {
                                      toast.error('Aucun destinataire configuré');
                                    }
                                  }}
                                  title={t('envoyer_maintenant')}
                                >
                                  <Mail className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => {
                                  setReportToDelete(rapport.id);
                                  setShowDeleteConfirm(true);
                                }}
                                title={t('supprimer_rapport')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          <p className="text-sm text-gray-500 text-center">
            {filteredHistorique.length} {t('resultats')}
          </p>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#0077A8]">
              {t('apercu')} - {previewData && t(previewData.type)}
            </DialogTitle>
          </DialogHeader>
          {previewData && <RapportPreview data={previewData} />}
        </DialogContent>
      </Dialog>

      {/* Metrics Config Dialog */}
      <MetricsConfigDialog />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-600">
              {t('confirmer_suppression')}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl">
              Annuler
            </Button>
            <Button onClick={handleDeleteReport} className="bg-red-500 hover:bg-red-600 rounded-xl">
              <Trash2 className="w-4 h-4 mr-2" />
              {t('supprimer_rapport')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rapport de Litige */}
      <Dialog open={showLitigeDialog} onOpenChange={setShowLitigeDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-red-600 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {t('rapport_litige')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Sélection intervention */}
            <div>
              <label className="text-sm font-heading text-[#0077A8] block mb-2">
                {t('selectionner_intervention')}
              </label>
              <Select
                value={selectedIncidentForLitige?.id || ''}
                onValueChange={(v) => {
                  const inc = incidents.find(i => i.id === v);
                  setSelectedIncidentForLitige(inc);
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t('selectionner_intervention')} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {incidents.filter(i => i.statut === 'resolu').length === 0 ? (
                    <SelectItem value="none" disabled>{t('aucune_intervention')}</SelectItem>
                  ) : (
                    incidents
                      .filter(i => i.statut === 'resolu')
                      .sort((a, b) => new Date(b.date_resolution) - new Date(a.date_resolution))
                      .slice(0, 50)
                      .map(inc => (
                        <SelectItem key={inc.id} value={inc.id}>
                          {inc.logement || inc.emplacement} - {inc.client_prenom} {inc.client_nom} ({inc.date_resolution ? format(new Date(inc.date_resolution), 'dd/MM/yy') : '-'})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Détails de l'intervention sélectionnée */}
            {selectedIncidentForLitige && (
              <div className="space-y-4">
                <Card className="border-2 border-red-200 rounded-xl bg-red-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-heading text-red-700 text-lg">
                      {t('informations_litige')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Infos principales */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500 font-heading">{t('date_intervention')}</p>
                        <p className="font-body font-medium">
                          {selectedIncidentForLitige.date_saisie && format(new Date(selectedIncidentForLitige.date_saisie), 'dd/MM/yyyy HH:mm')}
                          {selectedIncidentForLitige.date_resolution && (
                            <span className="text-green-600"> → {format(new Date(selectedIncidentForLitige.date_resolution), 'dd/MM/yyyy HH:mm')}</span>
                          )}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500 font-heading">{t('client_info')}</p>
                        <p className="font-body font-medium">
                          {selectedIncidentForLitige.client_prenom} {selectedIncidentForLitige.client_nom}
                        </p>
                        <p className="text-xs text-gray-500">
                          Séjour: {selectedIncidentForLitige.date_arrivee} → {selectedIncidentForLitige.date_depart}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500 font-heading">{t('hebergement_info')}</p>
                        <p className="font-body font-medium">
                          {selectedIncidentForLitige.logement ? '🏠 Mobil-home' : '⛺ Emplacement'} {selectedIncidentForLitige.logement || selectedIncidentForLitige.emplacement}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500 font-heading">{t('collaborateur_info')}</p>
                        <p className="font-body font-medium">
                          {selectedIncidentForLitige.pris_par || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 font-heading mb-1">Description</p>
                      <p className="font-body text-sm">{selectedIncidentForLitige.description}</p>
                    </div>

                    {/* Photos preuves */}
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm font-heading text-[#0077A8] mb-3 flex items-center gap-2">
                        📷 {t('photos_preuves')}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Photo AVANT */}
                        <div className="space-y-2">
                          <p className="text-xs font-heading text-orange-600">{t('photo_avant')}</p>
                          {selectedIncidentForLitige.photo_avant_url ? (
                            <>
                              <img 
                                src={selectedIncidentForLitige.photo_avant_url} 
                                alt="Avant" 
                                className="w-full h-40 object-cover rounded-lg border-2 border-orange-300"
                              />
                              <p className="text-xs text-gray-500">
                                {selectedIncidentForLitige.photo_avant_timestamp && format(new Date(selectedIncidentForLitige.photo_avant_timestamp), 'dd/MM/yyyy HH:mm:ss')}
                              </p>
                              {selectedIncidentForLitige.photo_avant_hash && (
                                <div className="flex items-center gap-1">
                                  <p className="text-xs text-gray-400 font-mono truncate flex-1">
                                    SHA-256: {selectedIncidentForLitige.photo_avant_hash.substring(0, 20)}...
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedIncidentForLitige.photo_avant_hash);
                                      toast.success(t('copier_hash'));
                                    }}
                                  >
                                    📋
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                              Aucune photo
                            </div>
                          )}
                        </div>

                        {/* Photo APRÈS */}
                        <div className="space-y-2">
                          <p className="text-xs font-heading text-green-600">{t('photo_apres')}</p>
                          {selectedIncidentForLitige.photo_apres_url ? (
                            <>
                              <img 
                                src={selectedIncidentForLitige.photo_apres_url} 
                                alt="Après" 
                                className="w-full h-40 object-cover rounded-lg border-2 border-green-300"
                              />
                              <p className="text-xs text-gray-500">
                                {selectedIncidentForLitige.photo_apres_timestamp && format(new Date(selectedIncidentForLitige.photo_apres_timestamp), 'dd/MM/yyyy HH:mm:ss')}
                              </p>
                              {selectedIncidentForLitige.photo_apres_hash && (
                                <div className="flex items-center gap-1">
                                  <p className="text-xs text-gray-400 font-mono truncate flex-1">
                                    SHA-256: {selectedIncidentForLitige.photo_apres_hash.substring(0, 20)}...
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2"
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedIncidentForLitige.photo_apres_hash);
                                      toast.success(t('copier_hash'));
                                    }}
                                  >
                                    📋
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                              Aucune photo
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Photo client (signalement initial) */}
                    {selectedIncidentForLitige.photo_url && (
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs font-heading text-gray-600 mb-2">📸 Photo du signalement (client)</p>
                        <img 
                          src={selectedIncidentForLitige.photo_url} 
                          alt="Signalement" 
                          className="w-full max-w-xs h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Email pour envoi */}
                <div>
                  <label className="text-sm font-heading text-[#0077A8] block mb-2">
                    {t('envoyer_email_litige')}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={litigeEmail}
                      onChange={(e) => setLitigeEmail(e.target.value)}
                      className="rounded-xl flex-1"
                    />
                    <Button
                      onClick={async () => {
                        if (!litigeEmail) {
                          toast.error('Veuillez saisir un email');
                          return;
                        }
                        const inc = selectedIncidentForLitige;
                        const body = `
RAPPORT DE LITIGE - CAMPING PARADIS
===================================

INTERVENTION #${inc.id}

DATE
----
• Signalement: ${inc.date_saisie ? format(new Date(inc.date_saisie), 'dd/MM/yyyy HH:mm') : '-'}
• Résolution: ${inc.date_resolution ? format(new Date(inc.date_resolution), 'dd/MM/yyyy HH:mm') : '-'}

CLIENT
------
• Nom: ${inc.client_prenom} ${inc.client_nom}
• Séjour: ${inc.date_arrivee} → ${inc.date_depart}

HÉBERGEMENT
-----------
• Type: ${inc.logement ? 'Mobil-home' : 'Emplacement'}
• Numéro: ${inc.logement || inc.emplacement}

INTERVENANT
-----------
• Collaborateur: ${inc.pris_par || 'Non renseigné'}

DESCRIPTION
-----------
${inc.description}

PREUVES PHOTOGRAPHIQUES
-----------------------
${inc.photo_avant_url ? `• Photo AVANT: ${inc.photo_avant_url}\n  Date: ${inc.photo_avant_timestamp ? format(new Date(inc.photo_avant_timestamp), 'dd/MM/yyyy HH:mm:ss') : '-'}\n  Hash SHA-256: ${inc.photo_avant_hash || '-'}` : '• Photo AVANT: Non disponible'}

${inc.photo_apres_url ? `• Photo APRÈS: ${inc.photo_apres_url}\n  Date: ${inc.photo_apres_timestamp ? format(new Date(inc.photo_apres_timestamp), 'dd/MM/yyyy HH:mm:ss') : '-'}\n  Hash SHA-256: ${inc.photo_apres_hash || '-'}` : '• Photo APRÈS: Non disponible'}

${inc.photo_url ? `• Photo signalement client: ${inc.photo_url}` : ''}

---
Rapport généré le ${format(new Date(), 'dd/MM/yyyy HH:mm')}
Camping Paradis - Domaine de Gaujac
                        `.trim();

                        try {
                          await base44.integrations.Core.SendEmail({
                            to: litigeEmail,
                            subject: `Camping Paradis - Rapport de litige #${inc.logement || inc.emplacement} - ${inc.client_nom}`,
                            body
                          });
                          toast.success(t('rapport_litige_genere'));
                          setLitigeEmail('');
                        } catch (err) {
                          toast.error('Erreur lors de l\'envoi');
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowLitigeDialog(false);
              setSelectedIncidentForLitige(null);
              setLitigeEmail('');
            }} className="rounded-xl">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}