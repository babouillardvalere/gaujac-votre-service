import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation, getLanguage } from '../components/translations';
import Logo from '../components/Logo';
import { Users, Star } from 'lucide-react';
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
      href: '/SignalementClient',
      color: 'from-sky-500 to-sky-600',
      description: 'Signaler un problème'
    },
    {
      title: t('avis'),
      icon: Star,
      href: '/SatisfactionClient',
      color: 'from-amber-500 to-yellow-500',
      description: 'Donner votre avis'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-sky-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-6 py-12 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Logo className="h-24 md:h-28" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-light text-slate-800 text-center mb-10"
        >
          {t('home_title')}
        </motion.h1>

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
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg border border-slate-100 transition-all duration-300 overflow-hidden">
                  <div className="flex items-center p-5">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="ml-5 flex-1">
                      <h2 className="text-lg font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-sm text-slate-500">{item.description}</p>
                    </div>
                    <div className="text-slate-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all">
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-center"
        >
          <Link 
            to={createPageUrl('ChoixLangue')} 
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition-colors"
          >
            <span>🌐</span>
            <span>Changer de langue / Change language</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}