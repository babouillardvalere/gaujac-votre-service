import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Home, CreditCard, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { format, differenceInDays, addDays, isBefore, isAfter, parseISO } from 'date-fns';

const TARIFS = {
  emplacement: {
    '6A': 15,
    '10A': 18,
    'Eau + 10A': 22
  },
  mobilhome: {
    'Chalet Eco': 45,
    'Chalet Classique': 55,
    'MH Eco': 50,
    'MH Eco Clim': 60,
    'MH Classique': 65,
    'MH Classique Clim': 75,
    'MH Classique 3ch': 85,
    'Confort+ 2ch': 90,
    'Confort+ 3ch': 100,
    'Premium 2ch': 110,
    'Premium 3ch': 120,
    'Premium Twins': 125,
    'Cottage Premium': 140
  }
};

export default function Reservations() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1); // 1: Recherche, 2: Sélection, 3: Infos, 4: Paiement
  const [recherche, setRecherche] = useState({
    dateArrivee: '',
    dateDepart: '',
    nbAdultes: 2,
    nbEnfants: 0,
    typeLogement: ''
  });
  const [categorieSelectionnee, setCategorieSelectionnee] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    nbAdolescents: 0,
    nbBebes: 0,
    nbAnimaux: 0,
    commentaires: ''
  });

  const { data: reservationsExistantes = [] } = useQuery({
    queryKey: ['reservations-actives'],
    queryFn: () => base44.entities.Reservation.filter({ 
      statut: { $in: ['en_attente_paiement', 'confirmee'] } 
    })
  });

  const { data: mobilhomes = [] } = useQuery({
    queryKey: ['mobilhomes-list'],
    queryFn: () => base44.entities.Mobilhome.list()
  });

  // Vérifier disponibilité
  const verifierDisponibilite = (categorie) => {
    if (!recherche.dateArrivee || !recherche.dateDepart) return 0;
    
    const arrivee = parseISO(recherche.dateArrivee);
    const depart = parseISO(recherche.dateDepart);
    
    // Tous les logements de cette catégorie
    const logementsCategorie = mobilhomes.filter(m => m.categorie === categorie);
    
    // Logements déjà réservés pour cette période
    const logementsOccupes = reservationsExistantes.filter(res => {
      if (res.categorie_logement !== categorie) return false;
      const resArrivee = parseISO(res.date_arrivee);
      const resDepart = parseISO(res.date_depart);
      // Chevauchement de dates
      return !(depart <= resArrivee || arrivee >= resDepart);
    }).map(res => res.numero_logement);
    
    return logementsCategorie.length - logementsOccupes.length;
  };

  const calculerPrix = () => {
    if (!recherche.dateArrivee || !recherche.dateDepart || !categorieSelectionnee) return 0;
    const jours = differenceInDays(parseISO(recherche.dateDepart), parseISO(recherche.dateArrivee));
    const tarifJournalier = recherche.typeLogement === 'emplacement' 
      ? TARIFS.emplacement[categorieSelectionnee] 
      : TARIFS.mobilhome[categorieSelectionnee];
    return jours * tarifJournalier;
  };

  const handleRecherche = () => {
    if (!recherche.dateArrivee || !recherche.dateDepart) {
      toast.error(lang === 'fr' ? 'Veuillez saisir les dates' : 'Please enter dates');
      return;
    }
    if (isBefore(parseISO(recherche.dateArrivee), new Date())) {
      toast.error(lang === 'fr' ? 'Date d\'arrivée invalide' : 'Invalid arrival date');
      return;
    }
    if (!isAfter(parseISO(recherche.dateDepart), parseISO(recherche.dateArrivee))) {
      toast.error(lang === 'fr' ? 'Date de départ invalide' : 'Invalid departure date');
      return;
    }
    setEtape(2);
  };

  const handleSelectionCategorie = (categorie) => {
    const dispo = verifierDisponibilite(categorie);
    if (dispo === 0) {
      toast.error(lang === 'fr' ? 'Plus de disponibilités' : 'No availability');
      return;
    }
    setCategorieSelectionnee(categorie);
    setEtape(3);
  };

  const handleConfirmerInfos = () => {
    if (!clientInfo.nom || !clientInfo.prenom || !clientInfo.email || !clientInfo.telephone) {
      toast.error(lang === 'fr' ? 'Tous les champs sont obligatoires' : 'All fields required');
      return;
    }
    setEtape(4);
  };

  const handlePaiement = async () => {
    try {
      const prixTotal = calculerPrix();
      const acompte = Math.round(prixTotal * 0.3); // 30% d'acompte
      
      // Créer la réservation
      const numeroReservation = `RES-${Date.now()}`;
      const reservation = await base44.entities.Reservation.create({
        numero_reservation: numeroReservation,
        client_nom: clientInfo.nom,
        client_prenom: clientInfo.prenom,
        client_email: clientInfo.email,
        client_telephone: clientInfo.telephone,
        date_arrivee: recherche.dateArrivee,
        date_depart: recherche.dateDepart,
        type_logement: recherche.typeLogement,
        categorie_logement: categorieSelectionnee,
        nombre_adultes: recherche.nbAdultes,
        nombre_enfants: recherche.nbEnfants,
        nombre_adolescents: clientInfo.nbAdolescents,
        nombre_bebes: clientInfo.nbBebes,
        nombre_animaux: clientInfo.nbAnimaux,
        prix_total: prixTotal,
        acompte_montant: acompte,
        commentaires: clientInfo.commentaires,
        statut: 'en_attente_paiement'
      });

      toast.success(lang === 'fr' ? 'Réservation créée !' : 'Reservation created!');
      
      // Rediriger vers paiement Stripe (à implémenter)
      navigate(createPageUrl('PaiementReservation') + `?id=${reservation.id}`);
    } catch (error) {
      console.error(error);
      toast.error(lang === 'fr' ? 'Erreur lors de la réservation' : 'Reservation error');
    }
  };

  const categories = recherche.typeLogement === 'emplacement' 
    ? Object.keys(TARIFS.emplacement)
    : Object.keys(TARIFS.mobilhome);

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => etape > 1 ? setEtape(etape - 1) : navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{lang === 'fr' ? 'Retour' : 'Back'}</span>
          </button>

          <Logo className="h-16 mb-6" />

          <div className="text-center mb-8">
            <h1 className="font-handwritten text-5xl text-[#00AEEF] mb-2">
              📅 {lang === 'fr' ? 'Réservation en ligne' : 'Online Booking'}
            </h1>
            <p className="text-gray-600 font-body text-lg">
              {lang === 'fr' ? 'Réservez votre séjour en quelques clics' : 'Book your stay in a few clicks'}
            </p>
          </div>

          {/* Barre de progression */}
          <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading ${
                  etape >= num ? 'bg-[#00AEEF] text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {num}
                </div>
                {num < 4 && <div className={`flex-1 h-1 ${etape > num ? 'bg-[#00AEEF]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Étape 1: Recherche */}
          {etape === 1 && (
            <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="font-heading text-gray-700">
                      {lang === 'fr' ? 'Date d\'arrivée' : 'Arrival date'}
                    </Label>
                    <Input
                      type="date"
                      value={recherche.dateArrivee}
                      onChange={(e) => setRecherche({ ...recherche, dateArrivee: e.target.value })}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="border-2 border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="font-heading text-gray-700">
                      {lang === 'fr' ? 'Date de départ' : 'Departure date'}
                    </Label>
                    <Input
                      type="date"
                      value={recherche.dateDepart}
                      onChange={(e) => setRecherche({ ...recherche, dateDepart: e.target.value })}
                      min={recherche.dateArrivee || format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                      className="border-2 border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="font-heading text-gray-700">
                      {lang === 'fr' ? 'Adultes' : 'Adults'}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={recherche.nbAdultes}
                      onChange={(e) => setRecherche({ ...recherche, nbAdultes: +e.target.value })}
                      className="border-2 border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="font-heading text-gray-700">
                      {lang === 'fr' ? 'Enfants (3-12 ans)' : 'Children (3-12 y.o)'}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={recherche.nbEnfants}
                      onChange={(e) => setRecherche({ ...recherche, nbEnfants: +e.target.value })}
                      className="border-2 border-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-heading text-gray-700 mb-3 block">
                    {lang === 'fr' ? 'Type de logement' : 'Accommodation type'}
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setRecherche({ ...recherche, typeLogement: 'emplacement' })}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        recherche.typeLogement === 'emplacement'
                          ? 'border-[#00AEEF] bg-[#e6f7ff]'
                          : 'border-gray-200 hover:border-[#00AEEF]/50'
                      }`}
                    >
                      <span className="text-4xl mb-2 block">⛺</span>
                      <p className="font-heading text-lg">{lang === 'fr' ? 'Emplacement' : 'Pitch'}</p>
                    </button>
                    <button
                      onClick={() => setRecherche({ ...recherche, typeLogement: 'mobilhome' })}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        recherche.typeLogement === 'mobilhome'
                          ? 'border-[#00AEEF] bg-[#e6f7ff]'
                          : 'border-gray-200 hover:border-[#00AEEF]/50'
                      }`}
                    >
                      <span className="text-4xl mb-2 block">🏠</span>
                      <p className="font-heading text-lg">{lang === 'fr' ? 'Mobil-home' : 'Mobile home'}</p>
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleRecherche}
                  className="w-full bg-[#00AEEF] hover:bg-[#0077A8] h-14 text-lg"
                  disabled={!recherche.typeLogement}
                >
                  <Search className="w-5 h-5 mr-2" />
                  {lang === 'fr' ? 'Rechercher' : 'Search'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Étape 2: Sélection catégorie */}
          {etape === 2 && (
            <div className="space-y-4">
              <Card className="border-2 border-blue-200 rounded-xl mb-4">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#00AEEF]" />
                    <span className="font-heading">{recherche.dateArrivee} → {recherche.dateDepart}</span>
                    <Users className="w-5 h-5 text-gray-400 ml-4" />
                    <span>{recherche.nbAdultes + recherche.nbEnfants} pers.</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEtape(1)}>
                    {lang === 'fr' ? 'Modifier' : 'Edit'}
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => {
                  const dispo = verifierDisponibilite(cat);
                  const tarif = recherche.typeLogement === 'emplacement' 
                    ? TARIFS.emplacement[cat] 
                    : TARIFS.mobilhome[cat];
                  
                  return (
                    <Card
                      key={cat}
                      className={`border-2 rounded-xl cursor-pointer transition-all ${
                        dispo === 0 ? 'border-gray-200 opacity-50' : 'border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-lg'
                      }`}
                      onClick={() => dispo > 0 && handleSelectionCategorie(cat)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-heading text-lg text-[#0077A8]">{cat}</h3>
                          {dispo > 0 ? (
                            <Badge className="bg-green-100 text-green-800">
                              {dispo} {lang === 'fr' ? 'dispo' : 'avail'}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              {lang === 'fr' ? 'Complet' : 'Full'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-2xl font-heading text-[#00AEEF] mb-2">{tarif}€<span className="text-sm text-gray-500">/{lang === 'fr' ? 'nuit' : 'night'}</span></p>
                        <p className="text-sm text-gray-600">
                          {differenceInDays(parseISO(recherche.dateDepart), parseISO(recherche.dateArrivee))} {lang === 'fr' ? 'nuits' : 'nights'}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Étape 3: Informations client */}
          {etape === 3 && (
            <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
              <CardContent className="p-8 space-y-6">
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <h3 className="font-heading text-[#0077A8] mb-2">✔️ {lang === 'fr' ? 'Votre sélection' : 'Your selection'}</h3>
                  <p className="text-sm"><strong>{categorieSelectionnee}</strong></p>
                  <p className="text-sm">{recherche.dateArrivee} → {recherche.dateDepart}</p>
                  <p className="text-2xl font-heading text-[#00AEEF] mt-2">{calculerPrix()}€</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-heading text-gray-700">{lang === 'fr' ? 'Nom' : 'Last name'} *</Label>
                    <Input
                      value={clientInfo.nom}
                      onChange={(e) => setClientInfo({ ...clientInfo, nom: e.target.value })}
                      className="border-2 border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="font-heading text-gray-700">{lang === 'fr' ? 'Prénom' : 'First name'} *</Label>
                    <Input
                      value={clientInfo.prenom}
                      onChange={(e) => setClientInfo({ ...clientInfo, prenom: e.target.value })}
                      className="border-2 border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="font-heading text-gray-700">Email *</Label>
                    <Input
                      type="email"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                      className="border-2 border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="font-heading text-gray-700">{lang === 'fr' ? 'Téléphone' : 'Phone'} *</Label>
                    <Input
                      type="tel"
                      value={clientInfo.telephone}
                      onChange={(e) => setClientInfo({ ...clientInfo, telephone: e.target.value })}
                      className="border-2 border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="font-heading text-gray-700">{lang === 'fr' ? 'Adolescents (13-17)' : 'Teens (13-17)'}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={clientInfo.nbAdolescents}
                      onChange={(e) => setClientInfo({ ...clientInfo, nbAdolescents: +e.target.value })}
                      className="border-2 border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="font-heading text-gray-700">{lang === 'fr' ? 'Bébés (0-2)' : 'Babies (0-2)'}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={clientInfo.nbBebes}
                      onChange={(e) => setClientInfo({ ...clientInfo, nbBebes: +e.target.value })}
                      className="border-2 border-gray-200"
                    />
                  </div>
                  <div>
                    <Label className="font-heading text-gray-700">{lang === 'fr' ? 'Animaux' : 'Pets'}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={clientInfo.nbAnimaux}
                      onChange={(e) => setClientInfo({ ...clientInfo, nbAnimaux: +e.target.value })}
                      className="border-2 border-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-heading text-gray-700">{lang === 'fr' ? 'Commentaires / Demandes spéciales' : 'Comments / Special requests'}</Label>
                  <textarea
                    value={clientInfo.commentaires}
                    onChange={(e) => setClientInfo({ ...clientInfo, commentaires: e.target.value })}
                    className="w-full border-2 border-gray-200 rounded-xl p-3 font-body"
                    rows="3"
                  />
                </div>

                <Button
                  onClick={handleConfirmerInfos}
                  className="w-full bg-[#00AEEF] hover:bg-[#0077A8] h-14 text-lg"
                >
                  {lang === 'fr' ? 'Continuer vers le paiement' : 'Continue to payment'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Étape 4: Paiement */}
          {etape === 4 && (
            <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
              <CardContent className="p-8 space-y-6">
                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                  <h3 className="font-heading text-xl text-green-800 mb-4">💰 {lang === 'fr' ? 'Récapitulatif' : 'Summary'}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{lang === 'fr' ? 'Hébergement' : 'Accommodation'}:</span>
                      <strong>{categorieSelectionnee}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === 'fr' ? 'Dates' : 'Dates'}:</span>
                      <span>{recherche.dateArrivee} → {recherche.dateDepart}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{lang === 'fr' ? 'Personnes' : 'People'}:</span>
                      <span>{recherche.nbAdultes + recherche.nbEnfants + clientInfo.nbAdolescents + clientInfo.nbBebes}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between text-lg">
                      <span className="font-heading">{lang === 'fr' ? 'Prix total' : 'Total price'}:</span>
                      <strong className="text-[#0077A8]">{calculerPrix()}€</strong>
                    </div>
                    <div className="flex justify-between text-lg text-[#00AEEF]">
                      <span className="font-heading">{lang === 'fr' ? 'Acompte à payer (30%)' : 'Deposit (30%)'}:</span>
                      <strong>{Math.round(calculerPrix() * 0.3)}€</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    ℹ️ {lang === 'fr' 
                      ? 'Le solde sera à régler à votre arrivée.' 
                      : 'The balance will be payable upon arrival.'}
                  </p>
                </div>

                <Button
                  onClick={handlePaiement}
                  className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {lang === 'fr' ? 'Payer l\'acompte' : 'Pay deposit'}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}