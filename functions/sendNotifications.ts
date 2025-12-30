import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_id, recipient_emails, custom_title, custom_body, related_order_id } = await req.json();

    // Get template if provided
    let template = null;
    if (template_id) {
      template = await base44.asServiceRole.entities.NotificationTemplate.filter({ id: template_id });
      template = template[0];
    }

    const title = custom_title || template?.title || 'Notification';
    const body = custom_body || template?.body || '';
    const icon = template?.icon || '🔔';
    const actions = template?.actions || [];

    // Send notification to each recipient
    const sent = [];
    for (const email of recipient_emails) {
      const notification = await base44.asServiceRole.entities.SentNotification.create({
        template_id: template_id || null,
        recipient_email: email,
        title,
        body,
        icon,
        actions,
        status: 'sent',
        sent_date: new Date().toISOString(),
        related_order_id: related_order_id || null
      });
      sent.push(notification);
    }

    return Response.json({ 
      success: true, 
      sent_count: sent.length,
      notifications: sent
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});