import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CalendrierVue({ dossiers, onSelectDossier, view = 'month' }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const goToPrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    }
  };

  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtenir les jours à afficher selon la vue
  const getDaysToDisplay = () => {
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
    return [currentDate];
  };

  const days = getDaysToDisplay();

  // Obtenir les dossiers pour un jour donné
  const getDossiersForDay = (day) => {
    return dossiers.filter(dossier => {
      const arrivee = new Date(dossier.date_arrivee);
      const depart = new Date(dossier.date_depart);
      arrivee.setHours(0, 0, 0, 0);
      depart.setHours(23, 59, 59, 999);
      day.setHours(0, 0, 0, 0);
      
      return isWithinInterval(day, { start: arrivee, end: depart });
    });
  };

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'finalise': return 'bg-green-500';
      case 'en_cours': return 'bg-blue-500';
      case 'abandonne': return 'bg-gray-400';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div>
      {/* En-tête navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-[#0077A8]">
          {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: fr })}
          {view === 'week' && `Semaine du ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM', { locale: fr })}`}
          {view === 'day' && format(currentDate, 'dd MMMM yyyy', { locale: fr })}
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={goToToday} variant="outline" size="sm">
            Aujourd'hui
          </Button>
          <Button onClick={goToPrevious} variant="outline" size="icon">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button onClick={goToNext} variant="outline" size="icon">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Vue mois */}
      {view === 'month' && (
        <div className="grid grid-cols-7 gap-2">
          {/* En-têtes jours */}
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center font-heading text-sm text-gray-600 py-2">
              {day}
            </div>
          ))}
          
          {/* Cellules jours */}
          {days.map((day, idx) => {
            const dossiersDay = getDossiersForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <Card 
                key={idx}
                className={`min-h-24 ${!isCurrentMonth ? 'opacity-40' : ''} ${isToday ? 'border-2 border-[#00AEEF]' : ''}`}
              >
                <CardContent className="p-2">
                  <div className={`text-sm font-heading mb-1 ${isToday ? 'text-[#00AEEF] font-bold' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dossiersDay.slice(0, 3).map(dossier => (
                      <button
                        key={dossier.id}
                        onClick={() => onSelectDossier(dossier)}
                        className={`w-full text-left px-1.5 py-1 rounded text-xs font-body ${getStatutColor(dossier.statut)} text-white hover:opacity-80 transition-opacity truncate`}
                      >
                        {dossier.numero_logement} - {dossier.client_nom}
                      </button>
                    ))}
                    {dossiersDay.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dossiersDay.length - 3}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Vue semaine */}
      {view === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const dossiersDay = getDossiersForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <Card 
                key={idx}
                className={`${isToday ? 'border-2 border-[#00AEEF]' : ''}`}
              >
                <CardContent className="p-3">
                  <div className="text-center mb-3">
                    <div className="text-xs text-gray-500">
                      {format(day, 'EEE', { locale: fr })}
                    </div>
                    <div className={`text-xl font-heading ${isToday ? 'text-[#00AEEF] font-bold' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {dossiersDay.map(dossier => (
                      <button
                        key={dossier.id}
                        onClick={() => onSelectDossier(dossier)}
                        className={`w-full text-left p-2 rounded text-xs font-body ${getStatutColor(dossier.statut)} text-white hover:opacity-80 transition-opacity`}
                      >
                        <div className="font-bold">{dossier.numero_logement}</div>
                        <div className="truncate">{dossier.client_nom}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Vue jour */}
      {view === 'day' && (
        <div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {getDossiersForDay(currentDate).map(dossier => (
                  <button
                    key={dossier.id}
                    onClick={() => onSelectDossier(dossier)}
                    className={`w-full text-left p-4 rounded-xl ${getStatutColor(dossier.statut)} text-white hover:opacity-80 transition-opacity`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-heading text-lg">{dossier.numero_logement}</div>
                        <div className="font-body">{dossier.client_nom} {dossier.client_prenom}</div>
                      </div>
                      <Badge className="bg-white/20">
                        {dossier.statut}
                      </Badge>
                    </div>
                    <div className="text-sm mt-2">
                      {format(new Date(dossier.date_arrivee), 'dd/MM', { locale: fr })} → {format(new Date(dossier.date_depart), 'dd/MM', { locale: fr })}
                    </div>
                  </button>
                ))}
                {getDossiersForDay(currentDate).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucune réservation ce jour
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}