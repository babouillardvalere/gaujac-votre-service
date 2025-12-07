import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Search, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientDepartIdentification() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    date_arrivee: '',
    date_depart: ''
  });

  const [searching, setSearching] = useState(false);
  const [dossiersFound, setDossiersFound] = useState([]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = async () => {
    if (!formData.nom || !formData.prenom || !formData.date_arrivee || !formData.date_depart) {
      toast.error(lang === 'fr' ? 'Tous les champs sont obligatoires' : 'All fields are required');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const depart = new Date(formData.date_depart);

    if (depart < today) {
      toast.error(lang === 'fr' 
        ? 'La date de départ doit être aujourd\'hui ou après'
        : 'Departure date must be today or after');
      return;
    }

    setSearching(true);

    try {
      const dossiers = await base44.entities.DossierArrivee.filter({
        client_nom: formData.nom,
        client_prenom: formData.prenom,
        date_arrivee: formData.date_arrivee,
        date_depart: formData.date_depart,
        statut: 'termine'
      });

      if (dossiers.length === 0) {
        toast.error(lang === 'fr' 
          ? 'Aucun dossier d\'arrivée trouvé. Vérifiez vos informations.'
          : 'No arrival file found. Please check your information.');
        setSearching(false);
        return;
      }

      if (dossiers.length === 1) {
        selectDossier(dossiers[0]);
      } else {
        setDossiersFound(dossiers);
      }
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur de recherche' : 'Search error');
    } finally {
      setSearching(false);
    }
  };

  const selectDossier = (dossier) => {
    // Stocker toutes les infos en session
    sessionStorage.setItem('depart_nom', dossier.client_nom);
    sessionStorage.setItem('depart_prenom', dossier.client_prenom);
    sessionStorage.setItem('depart_date_arrivee', dossier.date_arrivee);
    sessionStorage.setItem('depart_date_depart', dossier.date_depart);
    sessionStorage.setItem('depart_id_arrivee', dossier.id);
    sessionStorage.setItem('depart_type_logement', dossier.type_logement);
    sessionStorage.setItem('depart_categorie', dossier.categorie_logement);
    sessionStorage.setItem('depart_numero', dossier.numero_logement);
    sessionStorage.setItem('depart_objets_valides', JSON.stringify(dossier.inventaire_json?.objets_valides || []));
    sessionStorage.setItem('depart_objets_non_coches', JSON.stringify(dossier.inventaire_json?.objets_non_coches || []));
    sessionStorage.setItem('depart_objets_signales_arrivee', JSON.stringify(dossier.inventaire_json?.objets_manquants || []));

    toast.success(lang === 'fr' ? 'Dossier trouvé !' : 'File found!');
    navigate(createPageUrl('ClientDepartLogement'));
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientMenu'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-2">
            🚪 {lang === 'fr' ? 'Départ' : 'Departure'}
          </h1>

          <Card className="border-2 border-[#FFA500]/30 rounded-xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                <Search className="w-6 h-6" />
                {lang === 'fr' ? 'Identification du séjour' : 'Stay identification'}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom" className="font-heading text-[#0077A8]">
                    {t('nom')} *
                  </Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#FFA500] rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="prenom" className="font-heading text-[#0077A8]">
                    {t('prenom')} *
                  </Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleChange('prenom', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#FFA500] rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="date_arrivee" className="font-heading text-[#0077A8]">
                    {t('date_arrivee')} *
                  </Label>
                  <Input
                    id="date_arrivee"
                    type="date"
                    value={formData.date_arrivee}
                    onChange={(e) => handleChange('date_arrivee', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#FFA500] rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="date_depart" className="font-heading text-[#0077A8]">
                    {t('date_depart')} *
                  </Label>
                  <Input
                    id="date_depart"
                    type="date"
                    value={formData.date_depart}
                    onChange={(e) => handleChange('date_depart', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#FFA500] rounded-xl"
                  />
                </div>
              </div>

              <Button
                onClick={handleSearch}
                disabled={searching}
                className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading"
              >
                {searching ? (
                  <>{lang === 'fr' ? 'Recherche...' : 'Searching...'}</>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    {lang === 'fr' ? 'Rechercher mon dossier' : 'Find my file'}
                  </>
                )}
              </Button>

              {dossiersFound.length > 1 && (
                <Card className="border-2 border-blue-300 mt-4">
                  <CardContent className="p-4">
                    <p className="font-heading text-sm text-gray-700 mb-3">
                      {lang === 'fr' ? 'Plusieurs dossiers trouvés. Choisissez le vôtre :' : 'Multiple files found. Choose yours:'}
                    </p>
                    <div className="space-y-2">
                      {dossiersFound.map((dossier) => (
                        <button
                          key={dossier.id}
                          onClick={() => selectDossier(dossier)}
                          className="w-full p-3 bg-green-50 border-2 border-green-300 rounded-xl hover:bg-green-100 transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-heading text-sm text-gray-800">
                                {dossier.categorie_logement} - {dossier.numero_logement}
                              </p>
                              <p className="text-xs text-gray-600">
                                {dossier.date_arrivee} → {dossier.date_depart}
                              </p>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}