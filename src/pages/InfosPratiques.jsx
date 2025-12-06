import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../utils';
import ServicesEtCommodites from '../components/infos/ServicesEtCommodites';
import BarEtSnack from '../components/infos/BarEtSnack';
import AnimationsEtLoisirs from '../components/infos/AnimationsEtLoisirs';
import ReglesDuCamping from '../components/infos/ReglesDuCamping';
import InterventionsEtAstreintes from '../components/infos/InterventionsEtAstreintes';
import LocationsEtPrets from '../components/infos/LocationsEtPrets';

export default function InfosPratiques() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [selectedSection, setSelectedSection] = useState(null);

  const sections = [
    {
      id: 'services',
      icon: '🛎',
      title: lang === 'fr' ? 'Services & Commodités' : 'Services & Amenities',
      color: 'from-blue-500 to-cyan-500',
      component: ServicesEtCommodites
    },
    {
      id: 'bar',
      icon: '🍹',
      title: lang === 'fr' ? 'Bar & Snack' : 'Bar & Snack',
      color: 'from-orange-500 to-red-500',
      component: BarEtSnack
    },
    {
      id: 'animations',
      icon: '🎉',
      title: lang === 'fr' ? 'Animations & Loisirs' : 'Entertainment & Activities',
      color: 'from-purple-500 to-pink-500',
      component: AnimationsEtLoisirs
    },
    {
      id: 'regles',
      icon: '🐾',
      title: lang === 'fr' ? 'Règles du Camping' : 'Campsite Rules',
      color: 'from-green-500 to-emerald-500',
      component: ReglesDuCamping
    },
    {
      id: 'interventions',
      icon: '🧰',
      title: lang === 'fr' ? 'Interventions & Astreintes' : 'Interventions & On-call',
      color: 'from-yellow-500 to-amber-500',
      component: InterventionsEtAstreintes
    },
    {
      id: 'locations',
      icon: '🧳',
      title: lang === 'fr' ? 'Locations & Prêts' : 'Rentals & Loans',
      color: 'from-indigo-500 to-blue-500',
      component: LocationsEtPrets
    }
  ];

  if (selectedSection) {
    const section = sections.find(s => s.id === selectedSection);
    const Component = section.component;

    return (
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => setSelectedSection(null)}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>

            <div className="mb-6">
              <div className={`inline-block bg-gradient-to-r ${section.color} text-white px-4 py-2 rounded-xl text-3xl mb-2`}>
                {section.icon}
              </div>
              <h1 className="font-handwritten text-3xl text-[#00AEEF]">
                {section.title}
              </h1>
            </div>

            <Component lang={lang} />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientMenu'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-4xl text-[#00AEEF] text-center mb-2">
            ℹ️ {lang === 'fr' ? 'Infos Pratiques' : 'Practical Information'}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {lang === 'fr' 
              ? 'Tout ce que vous devez savoir sur le camping'
              : 'Everything you need to know about the campsite'
            }
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <button
                  onClick={() => setSelectedSection(section.id)}
                  className="w-full focus:ring-4 focus:ring-[#FFD700] rounded-xl"
                >
                  <Card className="h-full hover:shadow-xl transition-all border-2 border-gray-200 hover:border-[#00AEEF]">
                    <CardContent className="p-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center text-4xl mb-3 shadow-lg`}>
                        {section.icon}
                      </div>
                      <h2 className="font-heading text-xl text-[#0077A8] text-left">
                        {section.title}
                      </h2>
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