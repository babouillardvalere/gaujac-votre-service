import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { useTranslation } from '../components/translations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Sparkles, Building2, LogOut, Clock, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function MenuCollaborateur() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
  }, [navigate]);

  const menuItems = [
    {
      title: t('menu_technique'),
      icon: Wrench,
      href: 'Technique',
      color: 'bg-[#00AEEF]',
      textColor: 'text-white',
      description: t('desc_technique')
    },
    {
      title: t('menu_menage'),
      icon: Sparkles,
      href: 'Menage',
      color: 'bg-[#FFD700]',
      textColor: 'text-[#0077A8]',
      description: t('desc_menage')
    },
    {
      title: t('menu_bureau'),
      icon: Building2,
      href: 'Bureau',
      color: 'bg-[#FFA500]',
      textColor: 'text-white',
      description: t('desc_bureau')
    },
    {
      title: t('menu_attente'),
      icon: Clock,
      href: 'Attente',
      color: 'bg-gray-500',
      textColor: 'text-white',
      description: t('desc_attente')
    },
    {
      title: t('menu_materiel'),
      icon: Package,
      href: 'Materiel',
      color: 'bg-[#0077A8]',
      textColor: 'text-white',
      description: t('desc_materiel')
    }
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('collaborateur_authenticated');
    navigate(createPageUrl('Home'));
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <Logo className="h-16" />
          <NotificationBell />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="font-handwritten text-3xl text-[#00AEEF]">{t('bonjour_equipe')}</h1>
        </motion.div>

        <div className="space-y-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Link to={createPageUrl(item.href)} className="block group">
                <Card className="border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-lg transition-all rounded-xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center p-5">
                      <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                        <item.icon className={`w-7 h-7 ${item.textColor}`} />
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
            </motion.div>
          ))}
        </div>

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