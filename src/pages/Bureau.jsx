import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, History, BarChart3, Package, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

import BureauHistorique from '../components/bureau/BureauHistorique';
import BureauStatistiques from '../components/bureau/BureauStatistiques';
import BureauStock from '../components/bureau/BureauStock';
import BureauLogements from '../components/bureau/BureauLogements';

export default function Bureau() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('historique');

  useEffect(() => {
    if (sessionStorage.getItem('collaborateur_role') !== 'bureau') {
      navigate('/Collaborateur');
    }
  }, [navigate]);

  const tabs = [
    { id: 'historique', icon: History, label: t('historique') },
    { id: 'statistiques', icon: BarChart3, label: t('statistiques') },
    { id: 'stock', icon: Package, label: t('stock') },
    { id: 'logements', icon: Home, label: 'Logements' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/Collaborateur')}
                className="flex items-center text-slate-500 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Logo className="h-12" />
            </div>
            <h1 className="text-xl font-semibold text-slate-800">{t('bureau')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 gap-2 bg-slate-100 p-1 rounded-xl mb-6">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="historique">
            <BureauHistorique />
          </TabsContent>

          <TabsContent value="statistiques">
            <BureauStatistiques />
          </TabsContent>

          <TabsContent value="stock">
            <BureauStock />
          </TabsContent>

          <TabsContent value="logements">
            <BureauLogements />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}