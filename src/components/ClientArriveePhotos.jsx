import React, { useState } from 'react';
import { useTranslation } from './translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ClientArriveePhotos({ onComplete, onSkip }) {
  const { t, lang } = useTranslation();
  const [photos, setPhotos] = useState({
    sejour: null,
    chambres: null,
    salle_bain: null,
    wc: null,
    cuisine: null,
    terrasse: null
  });
  const [comments, setComments] = useState({});
  const [uploading, setUploading] = useState(false);

  const pieces = [
    { 
      id: 'sejour', 
      icon: '🏡', 
      nom_fr: 'Séjour / Table (vaisselle)',
      nom_en: 'Living room / Table (dishes)',
      info_fr: 'Important : toute la vaisselle est sur la table',
      info_en: 'Important: all dishes are on the table'
    },
    { 
      id: 'chambres', 
      icon: '🛏️', 
      nom_fr: 'Chambre(s)',
      nom_en: 'Bedroom(s)',
      info_fr: '1 photo minimum',
      info_en: '1 photo minimum'
    },
    { 
      id: 'salle_bain', 
      icon: '🛁', 
      nom_fr: 'Salle de bain',
      nom_en: 'Bathroom',
      info_fr: 'Douche + lavabo',
      info_en: 'Shower + sink'
    },
    { 
      id: 'wc', 
      icon: '🚽', 
      nom_fr: 'WC',
      nom_en: 'WC',
      info_fr: 'Simple photo',
      info_en: 'Simple photo'
    },
    { 
      id: 'cuisine', 
      icon: '🍳', 
      nom_fr: 'Cuisine',
      nom_en: 'Kitchen',
      info_fr: 'Plan de travail + appareils',
      info_en: 'Worktop + appliances'
    },
    { 
      id: 'terrasse', 
      icon: '🌞', 
      nom_fr: 'Terrasse extérieure',
      nom_en: 'Outdoor terrace',
      info_fr: 'Mobilier extérieur',
      info_en: 'Outdoor furniture'
    }
  ];

  const handlePhotoCapture = async (pieceId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          setPhotos(prev => ({ ...prev, [pieceId]: file_url }));
          toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
        } catch (error) {
          toast.error(lang === 'fr' ? 'Erreur lors de l\'ajout de la photo' : 'Error adding photo');
        }
      }
    };
    
    input.click();
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      const arriveeData = JSON.parse(sessionStorage.getItem('arrivee_data') || '{}');
      
      // Créer un enregistrement avec les photos
      await base44.entities.DepartCheck.create({
        client_nom: arriveeData.nom,
        client_prenom: arriveeData.prenom,
        date_arrivee: arriveeData.date_arrivee,
        date_depart: arriveeData.date_depart,
        type_logement: arriveeData.type_hebergement,
        categorie_logement: arriveeData.categorie,
        numero_logement: arriveeData.numero,
        photos_json: {
          type: 'arrivee',
          photos: photos,
          comments: comments,
          date_soumission: new Date().toISOString()
        },
        date_soumission: new Date().toISOString()
      });

      toast.success(lang === 'fr' 
        ? 'Vos photos ont bien été enregistrées !' 
        : 'Your photos have been saved!');
      
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      toast.error(lang === 'fr' ? 'Erreur lors de l\'enregistrement' : 'Error saving photos');
    } finally {
      setUploading(false);
    }
  };

  const hasPhotos = Object.values(photos).some(p => p !== null);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="border-2 border-[#00AEEF]/30">
        <CardHeader className="bg-gradient-to-r from-[#00AEEF]/10 to-transparent">
          <CardTitle className="flex items-center gap-3 text-2xl font-handwritten text-[#0077A8]">
            <Camera className="w-8 h-8" />
            {lang === 'fr' ? '📸 Photos d\'arrivée (facultatif)' : '📸 Arrival photos (optional)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {lang === 'fr' 
                ? '🔐 Pour votre tranquillité, vous pouvez ajouter des photos de chaque pièce. Cela permet de prouver l\'état initial du logement en cas de litige sur la vaisselle, le mobilier ou l\'état général.'
                : '🔐 For your peace of mind, you can add photos of each room. This helps prove the initial condition of the accommodation in case of disputes about dishes, furniture or general condition.'}
            </p>
            <p className="text-sm font-semibold text-[#0077A8] mt-2">
              {lang === 'fr' 
                ? '⭐ Cette étape est FACULTATIVE mais fortement recommandée.'
                : '⭐ This step is OPTIONAL but highly recommended.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des pièces */}
      <div className="grid gap-4">
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`border-2 transition-all ${
              photos[piece.id] 
                ? 'border-green-500 bg-green-50/50' 
                : 'border-gray-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`text-4xl flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl ${
                    photos[piece.id] ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {photos[piece.id] ? (
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    ) : (
                      piece.icon
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-heading text-lg text-[#0077A8] mb-1">
                      {lang === 'fr' ? piece.nom_fr : piece.nom_en}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {lang === 'fr' ? piece.info_fr : piece.info_en}
                    </p>
                    
                    {photos[piece.id] && (
                      <img 
                        src={photos[piece.id]} 
                        alt={piece.nom_fr}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    
                    <Button
                      onClick={() => handlePhotoCapture(piece.id)}
                      variant={photos[piece.id] ? 'outline' : 'default'}
                      className={photos[piece.id] ? '' : 'bg-[#00AEEF] hover:bg-[#0077A8]'}
                      size="sm"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {photos[piece.id] 
                        ? (lang === 'fr' ? 'Changer la photo' : 'Change photo')
                        : (lang === 'fr' ? 'Prendre une photo' : 'Take a photo')}
                    </Button>
                    
                    {photos[piece.id] && (
                      <Textarea
                        placeholder={lang === 'fr' 
                          ? 'Commentaire optionnel (si anomalie)...' 
                          : 'Optional comment (if issue)...'}
                        value={comments[piece.id] || ''}
                        onChange={(e) => setComments(prev => ({ 
                          ...prev, 
                          [piece.id]: e.target.value 
                        }))}
                        className="mt-2"
                        rows={2}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-col gap-3 mt-8">
        {hasPhotos && (
          <Button
            onClick={handleSubmit}
            disabled={uploading}
            className="bg-green-600 hover:bg-green-700 text-white h-14 text-lg"
          >
            {uploading ? (
              lang === 'fr' ? 'Envoi en cours...' : 'Sending...'
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                {lang === 'fr' ? 'Valider les photos' : 'Validate photos'}
              </>
            )}
          </Button>
        )}
        
        <Button
          onClick={onSkip}
          variant="outline"
          className="h-14 text-lg border-2"
        >
          {hasPhotos 
            ? (lang === 'fr' ? 'Passer sans valider' : 'Skip without validating')
            : (lang === 'fr' ? 'Passer cette étape' : 'Skip this step')}
        </Button>
      </div>

      {/* Message de protection */}
      <Card className="border-2 border-yellow-200 bg-yellow-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              {lang === 'fr'
                ? '🛡️ Ces photos servent uniquement à garantir votre tranquillité en cas de litige. Elles seront consultables lors de votre départ pour comparaison.'
                : '🛡️ These photos are only used to guarantee your peace of mind in case of disputes. They will be available at your departure for comparison.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}