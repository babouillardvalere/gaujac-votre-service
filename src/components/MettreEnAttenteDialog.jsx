import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Clock, Package, Loader2 } from 'lucide-react';

export default function MettreEnAttenteDialog({ open, onOpenChange, onConfirm, isLoading }) {
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
            Mettre en attente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-heading text-[#0077A8]">Raison de l'attente *</label>
            <Select value={formData.raison} onValueChange={(v) => setFormData({ ...formData, raison: v })}>
              <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                <SelectValue placeholder="Sélectionner une raison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="materiel_manquant">Matériel manquant</SelectItem>
                <SelectItem value="client_absent">Client absent</SelectItem>
                <SelectItem value="intervention_impossible">Intervention impossible</SelectItem>
                <SelectItem value="attente_fournisseur">Attente fournisseur</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
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
              <span className="font-body text-sm">Matériel manquant ?</span>
            </div>
          </div>

          {formData.materiel && (
            <div className="space-y-2">
              <label className="text-sm font-heading text-[#0077A8]">Détail du matériel nécessaire</label>
              <Input
                value={formData.materielDetail}
                onChange={(e) => setFormData({ ...formData, materielDetail: e.target.value })}
                placeholder="Ex: Robinet, flexible gaz..."
                className="border-[#00AEEF]/30 rounded-xl"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-heading text-[#0077A8]">Délai estimé</label>
            <Select value={formData.delai} onValueChange={(v) => setFormData({ ...formData, delai: v })}>
              <SelectTrigger className="border-[#00AEEF]/30 rounded-xl">
                <SelectValue placeholder="Sélectionner un délai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 heure</SelectItem>
                <SelectItem value="2h">2 heures</SelectItem>
                <SelectItem value="demi-journee">Demi-journée</SelectItem>
                <SelectItem value="1j">1 jour</SelectItem>
                <SelectItem value="2j">2 jours</SelectItem>
                <SelectItem value="1semaine">1 semaine</SelectItem>
                <SelectItem value="indetermine">Indéterminé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-heading text-[#0077A8]">Commentaire interne *</label>
            <Textarea
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              placeholder="Détaillez la situation..."
              className="border-[#00AEEF]/30 rounded-xl min-h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="bg-[#FFA500] hover:bg-[#e69500] rounded-xl font-heading"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
            Mettre en attente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}