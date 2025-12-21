import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, Volume2, VolumeX, Mail, AlertTriangle, 
  Wrench, Package, Star, RefreshCcw, Settings,
  Loader2, Save, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationPreferencesPanel({ userEmail }) {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  const { data: preference, isLoading } = useQuery({
    queryKey: ['notification-preference', userEmail],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter({ user_email: userEmail });
      return prefs[0] || null;
    }
  });

  const [localPrefs, setLocalPrefs] = useState({
    interventions_urgentes: true,
    interventions_nouvelles: true,
    interventions_assignees: false,
    missions_creation: true,
    missions_reactivation: true,
    missions_complete: true,
    litiges_signales: true,
    stock_alerte: true,
    commandes_recues: true,
    avis_clients: false,
    email_notifications: false,
    sound_enabled: true,
    browser_notifications: true,
    seuil_stock_critique: 3,
    seuil_intervention_retard: 120,
    services_surveilles: ['TOUS']
  });

  useEffect(() => {
    if (preference) {
      setLocalPrefs({
        interventions_urgentes: preference.interventions_urgentes ?? true,
        interventions_nouvelles: preference.interventions_nouvelles ?? true,
        interventions_assignees: preference.interventions_assignees ?? false,
        missions_creation: preference.missions_creation ?? true,
        missions_reactivation: preference.missions_reactivation ?? true,
        missions_complete: preference.missions_complete ?? true,
        litiges_signales: preference.litiges_signales ?? true,
        stock_alerte: preference.stock_alerte ?? true,
        commandes_recues: preference.commandes_recues ?? true,
        avis_clients: preference.avis_clients ?? false,
        email_notifications: preference.email_notifications ?? false,
        sound_enabled: preference.sound_enabled ?? true,
        browser_notifications: preference.browser_notifications ?? true,
        seuil_stock_critique: preference.seuil_stock_critique ?? 3,
        seuil_intervention_retard: preference.seuil_intervention_retard ?? 120,
        services_surveilles: preference.services_surveilles ?? ['TOUS']
      });
      setHasChanges(false);
    }
  }, [preference]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preference) {
        return await base44.entities.NotificationPreference.update(preference.id, data);
      } else {
        return await base44.entities.NotificationPreference.create({
          user_email: userEmail,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preference'] });
      toast.success('Préférences enregistrées ✅');
      setHasChanges(false);
    }
  });

  const handleChange = (key, value) => {
    setLocalPrefs({ ...localPrefs, [key]: value });
    setHasChanges(true);
  };

  const handleServiceToggle = (service) => {
    let newServices = [...localPrefs.services_surveilles];
    
    if (service === 'TOUS') {
      newServices = ['TOUS'];
    } else {
      newServices = newServices.filter(s => s !== 'TOUS');
      if (newServices.includes(service)) {
        newServices = newServices.filter(s => s !== service);
      } else {
        newServices.push(service);
      }
      if (newServices.length === 0) newServices = ['TOUS'];
    }
    
    setLocalPrefs({ ...localPrefs, services_surveilles: newServices });
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(localPrefs);
  };

  const testNotification = () => {
    if (localPrefs.sound_enabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAg+ltryxnMnBSx+zPDZiToIGGS57OihUQwNU6jj8LJoHwU2jtTx0HwvBSh1xfDhkz0KFF203+ynVhALRJzf8L9vIgU0iPDfkz0KFF203+ynVhALRJzf8L9vIgU0iPDfkz0KFF203+ynVhALRJzf8L9vIgU0iPDfkz0KFF203+ynVhALRJzf8L9vIgU0');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
    
    if (localPrefs.browser_notifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('🔔 Test Notification', {
          body: 'Vos notifications sont actives !',
          icon: '/logo.png'
        });
      } else {
        Notification.requestPermission();
      }
    }
    
    toast.success('🔔 Notification test envoyée');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec bouton sauvegarde */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-[#0077A8] flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Préférences de notifications
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={testNotification}
            variant="outline"
            className="rounded-xl"
          >
            <Bell className="w-4 h-4 mr-2" />
            Tester
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveMutation.isPending}
            className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : hasChanges ? (
              <Save className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {hasChanges ? 'Enregistrer' : 'Sauvegardé'}
          </Button>
        </div>
      </div>

      {/* Paramètres généraux */}
      <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-[#0077A8]">
            Paramètres généraux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {localPrefs.sound_enabled ? <Volume2 className="w-5 h-5 text-[#00AEEF]" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
              <div>
                <Label className="font-medium">Sons de notification</Label>
                <p className="text-xs text-gray-500">Jouer un son lors des alertes</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.sound_enabled}
              onCheckedChange={(v) => handleChange('sound_enabled', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#00AEEF]" />
              <div>
                <Label className="font-medium">Notifications navigateur</Label>
                <p className="text-xs text-gray-500">Afficher des notifications système</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.browser_notifications}
              onCheckedChange={(v) => {
                if (v && 'Notification' in window && Notification.permission !== 'granted') {
                  Notification.requestPermission().then(permission => {
                    handleChange('browser_notifications', permission === 'granted');
                  });
                } else {
                  handleChange('browser_notifications', v);
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#00AEEF]" />
              <div>
                <Label className="font-medium">Notifications par email</Label>
                <p className="text-xs text-gray-500">Recevoir également par email</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.email_notifications}
              onCheckedChange={(v) => handleChange('email_notifications', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Types d'événements */}
      <Card className="border-2 border-purple-500/30 rounded-xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-[#0077A8]">
            Types d'événements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <Label className="font-medium text-red-700">Interventions urgentes</Label>
                <p className="text-xs text-gray-500">Priorité critique - alerte immédiate</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.interventions_urgentes}
              onCheckedChange={(v) => handleChange('interventions_urgentes', v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-blue-500" />
              <div>
                <Label className="font-medium">Nouvelles interventions</Label>
                <p className="text-xs text-gray-500">Toute nouvelle demande d'intervention</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.interventions_nouvelles}
              onCheckedChange={(v) => handleChange('interventions_nouvelles', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-purple-500" />
              <div>
                <Label className="font-medium">Interventions assignées</Label>
                <p className="text-xs text-gray-500">Quand un agent prend en charge</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.interventions_assignees}
              onCheckedChange={(v) => handleChange('interventions_assignees', v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCcw className="w-5 h-5 text-green-500" />
              <div>
                <Label className="font-medium">Missions réactivées</Label>
                <p className="text-xs text-gray-500">Mission remise à faire après attente</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.missions_reactivation}
              onCheckedChange={(v) => handleChange('missions_reactivation', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-orange-500" />
              <div>
                <Label className="font-medium">Commandes reçues</Label>
                <p className="text-xs text-gray-500">Matériel commandé disponible</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.commandes_recues}
              onCheckedChange={(v) => handleChange('commandes_recues', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <Label className="font-medium">Litiges signalés</Label>
                <p className="text-xs text-gray-500">Problème nécessitant attention</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.litiges_signales}
              onCheckedChange={(v) => handleChange('litiges_signales', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-red-500" />
              <div>
                <Label className="font-medium">Alertes stock</Label>
                <p className="text-xs text-gray-500">Stock bas ou rupture</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.stock_alerte}
              onCheckedChange={(v) => handleChange('stock_alerte', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <Label className="font-medium">Nouveaux avis clients</Label>
                <p className="text-xs text-gray-500">Feedback client reçu</p>
              </div>
            </div>
            <Switch
              checked={localPrefs.avis_clients}
              onCheckedChange={(v) => handleChange('avis_clients', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Seuils d'alerte */}
      <Card className="border-2 border-yellow-500/30 rounded-xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-[#0077A8] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Seuils d'alerte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-medium mb-2 block">Stock critique (unités)</Label>
            <Input
              type="number"
              min="0"
              max="50"
              value={localPrefs.seuil_stock_critique}
              onChange={(e) => handleChange('seuil_stock_critique', parseInt(e.target.value))}
              className="rounded-xl w-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alerte si stock ≤ {localPrefs.seuil_stock_critique} unités
            </p>
          </div>

          <div>
            <Label className="font-medium mb-2 block">Intervention en retard (minutes)</Label>
            <Input
              type="number"
              min="30"
              max="480"
              step="30"
              value={localPrefs.seuil_intervention_retard}
              onChange={(e) => handleChange('seuil_intervention_retard', parseInt(e.target.value))}
              className="rounded-xl w-32"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alerte si intervention non prise en charge après {localPrefs.seuil_intervention_retard} min
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Services surveillés */}
      <Card className="border-2 border-green-500/30 rounded-xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-[#0077A8]">
            Services à surveiller
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleServiceToggle('TOUS')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                localPrefs.services_surveilles.includes('TOUS')
                  ? 'bg-[#00AEEF] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📋 Tous les services
            </button>
            <button
              onClick={() => handleServiceToggle('TECHNIQUE')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                localPrefs.services_surveilles.includes('TECHNIQUE')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={localPrefs.services_surveilles.includes('TOUS')}
            >
              🔧 Technique
            </button>
            <button
              onClick={() => handleServiceToggle('MENAGE')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                localPrefs.services_surveilles.includes('MENAGE')
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={localPrefs.services_surveilles.includes('TOUS')}
            >
              🧹 Ménage
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Indicateur de changements */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="border-2 border-yellow-500 bg-yellow-50 shadow-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Modifications non sauvegardées
              </span>
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}