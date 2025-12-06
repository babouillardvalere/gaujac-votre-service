import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnimationsEtLoisirs({ lang }) {
  return (
    <div className="space-y-6">
      {/* Espace aquatique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🏊 {lang === 'fr' ? 'Espace aquatique' : 'Aquatic area'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• {lang === 'fr' ? 'Ouvert du 07/05/24 au 08/09/24' : 'Open from 05/07/24 to 09/08/24'}</p>
          <p>• {lang === 'fr' ? 'Pataugeoire + bassin' : 'Paddling pool + swimming pool'}</p>
          <p>• {lang === 'fr' ? 'Shorts et bermudas interdits' : 'Shorts and bermudas prohibited'}</p>
          <p>• {lang === 'fr' ? 'Enfants sous la responsabilité des parents' : 'Children under parental supervision'}</p>
        </CardContent>
      </Card>

      {/* Piki Club */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🧒 {lang === 'fr' ? 'Piki Club (6–12 ans)' : 'Piki Club (6–12 years)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• {lang === 'fr' ? 'Activités manuelles' : 'Manual activities'}</p>
          <p>• {lang === 'fr' ? 'Jeux extérieurs' : 'Outdoor games'}</p>
          <p>• {lang === 'fr' ? 'Mini-danse' : 'Mini-dance'}</p>
          <p>• {lang === 'fr' ? 'Ateliers créatifs' : 'Creative workshops'}</p>
          <p className="text-sm text-gray-600 mt-3">
            {lang === 'fr' 
              ? 'Ouvert tous les jours sauf samedi/dimanche (juillet/août)'
              : 'Open every day except Saturday/Sunday (July/August)'
            }
          </p>
        </CardContent>
      </Card>

      {/* Aire de jeux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🤸 {lang === 'fr' ? 'Aire de jeux & Mini-ferme' : 'Playground & Mini-farm'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• {lang === 'fr' ? 'Aire entièrement rénovée' : 'Completely renovated playground'}</p>
          <p>• {lang === 'fr' ? 'Mini-ferme accessible librement' : 'Mini-farm freely accessible'}</p>
          <p>• {lang === 'fr' ? 'Espace détente famille' : 'Family relaxation area'}</p>
        </CardContent>
      </Card>

      {/* Activités sportives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            ⚽ {lang === 'fr' ? 'Activités sportives' : 'Sports activities'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 font-semibold">
            {lang === 'fr' ? 'Terrains disponibles :' : 'Available courts:'}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <p>• {lang === 'fr' ? 'Pétanque (20 pistes)' : 'Pétanque (20 courts)'}</p>
            <p>• {lang === 'fr' ? 'Football' : 'Football'}</p>
            <p>• {lang === 'fr' ? 'Volley' : 'Volleyball'}</p>
            <p>• {lang === 'fr' ? 'Basket' : 'Basketball'}</p>
            <p>• Ping-pong</p>
            <p>• Badminton</p>
            <p>• Mini-golf</p>
            <p>• {lang === 'fr' ? 'Parcours agility chiens' : 'Dog agility course'}</p>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 space-y-1">
            <p className="text-sm">🔵 {lang === 'fr' ? 'Tournois organisés chaque semaine' : 'Weekly tournaments'}</p>
            <p className="text-sm">🟡 {lang === 'fr' ? 'Challenges adolescents' : 'Teen challenges'}</p>
            <p className="text-sm">🟢 {lang === 'fr' ? 'Activités famille' : 'Family activities'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Soirées */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            🎤 {lang === 'fr' ? 'Soirées Camping Paradis (tous les soirs)' : 'Camping Paradis Evenings (every night)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• {lang === 'fr' ? 'Concerts' : 'Concerts'}</p>
          <p>• {lang === 'fr' ? 'Spectacles' : 'Shows'}</p>
          <p>• Loto</p>
          <p>• {lang === 'fr' ? 'Quizz' : 'Quiz'}</p>
          <p>• {lang === 'fr' ? 'Jeux apéro' : 'Aperitif games'}</p>
          <p>• {lang === 'fr' ? 'Soirées dansantes' : 'Dance parties'}</p>
          <p>• Karaoké</p>
          <p>• {lang === 'fr' ? 'Cinéma plein air' : 'Outdoor cinema'}</p>
          
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-3 mt-4">
            <p className="text-sm font-bold text-yellow-900">
              🎙 {lang === 'fr' ? 'Évènement spécial : Paradis des Stars' : 'Special event: Paradis des Stars'}
            </p>
          </div>

          <p className="text-sm text-gray-600 mt-3">
            ⏰ {lang === 'fr' 
              ? 'Toutes les animations s\'arrêtent à 23h30 pour garantir le calme.'
              : 'All entertainment ends at 11:30pm to ensure peace and quiet.'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}