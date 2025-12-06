import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServicesEtCommodites({ lang }) {
  return (
    <div className="space-y-6">
      {/* Laverie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🧼 {lang === 'fr' ? 'Laverie' : 'Laundry'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="flex items-center gap-2">
            🌀 {lang === 'fr' ? 'Machines à laver & sèche-linge' : 'Washing machines & dryers'}
          </p>
          <p className="flex items-center gap-2">
            🧴 {lang === 'fr' ? 'Lessive incluse automatiquement' : 'Detergent included automatically'}
          </p>
          <p className="flex items-center gap-2">
            💳 {lang === 'fr' ? 'Paiement CB sur centrale' : 'Credit card payment on central unit'}
          </p>
          <p className="flex items-center gap-2">
            📱 {lang === 'fr' ? 'Ou via application Washin\'' : 'Or via Washin\' app'}
          </p>
        </CardContent>
      </Card>

      {/* Recharge véhicule électrique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🔌 {lang === 'fr' ? 'Recharge véhicule électrique' : 'Electric vehicle charging'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="flex items-center gap-2">
            ⚡ {lang === 'fr' ? '2 bornes à l\'entrée' : '2 charging stations at the entrance'}
          </p>
          <p className="flex items-center gap-2">
            💰 0,45 € / kWh
          </p>
        </CardContent>
      </Card>

      {/* Forfait ménage */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            🧽 {lang === 'fr' ? 'Forfait ménage (Important)' : 'Cleaning package (Important)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-bold text-orange-800">
            {lang === 'fr' ? 'Le forfait ménage n\'inclut pas :' : 'The cleaning package does NOT include:'}
          </p>
          <p className="flex items-center gap-2 text-orange-700">
            ⛔ {lang === 'fr' ? 'Nettoyage du frigo' : 'Cleaning the fridge'}
          </p>
          <p className="flex items-center gap-2 text-orange-700">
            ⛔ {lang === 'fr' ? 'Nettoyage du micro-ondes' : 'Cleaning the microwave'}
          </p>
          <p className="flex items-center gap-2 text-orange-700">
            ⛔ {lang === 'fr' ? 'Vaisselle + rangement' : 'Doing the dishes + tidying'}
          </p>
          <p className="flex items-center gap-2 text-orange-700">
            ⛔ {lang === 'fr' ? 'Sortir les poubelles' : 'Taking out the trash'}
          </p>
        </CardContent>
      </Card>

      {/* Animaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🐶 {lang === 'fr' ? 'Animaux' : 'Pets'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• {lang === 'fr' ? 'Chiens tenus en laisse' : 'Dogs must be on a leash'}</p>
          <p>• {lang === 'fr' ? 'Cat. 1 & 2 : laisse + muselière' : 'Cat. 1 & 2: leash + muzzle'}</p>
          <p>• {lang === 'fr' ? 'Ramasser les déjections' : 'Pick up after your dog'}</p>
          <p>• {lang === 'fr' ? 'Kits chien disponibles à l\'accueil' : 'Dog kits available at reception'}</p>
        </CardContent>
      </Card>

      {/* Circulation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🚗 {lang === 'fr' ? 'Circulation' : 'Traffic'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• {lang === 'fr' ? 'Vitesse max 10 km/h' : 'Max speed 10 km/h'}</p>
          <p>• {lang === 'fr' ? '1 véhicule par famille' : '1 vehicle per family'}</p>
          <p>• {lang === 'fr' ? 'Accès voiture : 7h00 → 00h00' : 'Car access: 7am → 12am'}</p>
          <p>• {lang === 'fr' ? 'Sens de circulation obligatoire' : 'Mandatory traffic direction'}</p>
        </CardContent>
      </Card>

      {/* Visiteurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🧑‍🤝‍🧑 {lang === 'fr' ? 'Visiteurs' : 'Visitors'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>• {lang === 'fr' ? 'Passage obligatoire à l\'accueil' : 'Must check in at reception'}</p>
          <p>• {lang === 'fr' ? 'Taxe de séjour (haute saison)' : 'Tourist tax (high season)'}</p>
          <p>• {lang === 'fr' ? 'Voitures → parking extérieur' : 'Cars → external parking'}</p>
        </CardContent>
      </Card>
    </div>
  );
}