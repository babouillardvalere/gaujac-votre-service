import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Logo from '../components/Logo';
import ReceptionMoisOnglets from '../components/reception/ReceptionMoisOnglets';
import ReceptionSemaineAccordeon from '../components/reception/ReceptionSemaineAccordeon';
import ReceptionFicheDepart from '../components/reception/ReceptionFicheDepart';
import { genererSemaines, filtrerDossiersParSemaine } from '../components/reception/genererSemaines';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Dog, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ReceptionDeparts({ embedded = false }) {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [dossierSelectionne, setDossierSelectionne] = useState(null);
  const [dossierToDelete, setDossierToDelete] = useState(null);
  const queryClient = useQueryClient();

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers-depart-reception'],
    queryFn: () => base44.entities.DepartCheck.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (dossierId) => base44.entities.DepartCheck.delete(dossierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-depart-reception'] });
      toast.success(lang === 'fr' ? 'Dossier supprimé' : 'File deleted');
      setDossierToDelete(null);
    },
    onError: () => {
      toast.error(lang === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting file');
    }
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
                
                const estComplet = !!(dossier.evaluation_proprete && dossier.photos_json);

                return (
                  <Card key={dossier.id} className={`border-2 ${hasDegats ? 'border-orange-400 bg-orange-50' : 'border-gray-200'} hover:border-[#FFA500] hover:shadow-md transition-all`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setDossierSelectionne(dossier)}
                          className="flex-1 flex items-center gap-4 text-left focus:ring-2 focus:ring-[#FFD700] rounded-lg"
                        >
                          <div className="text-2xl font-bold text-[#FFA500]">
                            {dossier.numero_logement}
                          </div>
                          <div>
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
                        </button>
                        <div className="flex items-center gap-2">
                          {hasDegats && (
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                              <AlertTriangle className="w-3 h-3" />
                              {lang === 'fr' ? 'Dégâts' : 'Damages'}
                            </div>
                          )}
                          {!estComplet && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDossierToDelete(dossier);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
    <>
      <div className="min-h-screen px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            {content}
          </motion.div>
        </div>
      </div>

      <AlertDialog open={!!dossierToDelete} onOpenChange={() => setDossierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lang === 'fr' ? 'Supprimer le dossier ?' : 'Delete file?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === 'fr' 
                ? `Voulez-vous vraiment supprimer le dossier de départ de ${dossierToDelete?.client_nom} ${dossierToDelete?.client_prenom} (${dossierToDelete?.numero_logement}) ? Cette action est irréversible.`
                : `Do you really want to delete the departure file of ${dossierToDelete?.client_nom} ${dossierToDelete?.client_prenom} (${dossierToDelete?.numero_logement})? This action is irreversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(dossierToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {lang === 'fr' ? 'Supprimer' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}