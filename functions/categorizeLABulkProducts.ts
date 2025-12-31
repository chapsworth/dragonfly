import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all LA Bulk products
    const products = await base44.asServiceRole.entities.VendorProduct.filter({ 
      vendor_name: 'LA Bulk' 
    });

    let updated = 0;

    for (const product of products) {
      const name = product.product_name.toLowerCase();
      let category = 'flower'; // default

      // Categorize based on product name
      if (name.includes('gummies') || name.includes('gummy') || name.includes('cookie') || 
          name.includes('brownie') || name.includes('goldfish') || name.includes('krispy') ||
          name.includes('butter') || name.includes('cannaoil') || name.includes('treat') ||
          name.includes('candy') || name.includes('chocolate') || name.includes('taffy')) {
        category = 'edibles';
      } else if (name.includes('vape') || name.includes('cartridge') || name.includes('pen')) {
        category = 'vapes';
      } else if (name.includes('tincture') || name.includes('drops') || name.includes('oil')) {
        category = 'tinctures';
      } else if (name.includes('pre-roll') || name.includes('preroll') || name.includes('joint') ||
                 name.includes('blunt')) {
        category = 'pre-rolls';
      } else if (name.includes('concentrate') || name.includes('wax') || name.includes('shatter') ||
                 name.includes('resin') || name.includes('rosin') || name.includes('badder') ||
                 name.includes('crumble') || name.includes('sauce') || name.includes('diamond')) {
        category = 'concentrates';
      } else if (name.includes('disposable') || name.includes('pod')) {
        category = 'vapes';
      } else if (name.includes('cream') || name.includes('balm') || name.includes('lotion') ||
                 name.includes('salve')) {
        category = 'topicals';
      }

      // Update if category changed
      if (category !== product.category) {
        await base44.asServiceRole.entities.VendorProduct.update(product.id, { category });
        updated++;
      }
    }

    return Response.json({ 
      success: true, 
      total: products.length,
      updated,
      message: `Categorized ${products.length} products, updated ${updated}` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});