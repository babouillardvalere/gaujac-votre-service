import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MissionCalendarView({ missions, onMissionClick }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const missionsByDate = useMemo(() => {
    const map = new Map();
    missions.forEach(mission => {
      if (mission.date_prise_en_charge) {
        const dateStr = format(parseISO(mission.date_prise_en_charge), 'yyyy-MM-dd');
        if (!map.has(dateStr)) {
          map.set(dateStr, []);
        }
        map.get(dateStr).push(mission);
      }
    });
    return map;
  }, [missions]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold"
        >
          ←
        </button>
        <h3 className="text-xl font-bold text-purple-700">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>
        <button
          onClick={goToNextMonth}
          className="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg font-semibold"
        >
          →
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Days of week */}
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="text-center font-semibold text-sm text-gray-600 p-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {daysInMonth.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayMissions = missionsByDate.get(dateStr) || [];
          const isToday = isSameDay(day, new Date());

          return (
            <Card
              key={idx}
              className={`min-h-[100px] border-2 ${
                isToday ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              } hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-2">
                <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-purple-700' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayMissions.map((mission, mIdx) => (
                    <button
                      key={mIdx}
                      onClick={() => onMissionClick(mission)}
                      className={`w-full text-left px-2 py-1 rounded text-xs font-medium ${
                        mission.statut === 'TERMINEE' ? 'bg-green-100 text-green-800' :
                        mission.statut === 'EN_COURS' ? 'bg-blue-100 text-blue-800' :
                        mission.statut === 'EN_ATTENTE' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      } hover:opacity-80 truncate`}
                      title={`${mission.type_hebergement} - ${mission.numero_hebergement}`}
                    >
                      {mission.numero_hebergement}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex gap-4 justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span className="text-xs">À faire</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <span className="text-xs">En cours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 rounded"></div>
          <span className="text-xs">En attente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded"></div>
          <span className="text-xs">Terminée</span>
        </div>
      </div>
    </div>
  );
}