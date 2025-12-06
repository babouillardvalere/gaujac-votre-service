import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar, Home, Mail, Phone, ArrowLeft, XCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { differenceInDays, parseISO, format } from 'date-fns';

export default function MesReservations() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reservationAAnnuler, setReservationAAnnuler] = useState(null);
  const [emailRecherche, setEmailRecherche] = useState('');

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['mes-reservations', emailRecherche],
    queryFn: () => emailRecherche 
      ? base44.entities.Reservation.filter({ client_email: emailRecherche })
      : [],
    enabled: !!emailRecherche
  });

  const calculerPolitiqueAnnulation = (reservation) => {
    const joursAvantArrivee = differenceInDays(parseISO(reservation.date_arrivee), new Date());
    
    if (joursAvantArrivee >= 30) {
      return { remboursement: 100, message: lang === 'fr' ? 'Remboursement intégral' : 'Full refund' };
    } else if (joursAvantArrivee >= 7) {
      return { remboursement: 50, message: lang === 'fr' ? 'Remboursement 50%' : '50% refund' };
    } else if (joursAvantArrivee >= 2) {
      return { remboursement: 25, message: lang === 'fr' ? 'Remboursement 25%' : '25% refund' };
    } else {
      return { remboursement: 0, message: lang === 'fr' ? 'Aucun remboursement' : 'No refund' };
    }
  };

  const annulerReservationMutation = useMutation({
    mutationFn: async (reservation) => {
      const politique = calculerPolitiqueAnnulation(reservation);
      return base44.entities.Reservation.update(reservation.id, {
        statut: 'annulee',
        date_annulation: new Date().toISOString(),
        montant_rembourse: Math.round((reservation.acompte_montant * politique.remboursement) / 100)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mes-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations-actives'] });
      setReservationAAnnuler(null);
      toast.success(lang === 'fr' ? 'Réservation annulée' : 'Reservation cancelled');
    },
    onError: () => {
      toast.error(lang === 'fr' ? 'Erreur d\'annulation' : 'Cancellation error');
    }
  });

  const handleAnnuler = () => {
    if (reservationAAnnuler) {
      annulerReservationMutation.mutate(reservationAAnnuler);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{lang === 'fr' ? 'Retour' : 'Back'}</span>
          </button>

          <Logo className="h-16 mb-6" />

          <div className="text-center mb-8">
            <h1 className="font-handwritten text-5xl text-[#00AEEF] mb-2">
              📋 {lang === 'fr' ? 'Mes Réservations' : 'My Reservations'}
            </h1>
            <p className="text-gray-600 font-body text-lg">
              {lang === 'fr' ? 'Gérez vos réservations' : 'Manage your bookings'}
            </p>
          </div>

          {/* Recherche par email */}
          <Card className="border-2 border-[#00AEEF]/30 rounded-xl mb-6">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder={lang === 'fr' ? 'Entrez votre email' : 'Enter your email'}
                    value={emailRecherche}
                    onChange={(e) => setEmailRecherche(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-body"
                  />
                </div>
                <Button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['mes-reservations'] })}
                  className="bg-[#00AEEF] hover:bg-[#0077A8]"
                  disabled={!emailRecherche}
                >
                  {lang === 'fr' ? 'Rechercher' : 'Search'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des réservations */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00AEEF]"></div>
            </div>
          ) : reservations.length === 0 ? (
            <Card className="border-2 border-gray-200 rounded-xl">
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">
                  {emailRecherche 
                    ? (lang === 'fr' ? 'Aucune réservation trouvée' : 'No reservation found')
                    : (lang === 'fr' ? 'Entrez votre email pour voir vos réservations' : 'Enter your email to see your reservations')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reservations.map(res => {
                const politique = calculerPolitiqueAnnulation(res);
                const peutAnnuler = res.statut !== 'annulee' && res.statut !== 'terminee';
                
                return (
                  <Card
                    key={res.id}
                    className={`border-2 rounded-xl ${
                      res.statut === 'confirmee' ? 'border-green-300' :
                      res.statut === 'annulee' ? 'border-red-300' :
                      'border-yellow-300'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-heading text-xl text-[#0077A8] mb-1">
                            {res.categorie_logement}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {lang === 'fr' ? 'Réservation' : 'Booking'} #{res.numero_reservation}
                          </p>
                        </div>
                        <Badge className={
                          res.statut === 'confirmee' ? 'bg-green-100 text-green-800' :
                          res.statut === 'annulee' ? 'bg-red-100 text-red-800' :
                          res.statut === 'terminee' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {res.statut === 'confirmee' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {res.statut === 'annulee' && <XCircle className="w-3 h-3 mr-1" />}
                          {res.statut === 'en_attente_paiement' && <Clock className="w-3 h-3 mr-1" />}
                          {lang === 'fr' ? (
                            res.statut === 'confirmee' ? 'Confirmée' :
                            res.statut === 'annulee' ? 'Annulée' :
                            res.statut === 'terminee' ? 'Terminée' :
                            'En attente'
                          ) : (
                            res.statut === 'confirmee' ? 'Confirmed' :
                            res.statut === 'annulee' ? 'Cancelled' :
                            res.statut === 'terminee' ? 'Completed' :
                            'Pending'
                          )}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{res.date_arrivee} → {res.date_depart}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Home className="w-4 h-4 text-gray-400" />
                          <span>{res.numero_logement || (lang === 'fr' ? 'En attente d\'attribution' : 'Pending assignment')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{res.client_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{res.client_telephone}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>{lang === 'fr' ? 'Prix total' : 'Total price'}:</span>
                          <strong>{res.prix_total}€</strong>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{lang === 'fr' ? 'Acompte payé' : 'Deposit paid'}:</span>
                          <strong className={res.acompte_paye ? 'text-green-600' : 'text-orange-600'}>
                            {res.acompte_paye ? '✓ ' : '✗ '}
                            {res.acompte_montant}€
                          </strong>
                        </div>
                        {res.statut === 'annulee' && res.montant_rembourse !== undefined && (
                          <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                            <span>{lang === 'fr' ? 'Montant remboursé' : 'Refunded amount'}:</span>
                            <strong className="text-blue-600">{res.montant_rembourse}€</strong>
                          </div>
                        )}
                      </div>

                      {peutAnnuler && (
                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 mb-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-yellow-800">
                              <p className="font-heading mb-1">{lang === 'fr' ? 'Politique d\'annulation' : 'Cancellation policy'}:</p>
                              <p>{politique.message}</p>
                              {politique.remboursement > 0 && (
                                <p className="mt-1">
                                  {lang === 'fr' ? 'Remboursement de' : 'Refund of'} {Math.round((res.acompte_montant * politique.remboursement) / 100)}€
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {peutAnnuler && (
                        <Button
                          onClick={() => setReservationAAnnuler(res)}
                          variant="outline"
                          className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {lang === 'fr' ? 'Annuler la réservation' : 'Cancel reservation'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Dialog confirmation annulation */}
          <Dialog open={!!reservationAAnnuler} onOpenChange={() => setReservationAAnnuler(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {lang === 'fr' ? 'Confirmer l\'annulation' : 'Confirm cancellation'}
                </DialogTitle>
              </DialogHeader>
              {reservationAAnnuler && (
                <div className="py-4 space-y-4">
                  <p className="font-body text-gray-700">
                    {lang === 'fr' 
                      ? 'Êtes-vous sûr de vouloir annuler cette réservation ?'
                      : 'Are you sure you want to cancel this reservation?'}
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-heading text-[#0077A8] mb-2">
                      📋 {reservationAAnnuler.categorie_logement}
                    </p>
                    <p className="text-sm text-gray-600">
                      {reservationAAnnuler.date_arrivee} → {reservationAAnnuler.date_depart}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm font-heading text-yellow-800 mb-1">
                      {calculerPolitiqueAnnulation(reservationAAnnuler).message}
                    </p>
                    <p className="text-sm text-gray-600">
                      {lang === 'fr' ? 'Montant remboursé' : 'Refunded amount'}: {Math.round((reservationAAnnuler.acompte_montant * calculerPolitiqueAnnulation(reservationAAnnuler).remboursement) / 100)}€
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setReservationAAnnuler(null)}
                >
                  {lang === 'fr' ? 'Non, garder' : 'No, keep'}
                </Button>
                <Button
                  onClick={handleAnnuler}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={annulerReservationMutation.isPending}
                >
                  {annulerReservationMutation.isPending ? (
                    <>{lang === 'fr' ? 'Annulation...' : 'Cancelling...'}</>
                  ) : (
                    <>{lang === 'fr' ? 'Oui, annuler' : 'Yes, cancel'}</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </div>
  );
}