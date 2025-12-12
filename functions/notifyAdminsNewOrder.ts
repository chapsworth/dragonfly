import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, order_number, customer_name, total, items_count } = await req.json();

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
              New Order Received!
            </h1>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h2 style="color: #059669; margin-top: 0;">Order Details</h2>
              <p><strong>Order #:</strong> ${order_number}</p>
              <p><strong>Customer:</strong> ${customer_name}</p>
              <p><strong>Items:</strong> ${items_count}</p>
              <p><strong>Total:</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">$${total.toFixed(2)}</span></p>
            </div>
            
            <p style="color: #666;">
              Log in to your admin dashboard to view and manage this order.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
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