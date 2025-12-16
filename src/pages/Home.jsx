import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import HomeAvisSection from '../components/HomeAvisSection';
import CustomUsersIcon from '../components/CustomUsersIcon';
import AccessibilityPanel, { getAccessibilitySettings, saveAccessibilitySettings, speakText, stopSpeaking } from '../components/AccessibilityPanel';
import { Users, Star, Briefcase, Accessibility, Plus, Minus, Volume2, VolumeX, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function Home() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);
  const [accessibilitySettings, setAccessibilitySettings] = useState(getAccessibilitySettings());

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
    }
  }, [navigate]);

  useEffect(() => {
    const handleAccessibilityChange = (e) => {
      setAccessibilitySettings(e.detail);
    };
    window.addEventListener('accessibilitychange', handleAccessibilityChange);
    return () => window.removeEventListener('accessibilitychange', handleAccessibilityChange);
  }, []);

  const updateAccessibility = (key, value) => {
    const newSettings = { ...accessibilitySettings, [key]: value };
    setAccessibilitySettings(newSettings);
    saveAccessibilitySettings(newSettings);
  };

  const increaseFontSize = () => {
    if (accessibilitySettings.fontSize < 150) {
      updateAccessibility('fontSize', accessibilitySettings.fontSize + 10);
      speakText(lang === 'en' ? 'Text increased' : 'Texte agrandi', true);
    }
  };

  const decreaseFontSize = () => {
    if (accessibilitySettings.fontSize > 80) {
      updateAccessibility('fontSize', accessibilitySettings.fontSize - 10);
      speakText(lang === 'en' ? 'Text decreased' : 'Texte réduit', true);
    }
  };

  const toggleSpeech = () => {
    const newValue = !accessibilitySettings.speechEnabled;
    updateAccessibility('speechEnabled', newValue);
    speakText(newValue 
      ? (lang === 'en' ? 'Voice reading enabled' : 'Lecture vocale activée')
      : (lang === 'en' ? 'Voice reading disabled' : 'Lecture vocale désactivée'), true);
  };

  const menuItems = [
    {
      title: t('client'),
      icon: CustomUsersIcon,
      href: '/ClientMenu',
      bgColor: 'bg-[#00AEEF]',
      borderColor: 'border-[#00AEEF]',
      iconBg: 'bg-[#FFD700]',
      textColor: 'text-white',
      subtitleColor: 'text-white/90',
      arrowColor: 'text-white',
      description: t('signaler_probleme'),
      ariaLabel: 'Signaler un problème - Accéder au formulaire client',
      iconColor: 'text-white',
      customIcon: true
    },
    {
      title: t('avis'),
      icon: Star,
      href: '/AvisMenu',
      bgColor: 'bg-[#FFA500]',
      borderColor: 'border-[#FFA500]',
      iconBg: 'bg-white',
      textColor: 'text-white',
      subtitleColor: 'text-white/90',
      arrowColor: 'text-white',
      description: t('donner_avis'),
      ariaLabel: 'Voir les avis clients',
      iconColor: 'text-black'
    },
    {
      title: lang === 'fr' ? '📖 Infos Pratiques' : '📖 Practical Info',
      icon: BookOpen,
      href: '/InfosPratiques',
      bgColor: 'bg-[#22c55e]',
      borderColor: 'border-[#22c55e]',
      iconBg: 'bg-white',
      textColor: 'text-white',
      subtitleColor: 'text-white/90',
      arrowColor: 'text-white',
      description: lang === 'fr' ? 'Services & Informations' : 'Services & Information',
      ariaLabel: lang === 'fr' ? 'Informations pratiques du camping' : 'Practical camping information',
      iconColor: 'text-[#22c55e]'
    },
    {
      title: t('collaborateur'),
      icon: Briefcase,
      href: '/Collaborateur',
      bgColor: 'bg-white',
      borderColor: 'border-[#FFA500]',
      iconBg: 'bg-[#FFA500]',
      textColor: 'text-[#0077A8]',
      subtitleColor: 'text-gray-600',
      arrowColor: 'text-[#FFA500]',
      description: t('espace_collaborateurs'),
      ariaLabel: 'Espace collaborateurs - Accès réservé au personnel'
    }
  ];

  return (
    <div className="min-h-screen px-6 py-8" role="main" aria-label="Page d'accueil Camping Paradis">
      <div className="max-w-lg mx-auto">
        <h1 className="sr-only">Bienvenue au Camping Paradis - Domaine de Gaujac</h1>
        {/* Header / Bannière */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 bg-gradient-to-b from-[#e6f7ff] to-white rounded-2xl p-6 shadow-sm"
        >
          <Logo className="h-20 mb-4 mx-auto" />
          <h1 className="font-handwritten text-4xl md:text-5xl text-[#00AEEF] mb-2">
            {t('camping_paradis')}
          </h1>
          <p className="font-heading text-xl text-[#0077A8]">
            ⭐ {t('slogan')} ⭐
          </p>
        </motion.div>

        {/* Boutons principaux - Cartes uniformes */}
        <nav className="space-y-4 mb-6" role="navigation" aria-label="Menu principal">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link
                to={createPageUrl(item.href.replace('/', ''))}
                className="block group focus:outline-none focus:ring-4 focus:ring-[#FFD700] rounded-2xl"
                aria-label={item.ariaLabel}
                role="button"
                tabIndex={0}
              >
                <div className={`bg-white rounded-2xl border-4 ${item.borderColor} shadow-md hover:shadow-xl transition-all duration-300 h-24`}>
                  <div className="flex items-center justify-between px-5 h-full">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${item.borderColor.replace('border-', 'bg-')} flex items-center justify-center group-hover:scale-110 transition-transform`} aria-hidden="true">
                        {item.customIcon ? (
                          <item.icon className="w-6 h-6 text-white" aria-hidden="true" />
                        ) : (
                          <item.icon className="w-6 h-6 text-white" aria-hidden="true" />
                        )}
                      </div>
                      <div>
                        <h2 className="font-heading text-2xl text-[#0077A8]">
                          {item.title}
                        </h2>
                        <p className="font-body text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <div className={`${item.borderColor.replace('border-', 'text-')} group-hover:translate-x-1 transition-all`} aria-hidden="true">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </nav>



        {/* Section Avis */}
        <HomeAvisSection />



        {/* Bouton changement de langue - bas de page, centré */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8 mb-4 text-center"
        >
          <Link 
            to={createPageUrl('ChoixLangue')}
            className="inline-block"
            aria-label={lang === 'en' ? 'Change language' : 'Changer de langue'}
          >
            <Button
              variant="outline"
              className="border-2 border-[#00AEEF] text-[#00AEEF] hover:bg-[#00AEEF] hover:text-white font-heading rounded-xl px-6 py-3 text-base shadow-sm"
            >
              🌐 Langue / Language
              <span className="ml-2">🇫🇷 | 🇬🇧</span>
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}