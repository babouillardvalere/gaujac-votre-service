import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2, Calendar, Filter, TrendingUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import RapportPDFGenerator from './RapportPDFGenerator';

export default function BureauRapports({ lang = 'fr' }) {
  const queryClient = useQueryClient();
  
  const [periodeType, setPeriodeType] = useState('HEBDOMADAIRE');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [portee, setPortee] = useState('GLOBALE');
  const [filtreService, setFiltreService] = useState('');
  const [filtreCollaborateur, setFiltreCollaborateur] = useState('');
  const [filtreHebergement, setFiltreHebergement] = useState('');
  const [rapportEnCours, setRapportEnCours] = useState(null);

  // Raccourcis de période
  const setPeriodeCourante = () => {
    const today = new Date();
    if (periodeType === 'HEBDOMADAIRE') {
      setDateDebut(format(startOfWeek(today, { locale: fr }), 'yyyy-MM-dd'));
      setDateFin(format(endOfWeek(today, { locale: fr }), 'yyyy-MM-dd'));
    } else {
      setDateDebut(format(startOfMonth(today), 'yyyy-MM-dd'));
      setDateFin(format(endOfMonth(today), 'yyyy-MM-dd'));
    }
  };

  const setPeriodePrecedente = () => {
    const today = new Date();
    if (periodeType === 'HEBDOMADAIRE') {
      const prevWeek = subWeeks(today, 1);
      setDateDebut(format(startOfWeek(prevWeek, { locale: fr }), 'yyyy-MM-dd'));
      setDateFin(format(endOfWeek(prevWeek, { locale: fr }), 'yyyy-MM-dd'));
    } else {
      const prevMonth = subMonths(today, 1);
      setDateDebut(format(startOfMonth(prevMonth), 'yyyy-MM-dd'));
      setDateFin(format(endOfMonth(prevMonth), 'yyyy-MM-dd'));
    }
  };

  // Récupérer les collaborateurs et hébergements pour les filtres
  const { data: workItems = [] } = useQuery({
    queryKey: ['bureau-workitems-rapports'],
    queryFn: () => base44.entities.WorkItem.list('-created_date', 500)
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['bureau-incidents-rapports'],
    queryFn: () => base44.entities.Incident.list('-created_date', 500)
  });

  const collaborateurs = [...new Set([
    ...workItems.map(w => w.collaborateur).filter(Boolean),
    ...incidents.map(i => i.pris_par).filter(Boolean)
  ])];

  const hebergements = [...new Set([
    ...workItems.map(w => w.hebergement).filter(Boolean),
    ...incidents.map(i => i.logement || i.emplacement).filter(Boolean)
  ])];

  const genererRapportMutation = useMutation({
    mutationFn: async (config) => {
      if (!config.dateDebut || !config.dateFin) {
        throw new Error('Période obligatoire');
      }

      // Charger toutes les données nécessaires
      const [
        workItemsData,
        interventionsClientData,
        incidentsData,
        avisInterventionsData,
        avisAppData
      ] = await Promise.all([
        base44.entities.WorkItem.filter({
          created_date: { $gte: new Date(config.dateDebut).toISOString() }
        }, '-created_date', 1000),
        base44.entities.InterventionClient.filter({
          created_date: { $gte: new Date(config.dateDebut).toISOString() }
        }, '-created_date', 1000),
        base44.entities.Incident.filter({
          date_saisie: { $gte: new Date(config.dateDebut).toISOString() }
        }, '-date_saisie', 1000),
        base44.entities.Avis.filter({
          created_date: { $gte: new Date(config.dateDebut).toISOString() }
        }, '-created_date', 500),
        base44.entities.AvisApplication.filter({
          created_date: { $gte: new Date(config.dateDebut).toISOString() }
        }, '-created_date', 500)
      ]);

      // Filtrer par date de fin
      const dateFinTimestamp = new Date(config.dateFin + 'T23:59:59').getTime();
      
      const workItemsFiltered = workItemsData.filter(w => 
        new Date(w.created_date).getTime() <= dateFinTimestamp
      );
      
      const interventionsClientFiltered = interventionsClientData.filter(i => 
        new Date(i.created_date).getTime() <= dateFinTimestamp
      );
      
      const incidentsFiltered = incidentsData.filter(i => 
        new Date(i.date_saisie).getTime() <= dateFinTimestamp
      );

      const avisInterventionsFiltered = avisInterventionsData.filter(a => 
        new Date(a.created_date).getTime() <= dateFinTimestamp
      );

      const avisAppFiltered = avisAppData.filter(a => 
        new Date(a.created_date).getTime() <= dateFinTimestamp
      );

      // Appliquer les filtres de portée
      let workItemsFinal = workItemsFiltered;
      let incidentsFinal = incidentsFiltered;
      
      if (config.portee === 'SERVICE' && config.filtreService) {
        workItemsFinal = workItemsFinal.filter(w => w.service === config.filtreService);
        incidentsFinal = incidentsFinal.filter(i => i.type === config.filtreService.toLowerCase());
      }
      
      if (config.portee === 'COLLABORATEUR' && config.filtreCollaborateur) {
        workItemsFinal = workItemsFinal.filter(w => w.collaborateur === config.filtreCollaborateur);
        incidentsFinal = incidentsFinal.filter(i => i.pris_par === config.filtreCollaborateur);
      }
      
      if (config.portee === 'HEBERGEMENT' && config.filtreHebergement) {
        workItemsFinal = workItemsFinal.filter(w => w.hebergement === config.filtreHebergement);
        incidentsFinal = incidentsFinal.filter(i => 
          (i.logement || i.emplacement) === config.filtreHebergement
        );
      }

      // Créer l'objet rapport
      const rapport = {
        config,
        metadata: {
          genere_le: new Date().toISOString(),
          genere_par: 'BUREAU',
          periode_type: config.periodeType,
          date_debut: config.dateDebut,
          date_fin: config.dateFin,
          portee: config.portee
        },
        sections: {
          interventions: {
            workItems: workItemsFinal,
            interventionsClient: interventionsClientFiltered,
            incidents: incidentsFinal
          },
          temps: calculateTemps(workItemsFinal, incidentsFinal),
          hebergements: calculateHebergements(workItemsFinal, incidentsFinal),
          avis: {
            interventions: avisInterventionsFiltered,
            application: avisAppFiltered,
            synthese: calculateAvisSynthese(avisInterventionsFiltered, avisAppFiltered)
          },
          synthese: calculateSyntheseDirection(
            workItemsFinal,
            incidentsFinal,
            avisInterventionsFiltered,
            avisAppFiltered
          )
        }
      };

      return rapport;
    },
    onSuccess: (rapport) => {
      setRapportEnCours(rapport);
      toast.success('📊 Rapport généré avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    }
  });

  const handleGenerer = () => {
    genererRapportMutation.mutate({
      periodeType,
      dateDebut,
      dateFin,
      portee,
      filtreService,
      filtreCollaborateur,
      filtreHebergement
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-300">
        <CardHeader>
          <CardTitle className="font-heading text-purple-700 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {lang === 'fr' ? 'Génération de Rapports' : 'Generate Reports'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélection période */}
          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
            <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Périodicité et dates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-bold mb-2 block">Type de période</label>
                <Select value={periodeType} onValueChange={setPeriodeType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HEBDOMADAIRE">📅 Hebdomadaire</SelectItem>
                    <SelectItem value="MENSUEL">📆 Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={setPeriodeCourante} variant="outline" className="flex-1">
                  Période courante
                </Button>
                <Button onClick={setPeriodePrecedente} variant="outline" className="flex-1">
                  Période précédente
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold mb-2 block">Date début *</label>
                <Input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold mb-2 block">Date fin *</label>
                <Input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sélection portée */}
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Portée du rapport
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {['GLOBALE', 'SERVICE', 'COLLABORATEUR', 'HEBERGEMENT'].map(p => (
                <Button
                  key={p}
                  onClick={() => {
                    setPortee(p);
                    if (p === 'GLOBALE') {
                      setFiltreService('');
                      setFiltreCollaborateur('');
                      setFiltreHebergement('');
                    }
                  }}
                  variant={portee === p ? 'default' : 'outline'}
                  className={portee === p ? 'bg-blue-600' : ''}
                >
                  {p === 'GLOBALE' ? '🌍 Globale' :
                   p === 'SERVICE' ? '🔧 Service' :
                   p === 'COLLABORATEUR' ? '👤 Collaborateur' :
                   '🏠 Hébergement'}
                </Button>
              ))}
            </div>

            {/* Filtres conditionnels */}
            {portee === 'SERVICE' && (
              <div>
                <label className="text-sm font-bold mb-2 block">Service</label>
                <Select value={filtreService} onValueChange={setFiltreService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TECHNIQUE">🧰 Technique</SelectItem>
                    <SelectItem value="MENAGE">🧽 Ménage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {portee === 'COLLABORATEUR' && (
              <div>
                <label className="text-sm font-bold mb-2 block">Collaborateur</label>
                <Select value={filtreCollaborateur} onValueChange={setFiltreCollaborateur}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un collaborateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborateurs.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {portee === 'HEBERGEMENT' && (
              <div>
                <label className="text-sm font-bold mb-2 block">Hébergement</label>
                <Select value={filtreHebergement} onValueChange={setFiltreHebergement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un hébergement" />
                  </SelectTrigger>
                  <SelectContent>
                    {hebergements.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Bouton génération */}
          <Button
            onClick={handleGenerer}
            disabled={!dateDebut || !dateFin || genererRapportMutation.isPending}
            className="w-full bg-purple-600 h-14 text-lg font-bold"
          >
            {genererRapportMutation.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
            ) : (
              <TrendingUp className="w-6 h-6 mr-2" />
            )}
            Générer le rapport
          </Button>
        </CardContent>
      </Card>

      {/* Aperçu du rapport */}
      {rapportEnCours && (
        <RapportPDFGenerator rapport={rapportEnCours} lang={lang} />
      )}
    </div>
  );
}

// Fonctions de calcul
function calculateTemps(workItems, incidents) {
  const tempsByCollaborateur = {};
  
  [...workItems, ...incidents].forEach(item => {
    const collaborateur = item.collaborateur || item.pris_par;
    if (!collaborateur) return;
    
    if (!tempsByCollaborateur[collaborateur]) {
      tempsByCollaborateur[collaborateur] = {
        total_interventions: 0,
        total_temps: 0
      };
    }
    
    tempsByCollaborateur[collaborateur].total_interventions++;
    const temps = item.duree_minutes || item.temps_total_intervention || 0;
    tempsByCollaborateur[collaborateur].total_temps += temps;
  });
  
  return Object.entries(tempsByCollaborateur).map(([collaborateur, data]) => ({
    collaborateur,
    ...data,
    moyenne: data.total_interventions > 0 ? 
      Math.round(data.total_temps / data.total_interventions) : 0
  }));
}

function calculateHebergements(workItems, incidents) {
  const hebByHebergement = {};
  
  [...workItems, ...incidents].forEach(item => {
    const hebergement = item.hebergement || item.logement || item.emplacement;
    if (!hebergement) return;
    
    if (!hebByHebergement[hebergement]) {
      hebByHebergement[hebergement] = {
        categorie: item.type_hebergement || item.type,
        services: new Set()
      };
    }
    
    const service = item.service || item.type;
    if (service) hebByHebergement[hebergement].services.add(service);
  });
  
  return Object.entries(hebByHebergement).map(([numero, data]) => ({
    numero,
    categorie: data.categorie,
    services: Array.from(data.services).join(', ')
  }));
}

function calculateAvisSynthese(avisInterventions, avisApp) {
  const synthese = {
    interventions: {
      count: avisInterventions.length,
      moyenne_globale: 0,
      moyennes: {}
    },
    application: {
      count: avisApp.length,
      moyenne_globale: 0,
      moyennes: {}
    }
  };
  
  if (avisInterventions.length > 0) {
    const sum = avisInterventions.reduce((acc, a) => acc + (a.note_client || 0), 0);
    synthese.interventions.moyenne_globale = (sum / avisInterventions.length).toFixed(1);
  }
  
  if (avisApp.length > 0) {
    const avgFacilite = avisApp.reduce((acc, a) => acc + (a.facilite_utilisation || 0), 0) / avisApp.length;
    const avgSuivi = avisApp.reduce((acc, a) => acc + (a.suivi_interventions || 0), 0) / avisApp.length;
    synthese.application.moyennes = {
      facilite: avgFacilite.toFixed(1),
      suivi: avgSuivi.toFixed(1)
    };
  }
  
  return synthese;
}

function calculateSyntheseDirection(workItems, incidents, avisInterventions, avisApp) {
  const totalInterventions = workItems.length + incidents.length;
  const totalTemps = [...workItems, ...incidents].reduce((acc, item) => 
    acc + (item.duree_minutes || item.temps_total_intervention || 0), 0
  );
  
  const servicesSollicites = {};
  [...workItems, ...incidents].forEach(item => {
    const service = item.service || item.type;
    servicesSollicites[service] = (servicesSollicites[service] || 0) + 1;
  });
  
  const servicePlusSollicite = Object.entries(servicesSollicites)
    .sort((a, b) => b[1] - a[1])[0];
  
  return {
    total_interventions: totalInterventions,
    total_temps_minutes: totalTemps,
    service_plus_sollicite: servicePlusSollicite ? servicePlusSollicite[0] : 'N/A',
    taux_satisfaction: avisInterventions.length > 0 ? 
      (avisInterventions.reduce((acc, a) => acc + (a.note_client || 0), 0) / avisInterventions.length).toFixed(1) : 'N/A'
  };
}