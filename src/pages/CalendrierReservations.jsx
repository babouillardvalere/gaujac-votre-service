import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Logo from '../components/Logo';
import CalendrierVue from '../components/calendrier/CalendrierVue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar as CalendarIcon, Filter, Edit2, Save, X, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CalendrierReservations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [view, setView] = useState('month');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [dossierSelectionne, setDossierSelectionne] = useState(null);
  const [modeEdition, setModeEdition] = useState(false);
  const [dateArriveeEdit, setDateArriveeEdit] = useState('');
  const [dateDepartEdit, setDateDepartEdit] = useState('');

  // Récupérer tous les dossiers d'arrivée
  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers-arrivee-calendrier'],
    queryFn: () => base44.entities.DossierArrivee.list('-date_arrivee', 500),
    refetchInterval: 30000
  });

  // Mutation pour mettre à jour un dossier
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DossierArrivee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-arrivee-calendrier'] });
      toast.success('Dates mises à jour');
      setModeEdition(false);
      setDossierSelectionne(null);
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  // Filtrer les dossiers par statut
  const dossiersFilteres = dossiers.filter(d => {
    if (filtreStatut === 'tous') return true;
    return d.statut === filtreStatut;
  });

  const handleSelectDossier = (dossier) => {
    setDossierSelectionne(dossier);
    setDateArriveeEdit(dossier.date_arrivee);
    setDateDepartEdit(dossier.date_depart);
    setModeEdition(false);
  };

  const handleSaveModification = () => {
    if (!dateArriveeEdit || !dateDepartEdit) {
      toast.error('Veuillez remplir toutes les dates');
      return;
    }

    if (new Date(dateDepartEdit) <= new Date(dateArriveeEdit)) {
      toast.error('La date de départ doit être après la date d\'arrivée');
      return;
    }

    updateMutation.mutate({
      id: dossierSelectionne.id,
      data: {
        date_arrivee: dateArriveeEdit,
        date_depart: dateDepartEdit
      }
    });
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'finalise':
        return <Badge className="bg-green-500">✅ Finalisé</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-500">🔄 En cours</Badge>;
      case 'abandonne':
        return <Badge className="bg-gray-500">❌ Abandonné</Badge>;
      default:
        return <Badge className="bg-yellow-500">⏳ En attente</Badge>;
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(createPageUrl('Reception'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <Home className="w-5 h-5" />
              <span className="font-heading">Réception</span>
            </button>
          </div>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-4xl text-[#00AEEF] text-center mb-6">
            <CalendarIcon className="w-10 h-10 inline mr-2" />
            Calendrier des Réservations
          </h1>

          {/* Filtres et vues */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Sélecteur de vue */}
                <div className="flex items-center gap-2">
                  <Tabs value={view} onValueChange={setView}>
                    <TabsList>
                      <TabsTrigger value="day">Jour</TabsTrigger>
                      <TabsTrigger value="week">Semaine</TabsTrigger>
                      <TabsTrigger value="month">Mois</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Filtre statut */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#0077A8]" />
                  <Select value={filtreStatut} onValueChange={setFiltreStatut}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous les statuts</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="finalise">Finalisé</SelectItem>
                      <SelectItem value="abandonne">Abandonné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stats */}
                <div className="text-sm text-gray-600">
                  <strong>{dossiersFilteres.length}</strong> réservation(s)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendrier */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AEEF]"></div>
            </div>
          ) : (
            <CalendrierVue 
              dossiers={dossiersFilteres}
              onSelectDossier={handleSelectDossier}
              view={view}
            />
          )}
        </motion.div>
      </div>

      {/* Dialog détails + modification */}
      <Dialog open={!!dossierSelectionne} onOpenChange={() => {
        setDossierSelectionne(null);
        setModeEdition(false);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-[#0077A8] flex items-center justify-between">
              <span>Détails Réservation</span>
              {!modeEdition && (
                <Button
                  onClick={() => setModeEdition(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier dates
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {dossierSelectionne && (
            <div className="space-y-4">
              <Card className="bg-[#e6f7ff] border-none">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Statut</span>
                    {getStatutBadge(dossierSelectionne.statut)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Code dossier</span>
                    <span className="font-heading">{dossierSelectionne.code_dossier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Client</span>
                    <span className="font-body">{dossierSelectionne.client_nom} {dossierSelectionne.client_prenom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Logement</span>
                    <span className="font-body">{dossierSelectionne.numero_logement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Catégorie</span>
                    <span className="font-body">{dossierSelectionne.categorie_logement}</span>
                  </div>
                </CardContent>
              </Card>

              {!modeEdition ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600">Date d'arrivée</Label>
                        <div className="font-heading text-lg text-[#0077A8]">
                          {format(new Date(dossierSelectionne.date_arrivee), 'dd MMMM yyyy', { locale: fr })}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Date de départ</Label>
                        <div className="font-heading text-lg text-[#0077A8]">
                          {format(new Date(dossierSelectionne.date_depart), 'dd MMMM yyyy', { locale: fr })}
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-sm text-gray-600">Durée du séjour : </span>
                        <span className="font-heading text-[#0077A8]">
                          {Math.ceil((new Date(dossierSelectionne.date_depart) - new Date(dossierSelectionne.date_arrivee)) / (1000 * 60 * 60 * 24))} nuits
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-[#00AEEF]">
                  <CardHeader>
                    <CardTitle className="text-sm font-heading text-[#0077A8]">
                      Modifier les dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="date_arrivee">Date d'arrivée</Label>
                      <Input
                        id="date_arrivee"
                        type="date"
                        value={dateArriveeEdit}
                        onChange={(e) => setDateArriveeEdit(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_depart">Date de départ</Label>
                      <Input
                        id="date_depart"
                        type="date"
                        value={dateDepartEdit}
                        onChange={(e) => setDateDepartEdit(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setModeEdition(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSaveModification}
                        disabled={updateMutation.isPending}
                        className="flex-1 bg-[#00AEEF] hover:bg-[#0077A8]"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}