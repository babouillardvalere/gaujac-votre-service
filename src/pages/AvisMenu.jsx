import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Star, Smartphone, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function AvisMenu() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const isFrench = lang === 'fr';

  const menuItems = [
    {
      title: '⭐ ' + (isFrench ? 'Avis sur une intervention' : 'Review an intervention'),
      titleEn: '⭐ Review an intervention',
      description: isFrench ? 'Noter la qualité du service' : 'Rate service quality',
      href: 'AvisIdentification',
      color: 'bg-gradient-to-br from-[#FFD700] to-[#FFA500]',
      icon: Star
    },
    {
      title: '📱 ' + (isFrench ? 'Avis sur l\'application' : 'App Feedback'),
      titleEn: '📱 App Feedback',
      description: isFrench ? 'Aidez-nous à améliorer l\'app' : 'Help us improve the app',
      href: 'AvisApplicationForm',
      color: 'bg-gradient-to-br from-[#00AEEF] to-[#0077A8]',
      icon: Smartphone
    },
    {
      title: '👀 ' + (isFrench ? 'Voir les avis' : 'View reviews'),
      titleEn: '👀 View reviews',
      description: isFrench ? 'Consulter les avis clients' : 'Browse guest reviews',
      href: 'MeilleursAvis',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      icon: Eye
    }
  ];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
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
          </div>

          <Logo className="h-16 mb-4" />
          <h1 className="font-handwritten text-4xl text-[#00AEEF] text-center mb-2">
            {isFrench ? '⭐ Avis & Retours' : '⭐ Reviews & Feedback'}
          </h1>
          <p className="text-center text-gray-600 font-body">
            {isFrench ? 'Partagez votre expérience' : 'Share your experience'}
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
                <Card className="border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-xl transition-all rounded-xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`${item.color} p-6 flex items-center justify-between min-h-[110px]`}>
                      <div className="flex-1">
                        <h2 className="font-heading text-2xl text-white mb-2 group-hover:scale-105 transition-transform">
                          {isFrench ? item.title : item.titleEn}
                        </h2>
                        <p className="text-white/90 font-body text-sm">
                          {item.description}
                        </p>
                      </div>
                      <item.icon className="w-12 h-12 text-white/80 ml-4" />
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