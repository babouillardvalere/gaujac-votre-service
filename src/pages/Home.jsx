import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import HomeAvisSection from '../components/HomeAvisSection';
import CustomUsersIcon from '../components/CustomUsersIcon';
import {
  getAccessibilitySettings
} from '../components/AccessibilityPanel';
import { Star, Briefcase, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { t, lang } = useTranslation();
  const [accessibilitySettings] = useState(getAccessibilitySettings());

  /* =====================================================
     REDIRECTION LANGUE (SAFE BASE44)
  ===================================================== */
  useEffect(() => {
    if (!getLanguage()) {
      window.location.href = createPageUrl('ChoixLangue');
    }
  }, []);

  /* =====================================================
     MENU PRINCIPAL
  ===================================================== */
  const menuItems = [
    {
      title: t('client'),
      icon: CustomUsersIcon,
      href: 'ClientMenu',
      borderColor: 'border-[#00AEEF]',
      description: t('signaler_probleme'),
      ariaLabel: 'Signaler un problème'
    },
    {
      title: t('avis'),
      icon: Star,
      href: 'AvisMenu',
      borderColor: 'border-[#FFA500]',
      description: t('donner_avis'),
      ariaLabel: 'Voir les avis clients'
    },
    {
      title: lang === 'fr' ? '📋 Suivi interventions' : '📋 Track interventions',
      icon: BookOpen,
      href: 'ClientSuiviSearch',
      borderColor: 'border-[#9333ea]',
      description:
        lang === 'fr'
          ? 'Suivre ménage & technique'
          : 'Track housekeeping & technical',
      ariaLabel:
        lang === 'fr'
          ? 'Suivi des interventions'
          : 'Track interventions'
    },
    {
      title: lang === 'fr' ? '📖 Infos Pratiques' : '📖 Practical Info',
      icon: BookOpen,
      href: 'InfosPratiques',
      borderColor: 'border-[#22c55e]',
      description:
        lang === 'fr'
          ? 'Services & Informations'
          : 'Services & Information',
      ariaLabel:
        lang === 'fr'
          ? 'Informations pratiques du camping'
          : 'Practical camping information'
    },
    {
      title: t('collaborateur'),
      icon: Briefcase,
      href: 'Collaborateur',
      borderColor: 'border-[#FFA500]',
      description: t('espace_collaborateurs'),
      ariaLabel: 'Espace collaborateurs'
    }
  ];

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className="min-h-screen px-6 py-8" role="main">
      <div className="max-w-lg mx-auto">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 bg-gradient-to-b from-[#e6f7ff] to-white rounded-2xl p-6 shadow-sm"
        >
          <Logo className="h-20 mb-4 mx-auto" />
          <h1 className="font-handwritten text-4xl text-[#00AEEF] mb-2">
            {t('camping_paradis')}
          </h1>
          <p className="text-xl text-[#0077A8]">
            ⭐ {t('slogan')} ⭐
          </p>
        </motion.div>

        {/* MENU */}
        <nav className="space-y-4 mb-6">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={createPageUrl(item.href)}
                className="block rounded-2xl focus:ring-4 focus:ring-yellow-400"
                aria-label={item.ariaLabel}
              >
                <div
                  className={`bg-white rounded-2xl border-4 ${item.borderColor} shadow-md hover:shadow-xl transition h-24`}
                >
                  <div className="flex items-center justify-between px-5 h-full">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl ${item.borderColor.replace(
                          'border-',
                          'bg-'
                        )} flex items-center justify-center`}
                      >
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-[#0077A8]">
                          {item.title}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* AVIS */}
        <HomeAvisSection />

        {/* LANGUE */}
        <div className="mt-8 text-center">
          <Link to={createPageUrl('ChoixLangue')}>
            <Button variant="outline">
              🌐 Langue / Language 🇫🇷 | 🇬🇧
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}