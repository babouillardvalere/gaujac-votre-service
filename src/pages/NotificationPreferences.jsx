import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bell, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { getNotificationPreferences, saveNotificationPreferences, ROLES } from '../utils/notificationService';

export default function NotificationPreferences() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  
  // Déterminer le rôle depuis sessionStorage
  const [role, setRole] = useState('reception');
  const [preferences, setPreferences] = useState(getNotificationPreferences('reception'));

  useEffect(() => {
    // Déterminer le rôle actuel de l'utilisateur
    const isCollaborateur = sessionStorage.getItem('collaborateur_authenticated');
    if (isCollaborateur) {
      setRole('reception'); // Par défaut, les collaborateurs sont "reception"
      setPreferences(getNotificationPreferences('reception'));
    }
  }, []);

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    saveNotificationPreferences(role, preferences);
    toast.success(lang === 'fr' ? 'Préférences enregistrées' : 'Preferences saved');
  };

  const notificationOptions = [
    {
      key: 'inventaire_soumis',
      icon: '📋',
      label_fr: 'Nouveau contrôle inventaire soumis',
      label_en: 'New inventory check submitted',
      desc_fr: 'Recevoir une notification quand un client soumet un contrôle d\'inventaire',
      desc_en: 'Get notified when a client submits an inventory check'
    },
    {
      key: 'intervention_creee',
      icon: '🔔',
      label_fr: 'Nouvelle intervention créée',
      label_en: 'New intervention created',
      desc_fr: 'Recevoir une notification pour chaque nouvelle intervention',
      desc_en: 'Get notified for each new intervention'
    },
    {
      key: 'dossier_finalise',
      icon: '✅',
      label_fr: 'Dossier d\'arrivée finalisé',
      label_en: 'Arrival file finalized',
      desc_fr: 'Recevoir une notification quand un dossier d\'arrivée est complété',
      desc_en: 'Get notified when an arrival file is completed'
    },
    {
      key: 'intervention_prise_en_charge',
      icon: '👤',
      label_fr: 'Intervention prise en charge',
      label_en: 'Intervention taken over',
      desc_fr: 'Recevoir une notification quand une intervention est prise en charge',
      desc_en: 'Get notified when an intervention is taken over'
    },
    {
      key: 'intervention_resolue',
      icon: '✔️',
      label_fr: 'Intervention résolue',
      label_en: 'Intervention resolved',
      desc_fr: 'Recevoir une notification quand une intervention est résolue',
      desc_en: 'Get notified when an intervention is resolved'
    }
  ];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-6">
            <Bell className="w-8 h-8 inline mr-2" />
            {lang === 'fr' ? 'Préférences Notifications' : 'Notification Preferences'}
          </h1>

          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-[#0077A8]">
                {lang === 'fr' ? 'Configurer vos notifications' : 'Configure your notifications'}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {lang === 'fr' 
                  ? 'Choisissez les événements pour lesquels vous souhaitez être notifié'
                  : 'Choose which events you want to be notified about'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationOptions.map(option => (
                <div 
                  key={option.key}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{option.icon}</span>
                      <Label 
                        htmlFor={option.key}
                        className="font-heading text-[#0077A8] cursor-pointer"
                      >
                        {lang === 'fr' ? option.label_fr : option.label_en}
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 ml-10">
                      {lang === 'fr' ? option.desc_fr : option.desc_en}
                    </p>
                  </div>
                  <Switch
                    id={option.key}
                    checked={preferences[option.key]}
                    onCheckedChange={() => handleToggle(option.key)}
                    className="mt-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-300 rounded-xl mb-6">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">📧</span>
                    <Label 
                      htmlFor="email_enabled"
                      className="font-heading text-[#0077A8] cursor-pointer"
                    >
                      {lang === 'fr' ? 'Notifications par email' : 'Email notifications'}
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 ml-10">
                    {lang === 'fr' 
                      ? 'Recevoir également les notifications par email (prochainement)'
                      : 'Also receive notifications by email (coming soon)'}
                  </p>
                </div>
                <Switch
                  id="email_enabled"
                  checked={preferences.email_enabled || false}
                  onCheckedChange={() => handleToggle('email_enabled')}
                  disabled
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading"
          >
            <Save className="w-5 h-5 mr-2" />
            {lang === 'fr' ? 'Enregistrer les préférences' : 'Save preferences'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}