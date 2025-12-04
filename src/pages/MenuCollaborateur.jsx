import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import NotificationBell from '../components/NotificationBell';
import { Wrench, Sparkles, Building2, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';

export default function MenuCollaborateur() {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = sessionStorage.getItem('collaborateur_authenticated');
    if (auth !== 'true') {
      navigate(createPageUrl('Collaborateur'));
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('collaborateur_authenticated');
    navigate(createPageUrl('Home'));
  };

  const menuItems = [
    {
      title: 'Technique',
      icon: Wrench,
      href: 'Technique',
      color: 'bg-[#00AEEF]',
      textColor: 'text-white',
      description: 'Interventions techniques'
    },
    {
      title: 'Ménage',
      icon: Sparkles,
      href: 'Menage',
      color: 'bg-[#FFD700]',
      textColor: 'text-[#0077A8]',
      description: 'Demandes de nettoyage'
    },
    {
      title: 'Bureau',
      icon: Building2,
      href: 'Bureau',
      color: 'bg-[#FFA500]',
      textColor: 'text-white',
      description: 'Historique & Statistiques'
    }
  ];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo className="h-20" />
        </motion.div>

        {/* Header avec notification */}
        <div className="flex justify-end mb-4">
          <div className="bg-[#00AEEF] rounded-xl p-1 text-white">
            <NotificationBell />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="font-handwritten text-3xl text-[#00AEEF]">
            Menu Collaborateurs
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-[#FFD700]">⭐</span>
            <p className="font-body text-[#0077A8]">Bienvenue dans votre espace de travail</p>
            <span className="text-[#FFD700]">⭐</span>
          </div>
        </motion.div>

        <div className="space-y-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Link
                to={createPageUrl(item.href)}
                className="block group"
              >
                <div className="bg-white rounded-xl border-2 border-[#00AEEF] shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="flex items-center p-5">
                    <div className={`w-16 h-16 rounded-xl ${item.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                      <item.icon className={`w-8 h-8 ${item.textColor}`} />
                    </div>
                    <div className="ml-5 flex-1">
                      <h2 className="font-heading text-xl text-[#0077A8] group-hover:text-[#00AEEF] transition-colors">
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center"
        >
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-[#00AEEF] text-[#0077A8] hover:bg-[#e6f7ff] rounded-xl font-heading"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </motion.div>
      </div>
    </div>
  );
}