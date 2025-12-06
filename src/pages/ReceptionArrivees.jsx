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
import { ArrowLeft, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ReceptionArrivees({ embedded = false }) {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [dossierSelectionne, setDossierSelectionne] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers-arrivee-reception'],
    queryFn: () => base44.entities.DossierArrivee.list(),
    refetchInterval: 10000
  });

  // Filtrer les dossiers selon la recherche
  const dossiersFiltered = searchQuery.trim() 
    ? dossiers.filter(d => {
        const query = searchQuery.toLowerCase();
        const nomComplet = `${d.client_nom} ${d.client_prenom}`.toLowerCase();
        const dateArrivee = d.date_arrivee || '';
        const dateDepart = d.date_depart || '';
        const logement = (d.numero_logement || '').toLowerCase();
        
        return nomComplet.includes(query) || 
               logement.includes(query) ||
               dateArrivee.includes(query) ||
               dateDepart.includes(query);
      })
    : dossiers;

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
          const dossiersSemaine = filtrerDossiersParSemaine(dossiers, semaine, 'date_arrivee', 'date_depart');
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
          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={lang === 'fr' 
                  ? 'Rechercher par nom, hébergement ou date...' 
                  : 'Search by name, accommodation or date...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-[#00AEEF] rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-2">
                {dossiersFiltered.length} {lang === 'fr' ? 'résultat(s) trouvé(s)' : 'result(s) found'}
              </p>
            )}
          </div>

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

          {/* Si recherche active, afficher résultats directement */}
          {searchQuery ? (
            <div className="space-y-4">
              {dossiersFiltered.length > 0 ? (
                <ReceptionListeLogements 
                  dossiers={dossiersFiltered}
                  onSelectDossier={setDossierSelectionne}
                  lang={lang}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {lang === 'fr' ? 'Aucun dossier trouvé' : 'No file found'}
                </div>
              )}
            </div>
          ) : (
            <ReceptionMoisOnglets lang={lang} startYear={startYear} endYear={endYear}>
              {renderSemaines}
            </ReceptionMoisOnglets>
          )}
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