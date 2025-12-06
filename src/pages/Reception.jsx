import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReceptionArrivees from './ReceptionArrivees';
import ReceptionDeparts from './ReceptionDeparts';
import ReceptionAssistance from './ReceptionAssistance';
import { ArrowLeft, LogIn, LogOut, HeadphonesIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function Reception() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('arrivees');

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
              <TabsTrigger value="arrivees" className="flex items-center gap-2 text-base font-heading">
                <LogIn className="w-4 h-4" />
                🏡 {lang === 'fr' ? 'Arrivées' : 'Arrivals'}
              </TabsTrigger>
              <TabsTrigger value="departs" className="flex items-center gap-2 text-base font-heading">
                <LogOut className="w-4 h-4" />
                🚗 {lang === 'fr' ? 'Départs' : 'Departures'}
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