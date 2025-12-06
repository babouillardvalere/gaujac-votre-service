import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceptionArrivees from './ReceptionArrivees';
import ReceptionDeparts from './ReceptionDeparts';
import ReceptionAssistance from './ReceptionAssistance';
import NotificationCenter from '../components/NotificationCenter';
import { useNotifications } from '../components/useNotifications';
import { ArrowLeft, LogIn, LogOut, HeadphonesIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Reception() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('arrivees');
  const { counts } = useNotifications();

  // Compter arrivées et départs en cours
  const { data: arrivees = [] } = useQuery({
    queryKey: ['reception-arrivees'],
    queryFn: () => base44.entities.DossierArrivee.filter({ statut: 'en_cours' }),
    refetchInterval: 30000
  });

  const { data: departs = [] } = useQuery({
    queryKey: ['reception-departs'],
    queryFn: () => base44.entities.DepartCheck.list(),
    refetchInterval: 30000
  });

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
            <div className="flex items-center gap-2">
              {(arrivees.length + departs.length) > 0 && (
                <div className="relative">
                  <div className="absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-red-500 text-white shadow-lg z-10">
                    {arrivees.length + departs.length}
                  </div>
                </div>
              )}
              <NotificationCenter userType="collaborateur" />
            </div>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-4xl text-[#00AEEF] text-center mb-2">
            📋 {lang === 'fr' ? 'Réception' : 'Reception'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-8">
            {lang === 'fr' ? 'Gestion des arrivées, départs et assistance' : 'Arrivals, departures & assistance management'}
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="arrivees" className="flex items-center gap-2 text-base font-heading relative">
                <LogIn className="w-4 h-4" />
                🏡 {lang === 'fr' ? 'Arrivées' : 'Arrivals'}
                {arrivees.length > 0 && (
                  <span className="ml-1 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-red-500 text-white">
                    {arrivees.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="departs" className="flex items-center gap-2 text-base font-heading relative">
                <LogOut className="w-4 h-4" />
                🚗 {lang === 'fr' ? 'Départs' : 'Departures'}
                {departs.length > 0 && (
                  <span className="ml-1 min-w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-red-500 text-white">
                    {departs.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="assistance" className="flex items-center gap-2 text-base font-heading">
                <HeadphonesIcon className="w-4 h-4" />
                🆘 {lang === 'fr' ? 'Assistance' : 'Assistance'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="arrivees">
              <ReceptionArrivees embedded={true} />
            </TabsContent>

            <TabsContent value="departs">
              <ReceptionDeparts embedded={true} />
            </TabsContent>

            <TabsContent value="assistance">
              <ReceptionAssistance embedded={true} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}