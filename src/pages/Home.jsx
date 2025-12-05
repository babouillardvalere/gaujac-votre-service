import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import HomeAvisSection from '../components/HomeAvisSection';
import AccessibilityPanel, { getAccessibilitySettings, saveAccessibilitySettings, speakText, stopSpeaking } from '../components/AccessibilityPanel';
import { Users, Star, Briefcase, Search, Accessibility, Plus, Minus, Volume2, VolumeX, X } from 'lucide-react';
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
      icon: Users,
      href: '/IdentiteClient',
      color: 'bg-[#00AEEF]',
      description: t('signaler_probleme'),
      ariaLabel: 'Signaler un problème - Accéder au formulaire client'
    },
    {
      title: t('suivi_intervention'),
      icon: Search,
      href: '/SuiviIntervention',
      color: 'bg-[#0077A8]',
      description: t('suivre_demande'),
      ariaLabel: 'Suivre votre demande - Voir le statut de votre intervention'
    },
    {
      title: t('avis'),
      icon: Star,
      href: '/MeilleursAvis',
      color: 'bg-[#FFD700]',
      textColor: 'text-[#0077A8]',
      description: t('donner_avis'),
      ariaLabel: 'Voir les avis clients',
      clientInfo: null
    },
    {
      title: t('collaborateur'),
      icon: Briefcase,
      href: '/Collaborateur',
      color: 'bg-[#FFA500]',
      description: t('espace_collaborateurs'),
      ariaLabel: 'Espace collaborateurs - Accès réservé au personnel',
      clientInfo: null
    }
  ];

  return (
    <div className="min-h-screen px-6 py-8" role="main" aria-label="Page d'accueil Camping Paradis">
      <div className="max-w-lg mx-auto">
        <h1 className="sr-only">Bienvenue au Camping Paradis - Domaine de Gaujac</h1>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Logo className="h-24 md:h-28" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="font-handwritten text-4xl md:text-5xl text-[#00AEEF] leading-tight">
            {t('camping_paradis')}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[#FFD700] text-xl">⭐</span>
            <p className="font-handwritten text-2xl text-[#0077A8]">
              {t('slogan')}
            </p>
            <span className="text-[#FFD700] text-xl">⭐</span>
          </div>
        </motion.div>

        <nav className="space-y-4" role="navigation" aria-label="Menu principal">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Link
                to={createPageUrl(item.href.replace('/', ''))}
                className="block group focus:outline-none focus:ring-4 focus:ring-[#FFD700] rounded-xl"
                aria-label={item.ariaLabel}
                role="button"
                tabIndex={0}
              >
                <div className="bg-white rounded-xl border-2 border-[#00AEEF] shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="flex items-center p-5 min-h-[80px]">
                    <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`} aria-hidden="true">
                      <item.icon className={`w-7 h-7 ${item.textColor || 'text-white'}`} aria-hidden="true" />
                    </div>
                    <div className="ml-5 flex-1">
                      <h2 className="font-heading text-lg text-[#0077A8] group-hover:text-[#00AEEF] transition-colors">
                        {item.title}
                      </h2>
                      <p className="font-body text-sm text-gray-600">{item.description}</p>
                    </div>
                    <div className="text-[#00AEEF] group-hover:translate-x-1 transition-all" aria-hidden="true">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-12 text-center"
        >
          <Link 
            to={createPageUrl('ChoixLangue')} 
            className="inline-flex items-center gap-2 text-sm text-[#0077A8] hover:text-[#00AEEF] transition-colors font-body"
          >
            <span>🌐</span>
            <span>{t('changer_langue')}</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}