import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase } from 'lucide-react';

export default function ServiceTabs({ 
  service, 
  interventionsCount = 0, 
  missionsCount = 0,
  interventionsContent,
  missionsContent,
  lang = 'fr'
}) {
  const [activeTab, setActiveTab] = useState('interventions');

  return (
    <Tabs defaultValue="interventions" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2 mb-6 gap-2 bg-transparent p-0">
         {/* PRIORITÉ 3: Onglet Interventions Clients - TOUJOURS VERT */}
         <TabsTrigger 
           value="interventions" 
           className={`flex items-center justify-center gap-2 transition-all font-semibold border-2 rounded-lg py-3 ${
             activeTab === 'interventions'
               ? 'bg-green-500 text-white border-green-600 shadow-lg scale-105'
               : 'bg-green-100 text-green-700 border-green-400 hover:bg-green-200'
           }`}
         >
           <Users className="w-5 h-5" />
           <span>{lang === 'fr' ? 'Interventions Clients' : 'Client Interventions'}</span>
           {interventionsCount > 0 && (
             <Badge className="ml-1 bg-green-700 text-white font-bold">{interventionsCount}</Badge>
           )}
         </TabsTrigger>
         {/* PRIORITÉ 3: Onglet Missions Direction - TOUJOURS BLEU */}
         <TabsTrigger 
           value="missions" 
           className={`flex items-center justify-center gap-2 transition-all font-semibold border-2 rounded-lg py-3 ${
             activeTab === 'missions'
               ? 'bg-blue-600 text-white border-blue-700 shadow-lg scale-105'
               : 'bg-blue-100 text-blue-700 border-blue-400 hover:bg-blue-200'
           }`}
         >
           <Briefcase className="w-5 h-5" />
           <span>{lang === 'fr' ? 'Missions Direction' : 'Management Missions'}</span>
           {missionsCount > 0 && (
             <Badge className="ml-1 bg-blue-700 text-white font-bold">{missionsCount}</Badge>
           )}
         </TabsTrigger>
       </TabsList>

      <TabsContent value="interventions" className="mt-6">
        {/* PRIORITÉ 3: Fond vert clair pour Interventions Clients */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-4 border-green-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-green-300">
            <div className="w-2 h-6 bg-green-500 rounded-full" />
            <h2 className="text-lg font-semibold text-green-700">
              {lang === 'fr' ? '🏠 Interventions Clients' : '🏠 Client Interventions'}
            </h2>
          </div>
          {interventionsContent}
        </div>
      </TabsContent>

      <TabsContent value="missions" className="mt-6">
        {/* PRIORITÉ 3: Fond bleu clair pour Missions Direction */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-4 border-blue-600 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-blue-300">
            <div className="w-2 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-lg font-semibold text-blue-700">
              {lang === 'fr' ? '📋 Missions Direction' : '📋 Management Missions'}
            </h2>
          </div>
          {missionsContent}
        </div>
      </TabsContent>
    </Tabs>
  );
}