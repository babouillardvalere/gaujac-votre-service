import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInMinutes } from 'date-fns';
import { getNotificationPriority, PRIORITY_LEVELS } from './notificationBatching';

export function useNotifications() {
  // Interventions en attente (nouvelles) - polling à 30s au lieu de 10s
  const { data: pendingIncidents = [] } = useQuery({
    queryKey: ['notif-pending'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente' }, '-date_saisie', 100),
    refetchInterval: 30000 // 30 secondes au lieu de 10
  });

  // Interventions urgentes - polling à 15s (plus rapide pour les urgences)
  const { data: urgentIncidents = [] } = useQuery({
    queryKey: ['notif-urgent'],
    queryFn: () => base44.entities.Incident.filter({ urgent: true, statut: 'en_attente' }, '-date_saisie', 50),
    refetchInterval: 15000 // 15 secondes pour les urgences
  });

  // Interventions en attente matériel - polling à 60s (moins urgent)
  const { data: waitingIncidents = [] } = useQuery({
    queryKey: ['notif-waiting'],
    queryFn: () => base44.entities.Incident.filter({ statut: 'en_attente_materiel' }, '-attente_date', 50),
    refetchInterval: 60000 // 60 secondes
  });

  // Interventions récemment résolues (moins de 30 min) - polling à 60s
  const { data: recentlyResolved = [] } = useQuery({
    queryKey: ['notif-resolved'],
    queryFn: async () => {
      const resolved = await base44.entities.Incident.filter({ statut: 'resolu' }, '-date_resolution', 20);
      return resolved.filter(i => i.date_resolution && differenceInMinutes(new Date(), new Date(i.date_resolution)) < 30);
    },
    refetchInterval: 60000 // 60 secondes
  });

  // Nouveaux avis (moins de 30 min) - polling à 60s
  const { data: recentAvis = [] } = useQuery({
    queryKey: ['notif-avis'],
    queryFn: async () => {
      const avis = await base44.entities.Avis.list('-created_date', 20);
      return avis.filter(a => a.created_date && differenceInMinutes(new Date(), new Date(a.created_date)) < 30);
    },
    refetchInterval: 60000 // 60 secondes
  });

  // Alertes stock - polling à 120s (peu urgent)
  const { data: stockAlerts = [] } = useQuery({
    queryKey: ['notif-stock'],
    queryFn: async () => {
      const stock = await base44.entities.Stock.list();
      return stock.filter(s => s.quantite <= s.seuil_alerte);
    },
    refetchInterval: 120000 // 120 secondes (2 minutes)
  });

  // Tâches urgentes ou en retard - polling à 60s
  const { data: urgentTaches = [] } = useQuery({
    queryKey: ['notif-taches'],
    queryFn: async () => {
      const taches = await base44.entities.Tache.filter({ statut: 'a_faire' }, '-date_echeance', 50);
      const now = new Date();
      return taches.filter(t => {
        if (t.priorite === 'urgente') return true;
        if (t.date_echeance && new Date(t.date_echeance) < now) return true;
        if (t.date_echeance && (new Date(t.date_echeance) - now) < 24 * 60 * 60 * 1000) return true;
        return false;
      });
    },
    refetchInterval: 60000 // 60 secondes
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
    pendingIncidents: sortedIncidents, // Retourner les incidents triés
    urgentIncidents,
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