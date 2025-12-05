import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReceptionMoisOnglets({ children, lang = 'fr' }) {
  const mois = [
    { value: '05', label: lang === 'fr' ? 'Mai' : 'May' },
    { value: '06', label: lang === 'fr' ? 'Juin' : 'June' },
    { value: '07', label: lang === 'fr' ? 'Juillet' : 'July' },
    { value: '08', label: lang === 'fr' ? 'Août' : 'August' },
    { value: '09', label: lang === 'fr' ? 'Septembre' : 'September' }
  ];

  const currentMonth = new Date().getMonth() + 1;
  const currentMonthStr = currentMonth.toString().padStart(2, '0');
  const defaultMonth = mois.find(m => m.value === currentMonthStr)?.value || '07';

  return (
    <Tabs defaultValue={defaultMonth} className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-6">
        {mois.map(m => (
          <TabsTrigger 
            key={m.value} 
            value={m.value}
            className="data-[state=active]:bg-[#00AEEF] data-[state=active]:text-white"
          >
            {m.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {mois.map(m => (
        <TabsContent key={m.value} value={m.value}>
          {children(m.value)}
        </TabsContent>
      ))}
    </Tabs>
  );
}