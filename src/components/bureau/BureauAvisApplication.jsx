import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, TrendingUp, AlertCircle, ThumbsUp, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#FFA500', '#ef4444'];

export default function BureauAvisApplication({ lang }) {
  const isFrench = lang === 'fr';
  const queryClient = useQueryClient();

  const { data: avisApp = [] } = useQuery({
    queryKey: ['avis-application'],
    queryFn: () => base44.entities.AvisApplication.list()
  });

  const deleteAvisMutation = useMutation({
    mutationFn: (id) => base44.entities.AvisApplication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avis-application'] });
    }
  });

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm(isFrench ? 'Supprimer cet avis ?' : 'Delete this feedback?')) {
      await deleteAvisMutation.mutateAsync(id);
    }
  };

  // Statistiques globales
  const stats = {
    total: avisApp.length,
    tresBien: avisApp.filter(a => a.note_intuitivite === 'tres_intuitive').length,
    moyen: avisApp.filter(a => a.note_intuitivite === 'moyenne').length,
    mauvais: avisApp.filter(a => a.note_intuitivite === 'mauvaise').length,
    aideOui: avisApp.filter(a => a.aide_pendant_sejour === 'oui').length,
    aideNon: avisApp.filter(a => a.aide_pendant_sejour === 'non').length,
    aidePeu: avisApp.filter(a => a.aide_pendant_sejour === 'un_peu').length
  };

  // Score moyen (0-100)
  const scoreMoyen = stats.total > 0
    ? ((stats.tresBien * 100 + stats.moyen * 50 + stats.mauvais * 0) / stats.total).toFixed(0)
    : 0;

  // Données pour graphiques
  const intuitiviteData = [
    { name: isFrench ? 'Très intuitive' : 'Very intuitive', value: stats.tresBien },
    { name: isFrench ? 'Moyenne' : 'Average', value: stats.moyen },
    { name: isFrench ? 'Mauvaise' : 'Bad', value: stats.mauvais }
  ];

  const aideData = [
    { name: isFrench ? 'Oui' : 'Yes', value: stats.aideOui },
    { name: isFrench ? 'Non' : 'No', value: stats.aideNon },
    { name: isFrench ? 'Un peu' : 'A bit', value: stats.aidePeu }
  ];

  // TOP problèmes mentionnés (analyse simple des mots-clés)
  const problemesFrequents = {};
  avisApp.forEach(avis => {
    if (avis.ameliorations) {
      const lower = avis.ameliorations.toLowerCase();
      if (lower.includes('lent') || lower.includes('slow')) problemesFrequents['lenteur'] = (problemesFrequents['lenteur'] || 0) + 1;
      if (lower.includes('bug')) problemesFrequents['bugs'] = (problemesFrequents['bugs'] || 0) + 1;
      if (lower.includes('compliqué') || lower.includes('complex')) problemesFrequents['complexité'] = (problemesFrequents['complexité'] || 0) + 1;
      if (lower.includes('photo')) problemesFrequents['photos'] = (problemesFrequents['photos'] || 0) + 1;
      if (lower.includes('design') || lower.includes('interface')) problemesFrequents['design'] = (problemesFrequents['design'] || 0) + 1;
    }
  });

  const topProblemes = Object.entries(problemesFrequents)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#00AEEF]" />
              {isFrench ? 'Avis reçus' : 'Feedback received'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              {isFrench ? 'Score moyen' : 'Average score'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{scoreMoyen}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-[#FFD700]" />
              {isFrench ? 'Très satisfaits' : 'Very satisfied'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{stats.tresBien}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#ef4444]" />
              {isFrench ? 'À améliorer' : 'To improve'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0077A8]">{stats.mauvais + stats.moyen}</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isFrench ? 'Intuitivité de l\'app' : 'App intuitiveness'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={intuitiviteData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {intuitiviteData.map((entry, index) => (
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
            <CardTitle className="text-lg">
              {isFrench ? 'Aide pendant le séjour' : 'Help during stay'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aideData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#00AEEF" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TOP problèmes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isFrench ? '🔥 Problèmes les plus mentionnés' : '🔥 Most mentioned issues'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProblemes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {isFrench ? 'Aucun problème signalé' : 'No issues reported'}
            </p>
          ) : (
            <div className="space-y-2">
              {topProblemes.map(([probleme, count], index) => (
                <div key={probleme} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-heading text-gray-700">
                    #{index + 1} {probleme}
                  </span>
                  <span className="text-xl font-bold text-[#0077A8]">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des derniers avis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isFrench ? 'Derniers avis détaillés' : 'Latest detailed feedback'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {avisApp.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {isFrench ? 'Aucun avis pour le moment' : 'No feedback yet'}
              </p>
            ) : (
              avisApp.slice(0, 20).map(avis => (
                <div key={avis.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-heading text-[#0077A8]">
                        {avis.client_prenom} {avis.client_nom}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(avis.created_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-heading ${
                          avis.note_intuitivite === 'tres_intuitive' ? 'bg-green-100 text-green-700' :
                          avis.note_intuitivite === 'moyenne' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {avis.note_intuitivite === 'tres_intuitive' ? '😄' : 
                           avis.note_intuitivite === 'moyenne' ? '😐' : '😠'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-heading ${
                          avis.aide_pendant_sejour === 'oui' ? 'bg-green-100 text-green-700' :
                          avis.aide_pendant_sejour === 'un_peu' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {avis.aide_pendant_sejour === 'oui' ? '✔' : 
                           avis.aide_pendant_sejour === 'un_peu' ? '🟧' : '❌'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(avis.id, e)}
                        disabled={deleteAvisMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {avis.ameliorations && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      "{avis.ameliorations}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}