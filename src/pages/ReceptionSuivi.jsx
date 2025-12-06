import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Wrench, Sparkles, AlertCircle, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';

export default function ReceptionSuivi({ embedded = false }) {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [filtreStatut, setFiltreStatut] = useState('tous');

  const { data: interventions = [], isLoading } = useQuery({
    queryKey: ['reception-suivi-interventions'],
    queryFn: () => base44.entities.Incident.list('-date_saisie', 200),
    refetchInterval: 15000
  });

  // Filtrer interventions par origine
  const interventionsReception = interventions.filter(i => 
    i.origine === 'arrivee' || i.origine === 'depart' || i.created_by?.includes('reception')
  );

  const interventionsTechnique = interventionsReception.filter(i => i.type === 'technique');
  const interventionsMenage = interventionsReception.filter(i => i.type === 'menage');

  const getStatusBadge = (statut, urgent) => {
    const config = {
      en_attente: { color: 'bg-orange-500', label: lang === 'fr' ? 'En attente' : 'Pending', icon: Clock },
      en_cours: { color: 'bg-blue-500', label: lang === 'fr' ? 'En cours' : 'In progress', icon: Clock },
      en_attente_materiel: { color: 'bg-purple-500', label: lang === 'fr' ? 'Reporté' : 'On hold', icon: AlertCircle },
      resolu: { color: 'bg-green-500', label: lang === 'fr' ? 'Terminé' : 'Resolved', icon: CheckCircle }
    };

    const status = config[statut] || config.en_attente;
    const Icon = status.icon;

    return (
      <Badge className={`${status.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.label}
        {urgent && ' 🔴'}
      </Badge>
    );
  };

  const InterventionCard = ({ intervention }) => {
    const isTechnique = intervention.type === 'technique';
    
    return (
      <Card className={`border-2 ${isTechnique ? 'border-blue-300' : 'border-yellow-300'} hover:shadow-md transition-all`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {isTechnique ? (
                <Wrench className="w-5 h-5 text-blue-600" />
              ) : (
                <Sparkles className="w-5 h-5 text-yellow-600" />
              )}
              <span className="font-heading text-lg">
                {intervention.logement || intervention.emplacement}
              </span>
            </div>
            {getStatusBadge(intervention.statut, intervention.urgent)}
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <strong>{lang === 'fr' ? 'Client' : 'Guest'}:</strong>{' '}
              {intervention.client_nom} {intervention.client_prenom}
            </p>
            <p>
              <strong>{lang === 'fr' ? 'Catégorie' : 'Category'}:</strong>{' '}
              {intervention.categorie}
            </p>
            <p>
              <strong>{lang === 'fr' ? 'Description' : 'Description'}:</strong>{' '}
              {intervention.description}
            </p>
            {intervention.photo_url && (
              <div className="mt-2">
                <img 
                  src={intervention.photo_url} 
                  alt="Photo intervention" 
                  className="w-32 h-32 object-cover rounded-lg border-2"
                />
              </div>
            )}
            <p className="text-gray-500">
              <Clock className="w-3 h-3 inline mr-1" />
              {intervention.date_saisie && format(new Date(intervention.date_saisie), 'dd/MM/yyyy HH:mm')}
            </p>
            {intervention.origine && (
              <Badge variant="outline" className="text-xs">
                {intervention.origine === 'arrivee' && '🏡 Arrivée'}
                {intervention.origine === 'depart' && '🚗 Départ'}
                {intervention.origine === 'signalement' && '📝 Signalement'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredInterventions = (list) => {
    if (filtreStatut === 'tous') return list;
    return list.filter(i => i.statut === filtreStatut);
  };

  const content = (
    <>
      {!embedded && (
        <>
          <button
            onClick={() => navigate(createPageUrl('Reception'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{lang === 'fr' ? 'Retour à Réception' : 'Back to Reception'}</span>
          </button>

          <h1 className="font-handwritten text-4xl text-[#00AEEF] text-center mb-2">
            📊 {lang === 'fr' ? 'Suivi Réception' : 'Reception Tracking'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-8">
            {lang === 'fr' 
              ? 'Toutes les interventions créées via la réception'
              : 'All interventions created via reception'}
          </p>
        </>
      )}

      {/* Filtres statut */}
      <Card className="border-2 border-gray-300 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltreStatut('tous')}
              className={`px-4 py-2 rounded-lg font-heading text-sm ${
                filtreStatut === 'tous' ? 'bg-[#00AEEF] text-white' : 'bg-gray-100'
              }`}
            >
              {lang === 'fr' ? 'Tous' : 'All'}
            </button>
            <button
              onClick={() => setFiltreStatut('en_attente')}
              className={`px-4 py-2 rounded-lg font-heading text-sm ${
                filtreStatut === 'en_attente' ? 'bg-orange-500 text-white' : 'bg-gray-100'
              }`}
            >
              {lang === 'fr' ? 'En attente' : 'Pending'}
            </button>
            <button
              onClick={() => setFiltreStatut('en_cours')}
              className={`px-4 py-2 rounded-lg font-heading text-sm ${
                filtreStatut === 'en_cours' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              {lang === 'fr' ? 'En cours' : 'In progress'}
            </button>
            <button
              onClick={() => setFiltreStatut('resolu')}
              className={`px-4 py-2 rounded-lg font-heading text-sm ${
                filtreStatut === 'resolu' ? 'bg-green-500 text-white' : 'bg-gray-100'
              }`}
            >
              {lang === 'fr' ? 'Terminé' : 'Resolved'}
            </button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AEEF]"></div>
        </div>
      ) : (
        <Tabs defaultValue="technique" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="technique" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              {lang === 'fr' ? 'Technique' : 'Technical'} ({filteredInterventions(interventionsTechnique).length})
            </TabsTrigger>
            <TabsTrigger value="menage" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {lang === 'fr' ? 'Ménage' : 'Housekeeping'} ({filteredInterventions(interventionsMenage).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="technique">
            <div className="space-y-4">
              {filteredInterventions(interventionsTechnique).length === 0 ? (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-8 text-center text-gray-500">
                    {lang === 'fr' ? 'Aucune intervention technique' : 'No technical interventions'}
                  </CardContent>
                </Card>
              ) : (
                filteredInterventions(interventionsTechnique).map(intervention => (
                  <InterventionCard key={intervention.id} intervention={intervention} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="menage">
            <div className="space-y-4">
              {filteredInterventions(interventionsMenage).length === 0 ? (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-8 text-center text-gray-500">
                    {lang === 'fr' ? 'Aucune intervention ménage' : 'No housekeeping interventions'}
                  </CardContent>
                </Card>
              ) : (
                filteredInterventions(interventionsMenage).map(intervention => (
                  <InterventionCard key={intervention.id} intervention={intervention} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {content}
        </motion.div>
      </div>
    </div>
  );
}