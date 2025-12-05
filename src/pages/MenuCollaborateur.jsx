import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import NotificationCenter from '../components/NotificationCenter';
import BureauAuthDialog from '../components/BureauAuthDialog';
import { useTranslation } from '../components/translations';
import { useNotifications } from '../components/useNotifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Sparkles, Building2, LogOut, Package, Lock, ListTodo } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function MenuCollaborateur() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showBureauAuth, setShowBureauAuth] = useState(false);
  const { counts } = useNotifications();

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
  }, [navigate]);

  const handleBureauClick = (e) => {
    e.preventDefault();
    const bureauAuth = sessionStorage.getItem('bureau_authenticated');
    if (bureauAuth === 'true') {
      navigate(createPageUrl('Bureau'));
    } else {
      setShowBureauAuth(true);
    }
  };

  const handleBureauAuthSuccess = () => {
    navigate(createPageUrl('Bureau'));
  };

  const menuItems = [
    {
      title: t('menu_technique'),
      icon: Wrench,
      href: 'Technique',
      color: 'bg-[#00AEEF]',
      textColor: 'text-white',
      description: t('desc_technique'),
      badgeCount: counts.technique,
      hasUrgent: counts.techniqueUrgent > 0
    },
    {
      title: t('menu_menage'),
      icon: Sparkles,
      href: 'Menage',
      color: 'bg-[#FFD700]',
      textColor: 'text-[#0077A8]',
      description: t('desc_menage'),
      badgeCount: counts.menage,
      hasUrgent: counts.menageUrgent > 0
    },
    {
      title: t('menu_materiel'),
      icon: Package,
      href: 'Materiel',
      color: 'bg-[#0077A8]',
      textColor: 'text-white',
      description: t('desc_materiel'),
      badgeCount: counts.materiel
    },
    {
      title: t('menu_bureau'),
      icon: Building2,
      href: 'Bureau',
      color: 'bg-[#FFA500]',
      textColor: 'text-white',
      description: t('desc_bureau'),
      locked: true,
      onClick: handleBureauClick,
      badgeCount: counts.bureau
    }
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('collaborateur_authenticated');
    navigate(createPageUrl('Home'));
  };

  return (
    <div className="min-h-screen px-4 py-6" role="main" aria-label="Menu collaborateur">
      <h1 className="sr-only">Menu principal collaborateur - Choisissez une section</h1>
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <Logo className="h-16" />
          <NotificationCenter userType="collaborateur" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="font-handwritten text-3xl text-[#00AEEF]">{t('bonjour_equipe')}</h1>
        </motion.div>

        <nav className="space-y-4" role="navigation" aria-label="Menu collaborateur">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              {item.comingSoon ? (
                <div className="block opacity-60 cursor-not-allowed">
                  <Card className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center p-5 min-h-[80px]">
                        <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center shadow-lg`}>
                          <item.icon className={`w-7 h-7 ${item.textColor}`} />
                        </div>
                        <div className="ml-5 flex-1">
                          <h2 className="font-heading text-lg text-gray-500 flex items-center gap-2">
                            {item.title}
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{t('bientot')}</span>
                          </h2>
                          <p className="font-body text-sm text-gray-400">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : item.onClick ? (
                <button
                  onClick={item.onClick}
                  className="block w-full text-left group focus:ring-4 focus:ring-[#FFD700] rounded-xl"
                  aria-label={`${item.title} - ${item.description}`}
                >
                  <Card className="border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-lg transition-all rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center p-5 min-h-[80px]">
                        <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform relative`}>
                          <item.icon className={`w-7 h-7 ${item.textColor}`} />
                          {item.locked && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                              <Lock className="w-3 h-3 text-[#FFA500]" />
                            </div>
                          )}
                          {item.badgeCount > 0 && (
                            <span className={`absolute -top-2 -right-2 min-w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full px-1.5 ${item.hasUrgent ? 'bg-red-500 animate-pulse' : 'bg-red-500'} text-white shadow-lg`}>
                              {item.badgeCount}
                            </span>
                          )}
                        </div>
                        <div className="ml-5 flex-1">
                          <h2 className="font-heading text-lg text-[#0077A8] group-hover:text-[#00AEEF] transition-colors flex items-center gap-2">
                            {item.title}
                            {item.locked && <Lock className="w-4 h-4 text-[#FFA500]" />}
                          </h2>
                          <p className="font-body text-sm text-gray-600">{item.description}</p>
                        </div>
                        <div className="text-[#00AEEF] group-hover:translate-x-1 transition-all">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ) : (
                <Link 
                  to={createPageUrl(item.href)} 
                  className="block group focus:ring-4 focus:ring-[#FFD700] rounded-xl"
                  aria-label={`${item.title} - ${item.description}`}
                >
                  <Card className="border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-lg transition-all rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center p-5 min-h-[80px]">
                        <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform relative`}>
                          <item.icon className={`w-7 h-7 ${item.textColor}`} />
                          {item.badgeCount > 0 && (
                            <span className={`absolute -top-2 -right-2 min-w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full px-1.5 ${item.hasUrgent ? 'bg-red-500 animate-pulse' : 'bg-red-500'} text-white shadow-lg`}>
                              {item.badgeCount}
                            </span>
                          )}
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
                    </CardContent>
                  </Card>
                </Link>
              )}
            </motion.div>
          ))}
        </nav>

        <BureauAuthDialog 
          open={showBureauAuth} 
          onOpenChange={setShowBureauAuth}
          onSuccess={handleBureauAuthSuccess}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full h-12 border-2 border-red-300 text-red-500 hover:bg-red-50 rounded-xl font-heading"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t('deconnexion')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}