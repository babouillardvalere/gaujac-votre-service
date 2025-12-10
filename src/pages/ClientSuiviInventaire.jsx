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
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ClientSuiviInventaire() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch {
        navigate(createPageUrl('Home'));
      }
    };
    checkAuth();
  }, [navigate]);

  // Récupérer UNIQUEMENT les suivis du client connecté
  const { data: suivis = [], isLoading } = useQuery({
    queryKey: ['suivis-inventaire', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      // FILTRAGE STRICT : uniquement les suivis créés par cet email
      return base44.entities.SuiviInventaire.filter(
        { created_by: currentUser.email },
        '-created_date',
        50
      );
    },
    enabled: !!currentUser
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
            📋 {lang === 'fr' ? 'Mon Suivi Inventaire' : 'My Inventory Tracking'}
          </h1>

          {suivis.length === 0 ? (
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
          ) : (
            <div className="space-y-4">
              {suivis.map(suivi => {
                const totalItems = (suivi.items_menage?.length || 0) + (suivi.items_technique?.length || 0);
                const serviceMenageConfig = getStatutConfig(suivi.statut_menage);
                const serviceTechniqueConfig = getStatutConfig(suivi.statut_technique);
                const ServiceMenageIcon = serviceMenageConfig.icon;
                const ServiceTechniqueIcon = serviceTechniqueConfig.icon;

                return (
                  <Card key={suivi.id} className="border-2 border-[#00AEEF]/30 rounded-xl">
                    <CardContent className="p-6">
                      {/* En-tête */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="font-heading text-xl text-[#0077A8] mb-1">
                            {lang === 'fr' ? 'Inventaire' : 'Inventory'} {suivi.type_inventaire === 'ARRIVEE' 
                              ? (lang === 'fr' ? 'd\'arrivée' : 'on arrival')
                              : (lang === 'fr' ? 'de départ' : 'on departure')}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {format(new Date(suivi.created_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                        <Badge className="bg-[#FFD700] text-[#0077A8]">
                          {suivi.logement}
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