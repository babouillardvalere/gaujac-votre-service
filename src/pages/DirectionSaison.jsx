import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function DirectionSaison() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Récupération de toutes les missions
  const { data: missions = [] } = useQuery({
    queryKey: ['missions'],
    queryFn: () => base44.entities.Mission.list()
  });

  const months = [
    { num: 0, fr: 'Janvier', en: 'January' },
    { num: 1, fr: 'Février', en: 'February' },
    { num: 2, fr: 'Mars', en: 'March' },
    { num: 3, fr: 'Avril', en: 'April' },
    { num: 4, fr: 'Mai', en: 'May' },
    { num: 5, fr: 'Juin', en: 'June' },
    { num: 6, fr: 'Juillet', en: 'July' },
    { num: 7, fr: 'Août', en: 'August' },
    { num: 8, fr: 'Septembre', en: 'September' },
    { num: 9, fr: 'Octobre', en: 'October' },
    { num: 10, fr: 'Novembre', en: 'November' },
    { num: 11, fr: 'Décembre', en: 'December' }
  ];

  const getMissionsForMonth = (monthNum) => {
    return missions.filter(m => {
      const debut = new Date(m.date_debut);
      const fin = new Date(m.date_fin);
      const monthStart = new Date(2025, monthNum, 1);
      const monthEnd = new Date(2025, monthNum + 1, 0);
      return (debut <= monthEnd && fin >= monthStart);
    });
  };

  const getTypeBadge = (type) => {
    const config = {
      DESHIVERNAGE: { icon: '🌞', label: lang === 'fr' ? 'Déshivernage' : 'Spring Opening', color: 'bg-yellow-100 text-yellow-800' },
      HIVERNAGE: { icon: '❄️', label: lang === 'fr' ? 'Hivernage' : 'Winter Closing', color: 'bg-blue-100 text-blue-800' },
      SAISON: { icon: '🌊', label: 'Saison', color: 'bg-green-100 text-green-800' }
    };
    const conf = config[type] || config.SAISON;
    return <Badge className={conf.color}>{conf.icon} {conf.label}</Badge>;
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'TERMINE': return 'border-green-500 bg-green-50';
      case 'EN_COURS': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(createPageUrl('DirectionMenu'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">📆</span>
            <h1 className="font-handwritten text-4xl text-[#00AEEF]">
              {lang === 'fr' ? 'Vue Saison' : 'Season Overview'}
            </h1>
          </div>
          <p className="text-gray-600 font-body">
            {lang === 'fr' ? 'Vue globale annuelle : déshivernage, saison, hivernage' : 'Annual overview: spring opening, season, winter closing'}
          </p>
        </div>

        {/* Timeline annuelle */}
        <Card className="mb-6 border-2 border-[#00AEEF]/30">
          <CardHeader>
            <CardTitle className="font-heading text-[#0077A8] flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {lang === 'fr' ? 'Calendrier 2025' : '2025 Calendar'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-2">
              {months.map(month => {
                const missionsCount = getMissionsForMonth(month.num).length;
                const hasDeshivernage = getMissionsForMonth(month.num).some(m => m.type === 'DESHIVERNAGE');
                const hasHivernage = getMissionsForMonth(month.num).some(m => m.type === 'HIVERNAGE');
                
                return (
                  <button
                    key={month.num}
                    onClick={() => setSelectedMonth(month.num)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      selectedMonth === month.num 
                        ? 'border-[#00AEEF] bg-[#00AEEF]/10' 
                        : 'border-gray-200 hover:border-[#00AEEF]/50'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {lang === 'fr' ? month.fr : month.en}
                    </div>
                    {hasDeshivernage && <span className="text-lg">🌞</span>}
                    {hasHivernage && <span className="text-lg">❄️</span>}
                    {missionsCount > 0 && (
                      <div className="text-xs font-bold text-[#00AEEF] mt-1">
                        {missionsCount} {lang === 'fr' ? 'missions' : 'missions'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Détail du mois sélectionné */}
        <Card className="border-2 border-[#00AEEF]/30">
          <CardHeader>
            <CardTitle className="font-heading text-[#0077A8]">
              {lang === 'fr' ? months[selectedMonth].fr : months[selectedMonth].en} 2025
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getMissionsForMonth(selectedMonth).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {lang === 'fr' ? 'Aucune mission ce mois-ci' : 'No missions this month'}
              </p>
            ) : (
              <div className="space-y-3">
                {getMissionsForMonth(selectedMonth).map(mission => (
                  <div
                    key={mission.id}
                    className={`p-4 rounded-lg border-2 ${getStatutColor(mission.statut)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-heading text-base text-[#0077A8] mb-1">
                          {mission.titre}
                        </h4>
                        <p className="text-sm text-gray-600">{mission.description}</p>
                      </div>
                      {getTypeBadge(mission.type)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{mission.date_debut} → {mission.date_fin}</span>
                      </div>
                      <div className="flex gap-1">
                        {mission.services?.map(service => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistiques globales */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">🌞</div>
              <div className="text-2xl font-bold text-yellow-800">
                {missions.filter(m => m.type === 'DESHIVERNAGE').length}
              </div>
              <div className="text-sm text-yellow-700">
                {lang === 'fr' ? 'Déshivernage' : 'Spring Opening'}
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">❄️</div>
              <div className="text-2xl font-bold text-blue-800">
                {missions.filter(m => m.type === 'HIVERNAGE').length}
              </div>
              <div className="text-sm text-blue-700">
                {lang === 'fr' ? 'Hivernage' : 'Winter Closing'}
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-bold text-green-800">
                {missions.filter(m => m.statut === 'TERMINE').length}
              </div>
              <div className="text-sm text-green-700">
                {lang === 'fr' ? 'Terminées' : 'Completed'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}