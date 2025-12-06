import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Search, XCircle, CheckCircle, AlertTriangle, Home as HomeIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { differenceInDays, parseISO } from 'date-fns';

export default function GestionReservationsReception() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [reservationAAnnuler, setReservationAAnnuler] = useState(null);
  const [reservationAAffecter, setReservationAAffecter] = useState(null);
  const [numeroLogement, setNumeroLogement] = useState('');

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['gestion-reservations'],
    queryFn: () => base44.entities.Reservation.list('-created_date'),
    refetchInterval: 10000
  });

  const { data: mobilhomes = [] } = useQuery({
    queryKey: ['mobilhomes-disponibles'],
    queryFn: () => base44.entities.Mobilhome.list()
  });

  const annulerReservationMutation = useMutation({
    mutationFn: (id) => base44.entities.Reservation.update(id, {
      statut: 'annulee',
      date_annulation: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestion-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations-actives'] });
      setReservationAAnnuler(null);
      toast.success(lang === 'fr' ? 'Réservation annulée' : 'Reservation cancelled');
    }
  });

  const affecterLogementMutation = useMutation({
    mutationFn: ({ id, numero }) => base44.entities.Reservation.update(id, {
      numero_logement: numero
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestion-reservations'] });
      setReservationAAffecter(null);
      setNumeroLogement('');
      toast.success(lang === 'fr' ? 'Logement affecté' : 'Accommodation assigned');
    }
  });

  const filteredReservations = reservations.filter(res => {
    if (filtreStatut !== 'tous' && res.statut !== filtreStatut) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return res.client_nom?.toLowerCase().includes(query) ||
             res.client_prenom?.toLowerCase().includes(query) ||
             res.client_email?.toLowerCase().includes(query) ||
             res.numero_reservation?.toLowerCase().includes(query) ||
             res.numero_logement?.toLowerCase().includes(query);
    }
    return true;
  });

  const stats = {
    total: reservations.length,
    confirmees: reservations.filter(r => r.statut === 'confirmee').length,
    enAttente: reservations.filter(r => r.statut === 'en_attente_paiement').length,
    annulees: reservations.filter(r => r.statut === 'annulee').length
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(createPageUrl('Reception'))}
              className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-heading">{lang === 'fr' ? 'Retour' : 'Back'}</span>
            </button>
          </div>

          <Logo className="h-16 mb-6" />

          <div className="text-center mb-8">
            <h1 className="font-handwritten text-5xl text-[#00AEEF] mb-2">
              🎫 {lang === 'fr' ? 'Gestion des Réservations' : 'Reservations Management'}
            </h1>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="border-2 border-blue-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-heading text-[#00AEEF]">{stats.total}</p>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Total' : 'Total'}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-heading text-green-600">{stats.confirmees}</p>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Confirmées' : 'Confirmed'}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-yellow-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-heading text-yellow-600">{stats.enAttente}</p>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'En attente' : 'Pending'}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-red-200">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-heading text-red-600">{stats.annulees}</p>
                <p className="text-sm text-gray-600">{lang === 'fr' ? 'Annulées' : 'Cancelled'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filtreStatut} onValueChange={setFiltreStatut}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">{lang === 'fr' ? 'Tous' : 'All'}</SelectItem>
                    <SelectItem value="confirmee">{lang === 'fr' ? 'Confirmées' : 'Confirmed'}</SelectItem>
                    <SelectItem value="en_attente_paiement">{lang === 'fr' ? 'En attente' : 'Pending'}</SelectItem>
                    <SelectItem value="annulee">{lang === 'fr' ? 'Annulées' : 'Cancelled'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AEEF]"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReservations.map(res => (
                <Card key={res.id} className="border-2 border-gray-200 rounded-xl hover:border-[#00AEEF] transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-lg text-[#0077A8]">
                            {res.client_prenom} {res.client_nom}
                          </h3>
                          <Badge className={
                            res.statut === 'confirmee' ? 'bg-green-100 text-green-800' :
                            res.statut === 'annulee' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {res.statut === 'confirmee' ? '✓ Confirmée' :
                             res.statut === 'annulee' ? '✗ Annulée' :
                             '⏳ En attente'}
                          </Badge>
                          {!res.numero_logement && res.statut === 'confirmee' && (
                            <Badge className="bg-orange-100 text-orange-800">
                              {lang === 'fr' ? 'À affecter' : 'To assign'}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Réservation:</span>
                            <p className="font-heading">#{res.numero_reservation}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Dates:</span>
                            <p>{res.date_arrivee} → {res.date_depart}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Catégorie:</span>
                            <p>{res.categorie_logement}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Logement:</span>
                            <p className="font-heading text-[#0077A8]">
                              {res.numero_logement || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!res.numero_logement && res.statut === 'confirmee' && (
                          <Button
                            size="sm"
                            onClick={() => setReservationAAffecter(res)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <HomeIcon className="w-4 h-4 mr-1" />
                            {lang === 'fr' ? 'Affecter' : 'Assign'}
                          </Button>
                        )}
                        {res.statut !== 'annulee' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReservationAAnnuler(res)}
                            className="border-red-300 text-red-600"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Dialog annulation */}
          <Dialog open={!!reservationAAnnuler} onOpenChange={() => setReservationAAnnuler(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading text-red-600">
                  {lang === 'fr' ? 'Annuler la réservation' : 'Cancel reservation'}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-600">
                {lang === 'fr' 
                  ? 'Cette action annulera la réservation et libérera le logement.'
                  : 'This action will cancel the reservation and free up the accommodation.'}
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReservationAAnnuler(null)}>
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => annulerReservationMutation.mutate(reservationAAnnuler.id)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {lang === 'fr' ? 'Confirmer' : 'Confirm'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog affectation logement */}
          <Dialog open={!!reservationAAffecter} onOpenChange={() => setReservationAAffecter(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading text-[#0077A8]">
                  {lang === 'fr' ? 'Affecter un logement' : 'Assign accommodation'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {reservationAAffecter?.categorie_logement}
                </p>
                <Input
                  placeholder={lang === 'fr' ? 'Numéro du logement' : 'Accommodation number'}
                  value={numeroLogement}
                  onChange={(e) => setNumeroLogement(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReservationAAffecter(null)}>
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => affecterLogementMutation.mutate({ 
                    id: reservationAAffecter.id, 
                    numero: numeroLogement 
                  })}
                  disabled={!numeroLogement}
                  className="bg-[#00AEEF] hover:bg-[#0077A8]"
                >
                  {lang === 'fr' ? 'Affecter' : 'Assign'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </div>
  );
}