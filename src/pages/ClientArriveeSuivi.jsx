import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import ArriveeProgressBar from '../components/ArriveeProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Check, Clock, AlertCircle, X, Wrench, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';

export default function ClientArriveeSuivi() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dossierId = searchParams.get('id');

  const { data: dossier, isLoading } = useQuery({
    queryKey: ['dossier-arrivee', dossierId],
    queryFn: async () => {
      if (!dossierId) return null;
      const dossiers = await base44.entities.DossierArrivee.list();
      return dossiers.find(d => d.id === dossierId);
    },
    enabled: !!dossierId
  });

  const { data: interventions } = useQuery({
    queryKey: ['interventions-arrivee', dossier?.numero_logement],
    queryFn: async () => {
      if (!dossier?.numero_logement) return [];
      const incidents = await base44.entities.Incident.list();
      return incidents.filter(inc => 
        inc.logement === dossier.numero_logement &&
        inc.client_nom === dossier.client_nom &&
        inc.date_arrivee === dossier.date_arrivee
      );
    },
    enabled: !!dossier
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-lg mx-auto text-center">
          <Logo className="h-16 mb-4" />
          <p className="text-gray-600">
            {lang === 'fr' ? 'Dossier introuvable' : 'File not found'}
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            className="mt-4"
          >
            {t('retour_accueil')}
          </Button>
        </div>
      </div>
    );
  }

  const etapesDetails = [
    {
      numero: 1,
      titre_fr: 'Informations séjour',
      titre_en: 'Stay information',
      details_fr: 'Nom, dates de séjour',
      details_en: 'Name, stay dates'
    },
    {
      numero: 2,
      titre_fr: 'Choix locatif',
      titre_en: 'Accommodation choice',
      details_fr: `${dossier.categorie_logement} - ${dossier.numero_logement}`,
      details_en: `${dossier.categorie_logement} - ${dossier.numero_logement}`
    },
    {
      numero: 3,
      titre_fr: 'Contrôle inventaire',
      titre_en: 'Inventory check',
      details_fr: dossier.etape_3_terminee ? 'Inventaire complété' : 'En cours',
      details_en: dossier.etape_3_terminee ? 'Inventory completed' : 'In progress'
    },
    {
      numero: 4,
      titre_fr: 'Envoi réception',
      titre_en: 'Send to reception',
      details_fr: dossier.etape_4_terminee ? 'Arrivée validée' : 'En attente',
      details_en: dossier.etape_4_terminee ? 'Arrival validated' : 'Pending'
    }
  ];

  const interventionsMenage = interventions?.filter(i => i.type === 'menage') || [];
  const interventionsTechnique = interventions?.filter(i => i.type === 'technique') || [];

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
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
          
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-2">
            🔍 {lang === 'fr' ? 'Suivi de mon arrivée' : 'Track my arrival'}
          </h1>
          <p className="text-center text-gray-600 font-body mb-6">
            {lang === 'fr' ? 'Dossier' : 'File'} : {dossier.code_dossier}
          </p>

          {/* Barre de progression */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <ArriveeProgressBar 
                etapeActuelle={dossier.etape_actuelle}
                etapes={dossier}
                lang={lang}
              />
            </CardContent>
          </Card>

          {/* Informations client */}
          <Card className="border-2 border-gray-300 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                👤 {lang === 'fr' ? 'Vos informations' : 'Your information'}
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>{lang === 'fr' ? 'Client' : 'Guest'}:</strong> {dossier.client_nom} {dossier.client_prenom}</p>
                <p><strong>{lang === 'fr' ? 'Dates' : 'Dates'}:</strong> {dossier.date_arrivee} → {dossier.date_depart}</p>
                {dossier.numero_logement && (
                  <>
                    <p><strong>{lang === 'fr' ? 'Locatif' : 'Accommodation'}:</strong> {dossier.numero_logement}</p>
                    <p><strong>{lang === 'fr' ? 'Catégorie' : 'Category'}:</strong> {dossier.categorie_logement}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* État des étapes */}
          <Card className="border-2 border-[#22c55e]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <h2 className="font-heading text-xl text-[#0077A8] mb-4">
                📊 {lang === 'fr' ? 'État de votre arrivée' : 'Arrival status'}
              </h2>
              <div className="space-y-3">
                {etapesDetails.map(etape => {
                  const terminee = dossier[`etape_${etape.numero}_terminee`];
                  const enCours = dossier.etape_actuelle === etape.numero;

                  return (
                    <div 
                      key={etape.numero}
                      className={`p-4 rounded-lg border-2 ${
                        terminee ? 'bg-green-50 border-green-300' :
                        enCours ? 'bg-blue-50 border-blue-300' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {terminee ? (
                            <Check className="w-6 h-6 text-green-600" />
                          ) : enCours ? (
                            <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
                          ) : (
                            <X className="w-6 h-6 text-gray-400" />
                          )}
                          <div>
                            <p className="font-heading text-[#0077A8]">
                              {etape.numero}. {lang === 'fr' ? etape.titre_fr : etape.titre_en}
                            </p>
                            <p className="text-xs text-gray-600">
                              {lang === 'fr' ? etape.details_fr : etape.details_en}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold ${
                          terminee ? 'text-green-600' :
                          enCours ? 'text-blue-600' :
                          'text-gray-400'
                        }`}>
                          {terminee ? '✔️ ' + (lang === 'fr' ? 'Terminé' : 'Done') :
                           enCours ? '⏳ ' + (lang === 'fr' ? 'En cours' : 'In progress') :
                           '❌ ' + (lang === 'fr' ? 'Non fait' : 'Not done')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Interventions générées */}
          {(interventionsMenage.length > 0 || interventionsTechnique.length > 0) && (
            <Card className="border-2 border-orange-300 rounded-xl mb-6">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl text-[#0077A8] mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  {lang === 'fr' ? 'Interventions créées automatiquement' : 'Interventions created automatically'}
                </h2>

                {interventionsMenage.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-yellow-600" />
                      <h3 className="font-heading text-yellow-800">
                        🧹 {lang === 'fr' ? 'Intervention Ménage' : 'Housekeeping intervention'}
                      </h3>
                    </div>
                    <div className="space-y-2 pl-7">
                      {interventionsMenage.map(interv => (
                        <div key={interv.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm font-heading text-gray-800">{interv.sous_categorie || interv.categorie}</p>
                          <p className="text-xs text-gray-600 mt-1">{interv.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs font-bold ${interv.urgent ? 'text-red-600' : 'text-yellow-600'}`}>
                              {interv.urgent ? '🔴 URGENT' : '🟡 NORMAL'}
                            </span>
                            <span className="text-xs text-green-600">• {lang === 'fr' ? 'Équipe informée' : 'Team notified'} ✔️</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {interventionsTechnique.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench className="w-5 h-5 text-blue-600" />
                      <h3 className="font-heading text-blue-800">
                        🔧 {lang === 'fr' ? 'Intervention Technique' : 'Technical intervention'}
                      </h3>
                    </div>
                    <div className="space-y-2 pl-7">
                      {interventionsTechnique.map(interv => (
                        <div key={interv.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-heading text-gray-800">{interv.sous_categorie || interv.categorie}</p>
                          <p className="text-xs text-gray-600 mt-1">{interv.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs font-bold ${interv.urgent ? 'text-red-600' : 'text-blue-600'}`}>
                              {interv.urgent ? '🔴 URGENT' : '🟡 NORMAL'}
                            </span>
                            <span className="text-xs text-green-600">• {lang === 'fr' ? 'Équipe informée' : 'Team notified'} ✔️</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Boutons d'action */}
          {dossier.statut === 'en_cours' && !dossier.etape_4_terminee && (
            <Button
              onClick={() => {
                // Rediriger vers l'étape en cours
                if (dossier.etape_actuelle === 1) {
                  navigate(createPageUrl('ClientArriveeIdentite'));
                } else if (dossier.etape_actuelle === 2) {
                  navigate(createPageUrl('ClientArriveeHebergement'));
                } else if (dossier.etape_actuelle === 3) {
                  navigate(createPageUrl('ClientControleInventaire'));
                }
              }}
              className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading"
            >
              {lang === 'fr' ? 'Reprendre mon arrivée' : 'Resume my arrival'}
            </Button>
          )}

          {dossier.etape_4_terminee && (
            <Card className="border-2 border-green-500 bg-green-50 rounded-xl">
              <CardContent className="p-6 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="font-handwritten text-2xl text-green-800 mb-2">
                  {lang === 'fr' ? 'Arrivée validée !' : 'Arrival validated!'}
                </h2>
                <p className="text-gray-700">
                  {lang === 'fr' 
                    ? 'Bienvenue au Camping Paradis Domaine de Gaujac !'
                    : 'Welcome to Camping Paradis Domaine de Gaujac!'}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}