import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Download, AlertTriangle, Clock, Star, Users, Home, 
  TrendingUp, BarChart3, PieChart, Calendar, Target, Award, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const COLORS = ['#00AEEF', '#FFD700', '#FFA500', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

const translations = {
  fr: {
    rapport_activite: 'Rapport d\'activité',
    camping_paradis: 'Camping Paradis - Domaine de Gaujac',
    periode: 'Période',
    du: 'Du',
    au: 'au',
    interventions: 'Interventions',
    total: 'Total',
    urgences: 'Urgences',
    resolues: 'Résolues',
    non_resolues: 'Non résolues',
    taux_non_resolu: 'Taux non résolu',
    temps_moyens: 'Temps moyens',
    temps_reaction: 'Temps de réaction',
    temps_resolution: 'Temps de résolution',
    par_categorie: 'Répartition par catégorie',
    par_hebergement: 'Par hébergement',
    interventions_longues: 'Top 5 - Interventions les plus longues',
    collaborateurs: 'Activité des collaborateurs',
    satisfaction: 'Satisfaction client',
    reactivite: 'Réactivité',
    amabilite: 'Amabilité',
    qualite: 'Qualité',
    note_globale: 'Note globale',
    avis_recus: 'avis reçus',
    telecharger_pdf: 'Télécharger PDF',
    minutes: 'min',
    hebergement: 'Hébergement',
    duree: 'Durée',
    interventions_label: 'interventions',
    sommaire: 'Sommaire',
    synthese: 'Synthèse',
    details: 'Détails',
    top5_categories: 'Top 5 catégories',
    top5_hebergements: 'Top 5 hébergements',
    distribution_notes: 'Distribution des notes',
    evolution: 'Évolution',
    performance: 'Performance',
    moyennes: 'Moyennes',
    totaux: 'Totaux',
    pourcentages: 'Pourcentages',
    classement: 'Classement',
    rapport_genere: 'Rapport généré le',
    page: 'Page',
    quotidien: 'Quotidien',
    hebdomadaire: 'Hebdomadaire',
    mensuel: 'Mensuel',
    comparaison_temps: 'Comparaison des temps',
    repartition_urgences: 'Répartition urgences/normal',
    urgent: 'Urgent',
    normal: 'Normal',
    taux_resolution: 'Taux de résolution',
    nb_interventions: 'Nb interventions'
  },
  en: {
    rapport_activite: 'Activity Report',
    camping_paradis: 'Camping Paradis - Domaine de Gaujac',
    periode: 'Period',
    du: 'From',
    au: 'to',
    interventions: 'Interventions',
    total: 'Total',
    urgences: 'Emergencies',
    resolues: 'Resolved',
    non_resolues: 'Unresolved',
    taux_non_resolu: 'Unresolved rate',
    temps_moyens: 'Average times',
    temps_reaction: 'Reaction time',
    temps_resolution: 'Resolution time',
    par_categorie: 'Distribution by category',
    par_hebergement: 'By accommodation',
    interventions_longues: 'Top 5 - Longest interventions',
    collaborateurs: 'Staff activity',
    satisfaction: 'Customer satisfaction',
    reactivite: 'Responsiveness',
    amabilite: 'Friendliness',
    qualite: 'Quality',
    note_globale: 'Overall rating',
    avis_recus: 'reviews received',
    telecharger_pdf: 'Download PDF',
    minutes: 'min',
    hebergement: 'Accommodation',
    duree: 'Duration',
    interventions_label: 'interventions',
    sommaire: 'Summary',
    synthese: 'Overview',
    details: 'Details',
    top5_categories: 'Top 5 categories',
    top5_hebergements: 'Top 5 accommodations',
    distribution_notes: 'Rating distribution',
    evolution: 'Evolution',
    performance: 'Performance',
    moyennes: 'Averages',
    totaux: 'Totals',
    pourcentages: 'Percentages',
    classement: 'Ranking',
    rapport_genere: 'Report generated on',
    page: 'Page',
    quotidien: 'Daily',
    hebdomadaire: 'Weekly',
    mensuel: 'Monthly',
    comparaison_temps: 'Time comparison',
    repartition_urgences: 'Urgent/Normal distribution',
    urgent: 'Urgent',
    normal: 'Normal',
    taux_resolution: 'Resolution rate',
    nb_interventions: 'Nb interventions'
  }
};

const categoryLabels = {
  gaz: { fr: 'Gaz', en: 'Gas', emoji: '🔥' },
  eau: { fr: 'Eau/Fuite', en: 'Water/Leak', emoji: '💧' },
  electricite: { fr: 'Électricité', en: 'Electricity', emoji: '⚡' },
  plomberie: { fr: 'Plomberie', en: 'Plumbing', emoji: '🔧' },
  espace_vert: { fr: 'Espace vert', en: 'Garden', emoji: '🌿' },
  divers_technique: { fr: 'Divers tech.', en: 'Other tech.', emoji: '🛠' },
  mobilier: { fr: 'Mobilier', en: 'Furniture', emoji: '🧰' },
  structurel: { fr: 'Structurel', en: 'Structural', emoji: '🏚' },
  souris: { fr: 'Souris', en: 'Mice', emoji: '🐭' },
  guepes: { fr: 'Guêpes', en: 'Wasps', emoji: '🐝' },
  frelons: { fr: 'Frelons', en: 'Hornets', emoji: '🐝' },
  fourmis: { fr: 'Fourmis', en: 'Ants', emoji: '🐜' },
  moustiques: { fr: 'Moustiques', en: 'Mosquitoes', emoji: '🦟' },
  literie: { fr: 'Literie', en: 'Bedding', emoji: '🛏' },
  nettoyage: { fr: 'Nettoyage', en: 'Cleaning', emoji: '🧽' },
  vaisselle: { fr: 'Vaisselle', en: 'Dishes', emoji: '🍽' },
  poubelle: { fr: 'Poubelle', en: 'Trash', emoji: '🗑' },
  produit_manquant: { fr: 'Produit manquant', en: 'Missing product', emoji: '🧴' },
  autre: { fr: 'Autre', en: 'Other', emoji: '❓' },
  terrasse: { fr: 'Terrasse', en: 'Terrace', emoji: '🏡' },
  materiel_menage: { fr: 'Matériel ménage', en: 'Cleaning equipment', emoji: '🧹' }
};

export default function RapportPreview({ data }) {
  const reportRef = useRef(null);
  const lang = data.langue || 'fr';
  const t = (key) => translations[lang]?.[key] || translations['fr']?.[key] || key;
  const { metriques } = data;
  const mc = metriques?.metricsConfig || {};

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return `0 ${t('minutes')}`;
    if (minutes < 60) return `${minutes} ${t('minutes')}`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}` : `${h}h`;
  };

  const getTypeLabel = () => {
    if (data.type === 'quotidien') return t('quotidien');
    if (data.type === 'hebdomadaire') return t('hebdomadaire');
    if (data.type === 'mensuel') return t('mensuel');
    return data.type;
  };

  // Données pour les graphiques
  const categorieData = Object.entries(metriques?.parCategorie || {}).map(([key, value]) => ({
    name: categoryLabels[key]?.[lang] || key,
    value,
    emoji: categoryLabels[key]?.emoji || '❓'
  })).sort((a, b) => b.value - a.value);

  const hebergementData = Object.entries(metriques?.parHebergement || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const collaborateurData = Object.entries(metriques?.parCollaborateur || {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Données pour graphique urgence
  const urgenceData = [
    { name: t('urgent'), value: metriques?.urgences || 0, fill: '#ef4444' },
    { name: t('normal'), value: (metriques?.total || 0) - (metriques?.urgences || 0), fill: '#10b981' }
  ];

  // Données pour graphique temps comparaison
  const tempsData = [
    { name: t('temps_reaction'), value: metriques?.avgReaction || 0, fill: '#00AEEF' },
    { name: t('temps_resolution'), value: metriques?.avgResolution || 0, fill: '#FFA500' }
  ];

  // Distribution des notes satisfaction
  const satisfactionDistribution = metriques?.avis ? [
    { name: t('reactivite'), value: parseFloat(metriques.avis.avgReactivite) || 0, fullMark: 5 },
    { name: t('amabilite'), value: parseFloat(metriques.avis.avgAmabilite) || 0, fullMark: 5 },
    { name: t('qualite'), value: parseFloat(metriques.avis.avgQualite) || 0, fullMark: 5 }
  ] : [];

  // Générer PDF haute qualité
  const downloadPDF = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`rapport_${data.type}_${metriques?.periode?.debut || 'export'}.pdf`);
  };

  const StatCard = ({ icon: Icon, label, value, color = '#00AEEF', subvalue, large }) => (
    <div className={`bg-white rounded-xl ${large ? 'p-6' : 'p-4'} border-2 border-gray-100 shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className={`${large ? 'w-14 h-14' : 'w-10 h-10'} rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
          <Icon className={`${large ? 'w-7 h-7' : 'w-5 h-5'}`} style={{ color }} />
        </div>
        <div>
          <p className={`${large ? 'text-sm' : 'text-xs'} text-gray-500`}>{label}</p>
          <p className={`${large ? 'text-3xl' : 'text-xl'} font-bold`} style={{ color }}>{value}</p>
          {subvalue && <p className="text-xs text-gray-400">{subvalue}</p>}
        </div>
      </div>
    </div>
  );

  const SectionTitle = ({ icon: Icon, title, color = '#0077A8' }) => (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b-2" style={{ borderColor: `${color}30` }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h2 className="text-xl font-bold" style={{ color }}>{title}</h2>
    </div>
  );

  const showInterventions = mc.interventions !== false && metriques?.total !== undefined;
  const showTemps = mc.temps !== false && metriques?.avgReaction !== undefined;
  const showCategories = mc.categories !== false && categorieData.length > 0;
  const showHebergements = mc.hebergements !== false && hebergementData.length > 0;
  const showCollaborateurs = mc.collaborateurs !== false && collaborateurData.length > 0;
  const showSatisfaction = mc.satisfaction !== false && metriques?.avis;
  const showTopLongues = mc.topLongues !== false && metriques?.plusLongues?.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={downloadPDF} className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl">
          <Download className="w-4 h-4 mr-2" />
          {t('telecharger_pdf')}
        </Button>
      </div>

      <div ref={reportRef} className="bg-white p-8 rounded-xl space-y-8" style={{ minWidth: '800px' }}>
        
        {/* === PAGE DE TITRE === */}
        <div className="bg-gradient-to-br from-[#00AEEF] via-[#0077A8] to-[#005580] rounded-2xl p-8 text-white relative overflow-hidden">
          {/* Motif décoratif */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            {/* Logo et titre */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6930cc5060a27d8dfd0bf5fd/aa24decb4_logo.png"
                  alt="Logo"
                  className="w-16 h-16 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{t('rapport_activite')}</h1>
                <p className="text-xl opacity-90">{t('camping_paradis')}</p>
              </div>
            </div>

            {/* Type de rapport */}
            <div className="inline-block bg-white/20 backdrop-blur rounded-xl px-6 py-3 mb-6">
              <span className="text-lg font-semibold">{getTypeLabel()}</span>
            </div>

            {/* Période */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="flex items-center gap-4">
                <Calendar className="w-8 h-8" />
                <div>
                  <p className="text-sm opacity-80">{t('periode')}</p>
                  <p className="text-2xl font-bold">
                    {t('du')} {metriques?.periode?.debut} {t('au')} {metriques?.periode?.fin}
                  </p>
                </div>
              </div>
            </div>

            {/* Date de génération */}
            <p className="mt-6 text-sm opacity-70">
              {t('rapport_genere')} {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: lang === 'fr' ? fr : enUS })}
            </p>
          </div>
        </div>

        {/* === SOMMAIRE (si beaucoup de sections) === */}
        {(showInterventions || showTemps || showCategories || showHebergements || showCollaborateurs || showSatisfaction) && (
          <Card className="rounded-xl border-2 border-[#00AEEF]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-[#0077A8]">
                <FileText className="w-5 h-5" />
                {t('sommaire')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {showInterventions && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-[#00AEEF]" />
                    <span>{t('interventions')}</span>
                  </div>
                )}
                {showTemps && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-[#FFA500]" />
                    <span>{t('temps_moyens')}</span>
                  </div>
                )}
                {showCategories && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
                    <span>{t('par_categorie')}</span>
                  </div>
                )}
                {showHebergements && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span>{t('par_hebergement')}</span>
                  </div>
                )}
                {showCollaborateurs && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-[#ec4899]" />
                    <span>{t('collaborateurs')}</span>
                  </div>
                )}
                {showSatisfaction && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
                    <span>{t('satisfaction')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* === SECTION INTERVENTIONS === */}
        {showInterventions && (
          <div className="space-y-4">
            <SectionTitle icon={BarChart3} title={t('interventions')} color="#00AEEF" />
            
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={BarChart3} label={t('total')} value={metriques.total} color="#00AEEF" large />
              <StatCard icon={AlertTriangle} label={t('urgences')} value={metriques.urgences} color="#ef4444" large />
              <StatCard icon={TrendingUp} label={t('resolues')} value={metriques.resolus} color="#10b981" large />
              <StatCard 
                icon={Target} 
                label={t('taux_resolution')} 
                value={`${metriques.total > 0 ? ((metriques.resolus / metriques.total) * 100).toFixed(1) : 0}%`} 
                color="#8b5cf6" 
                large
              />
            </div>

            {/* Graphique répartition urgences */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">{t('repartition_urgences')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={urgenceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          dataKey="value"
                          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {urgenceData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Tableau récapitulatif */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">{t('synthese')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      <tr className="flex justify-between py-2">
                        <td className="text-gray-600">{t('total')}</td>
                        <td className="font-bold text-[#00AEEF]">{metriques.total}</td>
                      </tr>
                      <tr className="flex justify-between py-2">
                        <td className="text-gray-600">{t('urgences')}</td>
                        <td className="font-bold text-red-500">{metriques.urgences}</td>
                      </tr>
                      <tr className="flex justify-between py-2">
                        <td className="text-gray-600">{t('resolues')}</td>
                        <td className="font-bold text-green-500">{metriques.resolus}</td>
                      </tr>
                      <tr className="flex justify-between py-2">
                        <td className="text-gray-600">{t('non_resolues')}</td>
                        <td className="font-bold text-orange-500">{metriques.nonResolus}</td>
                      </tr>
                      <tr className="flex justify-between py-2 bg-gray-50 -mx-4 px-4 rounded">
                        <td className="text-gray-600">{t('taux_non_resolu')}</td>
                        <td className="font-bold text-[#FFA500]">{metriques.tauxNonResolu}%</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* === SECTION TEMPS MOYENS === */}
        {showTemps && (
          <div className="space-y-4">
            <SectionTitle icon={Clock} title={t('temps_moyens')} color="#FFA500" />
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Graphique barres comparaison */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">{t('comparaison_temps')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tempsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" unit=" min" />
                        <YAxis type="category" dataKey="name" width={120} />
                        <Tooltip formatter={(value) => `${value} min`} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {tempsData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cartes temps */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-r from-[#00AEEF]/10 to-[#00AEEF]/5 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <Zap className="w-10 h-10 text-[#00AEEF]" />
                    <div>
                      <p className="text-sm text-gray-600">{t('temps_reaction')}</p>
                      <p className="text-4xl font-bold text-[#00AEEF]">{formatDuration(metriques.avgReaction)}</p>
                      <p className="text-xs text-gray-500">{t('moyennes')}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-[#FFA500]/10 to-[#FFA500]/5 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <Clock className="w-10 h-10 text-[#FFA500]" />
                    <div>
                      <p className="text-sm text-gray-600">{t('temps_resolution')}</p>
                      <p className="text-4xl font-bold text-[#FFA500]">{formatDuration(metriques.avgResolution)}</p>
                      <p className="text-xs text-gray-500">{t('moyennes')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === SECTION PAR CATÉGORIE === */}
        {showCategories && (
          <div className="space-y-4">
            <SectionTitle icon={PieChart} title={t('par_categorie')} color="#8b5cf6" />
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Camembert */}
              <Card className="rounded-xl">
                <CardContent className="pt-6">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={categorieData.slice(0, 8)}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {categorieData.slice(0, 8).map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Liste classement */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    {t('classement')} - {t('top5_categories')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categorieData.slice(0, 5).map((cat, idx) => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" 
                             style={{ backgroundColor: COLORS[idx] }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{cat.emoji} {cat.name}</span>
                            <span className="font-bold">{cat.value}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${(cat.value / categorieData[0].value) * 100}%`,
                                backgroundColor: COLORS[idx]
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Totaux */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('total')}</span>
                      <span className="font-bold">{categorieData.reduce((sum, c) => sum + c.value, 0)} {t('interventions_label')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* === SECTION PAR HÉBERGEMENT === */}
        {showHebergements && (
          <div className="space-y-4">
            <SectionTitle icon={Home} title={t('par_hebergement')} color="#10b981" />
            
            <Card className="rounded-xl">
              <CardContent className="pt-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hebergementData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} name={t('nb_interventions')}>
                        {hebergementData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Résumé */}
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#10b981]">{hebergementData.length}</p>
                    <p className="text-xs text-gray-500">{t('hebergement')}s concernés</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#00AEEF]">{hebergementData[0]?.name || '-'}</p>
                    <p className="text-xs text-gray-500">Top 1</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#FFA500]">{hebergementData[0]?.value || 0}</p>
                    <p className="text-xs text-gray-500">{t('interventions_label')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === SECTION COLLABORATEURS === */}
        {showCollaborateurs && (
          <div className="space-y-4">
            <SectionTitle icon={Users} title={t('collaborateurs')} color="#ec4899" />
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Graphique barres */}
              <Card className="rounded-xl">
                <CardContent className="pt-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={collaborateurData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#ec4899" radius={[8, 8, 0, 0]} name={t('interventions_label')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cartes collaborateurs */}
              <div className="grid grid-cols-2 gap-3">
                {collaborateurData.slice(0, 4).map((collab, idx) => (
                  <div key={collab.name} className="bg-gradient-to-br from-[#ec4899]/10 to-[#ec4899]/5 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 bg-[#ec4899]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-[#ec4899] font-bold">{idx + 1}</span>
                    </div>
                    <p className="font-bold text-[#0077A8] truncate">{collab.name}</p>
                    <p className="text-3xl font-bold text-[#ec4899]">{collab.value}</p>
                    <p className="text-xs text-gray-500">{t('interventions_label')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === SECTION TOP INTERVENTIONS LONGUES === */}
        {showTopLongues && (
          <div className="space-y-4">
            <SectionTitle icon={Clock} title={t('interventions_longues')} color="#f97316" />
            
            <Card className="rounded-xl">
              <CardContent className="pt-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2">#</th>
                      <th className="pb-2">{t('hebergement')}</th>
                      <th className="pb-2">Catégorie</th>
                      <th className="pb-2">{t('duree')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {metriques.plusLongues.map((intervention, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="py-3">
                          <div className="w-6 h-6 rounded-full bg-[#f97316]/20 flex items-center justify-center text-[#f97316] font-bold text-xs">
                            {idx + 1}
                          </div>
                        </td>
                        <td className="py-3 font-medium">{intervention.logement || intervention.emplacement || '-'}</td>
                        <td className="py-3">
                          <Badge className="bg-gray-100 text-gray-700">
                            {categoryLabels[intervention.categorie]?.emoji} {categoryLabels[intervention.categorie]?.[lang] || intervention.categorie}
                          </Badge>
                        </td>
                        <td className="py-3 font-bold text-[#f97316]">
                          {formatDuration(intervention.temps_total_intervention)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === SECTION SATISFACTION === */}
        {showSatisfaction && (
          <div className="space-y-4">
            <SectionTitle icon={Star} title={t('satisfaction')} color="#FFD700" />
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Graphique barres satisfaction */}
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">{t('distribution_notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={satisfactionDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip formatter={(value) => `${value}/5`} />
                        <Bar dataKey="value" fill="#FFD700" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cartes notes */}
              <div className="space-y-3">
                {[
                  { key: 'reactivite', value: metriques.avis.avgReactivite, color: '#00AEEF' },
                  { key: 'amabilite', value: metriques.avis.avgAmabilite, color: '#10b981' },
                  { key: 'qualite', value: metriques.avis.avgQualite, color: '#8b5cf6' }
                ].map(({ key, value, color }) => (
                  <div key={key} className="bg-white rounded-xl p-4 border shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t(key)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(parseFloat(value)) ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="text-3xl font-bold" style={{ color }}>{value}/5</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note globale mise en avant */}
            <div className="bg-gradient-to-r from-[#FFD700]/20 via-[#FFA500]/10 to-[#FFD700]/20 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#FFD700] rounded-2xl flex items-center justify-center">
                    <Star className="w-8 h-8 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#0077A8]">{t('note_globale')}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-6 h-6 ${s <= Math.round(parseFloat(metriques.avis.avgGlobale)) ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-bold text-[#FFA500]">{metriques.avis.avgGlobale}</p>
                  <p className="text-sm text-gray-500">/5</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#FFD700]/30 text-center">
                <span className="text-sm text-gray-600">
                  {metriques.avis.total} {t('avis_recus')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* === FOOTER === */}
        <div className="border-t-2 border-gray-100 pt-6 mt-8">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_6930cc5060a27d8dfd0bf5fd/aa24decb4_logo.png"
                alt="Logo"
                className="h-6 opacity-50"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span>{t('camping_paradis')}</span>
            </div>
            <span>{t('rapport_genere')} {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}