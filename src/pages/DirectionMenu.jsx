import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sun, Snowflake, Wrench, ArrowLeft, ShoppingCart, Activity, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import Logo from '../components/Logo';

export default function DirectionMenu() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: '🔧 Interventions',
      titleEn: '🔧 Interventions',
      icon: Wrench,
      href: 'DirectionInterventions',
      color: 'bg-[#9333ea]',
      textColor: 'text-white',
      description: 'Créer des interventions opérationnelles',
      descriptionEn: 'Create operational interventions'
    },
    {
      title: '📦 Commandes',
      titleEn: '📦 Orders',
      icon: ShoppingCart,
      href: 'DirectionCommandes',
      color: 'bg-[#22c55e]',
      textColor: 'text-white',
      description: 'Gestion des commandes',
      descriptionEn: 'Order management'
    },
    {
      title: '🌞 Déshivernage',
      titleEn: '🌞 Spring Opening',
      icon: Sun,
      href: 'DirectionSuiviDeshivernage',
      color: 'bg-[#FFD700]',
      textColor: 'text-[#0077A8]',
      description: 'Suivi Déshivernage',
      descriptionEn: 'Spring Opening tracking'
    },
    {
      title: '❄️ Hivernage',
      titleEn: '❄️ Winter Closing',
      icon: Snowflake,
      href: 'DirectionSuiviHivernage',
      color: 'bg-[#00AEEF]',
      textColor: 'text-white',
      description: 'Suivi Hivernage',
      descriptionEn: 'Winter Closing tracking'
    },
    {
      title: '🩺 Santé Système',
      titleEn: '🩺 System Health',
      icon: Activity,
      href: 'QASante',
      color: 'bg-[#10b981]',
      textColor: 'text-white',
      description: 'QA: logs, tests, intégrité données',
      descriptionEn: 'QA: logs, tests, data integrity'
    },
    {
      title: '🧹 Déduplication AUTO',
      titleEn: '🧹 Auto Deduplication',
      icon: Trash2,
      href: 'AdminDeduplicationAuto',
      color: 'bg-[#dc2626]',
      textColor: 'text-white',
      description: '⚠️ LANCER MAINTENANT - Nettoyage automatique',
      descriptionEn: '⚠️ RUN NOW - Automatic cleanup'
    }
  ];

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>
          
          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-2">
            🏢 Direction
          </h1>
          <p className="text-center text-gray-600 font-body">
            {lang === 'fr' ? 'Gestion saisonnière' : 'Seasonal management'}
          </p>
        </motion.div>

        <div className="space-y-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link 
                to={createPageUrl(item.href)} 
                className="block group focus:ring-4 focus:ring-[#FFD700] rounded-xl"
              >
                <Card className="border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-lg transition-all rounded-xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center p-5 min-h-[80px]">
                      <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                        <item.icon className={`w-7 h-7 ${item.textColor}`} />
                      </div>
                      <div className="ml-5 flex-1">
                        <h2 className="font-heading text-lg text-[#0077A8] group-hover:text-[#00AEEF] transition-colors">
                          {lang === 'fr' ? item.title : item.titleEn}
                        </h2>
                        <p className="font-body text-sm text-gray-600">
                          {lang === 'fr' ? item.description : item.descriptionEn}
                        </p>
                      </div>
                      <div className="text-[#00AEEF] group-hover:translate-x-1 transition-all">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}