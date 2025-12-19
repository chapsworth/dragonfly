import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all products
    const products = await base44.asServiceRole.entities.Product.list();

    // Find low stock products
    const lowStock = products.filter(p => 
      p.stock_quantity <= p.low_stock_threshold && p.published
    );

    if (lowStock.length === 0) {
      return Response.json({
        success: true,
        message: 'No low stock items',
        low_stock: []
      });
    }

    // Get admin users
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter(u => u.role === 'admin');

    // Send email to each admin
    for (const admin of admins) {
      const emailBody = `
🚨 Low Stock Alert

The following products are running low:

${lowStock.map(p => `• ${p.name}: ${p.stock_quantity} left (threshold: ${p.low_stock_threshold})`).join('\n')}

Please restock these items soon to avoid running out.

- Dragonfly System
      `;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `⚠️ ${lowStock.length} Product(s) Low in Stock`,
        body: emailBody
      });
    }

    return Response.json({
      success: true,
      low_stock: lowStock.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock_quantity,
        threshold: p.low_stock_threshold
      })),
      notified_admins: admins.length
    });

  } catch (error) {
    console.error('Check low stock error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});