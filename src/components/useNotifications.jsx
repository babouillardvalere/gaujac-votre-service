import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInMinutes } from 'date-fns';
import { getNotificationPriority, PRIORITY_LEVELS } from './notificationBatching';

export function useNotifications() {
  // Interventions en attente (nouvelles) - polling réduit + limit
  const { data: pendingIncidents = [] } = useQuery({
    queryKey: ['notif-pending'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente', deleted_at: null }, '-date_saisie', 50),
    refetchInterval: 45000, // 45 secondes
    staleTime: 40000,
  });

  // InterventionClient en attente (contrôles inventaire) - polling à 30s
  const { data: pendingInterventionsClient = [] } = useQuery({
    queryKey: ['notif-pending-client'],
    queryFn: () => base44.entities.InterventionClient.filter({ statut: 'A_FAIRE' }, '-created_date', 100),
    refetchInterval: 30000
  });

  // Interventions urgentes - polling réduit
  const { data: urgentIncidents = [] } = useQuery({
    queryKey: ['notif-urgent'],
    queryFn: () => base44.entities.Incident.filter({ urgent: true, statut: 'en_attente', deleted_at: null }, '-date_saisie', 30),
    refetchInterval: 20000, // 20 secondes
    staleTime: 18000,
  });

  // InterventionClient urgentes
  const { data: urgentInterventionsClient = [] } = useQuery({
    queryKey: ['notif-urgent-client'],
    queryFn: () => base44.entities.InterventionClient.filter({ priorite: 'URGENTE', statut: 'A_FAIRE' }, '-created_date', 50),
    refetchInterval: 15000
  });

  // Interventions en attente matériel - polling très réduit
  const { data: waitingIncidents = [] } = useQuery({
    queryKey: ['notif-waiting'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente_materiel', deleted_at: null }, '-attente_date', 30),
    refetchInterval: 90000, // 90 secondes
    staleTime: 85000,
  });

  // Interventions récemment résolues (moins de 30 min) - polling très réduit
  const { data: recentlyResolved = [] } = useQuery({
    queryKey: ['notif-resolved'],
    queryFn: async () => {
      const resolved = await base44.entities.Incident.filter({ statut: 'resolu', deleted_at: null }, '-date_resolution', 15);
      return resolved.filter(i => i.date_resolution && differenceInMinutes(new Date(), new Date(i.date_resolution)) < 30);
    },
    refetchInterval: 120000, // 2 minutes
    staleTime: 110000,
  });

  // Nouveaux avis (moins de 30 min) - polling très réduit
  const { data: recentAvis = [] } = useQuery({
    queryKey: ['notif-avis'],
    queryFn: async () => {
      const avis = await base44.entities.Avis.list('-created_date', 15);
      return avis.filter(a => a.created_date && differenceInMinutes(new Date(), new Date(a.created_date)) < 30);
    },
    refetchInterval: 120000, // 2 minutes
    staleTime: 110000,
  });

  // Alertes stock - polling très réduit
  const { data: stockAlerts = [] } = useQuery({
    queryKey: ['notif-stock'],
    queryFn: async () => {
      const stock = await base44.entities.Stock.list('-updated_date', 50);
      return stock.filter(s => s.quantite <= s.seuil_alerte);
    },
    refetchInterval: 180000, // 3 minutes
    staleTime: 170000,
  });

  // Tâches urgentes ou en retard - polling très réduit
  const { data: urgentTaches = [] } = useQuery({
    queryKey: ['notif-taches'],
    queryFn: async () => {
      const taches = await base44.entities.Tache.filter({ statut: 'a_faire' }, '-date_echeance', 30);
      const now = new Date();
      return taches.filter(t => {
        if (t.priorite === 'urgente') return true;
        if (t.date_echeance && new Date(t.date_echeance) < now) return true;
        if (t.date_echeance && (new Date(t.date_echeance) - now) < 24 * 60 * 60 * 1000) return true;
        return false;
      });
    },
    refetchInterval: 120000, // 2 minutes
    staleTime: 110000,
  });

  // Trier les incidents par priorité (urgences critiques en haut)
  const sortedIncidents = [...pendingIncidents].sort((a, b) => {
    const priorityA = getNotificationPriority({ metadata: { categorie: a.categorie, urgent: a.urgent } });
    const priorityB = getNotificationPriority({ metadata: { categorie: b.categorie, urgent: b.urgent } });
    return priorityA - priorityB;
  });

  // Compter les urgences critiques (eau, gaz, électricité)
  const criticalCount = sortedIncidents.filter(i => {
    const categorie = i.categorie?.toLowerCase() || '';
    return ['eau', 'gaz', 'electricite', 'eau_plomberie'].includes(categorie);
  }).length;

  // Interventions techniques en attente (Incident + InterventionClient)
  const techniqueCount = pendingIncidents.filter(i => i.type === 'technique').length + 
    pendingInterventionsClient.filter(i => i.service === 'TECHNIQUE').length;
  const techniqueUrgent = urgentIncidents.filter(i => i.type === 'technique').length + 
    urgentInterventionsClient.filter(i => i.service === 'TECHNIQUE').length;

  // Interventions ménage en attente (Incident + InterventionClient)
  const menageCount = pendingIncidents.filter(i => i.type === 'menage').length + 
    pendingInterventionsClient.filter(i => i.service === 'MENAGE').length;
  const menageUrgent = urgentIncidents.filter(i => i.type === 'menage').length + 
    urgentInterventionsClient.filter(i => i.service === 'MENAGE').length;

  // Total pour le bureau
  const bureauCount = recentAvis.length + recentlyResolved.length + waitingIncidents.length;

  // Total global
  const totalCount = pendingIncidents.length + recentAvis.length + stockAlerts.length;

  return {
    pendingIncidents: sortedIncidents, // Retourner les incidents triés
    pendingInterventionsClient,
    urgentIncidents,
    urgentInterventionsClient,
    waitingIncidents,
    recentlyResolved,
    recentAvis,
    stockAlerts,
    urgentTaches,
    counts: {
      technique: techniqueCount,
      techniqueUrgent,
      menage: menageCount,
      menageUrgent,
      bureau: bureauCount,
      materiel: waitingIncidents.length + stockAlerts.length,
      taches: urgentTaches.length,
      total: totalCount + urgentTaches.length,
      critical: criticalCount, // Nouveauté: compteur d'urgences critiques
      hasUrgent: urgentIncidents.length > 0 || urgentTaches.length > 0,
      hasCritical: criticalCount > 0 // Nouveauté: flag urgences critiques
    }
  };
}