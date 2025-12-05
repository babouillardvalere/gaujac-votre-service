import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import ReceptionMoisOnglets from '../components/reception/ReceptionMoisOnglets';
import ReceptionSemaineAccordeon from '../components/reception/ReceptionSemaineAccordeon';
import { genererSemaines, filtrerDossiersParSemaine } from '../components/reception/genererSemaines';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ReceptionDeparts() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers-depart-reception'],
    queryFn: () => base44.entities.DepartCheck.list()
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
            <Card className="border-2 border-gray-200">
              <CardContent className="p-6">
                <p className="text-gray-600">
                  {dossiersSemaine.length} {lang === 'fr' ? 'départ(s)' : 'departure(s)'}
                </p>
                {/* TODO: Afficher liste des départs */}
              </CardContent>
            </Card>
          );
        }}
      </ReceptionSemaineAccordeon>
    );
  };

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
          
          <h1 className="font-handwritten text-4xl text-[#FFA500] text-center mb-2">
            🚗 {lang === 'fr' ? 'Départs' : 'Departures'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-8">
            {lang === 'fr' ? 'Gestion des dossiers de départ' : 'Departure files management'}
          </p>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFA500]"></div>
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