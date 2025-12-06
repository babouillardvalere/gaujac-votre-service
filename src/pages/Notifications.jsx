import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '../components/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bell, Wrench, Sparkles, AlertTriangle, Clock, User, Home as HomeIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';
import { getIconFromLegacyCategory } from '../components/interventionIconsConfig';

export default function Notifications() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState('tous');

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['notifications-incidents'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente' }, '-date_saisie', 500),
    refetchInterval: 10000
  });

  const urgents = incidents.filter(i => i.urgent);
  const techniques = incidents.filter(i => i.type === 'technique');
  const menage = incidents.filter(i => i.type === 'menage');

  const filteredIncidents = incidents.filter(i => {
    if (filter === 'tous') return true;
    if (filter === 'urgents') return i.urgent;
    if (filter === 'technique') return i.type === 'technique';
    if (filter === 'menage') return i.type === 'menage';
    return true;
  });

  const handleIncidentClick = (incident) => {
    if (incident.type === 'technique') {
      navigate(createPageUrl('Technique'));
    } else {
      navigate(createPageUrl('Menage'));
    }
  };

  return (
    <div className="min-h-screen pb-8" role="main" aria-label="Notifications - Interventions en attente">
      <h1 className="sr-only">Notifications - Toutes les interventions en attente</h1>
      
      {/* Header */}
      <div className="bg-[#FFA500] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <HomeIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-xl flex items-center gap-2">
                <Bell className="w-6 h-6" />
                {t('notifications')}
              </h1>
              <p className="text-white/80 text-sm font-body">
                {incidents.length} demande(s) en attente
              </p>
            </div>
          </div>
          <Bell className="w-8 h-8" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className={`border-2 rounded-xl ${filter === 'urgents' ? 'border-red-500 bg-red-50' : 'border-red-300'}`}>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-heading text-red-600">{urgents.length}</p>
              <p className="text-xs font-body text-gray-600">{t('urgent_label')}</p>
            </CardContent>
          </Card>
          
          <Card className={`border-2 rounded-xl ${filter === 'technique' ? 'border-[#00AEEF] bg-blue-50' : 'border-[#00AEEF]/30'}`}>
            <CardContent className="p-4 text-center">
              <Wrench className="w-6 h-6 text-[#00AEEF] mx-auto mb-2" />
              <p className="text-2xl font-heading text-[#0077A8]">{techniques.length}</p>
              <p className="text-xs font-body text-gray-600">{t('technique')}</p>
            </CardContent>
          </Card>
          
          <Card className={`border-2 rounded-xl ${filter === 'menage' ? 'border-[#FFD700] bg-yellow-50' : 'border-[#FFD700]/30'}`}>
            <CardContent className="p-4 text-center">
              <Sparkles className="w-6 h-6 text-[#FFD700] mx-auto mb-2" />
              <p className="text-2xl font-heading text-[#0077A8]">{menage.length}</p>
              <p className="text-xs font-body text-gray-600">{t('menage')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-[#FFA500]/10 p-1 rounded-xl border border-[#FFA500]/30 w-full grid grid-cols-4">
            <TabsTrigger value="tous" className="rounded-lg font-heading text-xs data-[state=active]:bg-[#FFA500] data-[state=active]:text-white">
              {t('tous')} ({incidents.length})
            </TabsTrigger>
            <TabsTrigger value="urgents" className="rounded-lg font-heading text-xs data-[state=active]:bg-red-500 data-[state=active]:text-white">
              🚨 Urgent ({urgents.length})
            </TabsTrigger>
            <TabsTrigger value="technique" className="rounded-lg font-heading text-xs data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white">
              🔧 ({techniques.length})
            </TabsTrigger>
            <TabsTrigger value="menage" className="rounded-lg font-heading text-xs data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0077A8]">
              🧹 ({menage.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Liste des interventions */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFA500]" />
          </div>
        ) : filteredIncidents.length === 0 ? (
          <Card className="border-2 border-gray-200 rounded-xl">
            <CardContent className="py-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="font-heading text-gray-500">{t('aucune_intervention_attente')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.map((incident) => {
              const iconInfo = getIconFromLegacyCategory(incident.categorie);
              
              return (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className={`border-2 rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                      incident.urgent ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleIncidentClick(incident)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-3xl">{iconInfo.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-heading text-[#0077A8] text-lg">
                                {incident.logement || incident.emplacement}
                              </span>
                              {incident.urgent && (
                                <Badge className="bg-red-500 text-white text-xs animate-pulse">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  URGENT
                                </Badge>
                              )}
                              <Badge className={incident.type === 'technique' ? 'bg-[#00AEEF] text-white' : 'bg-[#FFD700] text-[#0077A8]'}>
                                {incident.type === 'technique' ? '🔧' : '🧹'} {iconInfo.label}
                              </Badge>
                              {incident.origine === 'arrivee' && (
                                <Badge className="bg-green-600 text-white text-xs">🏁 Arrivée</Badge>
                              )}
                              {incident.origine === 'depart' && (
                                <Badge className="bg-orange-600 text-white text-xs">🚪 Départ</Badge>
                              )}
                            </div>
                            <p className="text-sm font-body text-gray-600 line-clamp-2">
                              {incident.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 font-body">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {incident.client_prenom} {incident.client_nom}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM HH:mm', { locale: fr })}
                        </div>
                      </div>
                      
                      {/* Badge autorisation accès */}
                      {incident.autorisation_acces && (
                        <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-body ${
                          incident.autorisation_acces === 'oui' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {incident.autorisation_acces === 'oui' ? '✓ Accès autorisé' : '⚠ Présence requise'}
                          {incident.plage_horaire_client && ` - ${incident.plage_horaire_client}`}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}