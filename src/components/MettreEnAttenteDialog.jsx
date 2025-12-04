import React, { useState } from 'react';
import { useTranslation } from './translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Clock, Package, Loader2 } from 'lucide-react';

export default function MettreEnAttenteDialog({ open, onOpenChange, onConfirm, isLoading }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    raison: '',
    materiel: false,
    materielDetail: '',
    delai: '',
    commentaire: ''
  });

  const handleConfirm = () => {
    if (!formData.commentaire.trim()) {
      return;
    }
    onConfirm(formData);
  };

  const isValid = formData.commentaire.trim() && formData.raison;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-[#0077A8] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FFA500]" />
            {t('mettre_en_attente')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-heading text-[#0077A8]">{t('raison_attente_label')} *</label>
            <Select value={formData.raison} onValueChange={(v) => setFormData({ ...formData, raison: v })}>
              <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                <SelectValue placeholder={t('selectionner_raison')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="materiel_manquant">{t('raison_materiel_manquant')}</SelectItem>
                <SelectItem value="client_absent">{t('raison_client_absent')}</SelectItem>
                <SelectItem value="intervention_impossible">{t('raison_intervention_impossible')}</SelectItem>
                <SelectItem value="attente_fournisseur">{t('raison_attente_fournisseur')}</SelectItem>
                <SelectItem value="autre">{t('raison_autre')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Checkbox
              checked={formData.materiel}
              onCheckedChange={(checked) => setFormData({ ...formData, materiel: checked })}
              className="data-[state=checked]:bg-[#FFA500]"
            />
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#FFA500]" />
              <span className="font-body text-sm">{t('materiel_manquant_question')}</span>
            </div>
          </div>

          {formData.materiel && (
            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">{t('detail_materiel')}</label>
              <Input
                value={formData.materielDetail}
                onChange={(e) => setFormData({ ...formData, materielDetail: e.target.value })}
                placeholder={t('detail_materiel_placeholder')}
                className="border-[#00AEEF]/30 rounded-xl"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-heading text-[#0077A8]">{t('delai_estime_label')}</label>
            <Select value={formData.delai} onValueChange={(v) => setFormData({ ...formData, delai: v })}>
              <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                <SelectValue placeholder={t('selectionner_delai')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">{t('delai_1h')}</SelectItem>
                <SelectItem value="2h">{t('delai_2h')}</SelectItem>
                <SelectItem value="demi-journee">{t('delai_demi_journee')}</SelectItem>
                <SelectItem value="1j">{t('delai_1j')}</SelectItem>
                <SelectItem value="2j">{t('delai_2j')}</SelectItem>
                <SelectItem value="1semaine">{t('delai_1semaine')}</SelectItem>
                <SelectItem value="indetermine">{t('delai_indetermine')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-heading text-[#0077A8]">{t('commentaire_interne_label')} *</label>
            <Textarea
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              placeholder={t('detaillez_situation')}
              className="border-[#00AEEF]/30 rounded-xl min-h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            {t('annuler')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="bg-[#FFA500] hover:bg-[#e69500] rounded-xl font-heading"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
            {t('mettre_en_attente')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}