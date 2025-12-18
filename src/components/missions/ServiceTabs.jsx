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
  return (
    <Tabs defaultValue="interventions" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="interventions" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          {lang === 'fr' ? 'Interventions Clients' : 'Client Interventions'}
          {interventionsCount > 0 && (
            <Badge className="ml-1 bg-red-500 text-white">{interventionsCount}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="missions" className="flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          {lang === 'fr' ? 'Missions Direction' : 'Management Missions'}
          {missionsCount > 0 && (
            <Badge className="ml-1 bg-purple-500 text-white">{missionsCount}</Badge>
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