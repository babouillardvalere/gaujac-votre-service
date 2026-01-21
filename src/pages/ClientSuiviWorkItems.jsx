import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Loader2, Home, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';
import TimelineSuiviEvent from '../components/suivi/TimelineSuiviEvent';
import { useTranslation } from '../components/translations';

const STATUT_CONFIG = {
  A_FAIRE: { label: 'À faire', color: 'bg-gray-100 text-gray-800' },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  EN_ATTENTE: { label: 'En attente', color: 'bg-orange-100 text-orange-800' },
  TERMINEE: { label: 'Terminée', color: 'bg-green-100 text-green-800' },
  ANNULEE: { label: 'Annulée', color: 'bg-red-100 text-red-800' }
};

const SERVICE_CONFIG = {
  MENAGE: { label: 'Ménage', icon: '🧹' },
  TECHNIQUE: { label: 'Technique', icon: '🔧' },
  RECEPTION: { label: 'Réception', icon: '🏨' },
  DIRECTION: { label: 'Direction', icon: '👔' }
};

export default function ClientSuiviWorkItems() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [logement, setLogement] = useState('');
  const [searching, setSearching] = useState(false);

  const { data: workItems = [], isLoading, refetch } = useQuery({
    queryKey: ['client-workitems', logement],
    enabled: false,
    queryFn: async () => {
      if (!logement.trim()) return [];
      
      const results = await base44.entities.WorkItem.filter(
        { hebergement: logement.trim() },
        '-created_date',
        50
      );
      
      // OPTIMISATION: Charger tous les SuiviEvent en 1 seule requête (évite N+1)
      if (results.length > 0) {
        const workItemIds = results.map(w => w.id);
        const allEvents = await base44.entities.SuiviEvent.filter(
          { workitem_id: { $in: workItemIds } },
          '-timestamp',
          500
        );
        
        // Regrouper par workitem_id côté frontend
        const eventsByWorkItem = {};
        allEvents.forEach(event => {
          if (!eventsByWorkItem[event.workitem_id]) {
            eventsByWorkItem[event.workitem_id] = [];
          }
          eventsByWorkItem[event.workitem_id].push(event);
        });
        
        // Attacher les events à chaque WorkItem
        results.forEach(workItem => {
          workItem._suiviEvents = eventsByWorkItem[workItem.id] || [];
        });
      }
      
      return results;
    }
  });

  const handleSearch = async () => {
    if (!logement.trim()) return;
    setSearching(true);
    await refetch();
    setSearching(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {lang === 'fr' ? 'Retour' : 'Back'}
        </button>

        <div className="flex items-center justify-between">
          <Logo className="h-14" />
        </div>

        {/* Search */}
        <Card className="border-2 border-[#00AEEF]">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-[#0077A8]">
              {lang === 'fr' ? '🔍 Suivre mes demandes' : '🔍 Track my requests'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-gray-400" />
              <Input
                placeholder={lang === 'fr' ? 'Numéro de logement (ex: M03, P12)' : 'Accommodation number (ex: M03, P12)'}
                value={logement}
                onChange={(e) => setLogement(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={!logement.trim() || searching}
                className="bg-[#00AEEF] hover:bg-[#0077A8]"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              {lang === 'fr' 
                ? '💡 Saisissez votre numéro de logement pour voir vos demandes en cours'
                : '💡 Enter your accommodation number to see your ongoing requests'}
            </p>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
          </div>
        )}

        {/* No results */}
        {!isLoading && searching && workItems.length === 0 && logement && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                {lang === 'fr' 
                  ? `Aucune demande trouvée pour le logement ${logement}`
                  : `No request found for accommodation ${logement}`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {workItems.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-5 h-5" />
              <p className="font-semibold">
                {workItems.length} {lang === 'fr' ? 'demande(s) trouvée(s)' : 'request(s) found'}
              </p>
            </div>

            {workItems.map((workItem) => {
              const statutConfig = STATUT_CONFIG[workItem.statut] || STATUT_CONFIG.A_FAIRE;
              const serviceConfig = SERVICE_CONFIG[workItem.service] || { label: workItem.service, icon: '📋' };

              return (
                <Card key={workItem.id} className="border-2 border-[#00AEEF]">
                  <CardHeader>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-heading text-xl text-[#0077A8] mb-2">
                            {serviceConfig.icon} {serviceConfig.label}
                          </h3>
                          {workItem.description_operationnelle ? (
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 p-3 rounded-lg">
                              {workItem.description_operationnelle}
                            </pre>
                          ) : (
                            <p className="text-sm text-gray-700">
                              {workItem.description || workItem.titre || 'Aucune description disponible'}
                            </p>
                          )}
                        </div>
                        <Badge className={statutConfig.color}>
                          {statutConfig.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          {workItem.hebergement}
                        </span>
                        {workItem.type_hebergement && (
                          <span>• {workItem.type_hebergement}</span>
                        )}
                        {workItem.priorite && (
                          <span className={workItem.priorite === 'URGENTE' ? 'text-red-600 font-semibold' : ''}>
                            • {workItem.priorite === 'URGENTE' ? '🔴 Urgent' : workItem.priorite}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {lang === 'fr' ? 'Historique' : 'Timeline'}
                      </h4>
                      <TimelineSuiviEvent 
                        workItemId={workItem.id} 
                        preloadedEvents={workItem._suiviEvents}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}