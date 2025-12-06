import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceptionArrivees from './ReceptionArrivees';
import ReceptionDeparts from './ReceptionDeparts';
import ReceptionAssistance from './ReceptionAssistance';
import ReceptionSuivi from './ReceptionSuivi';
import CollaborateurNotificationBell from '../components/CollaborateurNotificationBell';
import { ArrowLeft, LogIn, LogOut, HeadphonesIcon, Home, ClipboardList, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function Reception() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('assistance');

  // Gérer les paramètres URL pour activer le bon onglet
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['assistance', 'suivi', 'arrivees', 'departs'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-6 py-8" role="main" aria-label="Accueil > Collaborateur > Réception">
      <h1 className="sr-only">Accueil > Collaborateur > Réception - Arrivées, départs et assistance</h1>
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gray-200 hover:border-[#00AEEF] transition-all shadow-sm"
              title="Retour menu collaborateur"
            >
              <Home className="w-5 h-5 text-[#00AEEF]" />
              <span className="font-heading text-[#0077A8]">{lang === 'fr' ? 'Menu' : 'Menu'}</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(createPageUrl('DashboardReception'))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00AEEF] to-[#0077A8] hover:from-[#0077A8] hover:to-[#005580] text-white transition-all shadow-md"
                title="Tableau de bord"
              >
                <ClipboardList className="w-5 h-5" />
                <span className="font-heading">{lang === 'fr' ? 'Dashboard' : 'Dashboard'}</span>
              </button>
              <CollaborateurNotificationBell />
            </div>
          </div>

          <Logo className="h-16 mb-6" />
          
          <div className="text-center mb-8">
            <h1 className="font-handwritten text-5xl text-[#00AEEF] mb-2">
              📋 {lang === 'fr' ? 'Réception' : 'Reception'}
            </h1>
            <p className="text-gray-600 font-body text-lg">
              {lang === 'fr' ? 'Gestion des arrivées, départs et assistance' : 'Arrivals, departures & assistance management'}
            </p>
          </div>

          {/* Tabs avec design amélioré */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 gap-3 mb-8 bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="assistance" 
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 bg-white data-[state=active]:border-red-500 data-[state=active]:bg-red-50 data-[state=active]:shadow-lg transition-all h-auto"
              >
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <HeadphonesIcon className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-center">
                  <p className="font-heading text-lg text-gray-900">
                    {lang === 'fr' ? 'Assistance Clients' : 'Guest Assistance'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === 'fr' ? 'Arrivée/Départ/Séjour' : 'Arrival/Departure/Stay'}
                  </p>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="suivi" 
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 bg-white data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50 data-[state=active]:shadow-lg transition-all h-auto"
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="font-heading text-lg text-gray-900">
                    {lang === 'fr' ? 'Suivi Interventions' : 'Intervention Tracking'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === 'fr' ? 'Toutes origines' : 'All sources'}
                  </p>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="arrivees" 
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 bg-white data-[state=active]:border-green-500 data-[state=active]:bg-green-50 data-[state=active]:shadow-lg transition-all h-auto relative"
              >
                {arrivees.length > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-8 h-8 flex items-center justify-center text-sm font-bold rounded-full px-2 bg-red-500 text-white shadow-lg animate-pulse">
                    {arrivees.length}
                  </span>
                )}
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <LogIn className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-heading text-lg text-gray-900">
                    {lang === 'fr' ? 'Arrivées' : 'Arrivals'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === 'fr' ? 'Dossiers & inventaires' : 'Files & inventories'}
                  </p>
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="departs" 
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 bg-white data-[state=active]:border-orange-500 data-[state=active]:bg-orange-50 data-[state=active]:shadow-lg transition-all h-auto relative"
              >
                {departs.length > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-8 h-8 flex items-center justify-center text-sm font-bold rounded-full px-2 bg-red-500 text-white shadow-lg animate-pulse">
                    {departs.length}
                  </span>
                )}
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <LogOut className="w-8 h-8 text-orange-600" />
                </div>
                <div className="text-center">
                  <p className="font-heading text-lg text-gray-900">
                    {lang === 'fr' ? 'Départs' : 'Departures'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === 'fr' ? 'Dossiers & états' : 'Files & conditions'}
                  </p>
                </div>
              </TabsTrigger>
            </TabsList>

            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
              <TabsContent value="assistance" className="mt-0">
                <ReceptionAssistance embedded={true} />
              </TabsContent>

              <TabsContent value="suivi" className="mt-0">
                <ReceptionSuivi embedded={true} />
              </TabsContent>

              <TabsContent value="arrivees" className="mt-0">
                <ReceptionArrivees embedded={true} />
              </TabsContent>

              <TabsContent value="departs" className="mt-0">
                <ReceptionDeparts embedded={true} />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}