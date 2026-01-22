import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTranslation } from '../components/translations';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  ArrowLeft,
  MapPin,
  Home,
  ChevronRight,
  Search,
  Clock,
  User,
  CheckCircle,
  Play,
  Pause,
  Send,
  Star,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldAlert,
  History
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { createPageUrl } from '../utils';
import { emplacements, logements } from '../components/accommodationData';
import ClientInterventionChat from '../components/ClientInterventionChat';
import ETAEstimation from '../components/ETAEstimation';
import InterventionTimeline from '../components/suivi/InterventionTimeline';

const categoryEmojis = {
  gaz: '🔥',
  eau: '💧',
  electricite: '⚡',
  plomberie: '🔧',
  espace_vert: '🌿',
  divers_technique: '🛠',
  mobilier: '🧰',
  structurel: '🏚',
  souris: '🐭',
  guepes: '🐝',
  frelons: '🐝',
  fourmis: '🐜',
  moustiques: '🦟',
  literie: '🛏',
  nettoyage: '🧽',
  vaisselle: '🍽',
  poubelle: '🗑',
  produit_manquant: '🧴',
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
  const [sejourTermine, setSejourTermine] = useState(false);

  const userData = {
    nom: sessionStorage.getItem('user_nom'),
    prenom: sessionStorage.getItem('user_prenom'),
    dateArrivee: sessionStorage.getItem('user_date_arrivee'),
    dateDepart: sessionStorage.getItem('user_date_depart'),
    stayId: sessionStorage.getItem('stay_id')
  };

  const isSejourTermine = () => {
    if (!userData.dateDepart) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const depart = new Date(userData.dateDepart);
    depart.setHours(23, 59, 59, 999);
    return today > depart;
  };

  useEffect(() => {
    const savedLang = sessionStorage.getItem('user_language');
    if (!savedLang) {
      navigate(createPageUrl('ChoixLangue'));
      return;
    }

    if (isSejourTermine()) {
      setSejourTermine(true);
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

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['suivi-incidents', userData.stayId, selectedNumero],
    queryFn: async () => {
      if (userData.stayId) {
        const byStay = await base44.entities.Incident.filter(
          { stay_id: userData.stayId },
          '-date_saisie',
          200
        );
        if (byStay.length) return byStay;
      }

      if (!selectedNumero || !userData.nom || !userData.prenom) return [];

      const field = hebergementType === 'emplacement' ? 'emplacement' : 'logement';
      const byLogement = await base44.entities.Incident.filter(
        { [field]: selectedNumero },
        '-date_saisie',
        100
      );

      return byLogement.filter(i =>
        i.client_nom?.toLowerCase() === userData.nom.toLowerCase() &&
        i.client_prenom?.toLowerCase() === userData.prenom.toLowerCase()
      );
    },
    enabled: step === 'suivi'
  });

  const activeIncidents = incidents.filter(i => i.statut !== 'resolu');
  const resolvedIncidents = incidents.filter(i => i.statut === 'resolu');

  const toggleExpand = id =>
    setExpandedIncidents(p => ({ ...p, [id]: !p[id] }));

  const handleSelectNumero = numero => {
    setSelectedNumero(numero);
    setStep('suivi');
  };

  const getStatusConfig = statut => {
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

  /* ------------------------------------------------------------------ */
  /* ------------------------------ UI -------------------------------- */
  /* ------------------------------------------------------------------ */

  if (sejourTermine) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl mb-2">{t('sejour_termine')}</h2>
            <Link to={createPageUrl('Home')}>
              <Button className="w-full mt-4">
                <Home className="w-4 h-4 mr-2" />
                {t('retour_accueil')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-[#00AEEF] text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(createPageUrl('Home'))}>
            <ArrowLeft />
          </button>
          <h1 className="text-xl">{t('suivi_title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-gray-300" />
            <p className="mt-4">{t('aucun_signalement')}</p>
          </div>
        ) : (
          <Tabs defaultValue="current">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="current">
                {t('en_cours')} ({activeIncidents.length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                {t('resolu')} ({resolvedIncidents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              {activeIncidents.map(incident => (
                <Card key={incident.id} className="mb-4">
                  <CardContent className="p-4">
                    <Badge className={getStatusConfig(incident.statut).color}>
                      {getStatusConfig(incident.statut).label}
                    </Badge>

                    <ETAEstimation incident={incident} />

                    <ClientInterventionChat
                      incident={incident}
                      clientNom={`${userData.prenom} ${userData.nom}`}
                    />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="resolved">
              {resolvedIncidents.map(incident => (
                <Card key={incident.id} className="mb-3">
                  <CardContent className="p-4">
                    <CheckCircle className="text-green-500 mb-2" />
                    {t('resolu')}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}