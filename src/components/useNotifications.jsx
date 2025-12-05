import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInMinutes } from 'date-fns';

export function useNotifications() {
  // Interventions en attente (nouvelles)
  const { data: pendingIncidents = [] } = useQuery({
    queryKey: ['notif-pending'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente' }, '-date_saisie', 100),
    refetchInterval: 10000
  });

  // Interventions urgentes
  const { data: urgentIncidents = [] } = useQuery({
    queryKey: ['notif-urgent'],
    queryFn: () => base44.entities.Incident.filter({ urgent: true, statut: 'en_attente' }, '-date_saisie', 50),
    refetchInterval: 10000
  });

  // Interventions en attente matériel
  const { data: waitingIncidents = [] } = useQuery({
    queryKey: ['notif-waiting'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente_materiel' }, '-attente_date', 50),
    refetchInterval: 15000
  });

  // Interventions récemment résolues (moins de 30 min)
  const { data: recentlyResolved = [] } = useQuery({
    queryKey: ['notif-resolved'],
    queryFn: async () => {
      const resolved = await base44.entities.Incident.filter({ statut: 'resolu' }, '-date_resolution', 20);
      return resolved.filter(i => i.date_resolution && differenceInMinutes(new Date(), new Date(i.date_resolution)) < 30);
    },
    refetchInterval: 15000
  });

  // Nouveaux avis (moins de 30 min)
  const { data: recentAvis = [] } = useQuery({
    queryKey: ['notif-avis'],
    queryFn: async () => {
      const avis = await base44.entities.Avis.list('-created_date', 20);
      return avis.filter(a => a.created_date && differenceInMinutes(new Date(), new Date(a.created_date)) < 30);
    },
    refetchInterval: 15000
  });

  // Alertes stock
  const { data: stockAlerts = [] } = useQuery({
    queryKey: ['notif-stock'],
    queryFn: async () => {
      const stock = await base44.entities.Stock.list();
      return stock.filter(s => s.quantite <= s.seuil_alerte);
    },
    refetchInterval: 30000
  });

  // Interventions techniques en attente
  const techniqueCount = pendingIncidents.filter(i => i.type === 'technique').length;
  const techniqueUrgent = urgentIncidents.filter(i => i.type === 'technique').length;

  // Interventions ménage en attente
  const menageCount = pendingIncidents.filter(i => i.type === 'menage').length;
  const menageUrgent = urgentIncidents.filter(i => i.type === 'menage').length;

  // Total pour le bureau
  const bureauCount = recentAvis.length + recentlyResolved.length + waitingIncidents.length;

  // Total global
  const totalCount = pendingIncidents.length + recentAvis.length + stockAlerts.length;

  return {
    pendingIncidents,
    urgentIncidents,
    waitingIncidents,
    recentlyResolved,
    recentAvis,
    stockAlerts,
    counts: {
      technique: techniqueCount,
      techniqueUrgent,
      menage: menageCount,
      menageUrgent,
      bureau: bureauCount,
      materiel: waitingIncidents.length + stockAlerts.length,
      total: totalCount,
      hasUrgent: urgentIncidents.length > 0
    }
  };
}