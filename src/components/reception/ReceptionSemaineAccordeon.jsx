import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar } from 'lucide-react';

export default function ReceptionSemaineAccordeon({ semaines, children, lang = 'fr' }) {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {semaines.map(semaine => (
        <AccordionItem 
          key={semaine.numero} 
          value={`semaine-${semaine.numero}`}
          className="border-2 border-[#00AEEF]/30 rounded-xl overflow-hidden"
        >
          <AccordionTrigger className="px-6 py-4 hover:bg-[#e6f7ff] hover:no-underline">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#00AEEF]" />
              <span className="font-heading text-lg text-[#0077A8]">
                {lang === 'fr' ? 'Semaine' : 'Week'} {semaine.numero} : {semaine.label}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            {children(semaine)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}