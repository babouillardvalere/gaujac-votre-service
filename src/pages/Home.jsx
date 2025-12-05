import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import HomeAvisSection from '../components/HomeAvisSection';
import CustomUsersIcon from '../components/CustomUsersIcon';
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
      icon: CustomUsersIcon,
      href: '/IdentiteClient',
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
      title: t('suivi_intervention'),
      icon: Search,
      href: '/SuiviIntervention',
      bgColor: 'bg-[#FFD700]',
      borderColor: 'border-[#FFD700]',
      iconBg: 'bg-[#00AEEF]',
      textColor: 'text-[#0077A8]',
      subtitleColor: 'text-[#0077A8]',
      arrowColor: 'text-[#0077A8]',
      description: t('suivre_demande'),
      ariaLabel: 'Suivre votre demande - Voir le statut de votre intervention',
      iconColor: 'text-white'
    },
    {
      title: t('avis'),
      icon: Star,
      href: '/MeilleursAvis',
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
                <div className={`${item.bgColor} rounded-2xl border-2 ${item.borderColor} shadow-md hover:shadow-xl transition-all duration-300 h-28`}>
                  <div className="flex items-center justify-between p-6 h-full">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`} aria-hidden="true">
                        {item.customIcon ? (
                          <item.icon className="w-7 h-7" aria-hidden="true" />
                        ) : (
                          <item.icon className={`w-7 h-7 ${item.iconColor || 'text-white'}`} aria-hidden="true" />
                        )}
                      </div>
                      <div>
                        <h2 className={`font-heading text-2xl ${item.textColor} mb-1`}>
                          {item.title}
                        </h2>
                        <p className={`font-body text-sm ${item.subtitleColor}`}>{item.description}</p>
                      </div>
                    </div>
                    <div className={`${item.arrowColor} group-hover:translate-x-1 transition-all`} aria-hidden="true">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Bouton Accessibilité - placé juste après les boutons principaux */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowAccessibilityMenu(!showAccessibilityMenu)}
            className="block w-full group focus:outline-none focus:ring-4 focus:ring-[#FFD700] rounded-2xl"
            aria-label="Options d'accessibilité"
          >
            <div className="bg-[#0077A8] rounded-2xl border-2 border-[#0077A8] shadow-md hover:shadow-xl transition-all duration-300 h-24">
              <div className="flex items-center justify-between p-5 h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" aria-hidden="true">
                    <span className="text-3xl" role="img" aria-label="Accessibilité">♿</span>
                  </div>
                  <div className="text-left">
                    <h2 className="font-heading text-xl text-white mb-1">
                      Accessibilité
                    </h2>
                    <p className="font-body text-sm text-white/90">Options d'aide</p>
                  </div>
                </div>
                <div className="text-white group-hover:translate-x-1 transition-all" aria-hidden="true">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </motion.div>

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