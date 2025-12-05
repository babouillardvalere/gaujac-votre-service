import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import ReceptionMoisOnglets from '../components/reception/ReceptionMoisOnglets';
import ReceptionSemaineAccordeon from '../components/reception/ReceptionSemaineAccordeon';
import ReceptionListeLogements from '../components/reception/ReceptionListeLogements';
import ReceptionFicheArrivee from '../components/reception/ReceptionFicheArrivee';
import { genererSemaines, filtrerDossiersParSemaine } from '../components/reception/genererSemaines';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ReceptionArrivees() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [dossierSelectionne, setDossierSelectionne] = useState(null);

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers-arrivee-reception'],
    queryFn: () => base44.entities.DossierArrivee.list()
  });

  const anneeEnCours = new Date().getFullYear();

  const renderSemaines = (moisStr) => {
    const mois = parseInt(moisStr);
    const semaines = genererSemaines(anneeEnCours, mois);

    return (
      <ReceptionSemaineAccordeon semaines={semaines} lang={lang}>
        {(semaine) => {
          const dossiersSemaine = filtrerDossiersParSemaine(dossiers, semaine);
          return (
            <ReceptionListeLogements 
              dossiers={dossiersSemaine}
              onSelectDossier={setDossierSelectionne}
              lang={lang}
            />
          );
        }}
      </ReceptionSemaineAccordeon>
    );
  };

  if (dossierSelectionne) {
    return (
      <ReceptionFicheArrivee 
        dossier={dossierSelectionne}
        onClose={() => setDossierSelectionne(null)}
        lang={lang}
      />
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('Reception'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{t('retour')}</span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-4xl text-[#22c55e] text-center mb-2">
            🏡 {lang === 'fr' ? 'Arrivées' : 'Arrivals'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-8">
            {lang === 'fr' ? 'Gestion des dossiers d\'arrivée' : 'Arrival files management'}
          </p>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AEEF]"></div>
            </div>
          ) : (
            <ReceptionMoisOnglets lang={lang}>
              {renderSemaines}
            </ReceptionMoisOnglets>
          )}
        </motion.div>
      </div>
    </div>
  );
}