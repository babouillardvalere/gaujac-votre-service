import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Globe, Eye, Play, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ClientMenu() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  // Vérifier si un dossier d'arrivée existe
  const dossierId = sessionStorage.getItem('arrivee_dossier_id');
  const ficheArriveeId = sessionStorage.getItem('fiche_arrivee_id');
  
  const { data: dossierArrivee } = useQuery({
    queryKey: ['dossier-arrivee-actif', dossierId],
    queryFn: async () => {
      if (!dossierId) return null;
      const dossiers = await base44.entities.DossierArrivee.list();
      const dossier = dossiers.find(d => d.id === dossierId);
      if (dossier && dossier.statut === 'en_cours') {
        return dossier;
      }
      return null;
    },
    enabled: !!dossierId
  });

  const baseMenuItems = [
    {
      title: '🏡 Arrivée',
      titleEn: '🏡 Arrival',
      description: 'Conditions d\'arrivée',
      descriptionEn: 'Arrival conditions',
      href: 'ClientArrivee',
      color: 'bg-[#22c55e]',
      textColor: 'text-white',
      disabled: false,
      comingSoon: false
    },
    {
      title: '🌞 Séjour',
      titleEn: '🌞 Stay',
      description: 'Signaler un problème',
      descriptionEn: 'Report an issue',
      href: 'IdentiteClient',
      color: 'bg-[#00AEEF]',
      textColor: 'text-white',
      disabled: false
    },
    {
      title: '📋 Suivi',
      titleEn: '📋 Tracking',
      description: 'Mon suivi inventaire',
      descriptionEn: 'My inventory tracking',
      href: 'ClientSuiviInventaire',
      color: 'bg-[#9333ea]',
      textColor: 'text-white',
      disabled: false,
      comingSoon: false
    },
    {
      title: '🚗 Départ',
      titleEn: '🚗 Departure',
      description: 'Conditions de départ',
      descriptionEn: 'Departure conditions',
      href: 'ClientDepartIdentification',
      color: 'bg-[#FFA500]',
      textColor: 'text-white',
      disabled: false,
      comingSoon: false
    }
  ];

  const menuItems = ficheArriveeId 
    ? [
        baseMenuItems[0],
        {
          title: '📋 Résumé',
          titleEn: '📋 Summary',
          description: 'Résumé d\'arrivée',
          descriptionEn: 'Arrival summary',
          href: 'ClientResume',
          color: 'bg-[#9333ea]',
          textColor: 'text-white',
          disabled: false,
          comingSoon: false
        },
        ...baseMenuItems.slice(1)
      ]
    : baseMenuItems;

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('Home'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
              aria-label={t('retour_accueil')}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
            <Link to={createPageUrl('ChoixLangue')}>
              <Globe className="w-6 h-6 text-[#0077A8]" />
            </Link>
          </div>

          <Logo className="h-16 mb-4" />
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-2">
            {t('client')}
          </h1>
          <p className="text-center text-gray-600 font-body">
            {lang === 'fr' ? 'Choisissez votre étape' : 'Choose your step'}
          </p>
        </motion.div>

        {/* Dossier d'arrivée en cours */}
        {dossierArrivee && !dossierArrivee.etape_4_terminee && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-2 border-[#FFD700] bg-yellow-50 rounded-xl">
              <CardContent className="p-6">
                <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                  📋 {lang === 'fr' ? 'Arrivée en cours' : 'Arrival in progress'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {lang === 'fr' 
                    ? `Étape ${dossierArrivee.etape_actuelle}/4`
                    : `Step ${dossierArrivee.etape_actuelle}/4`}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(createPageUrl('ClientArriveeSuivi') + `?id=${dossierArrivee.id}`)}
                    variant="outline"
                    className="flex-1 border-2 border-[#00AEEF] text-[#00AEEF]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {lang === 'fr' ? 'Suivi' : 'Track'}
                  </Button>
                  <Button
                    onClick={() => {
                      // Reprendre à l'étape actuelle
                      if (dossierArrivee.etape_actuelle === 1) {
                        navigate(createPageUrl('ClientArriveeIdentite'));
                      } else if (dossierArrivee.etape_actuelle === 2) {
                        navigate(createPageUrl('ClientArriveeStatistiques'));
                      } else if (dossierArrivee.etape_actuelle === 3) {
                        navigate(createPageUrl('ClientArriveeHebergement'));
                      } else if (dossierArrivee.etape_actuelle === 4) {
                        navigate(createPageUrl('ClientControleInventaire'));
                      }
                    }}
                    className="flex-1 bg-[#22c55e] hover:bg-[#16a34a]"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {lang === 'fr' ? 'Reprendre' : 'Resume'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Menu Items */}
        <div className="space-y-4">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              {item.disabled ? (
                <Card className="border-2 border-gray-200 rounded-xl overflow-hidden opacity-60">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-6 min-h-[100px]">
                      <div>
                        <h2 className={`font-heading text-2xl text-gray-700 mb-1`}>
                          {lang === 'fr' ? item.title : item.titleEn}
                        </h2>
                        {item.comingSoon && (
                          <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                            {lang === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
                          </span>
                        )}
                      </div>
                      <div className={`w-16 h-16 rounded-xl ${item.color} flex items-center justify-center text-3xl`}>
                        {item.title.split(' ')[0]}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Link 
                  to={createPageUrl(item.href)} 
                  className="block group focus:ring-4 focus:ring-[#FFD700] rounded-xl"
                >
                  <Card className="border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-xl transition-all rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className={`${item.color} p-8 min-h-[120px] flex flex-col items-center justify-center`}>
                        <h2 className={`font-heading text-4xl ${item.textColor} group-hover:scale-105 transition-transform text-center mb-2`}>
                          {lang === 'fr' ? item.title : item.titleEn}
                        </h2>
                        <p className={`text-sm ${item.textColor} opacity-90 font-body`}>
                          {lang === 'fr' ? item.description : item.descriptionEn}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}