import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function ReglesDuCamping({ lang }) {
  const regles = [
    {
      icon: '🐶',
      title: lang === 'fr' ? 'Chiens' : 'Dogs',
      content: lang === 'fr' 
        ? 'Laisse obligatoire, muselière pour cat.1/2, sacs disponibles.'
        : 'Leash required, muzzle for cat.1/2, bags available.'
    },
    {
      icon: '🚗',
      title: lang === 'fr' ? 'Circulation' : 'Traffic',
      content: lang === 'fr' 
        ? '10 km/h pour tous. Sens de circulation obligatoire.'
        : '10 km/h for everyone. Mandatory traffic direction.'
    },
    {
      icon: '🧑‍🤝‍🧑',
      title: lang === 'fr' ? 'Visiteurs' : 'Visitors',
      content: lang === 'fr' 
        ? 'Enregistrement obligatoire à l\'accueil.'
        : 'Registration required at reception.'
    },
    {
      icon: '🔇',
      title: lang === 'fr' ? 'Calme' : 'Quiet time',
      content: lang === 'fr' 
        ? '23h30 → Tranquillité assurée.'
        : '11:30pm → Peace and quiet guaranteed.'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {regles.map((regle, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="text-5xl mb-3">{regle.icon}</div>
            <h3 className="font-heading text-xl text-[#0077A8] mb-2">
              {regle.title}
            </h3>
            <p className="text-gray-600">{regle.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}