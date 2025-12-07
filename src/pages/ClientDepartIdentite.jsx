import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientDepartIdentite() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    numero_logement: ''
  });

  const [dossierTrouve, setDossierTrouve] = useState(null);
  const [recherche, setRecherche] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setDossierTrouve(null);
  };

  const rechercherDossier = async () => {
    if (!formData.nom || !formData.prenom || !formData.numero_logement) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    setRecherche(true);

    try {
      const fiches = await base44.entities.FicheArrivee.list();
      const fiche = fiches.find(f => 
        f.client_nom?.toLowerCase() === formData.nom.toLowerCase() &&
        f.client_prenom?.toLowerCase() === formData.prenom.toLowerCase() &&
        f.numero_logement === formData.numero_logement
      );

      if (fiche) {
        setDossierTrouve(fiche);
        sessionStorage.setItem('depart_fiche_arrivee_id', fiche.id);
        toast.success(lang === 'fr' ? '✅ Dossier trouvé !' : '✅ File found!');
      } else {
        toast.error(lang === 'fr' 
          ? '❌ Aucun dossier d\'arrivée trouvé. Vérifiez vos informations ou contactez la réception.'
          : '❌ No arrival file found. Check your information or contact reception.'
        );
        setDossierTrouve(null);
      }
    } catch (error) {
      toast.error(lang === 'fr' ? 'Erreur de recherche' : 'Search error');
    } finally {
      setRecherche(false);
    }
  };

  const handleContinuer = () => {
    if (!dossierTrouve) return;

    sessionStorage.setItem('depart_nom', formData.nom);
    sessionStorage.setItem('depart_prenom', formData.prenom);
    sessionStorage.setItem('depart_numero', formData.numero_logement);
    sessionStorage.setItem('depart_type_logement', dossierTrouve.type_logement);
    sessionStorage.setItem('depart_categorie', dossierTrouve.categorie_logement);

    navigate(createPageUrl('ClientDepartInventaire'));
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('ClientMenu'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#FFA500] text-center mb-2">
            🚗 {lang === 'fr' ? 'Départ' : 'Departure'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-6">
            {lang === 'fr' ? 'Étape 1/4 : Identification' : 'Step 1/4: Identification'}
          </p>

          <Card className="border-2 border-[#FFA500]/30 rounded-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-[#0077A8] font-body">
                    {lang === 'fr' 
                      ? '💡 Nous allons retrouver automatiquement votre dossier d\'arrivée pour simplifier votre départ.'
                      : '💡 We will automatically retrieve your arrival file to simplify your departure.'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="nom" className="font-heading text-[#0077A8]">
                    {t('nom')} *
                  </Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    className="mt-1 border-2 border-gray-200 focus:border-[#FFA500] rounded-xl"
                    placeholder={lang === 'fr' ? 'Votre nom' : 'Your last name'}
                    disabled={!!dossierTrouve}
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
                    placeholder={lang === 'fr' ? 'Votre prénom' : 'Your first name'}
                    disabled={!!dossierTrouve}
                  />
                </div>

                <div>
                  <Label htmlFor="numero_logement" className="font-heading text-[#0077A8]">
                    {lang === 'fr' ? 'Numéro de locatif' : 'Accommodation number'} *
                  </Label>
                  <Input
                    id="numero_logement"
                    value={formData.numero_logement}
                    onChange={(e) => handleChange('numero_logement', e.target.value.toUpperCase())}
                    className="mt-1 border-2 border-gray-200 focus:border-[#FFA500] rounded-xl"
                    placeholder="Ex: R01, D14, E23"
                    disabled={!!dossierTrouve}
                  />
                </div>

                {dossierTrouve && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border-2 border-green-300 p-4 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="font-heading text-green-800">
                        {lang === 'fr' ? 'Dossier trouvé !' : 'File found!'}
                      </p>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>{lang === 'fr' ? 'Hébergement' : 'Accommodation'}:</strong> {dossierTrouve.numero_logement} - {dossierTrouve.categorie_logement}</p>
                      <p><strong>{lang === 'fr' ? 'Dates' : 'Dates'}:</strong> {dossierTrouve.date_arrivee} → {dossierTrouve.date_depart}</p>
                    </div>
                  </motion.div>
                )}

                {!dossierTrouve ? (
                  <Button
                    onClick={rechercherDossier}
                    disabled={recherche}
                    className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading"
                  >
                    {recherche ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {lang === 'fr' ? 'Recherche...' : 'Searching...'}
                      </>
                    ) : (
                      lang === 'fr' ? 'Rechercher mon dossier' : 'Find my file'
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleContinuer}
                    className="w-full h-12 bg-[#FFA500] hover:bg-[#FF8C00] text-white rounded-xl font-heading"
                  >
                    {t('suivant')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}