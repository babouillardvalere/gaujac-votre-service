import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import ReceptionMoisOnglets from '../components/reception/ReceptionMoisOnglets';
import ReceptionSemaineAccordeon from '../components/reception/ReceptionSemaineAccordeon';
import ReceptionFicheDepart from '../components/reception/ReceptionFicheDepart';
import { genererSemaines, filtrerDossiersParSemaine } from '../components/reception/genererSemaines';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users, Dog, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ReceptionDeparts({ embedded = false }) {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [dossierSelectionne, setDossierSelectionne] = useState(null);

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers-depart-reception'],
    queryFn: () => base44.entities.DepartCheck.list()
  });

  // Période glissante : Décembre année en cours → Novembre année suivante
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const startYear = currentMonth < 11 ? currentYear - 1 : currentYear;
  const endYear = startYear + 1;

  const renderSemaines = (moisStr, annee) => {
    const mois = parseInt(moisStr);
    const semaines = genererSemaines(annee, mois);

    return (
      <ReceptionSemaineAccordeon semaines={semaines} lang={lang}>
        {(semaine) => {
          const dossiersSemaine = filtrerDossiersParSemaine(dossiers, semaine);
          
          if (dossiersSemaine.length === 0) {
            return (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">
                    {lang === 'fr' ? 'Aucun départ cette semaine' : 'No departures this week'}
                  </p>
                </CardContent>
              </Card>
            );
          }

          return (
            <div className="space-y-2">
              {dossiersSemaine.map(dossier => {
                const hasDegats = 
                  dossier.evaluation_proprete === 'pas_satisfaisant' ||
                  dossier.objets_modifies?.length > 0 ||
                  dossier.commentaire_proprete;

                return (
                  <button
                    key={dossier.id}
                    onClick={() => setDossierSelectionne(dossier)}
                    className="w-full focus:ring-4 focus:ring-[#FFD700] rounded-lg"
                  >
                    <Card className={`border-2 ${hasDegats ? 'border-orange-400 bg-orange-50' : 'border-gray-200'} hover:border-[#FFA500] hover:shadow-md transition-all`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-[#FFA500]">
                              {dossier.numero_logement}
                            </div>
                            <div className="text-left">
                              <p className="font-heading text-gray-900">
                                {dossier.client_nom} {dossier.client_prenom}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {dossier.date_depart}
                                </span>
                                <span>
                                  {dossier.categorie_logement}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {hasDegats && (
                              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                <AlertTriangle className="w-3 h-3" />
                                {lang === 'fr' ? 'Dégâts' : 'Damages'}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>
          );
        }}
      </ReceptionSemaineAccordeon>
    );
  };

  if (dossierSelectionne) {
    return (
      <ReceptionFicheDepart 
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
          
          <h1 className="font-handwritten text-4xl text-[#FFA500] text-center mb-2">
            🚗 {lang === 'fr' ? 'Départs' : 'Departures'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-8">
            {lang === 'fr' ? 'Gestion des dossiers de départ' : 'Departure files management'}
          </p>
        </>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFA500]"></div>
        </div>
      ) : (
        <ReceptionMoisOnglets lang={lang} startYear={startYear} endYear={endYear}>
          {renderSemaines}
        </ReceptionMoisOnglets>
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