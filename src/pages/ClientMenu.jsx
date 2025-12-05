import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ClientMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: '🏡 Arrivée',
      titleEn: '🏡 Arrival',
      href: 'ClientArrivee',
      color: 'bg-[#22c55e]',
      textColor: 'text-white',
      disabled: false,
      comingSoon: false
    },
    {
      title: '🌞 Séjour',
      titleEn: '🌞 Stay',
      href: 'IdentiteClient',
      color: 'bg-[#00AEEF]',
      textColor: 'text-white',
      disabled: false
    },
    {
      title: '🚗 Départ',
      titleEn: '🚗 Departure',
      href: 'ClientDepartIdentite',
      color: 'bg-[#FFA500]',
      textColor: 'text-white',
      disabled: false,
      comingSoon: false
    }
  ];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('Home'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
              aria-label={t('retour_accueil')}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
            <Link to={createPageUrl('ChoixLangue')}>
              <Globe className="w-6 h-6 text-[#0077A8]" />
            </Link>
          </div>

          <Logo className="h-16 mb-4" />
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-2">
            {t('client')}
          </h1>
          <p className="text-center text-gray-600 font-body">
            {t('lang') === 'fr' ? 'Choisissez votre étape' : 'Choose your step'}
          </p>
        </motion.div>

        {/* Menu Items */}
        <div className="space-y-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              {item.disabled ? (
                <Card className="border-2 border-gray-200 rounded-xl overflow-hidden opacity-60">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 min-h-[100px]">
                      <div>
                        <h2 className={`font-heading text-2xl ${item.textColor} mb-1`}>
                          {t('lang') === 'fr' ? item.title : item.titleEn}
                        </h2>
                        {item.comingSoon && (
                          <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            {t('lang') === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
                          </span>
                        )}
                      </div>
                      <div className={`w-16 h-16 rounded-xl ${item.color} flex items-center justify-center text-3xl`}>
                        {item.title.split(' ')[0]}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Link 
                  to={createPageUrl(item.href)} 
                  className="block group focus:ring-4 focus:ring-[#FFD700] rounded-xl"
                >
                  <Card className="border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-xl transition-all rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-6 min-h-[100px]">
                        <div>
                          <h2 className={`font-heading text-2xl ${item.textColor} mb-1 group-hover:scale-105 transition-transform`}>
                            {t('lang') === 'fr' ? item.title : item.titleEn}
                          </h2>
                          <p className="text-sm text-white/80">
                            {t('lang') === 'fr' ? 'Cliquez pour continuer' : 'Click to continue'}
                          </p>
                        </div>
                        <div className={`w-16 h-16 rounded-xl ${item.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
                          {item.title.split(' ')[0]}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}