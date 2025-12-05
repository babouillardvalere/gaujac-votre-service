import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import { Users, Star, Briefcase, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Récupération des infos client depuis sessionStorage
  const userName = sessionStorage.getItem('user_nom');
  const userPrenom = sessionStorage.getItem('user_prenom');
  const userDateArrivee = sessionStorage.getItem('user_date_arrivee');
  const userDateDepart = sessionStorage.getItem('user_date_depart');
  
  const hasUserInfo = userName && userPrenom;
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const clientInfo = hasUserInfo 
    ? `${userPrenom} ${userName}${userDateArrivee && userDateDepart ? `, ${formatDate(userDateArrivee)} → ${formatDate(userDateDepart)}` : ''}`
    : null;

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
    }
  }, [navigate]);

  const menuItems = [
    {
      title: t('client'),
      icon: Users,
      href: '/IdentiteClient',
      color: 'bg-[#00AEEF]',
      description: t('signaler_probleme'),
      ariaLabel: 'Signaler un problème - Accéder au formulaire client',
      clientInfo: clientInfo
    },
    {
      title: t('suivi_intervention'),
      icon: Search,
      href: '/SuiviIntervention',
      color: 'bg-[#0077A8]',
      description: t('suivre_demande'),
      ariaLabel: 'Suivre votre demande - Voir le statut de votre intervention',
      clientInfo: clientInfo
    },
    {
      title: t('avis'),
      icon: Star,
      href: '/AvisIdentification',
      color: 'bg-[#FFD700]',
      textColor: 'text-[#0077A8]',
      description: t('donner_avis'),
      ariaLabel: 'Donner votre avis - Noter une intervention',
      clientInfo: hasUserInfo ? `${userPrenom} ${userName}` : null
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
                      {item.clientInfo && (
                        <p className="font-body text-xs text-[#00AEEF] mt-1">
                          ({item.clientInfo})
                        </p>
                      )}
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
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