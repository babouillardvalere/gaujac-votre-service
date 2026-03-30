import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();
    const { event, data } = payload;

    // Déclenché quand un WorkItem est supprimé ou marqué deleted_at
    const workItemId = data?.id || event?.entity_id;
    if (!workItemId) {
      return Response.json({ message: 'No workitem_id', deleted: 0 });
    }

    // Trouver toutes les notifications liées à ce WorkItem
    const allNotifs = await base44.asServiceRole.entities.Notification.filter({}, '-created_date', 500);
    const orphans = allNotifs.filter(n => n.metadata?.workitem_id === workItemId);

    if (orphans.length === 0) {
      return Response.json({ message: 'No orphan notifications', deleted: 0 });
    }

    // Supprimer les notifications orphelines
    await Promise.all(
      orphans.map(n => base44.asServiceRole.entities.Notification.delete(n.id).catch(() => {}))
    );

    console.log(`[cleanupOrphanNotifications] ✅ Supprimé ${orphans.length} notifications pour WorkItem ${workItemId}`);
    return Response.json({ message: 'OK', deleted: orphans.length });

  } catch (error) {
    console.error('[cleanupOrphanNotifications] Erreur:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});