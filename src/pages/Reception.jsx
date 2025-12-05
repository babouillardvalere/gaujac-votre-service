import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, LogIn, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function Reception() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const modules = [
    {
      title: '🏡 Arrivées',
      titleEn: '🏡 Arrivals',
      description: 'Consulter les dossiers d\'arrivée',
      descriptionEn: 'View arrival files',
      href: 'ReceptionArrivees',
      color: 'bg-[#22c55e]',
      icon: LogIn
    },
    {
      title: '🚗 Départs',
      titleEn: '🚗 Departures',
      description: 'Consulter les dossiers de départ',
      descriptionEn: 'View departure files',
      href: 'ReceptionDeparts',
      color: 'bg-[#FFA500]',
      icon: LogOut
    }
  ];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-4xl text-[#00AEEF] text-center mb-2">
            📋 {lang === 'fr' ? 'Réception' : 'Reception'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-8">
            {lang === 'fr' ? 'Gestion des arrivées et départs' : 'Arrivals and departures management'}
          </p>

          {/* Bouton Assistance Client en priorité */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <button
              onClick={() => navigate(createPageUrl('ReceptionAssistance'))}
              className="w-full focus:ring-4 focus:ring-[#FFD700] rounded-xl"
            >
              <Card className="bg-gradient-to-r from-red-600 to-red-500 border-0 rounded-xl hover:shadow-2xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-4xl">🆘</span>
                    </div>
                    <div className="text-left flex-1">
                      <h2 className="font-heading text-2xl text-white mb-1">
                        {lang === 'fr' ? 'Assistance Client' : 'Guest Assistance'}
                      </h2>
                      <p className="text-sm text-white/90 font-body">
                        {lang === 'fr' 
                          ? 'Faire la procédure à sa place (Arrivée, Séjour, Départ)'
                          : 'Complete procedures on their behalf (Arrival, Stay, Departure)'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          </motion.div>

          <div className="space-y-4">
            {modules.map((module, index) => (
              <motion.div
                key={module.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <button
                  onClick={() => navigate(createPageUrl(module.href))}
                  className="w-full focus:ring-4 focus:ring-[#FFD700] rounded-xl"
                >
                  <Card className={`border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-xl transition-all rounded-xl overflow-hidden`}>
                    <CardContent className="p-0">
                      <div className={`${module.color} p-8 flex items-center justify-between`}>
                        <div className="text-left">
                          <h2 className="font-heading text-3xl text-white mb-1">
                            {lang === 'fr' ? module.title : module.titleEn}
                          </h2>
                          <p className="text-white/90 font-body">
                            {lang === 'fr' ? module.description : module.descriptionEn}
                          </p>
                        </div>
                        <module.icon className="w-16 h-16 text-white/80" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}