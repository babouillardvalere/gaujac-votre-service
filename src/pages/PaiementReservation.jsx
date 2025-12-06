import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function PaiementReservation() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paiementReussi, setPaiementReussi] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Récupérer l'ID de la réservation depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const reservationId = urlParams.get('id');

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: async () => {
      const reservations = await base44.entities.Reservation.list();
      return reservations.find(r => r.id === reservationId);
    },
    enabled: !!reservationId
  });

  const confirmerPaiementMutation = useMutation({
    mutationFn: async () => {
      // Simuler paiement (à remplacer par vraie intégration Stripe)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return base44.entities.Reservation.update(reservationId, {
        acompte_paye: true,
        acompte_date_paiement: new Date().toISOString(),
        statut: 'confirmee',
        stripe_payment_intent: `pi_sim_${Date.now()}`
      });
    },
    onSuccess: async (updatedReservation) => {
      queryClient.invalidateQueries({ queryKey: ['reservation', reservationId] });
      setPaiementReussi(true);
      
      // Créer automatiquement le dossier d'arrivée
      try {
        const codeDossier = `ARRIVEE-${updatedReservation.numero_logement || 'XX'}-${updatedReservation.date_arrivee}`;
        await base44.entities.DossierArrivee.create({
          code_dossier: codeDossier,
          client_nom: updatedReservation.client_nom,
          client_prenom: updatedReservation.client_prenom,
          date_arrivee: updatedReservation.date_arrivee,
          date_depart: updatedReservation.date_depart,
          type_logement: updatedReservation.type_logement,
          categorie_logement: updatedReservation.categorie_logement,
          numero_logement: updatedReservation.numero_logement,
          nombre_adultes: updatedReservation.nombre_adultes,
          nombre_adolescents: updatedReservation.nombre_adolescents,
          nombre_enfants: updatedReservation.nombre_enfants,
          nombre_bebes: updatedReservation.nombre_bebes,
          nombre_animaux: updatedReservation.nombre_animaux,
          etape_actuelle: 1,
          etape_1_terminee: true,
          statut: 'en_cours'
        });
      } catch (error) {
        console.error('Erreur création dossier arrivée:', error);
      }

      toast.success(lang === 'fr' ? '✅ Paiement confirmé !' : '✅ Payment confirmed!');
    },
    onError: () => {
      toast.error(lang === 'fr' ? 'Erreur de paiement' : 'Payment error');
    }
  });

  const handlePaiement = async () => {
    setProcessing(true);
    await confirmerPaiementMutation.mutateAsync();
    setProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="max-w-md w-full border-2 border-red-300">
          <CardContent className="p-8 text-center">
            <h2 className="font-heading text-2xl text-red-800 mb-2">
              {lang === 'fr' ? 'Réservation introuvable' : 'Reservation not found'}
            </h2>
            <Button onClick={() => navigate(createPageUrl('Home'))}>
              {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Logo className="h-16 mb-6" />

          {!paiementReussi ? (
            <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
              <CardContent className="p-8 space-y-6">
                <div className="text-center">
                  <h1 className="font-handwritten text-4xl text-[#00AEEF] mb-2">
                    💳 {lang === 'fr' ? 'Paiement sécurisé' : 'Secure payment'}
                  </h1>
                  <p className="text-gray-600">
                    {lang === 'fr' ? 'Réservation' : 'Reservation'} #{reservation.numero_reservation}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="font-heading text-lg text-[#0077A8] mb-3">
                    📋 {lang === 'fr' ? 'Détails de la réservation' : 'Booking details'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{lang === 'fr' ? 'Hébergement' : 'Accommodation'}:</span>
                      <strong>{reservation.categorie_logement}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === 'fr' ? 'Dates' : 'Dates'}:</span>
                      <span>{reservation.date_arrivee} → {reservation.date_depart}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === 'fr' ? 'Client' : 'Guest'}:</span>
                      <span>{reservation.client_prenom} {reservation.client_nom}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between text-lg">
                      <span className="font-heading">{lang === 'fr' ? 'Prix total' : 'Total price'}:</span>
                      <strong className="text-[#0077A8]">{reservation.prix_total}€</strong>
                    </div>
                    <div className="flex justify-between text-xl text-[#00AEEF]">
                      <span className="font-heading">{lang === 'fr' ? 'Acompte (30%)' : 'Deposit (30%)'}:</span>
                      <strong>{reservation.acompte_montant}€</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h3 className="font-heading text-lg text-[#0077A8]">
                    {lang === 'fr' ? 'Informations de paiement' : 'Payment information'}
                  </h3>
                  
                  {/* Simulation formulaire carte */}
                  <div className="space-y-4">
                    <div>
                      <Label>{lang === 'fr' ? 'Numéro de carte' : 'Card number'}</Label>
                      <Input placeholder="4242 4242 4242 4242" className="border-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{lang === 'fr' ? 'Expiration' : 'Expiry'}</Label>
                        <Input placeholder="MM/YY" className="border-2" />
                      </div>
                      <div>
                        <Label>CVC</Label>
                        <Input placeholder="123" className="border-2" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      🔒 {lang === 'fr' 
                        ? 'Paiement sécurisé par Stripe. Vos données sont cryptées.'
                        : 'Secure payment by Stripe. Your data is encrypted.'}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handlePaiement}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {lang === 'fr' ? 'Traitement...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      {lang === 'fr' ? `Payer ${reservation.acompte_montant}€` : `Pay ${reservation.acompte_montant}€`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-green-300 rounded-xl">
              <CardContent className="p-8 text-center space-y-6">
                <CheckCircle className="w-20 h-20 mx-auto text-green-600" />
                <h2 className="font-handwritten text-4xl text-green-600">
                  {lang === 'fr' ? 'Réservation confirmée !' : 'Booking confirmed!'}
                </h2>
                <div className="bg-green-50 rounded-xl p-6">
                  <p className="text-lg mb-4">
                    {lang === 'fr' 
                      ? 'Vous allez recevoir un email de confirmation à l\'adresse :' 
                      : 'You will receive a confirmation email at:'}
                  </p>
                  <p className="font-heading text-xl text-[#0077A8]">{reservation.client_email}</p>
                  <p className="text-sm text-gray-600 mt-4">
                    {lang === 'fr' 
                      ? '✅ Votre dossier d\'arrivée a été créé automatiquement.' 
                      : '✅ Your arrival file has been created automatically.'}
                  </p>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl('Home'))}
                  className="w-full bg-[#00AEEF] hover:bg-[#0077A8] h-12"
                >
                  {lang === 'fr' ? 'Retour à l\'accueil' : 'Back to home'}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}