import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, MapPin, Home, ChevronRight, Search, Clock, User, 
  CheckCircle, AlertTriangle, Play, Pause, Send, Star, ChevronDown, ChevronUp,
  Loader2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';

// Données hébergements
const emplacements = {
  '6A': Array.from({ length: 50 }, (_, i) => `E${i + 1}`),
  '10A': Array.from({ length: 30 }, (_, i) => `E${i + 51}`),
  'Eau + 10A': Array.from({ length: 20 }, (_, i) => `E${i + 81}`)
};

const logements = {
  'Chalet Éco 1 ch': ['CE1', 'CE2', 'CE3', 'CE4', 'CE5'],
  'Chalet Classique 1 ch': ['CC1', 'CC2', 'CC3', 'CC4'],
  'MH Éco': ['MHE1', 'MHE2', 'MHE3', 'MHE4', 'MHE5', 'MHE6'],
  'MH Éco Clim': ['MHEC1', 'MHEC2', 'MHEC3', 'MHEC4'],
  'MH Classique': ['MHC1', 'MHC2', 'MHC3', 'MHC4', 'MHC5', 'MHC6', 'MHC7', 'MHC8'],
  'MH Classique Clim': ['MHCC1', 'MHCC2', 'MHCC3', 'MHCC4', 'MHCC5'],
  'MH Classique 3 ch': ['MHC3-1', 'MHC3-2', 'MHC3-3'],
  'MH Confort+ 2 ch': ['MCF1', 'MCF2', 'MCF3', 'MCF4', 'MCF5'],
  'MH Confort+ 3 ch': ['MCF3-1', 'MCF3-2', 'MCF3-3'],
  'MH Premium 2 ch': ['MP1', 'MP2', 'MP3', 'MP4', 'MP5', 'MP6'],
  'MH Premium 3 ch': ['MP3-1', 'MP3-2', 'MP3-3', 'MP3-4'],
  'MH Premium Twins': ['MPT1', 'MPT2'],
  'Cottage Premium': ['CP1', 'CP2', 'CP3']
};

const categoryEmojis = {
  gaz: '🔥', eau: '💧', electricite: '⚡', plomberie: '🔧',
  espace_vert: '🌿', divers_technique: '🛠', mobilier: '🧰', structurel: '🏚',
  souris: '🐭', guepes: '🐝', frelons: '🐝', fourmis: '🐜', moustiques: '🦟',
  literie: '🛏', nettoyage: '🧽', vaisselle: '🍽', poubelle: '🗑', produit_manquant: '🧴',
  autre: '📝'
};

const raisonLabels = {
  materiel_manquant: 'Matériel manquant',
  client_absent: 'Client absent',
  intervention_impossible: 'Intervention impossible',
  attente_fournisseur: 'Attente fournisseur',
  autre: 'Autre raison'
};

export default function SuiviIntervention() {
  const navigate = useNavigate();
  const [step, setStep] = useState('type'); // type, categorie, numero, suivi
  const [hebergementType, setHebergementType] = useState(null); // 'emplacement' ou 'logement'
  const [selectedCategorie, setSelectedCategorie] = useState(null);
  const [selectedNumero, setSelectedNumero] = useState(null);
  const [expandedIncidents, setExpandedIncidents] = useState({});
  const [accessDenied, setAccessDenied] = useState(false);

  // Récupérer les données du séjour du client
  const userData = {
    nom: sessionStorage.getItem('user_nom'),
    prenom: sessionStorage.getItem('user_prenom'),
    dateArrivee: sessionStorage.getItem('user_date_arrivee'),
    dateDepart: sessionStorage.getItem('user_date_depart')
  };

  useEffect(() => {
    const lang = sessionStorage.getItem('user_language');
    if (!lang) {
      navigate(createPageUrl('ChoixLangue'));
    }
  }, [navigate]);

  // Requête des incidents pour l'hébergement sélectionné
  const { data: incidents = [], isLoading, refetch } = useQuery({
    queryKey: ['suivi-incidents', selectedNumero, hebergementType],
    queryFn: async () => {
      if (!selectedNumero) return [];
      
      const field = hebergementType === 'emplacement' ? 'emplacement' : 'logement';
      const allIncidents = await base44.entities.Incident.filter(
        { [field]: selectedNumero },
        '-date_saisie',
        100
      );
      
      return allIncidents;
    },
    enabled: !!selectedNumero && step === 'suivi',
    refetchInterval: 10000 // Mise à jour automatique toutes les 10 secondes
  });

  // Filtrer les incidents par dates de séjour
  const filteredIncidents = incidents.filter(incident => {
    if (!userData.dateArrivee || !userData.dateDepart || !incident.date_saisie) {
      return true; // Si pas de dates de séjour, afficher tout (mode admin/test)
    }
    
    try {
      const incidentDate = parseISO(incident.date_saisie);
      const arrivee = parseISO(userData.dateArrivee);
      const depart = parseISO(userData.dateDepart);
      
      return isWithinInterval(incidentDate, { start: arrivee, end: depart });
    } catch {
      return false;
    }
  });

  // Vérification de sécurité
  const checkAccess = () => {
    // Si le client a des données de séjour mais aucun incident correspondant
    if (userData.dateArrivee && userData.dateDepart && incidents.length > 0 && filteredIncidents.length === 0) {
      setAccessDenied(true);
      return false;
    }
    setAccessDenied(false);
    return true;
  };

  useEffect(() => {
    if (step === 'suivi' && incidents.length > 0) {
      checkAccess();
    }
  }, [incidents, step]);

  // Séparer interventions en cours et résolues
  const activeIncidents = filteredIncidents.filter(i => i.statut !== 'resolu');
  const resolvedIncidents = filteredIncidents.filter(i => i.statut === 'resolu');

  const toggleExpand = (id) => {
    setExpandedIncidents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectNumero = (numero) => {
    setSelectedNumero(numero);
    setStep('suivi');
  };

  const getStatusConfig = (statut) => {
    switch (statut) {
      case 'en_attente':
        return { color: 'bg-yellow-500', icon: Send, label: 'Demande envoyée', textColor: 'text-yellow-600' };
      case 'en_cours':
        return { color: 'bg-blue-500', icon: Play, label: 'En cours', textColor: 'text-blue-600' };
      case 'en_attente_materiel':
        return { color: 'bg-purple-500', icon: Pause, label: 'En attente', textColor: 'text-purple-600' };
      case 'resolu':
        return { color: 'bg-green-500', icon: CheckCircle, label: 'Résolu', textColor: 'text-green-600' };
      default:
        return { color: 'bg-gray-500', icon: Clock, label: statut, textColor: 'text-gray-600' };
    }
  };

  const renderTimeline = (incident) => {
    const steps = [];
    const status = getStatusConfig(incident.statut);

    // Étape 1: Demande envoyée
    steps.push({
      status: 'completed',
      color: 'bg-yellow-500',
      icon: Send,
      title: 'Demande envoyée',
      date: incident.date_saisie,
      details: (
        <div className="text-sm space-y-1">
          <p><span className="font-medium">Client:</span> {incident.client_prenom} {incident.client_nom}</p>
          <p><span className="font-medium">Description:</span> {incident.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-xl">{categoryEmojis[incident.categorie]}</span>
            {incident.urgent && <Badge className="bg-red-500 text-white text-xs">⚠️ Urgent</Badge>}
          </div>
        </div>
      )
    });

    // Étape 2: Prise en charge
    if (incident.pris_par && incident.date_debut) {
      steps.push({
        status: 'completed',
        color: 'bg-orange-500',
        icon: User,
        title: 'Prise en charge',
        date: incident.date_debut,
        details: (
          <p className="text-sm">Collaborateur: <span className="font-medium">{incident.pris_par}</span></p>
        )
      });
    }

    // Étape 3: En cours
    if (incident.statut === 'en_cours') {
      steps.push({
        status: 'active',
        color: 'bg-blue-500',
        icon: Play,
        title: 'En cours',
        date: null,
        details: (
          <p className="text-sm text-blue-600">L'intervention est en cours de traitement...</p>
        )
      });
    }

    // Étape 4: En attente
    if (incident.statut === 'en_attente_materiel') {
      steps.push({
        status: 'active',
        color: 'bg-purple-500',
        icon: Pause,
        title: 'En attente',
        date: incident.attente_date,
        details: (
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Raison:</span> {raisonLabels[incident.attente_raison] || incident.attente_raison}</p>
            {incident.attente_materiel && (
              <p className="text-red-600"><span className="font-medium">Matériel manquant:</span> {incident.attente_materiel_detail}</p>
            )}
            {incident.attente_delai && (
              <p><span className="font-medium">Délai estimé:</span> {incident.attente_delai}</p>
            )}
          </div>
        )
      });
    }

    // Étape 5: Résolu
    if (incident.statut === 'resolu') {
      const duree = incident.date_debut && incident.date_resolution
        ? Math.round((new Date(incident.date_resolution) - new Date(incident.date_debut)) / 60000)
        : null;
      
      steps.push({
        status: 'completed',
        color: 'bg-green-500',
        icon: CheckCircle,
        title: 'Résolu',
        date: incident.date_resolution,
        details: (
          <div className="text-sm space-y-2">
            <p><span className="font-medium">Intervenant:</span> {incident.pris_par}</p>
            {duree && <p><span className="font-medium">Temps de traitement:</span> {duree} min</p>}
            {!incident.note_client && (
              <Link 
                to={`${createPageUrl('Avis')}?id=${incident.id}`}
                className="inline-flex items-center gap-1 text-[#00AEEF] hover:underline font-medium"
              >
                <Star className="w-4 h-4" />
                Donner votre avis
              </Link>
            )}
            {incident.note_client && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Votre note:</span>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < incident.note_client ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
            )}
          </div>
        )
      });
    }

    return steps;
  };

  // Rendu de l'écran d'accès refusé
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md border-2 border-red-300 rounded-xl">
          <CardContent className="p-6 text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="font-heading text-xl text-red-600 mb-2">Accès non autorisé</h2>
            <p className="font-body text-gray-600 mb-4">
              Vous ne pouvez pas accéder au suivi de cet hébergement.<br/>
              Veuillez vérifier votre sélection ou contacter l'accueil.
            </p>
            <Button
              onClick={() => { setStep('type'); setSelectedNumero(null); setAccessDenied(false); }}
              className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading"
            >
              Retour à la sélection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-[#00AEEF] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (step === 'suivi') { setStep('numero'); setSelectedNumero(null); }
                else if (step === 'numero') { setStep('categorie'); setSelectedCategorie(null); }
                else if (step === 'categorie') { setStep('type'); setHebergementType(null); }
                else navigate(createPageUrl('Home'));
              }}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-xl">Suivi d'intervention</h1>
              {selectedNumero && (
                <p className="text-white/80 text-sm font-body">{selectedNumero}</p>
              )}
            </div>
          </div>
          <Search className="w-8 h-8" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Étape 1: Choix du type */}
        {step === 'type' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <Logo className="h-20 mx-auto mb-4" />
              <h2 className="font-handwritten text-3xl text-[#0077A8]">Suivre une intervention</h2>
              <p className="font-body text-gray-600 mt-2">Sélectionnez votre type d'hébergement</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card
                onClick={() => { setHebergementType('emplacement'); setStep('categorie'); }}
                className="cursor-pointer border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-lg transition-all rounded-xl"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-heading text-[#0077A8]">Emplacement</h3>
                  <p className="text-xs text-gray-500 font-body">Camping / Tente</p>
                </CardContent>
              </Card>

              <Card
                onClick={() => { setHebergementType('logement'); setStep('categorie'); }}
                className="cursor-pointer border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-lg transition-all rounded-xl"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Home className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-heading text-[#0077A8]">Hébergement</h3>
                  <p className="text-xs text-gray-500 font-body">Mobil-home / Cottage</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Étape 2: Choix de la catégorie */}
        {step === 'categorie' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="font-heading text-xl text-[#0077A8] mb-4">
              {hebergementType === 'emplacement' ? 'Type d\'emplacement' : 'Type d\'hébergement'}
            </h2>

            <div className="grid gap-3">
              {Object.keys(hebergementType === 'emplacement' ? emplacements : logements).map((cat) => (
                <Card
                  key={cat}
                  onClick={() => { setSelectedCategorie(cat); setStep('numero'); }}
                  className="cursor-pointer border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-md transition-all rounded-xl"
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hebergementType === 'emplacement' ? (
                        <MapPin className="w-5 h-5 text-green-600" />
                      ) : (
                        <Home className="w-5 h-5 text-blue-600" />
                      )}
                      <span className="font-heading text-[#0077A8]">{cat}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Étape 3: Choix du numéro */}
        {step === 'numero' && selectedCategorie && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="font-heading text-xl text-[#0077A8] mb-4">
              Sélectionnez votre numéro
            </h2>
            <p className="text-sm text-gray-600 font-body mb-4">Catégorie: {selectedCategorie}</p>

            <Select onValueChange={handleSelectNumero}>
              <SelectTrigger className="w-full h-14 border-2 border-[#00AEEF]/30 rounded-xl text-lg font-heading">
                <SelectValue placeholder="Choisir un numéro" />
              </SelectTrigger>
              <SelectContent>
                {(hebergementType === 'emplacement' ? emplacements : logements)[selectedCategorie]?.map((num) => (
                  <SelectItem key={num} value={num} className="text-lg">
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {/* Étape 4: Affichage du suivi */}
        {step === 'suivi' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="font-heading text-xl text-[#0077A8] mb-2">Aucune intervention</h3>
                <p className="font-body text-gray-600">
                  Aucune intervention n'est enregistrée pour cet hébergement pendant votre séjour.
                </p>
              </div>
            ) : (
              <>
                {/* Interventions actives */}
                {activeIncidents.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-heading text-lg text-[#0077A8] flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#FFA500]" />
                      Interventions en cours ({activeIncidents.length})
                    </h3>
                    
                    {activeIncidents.map((incident) => (
                      <Card key={incident.id} className="border-2 border-[#00AEEF] rounded-xl overflow-hidden">
                        <CardContent className="p-0">
                          {/* Header de l'intervention */}
                          <div className="bg-[#00AEEF]/10 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{categoryEmojis[incident.categorie]}</span>
                              <div>
                                <Badge className={`${getStatusConfig(incident.statut).color} text-white`}>
                                  {getStatusConfig(incident.statut).label}
                                </Badge>
                                {incident.urgent && (
                                  <Badge className="bg-red-500 text-white ml-2">Urgent</Badge>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 font-body">
                              {incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM HH:mm')}
                            </span>
                          </div>

                          {/* Timeline */}
                          <div className="p-4">
                            <div className="relative">
                              {renderTimeline(incident).map((step, index, arr) => (
                                <div key={index} className="flex gap-4 mb-4 last:mb-0">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center ${step.status === 'active' ? 'animate-pulse' : ''}`}>
                                      <step.icon className="w-5 h-5 text-white" />
                                    </div>
                                    {index < arr.length - 1 && (
                                      <div className={`w-0.5 flex-1 mt-2 ${step.status === 'completed' ? 'bg-gray-300' : 'bg-gray-200'}`} />
                                    )}
                                  </div>
                                  <div className="flex-1 pb-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className={`font-heading ${step.status === 'active' ? step.color.replace('bg-', 'text-') : 'text-gray-700'}`}>
                                        {step.title}
                                      </h4>
                                      {step.date && (
                                        <span className="text-xs text-gray-400">
                                          {format(new Date(step.date), 'dd/MM HH:mm', { locale: fr })}
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1 text-gray-600">{step.details}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Interventions résolues */}
                {resolvedIncidents.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-heading text-lg text-gray-500 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Interventions résolues ({resolvedIncidents.length})
                    </h3>
                    
                    {resolvedIncidents.map((incident) => {
                      const isExpanded = expandedIncidents[incident.id];
                      return (
                        <Card key={incident.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          <CardContent className="p-0">
                            <button
                              onClick={() => toggleExpand(incident.id)}
                              className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{categoryEmojis[incident.categorie]}</span>
                                <div className="text-left">
                                  <Badge className="bg-green-500 text-white text-xs">Résolu</Badge>
                                  <p className="text-sm text-gray-500 font-body mt-1">
                                    {incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM/yyyy', { locale: fr })}
                                  </p>
                                </div>
                              </div>
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 pt-0 border-t">
                                    {renderTimeline(incident).map((step, index, arr) => (
                                      <div key={index} className="flex gap-4 mb-3 last:mb-0">
                                        <div className="flex flex-col items-center">
                                          <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center`}>
                                            <step.icon className="w-4 h-4 text-white" />
                                          </div>
                                          {index < arr.length - 1 && (
                                            <div className="w-0.5 flex-1 mt-1 bg-gray-200" />
                                          )}
                                        </div>
                                        <div className="flex-1 pb-2">
                                          <h4 className="font-heading text-sm text-gray-600">{step.title}</h4>
                                          <div className="mt-1 text-gray-500 text-xs">{step.details}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}