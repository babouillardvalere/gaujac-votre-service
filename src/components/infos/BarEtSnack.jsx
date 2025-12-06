import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function BarEtSnack({ lang }) {
  return (
    <div className="space-y-6">
      {/* Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🍸 {lang === 'fr' ? 'Bar (Marie & son équipe)' : 'Bar (Marie & her team)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            {lang === 'fr' 
              ? 'Cocktails, softs, alcools, boissons chaudes.'
              : 'Cocktails, soft drinks, spirits, hot beverages.'
            }
          </p>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <h3 className="font-heading text-lg text-yellow-800 mb-2">
              🥐 {lang === 'fr' ? 'Pain & Viennoiseries' : 'Bread & Pastries'}
            </h3>
            <p className="text-sm text-yellow-700 mb-2">
              {lang === 'fr' 
                ? 'Réservation avant 18h30. Retrait au bar le matin.'
                : 'Order before 6:30pm. Pick up at the bar in the morning.'
              }
            </p>
            <div className="space-y-1 text-sm">
              <p>🥖 {lang === 'fr' ? 'Baguette' : 'Baguette'}: 1.20 €</p>
              <p>🥐 {lang === 'fr' ? 'Croissant' : 'Croissant'}: 1.20 €</p>
              <p>🍫 {lang === 'fr' ? 'Pain au chocolat' : 'Pain au chocolat'}: 1.20 €</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="font-heading text-lg text-[#0077A8] mb-3">
              🕒 {lang === 'fr' ? 'Horaires Bar' : 'Bar Schedule'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="font-bold text-gray-700">
                  {lang === 'fr' ? 'Basse saison' : 'Low season'}
                </p>
                <p className="text-sm">11h–14h / 17h–22h</p>
                <p className="text-sm text-red-600">
                  ❌ {lang === 'fr' ? 'Fermé mardi' : 'Closed Tuesday'}
                </p>
              </div>

              <div>
                <p className="font-bold text-gray-700">
                  {lang === 'fr' ? 'Haute saison' : 'High season'}
                </p>
                <p className="text-sm">{lang === 'fr' ? 'Lun–Ven' : 'Mon–Fri'}: 9h–14h / 16h–23h30</p>
                <p className="text-sm">{lang === 'fr' ? 'Sam' : 'Sat'}: 8h30–23h30</p>
                <p className="text-sm">{lang === 'fr' ? 'Dim' : 'Sun'}: 8h30–14h / 16h–23h30</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Snack */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0077A8]">
            🍔 {lang === 'fr' ? 'Snack (Isabelle & son équipe)' : 'Snack (Isabelle & her team)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            {lang === 'fr' 
              ? 'Burgers, pizzas, salades, glaces, gaufres.'
              : 'Burgers, pizzas, salads, ice cream, waffles.'
            }
          </p>

          <div>
            <h3 className="font-heading text-lg text-[#0077A8] mb-3">
              🕒 {lang === 'fr' ? 'Horaires Snack' : 'Snack Schedule'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="font-bold text-gray-700">
                  {lang === 'fr' ? 'Basse saison' : 'Low season'}
                </p>
                <p className="text-sm">11h–14h / 17h–22h</p>
                <p className="text-sm text-orange-600">
                  🔥 {lang === 'fr' ? 'Service chaud' : 'Hot food'}: 18h30–21h30
                </p>
                <p className="text-sm text-red-600">
                  ❌ {lang === 'fr' ? 'Fermé mardi' : 'Closed Tuesday'}
                </p>
              </div>

              <div>
                <p className="font-bold text-gray-700">
                  {lang === 'fr' ? 'Haute saison' : 'High season'}
                </p>
                <p className="text-sm">{lang === 'fr' ? 'Dim–Ven' : 'Sun–Fri'}: 11h–14h / 16h–23h</p>
                <p className="text-sm">{lang === 'fr' ? 'Sam' : 'Sat'}: 11h–15h / 16h–23h</p>
                <p className="text-sm text-orange-600">
                  🔥 {lang === 'fr' ? 'Service chaud' : 'Hot food'}: 18h30–22h30
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}