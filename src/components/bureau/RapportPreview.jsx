import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Download, AlertTriangle, Clock, Star, Users, Home, 
  TrendingUp, BarChart3, PieChart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const COLORS = ['#00AEEF', '#FFD700', '#FFA500', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4'];

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
    par_categorie: 'Par catégorie',
    par_hebergement: 'Par hébergement',
    interventions_longues: 'Interventions les plus longues',
    collaborateurs: 'Collaborateurs actifs',
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
    interventions_label: 'interventions'
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
    par_categorie: 'By category',
    par_hebergement: 'By accommodation',
    interventions_longues: 'Longest interventions',
    collaborateurs: 'Active staff',
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
    interventions_label: 'interventions'
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
  autre: { fr: 'Autre', en: 'Other', emoji: '❓' }
};

export default function RapportPreview({ data }) {
  const reportRef = useRef(null);
  const lang = data.langue || 'fr';
  const t = (key) => translations[lang]?.[key] || translations['fr']?.[key] || key;
  const { metriques } = data;

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} ${t('minutes')}`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}${t('minutes')}` : `${h}h`;
  };

  // Données pour les graphiques
  const categorieData = Object.entries(metriques.parCategorie || {}).map(([key, value]) => ({
    name: categoryLabels[key]?.[lang] || key,
    value,
    emoji: categoryLabels[key]?.emoji || '❓'
  })).sort((a, b) => b.value - a.value);

  const hebergementData = Object.entries(metriques.parHebergement || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const collaborateurData = Object.entries(metriques.parCollaborateur || {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Générer PDF
  const downloadPDF = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false
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

    pdf.save(`rapport_${data.type}_${metriques.periode.debut}.pdf`);
  };

  const StatCard = ({ icon: Icon, label, value, color = '#00AEEF', subvalue }) => (
    <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold" style={{ color }}>{value}</p>
          {subvalue && <p className="text-xs text-gray-400">{subvalue}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={downloadPDF} className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl">
          <Download className="w-4 h-4 mr-2" />
          {t('telecharger_pdf')}
        </Button>
      </div>

      <div ref={reportRef} className="bg-gray-50 p-6 rounded-xl space-y-6">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-[#00AEEF] to-[#0077A8] rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <FileText className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold">{t('rapport_activite')}</h1>
              <p className="opacity-80">{t('camping_paradis')}</p>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-lg p-3">
            <p className="text-sm">
              {t('periode')}: {t('du')} <strong>{metriques.periode.debut}</strong> {t('au')} <strong>{metriques.periode.fin}</strong>
            </p>
          </div>
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={BarChart3} label={t('total')} value={metriques.total} color="#00AEEF" />
          <StatCard icon={AlertTriangle} label={t('urgences')} value={metriques.urgences} color="#ef4444" />
          <StatCard icon={TrendingUp} label={t('resolues')} value={metriques.resolus} color="#10b981" />
          <StatCard 
            icon={Clock} 
            label={t('taux_non_resolu')} 
            value={`${metriques.tauxNonResolu}%`} 
            color="#FFA500" 
            subvalue={`${metriques.nonResolus} ${t('non_resolues')}`}
          />
        </div>

        {/* Temps moyens */}
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#00AEEF]" />
              {t('temps_moyens')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#00AEEF]/10 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600">{t('temps_reaction')}</p>
                <p className="text-2xl font-bold text-[#00AEEF]">{formatDuration(metriques.avgReaction)}</p>
              </div>
              <div className="bg-[#FFD700]/20 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600">{t('temps_resolution')}</p>
                <p className="text-2xl font-bold text-[#FFA500]">{formatDuration(metriques.avgResolution)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Par catégorie */}
        {categorieData.length > 0 && (
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#00AEEF]" />
                {t('par_categorie')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={categorieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${value}`}
                      >
                        {categorieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {categorieData.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span>{cat.emoji} {cat.name}</span>
                      </span>
                      <Badge className="bg-gray-200 text-gray-700">{cat.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Par hébergement */}
        {hebergementData.length > 0 && (
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="w-5 h-5 text-[#00AEEF]" />
                {t('par_hebergement')} (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hebergementData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00AEEF" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collaborateurs */}
        {collaborateurData.length > 0 && (
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00AEEF]" />
                {t('collaborateurs')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {collaborateurData.map((collab, idx) => (
                  <div key={collab.name} className="bg-gradient-to-br from-[#00AEEF]/10 to-[#00AEEF]/5 rounded-xl p-3 text-center">
                    <p className="font-bold text-[#0077A8]">{collab.name}</p>
                    <p className="text-2xl font-bold text-[#00AEEF]">{collab.value}</p>
                    <p className="text-xs text-gray-500">{t('interventions_label')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Satisfaction */}
        <Card className="rounded-xl bg-gradient-to-br from-[#FFD700]/10 to-[#FFA500]/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-[#FFD700]" />
              {t('satisfaction')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">{t('reactivite')}</p>
                <p className="text-2xl font-bold text-[#00AEEF]">{metriques.avis.avgReactivite}/5</p>
                <div className="flex justify-center mt-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3 h-3 ${s <= Math.round(metriques.avis.avgReactivite) ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">{t('amabilite')}</p>
                <p className="text-2xl font-bold text-[#00AEEF]">{metriques.avis.avgAmabilite}/5</p>
                <div className="flex justify-center mt-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3 h-3 ${s <= Math.round(metriques.avis.avgAmabilite) ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">{t('qualite')}</p>
                <p className="text-2xl font-bold text-[#00AEEF]">{metriques.avis.avgQualite}/5</p>
                <div className="flex justify-center mt-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-3 h-3 ${s <= Math.round(metriques.avis.avgQualite) ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm border-2 border-[#FFD700]">
                <p className="text-xs text-gray-500">{t('note_globale')}</p>
                <p className="text-3xl font-bold text-[#FFA500]">{metriques.avis.avgGlobale}/5</p>
                <div className="flex justify-center mt-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(metriques.avis.avgGlobale) ? 'text-[#FFD700] fill-[#FFD700]' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-700">{metriques.avis.total}</p>
                <p className="text-xs text-gray-400">{t('avis_recus')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t">
          <p>Rapport généré automatiquement par Camping Paradis • {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}</p>
        </div>
      </div>
    </div>
  );
}