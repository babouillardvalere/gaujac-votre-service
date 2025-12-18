import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function InventaireItemRow({ item, quantity, photos = [], onQuantityChange, onPhotosChange, onUrgencyChange, urgent = false, lang = 'fr' }) {
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [uploading, setUploading] = useState(false);

  const declared = quantity !== undefined ? quantity : item.qty;
  const isAnomaly = declared < item.qty;

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

  return (
    <>
      <div className={`p-3 border rounded-lg ${isAnomaly ? 'bg-orange-50 border-orange-500' : 'border-gray-200'}`}>
        <div className="flex items-start justify-between mb-2">
          <div 
            className="flex items-center gap-2 cursor-pointer flex-1"
            onClick={() => setShowQuantitySelector(true)}
          >
            <span className="text-3xl">{item.emoji}</span>
            <div>
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-gray-500">
                {lang === 'fr' ? 'Attendu' : 'Expected'}: {item.qty} • {lang === 'fr' ? 'Présent' : 'Present'}: {declared}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
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
                variant="outline"
                className="h-8 w-8 p-0"
                disabled={uploading}
                asChild
              >
                <div>
                  <Camera className="w-4 h-4" />
                </div>
              </Button>
            </label>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {photos.map((photoUrl, idx) => (
              <div key={idx} className="relative">
                <img src={photoUrl} alt={`Photo ${idx + 1}`} className="w-16 h-16 object-cover rounded border" />
                <button
                  onClick={() => removePhoto(photoUrl)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {isAnomaly && (
          <div className="mt-2 pt-2 border-t border-orange-300">
            <p className="text-xs text-red-600 mb-2">
              ⚠️ {lang === 'fr' ? 'Manquant' : 'Missing'}: {item.qty - declared}
            </p>
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
              {lang === 'fr' ? 'Quantité attendue' : 'Expected quantity'}: {item.qty}
            </p>
            <div className="grid grid-cols-5 gap-2">
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
    </>
  );
}