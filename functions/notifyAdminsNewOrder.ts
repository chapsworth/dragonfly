import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, order_number, customer_name, customer_email, customer_phone, delivery_address, total, items_count, items } = await req.json();

    // Get all admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');

    if (admins.length === 0) {
      return Response.json({ success: true, message: 'No admins to notify' });
    }

    // Send email to each admin
    const emailPromises = admins.map(admin => 
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `🎉 New Order #${order_number}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #10b981; border-bottom: 3px solid #10b981; padding-bottom: 10px;">
              🎉 New Order Received!
            </h1>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #059669; margin-top: 0;">Order #${order_number}</h2>
              <p style="margin: 8px 0;"><strong>Total:</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">$${total.toFixed(2)}</span></p>
              <p style="margin: 8px 0;"><strong>Items:</strong> ${items_count}</p>
            </div>

            <div style="background: #ffffff; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="color: #059669; margin-top: 0;">Customer Information</h3>
              <p style="margin: 8px 0;"><strong>Name:</strong> ${customer_name}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${customer_email}" style="color: #10b981;">${customer_email}</a></p>
              <p style="margin: 8px 0;"><strong>Phone:</strong> <a href="tel:${customer_phone}" style="color: #10b981;">${customer_phone || 'Not provided'}</a></p>
              <p style="margin: 8px 0;"><strong>Delivery Address:</strong><br>${delivery_address}</p>
            </div>

            ${items && items.length > 0 ? `
            <div style="background: #ffffff; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="color: #059669; margin-top: 0;">Order Items</h3>
              ${items.map(item => `
                <div style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <p style="margin: 4px 0; font-weight: bold;">${item.name} ${item.variant ? `(${item.variant})` : ''}</p>
                  <p style="margin: 4px 0; color: #666;">Qty: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}</p>
                </div>
              `).join('')}
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/AdminOrders" 
                 style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px;">
                📦 View Order in Dashboard
              </a>
            </div>

            <p style="color: #666; text-align: center;">
              Click the button above to manage this order in your admin dashboard.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center;">
              <p>This is an automated notification from your Dragonfly delivery system.</p>
            </div>
          </div>
        `
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ 
      success: true, 
      message: `Notified ${admins.length} admin(s)` 
    });
  } catch (error) {
    console.error('Error notifying admins:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});