import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, Smile, Sparkles, Smartphone, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#22c55e', '#eab308', '#ef4444'];
const COLORS_APP = ['#00AEEF', '#FFD700', '#FFA500'];

export default function BureauStatistiquesAvis({ lang = 'fr' }) {
  // Charger les avis d'intervention
  const { data: avisInterventions = [] } = useQuery({
    queryKey: ['avis-interventions-stats'],
    queryFn: () => base44.entities.Avis.list(),
    staleTime: 60000
  });

  // Charger les avis sur l'application
  const { data: avisApplication = [] } = useQuery({
    queryKey: ['avis-application-stats'],
    queryFn: () => base44.entities.AvisApplication.list(),
    staleTime: 60000
  });

  // ============= STATISTIQUES INTERVENTIONS =============
  const statsInterventions = useMemo(() => {
    const total = avisInterventions.length;
    if (total === 0) return null;

    const moyenneReactivite = avisInterventions.reduce((sum, a) => sum + (a.note_reactivite || 0), 0) / total;
    const moyenneAmabilite = avisInterventions.reduce((sum, a) => sum + (a.note_amabilite || 0), 0) / total;
    const moyenneQualite = avisInterventions.reduce((sum, a) => sum + (a.note_intervention || 0), 0) / total;

    // Note globale intervention = moyenne des 3 critères
    const noteGlobaleIntervention = (moyenneReactivite + moyenneAmabilite + moyenneQualite) / 3;

    return {
      total,
      moyenneReactivite: moyenneReactivite.toFixed(2),
      moyenneAmabilite: moyenneAmabilite.toFixed(2),
      moyenneQualite: moyenneQualite.toFixed(2),
      noteGlobaleIntervention: noteGlobaleIntervention.toFixed(2)
    };
  }, [avisInterventions]);

  // Distribution des notes par critère
  const distributionReactivite = useMemo(() => {
    return [1, 2, 3, 4, 5].map(note => ({
      note: `${note}⭐`,
      count: avisInterventions.filter(a => Math.round(a.note_reactivite) === note).length
    }));
  }, [avisInterventions]);

  const distributionAmabilite = useMemo(() => {
    return [1, 2, 3, 4, 5].map(note => ({
      note: `${note}⭐`,
      count: avisInterventions.filter(a => Math.round(a.note_amabilite) === note).length
    }));
  }, [avisInterventions]);

  const distributionQualite = useMemo(() => {
    return [1, 2, 3, 4, 5].map(note => ({
      note: `${note}⭐`,
      count: avisInterventions.filter(a => Math.round(a.note_intervention) === note).length
    }));
  }, [avisInterventions]);

  // ============= STATISTIQUES APPLICATION =============
  const statsApplication = useMemo(() => {
    const total = avisApplication.length;
    if (total === 0) return null;

    // Répartition intuitivité
    const mauvaise = avisApplication.filter(a => a.note_intuitivite === 'mauvaise').length;
    const moyenne = avisApplication.filter(a => a.note_intuitivite === 'moyenne').length;
    const tresIntuitive = avisApplication.filter(a => a.note_intuitivite === 'tres_intuitive').length;

    // Répartition aide pendant séjour
    const aideOui = avisApplication.filter(a => a.aide_pendant_sejour === 'oui').length;
    const aideNon = avisApplication.filter(a => a.aide_pendant_sejour === 'non').length;
    const aideUnPeu = avisApplication.filter(a => a.aide_pendant_sejour === 'un_peu').length;

    // Suggestions
    const suggestions = avisApplication
      .filter(a => a.ameliorations && a.ameliorations.trim().length > 0)
      .map(a => ({
        nom: `${a.client_prenom || ''} ${a.client_nom || ''}`.trim(),
        texte: a.ameliorations,
        date: a.created_date
      }));

    return {
      total,
      intuitivite: [
        { name: lang === 'fr' ? 'Mauvaise' : 'Poor', value: mauvaise, color: '#ef4444' },
        { name: lang === 'fr' ? 'Moyenne' : 'Average', value: moyenne, color: '#eab308' },
        { name: lang === 'fr' ? 'Très intuitive' : 'Very intuitive', value: tresIntuitive, color: '#22c55e' }
      ],
      aide: [
        { name: lang === 'fr' ? 'Oui' : 'Yes', value: aideOui, color: '#22c55e' },
        { name: lang === 'fr' ? 'Un peu' : 'A bit', value: aideUnPeu, color: '#eab308' },
        { name: lang === 'fr' ? 'Non' : 'No', value: aideNon, color: '#ef4444' }
      ],
      suggestions
    };
  }, [avisApplication, lang]);

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <Card className={`border-2 ${color}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${color.replace('border-', 'bg-')} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-600">{title}</p>
            <p className="text-2xl font-heading text-[#0077A8]">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* ========== BLOC 1: AVIS SUR LES INTERVENTIONS ========== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-6 h-6 text-[#FFD700] fill-[#FFD700]" />
          <h2 className="text-2xl font-heading text-[#0077A8]">
            {lang === 'fr' ? 'Avis sur les interventions' : 'Intervention reviews'}
          </h2>
        </div>

        {!statsInterventions ? (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-8 text-center text-gray-500">
              {lang === 'fr' ? 'Aucun avis d\'intervention enregistré' : 'No intervention reviews recorded'}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPIs principaux */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Zap}
                title={lang === 'fr' ? '⚡ Réactivité' : '⚡ Responsiveness'}
                value={`${statsInterventions.moyenneReactivite}/5`}
                subtitle={`${statsInterventions.total} ${lang === 'fr' ? 'avis' : 'reviews'}`}
                color="border-orange-500"
              />
              <StatCard
                icon={Smile}
                title={lang === 'fr' ? '😊 Amabilité' : '😊 Friendliness'}
                value={`${statsInterventions.moyenneAmabilite}/5`}
                subtitle={`${statsInterventions.total} ${lang === 'fr' ? 'avis' : 'reviews'}`}
                color="border-green-500"
              />
              <StatCard
                icon={Sparkles}
                title={lang === 'fr' ? '✨ Qualité globale' : '✨ Overall quality'}
                value={`${statsInterventions.moyenneQualite}/5`}
                subtitle={`${statsInterventions.total} ${lang === 'fr' ? 'avis' : 'reviews'}`}
                color="border-purple-500"
              />
              <StatCard
                icon={Star}
                title={lang === 'fr' ? '🌟 Note globale' : '🌟 Overall rating'}
                value={`${statsInterventions.noteGlobaleIntervention}/5`}
                subtitle={lang === 'fr' ? 'Moyenne des 3 critères' : 'Average of 3 criteria'}
                color="border-[#FFD700]"
              />
            </div>

            {/* Graphiques de distribution */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-2 border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-[#0077A8]">
                    ⚡ {lang === 'fr' ? 'Distribution Réactivité' : 'Responsiveness Distribution'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionReactivite}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="note" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#FFA500" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-[#0077A8]">
                    😊 {lang === 'fr' ? 'Distribution Amabilité' : 'Friendliness Distribution'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionAmabilite}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="note" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-heading text-[#0077A8]">
                    ✨ {lang === 'fr' ? 'Distribution Qualité' : 'Quality Distribution'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionQualite}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="note" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* ========== BLOC 2: AVIS SUR L'APPLICATION ========== */}
      <div className="space-y-4 pt-8 border-t-4 border-[#00AEEF]">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-6 h-6 text-[#00AEEF]" />
          <h2 className="text-2xl font-heading text-[#0077A8]">
            {lang === 'fr' ? 'Avis sur l\'application' : 'App reviews'}
          </h2>
        </div>

        {!statsApplication ? (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-8 text-center text-gray-500">
              {lang === 'fr' ? 'Aucun avis sur l\'application enregistré' : 'No app reviews recorded'}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Compteur total */}
            <Card className="border-2 border-[#00AEEF]">
              <CardContent className="p-6 text-center">
                <Smartphone className="w-12 h-12 mx-auto mb-2 text-[#00AEEF]" />
                <p className="text-4xl font-bold text-[#0077A8]">{statsApplication.total}</p>
                <p className="text-sm text-gray-600">
                  {lang === 'fr' ? 'Avis sur l\'application' : 'App reviews'}
                </p>
              </CardContent>
            </Card>

            {/* Graphiques de répartition */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Intuitivité */}
              <Card className="border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="font-heading text-[#0077A8]">
                    📱 {lang === 'fr' ? 'Appréciation globale' : 'Overall appreciation'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statsApplication.intuitivite.filter(i => i.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statsApplication.intuitivite.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Compteurs détaillés */}
                  <div className="mt-4 space-y-2">
                    {statsApplication.intuitivite.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-body">{item.name}</span>
                        <Badge style={{ backgroundColor: item.color, color: 'white' }}>{item.value}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Aide pendant séjour */}
              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="font-heading text-[#0077A8]">
                    💡 {lang === 'fr' ? 'Aide pendant le séjour' : 'Help during stay'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statsApplication.aide.filter(a => a.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statsApplication.aide.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Compteurs détaillés */}
                  <div className="mt-4 space-y-2">
                    {statsApplication.aide.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-body">{item.name}</span>
                        <Badge style={{ backgroundColor: item.color, color: 'white' }}>{item.value}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suggestions utilisateurs */}
            {statsApplication.suggestions.length > 0 && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="font-heading text-[#0077A8] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {lang === 'fr' ? 'Suggestions utilisateurs' : 'User suggestions'} ({statsApplication.suggestions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {statsApplication.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-heading text-sm text-[#0077A8]">{suggestion.nom || 'Anonyme'}</p>
                          {suggestion.date && (
                            <span className="text-xs text-gray-500">
                              {new Date(suggestion.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-body italic">"{suggestion.texte}"</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}