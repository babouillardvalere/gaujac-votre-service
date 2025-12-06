import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '../components/translations';
import Logo from '../components/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Home, LogIn, LogOut, AlertTriangle, Clock, CheckCircle2, 
  Calendar, Users, Wrench, Sparkles, ArrowRight, Eye, ClipboardCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { format, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardReception() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [selectedDossier, setSelectedDossier] = useState(null);

  // Récupérer les données
  const { data: dossiers = [] } = useQuery({
    queryKey: ['dashboard-dossiers'],
    queryFn: () => base44.entities.DossierArrivee.list('-date_arrivee', 100),
    refetchInterval: 30000
  });

  const { data: departs = [] } = useQuery({
    queryKey: ['dashboard-departs'],
    queryFn: () => base44.entities.DepartCheck.list('-date_soumission', 50),
    refetchInterval: 30000
  });

  const { data: interventions = [] } = useQuery({
    queryKey: ['dashboard-interventions'],
    queryFn: () => base44.entities.Incident.list('-date_saisie', 100),
    refetchInterval: 20000
  });

  // Calculs statistiques
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const arriveesJour = dossiers.filter(d => {
    const dateArr = new Date(d.date_arrivee);
    dateArr.setHours(0, 0, 0, 0);
    return dateArr.getTime() === today.getTime();
  });

  const departsJour = departs.filter(d => {
    const dateDep = new Date(d.date_depart);
    dateDep.setHours(0, 0, 0, 0);
    return dateDep.getTime() === today.getTime();
  });

  const dossiersEnCours = dossiers.filter(d => d.statut === 'en_cours');
  
  const interventionsUrgentes = interventions.filter(i => 
    i.urgent && (i.statut === 'en_attente' || i.statut === 'en_cours')
  );

  const inventairesRecus = dossiers.filter(d => 
    d.inventaire_id && d.statut === 'finalise' && 
    isToday(parseISO(d.date_finalisation || d.updated_date))
  );

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'finalise':
        return <Badge className="bg-green-500 text-white">✅ Finalisé</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-500 text-white">🔄 En cours</Badge>;
      default:
        return <Badge className="bg-gray-400 text-white">⏳ En attente</Badge>;
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(createPageUrl('Reception'))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gray-200 hover:border-[#00AEEF] transition-all shadow-sm"
            >
              <Home className="w-5 h-5 text-[#00AEEF]" />
              <span className="font-heading text-[#0077A8]">Réception</span>
            </button>
            <div className="text-sm text-gray-600">
              {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
            </div>
          </div>

          <Logo className="h-16 mb-6" />

          <h1 className="font-handwritten text-5xl text-[#00AEEF] text-center mb-2">
            📊 Tableau de Bord Réception
          </h1>
          <p className="text-center text-gray-600 font-body mb-8">
            Vue d'ensemble des activités du jour
          </p>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Arrivées du jour */}
            <Card className="border-2 border-green-500/30 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(createPageUrl('Reception') + '?tab=arrivees')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Arrivées aujourd'hui</p>
                    <p className="text-3xl font-heading text-[#0077A8]">{arriveesJour.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Départs du jour */}
            <Card className="border-2 border-orange-500/30 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(createPageUrl('Reception') + '?tab=departs')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Départs aujourd'hui</p>
                    <p className="text-3xl font-heading text-[#0077A8]">{departsJour.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <LogOut className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interventions urgentes */}
            <Card className="border-2 border-red-500/30 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(createPageUrl('Reception') + '?tab=suivi')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Interventions urgentes</p>
                    <p className="text-3xl font-heading text-red-600">{interventionsUrgentes.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dossiers en cours */}
            <Card className="border-2 border-blue-500/30 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(createPageUrl('Reception') + '?tab=arrivees')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dossiers en cours</p>
                    <p className="text-3xl font-heading text-[#0077A8]">{dossiersEnCours.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Arrivées du jour - Détails */}
            <Card className="border-2 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-heading text-[#0077A8]">
                  <LogIn className="w-5 h-5 text-green-600" />
                  Arrivées du jour ({arriveesJour.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {arriveesJour.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Aucune arrivée prévue aujourd'hui
                    </p>
                  ) : (
                    arriveesJour.map(dossier => (
                      <div key={dossier.id} 
                           className="p-4 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-lg text-[#0077A8]">
                              {dossier.numero_logement}
                            </span>
                            {getStatutBadge(dossier.statut)}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDossier(dossier)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="font-body">
                            <strong>Client:</strong> {dossier.client_nom} {dossier.client_prenom}
                          </p>
                          <p className="text-gray-600">
                            <strong>Catégorie:</strong> {dossier.categorie_logement}
                          </p>
                          {dossier.inventaire_id && (
                            <Badge className="bg-blue-500 text-white text-xs">
                              <ClipboardCheck className="w-3 h-3 mr-1" />
                              Inventaire reçu
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Interventions urgentes - Détails */}
            <Card className="border-2 border-red-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-heading text-[#0077A8]">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Interventions urgentes ({interventionsUrgentes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {interventionsUrgentes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Aucune intervention urgente
                    </p>
                  ) : (
                    interventionsUrgentes.map(intervention => (
                      <div key={intervention.id} 
                           className="p-4 bg-red-50 rounded-lg border border-red-200 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {intervention.type === 'technique' ? (
                              <Wrench className="w-4 h-4 text-red-600" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-heading text-[#0077A8]">
                              {intervention.logement}
                            </span>
                            <Badge className="bg-red-600 text-white text-xs">URGENT</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(createPageUrl('Reception') + '?tab=suivi')}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="font-body">
                            <strong>Client:</strong> {intervention.client_nom} {intervention.client_prenom}
                          </p>
                          <p className="text-gray-600 line-clamp-2">
                            {intervention.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(intervention.date_saisie), 'HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventaires reçus aujourd'hui */}
          {inventairesRecus.length > 0 && (
            <Card className="border-2 border-blue-500/30 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-heading text-[#0077A8]">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                  Inventaires reçus aujourd'hui ({inventairesRecus.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inventairesRecus.map(dossier => (
                    <div key={dossier.id} 
                         className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-all cursor-pointer"
                         onClick={() => setSelectedDossier(dossier)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading text-[#0077A8]">{dossier.numero_logement}</span>
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-sm font-body">{dossier.client_nom} {dossier.client_prenom}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(parseISO(dossier.date_finalisation || dossier.updated_date), 'HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions rapides */}
          <Card className="border-2 border-[#00AEEF]/30 mt-6">
            <CardHeader>
              <CardTitle className="text-xl font-heading text-[#0077A8]">
                ⚡ Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => navigate(createPageUrl('Reception') + '?tab=assistance')}
                  className="h-20 flex-col bg-[#00AEEF] hover:bg-[#0077A8]"
                >
                  <Users className="w-6 h-6 mb-1" />
                  <span className="text-sm">Assistance</span>
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl('Reception') + '?tab=arrivees')}
                  className="h-20 flex-col bg-green-600 hover:bg-green-700"
                >
                  <LogIn className="w-6 h-6 mb-1" />
                  <span className="text-sm">Arrivées</span>
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl('Reception') + '?tab=departs')}
                  className="h-20 flex-col bg-orange-600 hover:bg-orange-700"
                >
                  <LogOut className="w-6 h-6 mb-1" />
                  <span className="text-sm">Départs</span>
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl('CalendrierReservations'))}
                  className="h-20 flex-col bg-purple-600 hover:bg-purple-700"
                >
                  <Calendar className="w-6 h-6 mb-1" />
                  <span className="text-sm">Calendrier</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialog détails dossier */}
      <Dialog open={!!selectedDossier} onOpenChange={() => setSelectedDossier(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-[#0077A8]">
              Dossier {selectedDossier?.numero_logement}
            </DialogTitle>
          </DialogHeader>
          {selectedDossier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Client</p>
                  <p className="font-heading">{selectedDossier.client_nom} {selectedDossier.client_prenom}</p>
                </div>
                <div>
                  <p className="text-gray-600">Statut</p>
                  {getStatutBadge(selectedDossier.statut)}
                </div>
                <div>
                  <p className="text-gray-600">Arrivée</p>
                  <p className="font-heading">{format(parseISO(selectedDossier.date_arrivee), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Départ</p>
                  <p className="font-heading">{format(parseISO(selectedDossier.date_depart), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Catégorie</p>
                  <p className="font-body">{selectedDossier.categorie_logement}</p>
                </div>
                <div>
                  <p className="text-gray-600">Code dossier</p>
                  <p className="font-mono text-xs">{selectedDossier.code_dossier}</p>
                </div>
              </div>

              {selectedDossier.inventaire_id && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-heading text-blue-800 mb-1">
                    ✅ Inventaire reçu
                  </p>
                  <p className="text-xs text-gray-600">
                    Contrôle d'inventaire validé par le client
                  </p>
                </div>
              )}

              {(selectedDossier.interventions_menage?.length > 0 || 
                selectedDossier.interventions_technique?.length > 0) && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm font-heading text-orange-800 mb-1">
                    🔔 Interventions créées
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    {selectedDossier.interventions_menage?.length > 0 && (
                      <p>• {selectedDossier.interventions_menage.length} intervention(s) ménage</p>
                    )}
                    {selectedDossier.interventions_technique?.length > 0 && (
                      <p>• {selectedDossier.interventions_technique.length} intervention(s) technique</p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  setSelectedDossier(null);
                  navigate(createPageUrl('Reception') + '?tab=arrivees');
                }}
                className="w-full bg-[#00AEEF] hover:bg-[#0077A8]"
              >
                Voir dans la section Arrivées
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}