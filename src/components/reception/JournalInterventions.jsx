import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Search, FileText, AlertCircle, CheckCircle, Clock, Home, Calendar, User, ArrowUpCircle } from 'lucide-react';

export default function JournalInterventions({ lang = 'fr' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigine, setFilterOrigine] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');

  const { data: interventions = [], isLoading } = useQuery({
    queryKey: ['interventions-journal'],
    queryFn: async () => {
      const incidents = await base44.entities.Incident.list('-date_saisie', 500);
      return incidents.filter(i => i.origine === 'arrivee' || i.origine === 'depart');
    },
    refetchInterval: 10000
  });

  const { data: fichesArrivee = [] } = useQuery({
    queryKey: ['fiches-arrivee-journal'],
    queryFn: () => base44.entities.FicheArrivee.list(),
  });

  const { data: fichesDepart = [] } = useQuery({
    queryKey: ['fiches-depart-journal'],
    queryFn: () => base44.entities.FicheDepart.list(),
  });

  const enrichedInterventions = interventions.map(intervention => {
    let ficheDetails = null;
    
    if (intervention.origine === 'arrivee' && intervention.fiche_arrivee_id) {
      ficheDetails = fichesArrivee.find(f => f.id === intervention.fiche_arrivee_id);
    } else if (intervention.origine === 'depart' && intervention.fiche_depart_id) {
      ficheDetails = fichesDepart.find(f => f.id === intervention.fiche_depart_id);
    }

    return {
      ...intervention,
      ficheDetails
    };
  });

  const filteredInterventions = enrichedInterventions.filter(intervention => {
    const matchSearch = !searchTerm || 
      intervention.client_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.client_prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.logement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchOrigine = filterOrigine === 'all' || intervention.origine === filterOrigine;
    const matchType = filterType === 'all' || intervention.type === filterType;
    const matchStatut = filterStatut === 'all' || intervention.statut === filterStatut;

    return matchSearch && matchOrigine && matchType && matchStatut;
  });

  // Grouper par hébergement
  const groupedByLogement = filteredInterventions.reduce((acc, intervention) => {
    const key = intervention.logement || 'Non défini';
    if (!acc[key]) acc[key] = [];
    acc[key].push(intervention);
    return acc;
  }, {});

  const getStatutBadge = (statut) => {
    const config = {
      'en_attente': { color: 'bg-orange-100 text-orange-700', icon: Clock, text: lang === 'fr' ? 'En attente' : 'Pending' },
      'en_cours': { color: 'bg-blue-100 text-blue-700', icon: ArrowUpCircle, text: lang === 'fr' ? 'En cours' : 'In progress' },
      'resolu': { color: 'bg-green-100 text-green-700', icon: CheckCircle, text: lang === 'fr' ? 'Résolu' : 'Resolved' },
    }[statut] || { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, text: statut };
    
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getOrigineBadge = (origine) => {
    return origine === 'arrivee' ? (
      <Badge className="bg-green-100 text-green-700">
        🟢 {lang === 'fr' ? 'Arrivée' : 'Arrival'}
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-700">
        🔴 {lang === 'fr' ? 'Départ' : 'Departure'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-[#00AEEF]">
        <CardHeader className="bg-gradient-to-r from-[#00AEEF] to-[#0077A8] text-white">
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {lang === 'fr' ? 'Journal des Interventions Inventaire' : 'Inventory Interventions Log'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={lang === 'fr' ? 'Rechercher client, logement...' : 'Search client, accommodation...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterOrigine} onValueChange={setFilterOrigine}>
              <SelectTrigger>
                <SelectValue placeholder={lang === 'fr' ? 'Origine' : 'Origin'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'fr' ? 'Toutes' : 'All'}</SelectItem>
                <SelectItem value="arrivee">{lang === 'fr' ? 'Arrivée' : 'Arrival'}</SelectItem>
                <SelectItem value="depart">{lang === 'fr' ? 'Départ' : 'Departure'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'fr' ? 'Tous' : 'All'}</SelectItem>
                <SelectItem value="technique">🔧 {lang === 'fr' ? 'Technique' : 'Technical'}</SelectItem>
                <SelectItem value="menage">🧹 {lang === 'fr' ? 'Ménage' : 'Housekeeping'}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger>
                <SelectValue placeholder={lang === 'fr' ? 'Statut' : 'Status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'fr' ? 'Tous' : 'All'}</SelectItem>
                <SelectItem value="en_attente">{lang === 'fr' ? 'En attente' : 'Pending'}</SelectItem>
                <SelectItem value="en_cours">{lang === 'fr' ? 'En cours' : 'In progress'}</SelectItem>
                <SelectItem value="resolu">{lang === 'fr' ? 'Résolu' : 'Resolved'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{filteredInterventions.length}</p>
              <p className="text-sm text-gray-600">{lang === 'fr' ? 'Total' : 'Total'}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredInterventions.filter(i => i.origine === 'arrivee').length}
              </p>
              <p className="text-sm text-gray-600">{lang === 'fr' ? 'Arrivées' : 'Arrivals'}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-orange-600">
                {filteredInterventions.filter(i => i.origine === 'depart').length}
              </p>
              <p className="text-sm text-gray-600">{lang === 'fr' ? 'Départs' : 'Departures'}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">
                {filteredInterventions.filter(i => i.urgent).length}
              </p>
              <p className="text-sm text-gray-600">{lang === 'fr' ? 'Urgents' : 'Urgent'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste groupée par logement */}
      <div className="space-y-4">
        {Object.entries(groupedByLogement).map(([logement, interventionsList]) => (
          <Card key={logement} className="border-2 border-gray-200">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="w-5 h-5 text-[#0077A8]" />
                {lang === 'fr' ? 'Logement' : 'Accommodation'} {logement}
                <Badge className="ml-auto">{interventionsList.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {interventionsList.map((intervention) => (
                <div key={intervention.id} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-heading text-[#0077A8]">
                        {intervention.client_prenom} {intervention.client_nom}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getOrigineBadge(intervention.origine)}
                      {intervention.urgent && (
                        <Badge className="bg-red-100 text-red-700">
                          ⚠️ {lang === 'fr' ? 'Urgent' : 'Urgent'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {intervention.date_arrivee} → {intervention.date_depart}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={intervention.type === 'technique' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                        {intervention.type === 'technique' ? '🔧' : '🧹'} {intervention.categorie}
                      </Badge>
                      {getStatutBadge(intervention.statut)}
                    </div>

                    <p className="text-gray-700 mt-2">
                      {intervention.description}
                    </p>

                    {intervention.ficheDetails && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <FileText className="w-3 h-3" />
                          {lang === 'fr' ? 'Lié à' : 'Linked to'}: 
                          {intervention.origine === 'arrivee' ? 
                            ` Fiche arrivée (${intervention.ficheDetails.evaluation_proprete})` : 
                            ` Fiche départ (${intervention.ficheDetails.evaluation_proprete})`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {Object.keys(groupedByLogement).length === 0 && (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {lang === 'fr' ? 'Aucune intervention trouvée' : 'No interventions found'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}