import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { getInventaireParCategorie } from '../components/categoryCodeMapping';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Camera, Check, AlertCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { uploadCompressedImage } from '../components/imageCompression';

export default function ClientDepartInventaire() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const nom = sessionStorage.getItem('depart_nom');
  const categorie = sessionStorage.getItem('depart_categorie');
  const typeLogement = sessionStorage.getItem('depart_type_logement');

  const objetsValidesArrivee = JSON.parse(sessionStorage.getItem('depart_objets_valides') || '[]');
  const objetsNonCochesArrivee = JSON.parse(sessionStorage.getItem('depart_objets_non_coches') || '[]');
  const objetsSignalesArrivee = JSON.parse(sessionStorage.getItem('depart_objets_signales_arrivee') || '[]');

  const [objetsOK, setObjetsOK] = useState([]);
  const [objetsSignales, setObjetsSignales] = useState([]);
  const [showSignalDialog, setShowSignalDialog] = useState(false);
  const [currentSignal, setCurrentSignal] = useState({ objet: '', type: 'casse', photo: '', commentaire: '' });
  const [photosLieux, setPhotosLieux] = useState({});
  const [uploading, setUploading] = useState(false);
  const [isUrgentGlobal, setIsUrgentGlobal] = useState(false);

  const inventaireLocal = typeLogement === 'mobilhome' && categorie 
    ? getInventaireParCategorie(categorie, lang)
    : null;

  const inventaireItems = typeLogement === 'mobilhome' && inventaireLocal
    ? inventaireLocal.objets
    : typeLogement === 'emplacement' 
      ? [
          { id: 'terrain_propre', icon: '✅', label: lang === 'fr' ? 'Terrain propre' : 'Clean pitch' },
          { id: 'electricite', icon: '⚡', label: lang === 'fr' ? 'Électricité' : 'Electricity' },
        ]
      : [];

  useEffect(() => {
    if (!nom || !categorie) {
      navigate(createPageUrl('ClientDepartIdentification'));
      return;
    }

    // Initialiser objetsOK avec ceux validés à l'arrivée
    setObjetsOK(objetsValidesArrivee);
  }, [nom, categorie, navigate]);

  const getObjetStatus = (objetId) => {
    // Objet signalé au départ
    if (objetsSignales.find(s => s.objet === objetId)) {
      return 'signale_depart';
    }
    // Objet OK au départ
    if (objetsOK.includes(objetId)) {
      return 'ok';
    }
    // Objet déjà manquant à l'arrivée
    if (objetsNonCochesArrivee.includes(objetId) || objetsSignalesArrivee.find(s => s.objet === objetId)) {
      return 'deja_manquant';
    }
    return 'inconnu';
  };

  const toggleObjet = (objetId) => {
    const status = getObjetStatus(objetId);
    
    if (status === 'deja_manquant') {
      toast.info(lang === 'fr' 
        ? 'Cet objet était déjà manquant à l\'arrivée'
        : 'This item was already missing on arrival');
      return;
    }

    if (status === 'signale_depart') {
      // Retirer du signalement
      setObjetsSignales(prev => prev.filter(s => s.objet !== objetId));
      setObjetsOK(prev => [...prev, objetId]);
    } else if (status === 'ok') {
      // Ouvrir dialogue pour signaler
      setCurrentSignal({ objet: objetId, type: 'casse', photo: '', commentaire: '' });
      setShowSignalDialog(true);
    }
  };

  const handleAddSignal = () => {
    if (!currentSignal.commentaire) {
      toast.error(lang === 'fr' ? 'Commentaire obligatoire' : 'Comment required');
      return;
    }

    setObjetsSignales(prev => [...prev, { ...currentSignal, date: new Date().toISOString() }]);
    setObjetsOK(prev => prev.filter(id => id !== currentSignal.objet));
    setShowSignalDialog(false);
    setCurrentSignal({ objet: '', type: 'casse', photo: '', commentaire: '' });
    toast.success(lang === 'fr' ? 'Objet signalé' : 'Item reported');
  };

  const handleUploadSignalPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadCompressedImage(file, (compressedFile) => 
        base44.integrations.Core.UploadFile({ file: compressedFile })
      );
      setCurrentSignal(prev => ({ ...prev, photo: result.file_url }));
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoLieu = async (lieuId, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadCompressedImage(file, (compressedFile) => 
        base44.integrations.Core.UploadFile({ file: compressedFile })
      );
      setPhotosLieux(prev => ({ ...prev, [lieuId]: result.file_url }));
      toast.success(lang === 'fr' ? 'Photo ajoutée' : 'Photo added');
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur upload' : 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = () => {
    sessionStorage.setItem('depart_objets_ok', JSON.stringify(objetsOK));
    sessionStorage.setItem('depart_objets_signales', JSON.stringify(objetsSignales));
    sessionStorage.setItem('depart_photos', JSON.stringify(photosLieux));
    sessionStorage.setItem('depart_urgent_global', JSON.stringify(isUrgentGlobal));
    navigate(createPageUrl('ClientDepartProprete'));
  };

  const lieuxPhoto = typeLogement === 'mobilhome' ? [
    { id: 'cuisine', label_fr: 'Cuisine', label_en: 'Kitchen' },
    { id: 'salle_bain', label_fr: 'Salle de bain', label_en: 'Bathroom' },
    { id: 'wc', label_fr: 'WC', label_en: 'Toilet' },
    { id: 'chambre_principale', label_fr: 'Chambre principale', label_en: 'Master bedroom' },
    { id: 'sejour', label_fr: 'Séjour', label_en: 'Living room' },
    { id: 'terrasse', label_fr: 'Terrasse', label_en: 'Terrace' },
  ] : [
    { id: 'terrain_general', label_fr: 'Vue générale', label_en: 'General view' },
  ];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientDepartLogement'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-6">
            ✔️ {lang === 'fr' ? 'Inventaire comparatif' : 'Comparative inventory'}
          </h1>

          {/* Légende */}
          <Card className="border-2 border-blue-300 rounded-xl mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400 rounded" />
                  <span>{lang === 'fr' ? 'OK' : 'OK'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-400 rounded" />
                  <span>{lang === 'fr' ? 'Cassé/Manquant' : 'Broken/Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-400 rounded" />
                  <span>{lang === 'fr' ? 'Déjà manquant' : 'Already missing'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventaire */}
          <Card className="border-2 border-[#22c55e]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                {lang === 'fr' ? 'Touchez les objets pour signaler un problème' : 'Tap items to report an issue'}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {inventaireItems.map(item => {
                  const status = getObjetStatus(item.id);
                  const borderColor = status === 'ok' ? 'border-green-500 bg-green-50' 
                    : status === 'signale_depart' ? 'border-red-500 bg-red-50'
                    : status === 'deja_manquant' ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-300';

                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleObjet(item.id)}
                      disabled={status === 'deja_manquant'}
                      className={`p-4 rounded-lg border-2 transition-all ${borderColor} ${
                        status === 'deja_manquant' ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="text-sm font-heading text-[#0077A8]">
                        {item.label}
                        {item.quantity && <> <strong>×{item.quantity}</strong></>}
                      </div>
                      {status === 'ok' && <Check className="w-5 h-5 text-green-600 mx-auto mt-2" />}
                      {status === 'signale_depart' && <XCircle className="w-5 h-5 text-red-600 mx-auto mt-2" />}
                      {status === 'deja_manquant' && <AlertCircle className="w-5 h-5 text-orange-600 mx-auto mt-2" />}
                    </button>
                  );
                })}
              </div>

              {objetsSignales.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="font-heading text-sm text-red-800 mb-2">
                    {lang === 'fr' ? 'Objets signalés :' : 'Reported items:'}
                  </p>
                  {objetsSignales.map((obj, idx) => (
                    <div key={idx} className="text-sm text-gray-700">
                      • {obj.objet} ({obj.type})
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos facultatives */}
          <Card className="border-2 border-blue-300 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-2">
                📸 {lang === 'fr' ? 'Photos de l\'état au départ' : 'Departure condition photos'}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {lang === 'fr' ? 'Facultatif, mais recommandé' : 'Optional, but recommended'}
              </p>

              <div className="space-y-3">
                {lieuxPhoto.map(lieu => (
                  <div key={lieu.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-heading text-gray-700">
                      {lang === 'fr' ? lieu.label_fr : lieu.label_en}
                    </span>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoLieu(lieu.id, e.target.files[0])}
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant={photosLieux[lieu.id] ? 'outline' : 'default'}
                        size="sm"
                        className={photosLieux[lieu.id] ? 'border-green-500 text-green-600' : ''}
                        asChild
                      >
                        <span>
                          {photosLieux[lieu.id] ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              OK
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-1" />
                              Photo
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Urgence globale */}
          {objetsSignales.length > 0 && (
            <Card className="border-2 border-red-400 rounded-xl mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="urgence-globale-depart"
                    checked={isUrgentGlobal}
                    onChange={(e) => setIsUrgentGlobal(e.target.checked)}
                    className="w-6 h-6 mt-1 cursor-pointer"
                  />
                  <div className="flex-1">
                    <label htmlFor="urgence-globale-depart" className="font-heading text-lg text-[#0077A8] cursor-pointer block mb-2">
                      🚨 {lang === 'fr' ? 'Activer l\'intervention en URGENCE' : 'Activate URGENT intervention'}
                    </label>
                    <p className="text-sm text-gray-600">
                      {lang === 'fr' 
                        ? 'Par défaut, votre demande est traitée normalement. Activez l\'urgence seulement en cas de besoin immédiat.'
                        : 'By default, your request is processed normally. Activate urgency only for immediate needs.'}
                    </p>
                    {isUrgentGlobal && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-300">
                        <p className="text-sm font-semibold text-red-800">
                          ⚡ {lang === 'fr' ? 'Votre demande sera traitée en priorité' : 'Your request will be processed with priority'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleContinue}
            className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading"
          >
            {lang === 'fr' ? 'Continuer' : 'Continue'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>

        {/* Dialog signalement */}
        <Dialog open={showSignalDialog} onOpenChange={setShowSignalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl text-[#0077A8]">
                {lang === 'fr' ? 'Signaler un problème' : 'Report an issue'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Objet' : 'Item'}
                </label>
                <p className="font-bold">{currentSignal.objet}</p>
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Type de problème' : 'Issue type'}
                </label>
                <Select value={currentSignal.type} onValueChange={(val) => setCurrentSignal(prev => ({ ...prev, type: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casse">{lang === 'fr' ? 'Cassé' : 'Broken'}</SelectItem>
                    <SelectItem value="manquant">{lang === 'fr' ? 'Manquant' : 'Missing'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Photo (recommandée)' : 'Photo (recommended)'}
                </label>
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleUploadSignalPhoto(e.target.files[0])}
                    disabled={uploading}
                  />
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      {currentSignal.photo ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {lang === 'fr' ? 'Photo ajoutée' : 'Photo added'}
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          {lang === 'fr' ? 'Ajouter photo' : 'Add photo'}
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>

              <div>
                <label className="text-sm font-heading text-[#0077A8] mb-2 block">
                  {lang === 'fr' ? 'Commentaire *' : 'Comment *'}
                </label>
                <Textarea
                  value={currentSignal.commentaire}
                  onChange={(e) => setCurrentSignal(prev => ({ ...prev, commentaire: e.target.value }))}
                  placeholder={lang === 'fr' ? 'Décrivez le problème...' : 'Describe the issue...'}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSignalDialog(false)}
                  className="flex-1"
                >
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleAddSignal}
                  className="flex-1 bg-[#FFA500] hover:bg-[#FF8C00]"
                >
                  {lang === 'fr' ? 'Enregistrer' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}