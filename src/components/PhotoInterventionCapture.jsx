import React, { useState, useRef } from 'react';
import { useTranslation } from './translations';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Fonction pour générer le hash SHA-256
async function generateSHA256(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fonction pour ajouter le filigrane sur l'image
function addWatermark(imageFile, interventionId, collaborateurNom) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Dessiner l'image originale
        ctx.drawImage(img, 0, 0);
        
        // Configuration du filigrane
        const timestamp = format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: fr });
        const lines = [
          "Camping Paradis – Domaine de Gaujac",
          `Date : ${timestamp}`,
          `Intervention : ${interventionId}`,
          `Collaborateur : ${collaborateurNom}`
        ];
        
        // Style du filigrane
        const fontSize = Math.max(14, Math.floor(img.width / 40));
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        
        // Position en bas à droite avec fond semi-transparent
        const padding = 15;
        const lineHeight = fontSize + 5;
        const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
        const boxHeight = lines.length * lineHeight + padding * 2;
        const boxWidth = maxWidth + padding * 2;
        
        const boxX = img.width - boxWidth - 20;
        const boxY = img.height - boxHeight - 20;
        
        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 119, 168, 0.35)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        // Texte du filigrane
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.textBaseline = 'top';
        lines.forEach((line, index) => {
          const textX = boxX + padding;
          const textY = boxY + padding + (index * lineHeight);
          ctx.strokeText(line, textX, textY);
          ctx.fillText(line, textX, textY);
        });
        
        // Convertir en blob
        canvas.toBlob((blob) => {
          if (blob) {
            const watermarkedFile = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve({ file: watermarkedFile, dataUrl });
          } else {
            reject(new Error('Erreur lors de la création du filigrane'));
          }
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}

export default function PhotoInterventionCapture({ 
  open, 
  onOpenChange, 
  type, // 'avant' ou 'apres'
  interventionId,
  collaborateurNom,
  onPhotoUploaded 
}) {
  const { t, lang } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const fileInputRef = useRef(null);

  const isFrench = lang === 'fr';
  const title = type === 'avant' 
    ? (isFrench ? '📷 Photo AVANT intervention' : '📷 BEFORE intervention photo')
    : (isFrench ? '📷 Photo APRÈS intervention' : '📷 AFTER intervention photo');
  
  const description = type === 'avant'
    ? (isFrench ? 'Cette photo est OBLIGATOIRE avant de prendre en charge l\'intervention.' : 'This photo is REQUIRED before taking over the intervention.')
    : (isFrench ? 'Cette photo est OBLIGATOIRE pour marquer l\'intervention comme résolue.' : 'This photo is REQUIRED to mark the intervention as resolved.');

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Ajouter le filigrane
      const { file: watermarkedFile, dataUrl } = await addWatermark(file, interventionId, collaborateurNom);
      
      // Générer le hash SHA-256
      const hash = await generateSHA256(dataUrl);
      
      setPreview(dataUrl);
      setProcessedData({ file: watermarkedFile, hash, dataUrl });
    } catch (error) {
      console.error('Erreur traitement photo:', error);
      toast.error(isFrench ? 'Erreur lors du traitement de la photo' : 'Error processing photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!processedData) return;
    
    setIsUploading(true);
    try {
      // Upload du fichier avec filigrane
      const { file_url } = await base44.integrations.Core.UploadFile({ file: processedData.file });
      
      // Créer un log
      await base44.entities.InterventionLog.create({
        incident_id: interventionId,
        action: type === 'avant' ? 'photo_avant_ajoutee' : 'photo_apres_ajoutee',
        horodatage: new Date().toISOString(),
        utilisateur: collaborateurNom,
        commentaire: `Photo ${type} uploadée avec filigrane et hash SHA-256`
      });
      
      // Callback avec les données
      onPhotoUploaded({
        url: file_url,
        hash: processedData.hash,
        timestamp: new Date().toISOString()
      });
      
      // Reset et fermer
      setPreview(null);
      setProcessedData(null);
      onOpenChange(false);
      toast.success(isFrench ? `Photo ${type} enregistrée avec succès` : `${type} photo saved successfully`);
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error(isFrench ? 'Erreur lors de l\'envoi de la photo' : 'Error uploading photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setProcessedData(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-[#0077A8]">{title}</DialogTitle>
          <DialogDescription className="font-body text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zone d'avertissement */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-body text-amber-700">
              {isFrench 
                ? 'Un filigrane avec la date, l\'ID intervention et votre nom sera automatiquement ajouté. Cette photo servira de preuve juridique.'
                : 'A watermark with date, intervention ID and your name will be automatically added. This photo will serve as legal proof.'}
            </p>
          </div>

          {/* Preview ou bouton capture */}
          {preview ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border-2 border-[#00AEEF]">
                <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {isFrench ? 'Filigrane ajouté' : 'Watermark added'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs font-mono text-gray-500 break-all">
                  SHA-256: {processedData?.hash?.substring(0, 32)}...
                </p>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#00AEEF]/50 rounded-xl p-8 cursor-pointer hover:border-[#00AEEF] hover:bg-[#e6f7ff] transition-all text-center"
            >
              {isUploading ? (
                <Loader2 className="w-12 h-12 text-[#00AEEF] mx-auto animate-spin" />
              ) : (
                <>
                  <Camera className="w-12 h-12 text-[#00AEEF] mx-auto mb-3" />
                  <p className="font-heading text-[#0077A8]">
                    {isFrench ? 'Prendre ou importer une photo' : 'Take or import a photo'}
                  </p>
                  <p className="text-xs text-gray-500 font-body mt-1">
                    {isFrench ? 'Appuyez pour ouvrir l\'appareil photo' : 'Tap to open camera'}
                  </p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Boutons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
              className="border-gray-300 rounded-xl font-heading"
            >
              {isFrench ? 'Annuler' : 'Cancel'}
            </Button>
            <Button
              onClick={preview ? handleConfirm : () => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : preview ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              {preview 
                ? (isFrench ? 'Confirmer' : 'Confirm') 
                : (isFrench ? 'Capturer' : 'Capture')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}