import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LocationsEtPrets({ lang }) {
  return (
    <div className="space-y-6">
      {/* Locations avec caution */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            💰 {lang === 'fr' ? 'Locations avec caution' : 'Rentals with deposit'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-semibold mb-1">
              {lang === 'fr' ? '⚽ Équipements sportifs' : '⚽ Sports equipment'}
            </p>
            <div className="text-sm space-y-1 ml-4">
              <p>• {lang === 'fr' ? 'Ballons (foot, basket, volley, hand)' : 'Balls (football, basketball, volleyball, handball)'}</p>
              <p>• {lang === 'fr' ? 'Boules de pétanque' : 'Pétanque balls'}</p>
              <p>• {lang === 'fr' ? 'Raquettes tennis / ping-pong / badminton' : 'Tennis / ping-pong / badminton rackets'}</p>
              <p>• {lang === 'fr' ? 'Mini-golf (club + balles)' : 'Mini-golf (club + balls)'}</p>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-1">
              🎲 {lang === 'fr' ? 'Jeux de société' : 'Board games'}
            </p>
            <div className="grid grid-cols-2 gap-1 text-sm ml-4">
              <p>• Uno Wizz</p>
              <p>• Tangram</p>
              <p>• Memory</p>
              <p>• Tarot</p>
              <p>• Scrabble</p>
              <p>• {lang === 'fr' ? 'Échecs' : 'Chess'}</p>
              <p>• {lang === 'fr' ? '200 jeux en 1' : '200 games in 1'}</p>
              <p>• Alias</p>
              <p>• Vocabulon Junior</p>
              <p>• {lang === 'fr' ? 'Et bien plus...' : 'And many more...'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations simples */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            🛒 {lang === 'fr' ? 'Locations simples' : 'Simple rentals'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>• Plancha</p>
            <p>• Table top</p>
            <p>• {lang === 'fr' ? 'Ventilateur' : 'Fan'}</p>
            <p>• {lang === 'fr' ? 'Frigo supplémentaire' : 'Extra fridge'}</p>
            <p>• {lang === 'fr' ? 'Kit bébé (lit + chaise haute)' : 'Baby kit (crib + high chair)'}</p>
            <p>• {lang === 'fr' ? 'Draps coton (simple & double)' : 'Cotton sheets (single & double)'}</p>
            <p>• {lang === 'fr' ? 'Kit chien' : 'Dog kit'}</p>
          </div>
          <p className="text-sm text-blue-700 mt-4">
            ℹ️ {lang === 'fr' 
              ? 'Disponibles à l\'accueil selon disponibilité'
              : 'Available at reception subject to availability'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}