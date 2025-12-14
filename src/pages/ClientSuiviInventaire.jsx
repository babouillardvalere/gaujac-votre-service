import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Logo from '../components/Logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Loader2, Package, Wrench, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SuiviRechercheBar from '../components/suivi/SuiviRechercheBar';
import SuiviTimeline from '../components/suivi/SuiviTimeline';

// Mappings UI → BASE (évite les erreurs de filtrage)
const STATUT_MAP = {
  'EN COURS': 'en_cours',
  'EN ATTENTE': 'en_attente',
  'TERMINÉ': 'termine',
  'RÉSOLU': 'resolu',
  'NON REQUIS': 'non_requis'
};

const SERVICE_MAP = {
  'TECHNIQUE': 'technique',
  'MENAGE': 'menage',
  'MÉNAGE': 'menage',
  'RECEPTION': 'reception'
};

const TYPE_OBJET_MAP = {
  'CASSÉ': 'casse',
  'MANQUANT': 'manquant',
  'SALE': 'sale',
  'INUTILISABLE': 'inutilisable'
};

export default function ClientSuiviInventaire() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    statut: 'tous',
    service: 'tous',
    typeObjet: 'tous',
    dateDebut: '',
    dateFin: ''
  });

  const [searchTriggered, setSearchTriggered] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {
        // Autoriser l'accès sans connexion pour la recherche publique
        setCurrentUser({ email: 'guest' });
      }
    };
    checkAuth();
  }, [navigate]);

  // Charger les suivis UNIQUEMENT après recherche
  const { data: suivis = [], isLoading, refetch } = useQuery({
    queryKey: ['suivis-inventaire', searchTriggered, search, filters.dateDebut, filters.dateFin],
    queryFn: async () => {
      // Ne charger que si une recherche est déclenchée
      if (!searchTriggered) {
        return [];
      }
      
      // Récupérer tous les suivis
      const allSuivis = await base44.entities.SuiviInventaire.list('-created_date', 200);
      
      console.log('Total suivis:', allSuivis.length);
      
      // Filtrer par nom/prénom avec recherche flexible
      const searchLower = search.toLowerCase().trim();
      const filtered = allSuivis.filter(s => {
        const nomComplet = `${s.client_prenom || ''} ${s.client_nom || ''}`.toLowerCase();
        const nomInverse = `${s.client_nom || ''} ${s.client_prenom || ''}`.toLowerCase();
        
        const matchNom = !search || 
                        nomComplet.includes(searchLower) ||
                        nomInverse.includes(searchLower) ||
                        s.client_nom?.toLowerCase().includes(searchLower) ||
                        s.client_prenom?.toLowerCase().includes(searchLower);
        
        // Vérifier les dates de séjour qui chevauchent la période recherchée
        const matchDates = !filters.dateDebut && !filters.dateFin ? true :
                          (!filters.dateDebut || !s.date_arrivee || s.date_arrivee <= filters.dateFin) &&
                          (!filters.dateFin || !s.date_depart || s.date_depart >= filters.dateDebut);
        
        return matchNom && matchDates;
      });
      
      console.log('Suivis filtrés:', filtered.length);
      return filtered;
    },
    enabled: searchTriggered
  });

  // Fonction de recherche
  const handleSearch = () => {
    if (!search) {
      toast.error(lang === 'fr' 
        ? 'Veuillez renseigner un nom/prénom'
        : 'Please provide a name');
      return;
    }
    setSearchTriggered(true);
  };

  // Génération de la timeline depuis les données - UNIQUEMENT les actions réelles
  const generateTimelineFromData = (timeline) => {
    if (!timeline || timeline.length === 0) return [];
    
    // Filtrer les états automatiques ou invalides
    const validEvents = timeline.filter(event => {
      // Rejeter les états fantômes
      const invalidStatus = ['notification', 'en_attente_intervenant', 'urgence'];
      return !invalidStatus.includes(event.status?.toLowerCase());
    });
    
    return validEvents
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(event => ({
        time: format(new Date(event.timestamp), 'dd/MM HH:mm', { locale: fr }),
        status: event.status,
        detail: event.detail || '',
        utilisateur: event.utilisateur
      }));
  };

  // Filtrage des suivis avec mapping strict UI → BASE
  const filteredSuivis = suivis.filter(suivi => {
    // Recherche par nom client ou logement (déjà fait dans queryFn)
    const matchSearch = true;

    // Filtre dates avec parsing correct
    let matchDateDebut = true;
    let matchDateFin = true;
    
    if (filters.dateDebut && suivi.date_arrivee) {
      try {
        const debutFilter = new Date(filters.dateDebut);
        const arrivee = new Date(suivi.date_arrivee);
        matchDateDebut = arrivee >= debutFilter;
      } catch {
        matchDateDebut = true;
      }
    }
    
    if (filters.dateFin && suivi.date_depart) {
      try {
        const finFilter = new Date(filters.dateFin);
        finFilter.setHours(23, 59, 59, 999);
        const depart = new Date(suivi.date_depart);
        matchDateFin = depart <= finFilter;
      } catch {
        matchDateFin = true;
      }
    }

    // Filtre statut avec mapping
    const statutMapped = STATUT_MAP[filters.statut?.toUpperCase()] || filters.statut;
    const matchStatut = filters.statut === 'tous' || 
      statutMapped === suivi.statut_menage || 
      statutMapped === suivi.statut_technique;

    // Filtre service avec mapping
    const serviceMapped = SERVICE_MAP[filters.service?.toUpperCase()] || filters.service;
    const matchService = filters.service === 'tous' || 
      (serviceMapped === 'menage' && suivi.items_menage?.length > 0) ||
      (serviceMapped === 'technique' && suivi.items_technique?.length > 0);

    // Filtre type objet avec mapping et vérification flexible
    const typeObjetMapped = TYPE_OBJET_MAP[filters.typeObjet?.toUpperCase()] || filters.typeObjet;
    const matchTypeObjet = filters.typeObjet === 'tous' || 
      [...(suivi.items_menage || []), ...(suivi.items_technique || [])].some(item => {
        const motif = item.motif?.toLowerCase();
        const targetMotif = typeObjetMapped?.toLowerCase();
        return motif === targetMotif || motif?.includes(targetMotif);
      });

    return matchSearch && matchDateDebut && matchDateFin && matchStatut && matchService && matchTypeObjet;
  });

  const getStatutConfig = (statut) => {
    const configs = {
      en_attente: {
        icon: Clock,
        color: 'bg-orange-100 text-orange-700',
        label: lang === 'fr' ? 'En attente' : 'Pending'
      },
      en_cours: {
        icon: Loader2,
        color: 'bg-blue-100 text-blue-700',
        label: lang === 'fr' ? 'En cours' : 'In progress'
      },
      termine: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700',
        label: lang === 'fr' ? 'Terminé' : 'Completed'
      },
      non_requis: {
        icon: CheckCircle,
        color: 'bg-gray-100 text-gray-500',
        label: lang === 'fr' ? 'Non requis' : 'Not required'
      }
    };
    return configs[statut] || configs.en_attente;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={() => navigate(createPageUrl('ClientMenu'))}
            className="flex items-center gap-2 text-[#0077A8] hover:text-[#00AEEF] mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-heading">{t('retour')}</span>
          </button>

          <Logo className="h-16 mb-4" />
          
          <h1 className="font-handwritten text-3xl text-[#00AEEF] text-center mb-6">
            📋 {lang === 'fr' ? 'Suivi des Interventions' : 'Interventions Tracking'}
          </h1>

          {/* Barre de recherche et filtres */}
          <SuiviRechercheBar 
            search={search}
            setSearch={setSearch}
            filters={filters}
            setFilters={setFilters}
            onSearch={handleSearch}
          />

          {/* Compteur de résultats */}
          {searchTriggered && suivis.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              {filteredSuivis.length} {lang === 'fr' ? 'résultat(s) trouvé(s)' : 'result(s) found'}
            </div>
          )}

          {!searchTriggered ? (
            <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-[#00AEEF]" />
                <p className="text-gray-700 font-heading text-lg mb-2">
                  {lang === 'fr' 
                    ? '🔍 Rechercher un suivi d\'intervention' 
                    : '🔍 Search intervention tracking'}
                </p>
                <p className="text-sm text-gray-500">
                  {lang === 'fr'
                    ? 'Veuillez renseigner votre nom/prénom et les dates de séjour pour consulter vos suivis'
                    : 'Please provide your name and stay dates to view your tracking'}
                </p>
              </CardContent>
            </Card>
          ) : suivis.length === 0 ? (
            <Card className="border-2 border-gray-200 rounded-xl">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-heading">
                  {lang === 'fr' 
                    ? 'Aucun suivi d\'inventaire en cours' 
                    : 'No inventory tracking in progress'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {lang === 'fr'
                    ? 'Les suivis apparaîtront ici si des objets sont signalés lors de vos inventaires'
                    : 'Tracking will appear here if items are reported during your inventories'}
                </p>
              </CardContent>
            </Card>
          ) : filteredSuivis.length === 0 ? (
            <Card className="border-2 border-gray-200 rounded-xl">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-heading">
                  {lang === 'fr' 
                    ? 'Aucun résultat trouvé' 
                    : 'No results found'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {lang === 'fr'
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Try changing your search criteria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSuivis.map(suivi => {
                const totalItems = (suivi.items_menage?.length || 0) + (suivi.items_technique?.length || 0);
                const serviceMenageConfig = getStatutConfig(suivi.statut_menage);
                const serviceTechniqueConfig = getStatutConfig(suivi.statut_technique);
                const ServiceMenageIcon = serviceMenageConfig.icon;
                const ServiceTechniqueIcon = serviceTechniqueConfig.icon;

                return (
                  <Card key={suivi.id} className="border-2 border-[#00AEEF]/30 rounded-xl">
                    <CardContent className="p-6">
                      {/* En-tête avec numéro d'intervention */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="font-heading text-xl text-[#0077A8] mb-1">
                            📌 {lang === 'fr' ? 'Intervention' : 'Intervention'} #{suivi.id?.slice(-4)} – {suivi.logement}
                          </h2>
                          <p className="text-sm text-gray-600">
                            {lang === 'fr' ? 'Client' : 'Guest'}: {suivi.client_nom} {suivi.client_prenom}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(suivi.created_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                        <Badge className="bg-[#FFD700] text-[#0077A8]">
                          {suivi.categorie_logement}
                        </Badge>
                      </div>

                      {/* Infos séjour */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">
                          <strong>{lang === 'fr' ? 'Logement' : 'Accommodation'}:</strong> {suivi.categorie_logement} - {suivi.logement}
                        </p>
                        <p className="text-sm">
                          <strong>{lang === 'fr' ? 'Dates' : 'Dates'}:</strong> {suivi.date_arrivee} → {suivi.date_depart}
                        </p>
                      </div>

                      {/* Objets signalés - MÉNAGE */}
                      {suivi.items_menage && suivi.items_menage.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-pink-600" />
                            <h3 className="font-heading text-[#0077A8]">
                              {lang === 'fr' ? '🧹 Objets ménage' : '🧹 Housekeeping items'}
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {suivi.items_menage.map((item, idx) => (
                              <div key={idx} className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
                                <p className="text-sm font-medium text-gray-800">
                                  {item.label} {item.quantity > 1 && `×${item.quantity}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {lang === 'fr' ? 'Motif' : 'Reason'}: {item.motif}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <ServiceMenageIcon className={`w-4 h-4 ${suivi.statut_menage === 'en_cours' ? 'animate-spin' : ''}`} />
                            <Badge className={serviceMenageConfig.color}>
                              {serviceMenageConfig.label}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Objets signalés - TECHNIQUE */}
                      {suivi.items_technique && suivi.items_technique.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-4 h-4 text-purple-600" />
                            <h3 className="font-heading text-[#0077A8]">
                              {lang === 'fr' ? '🔧 Objets technique' : '🔧 Technical items'}
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {suivi.items_technique.map((item, idx) => (
                              <div key={idx} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-sm font-medium text-gray-800">
                                  {item.label} {item.quantity > 1 && `×${item.quantity}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {lang === 'fr' ? 'Motif' : 'Reason'}: {item.motif}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <ServiceTechniqueIcon className={`w-4 h-4 ${suivi.statut_technique === 'en_cours' ? 'animate-spin' : ''}`} />
                            <Badge className={serviceTechniqueConfig.color}>
                              {serviceTechniqueConfig.label}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Message du service */}
                      {suivi.message_client && (
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                          <p className="text-sm text-gray-700 italic">
                            💬 {suivi.message_client}
                          </p>
                        </div>
                      )}

                      {/* Timeline détaillée - MÉNAGE */}
                      {suivi.items_menage && suivi.items_menage.length > 0 && (
                        <div className="mt-6 p-4 bg-pink-50 rounded-xl border border-pink-200">
                          <h4 className="font-heading text-sm text-pink-800 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            📅 {lang === 'fr' ? 'Chronologie Ménage' : 'Housekeeping Timeline'}
                          </h4>
                          {suivi.timeline_menage && suivi.timeline_menage.length > 0 ? (
                            <SuiviTimeline events={generateTimelineFromData(suivi.timeline_menage)} />
                          ) : (
                            <div className="text-sm text-gray-600 italic flex items-center gap-2">
                              <span>⏳</span>
                              <span>{lang === 'fr' ? 'En attente de prise en charge' : 'Waiting to be taken in charge'}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timeline détaillée - TECHNIQUE */}
                      {suivi.items_technique && suivi.items_technique.length > 0 && (
                        <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                          <h4 className="font-heading text-sm text-purple-800 mb-3 flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            📅 {lang === 'fr' ? 'Chronologie Technique' : 'Technical Timeline'}
                          </h4>
                          {suivi.timeline_technique && suivi.timeline_technique.length > 0 ? (
                            <SuiviTimeline events={generateTimelineFromData(suivi.timeline_technique)} />
                          ) : (
                            <div className="text-sm text-gray-600 italic flex items-center gap-2">
                              <span>⏳</span>
                              <span>{lang === 'fr' ? 'En attente de prise en charge' : 'Waiting to be taken in charge'}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dernière mise à jour */}
                      {suivi.date_derniere_maj && (
                        <p className="text-xs text-gray-400 mt-3">
                          {lang === 'fr' ? 'Dernière mise à jour' : 'Last update'}: {format(new Date(suivi.date_derniere_maj), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Button
            onClick={() => navigate(createPageUrl('ClientMenu'))}
            className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading mt-6"
          >
            {lang === 'fr' ? 'Retour au menu' : 'Back to menu'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}