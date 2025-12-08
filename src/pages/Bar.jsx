import React from 'react';
import { useTranslation } from '../components/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ServiceMissionDashboard from '../components/direction/ServiceMissionDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Bar() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Coffee className="w-8 h-8 text-[#ec4899]" />
            <h1 className="font-handwritten text-4xl text-[#00AEEF]">
              Bar & Snack
            </h1>
          </div>
          <p className="text-gray-600 font-body">
            {lang === 'fr' ? 'Gestion du bar et du snack' : 'Bar and snack management'}
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dashboard">
              {lang === 'fr' ? 'Missions Direction' : 'Direction Missions'}
            </TabsTrigger>
            <TabsTrigger value="gestion">
              {lang === 'fr' ? 'Gestion Bar' : 'Bar Management'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ServiceMissionDashboard service="BAR" serviceLabel="Bar" />
          </TabsContent>

          <TabsContent value="gestion">
            <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
              <CardHeader>
                <CardTitle className="font-heading text-[#0077A8]">
                  {lang === 'fr' ? 'Module en construction' : 'Module under construction'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {lang === 'fr' ? 'Fonctionnalités à venir :' : 'Features coming soon:'}
                </p>
                <ul className="mt-4 space-y-2 text-gray-600">
                  <li>• {lang === 'fr' ? 'Gestion des stocks boissons' : 'Beverage stock management'}</li>
                  <li>• {lang === 'fr' ? 'Gestion des stocks snack' : 'Snack stock management'}</li>
                  <li>• {lang === 'fr' ? 'Commandes fournisseurs' : 'Supplier orders'}</li>
                  <li>• {lang === 'fr' ? 'Inventaire quotidien' : 'Daily inventory'}</li>
                  <li>• {lang === 'fr' ? 'Horaires d\'ouverture' : 'Opening hours'}</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}