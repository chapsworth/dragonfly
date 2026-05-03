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
      return Response.json({ error: 'vendor_name is required' }, { status: 400 });
    }

    // Get all products for this vendor
    const products = await base44.asServiceRole.entities.VendorProduct.filter({ vendor_name });

    // Delete them one by one
    let deleted = 0;
    for (const product of products) {
      await base44.asServiceRole.entities.VendorProduct.delete(product.id);
      deleted++;
    }

    return Response.json({ 
      success: true, 
      deleted_count: deleted,
      message: `Deleted ${deleted} products for ${vendor_name}` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});