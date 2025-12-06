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

export default function ReceptionArrivees({ embedded = false }) {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [dossierSelectionne, setDossierSelectionne] = useState(null);

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers-arrivee-reception'],
    queryFn: () => base44.entities.DossierArrivee.list(),
    refetchInterval: 10000
  });

  // Période glissante : Décembre année en cours → Novembre année suivante
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // Si on est avant décembre, afficher décembre année précédente → novembre année en cours
  // Si on est en décembre ou après, afficher décembre année en cours → novembre année suivante
  const startYear = currentMonth < 11 ? currentYear - 1 : currentYear;
  const endYear = startYear + 1;

  const renderSemaines = (moisStr, annee) => {
    const mois = parseInt(moisStr);
    const semaines = genererSemaines(annee, mois);

    return (
      <ReceptionSemaineAccordeon semaines={semaines} lang={lang}>
        {(semaine) => {
          const dossiersSemaine = filtrerDossiersParSemaine(dossiers, semaine);
          console.log('🔍 Semaine', semaine.label, '→', dossiersSemaine.length, 'dossiers');
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

  const content = (
    <>
      {!embedded && (
        <>
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
        </>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AEEF]"></div>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <p className="text-sm text-blue-800 font-heading">
              📊 Total dossiers : <strong>{dossiers.length}</strong>
              {dossiers.length > 0 && (
                <span className="ml-2">
                  • {dossiers.filter(d => d.inventaire_id).length} avec inventaire
                </span>
              )}
            </p>
          </div>
          <ReceptionMoisOnglets lang={lang} startYear={startYear} endYear={endYear}>
            {renderSemaines}
          </ReceptionMoisOnglets>
        </>
      )}
    </>
  );

  if (embedded) {
    return <div>{content}</div>;
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {content}
        </motion.div>
      </div>
    </div>
  );
}