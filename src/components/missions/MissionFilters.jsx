import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function MissionFilters({ 
  filterStatut, 
  setFilterStatut, 
  filterDateDebut,
  setFilterDateDebut,
  filterDateFin,
  setFilterDateFin,
  filterAgent,
  setFilterAgent,
  agents,
  counts,
  viewMode,
  setViewMode
}) {
  const hasActiveFilters = filterDateDebut || filterDateFin || filterAgent;

  const resetFilters = () => {
    setFilterDateDebut('');
    setFilterDateFin('');
    setFilterAgent('');
  };

  return (
    <div className="space-y-4">
      {/* Onglets statuts */}
      <div className="flex gap-2 flex-wrap">
        {['A_FAIRE', 'EN_COURS', 'EN_ATTENTE', 'TERMINEE'].map(statut => (
          <Button
            key={statut}
            onClick={() => setFilterStatut(statut)}
            variant={filterStatut === statut ? 'default' : 'outline'}
            className={filterStatut === statut ? 'bg-purple-600' : ''}
            size="sm"
          >
            {statut === 'A_FAIRE' ? 'À faire' : 
             statut === 'EN_COURS' ? 'En cours' :
             statut === 'EN_ATTENTE' ? 'En attente' : 'Terminées'}
            {counts[statut] > 0 && (
              <Badge className="ml-2 bg-white/20">{counts[statut]}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Switch vue liste / calendrier */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          onClick={() => setViewMode('list')}
          size="sm"
        >
          📋 Liste
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          onClick={() => setViewMode('calendar')}
          size="sm"
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          Calendrier
        </Button>
      </div>

      {/* Filtres avancés */}
      <Card className="border-purple-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-sm text-purple-900">Filtres</span>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Date début</Label>
              <Input
                type="date"
                value={filterDateDebut}
                onChange={(e) => setFilterDateDebut(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600">Date fin</Label>
              <Input
                type="date"
                value={filterDateFin}
                onChange={(e) => setFilterDateFin(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600">Agent</Label>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="w-full h-9 text-sm border rounded-md px-2"
              >
                <option value="">Tous les agents</option>
                {agents.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}