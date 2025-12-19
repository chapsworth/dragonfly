import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active automation rules
    const rules = await base44.asServiceRole.entities.AutomationRule.filter({ is_active: true });

    const results = [];

    for (const rule of rules) {
      try {
        let triggered = [];

        // Birthday automations
        if (rule.trigger_type === 'birthday') {
          const today = new Date();
          const todayMD = `${today.getMonth() + 1}-${today.getDate()}`;
          
          const contacts = await base44.asServiceRole.entities.Contact.list();
          triggered = contacts.filter(c => {
            if (!c.birthday) return false;
            const bday = new Date(c.birthday);
            const bdayMD = `${bday.getMonth() + 1}-${bday.getDate()}`;
            return bdayMD === todayMD;
          });
        }

        // Inactive customer automations (win-back)
        if (rule.trigger_type === 'inactive_customer') {
          const daysSince = parseInt(rule.trigger_value) || 30;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysSince);
          
          const contacts = await base44.asServiceRole.entities.Contact.filter({ type: 'customer' });
          triggered = contacts.filter(c => {
            if (!c.last_order_date) return false;
            return new Date(c.last_order_date) < cutoffDate;
          });
        }

        // Deal stage automations
        if (rule.trigger_type === 'deal_stage') {
          const deals = await base44.asServiceRole.entities.Deal.filter({ stage: rule.trigger_value });
          
          // Check if enough time has passed
          const now = new Date();
          triggered = deals.filter(d => {
            if (!d.last_activity) return true;
            const lastActivity = new Date(d.last_activity);
            const hoursSince = (now - lastActivity) / (1000 * 60 * 60);
            return hoursSince >= (rule.delay_hours || 0);
          });
        }

        // Perform actions
        for (const target of triggered.slice(0, 10)) { // Limit to 10 per run
          if (rule.action_type === 'send_text' && target.phone) {
            // Log the text that would be sent
            results.push({
              rule: rule.name,
              action: 'text',
              to: target.phone,
              message: rule.message_template
            });
          } else if (rule.action_type === 'send_email' && target.email) {
            // Send email using Core.SendEmail
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: target.email,
              subject: rule.name,
              body: rule.message_template
            });
            results.push({
              rule: rule.name,
              action: 'email_sent',
              to: target.email
            });
          } else if (rule.action_type === 'add_points' && target.email) {
            // Award points
            const points = parseInt(rule.trigger_value) || 100;
            await base44.asServiceRole.entities.PointsTransaction.create({
              user_email: target.email,
              points,
              transaction_type: 'bonus',
              description: rule.name
            });
            results.push({
              rule: rule.name,
              action: 'points_added',
              to: target.email,
              points
            });
          }
        }

        // Update last run
        await base44.asServiceRole.entities.AutomationRule.update(rule.id, {
          last_run: new Date().toISOString()
        });

      } catch (ruleError) {
        console.error(`Error processing rule ${rule.name}:`, ruleError);
        results.push({
          rule: rule.name,
          error: ruleError.message
        });
      }
    }

    return Response.json({
      success: true,
      processed: rules.length,
      results
    });

  } catch (error) {
    console.error('Process automations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});