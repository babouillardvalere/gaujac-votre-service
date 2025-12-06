import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '../../utils';

export default function InterventionsEtAstreintes({ lang }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Horaires techniques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🔧 {lang === 'fr' ? 'Horaires Techniques' : 'Technical Schedule'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-bold text-gray-700">
              {lang === 'fr' ? 'Basse saison' : 'Low season'}
            </p>
            <p className="text-sm">9h–12h / 13h30–18h30</p>
          </div>
          <div>
            <p className="font-bold text-gray-700">
              {lang === 'fr' ? 'Haute saison' : 'High season'}
            </p>
            <p className="text-sm">{lang === 'fr' ? 'Dim–Ven' : 'Sun–Fri'}: 8h30–12h / 14h–20h</p>
            <p className="text-sm">{lang === 'fr' ? 'Sam' : 'Sat'}: 8h30–20h ({lang === 'fr' ? 'journée continue' : 'continuous day'})</p>
          </div>
        </CardContent>
      </Card>

      {/* Horaires ménage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🧹 {lang === 'fr' ? 'Horaires Ménage' : 'Housekeeping Schedule'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>9h–16h</p>
          <p className="text-sm text-gray-600 mt-2">
            {lang === 'fr' 
              ? 'Week-end été : renfort selon disponibilité'
              : 'Summer weekends: reinforcement as available'
            }
          </p>
        </CardContent>
      </Card>

      {/* Déclarer un problème */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            📝 {lang === 'fr' ? 'Déclarer un problème' : 'Report an issue'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-blue-900">
            {lang === 'fr' 
              ? 'Vous pouvez signaler :'
              : 'You can report:'
            }
          </p>
          <div className="space-y-1 text-sm">
            <p>• {lang === 'fr' ? 'Problème technique' : 'Technical issue'}</p>
            <p>• {lang === 'fr' ? 'Ménage' : 'Housekeeping'}</p>
            <p>• {lang === 'fr' ? 'Nuisibles' : 'Pests'}</p>
            <p>• {lang === 'fr' ? 'Matériel cassé' : 'Broken equipment'}</p>
            <p>• {lang === 'fr' ? 'Dysfonctionnement divers' : 'Various malfunctions'}</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('ClientMenu'))}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {lang === 'fr' ? '📢 Faire un signalement' : '📢 Report an issue'}
          </Button>
        </CardContent>
      </Card>

      {/* Astreintes */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            🚨 {lang === 'fr' ? 'Astreintes (20h–23h)' : 'On-call (8pm–11pm)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-bold text-red-800">
            {lang === 'fr' ? 'Uniquement :' : 'Only:'}
          </p>
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-red-700">
              💧 {lang === 'fr' ? 'Pas d\'eau' : 'No water'}
            </p>
            <p className="flex items-center gap-2 text-red-700">
              🔥 {lang === 'fr' ? 'Pas de gaz' : 'No gas'}
            </p>
            <p className="flex items-center gap-2 text-red-700">
              ⚡ {lang === 'fr' ? 'Pas d\'électricité' : 'No electricity'}
            </p>
          </div>
          <p className="text-sm text-red-600 mt-3">
            {lang === 'fr' 
              ? 'Autres demandes → le lendemain.'
              : 'Other requests → the next day.'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}