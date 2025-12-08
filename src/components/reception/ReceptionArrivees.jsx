import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Search, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import ReceptionFicheArrivee from './ReceptionFicheArrivee';
import Pagination from '../Pagination';

export default function ReceptionArrivees({ lang }) {
  const queryClient = useQueryClient();
  const [ficheSelectionnee, setFicheSelectionnee] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ficheASupprimer, setFicheASupprimer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const ITEMS_PER_PAGE = 30;

  // Récupérer toutes les fiches actives (non archivées)
  const { data: fiches = [], isLoading } = useQuery({
    queryKey: ['fiches-arrivee'],
    queryFn: async () => {
      const allFiches = await base44.entities.FicheArrivee.list('-date_validation', 500);
      console.log('📥 Fiches arrivée récupérées:', allFiches.length);
      return allFiches;
    },
    refetchInterval: 10000,
    staleTime: 30000
  });

  const fichesFiltrees = fiches.filter(f => {
    if (!recherche) return true;
    const searchLower = recherche.toLowerCase();
    return (
      f.client_nom?.toLowerCase().includes(searchLower) ||
      f.client_prenom?.toLowerCase().includes(searchLower) ||
      f.numero_logement?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const fichesPaginees = fichesFiltrees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Réinitialiser la page si la recherche change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [recherche]);

  // Supprimer une fiche
  const handleDeleteFiche = async () => {
    if (!ficheASupprimer) return;
    
    setIsDeleting(true);
    try {
      await base44.entities.FicheArrivee.delete(ficheASupprimer.id);
      toast.success(lang === 'fr' ? 'Fiche supprimée' : 'File deleted');
      queryClient.invalidateQueries(['fiches-arrivee']);
      setFicheASupprimer(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(lang === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting file');
    } finally {
      setIsDeleting(false);
    }
  };

  // Éviter de charger le composant conditionnel avant d'avoir fini le rendu des hooks
  const [shouldRenderFiche, setShouldRenderFiche] = React.useState(false);
  
  React.useEffect(() => {
    if (ficheSelectionnee) {
      setShouldRenderFiche(true);
    } else {
      setShouldRenderFiche(false);
    }
  }, [ficheSelectionnee]);

  if (shouldRenderFiche && ficheSelectionnee) {
    // Recharger la fiche complète depuis la BDD pour avoir toutes les données
    return (
      <ReceptionFicheArrivee
        ficheId={ficheSelectionnee.id}
        onClose={() => setFicheSelectionnee(null)}
        lang={lang}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl text-[#00AEEF]">
            {lang === 'fr' ? '🟢 Arrivées – Dossiers & inventaires' : '🟢 Arrivals – Files & inventories'}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {lang === 'fr' ? `${fiches.length} dossier(s) enregistré(s)` : `${fiches.length} file(s) recorded`}
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={lang === 'fr' ? 'Rechercher par nom ou n° logement...' : 'Search by name or accommodation number...'}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Liste des fiches */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
          </CardContent>
        </Card>
      ) : fichesFiltrees.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {recherche 
                ? (lang === 'fr' ? 'Aucun dossier trouvé' : 'No file found')
                : (lang === 'fr' ? 'Aucun dossier d\'arrivée enregistré' : 'No arrival file recorded')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {fichesPaginees.map(fiche => {
            const totalPersonnes = (fiche.nombre_adultes || 0) + (fiche.nombre_adolescents || 0) + 
                                   (fiche.nombre_enfants || 0) + (fiche.nombre_bebes || 0);
            const aProblemes = fiche.evaluation_proprete === 'pas_satisfaisant' || 
                              (fiche.inventaire_objets_manquants && fiche.inventaire_objets_manquants.length > 0);

            return (
              <Card key={fiche.id} className={`border-2 ${aProblemes ? 'border-orange-400 bg-orange-50' : 'border-green-400 bg-green-50'} hover:shadow-lg transition-all`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setFicheSelectionnee(fiche)}>
                      <div className="text-3xl font-bold text-[#00AEEF]">
                        {fiche.numero_logement}
                      </div>
                      <div className="flex-1">
                        <p className="font-heading text-xl text-gray-900">
                          {fiche.client_prenom} {fiche.client_nom}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {fiche.date_arrivee} → {fiche.date_depart}
                          </span>
                          <span>{fiche.categorie_logement}</span>
                          {totalPersonnes > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {totalPersonnes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {aProblemes ? (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {lang === 'fr' ? 'Problèmes' : 'Issues'}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {lang === 'fr' ? 'Conforme' : 'OK'}
                        </Badge>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setFicheSelectionnee(fiche)}>
                        {lang === 'fr' ? 'Voir' : 'View'} →
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFicheASupprimer(fiche);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && fichesFiltrees.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={fichesFiltrees.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Dialog de confirmation suppression */}
      <AlertDialog open={!!ficheASupprimer} onOpenChange={() => setFicheASupprimer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lang === 'fr' ? 'Confirmer la suppression' : 'Confirm deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === 'fr' 
                ? `Voulez-vous vraiment supprimer la fiche d'arrivée de ${ficheASupprimer?.client_prenom} ${ficheASupprimer?.client_nom} (${ficheASupprimer?.numero_logement}) ? Cette action est irréversible.`
                : `Do you really want to delete the arrival file for ${ficheASupprimer?.client_prenom} ${ficheASupprimer?.client_nom} (${ficheASupprimer?.numero_logement})? This action is irreversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFiche}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (lang === 'fr' ? 'Suppression...' : 'Deleting...') : (lang === 'fr' ? 'Supprimer' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}