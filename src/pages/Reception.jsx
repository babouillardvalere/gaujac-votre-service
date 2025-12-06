import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceptionArrivees from './ReceptionArrivees';
import ReceptionDeparts from './ReceptionDeparts';
import ReceptionAssistance from './ReceptionAssistance';
import ReceptionSuivi from './ReceptionSuivi';
import CollaborateurNotificationBell from '../components/CollaborateurNotificationBell';
import { ArrowLeft, LogIn, LogOut, HeadphonesIcon, Home, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Reception() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('arrivees');

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
    <div className="min-h-screen px-6 py-8" role="main" aria-label="Accueil > Collaborateur > Réception">
      <h1 className="sr-only">Accueil > Collaborateur > Réception - Arrivées, départs et assistance</h1>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-end gap-2 mb-4">
            <button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              className="p-2 hover:bg-[#00AEEF]/20 rounded-lg"
              title="Retour menu collaborateur"
            >
              <Home className="w-6 h-6 text-[#00AEEF]" />
            </button>
            <CollaborateurNotificationBell />
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-4xl text-[#00AEEF] text-center mb-2">
            📋 {lang === 'fr' ? 'Réception' : 'Reception'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-8">
            {lang === 'fr' ? 'Gestion des arrivées, départs et assistance' : 'Arrivals, departures & assistance management'}
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="assistance" className="flex items-center gap-2 text-sm font-heading">
                <HeadphonesIcon className="w-4 h-4" />
                🆘 {lang === 'fr' ? 'Assistance' : 'Assistance'}
              </TabsTrigger>
              <TabsTrigger value="suivi" className="flex items-center gap-2 text-sm font-heading">
                <ClipboardList className="w-4 h-4" />
                📊 {lang === 'fr' ? 'Suivi' : 'Tracking'}
              </TabsTrigger>
              <TabsTrigger value="arrivees" className="flex items-center gap-2 text-sm font-heading relative">
                <LogIn className="w-4 h-4" />
                🏡 {lang === 'fr' ? 'Arrivées' : 'Arrivals'}
                <span className="ml-1 min-w-5 h-5 inline-flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-[#E63946] text-white">
                  {arrivees.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="departs" className="flex items-center gap-2 text-sm font-heading relative">
                <LogOut className="w-4 h-4" />
                🚗 {lang === 'fr' ? 'Départs' : 'Departures'}
                <span className="ml-1 min-w-5 h-5 inline-flex items-center justify-center text-xs font-bold rounded-full px-1.5 bg-[#E63946] text-white">
                  {departs.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assistance">
              <ReceptionAssistance embedded={true} />
            </TabsContent>

            <TabsContent value="suivi">
              <ReceptionSuivi embedded={true} />
            </TabsContent>

            <TabsContent value="arrivees">
              <ReceptionArrivees embedded={true} />
            </TabsContent>

            <TabsContent value="departs">
              <ReceptionDeparts embedded={true} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}