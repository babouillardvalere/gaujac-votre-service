import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReceptionMoisOnglets({ children, lang = 'fr', startYear, endYear }) {
  // Générer les 12 mois glissants : Décembre → Novembre
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // Déterminer les années de départ et fin si non fournies
  const anneeDebut = startYear || (currentMonth < 11 ? currentYear - 1 : currentYear);
  const anneeFin = endYear || anneeDebut + 1;
  
  const moisLabels = {
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };

  // Générer les 12 onglets : Décembre année N → Novembre année N+1
  const mois = [];
  for (let i = 0; i < 12; i++) {
    const moisIndex = (11 + i) % 12; // Commence en décembre (11)
    const annee = moisIndex < 11 ? anneeDebut : anneeFin;
    const moisStr = (moisIndex + 1).toString().padStart(2, '0');
    
    mois.push({
      value: `${annee}-${moisStr}`,
      label: `${moisLabels[lang][moisIndex]} ${annee}`,
      moisSeul: moisStr,
      annee: annee
    });
  }

  // Mois par défaut = mois actuel si dans la plage, sinon le premier
  const currentMonthStr = (currentMonth + 1).toString().padStart(2, '0');
  const currentYearMonthKey = `${currentYear}-${currentMonthStr}`;
  const defaultMonth = mois.find(m => m.value === currentYearMonthKey)?.value || mois[0].value;

  return (
    <Tabs defaultValue={defaultMonth} className="w-full">
      <TabsList className="grid w-full grid-cols-6 md:grid-cols-12 gap-1 mb-6 h-auto">
        {mois.map(m => (
          <TabsTrigger 
            key={m.value} 
            value={m.value}
            className="data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white text-xs py-2"
          >
            {m.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {mois.map(m => (
        <TabsContent key={m.value} value={m.value}>
          {children(m.moisSeul, m.annee)}
        </TabsContent>
      ))}
    </Tabs>
  );
}