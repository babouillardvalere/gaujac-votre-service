import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import HebergementSelector from '../components/HebergementSelector';
import { getCodeFromCategory } from '../components/categoryCodeMapping';
import InventaireDisplay from '../components/InventaireDisplay';
import Logo from '../components/Logo';
import ArriveeProgressBar from '../components/ArriveeProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function ClientArriveeHebergement() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  
  const [selection, setSelection] = useState(null);
  const [codeCategorie, setCodeCategorie] = useState('');

  useEffect(() => {
    // Vérifier que l'identité est en session
    const nom = sessionStorage.getItem('arrivee_nom');
    if (!nom) {
      navigate(createPageUrl('ClientArriveeIdentite'));
    }
  }, [navigate]);

  useEffect(() => {
    if (selection?.categorie && selection?.type === 'Mobil-home') {
      const code = getCodeFromCategory(selection.categorie);
      setCodeCategorie(code);
    }
  }, [selection]);

  const handleContinueToInventaire = async () => {
    if (!selection) {
      toast.error(t('champs_obligatoires'));
      return;
    }

    const typeLogement = selection.type === 'Emplacement' ? 'emplacement' : 'mobilhome';

    // Sauvegarder les données en session
    sessionStorage.setItem('arrivee_type_logement', typeLogement);
    sessionStorage.setItem('arrivee_categorie', selection.categorie);
    sessionStorage.setItem('arrivee_numero', selection.numero);

    // Mettre à jour le dossier
    const dossierId = sessionStorage.getItem('arrivee_dossier_id');
    if (dossierId) {
      try {
        await base44.entities.DossierArrivee.update(dossierId, {
          type_logement: typeLogement,
          categorie_logement: selection.categorie,
          numero_logement: selection.numero,
          etape_2_terminee: true,
          etape_actuelle: 3
        });
      } catch (error) {
        console.error('Error updating dossier:', error);
      }
    }

    // Rediriger vers contrôle inventaire
    navigate(createPageUrl('ClientControleInventaire'));
  };



  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('ClientArriveeIdentite'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#22c55e] text-center mb-2">
            🏡 {lang === 'fr' 
              ? `Arrivée - ${sessionStorage.getItem('arrivee_prenom') || ''} ${sessionStorage.getItem('arrivee_nom') || ''}`
              : `Arrival - ${sessionStorage.getItem('arrivee_prenom') || ''} ${sessionStorage.getItem('arrivee_nom') || ''}`}
          </h1>

          {/* Barre de progression */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-4">
              <ArriveeProgressBar etapeActuelle={2} lang={lang} />
            </CardContent>
          </Card>

          <HebergementSelector 
            onSelect={setSelection}
            lang={lang}
          />

          {selection && selection.type === 'Mobil-home' && codeCategorie && (
            <Card className="border-2 border-gray-300 rounded-xl mt-6">
              <CardContent className="p-4">
                <InventaireDisplay codeCategorie={codeCategorie} lang={lang} />
              </CardContent>
            </Card>
          )}

          {selection && (
            <Button
              onClick={handleContinueToInventaire}
              className="w-full h-12 mt-6 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-xl font-heading"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {lang === 'fr' ? 'Continuer vers inventaire' : 'Continue to inventory'}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}