import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Clock, Clipboard, TrendingUp } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, differenceInMinutes } from 'date-fns';

const COLORS = ['#00AEEF', '#FFD700', '#FFA500', '#22c55e', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export default function BureauStatistiquesInterventions({ lang = 'fr' }) {
  // Charger toutes les interventions terminées
  const { data: incidents = [] } = useQuery({
    queryKey: ['stats-incidents'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'resolu' }),
    staleTime: 60000
  });

  const { data: interventionsClients = [] } = useQuery({
    queryKey: ['stats-interventions-clients'],
    queryFn: () => base44.entities.InterventionClient.filter({ statut: 'TERMINEE' }),
    staleTime: 60000
  });

  const { data: interventionsDirection = [] } = useQuery({
    queryKey: ['stats-interventions-direction'],
    queryFn: () => base44.entities.InterventionDirection.filter({ statut: 'TERMINEE' }),
    staleTime: 60000
  });

  // ============= CONSOLIDATION DES DONNÉES =============
  const interventionsConsolidees = useMemo(() => {
    const liste = [];

    // Incidents résolus
    incidents.forEach(inc => {
      if (!inc.date_debut || !inc.date_resolution) return;
      
      const dureeMinutes = differenceInMinutes(new Date(inc.date_resolution), new Date(inc.date_debut));
      
      liste.push({
        id: inc.id,
        type_source: 'incident',
        lieu: inc.logement || inc.emplacement,
        intervenant: inc.pris_par,
        motif: inc.categorie,
        service: inc.type,
        duree_minutes: dureeMinutes,
        date_cloture: inc.date_resolution,
        urgent: inc.urgent
      });
    });

    // Interventions clients terminées
    interventionsClients.forEach(inter => {
      if (!inter.date_prise_en_charge || !inter.date_terminee) return;
      
      const dureeMinutes = inter.temps_ecoule_minutes || 
        differenceInMinutes(new Date(inter.date_terminee), new Date(inter.date_prise_en_charge));
      
      liste.push({
        id: inter.id,
        type_source: 'intervention_client',
        lieu: inter.numero_hebergement,
        intervenant: inter.pris_en_charge_par,
        motif: inter.type_intervention,
        service: inter.service,
        duree_minutes: dureeMinutes,
        date_cloture: inter.date_terminee,
        urgent: inter.priorite === 'URGENTE'
      });
    });

    // Interventions direction terminées
    interventionsDirection.forEach(inter => {
      if (!inter.date_prise_en_charge || !inter.date_terminee) return;
      
      const dureeMinutes = inter.temps_ecoule_minutes || 
        differenceInMinutes(new Date(inter.date_terminee), new Date(inter.date_prise_en_charge));
      
      liste.push({
        id: inter.id,
        type_source: 'intervention_direction',
        lieu: inter.numero_hebergement,
        intervenant: inter.pris_en_charge_par,
        motif: inter.type_intervention,
        service: inter.service,
        duree_minutes: dureeMinutes,
        date_cloture: inter.date_terminee,
        urgent: inter.priorite === 'URGENTE'
      });
    });

    return liste.filter(i => i.lieu && i.intervenant && i.duree_minutes > 0);
  }, [incidents, interventionsClients, interventionsDirection]);

  // ============= STATISTIQUES PAR LIEU =============
  const statsParLieu = useMemo(() => {
    const groupes = {};
    
    interventionsConsolidees.forEach(inter => {
      if (!groupes[inter.lieu]) {
        groupes[inter.lieu] = {
          lieu: inter.lieu,
          count: 0,
          duree_totale: 0
        };
      }
      groupes[inter.lieu].count += 1;
      groupes[inter.lieu].duree_totale += inter.duree_minutes;
    });

    return Object.values(groupes)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [interventionsConsolidees]);

  // ============= STATISTIQUES PAR INTERVENANT =============
  const statsParIntervenant = useMemo(() => {
    const groupes = {};
    
    interventionsConsolidees.forEach(inter => {
      if (!groupes[inter.intervenant]) {
        groupes[inter.intervenant] = {
          intervenant: inter.intervenant,
          count: 0,
          duree_totale: 0
        };
      }
      groupes[inter.intervenant].count += 1;
      groupes[inter.intervenant].duree_totale += inter.duree_minutes;
    });

    return Object.values(groupes).map(g => ({
      ...g,
      duree_moyenne: Math.round(g.duree_totale / g.count)
    })).sort((a, b) => b.count - a.count);
  }, [interventionsConsolidees]);

  // ============= STATISTIQUES PAR MOTIF =============
  const statsParMotif = useMemo(() => {
    const groupes = {};
    
    interventionsConsolidees.forEach(inter => {
      const motif = inter.motif || 'Non spécifié';
      if (!groupes[motif]) {
        groupes[motif] = {
          motif,
          count: 0,
          duree_totale: 0
        };
      }
      groupes[motif].count += 1;
      groupes[motif].duree_totale += inter.duree_minutes;
    });

    return Object.values(groupes)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [interventionsConsolidees]);

  // ============= STATISTIQUES PAR SERVICE =============
  const statsParService = useMemo(() => {
    const groupes = {};
    
    interventionsConsolidees.forEach(inter => {
      const service = inter.service || 'Autre';
      if (!groupes[service]) {
        groupes[service] = {
          name: service,
          count: 0,
          duree_totale: 0
        };
      }
      groupes[service].count += 1;
      groupes[service].duree_totale += inter.duree_totale;
    });

    return Object.values(groupes);
  }, [interventionsConsolidees]);

  // Formater durée
  const formatDuree = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  };

  // Totaux globaux
  const totalInterventions = interventionsConsolidees.length;
  const dureeGlobaleTotale = interventionsConsolidees.reduce((sum, i) => sum + i.duree_minutes, 0);
  const dureeMoyenneGlobale = totalInterventions > 0 ? Math.round(dureeGlobaleTotale / totalInterventions) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading text-[#0077A8] flex items-center gap-2">
        📊 {lang === 'fr' ? 'Statistiques opérationnelles des interventions' : 'Operational intervention statistics'}
      </h2>

      {/* KPIs globaux */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-2 border-[#00AEEF]">
          <CardContent className="p-6 text-center">
            <Clipboard className="w-10 h-10 mx-auto mb-2 text-[#00AEEF]" />
            <p className="text-3xl font-bold text-[#0077A8]">{totalInterventions}</p>
            <p className="text-sm text-gray-600">
              {lang === 'fr' ? 'Interventions terminées' : 'Completed interventions'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500">
          <CardContent className="p-6 text-center">
            <Clock className="w-10 h-10 mx-auto mb-2 text-purple-500" />
            <p className="text-3xl font-bold text-[#0077A8]">{formatDuree(dureeGlobaleTotale)}</p>
            <p className="text-sm text-gray-600">
              {lang === 'fr' ? 'Temps total passé' : 'Total time spent'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-bold text-[#0077A8]">{formatDuree(dureeMoyenneGlobale)}</p>
            <p className="text-sm text-gray-600">
              {lang === 'fr' ? 'Durée moyenne' : 'Average duration'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de répartition */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Par service */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="font-heading text-[#0077A8]">
              🛠 {lang === 'fr' ? 'Répartition par service' : 'Distribution by service'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statsParService.filter(s => s.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count, percent }) => `${name}: ${count} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  dataKey="count"
                >
                  {statsParService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top motifs */}
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="font-heading text-[#0077A8]">
              📋 {lang === 'fr' ? 'Top motifs d\'intervention' : 'Top intervention reasons'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statsParMotif.slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={10} />
                <YAxis type="category" dataKey="motif" fontSize={10} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#FFA500" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tableau par intervenant */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="font-heading text-[#0077A8] flex items-center gap-2">
            <User className="w-5 h-5" />
            {lang === 'fr' ? 'Statistiques par intervenant' : 'Statistics by staff member'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-100">
                <tr>
                  <th className="p-3 text-left font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Intervenant' : 'Staff member'}
                  </th>
                  <th className="p-3 text-center font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Nb interventions' : 'Nb interventions'}
                  </th>
                  <th className="p-3 text-center font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Temps total' : 'Total time'}
                  </th>
                  <th className="p-3 text-center font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Temps moyen' : 'Average time'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {statsParIntervenant.map((stat, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 font-body">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#00AEEF]" />
                        {stat.intervenant}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className="bg-[#00AEEF] text-white">{stat.count}</Badge>
                    </td>
                    <td className="p-3 text-center font-heading text-purple-600">
                      {formatDuree(stat.duree_totale)}
                    </td>
                    <td className="p-3 text-center font-heading text-green-600">
                      {formatDuree(stat.duree_moyenne)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tableau par lieu */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="font-heading text-[#0077A8] flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {lang === 'fr' ? 'Statistiques par lieu' : 'Statistics by location'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="p-3 text-left font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Lieu' : 'Location'}
                  </th>
                  <th className="p-3 text-center font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Nb interventions' : 'Nb interventions'}
                  </th>
                  <th className="p-3 text-center font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Temps total' : 'Total time'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {statsParLieu.map((stat, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 font-body">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#00AEEF]" />
                        {stat.lieu}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className="bg-blue-500 text-white">{stat.count}</Badge>
                    </td>
                    <td className="p-3 text-center font-heading text-purple-600">
                      {formatDuree(stat.duree_totale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tableau par motif */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="font-heading text-[#0077A8] flex items-center gap-2">
            <Clipboard className="w-5 h-5" />
            {lang === 'fr' ? 'Statistiques par motif' : 'Statistics by reason'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-100">
                <tr>
                  <th className="p-3 text-left font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Motif' : 'Reason'}
                  </th>
                  <th className="p-3 text-center font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Nb interventions' : 'Nb interventions'}
                  </th>
                  <th className="p-3 text-center font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Temps total' : 'Total time'}
                  </th>
                  <th className="p-3 text-center font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Temps moyen' : 'Average time'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {statsParMotif.map((stat, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 font-body">{stat.motif}</td>
                    <td className="p-3 text-center">
                      <Badge className="bg-orange-500 text-white">{stat.count}</Badge>
                    </td>
                    <td className="p-3 text-center font-heading text-purple-600">
                      {formatDuree(stat.duree_totale)}
                    </td>
                    <td className="p-3 text-center font-heading text-green-600">
                      {formatDuree(Math.round(stat.duree_totale / stat.count))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Liste détaillée des interventions */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="font-heading text-[#0077A8]">
            📝 {lang === 'fr' ? 'Liste détaillée des interventions' : 'Detailed intervention list'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Date' : 'Date'}
                  </th>
                  <th className="p-3 text-left font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Lieu' : 'Location'}
                  </th>
                  <th className="p-3 text-left font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Intervenant' : 'Staff'}
                  </th>
                  <th className="p-3 text-left font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Motif' : 'Reason'}
                  </th>
                  <th className="p-3 text-left font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Service' : 'Service'}
                  </th>
                  <th className="p-3 text-center font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Durée' : 'Duration'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {interventionsConsolidees
                  .sort((a, b) => new Date(b.date_cloture) - new Date(a.date_cloture))
                  .slice(0, 50)
                  .map((inter, idx) => (
                    <tr key={idx} className={`border-t ${inter.urgent ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="p-3 text-xs text-gray-600">
                        {format(new Date(inter.date_cloture), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="p-3 font-body">
                        <MapPin className="w-3 h-3 inline mr-1 text-[#00AEEF]" />
                        {inter.lieu}
                      </td>
                      <td className="p-3 font-body text-gray-700">{inter.intervenant}</td>
                      <td className="p-3 text-xs text-gray-600">{inter.motif}</td>
                      <td className="p-3">
                        <Badge className={
                          inter.service === 'technique' || inter.service === 'TECHNIQUE' ? 'bg-blue-500' :
                          inter.service === 'menage' || inter.service === 'MENAGE' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }>
                          {inter.service}
                        </Badge>
                      </td>
                      <td className="p-3 text-center font-heading text-purple-600">
                        {formatDuree(inter.duree_minutes)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {interventionsConsolidees.length > 50 && (
            <p className="text-xs text-gray-500 text-center mt-3">
              {lang === 'fr' 
                ? `Affichage des 50 dernières interventions sur ${interventionsConsolidees.length} au total`
                : `Showing last 50 interventions out of ${interventionsConsolidees.length} total`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}