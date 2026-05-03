import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity_type } = await req.json();

    let data = [];
    let filename = 'export.csv';
    let headers = [];

    if (entity_type === 'contacts') {
      data = await base44.entities.Contact.list();
      filename = 'contacts.csv';
      headers = ['Full Name', 'Email', 'Phone', 'Company', 'Type', 'Stage', 'Total Orders', 'Total Spent', 'Last Order Date', 'Address', 'City', 'State', 'ZIP', 'Notes'];
      
      const csvRows = data.map(c => [
        c.full_name || '',
        c.email || '',
        c.phone || '',
        c.company || '',
        c.type || '',
        c.stage || '',
        c.total_orders || 0,
        c.total_spent || 0,
        c.last_order_date || '',
        c.address || '',
        c.city || '',
        c.state || '',
        c.zip || '',
        (c.notes || '').replace(/\n/g, ' ')
      ]);

      const csv = [headers, ...csvRows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });

    } else if (entity_type === 'orders') {
      data = await base44.entities.Order.list();
      filename = 'orders.csv';
      headers = ['Order ID', 'Customer Name', 'Customer Email', 'Phone', 'Total', 'Status', 'Date', 'Address'];
      
      const csvRows = data.map(o => [
        o.id,
        o.customer_name || '',
        o.customer_email || '',
        o.customer_phone || '',
        o.total || 0,
        o.status || '',
        o.created_date || '',
        o.delivery_address || ''
      ]);

      const csv = [headers, ...csvRows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });

    } else if (entity_type === 'products') {
      data = await base44.entities.Product.list();
      filename = 'products.csv';
      headers = ['Name', 'Category', 'Price', 'Stock', 'THC%', 'CBD%', 'Type', 'SKU', 'Published'];
      
      const csvRows = data.map(p => [
        p.name || '',
        p.category || '',
        p.price || 0,
        p.stock_quantity || 0,
        p.thc_level || '',
        p.cbd_level || '',
        p.strain_type || '',
        p.sku || '',
        p.published ? 'Yes' : 'No'
      ]);

      const csv = [headers, ...csvRows].map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    return Response.json({ error: 'Invalid entity type' }, { status: 400 });

  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});