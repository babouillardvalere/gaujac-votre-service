import React, { useState } from 'react';
import { useTranslation } from '../translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Home, Search, AlertTriangle, Clock, Star, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function BureauLogements() {
  const { t, lang } = useTranslation();
  const [searchNum, setSearchNum] = useState('');
  const [selectedLogement, setSelectedLogement] = useState(null);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['logements-incidents'],
    queryFn: () => base44.entities.Incident.filter({}, '-created_date', 1000)
  });

  const { data: avis = [] } = useQuery({
    queryKey: ['logements-avis'],
    queryFn: () => base44.entities.Avis.filter({}, '-created_date', 500)
  });

  // Group incidents by accommodation
  const logementStats = incidents.reduce((acc, incident) => {
    const num = incident.hebergement_numero;
    if (!acc[num]) {
      acc[num] = {
        numero: num,
        total: 0,
        urgent: 0,
        incidents: [],
        avgDuration: 0
      };
    }
    acc[num].total++;
    if (incident.probleme_urgent) acc[num].urgent++;
    acc[num].incidents.push(incident);
    return acc;
  }, {});

  // Calculate avg duration for each
  Object.values(logementStats).forEach(logement => {
    const completed = logement.incidents.filter(i => i.duree_minutes);
    if (completed.length > 0) {
      logement.avgDuration = Math.round(
        completed.reduce((sum, i) => sum + i.duree_minutes, 0) / completed.length
      );
    }
  });

  // Sort by total incidents
  const sortedLogements = Object.values(logementStats)
    .sort((a, b) => b.total - a.total);

  const filteredLogements = searchNum
    ? sortedLogements.filter(l => l.numero.includes(searchNum))
    : sortedLogements;

  const getStatusColor = (status) => {
    const colors = {
      nouveau: 'bg-blue-100 text-blue-700',
      en_route: 'bg-amber-100 text-amber-700',
      en_cours: 'bg-purple-100 text-purple-700',
      termine: 'bg-emerald-100 text-emerald-700'
    };
    return colors[status] || colors.nouveau;
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher par numéro de logement..."
              value={searchNum}
              onChange={(e) => setSearchNum(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logements Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLogements.map(logement => (
            <Card 
              key={logement.numero}
              className={`shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                logement.urgent > 0 ? 'border-red-200' : ''
              }`}
              onClick={() => setSelectedLogement(logement)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Home className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">#{logement.numero}</h3>
                      <p className="text-xs text-slate-500">{logement.total} interventions</p>
                    </div>
                  </div>
                  {logement.urgent > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {logement.urgent} urgence{logement.urgent > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{logement.avgDuration || '-'} min moy.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredLogements.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              Aucun logement trouvé
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLogement} onOpenChange={() => setSelectedLogement(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              Historique logement #{selectedLogement?.numero}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLogement && (
            <div className="space-y-4 pt-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-800">{selectedLogement.total}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{selectedLogement.urgent}</p>
                  <p className="text-xs text-red-500">Urgences</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{selectedLogement.avgDuration || '-'}</p>
                  <p className="text-xs text-emerald-500">Min moy.</p>
                </div>
              </div>

              {/* Incidents List */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-700">Historique des interventions</h4>
                {selectedLogement.incidents.map(incident => (
                  <div 
                    key={incident.id}
                    className={`p-3 rounded-lg border ${
                      incident.probleme_urgent ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{t(incident.sous_categorie)}</span>
                          {incident.probleme_urgent && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {format(new Date(incident.created_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <Badge className={getStatusColor(incident.statut)}>
                        {t(incident.statut)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{incident.description_probleme}</p>
                    {incident.duree_minutes && (
                      <p className="text-xs text-slate-400 mt-2">
                        Durée: {incident.duree_minutes} min
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}