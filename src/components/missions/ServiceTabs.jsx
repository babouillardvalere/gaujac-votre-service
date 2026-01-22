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
      <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100">
        {/* PRIORITÉ 3: Onglet Interventions Clients - Couleur verte */}
        <TabsTrigger 
          value="interventions" 
          className={`flex items-center gap-2 transition-all ${
            activeTab === 'interventions'
              ? 'bg-green-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-green-50'
          }`}
        >
          <Users className="w-4 h-4" />
          {lang === 'fr' ? 'Interventions Clients' : 'Client Interventions'}
          {interventionsCount > 0 && (
            <Badge className="ml-1 bg-green-700 text-white">{interventionsCount}</Badge>
          )}
        </TabsTrigger>
        {/* PRIORITÉ 3: Onglet Missions Direction - Couleur bleue */}
        <TabsTrigger 
          value="missions" 
          className={`flex items-center gap-2 transition-all ${
            activeTab === 'missions'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-blue-50'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          {lang === 'fr' ? 'Missions Direction' : 'Management Missions'}
          {missionsCount > 0 && (
            <Badge className="ml-1 bg-blue-700 text-white">{missionsCount}</Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="interventions">
        {interventionsContent}
      </TabsContent>

      <TabsContent value="missions">
        {missionsContent}
      </TabsContent>
    </Tabs>
  );
}