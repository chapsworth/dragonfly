import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, order_number, customer_name, customer_email, customer_phone, delivery_address, total, items_count, items } = await req.json();

    // Check if EmailTrigger system should handle this
    const triggers = await base44.asServiceRole.entities.EmailTrigger.list();
    const relevantTrigger = triggers.find(t => 
        t.trigger_type === 'order_placed' && 
        t.is_active && 
        t.recipient_type === 'admin'
    );

    if (relevantTrigger && relevantTrigger.template_id) {
        // Use trigger system instead
        const template = await base44.asServiceRole.entities.EmailTemplate.get(relevantTrigger.template_id);
        const allUsers = await base44.asServiceRole.entities.User.list();
        const admins = allUsers.filter(u => u.role === 'admin');
        
        if (template && admins.length > 0) {
            const emailPromises = admins.map(admin => 
                base44.asServiceRole.integrations.Core.SendEmail({
                    from_name: 'Dragonfly',
                    to: admin.email,
                    subject: template.subject,
                    body: template.body.replace('[Customer Name]', customer_name)
                        .replace('[Order Total]', `$${total.toFixed(2)}`)
                        .replace('[Order Items]', `${items_count} item(s)`)
                })
            );
            await Promise.all(emailPromises);
            
            // Update trigger stats
            await base44.asServiceRole.entities.EmailTrigger.update(relevantTrigger.id, {
                last_sent: new Date().toISOString(),
                send_count: (relevantTrigger.send_count || 0) + admins.length
            });
            
            return Response.json({ 
                success: true, 
                via: 'trigger_system',
                admins_notified: admins.length
            });
        }
    }

    // Fallback to legacy system if no trigger configured
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');

    if (admins.length === 0) {
      return Response.json({ success: true, message: 'No admins to notify' });
    }

    const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6937d9495caf111699370601/6d84e9958_IMG_0305.jpeg';
    
    // Send email to each admin
    const emailPromises = admins.map(admin => 
      base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Dragonfly',
        to: admin.email,
        subject: `🎉 New Order #${order_number}`,
        body: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
              <img src="${logoUrl}" alt="Dragonfly" style="width: 80px; height: 80px; margin-bottom: 15px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 New Order Alert!</h1>
              <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 16px;">Order #${order_number}</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px 25px;">
              
              <!-- Order Summary -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 10px; margin: 0 0 25px 0; border-left: 5px solid #10b981;">
                <p style="margin: 0 0 15px 0; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Order Summary</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="color: #065f46; font-size: 16px; font-weight: bold;">Total Amount:</span>
                  <span style="color: #10b981; font-size: 32px; font-weight: bold;">$${total.toFixed(2)}</span>
                </div>
                <p style="margin: 8px 0 0 0; color: #059669;"><strong>Items:</strong> ${items_count} product${items_count > 1 ? 's' : ''}</p>
              </div>

              <!-- Customer Information -->
              <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 0 0 25px 0; border: 1px solid #e5e7eb;">
                <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">👤 Customer Information</h3>
                <p style="margin: 10px 0; color: #374151; line-height: 1.8;">
                  <strong style="color: #059669;">Name:</strong> ${customer_name}<br>
                  <strong style="color: #059669;">Email:</strong> <a href="mailto:${customer_email}" style="color: #10b981; text-decoration: none;">${customer_email}</a><br>
                  <strong style="color: #059669;">Phone:</strong> <a href="tel:${customer_phone}" style="color: #10b981; text-decoration: none;">${customer_phone || 'Not provided'}</a><br>
                  <strong style="color: #059669;">Address:</strong><br>
                  <span style="background: white; padding: 10px; display: inline-block; margin-top: 5px; border-radius: 6px; border-left: 3px solid #10b981;">${delivery_address}</span>
                </p>
              </div>

              ${items && items.length > 0 ? `
              <!-- Order Items -->
              <div style="background: #ffffff; padding: 20px; border-radius: 10px; margin: 0 0 25px 0; border: 1px solid #e5e7eb;">
                <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">📦 Order Items</h3>
                ${items.map(item => `
                  <div style="padding: 15px; margin: 10px 0; background: #f9fafb; border-radius: 8px; border-left: 3px solid #10b981;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; color: #059669; font-size: 15px;">${item.name} ${item.variant ? `<span style="color: #6b7280; font-weight: normal; font-size: 13px;">(${item.variant})</span>` : ''}</p>
                    <p style="margin: 0; color: #374151; font-size: 14px;">
                      <strong>Qty:</strong> ${item.quantity} × <strong>$${item.price.toFixed(2)}</strong> = <span style="color: #10b981; font-weight: bold; font-size: 15px;">$${(item.quantity * item.price).toFixed(2)}</span>
                    </p>
                  </div>
                `).join('')}
              </div>
              ` : ''}
              
              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://mydragonfly.club/AdminOrders" 
                   style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                  📦 View & Manage Order
                </a>
              </div>

              <p style="color: #6b7280; text-align: center; font-size: 13px; margin: 20px 0 0 0;">
                Click the button above to manage this order in your admin dashboard.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 25px; border-top: 3px solid #10b981;">
              <div style="text-align: center; margin-bottom: 15px;">
                <img src="${logoUrl}" alt="Dragonfly" style="width: 40px; height: 40px; opacity: 0.8;">
              </div>
              <p style="text-align: center; color: #374151; font-size: 14px; margin: 10px 0;">
                <strong>Dragonfly Admin</strong><br>
                Premium Cannabis Delivery System
              </p>
              <p style="text-align: center; color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">
                This is an automated notification from your Dragonfly delivery system.<br>
                © 2025 Dragonfly. All rights reserved.
              </p>
            </div>
          </div>
        `
      })
    );

    await Promise.all(emailPromises);

    // Send push notifications to all admin devices
    const deviceTokens = await base44.asServiceRole.entities.DeviceToken.list();
    const adminDevices = deviceTokens.filter(dt => 
      admins.some(admin => admin.email === dt.user_email)
    );

    if (adminDevices.length > 0) {
      const pushPromises = adminDevices.map(device => 
        base44.asServiceRole.functions.invoke('sendPushNotification', {
          device_token: device.device_token,
          platform: device.platform,
          title: '🎉 New Order',
          body: `Order #${order_number} from ${customer_name} - $${total.toFixed(2)}`,
          data: {
            type: 'new_order',
            order_id,
            order_number,
            customer_name,
            total: total.toString(),
            url: '/AdminOrders'
          }
        }).catch(err => console.error('Push notification error:', err))
      );
      
      await Promise.all(pushPromises);
    }

    return Response.json({ 
      success: true, 
      message: `Notified ${admins.length} admin(s) via email and ${adminDevices.length} device(s) via push` 
    });
  } catch (error) {
    console.error('Error notifying admins:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});