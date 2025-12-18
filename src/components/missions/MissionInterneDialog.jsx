import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MissionInterneDialog({ open, onOpenChange, mission, action, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [photoAvant, setPhotoAvant] = useState(null);
  const [photoApres, setPhotoApres] = useState(null);
  const [nomCollaborateur, setNomCollaborateur] = useState('');

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'avant') setPhotoAvant(file_url);
      else setPhotoApres(file_url);
      toast.success('Photo ajoutée');
    } catch (error) {
      console.error(error);
      toast.error('Erreur upload photo');
    }
  };

  const handleSubmit = async () => {
    if (action === 'prendre_en_charge' && !nomCollaborateur) {
      toast.error('Veuillez saisir votre nom');
      return;
    }

    setLoading(true);
    try {
      const updateData = {};

      if (action === 'prendre_en_charge') {
        updateData.statut = 'EN_COURS';
        updateData.pris_en_charge_par = nomCollaborateur;
        updateData.date_prise_en_charge = new Date().toISOString();
        if (photoAvant) updateData.photo_avant = photoAvant;
      } else if (action === 'cloturer') {
        updateData.statut = 'TERMINE';
        updateData.date_cloture = new Date().toISOString();
        updateData.commentaire_cloture = commentaire;
        if (photoApres) updateData.photo_apres = photoApres;

        // Calculer durée si prise en charge existante
        if (mission.date_prise_en_charge) {
          const debut = new Date(mission.date_prise_en_charge);
          const fin = new Date();
          updateData.duree_minutes = Math.floor((fin - debut) / 1000 / 60);
        }
      }

      await base44.entities.MissionInterne.update(mission.id, updateData);

      toast.success(action === 'prendre_en_charge' ? 'Mission prise en charge' : 'Mission clôturée');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {action === 'prendre_en_charge' ? '▶️ Prendre en charge la mission' : '✅ Clôturer la mission'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <p className="font-semibold text-sm">{mission?.titre}</p>
            <p className="text-xs text-gray-600 mt-1">{mission?.description}</p>
          </div>

          {action === 'prendre_en_charge' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Votre nom *</label>
                <input
                  type="text"
                  value={nomCollaborateur}
                  onChange={(e) => setNomCollaborateur(e.target.value)}
                  className="w-full border-2 rounded-lg p-2"
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Photo AVANT (optionnel)</label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, 'avant')}
                  />
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <div>
                      <Camera className="w-4 h-4 mr-2" />
                      {photoAvant ? 'Photo ajoutée ✓' : 'Ajouter une photo'}
                    </div>
                  </Button>
                </label>
                {photoAvant && (
                  <img src={photoAvant} alt="Photo avant" className="mt-2 w-full h-32 object-cover rounded border" />
                )}
              </div>
            </>
          )}

          {action === 'cloturer' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">Commentaire de clôture</label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Décrivez ce qui a été fait..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Photo APRÈS (optionnel)</label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, 'apres')}
                  />
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <div>
                      <Camera className="w-4 h-4 mr-2" />
                      {photoApres ? 'Photo ajoutée ✓' : 'Ajouter une photo'}
                    </div>
                  </Button>
                </label>
                {photoApres && (
                  <img src={photoApres} alt="Photo après" className="mt-2 w-full h-32 object-cover rounded border" />
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            {loading ? 'Envoi...' : action === 'prendre_en_charge' ? 'Prendre en charge' : 'Clôturer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}