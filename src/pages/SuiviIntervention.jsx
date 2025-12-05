import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, MapPin, Home, ChevronRight, Search, Clock, User, 
  CheckCircle, Play, Pause, Send, Star, ChevronDown, ChevronUp,
  Loader2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createPageUrl } from '../utils';
import { emplacements, logements } from '../components/accommodationData';

const categoryEmojis = {
  gaz: '🔥', eau: '💧', electricite: '⚡', plomberie: '🔧',
  espace_vert: '🌿', divers_technique: '🛠', mobilier: '🧰', structurel: '🏚',
  souris: '🐭', guepes: '🐝', frelons: '🐝', fourmis: '🐜', moustiques: '🦟',
  literie: '🛏', nettoyage: '🧽', vaisselle: '🍽', poubelle: '🗑', produit_manquant: '🧴',
  autre: '📝'
};

export default function SuiviIntervention() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [step, setStep] = useState('type');
  const [hebergementType, setHebergementType] = useState(null);
  const [selectedCategorie, setSelectedCategorie] = useState(null);
  const [selectedNumero, setSelectedNumero] = useState(null);
  const [expandedIncidents, setExpandedIncidents] = useState({});
  const [accessDenied, setAccessDenied] = useState(false);

  const userData = {
    nom: sessionStorage.getItem('user_nom'),
    prenom: sessionStorage.getItem('user_prenom'),
    dateArrivee: sessionStorage.getItem('user_date_arrivee'),
    dateDepart: sessionStorage.getItem('user_date_depart')
  };

  useEffect(() => {
    const savedLang = sessionStorage.getItem('user_language');
    if (!savedLang) {
      navigate(createPageUrl('ChoixLangue'));
      return;
    }

    const savedType = sessionStorage.getItem('hebergement_type');
    const savedCategorie = sessionStorage.getItem('hebergement_categorie');
    const savedNumero = sessionStorage.getItem('hebergement_numero');

    if (savedType && savedNumero) {
      setHebergementType(savedType === 'Emplacement' ? 'emplacement' : 'logement');
      setSelectedCategorie(savedCategorie);
      setSelectedNumero(savedNumero);
      setStep('suivi');
    }
  }, [navigate]);

  const { data: incidents = [], isLoading, refetch } = useQuery({
    queryKey: ['suivi-incidents', selectedNumero, hebergementType],
    queryFn: async () => {
      if (!selectedNumero) return [];
      const field = hebergementType === 'emplacement' ? 'emplacement' : 'logement';
      return await base44.entities.Incident.filter({ [field]: selectedNumero }, '-date_saisie', 100);
    },
    enabled: !!selectedNumero && step === 'suivi',
    refetchInterval: 10000
  });

  const filteredIncidents = incidents.filter(incident => {
    if (!userData.dateArrivee || !userData.dateDepart || !incident.date_saisie) return true;
    try {
      const incidentDate = parseISO(incident.date_saisie);
      const arrivee = parseISO(userData.dateArrivee);
      const depart = parseISO(userData.dateDepart);
      return isWithinInterval(incidentDate, { start: arrivee, end: depart });
    } catch {
      return false;
    }
  });

  const checkAccess = () => {
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

  const activeIncidents = filteredIncidents.filter(i => i.statut !== 'resolu');
  const resolvedIncidents = filteredIncidents.filter(i => i.statut === 'resolu');

  const toggleExpand = (id) => {
    setExpandedIncidents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectNumero = (numero) => {
    setSelectedNumero(numero);
    setStep('suivi');
  };

  const getRaisonLabel = (raison) => {
    const labels = {
      materiel_manquant: t('raison_materiel_manquant'),
      client_absent: t('raison_client_absent'),
      intervention_impossible: t('raison_intervention_impossible'),
      attente_fournisseur: t('raison_attente_fournisseur'),
      autre: t('raison_autre')
    };
    return labels[raison] || raison;
  };

  const getStatusConfig = (statut) => {
    switch (statut) {
      case 'en_attente':
        return { color: 'bg-yellow-500', icon: Send, label: t('demande_envoyee') };
      case 'en_cours':
        return { color: 'bg-blue-500', icon: Play, label: t('en_cours') };
      case 'en_attente_materiel':
        return { color: 'bg-purple-500', icon: Pause, label: t('en_attente') };
      case 'resolu':
        return { color: 'bg-green-500', icon: CheckCircle, label: t('resolu') };
      default:
        return { color: 'bg-gray-500', icon: Clock, label: statut };
    }
  };

  const renderTimeline = (incident) => {
    const steps = [];

    steps.push({
      status: 'completed',
      color: 'bg-yellow-500',
      icon: Send,
      title: t('demande_envoyee'),
      date: incident.date_saisie,
      details: (
        <div className="text-sm space-y-1">
          <p><span className="font-medium">{t('client_label')}:</span> {incident.client_prenom} {incident.client_nom}</p>
          <p><span className="font-medium">{t('description')}:</span> {incident.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-xl">{categoryEmojis[incident.categorie]}</span>
            {incident.urgent && <Badge className="bg-red-500 text-white text-xs">⚠️ {t('urgent_label')}</Badge>}
          </div>
        </div>
      )
    });

    if (incident.pris_par && incident.date_debut) {
      steps.push({
        status: 'completed',
        color: 'bg-orange-500',
        icon: User,
        title: t('prise_en_charge'),
        date: incident.date_debut,
        details: <p className="text-sm">{t('collaborateur_label')}: <span className="font-medium">{incident.pris_par}</span></p>
      });
    }

    if (incident.statut === 'en_cours') {
      steps.push({
        status: 'active',
        color: 'bg-blue-500',
        icon: Play,
        title: t('en_cours'),
        date: null,
        details: <p className="text-sm text-blue-600">{t('intervention_en_cours')}</p>
      });
    }

    if (incident.statut === 'en_attente_materiel' || incident.motif_attente) {
      steps.push({
        status: incident.statut === 'en_attente_materiel' ? 'active' : 'completed',
        color: 'bg-[#FFA500]',
        icon: Pause,
        title: '🟨 Intervention en attente',
        date: incident.attente_date,
        details: (
          <div className="text-sm space-y-1">
            {incident.motif_attente && (
              <p className="text-[#FFA500] font-medium">⏳ Raison : {incident.motif_attente}</p>
            )}
            {!incident.motif_attente && incident.attente_raison && (
              <p><span className="font-medium">{t('raison_attente')}:</span> {getRaisonLabel(incident.attente_raison)}</p>
            )}
            {incident.attente_materiel && (
              <p className="text-red-600"><span className="font-medium">{t('materiel_manquant')}:</span> {incident.attente_materiel_detail}</p>
            )}
            {incident.attente_delai && <p><span className="font-medium">{t('delai_estime')}:</span> {incident.attente_delai}</p>}
          </div>
        )
      });
    }

    if (incident.statut === 'resolu') {
      const dureeTotal = incident.temps_total_intervention || (incident.date_saisie && incident.date_resolution
        ? Math.round((new Date(incident.date_resolution) - new Date(incident.date_saisie)) / 60000)
        : null);
      const dureeIntervention = incident.date_debut && incident.date_resolution
        ? Math.round((new Date(incident.date_resolution) - new Date(incident.date_debut)) / 60000)
        : null;
      
      const formatDuree = (mins) => {
        if (mins < 60) return `${mins} ${t('min')}`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h${m}min` : `${h}h`;
      };
      
      steps.push({
        status: 'completed',
        color: 'bg-green-500',
        icon: CheckCircle,
        title: t('resolu'),
        date: incident.date_resolution,
        details: (
          <div className="text-sm space-y-2">
            <p><span className="font-medium">{t('intervenant')}:</span> {incident.pris_par}</p>
            {dureeTotal && <p><span className="font-medium">⏱ Durée totale:</span> {formatDuree(dureeTotal)}</p>}
            {dureeIntervention && <p className="text-xs text-gray-500">Intervention: {formatDuree(dureeIntervention)}</p>}
            {!incident.note_client && (
              <Link to={`${createPageUrl('Avis')}?id=${incident.id}`} className="inline-flex items-center gap-1 text-[#00AEEF] hover:underline font-medium">
                <Star className="w-4 h-4" />
                {t('donner_avis_link')}
              </Link>
            )}
            {incident.note_client && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{t('votre_note')}:</span>
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

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pb-24">
        <Card className="max-w-md border-2 border-red-300 rounded-xl">
          <CardContent className="p-6 text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="font-heading text-xl text-red-600 mb-2">{t('acces_refuse')}</h2>
            <p className="font-body text-gray-600 mb-4">{t('acces_refuse_detail')}</p>
            <Button
              onClick={() => { setStep('type'); setSelectedNumero(null); setAccessDenied(false); }}
              className="bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading"
            >
              {t('retour_selection')}
            </Button>
          </CardContent>
        </Card>
        
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-20">
          <div className="max-w-2xl mx-auto">
            <Link to={createPageUrl('Home')}>
              <Button className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading shadow-lg">
                <Home className="w-5 h-5 mr-2" />
                {t('retour_accueil')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" role="main" aria-label="Suivi de votre intervention">
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
              <h1 className="font-heading text-xl">{t('suivi_title')}</h1>
              {selectedNumero && <p className="text-white/80 text-sm font-body">{selectedNumero}</p>}
            </div>
          </div>
          <Search className="w-8 h-8" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 'type' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <Logo className="h-20 mx-auto mb-4" />
              <h2 className="font-handwritten text-3xl text-[#0077A8]">{t('suivi_title')}</h2>
              <p className="font-body text-gray-600 mt-2">{t('selectionner_hebergement')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card onClick={() => { setHebergementType('emplacement'); setStep('categorie'); }} className="cursor-pointer border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-lg transition-all rounded-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-heading text-[#0077A8]">{t('emplacement')}</h3>
                  <p className="text-xs text-gray-500 font-body">{t('camping_tente')}</p>
                </CardContent>
              </Card>

              <Card onClick={() => { setHebergementType('logement'); setStep('categorie'); }} className="cursor-pointer border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-lg transition-all rounded-xl">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Home className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-heading text-[#0077A8]">{t('logement')}</h3>
                  <p className="text-xs text-gray-500 font-body">{t('mobilhome_cottage')}</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {step === 'categorie' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="font-heading text-xl text-[#0077A8] mb-4">
              {hebergementType === 'emplacement' ? t('type_emplacement') : t('type_hebergement')}
            </h2>
            <div className="grid gap-3">
              {Object.keys(hebergementType === 'emplacement' ? emplacements : logements).map((cat) => (
                <Card key={cat} onClick={() => { setSelectedCategorie(cat); setStep('numero'); }} className="cursor-pointer border-2 border-[#00AEEF]/30 hover:border-[#00AEEF] hover:shadow-md transition-all rounded-xl">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hebergementType === 'emplacement' ? <MapPin className="w-5 h-5 text-green-600" /> : <Home className="w-5 h-5 text-blue-600" />}
                      <span className="font-heading text-[#0077A8]">{cat}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'numero' && selectedCategorie && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="font-heading text-xl text-[#0077A8] mb-4">{t('select_numero')}</h2>
            <p className="text-sm text-gray-600 font-body mb-4">{t('categorie')}: {selectedCategorie}</p>
            <Select onValueChange={handleSelectNumero}>
              <SelectTrigger className="w-full h-14 border-2 border-[#00AEEF]/30 rounded-xl text-lg font-heading">
                <SelectValue placeholder={t('choisir_numero')} />
              </SelectTrigger>
              <SelectContent>
                {(hebergementType === 'emplacement' ? emplacements : logements)[selectedCategorie]?.map((num) => (
                  <SelectItem key={num} value={num} className="text-lg">{num}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {step === 'suivi' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="font-heading text-xl text-[#0077A8] mb-2">{t('aucun_signalement')}</h3>
                <p className="font-body text-gray-600">{t('aucun_signalement_detail')}</p>
              </div>
            ) : (
              <>
                {activeIncidents.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-heading text-lg text-[#0077A8] flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#FFA500]" />
                      {t('interventions_en_cours')} ({activeIncidents.length})
                    </h3>
                    
                    {activeIncidents.map((incident) => (
                      <Card key={incident.id} className="border-2 border-[#00AEEF] rounded-xl overflow-hidden">
                        <CardContent className="p-0">
                          <div className="bg-[#00AEEF]/10 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{categoryEmojis[incident.categorie]}</span>
                              <div>
                                <Badge className={`${getStatusConfig(incident.statut).color} text-white`}>
                                  {getStatusConfig(incident.statut).label}
                                </Badge>
                                {incident.urgent && <Badge className="bg-red-500 text-white ml-2">🚨 {t('urgent_label')}</Badge>}
                                {incident.priorite_bureau > 0 && <Badge className="bg-purple-500 text-white ml-2">⭐ Prioritaire</Badge>}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 font-body">
                              {incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM HH:mm')}
                            </span>
                          </div>

                          <div className="p-4">
                            <div className="relative">
                              {renderTimeline(incident).map((step, index, arr) => (
                                <div key={index} className="flex gap-4 mb-4 last:mb-0">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center ${step.status === 'active' ? 'animate-pulse' : ''}`}>
                                      <step.icon className="w-5 h-5 text-white" />
                                    </div>
                                    {index < arr.length - 1 && <div className={`w-0.5 flex-1 mt-2 ${step.status === 'completed' ? 'bg-gray-300' : 'bg-gray-200'}`} />}
                                  </div>
                                  <div className="flex-1 pb-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-heading text-gray-700">{step.title}</h4>
                                      {step.date && <span className="text-xs text-gray-400">{format(new Date(step.date), 'dd/MM HH:mm', { locale: fr })}</span>}
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

                {resolvedIncidents.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-heading text-lg text-gray-500 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      {t('interventions_resolues')} ({resolvedIncidents.length})
                    </h3>
                    
                    {resolvedIncidents.map((incident) => {
                      const isExpanded = expandedIncidents[incident.id];
                      return (
                        <Card key={incident.id} className="border border-gray-200 rounded-xl overflow-hidden">
                          <CardContent className="p-0">
                            <button onClick={() => toggleExpand(incident.id)} className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{categoryEmojis[incident.categorie]}</span>
                                <div className="text-left">
                                  <Badge className="bg-green-500 text-white text-xs">{t('resolu')}</Badge>
                                  <p className="text-sm text-gray-500 font-body mt-1">
                                    {incident.date_saisie && format(new Date(incident.date_saisie), 'dd/MM/yyyy', { locale: fr })}
                                  </p>
                                </div>
                              </div>
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="p-4 pt-0 border-t">
                                    {renderTimeline(incident).map((step, index, arr) => (
                                      <div key={index} className="flex gap-4 mb-3 last:mb-0">
                                        <div className="flex flex-col items-center">
                                          <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center`}>
                                            <step.icon className="w-4 h-4 text-white" />
                                          </div>
                                          {index < arr.length - 1 && <div className="w-0.5 flex-1 mt-1 bg-gray-200" />}
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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-20">
        <div className="max-w-2xl mx-auto">
          <Link to={createPageUrl('Home')}>
            <Button className="w-full h-12 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl font-heading shadow-lg">
              <Home className="w-5 h-5 mr-2" />
              {t('retour_accueil')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}