import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Camera, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function InventaireItemWithProblem({ 
  item, 
  quantity, 
  onQuantityChange,
  photos = [],
  onPhotosChange,
  remarque = '',
  onRemarqueChange,
  clientInfo,
  hebergementInfo
}) {
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [problemeSignale, setProblemeSignale] = useState(false);

  // Déterminer le service selon l'objet
  const getServiceForItem = (itemKey) => {
    const technicalItems = [
      'plaques_cuisson', 'electricite', 'eau', 'climatisation', 'tv',
      'refrigerateur', 'congelateur', 'lave_vaisselle', 'mobilier_casse',
      'structure', 'porte', 'fenetre', 'lit', 'latte'
    ];
    
    const menageItems = [
      'proprete', 'literie', 'odeur', 'vaisselle_sale', 'sol', 'sanitaires'
    ];
    
    const receptionItems = [
      'cle', 'badge', 'carte', 'mobilier_exterieur', 'materiel_manquant'
    ];

    if (technicalItems.some(t => itemKey.toLowerCase().includes(t))) return 'TECHNIQUE';
    if (menageItems.some(m => itemKey.toLowerCase().includes(m))) return 'MENAGE';
    if (receptionItems.some(r => itemKey.toLowerCase().includes(r))) return 'RECEPTION';
    
    return 'TECHNIQUE'; // Par défaut
  };

  const handleIconClick = () => {
    const service = getServiceForItem(item.key);
    // Seulement pour les items qui peuvent avoir des problèmes
    if (service) {
      setShowProblemDialog(true);
    }
  };

  const handleSignalerProbleme = async () => {
    const service = getServiceForItem(item.key);
    
    try {
      // Créer une intervention automatique
      const descriptionProbleme = `Problème signalé sur ${item.label}: ${remarque || 'Aucun détail fourni'}`;
      
      await base44.entities.Incident.create({
        type: service.toLowerCase(),
        categorie: 'autre',
        description_probleme: descriptionProbleme, // CHAMP PRINCIPAL
        description: descriptionProbleme, // COMPAT
        client_nom: clientInfo?.nom || '',
        client_prenom: clientInfo?.prenom || '',
        date_arrivee: clientInfo?.dateArrivee || new Date().toISOString().split('T')[0],
        date_depart: clientInfo?.dateDepart || new Date().toISOString().split('T')[0],
        logement: hebergementInfo?.numero || '',
        origine: 'arrivee',
        statut: 'en_attente',
        photo_url: photos[0] || null
      });

      setProblemeSignale(true);
      setShowProblemDialog(false);
      toast.success(`Intervention ${service} créée`);
    } catch (error) {
      toast.error('Erreur lors de la création');
      console.error(error);
    }
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onPhotosChange([...photos, file_url]);
      toast.success('Photo ajoutée');
    } catch (error) {
      toast.error('Erreur upload photo');
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-all">
        {/* Icône cliquable */}
        <button
          onClick={handleIconClick}
          className={`text-2xl ${problemeSignale ? 'opacity-50' : ''} hover:scale-110 transition-transform`}
          disabled={problemeSignale}
        >
          {item.icon}
        </button>

        {/* Label + quantité */}
        <div className="flex-1">
          <p className="font-heading text-sm">{item.label}</p>
          {item.quantity && (
            <p className="text-xs text-gray-500">Quantité: {item.quantity}</p>
          )}
        </div>

        {/* Compteur quantité */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            -
          </button>
          <span className="w-8 text-center font-bold">{quantity}</span>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-600 text-white"
          >
            +
          </button>
        </div>

        {/* Badge problème signalé */}
        {problemeSignale && (
          <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
            ⚠️ Signalé
          </div>
        )}
      </div>

      {/* Zone photos + remarque */}
      <div className="ml-11 mt-2 space-y-2">
        {/* Photos */}
        <div className="flex gap-2 flex-wrap">
          {photos.map((url, idx) => (
            <img key={idx} src={url} className="w-16 h-16 object-cover rounded border" />
          ))}
          <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
            <Camera className="w-6 h-6 text-gray-400" />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoCapture} />
          </label>
        </div>

        {/* Remarque */}
        <Textarea
          value={remarque}
          onChange={(e) => onRemarqueChange(e.target.value)}
          placeholder="Remarque (facultatif)..."
          className="text-sm"
          rows={2}
        />
      </div>

      {/* Dialog problème */}
      <Dialog open={showProblemDialog} onOpenChange={setShowProblemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Signaler un problème ?
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-600">
            Concernant : <strong>{item.label}</strong>
          </p>

          <div className="space-y-3">
            <Button 
              onClick={handleSignalerProbleme}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              ✔️ Oui, signaler un problème
            </Button>
            <Button 
              onClick={() => setShowProblemDialog(false)}
              variant="outline"
              className="w-full"
            >
              ✖️ Non, simple vérification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}