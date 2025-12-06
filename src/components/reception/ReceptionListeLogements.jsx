import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Dog, Calendar, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function ReceptionListeLogements({ dossiers, onSelectDossier, lang = 'fr' }) {
  const [dossierToDelete, setDossierToDelete] = useState(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (dossierId) => base44.entities.DossierArrivee.delete(dossierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-arrivee-reception'] });
      toast.success(lang === 'fr' ? 'Dossier supprimé' : 'File deleted');
      setDossierToDelete(null);
    },
    onError: () => {
      toast.error(lang === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting file');
    }
  });

  // Grouper par catégorie
  const categories = {
    'Premium': ['Premium 2ch', 'Premium 3ch', 'Premium Twins', 'Cottage Premium'],
    'Confort+': ['Confort+ 2ch', 'Confort+ 3ch'],
    'Classique': ['Mobil-home Classique', 'Mobil-home Classique Clim', 'Mobil-home Classique 3ch'],
    'Éco': ['Mobil-home Eco', 'Mobil-home Eco Clim'],
    'Chalet': ['Chalet Eco', 'Chalet Classique'],
    'Emplacement 6A': ['Emplacement 6A'],
    'Emplacement 10A': ['Emplacement 10A'],
    'Emplacement Eau+10A': ['Emplacement Eau+10A']
  };

  const dossiersParCategorie = {};
  Object.keys(categories).forEach(cat => {
    dossiersParCategorie[cat] = dossiers.filter(d => {
      const categorieDossier = d.categorie_logement || d.categorie;
      return categories[cat].some(catName => 
        catName.toLowerCase().includes(categorieDossier?.toLowerCase() || '') ||
        categorieDossier?.toLowerCase().includes(catName.toLowerCase())
      );
    });
  });

  const calculerDuree = (dateArrivee, dateDepart) => {
    const debut = new Date(dateArrivee);
    const fin = new Date(dateDepart);
    const diffTime = Math.abs(fin - debut);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formaterJourArrivee = (date) => {
    const d = new Date(date);
    const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const joursEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return lang === 'fr' ? jours[d.getDay()] : joursEn[d.getDay()];
  };

  return (
    <>
      <div className="space-y-4">
        {Object.entries(dossiersParCategorie).map(([categorie, dossiersCat]) => {
          if (dossiersCat.length === 0) return null;

          return (
            <div key={categorie}>
              <h3 className="font-heading text-lg text-[#0077A8] mb-2">
                {categorie}
              </h3>
              <div className="space-y-2">
                {dossiersCat.map(dossier => {
                  const duree = calculerDuree(dossier.date_arrivee, dossier.date_depart);
                  const jourArrivee = formaterJourArrivee(dossier.date_arrivee);
                  const totalPersonnes = (dossier.nombre_adultes || 0) + (dossier.nombre_adolescents || 0) + (dossier.nombre_enfants || 0) + (dossier.nombre_bebes || 0);
                  const estComplet = !!(dossier.inventaire_id && dossier.statut === 'finalise');

                  return (
                    <Card key={dossier.id} className={`border-2 ${estComplet ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50'} hover:border-[#00AEEF] hover:shadow-md transition-all`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => onSelectDossier(dossier)}
                            className="flex-1 flex items-center gap-4 text-left focus:ring-2 focus:ring-[#FFD700] rounded-lg"
                          >
                            <div className="text-2xl font-bold text-[#00AEEF]">
                              {dossier.numero_logement}
                            </div>
                            <div>
                              <p className="font-heading text-gray-900">
                                {dossier.client_nom} {dossier.client_prenom}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {totalPersonnes} {lang === 'fr' ? 'pers' : 'ppl'}
                                </span>
                                {(dossier.nombre_animaux > 0 || dossier.nombre_chiens > 0 || dossier.nombre_chats > 0) && (
                                  <span className="flex items-center gap-1">
                                    <Dog className="w-4 h-4" />
                                    {dossier.nombre_animaux || (dossier.nombre_chiens + dossier.nombre_chats)}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {jourArrivee} • {duree}N
                                </span>
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-2">
                            {estComplet ? (
                              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                {lang === 'fr' ? 'Complet' : 'Complete'}
                              </div>
                            ) : (
                              <>
                                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                  <AlertCircle className="w-3 h-3" />
                                  {lang === 'fr' ? 'Incomplet' : 'Incomplete'}
                                </div>
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
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {Object.values(dossiersParCategorie).every(cat => cat.length === 0) && (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                {lang === 'fr' ? 'Aucun dossier pour cette semaine' : 'No files for this week'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!dossierToDelete} onOpenChange={() => setDossierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lang === 'fr' ? 'Supprimer le dossier ?' : 'Delete file?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === 'fr' 
                ? `Voulez-vous vraiment supprimer le dossier de ${dossierToDelete?.client_nom} ${dossierToDelete?.client_prenom} (${dossierToDelete?.numero_logement}) ? Cette action est irréversible.`
                : `Do you really want to delete the file of ${dossierToDelete?.client_nom} ${dossierToDelete?.client_prenom} (${dossierToDelete?.numero_logement})? This action is irreversible.`}
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