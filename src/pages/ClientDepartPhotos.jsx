import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Camera, Check, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientDepartPhotos() {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  
  const [photos, setPhotos] = useState({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const typeLogement = sessionStorage.getItem('depart_type_logement');
  const nom = sessionStorage.getItem('depart_nom');
  const prenom = sessionStorage.getItem('depart_prenom');
  const dateArrivee = sessionStorage.getItem('depart_date_arrivee');
  const dateDepart = sessionStorage.getItem('depart_date_depart');
  const categorie = sessionStorage.getItem('depart_categorie');
  const numero = sessionStorage.getItem('depart_numero');

  useEffect(() => {
    if (!typeLogement || !nom) {
      navigate(createPageUrl('ClientDepartIdentite'));
    }
  }, [typeLogement, nom, navigate]);

  const requiredPhotos = typeLogement === 'mobilhome' 
    ? ['salle_de_bain', 'toilettes', 'chambre', 'sejour', 'cuisine', 'terrasse']
    : ['terrain'];

  const photoLabels = {
    salle_de_bain: { fr: 'Salle de bain', en: 'Bathroom' },
    toilettes: { fr: 'Toilettes', en: 'Toilets' },
    chambre: { fr: 'Chambre(s)', en: 'Bedroom(s)' },
    sejour: { fr: 'Séjour', en: 'Living room' },
    cuisine: { fr: 'Cuisine', en: 'Kitchen' },
    terrasse: { fr: 'Terrasse', en: 'Terrace' },
    terrain: { fr: 'Terrain (vue générale)', en: 'Site (general view)' }
  };

  const handleFileSelect = async (key, file) => {
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotos(prev => ({ ...prev, [key]: file_url }));
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de l\'upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const allPhotosProvided = requiredPhotos.every(key => photos[key]);

  const handleSubmit = async () => {
    if (!allPhotosProvided) {
      toast.error(lang === 'fr' 
        ? 'Toutes les photos sont obligatoires'
        : 'All photos are required'
      );
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.DepartCheck.create({
        client_nom: nom,
        client_prenom: prenom,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        type_logement: typeLogement,
        categorie_logement: categorie,
        numero_logement: numero,
        photos_json: photos,
        date_soumission: new Date().toISOString()
      });

      // Nettoyer la session
      sessionStorage.removeItem('depart_nom');
      sessionStorage.removeItem('depart_prenom');
      sessionStorage.removeItem('depart_date_arrivee');
      sessionStorage.removeItem('depart_date_depart');
      sessionStorage.removeItem('depart_type_logement');
      sessionStorage.removeItem('depart_categorie');
      sessionStorage.removeItem('depart_numero');

      navigate(createPageUrl('ClientDepartConfirmation'));
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de l\'enregistrement' : 'Submit error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('ClientDepartChecklist'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">
                {lang === 'fr' ? 'Retour' : 'Back'}
              </span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-2">
            🚗 {lang === 'fr' ? 'Départ' : 'Departure'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-6">
            {lang === 'fr' ? 'Étape 4/4 : Photos' : 'Step 4/4: Photos'}
          </p>

          <Card className="border-2 border-[#FFA500]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg mb-6">
                <p className="font-heading text-base text-red-800 mb-2">
                  📸 {lang === 'fr' ? '⚠️ PHOTOS OBLIGATOIRES' : '⚠️ PHOTOS REQUIRED'}
                </p>
                <p className="font-body text-sm text-gray-700">
                  {lang === 'fr' 
                    ? typeLogement === 'mobilhome'
                      ? 'Pour prouver que vous avez bien nettoyé et laissé le mobil-home propre, merci de prendre une photo de CHAQUE pièce. Ces photos sont OBLIGATOIRES pour valider votre départ.'
                      : 'Pour prouver que vous avez bien nettoyé et laissé l\'emplacement propre, merci de prendre une photo générale. Cette photo est OBLIGATOIRE pour valider votre départ.'
                    : typeLogement === 'mobilhome'
                      ? 'To prove that you have cleaned and left the mobile home clean, please take a photo of EACH room. These photos are REQUIRED to validate your checkout.'
                      : 'To prove that you have cleaned and left the pitch clean, please take a general photo. This photo is REQUIRED to validate your checkout.'
                  }
                </p>
              </div>

              <div className="space-y-4">
                {requiredPhotos.map(key => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {photos[key] ? (
                        <Check className="w-6 h-6 text-green-500" />
                      ) : (
                        <Camera className="w-6 h-6 text-gray-400" />
                      )}
                      <span className="font-heading text-[#0077A8]">
                        {photoLabels[key][lang]}
                      </span>
                    </div>
                    
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileSelect(key, e.target.files[0])}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant={photos[key] ? 'outline' : 'default'}
                        className={`${photos[key] ? 'border-green-500 text-green-600' : 'bg-[#FFA500] text-white'}`}
                        asChild
                      >
                        <span>
                          {photos[key] ? (
                            lang === 'fr' ? '✓ OK' : '✓ Done'
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              {lang === 'fr' ? 'Ajouter' : 'Add'}
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!allPhotosProvided || submitting}
                className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading mt-6"
              >
                {submitting 
                  ? (lang === 'fr' ? 'Envoi en cours...' : 'Submitting...')
                  : (lang === 'fr' ? 'Envoyer mon départ' : 'Submit my checkout')
                }
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}