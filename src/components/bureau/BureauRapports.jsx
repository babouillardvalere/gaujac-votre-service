import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Calendar, Download, Mail, Loader2, Plus, Trash2,
  Clock, CheckCircle, XCircle, Eye, Settings, Play, FileSpreadsheet
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
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
    langue: 'Langue du rapport'
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
    langue: 'Report language'
  }
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

  const { data: configs = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ['rapport-configs'],
    queryFn: () => base44.entities.RapportConfig.list()
  });

  const { data: historique = [], isLoading: loadingHistorique } = useQuery({
    queryKey: ['rapport-historique'],
    queryFn: () => base44.entities.RapportHistorique.filter({}, '-date_generation', 50)
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

  // Calcul des métriques pour une période
  const calculateMetrics = (dateDebut, dateFin, reportLang = 'fr') => {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    
    const periodIncidents = incidents.filter(i => {
      const d = new Date(i.date_saisie);
      return d >= start && d <= end;
    });

    const resolus = periodIncidents.filter(i => i.statut === 'resolu');
    const urgents = periodIncidents.filter(i => i.urgent);
    const nonResolus = periodIncidents.filter(i => i.statut !== 'resolu');

    // Par catégorie
    const parCategorie = periodIncidents.reduce((acc, i) => {
      acc[i.categorie] = (acc[i.categorie] || 0) + 1;
      return acc;
    }, {});

    // Par hébergement
    const parHebergement = periodIncidents.reduce((acc, i) => {
      const loc = i.logement || i.emplacement || 'Inconnu';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {});

    // Temps moyens
    const tempsReaction = resolus
      .filter(i => i.temps_prise_en_charge)
      .map(i => i.temps_prise_en_charge);
    const avgReaction = tempsReaction.length > 0 
      ? Math.round(tempsReaction.reduce((a, b) => a + b, 0) / tempsReaction.length)
      : 0;

    const tempsResolution = resolus
      .filter(i => i.temps_total_intervention)
      .map(i => i.temps_total_intervention);
    const avgResolution = tempsResolution.length > 0
      ? Math.round(tempsResolution.reduce((a, b) => a + b, 0) / tempsResolution.length)
      : 0;

    // Interventions les plus longues
    const plusLongues = [...resolus]
      .filter(i => i.temps_total_intervention)
      .sort((a, b) => b.temps_total_intervention - a.temps_total_intervention)
      .slice(0, 5);

    // Collaborateurs actifs
    const parCollaborateur = resolus.reduce((acc, i) => {
      if (i.pris_par) acc[i.pris_par] = (acc[i.pris_par] || 0) + 1;
      return acc;
    }, {});

    // Avis clients de la période
    const periodAvis = avis.filter(a => {
      const d = new Date(a.created_date);
      return d >= start && d <= end;
    });

    const avgReactivite = periodAvis.length > 0
      ? (periodAvis.reduce((s, a) => s + (a.note_reactivite || 0), 0) / periodAvis.length).toFixed(1)
      : 0;
    const avgAmabilite = periodAvis.length > 0
      ? (periodAvis.reduce((s, a) => s + (a.note_amabilite || 0), 0) / periodAvis.length).toFixed(1)
      : 0;
    const avgQualite = periodAvis.length > 0
      ? (periodAvis.reduce((s, a) => s + (a.note_intervention || 0), 0) / periodAvis.length).toFixed(1)
      : 0;
    const avgGlobale = periodAvis.length > 0
      ? (periodAvis.reduce((s, a) => s + (a.note_globale || 0), 0) / periodAvis.length).toFixed(1)
      : 0;

    return {
      periode: { debut: dateDebut, fin: dateFin },
      total: periodIncidents.length,
      urgences: urgents.length,
      resolus: resolus.length,
      nonResolus: nonResolus.length,
      tauxNonResolu: periodIncidents.length > 0 
        ? ((nonResolus.length / periodIncidents.length) * 100).toFixed(1) 
        : 0,
      parCategorie,
      parHebergement,
      avgReaction,
      avgResolution,
      plusLongues,
      parCollaborateur,
      avis: {
        total: periodAvis.length,
        avgReactivite,
        avgAmabilite,
        avgQualite,
        avgGlobale
      },
      langue: reportLang
    };
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

  // Générer un rapport
  const generateReport = async (type, config = null) => {
    setGenerating(true);
    try {
      const reportLang = config?.langue || lang;
      const { debut, fin } = getPeriodDates(type);
      const metriques = calculateMetrics(debut, fin, reportLang);

      // Créer l'historique
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

      // Mettre à jour la config
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
    
    return `
RAPPORT D'ACTIVITÉ - CAMPING PARADIS
====================================

Période: ${metriques.periode.debut} ${tReport('au')} ${metriques.periode.fin}

INTERVENTIONS
-------------
• ${tReport('total_interventions')}: ${metriques.total}
• ${tReport('urgences')}: ${metriques.urgences}
• Résolues: ${metriques.resolus}
• Non résolues: ${metriques.nonResolus} (${metriques.tauxNonResolu}%)

TEMPS MOYENS
------------
• ${tReport('temps_moyen_reaction')}: ${metriques.avgReaction} min
• ${tReport('temps_moyen_resolution')}: ${metriques.avgResolution} min

PAR CATÉGORIE
-------------
${Object.entries(metriques.parCategorie).map(([k, v]) => `• ${k}: ${v}`).join('\n')}

SATISFACTION CLIENT
-------------------
• Réactivité: ${metriques.avis.avgReactivite}/5
• Amabilité: ${metriques.avis.avgAmabilite}/5
• Qualité: ${metriques.avis.avgQualite}/5
• Note globale: ${metriques.avis.avgGlobale}/5

---
Rapport généré automatiquement par Camping Paradis
    `.trim();
  };

  // Générer CSV
  const generateCSV = (metriques) => {
    const rows = [
      ['Métrique', 'Valeur'],
      ['Total interventions', metriques.total],
      ['Urgences', metriques.urgences],
      ['Résolues', metriques.resolus],
      ['Non résolues', metriques.nonResolus],
      ['Taux non résolu (%)', metriques.tauxNonResolu],
      ['Temps moyen réaction (min)', metriques.avgReaction],
      ['Temps moyen résolution (min)', metriques.avgResolution],
      [''],
      ['Catégorie', 'Nombre'],
      ...Object.entries(metriques.parCategorie).map(([k, v]) => [k, v]),
      [''],
      ['Hébergement', 'Nombre'],
      ...Object.entries(metriques.parHebergement).map(([k, v]) => [k, v]),
      [''],
      ['Satisfaction', 'Note'],
      ['Réactivité', metriques.avis.avgReactivite],
      ['Amabilité', metriques.avis.avgAmabilite],
      ['Qualité', metriques.avis.avgQualite],
      ['Note globale', metriques.avis.avgGlobale]
    ];

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

  // Prévisualiser
  const handlePreview = (type) => {
    const config = configs.find(c => c.type === type);
    const reportLang = config?.langue || lang;
    const { debut, fin } = getPeriodDates(type);
    const metriques = calculateMetrics(debut, fin, reportLang);
    setPreviewData({ type, metriques, langue: reportLang });
    setPreviewType(type);
    setShowPreview(true);
  };

  // Créer une config par défaut
  const createDefaultConfig = async (type) => {
    await createConfigMutation.mutateAsync({
      type,
      actif: false,
      destinataires: [],
      categories_destinataires: [],
      format: 'pdf',
      heure_envoi: '08:00',
      jour_envoi: type === 'hebdomadaire' ? 1 : 1,
      langue: lang
    });
  };

  const getConfig = (type) => configs.find(c => c.type === type);

  const ConfigCard = ({ type }) => {
    const config = getConfig(type);
    const [localConfig, setLocalConfig] = useState(config || {
      actif: false,
      destinataires: [],
      categories_destinataires: [],
      format: 'pdf',
      heure_envoi: '08:00',
      jour_envoi: 1,
      langue: lang
    });

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

    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

    return (
      <Card className="border-2 border-[#FFA500]/30 rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t(type)}
            </CardTitle>
            <Badge className={localConfig.actif ? 'bg-green-500' : 'bg-gray-400'}>
              {localConfig.actif ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Activation */}
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={localConfig.actif}
              onCheckedChange={(c) => setLocalConfig({ ...localConfig, actif: c })}
            />
            <span className="font-body">{localConfig.actif ? t('desactiver') : t('activer')}</span>
          </label>

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

          {/* Heure d'envoi */}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-[#0077A8] flex items-center gap-2">
          <FileText className="w-6 h-6" />
          {t('title')}
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#FFA500]/20 rounded-xl">
          <TabsTrigger value="config" className="rounded-lg data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            {t('config')}
          </TabsTrigger>
          <TabsTrigger value="historique" className="rounded-lg data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            {t('historique')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <ConfigCard type="quotidien" />
            <ConfigCard type="hebdomadaire" />
            <ConfigCard type="mensuel" />
          </div>
        </TabsContent>

        <TabsContent value="historique" className="mt-4">
          <Card className="border-2 border-[#FFA500]/30 rounded-xl">
            <CardContent className="p-0">
              {loadingHistorique ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FFA500]" />
                </div>
              ) : historique.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{t('aucun_rapport')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#FFA500]/10">
                      <tr className="text-left text-xs font-heading text-[#0077A8]">
                        <th className="p-3">Type</th>
                        <th className="p-3">{t('periode')}</th>
                        <th className="p-3">Généré le</th>
                        <th className="p-3">Envoi</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historique.map(rapport => (
                        <tr key={rapport.id} className="border-t hover:bg-[#FFA500]/5">
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
                                Envoyé
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-400 text-white">
                                <XCircle className="w-3 h-3 mr-1" />
                                Non envoyé
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
    </div>
  );
}