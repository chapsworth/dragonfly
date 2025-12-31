import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { vendor_name } = await req.json();

    if (!vendor_name) {
      return Response.json({ error: 'Missing vendor_name' }, { status: 400 });
    }

    // Fetch all products for vendor
    const products = await base44.asServiceRole.entities.VendorProduct.filter({
      vendor_name,
      is_active: true
    });

    // Group products by product_name
    const grouped = {};
    for (const product of products) {
      const key = product.product_name;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(product);
    }

    // Find duplicates and keep lowest price
    const toDelete = [];
    for (const [name, items] of Object.entries(grouped)) {
      if (items.length > 1) {
        // Sort by price ascending
        items.sort((a, b) => a.price - b.price);
        
        // Keep the first (lowest price), delete the rest
        for (let i = 1; i < items.length; i++) {
          toDelete.push(items[i].id);
        }
      }
    }

    // Delete duplicates
    let deleted = 0;
    for (const id of toDelete) {
      await base44.asServiceRole.entities.VendorProduct.update(id, { is_active: false });
      deleted++;
    }

    return Response.json({
      success: true,
      duplicates_found: toDelete.length,
      deleted,
      kept: products.length - deleted
    });

  } catch (error) {
    console.error('Error removing duplicates:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});