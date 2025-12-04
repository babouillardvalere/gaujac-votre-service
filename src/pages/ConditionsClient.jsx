import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage, useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Phone, Wifi, Coffee, AlertTriangle, Sparkles, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ConditionsClient() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!getLanguage()) {
      navigate('/ChoixLangue');
      return;
    }
    const nom = sessionStorage.getItem('user_nom');
    if (!nom) {
      navigate(createPageUrl('IdentiteClient'));
    }
  }, [navigate]);

  const handleAccept = () => {
    sessionStorage.setItem('conditions_accepted', 'true');
    navigate(createPageUrl('ChoixHebergement'));
  };

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Logo className="h-16" />
        </motion.div>

        <Card className="shadow-lg border-2 border-[#00AEEF] rounded-xl overflow-hidden">
          <CardHeader className="bg-[#00AEEF] pb-4">
            <CardTitle className="text-xl font-heading text-white">
              {t('conditions_title')}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                <div className="bg-[#e6f7ff] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-[#00AEEF]" />
                    <h3 className="font-heading text-[#0077A8]">{t('horaires_intervention')}</h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm">
                    <p>{t('horaires_detail')}</p>
                  </div>
                </div>

                <div className="bg-[#FFA500]/10 rounded-xl p-4 border border-[#FFA500]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-[#FFA500]" />
                    <h3 className="font-heading text-[#0077A8]">{t('urgences')}</h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm">
                    <p>{t('urgences_detail')}</p>
                  </div>
                </div>

                <div className="bg-[#FFD700]/10 rounded-xl p-4 border border-[#FFD700]/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-[#FFD700]" />
                    <h3 className="font-heading text-[#0077A8]">{t('regles_menage')}</h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm">
                    <p>{t('regles_menage_detail')}</p>
                  </div>
                </div>

                <div className="bg-[#e6f7ff] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Coffee className="w-5 h-5 text-[#00AEEF]" />
                    <h3 className="font-heading text-[#0077A8]">{t('infos_pratiques')}</h3>
                  </div>
                  <div className="font-body text-gray-700 text-sm">
                    <p>{t('infos_pratiques_detail')}</p>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="mt-6 pt-4 border-t border-[#00AEEF]/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={accepted}
                  onCheckedChange={setAccepted}
                  className="mt-1 data-[state=checked]:bg-[#00AEEF] data-[state=checked]:border-[#00AEEF]"
                />
                <span className="font-body text-sm text-gray-700">
                  {t('conditions_accept')}
                </span>
              </label>
            </div>

            <Button
              onClick={handleAccept}
              disabled={!accepted}
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading mt-4 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('conditions_continue')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}