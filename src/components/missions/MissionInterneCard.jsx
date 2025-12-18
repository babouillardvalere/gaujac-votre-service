import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, PlayCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPE_ICONS = {
  DESHIVERNAGE: '🌞',
  HIVERNAGE: '❄️',
  SAISON: '📆',
  DIRECTIVE_GLOBALE: '📢'
};

const TYPE_LABELS = {
  DESHIVERNAGE: 'Déshivernage',
  HIVERNAGE: 'Hivernage',
  SAISON: 'Saison',
  DIRECTIVE_GLOBALE: 'Directive globale'
};

const STATUT_CONFIG = {
  A_FAIRE: { label: 'À faire', color: 'bg-gray-100 text-gray-800', icon: Clock },
  EN_COURS: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
  TERMINE: { label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ANNULEE: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

const PRIORITE_CONFIG = {
  BASSE: { label: 'Basse', color: 'bg-gray-200 text-gray-700' },
  NORMALE: { label: 'Normale', color: 'bg-blue-200 text-blue-700' },
  HAUTE: { label: 'Haute', color: 'bg-orange-200 text-orange-700' },
  CRITIQUE: { label: 'Critique', color: 'bg-red-200 text-red-700' }
};

export default function MissionInterneCard({ mission, onPrendreEnCharge, onCloturer, onVoirDetails }) {
  const statutConfig = STATUT_CONFIG[mission.statut] || STATUT_CONFIG.A_FAIRE;
  const prioriteConfig = PRIORITE_CONFIG[mission.priorite] || PRIORITE_CONFIG.NORMALE;
  const StatutIcon = statutConfig.icon;

  return (
    <Card className="border-2 border-purple-200 hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TYPE_ICONS[mission.type_mission]}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{mission.titre}</h3>
              <p className="text-xs text-gray-500">{TYPE_LABELS[mission.type_mission]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={statutConfig.color}>
              <StatutIcon className="w-3 h-3 mr-1" />
              {statutConfig.label}
            </Badge>
            {mission.priorite !== 'NORMALE' && (
              <Badge className={prioriteConfig.color}>
                {prioriteConfig.label}
              </Badge>
            )}
          </div>
        </div>

        {mission.description && (
          <p className="text-sm text-gray-700 mb-3">{mission.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(mission.date_debut), 'dd/MM/yyyy', { locale: fr })} → {format(new Date(mission.date_fin), 'dd/MM/yyyy', { locale: fr })}
            </span>
          </div>
          {mission.hebergement_concerne && (
            <div className="bg-gray-100 px-2 py-1 rounded">
              📍 {mission.hebergement_concerne}
            </div>
          )}
        </div>

        {mission.pris_en_charge_par && (
          <div className="text-xs text-gray-600 mb-3">
            <span className="font-semibold">Pris en charge par :</span> {mission.pris_en_charge_par}
          </div>
        )}

        <div className="flex gap-2">
          {mission.statut === 'A_FAIRE' && (
            <Button
              size="sm"
              onClick={() => onPrendreEnCharge(mission)}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              <PlayCircle className="w-4 h-4 mr-1" />
              Prendre en charge
            </Button>
          )}
          {mission.statut === 'EN_COURS' && (
            <Button
              size="sm"
              onClick={() => onCloturer(mission)}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Clôturer
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onVoirDetails(mission)}
            className="flex-1"
          >
            Détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}