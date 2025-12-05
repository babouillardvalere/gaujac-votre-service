import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export default function InventaireInteractif({ inventaire, lang }) {
  const [checkedItems, setCheckedItems] = useState({});

  const handleCheck = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const sections = lang === 'fr' ? inventaire.sections_fr : inventaire.sections_en;

  if (!sections) return null;

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
        <p className="text-sm text-yellow-800 font-body">
          {lang === 'fr' 
            ? '👉 Touchez les cases pour valider chaque élément. Si la case reste grise, l\'objet est considéré comme manquant ou cassé.'
            : '👉 Check the boxes to validate each item. If the box stays grey, the item is considered missing or broken.'}
        </p>
      </div>

      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex} className="border-2 border-[#22c55e]/30 rounded-xl">
          <CardHeader className="bg-[#22c55e]/10">
            <CardTitle className="font-heading text-[#0077A8] text-xl flex items-center gap-2">
              <span>{section.icon}</span>
              {section.titre}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => {
                const itemId = `${sectionIndex}-${itemIndex}`;
                const isChecked = checkedItems[itemId] || false;

                return (
                  <div 
                    key={itemId}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isChecked 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        id={itemId}
                        checked={isChecked}
                        onCheckedChange={() => handleCheck(itemId)}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <label
                        htmlFor={itemId}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-body text-gray-700">{item.nom}</span>
                      </label>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {item.quantite}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-2 border-orange-300 rounded-xl bg-orange-50">
        <CardContent className="p-4">
          <p className="font-heading text-orange-800 mb-2">
            📸 {lang === 'fr' 
              ? 'Photos en cas d\'objet manquant'
              : 'Photos in case of missing items'}
          </p>
          <p className="text-sm text-orange-700 font-body">
            {lang === 'fr'
              ? 'Si un élément n\'est pas validé, merci d\'ajouter une photo. Cela permet d\'éviter toute confusion lors de l\'état des lieux.'
              : 'If an item is not validated, please add a photo. This helps avoid any confusion during the inventory check.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}