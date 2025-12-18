import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '../components/translations';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bell, Mail, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function NotificationPreferences() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setUserEmail(user.email);
      } catch (error) {
        console.error(error);
      }
    };
    loadUser();
  }, []);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', userEmail],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter({ user_email: userEmail });
      return prefs.length > 0 ? prefs[0] : null;
    },
    enabled: !!userEmail
  });

  const [localPrefs, setLocalPrefs] = useState({
    missions_creation: true,
    missions_update: true,
    missions_complete: true,
    missions_priority_high: false,
    interventions_assigned: true,
    email_notifications: false
  });

  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        missions_creation: preferences.missions_creation ?? true,
        missions_update: preferences.missions_update ?? true,
        missions_complete: preferences.missions_complete ?? true,
        missions_priority_high: preferences.missions_priority_high ?? false,
        interventions_assigned: preferences.interventions_assigned ?? true,
        email_notifications: preferences.email_notifications ?? false
      });
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences) {
        return base44.entities.NotificationPreference.update(preferences.id, data);
      } else {
        return base44.entities.NotificationPreference.create({
          user_email: userEmail,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success(lang === 'fr' ? 'Préférences enregistrées ✅' : 'Preferences saved ✅');
    }
  });

  const handleToggle = (key) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    saveMutation.mutate(localPrefs);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('MenuCollaborateur'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="font-handwritten text-3xl text-purple-600">
                {lang === 'fr' ? 'Préférences de notification' : 'Notification preferences'}
              </h1>
              <p className="text-gray-600 text-sm">
                {userEmail}
              </p>
            </div>
          </div>

          <Card className="border-2 border-purple-200 rounded-xl mb-6">
            <CardHeader className="bg-purple-50">
              <CardTitle className="font-heading text-lg text-purple-700 flex items-center gap-2">
                <Target className="w-5 h-5" />
                {lang === 'fr' ? 'Missions Direction' : 'Management Missions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="font-body text-gray-700">
                    {lang === 'fr' ? 'Création de mission' : 'Mission creation'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? 'Notification lors de nouvelles missions' : 'Notify on new missions'}
                  </p>
                </div>
                <Switch
                  checked={localPrefs.missions_creation}
                  onCheckedChange={() => handleToggle('missions_creation')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="font-body text-gray-700">
                    {lang === 'fr' ? 'Mise à jour de mission' : 'Mission update'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? 'Notification lors des modifications' : 'Notify on updates'}
                  </p>
                </div>
                <Switch
                  checked={localPrefs.missions_update}
                  onCheckedChange={() => handleToggle('missions_update')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="font-body text-gray-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {lang === 'fr' ? 'Clôture de mission' : 'Mission completion'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? 'Notification lors de la clôture' : 'Notify on completion'}
                  </p>
                </div>
                <Switch
                  checked={localPrefs.missions_complete}
                  onCheckedChange={() => handleToggle('missions_complete')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="font-body text-gray-700 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    {lang === 'fr' ? 'Uniquement missions prioritaires' : 'Only high priority'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? 'Ne recevoir que les missions haute priorité' : 'Only high priority missions'}
                  </p>
                </div>
                <Switch
                  checked={localPrefs.missions_priority_high}
                  onCheckedChange={() => handleToggle('missions_priority_high')}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 rounded-xl mb-6">
            <CardHeader className="bg-blue-50">
              <CardTitle className="font-heading text-lg text-blue-700 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {lang === 'fr' ? 'Interventions' : 'Interventions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="font-body text-gray-700">
                    {lang === 'fr' ? 'Interventions assignées' : 'Assigned interventions'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? 'Notification lors d\'assignation' : 'Notify on assignment'}
                  </p>
                </div>
                <Switch
                  checked={localPrefs.interventions_assigned}
                  onCheckedChange={() => handleToggle('interventions_assigned')}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 rounded-xl mb-6">
            <CardHeader className="bg-green-50">
              <CardTitle className="font-heading text-lg text-green-700 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {lang === 'fr' ? 'Notifications email' : 'Email notifications'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="font-body text-gray-700">
                    {lang === 'fr' ? 'Recevoir des emails' : 'Receive emails'}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? 'Recevoir également par email' : 'Also receive by email'}
                  </p>
                </div>
                <Switch
                  checked={localPrefs.email_notifications}
                  onCheckedChange={() => handleToggle('email_notifications')}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 rounded-xl"
          >
            {saveMutation.isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              lang === 'fr' ? 'Enregistrer les préférences' : 'Save preferences'
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}