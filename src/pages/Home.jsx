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
      description: 'Signaler un problème'
    },
    {
      title: 'Suivi intervention',
      icon: Search,
      href: '/SuiviIntervention',
      color: 'bg-[#0077A8]',
      description: 'Suivre votre demande'
    },
    {
      title: t('avis'),
      icon: Star,
      href: '/SatisfactionClient',
      color: 'bg-[#FFD700]',
      textColor: 'text-[#0077A8]',
      description: 'Donner votre avis'
    },
    {
      title: t('collaborateur'),
      icon: Briefcase,
      href: '/Collaborateur',
      color: 'bg-[#FFA500]',
      description: 'Espace collaborateurs'
    }
  ];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Logo className="h-24 md:h-28" />
        </motion.div>

        {/* Titre principal avec style Camping Paradis */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="font-handwritten text-4xl md:text-5xl text-[#00AEEF] leading-tight">
            Camping Paradis
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[#FFD700] text-xl">⭐</span>
            <p className="font-handwritten text-2xl text-[#0077A8]">
              Le Domaine de Gaujac à votre service !
            </p>
            <span className="text-[#FFD700] text-xl">⭐</span>
          </div>
        </motion.div>

        {/* Menu principal */}
        <div className="space-y-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Link
                to={createPageUrl(item.href.replace('/', ''))}
                className="block group"
              >
                <div className="bg-white rounded-xl border-2 border-[#00AEEF] shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="flex items-center p-5">
                    <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                      <item.icon className={`w-7 h-7 ${item.textColor || 'text-white'}`} />
                    </div>
                    <div className="ml-5 flex-1">
                      <h2 className="font-heading text-lg text-[#0077A8] group-hover:text-[#00AEEF] transition-colors">
                        {item.title}
                      </h2>
                      <p className="font-body text-sm text-gray-600">{item.description}</p>
                    </div>
                    <div className="text-[#00AEEF] group-hover:translate-x-1 transition-all">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Lien changer de langue */}
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
            <span>Changer de langue / Change language</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}