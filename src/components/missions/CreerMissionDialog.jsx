import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const SERVICES = [
  { value: 'TECHNIQUE', label: '🧰 Technique', color: 'bg-orange-100' },
  { value: 'MENAGE', label: '🧽 Ménage', color: 'bg-yellow-100' },
  { value: 'BNSSA', label: '🏊 BNSSA', color: 'bg-blue-100' },
  { value: 'BAR', label: '☕ Bar', color: 'bg-pink-100' },
  { value: 'ANIMATIONS', label: '🎵 Animations', color: 'bg-purple-100' },
  { value: 'RECEPTION', label: '🏠 Réception', color: 'bg-green-100' }
];

export default function CreerMissionDialog({ open, onOpenChange, onSuccess, lang = 'fr' }) {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type_mission: 'DIRECTIVE_GLOBALE',
    date_debut: '',
    date_fin: '',
    priorite: 'NORMALE',
    hebergement_concerne: '',
    services: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.titre || !formData.date_debut || !formData.date_fin || formData.services.length === 0) {
      toast.error(lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Créer la mission mère
      const missionMere = await base44.entities.MissionInterne.create({
        titre: formData.titre,
        description: formData.description,
        service: 'TOUS',
        type_mission: formData.type_mission,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        priorite: formData.priorite,
        hebergement_concerne: formData.hebergement_concerne || undefined,
        statut: 'A_FAIRE'
      });

      // 2. Créer automatiquement une sous-mission par service sélectionné
      const promises = formData.services.map(service =>
        base44.entities.MissionInterne.create({
          mission_mere_id: missionMere.id,
          titre: formData.titre,
          description: formData.description,
          service: service,
          type_mission: formData.type_mission,
          date_debut: formData.date_debut,
          date_fin: formData.date_fin,
          priorite: formData.priorite,
          hebergement_concerne: formData.hebergement_concerne || undefined,
          statut: 'A_FAIRE'
        })
      );

      await Promise.all(promises);

      // 3. Créer une notification pour chaque service
      const notifPromises = formData.services.map(service =>
        base44.entities.Notification.create({
          type: 'NOUVELLE_MISSION',
          titre: `📋 Nouvelle mission Direction : ${formData.titre}`,
          message: `Type: ${formData.type_mission} | Période: ${formData.date_debut} → ${formData.date_fin}`,
          destinataire_role: service,
          statut: 'non_lu'
        })
      );

      await Promise.all(notifPromises);

      toast.success(lang === 'fr' 
        ? `Mission créée et distribuée à ${formData.services.length} service(s) ✅`
        : `Mission created and distributed to ${formData.services.length} service(s) ✅`
      );

      // Reset form
      setFormData({
        titre: '',
        description: '',
        type_mission: 'DIRECTIVE_GLOBALE',
        date_debut: '',
        date_fin: '',
        priorite: 'NORMALE',
        hebergement_concerne: '',
        services: []
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur lors de la création' : 'Error creating mission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-purple-700">
            🎯 {lang === 'fr' ? 'Créer une Mission Direction' : 'Create Management Mission'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Titre */}
          <div>
            <Label className="font-heading text-[#0077A8]">
              {lang === 'fr' ? 'Titre de la mission' : 'Mission title'} *
            </Label>
            <Input
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder={lang === 'fr' ? 'Ex: Déshivernage Mobil-homes Premium' : 'Ex: Spring opening Premium'}
              className="mt-1"
            />
          </div>

          {/* Type */}
          <div>
            <Label className="font-heading text-[#0077A8]">
              {lang === 'fr' ? 'Type de mission' : 'Mission type'}
            </Label>
            <select
              value={formData.type_mission}
              onChange={(e) => setFormData({ ...formData, type_mission: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2"
            >
              <option value="DESHIVERNAGE">{lang === 'fr' ? '🌞 Déshivernage' : '🌞 Spring opening'}</option>
              <option value="HIVERNAGE">{lang === 'fr' ? '❄️ Hivernage' : '❄️ Winter closing'}</option>
              <option value="SAISON">{lang === 'fr' ? '🏖️ Saison' : '🏖️ Season'}</option>
              <option value="DIRECTIVE_GLOBALE">{lang === 'fr' ? '📢 Directive globale' : '📢 Global directive'}</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <Label className="font-heading text-[#0077A8]">
              {lang === 'fr' ? 'Description détaillée' : 'Detailed description'}
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={lang === 'fr' ? 'Consignes, procédures, attendus...' : 'Instructions, procedures, expectations...'}
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-heading text-[#0077A8]">
                {lang === 'fr' ? 'Date début' : 'Start date'} *
              </Label>
              <Input
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-heading text-[#0077A8]">
                {lang === 'fr' ? 'Date fin' : 'End date'} *
              </Label>
              <Input
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Priorité */}
          <div>
            <Label className="font-heading text-[#0077A8]">
              {lang === 'fr' ? 'Priorité' : 'Priority'}
            </Label>
            <select
              value={formData.priorite}
              onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2"
            >
              <option value="BASSE">{lang === 'fr' ? 'Basse' : 'Low'}</option>
              <option value="NORMALE">{lang === 'fr' ? 'Normale' : 'Normal'}</option>
              <option value="HAUTE">{lang === 'fr' ? 'Haute' : 'High'}</option>
              <option value="CRITIQUE">{lang === 'fr' ? 'Critique' : 'Critical'}</option>
            </select>
          </div>

          {/* Hébergement (optionnel) */}
          <div>
            <Label className="font-heading text-[#0077A8]">
              {lang === 'fr' ? 'Hébergement concerné (optionnel)' : 'Accommodation (optional)'}
            </Label>
            <Input
              value={formData.hebergement_concerne}
              onChange={(e) => setFormData({ ...formData, hebergement_concerne: e.target.value })}
              placeholder={lang === 'fr' ? 'Ex: P03, Zone Premium' : 'Ex: P03, Premium Zone'}
              className="mt-1"
            />
          </div>

          {/* Services assignés */}
          <div>
            <Label className="font-heading text-[#0077A8] mb-3 block">
              {lang === 'fr' ? 'Services assignés' : 'Assigned services'} *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map(service => (
                <div
                  key={service.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.services.includes(service.value)
                      ? `${service.color} border-purple-500`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleServiceToggle(service.value)}
                >
                  <Checkbox
                    checked={formData.services.includes(service.value)}
                    onCheckedChange={() => handleServiceToggle(service.value)}
                  />
                  <span className="font-body text-sm">{service.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.services.length} {lang === 'fr' ? 'service(s) sélectionné(s)' : 'service(s) selected'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                lang === 'fr' ? 'Créer et distribuer' : 'Create and distribute'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}