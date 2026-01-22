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