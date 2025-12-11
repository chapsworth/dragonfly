import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product } = await req.json();

    if (!product) {
      return Response.json({ error: 'Product data required' }, { status: 400 });
    }

    // Get admin users to notify
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter(u => u.role === 'admin');

    // Send email to all admins
    for (const admin of admins) {
      await base44.integrations.Core.SendEmail({
        to: admin.email,
        subject: `🚨 Low Stock Alert: ${product.name}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Low Stock Alert</h2>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
              <h3 style="margin: 0 0 8px 0; color: #92400e;">⚠️ Stock Running Low</h3>
              <p style="margin: 0; color: #78350f;">The following product needs restocking:</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #059669;">${product.name}</h3>
              <p style="margin: 8px 0;"><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Category:</strong> ${product.category}</p>
              <p style="margin: 8px 0;"><strong>Current Stock:</strong> <span style="color: #dc2626; font-weight: bold;">${product.stock_quantity || 0} units</span></p>
              <p style="margin: 8px 0;"><strong>Low Stock Threshold:</strong> ${product.low_stock_threshold || 10} units</p>
              <p style="margin: 8px 0;"><strong>Price:</strong> $${product.price}</p>
            </div>

            ${product.variants?.length > 0 ? `
              <div style="margin: 20px 0;">
                <h4 style="color: #059669; margin-bottom: 12px;">Variant Stock Levels:</h4>
                <ul style="list-style: none; padding: 0;">
                  ${product.variants.map(v => `
                    <li style="padding: 8px; background-color: #f3f4f6; margin: 4px 0; border-radius: 4px;">
                      <strong>${v.name}:</strong> ${v.stock_quantity || 0} units
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
            
            <p style="margin-top: 20px; color: #6b7280;">
              Please restock this item as soon as possible to avoid running out.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
              <p>This is an automated alert from your inventory management system.</p>
            </div>
          </div>
        `
      });
    }

    return Response.json({ 
      success: true,
      message: `Alert sent to ${admins.length} admin(s)`
    });

  } catch (error) {
    console.error('Error sending low stock alert:', error);
    return Response.json({ 
      error: error.message || 'Failed to send alert' 
    }, { status: 500 });
  }
});