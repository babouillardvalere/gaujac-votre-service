import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceptionArrivees from '../components/reception/ReceptionArrivees';
import ReceptionDeparts from '../components/reception/ReceptionDeparts';
import CollaborateurNotificationBell from '../components/CollaborateurNotificationBell';
import { Home, LogIn, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function Reception() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('arrivees');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gray-200 hover:border-[#00AEEF] transition-all shadow-sm"
            >
              <Home className="w-5 h-5 text-[#00AEEF]" />
              <span className="font-heading text-[#0077A8]">{lang === 'fr' ? 'Menu' : 'Menu'}</span>
            </button>
            <CollaborateurNotificationBell />
          </div>

          <Logo className="h-16 mb-6" />
          
          <div className="text-center mb-8">
            <h1 className="font-handwritten text-5xl text-[#00AEEF] mb-2">
              📋 {lang === 'fr' ? 'Réception' : 'Reception'}
            </h1>
            <p className="text-gray-600 font-body text-lg">
              {lang === 'fr' ? 'Gestion des arrivées et départs' : 'Arrivals and departures management'}
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 gap-3 mb-8 bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="arrivees" 
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 bg-white data-[state=active]:border-green-500 data-[state=active]:bg-green-50 data-[state=active]:shadow-lg transition-all h-auto"
              >
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
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 bg-white data-[state=active]:border-orange-500 data-[state=active]:bg-orange-50 data-[state=active]:shadow-lg transition-all h-auto"
              >
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
              <TabsContent value="arrivees" className="mt-0">
                <ReceptionArrivees lang={lang} />
              </TabsContent>

              <TabsContent value="departs" className="mt-0">
                <ReceptionDeparts lang={lang} />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}