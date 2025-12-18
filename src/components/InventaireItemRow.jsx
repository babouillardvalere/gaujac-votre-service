import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Camera, X, MessageSquare, AlertCircle, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ARTICLES_TECHNIQUES = [
  'tv', 'refrigerateur', 'micro_ondes', 'chauffage', 'plaques_cuisson', 'plaque_cuisson',
  'chauffe_eau', 'wc', 'douche', 'lavabo', 'feux_gaz', 'telecommande_clim', 'climatisation',
  'lave_vaisselle', 'congelateur', 'evier', 'cafetiere', 'hotte', 'cumulus', 'chauffe_eau_gaz',
  'seche_serviette', 'seche_cheveux', 'extincteur', 'detecteur_fumee'
];

export default function InventaireItemRow({ 
  item, 
  quantity, 
  photos = [], 
  remarque = '',
  onQuantityChange, 
  onPhotosChange, 
  onRemarqueChange,
  onUrgencyChange, 
  onProblemeTechnique,
  urgent = false,
  problemeTechniqueSignale = false,
  lang = 'fr' 
}) {
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [showRemarqueDialog, setShowRemarqueDialog] = useState(false);
  const [showTechniqueDialog, setShowTechniqueDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tempRemarque, setTempRemarque] = useState(remarque);

  const declared = quantity !== undefined ? quantity : item.qty;
  const isAnomaly = declared < item.qty || problemeTechniqueSignale;
  const isTechnique = ARTICLES_TECHNIQUES.includes(item.id);

  const handleIconClick = () => {
    if (isTechnique) {
      setShowTechniqueDialog(true);
    } else {
      setShowQuantitySelector(true);
    }
  };

  const handleTechniqueConfirm = (signaleProblem) => {
    if (signaleProblem) {
      onProblemeTechnique(item.id, true);
      toast.success(lang === 'fr' ? '🔧 Problème technique signalé' : '🔧 Technical issue reported');
    }
    setShowTechniqueDialog(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedPhotos = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedPhotos.push(file_url);
      }
      onPhotosChange(item.id, [...photos, ...uploadedPhotos]);
      toast.success(lang === 'fr' ? 'Photo(s) ajoutée(s)' : 'Photo(s) added');
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoUrl) => {
    onPhotosChange(item.id, photos.filter(p => p !== photoUrl));
  };

  const saveRemarque = () => {
    onRemarqueChange(item.id, tempRemarque);
    setShowRemarqueDialog(false);
    if (tempRemarque) {
      toast.success(lang === 'fr' ? 'Remarque enregistrée' : 'Note saved');
    }
  };

  return (
    <>
      <div className={`p-3 border-2 rounded-lg transition-all ${
        isAnomaly 
          ? 'bg-orange-50 border-orange-500 shadow-md' 
          : 'border-gray-200 hover:border-[#00AEEF]/50'
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div 
            className="flex items-center gap-2 cursor-pointer flex-1"
            onClick={handleIconClick}
            title={lang === 'fr' ? 'Cliquer pour modifier' : 'Click to modify'}
          >
            <span className="text-3xl">{item.emoji}</span>
            <div>
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-gray-500">
                {lang === 'fr' ? 'Attendu' : 'Expected'}: {item.qty} • 
                {lang === 'fr' ? ' Présent' : ' Present'}: {declared}
              </p>
            </div>
          </div>

          <div className="flex gap-1">
            {/* Bouton remarque */}
            <Button
              type="button"
              size="sm"
              variant={remarque ? "default" : "outline"}
              className={`h-8 w-8 p-0 ${remarque ? 'bg-blue-500' : ''}`}
              onClick={() => {
                setTempRemarque(remarque);
                setShowRemarqueDialog(true);
              }}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>

            {/* Bouton photo */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
              <Button
                type="button"
                size="sm"
                variant={photos.length > 0 ? "default" : "outline"}
                className={`h-8 w-8 p-0 ${photos.length > 0 ? 'bg-green-500' : ''}`}
                disabled={uploading}
                asChild
              >
                <div>
                  <Camera className="w-4 h-4" />
                  {photos.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-green-600 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {photos.length}
                    </span>
                  )}
                </div>
              </Button>
            </label>
          </div>
        </div>

        {/* Photos miniatures */}
        {photos.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {photos.map((photoUrl, idx) => (
              <div key={idx} className="relative">
                <img src={photoUrl} alt={`Photo ${idx + 1}`} className="w-16 h-16 object-cover rounded border-2 border-gray-300" />
                <button
                  onClick={() => removePhoto(photoUrl)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Remarque affichée */}
        {remarque && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-900">
              💬 {remarque}
            </p>
          </div>
        )}

        {/* Anomalie détectée */}
        {isAnomaly && (
          <div className="mt-2 pt-2 border-t border-orange-300">
            {declared < item.qty && (
              <p className="text-xs text-red-600 mb-2">
                ⚠️ {lang === 'fr' ? 'Manquant' : 'Missing'}: {item.qty - declared}
              </p>
            )}
            {problemeTechniqueSignale && (
              <p className="text-xs text-orange-600 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {lang === 'fr' ? 'Problème technique signalé' : 'Technical issue reported'}
              </p>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={urgent}
                onCheckedChange={(checked) => onUrgencyChange(item.id, checked)}
                className="data-[state=checked]:bg-red-500"
              />
              <span className="text-xs text-gray-700">
                {lang === 'fr' ? '🆘 Intervention urgente' : '🆘 Urgent intervention'}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Dialog sélection quantité */}
      <Dialog open={showQuantitySelector} onOpenChange={setShowQuantitySelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{item.emoji}</span>
              {item.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {lang === 'fr' ? 'Quantité attendue' : 'Expected quantity'}: <strong>{item.qty}</strong>
            </p>
            <p className="text-sm text-gray-700">
              {lang === 'fr' ? 'Sélectionnez la quantité présente:' : 'Select present quantity:'}
            </p>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: item.qty + 1 }, (_, i) => (
                <Button
                  key={i}
                  variant={declared === i ? 'default' : 'outline'}
                  className={declared === i ? 'bg-[#00AEEF]' : ''}
                  onClick={() => {
                    onQuantityChange(item.id, i);
                    setShowQuantitySelector(false);
                  }}
                >
                  {i}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog problème technique */}
      <Dialog open={showTechniqueDialog} onOpenChange={setShowTechniqueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">🔧</span>
              {lang === 'fr' ? 'Problème technique ?' : 'Technical issue?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-blue-900 mb-2">{item.emoji} {item.label}</p>
              <p className="text-sm text-blue-800">
                {lang === 'fr' 
                  ? "Cet équipement est-il défectueux ou ne fonctionne-t-il pas correctement ?"
                  : "Is this equipment defective or not working properly?"}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {lang === 'fr'
                ? "Si vous signalez un problème, une intervention technique sera créée automatiquement."
                : "If you report an issue, a technical intervention will be created automatically."}
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleTechniqueConfirm(false)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Non, tout va bien' : 'No, everything is fine'}
            </Button>
            <Button 
              onClick={() => handleTechniqueConfirm(true)}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Oui, signaler le problème' : 'Yes, report issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog remarque */}
      <Dialog open={showRemarqueDialog} onOpenChange={setShowRemarqueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {lang === 'fr' ? 'Remarque' : 'Note'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold text-sm">{item.emoji} {item.label}</p>
            </div>
            <Textarea
              value={tempRemarque}
              onChange={(e) => setTempRemarque(e.target.value)}
              placeholder={lang === 'fr' ? 'Décrivez le problème, défaut ou remarque...' : 'Describe the issue or note...'}
              rows={4}
              className="border-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemarqueDialog(false)}>
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button onClick={saveRemarque} className="bg-[#00AEEF]">
              <Check className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Enregistrer' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}