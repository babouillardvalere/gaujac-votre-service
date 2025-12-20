import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, CheckCircle, Play } from 'lucide-react';

export default function MissionListView({ missions, onPrendreEnCharge, onContinuer, loading }) {
  if (missions.length === 0) {
    return (
      <div className="text-center py-16 bg-purple-50 rounded-xl border-2 border-purple-200">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-6xl">📭</div>
          <h3 className="font-heading text-2xl text-purple-700">
            Aucune mission
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {missions.map(mission => (
        <Card key={mission.id} className="border-2 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={
                    mission.type_intervention === 'HIVERNAGE' ? 'bg-blue-500' : 'bg-yellow-500'
                  }>
                    {mission.type_intervention === 'HIVERNAGE' ? '❄️ Hivernage' : '🌞 Déshivernage'}
                  </Badge>
                  {mission.priorite === 'URGENTE' && (
                    <Badge className="bg-red-500">⚠️ Urgent</Badge>
                  )}
                  <Badge variant={
                    mission.statut === 'TERMINEE' ? 'default' :
                    mission.statut === 'EN_COURS' ? 'secondary' : 'outline'
                  }>
                    {mission.statut === 'A_FAIRE' ? 'À faire' :
                     mission.statut === 'EN_COURS' ? 'En cours' :
                     mission.statut === 'EN_ATTENTE' ? 'En attente' : 'Terminée'}
                  </Badge>
                </div>
                <h3 className="font-heading text-lg text-purple-700">
                  {mission.type_hebergement} - {mission.numero_hebergement}
                </h3>
                {mission.description && (
                  <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                )}
              </div>
            </div>

            {/* Tâches */}
            <div className="space-y-1 mb-3">
              {mission.taches?.slice(0, 3).map(t => (
                <div key={t.numero} className="flex items-center gap-2 text-sm">
                  {t.faite ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={t.faite ? 'line-through text-gray-400' : ''}>
                    {t.numero}. {t.texte}
                  </span>
                </div>
              ))}
              {mission.taches?.length > 3 && (
                <p className="text-xs text-gray-500 ml-6">
                  + {mission.taches.length - 3} autres tâches
                </p>
              )}
            </div>

            {/* Infos agent */}
            {mission.pris_en_charge_par && (
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {mission.pris_en_charge_par}
                </div>
                {mission.temps_ecoule_minutes > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.floor(mission.temps_ecoule_minutes / 60)}h {mission.temps_ecoule_minutes % 60}min
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {mission.statut === 'A_FAIRE' && (
              <Button 
                onClick={() => onPrendreEnCharge(mission)}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12"
                disabled={loading}
              >
                <Play className="w-4 h-4 mr-2" />
                Commencer
              </Button>
            )}
            {(mission.statut === 'EN_COURS' || mission.statut === 'EN_ATTENTE') && (
              <Button 
                onClick={() => onContinuer(mission)}
                className={`w-full h-12 ${
                  mission.statut === 'EN_ATTENTE' 
                    ? 'bg-orange-500 hover:bg-orange-600' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={loading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {mission.statut === 'EN_ATTENTE' ? '🔄 Reprendre' : 'Traiter les tâches'}
              </Button>
            )}
            {mission.statut === 'TERMINEE' && mission.pdf_url && (
              <Button 
                onClick={() => window.open(mission.pdf_url, '_blank')}
                variant="outline"
                className="w-full border-green-500 text-green-700 h-10"
                size="sm"
              >
                📄 PDF
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}