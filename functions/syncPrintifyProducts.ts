import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PRINTIFY_API_KEY = Deno.env.get("PRINTIFY_API_KEY");
const PRINTIFY_API_URL = "https://api.printify.com/v1";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shopId, productIds } = await req.json();

    const headers = {
      "Authorization": `Bearer ${PRINTIFY_API_KEY}`,
      "Content-Type": "application/json"
    };

    // Get all products from Printify
    const response = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/products.json`, { headers });
    const data = await response.json();
    const printifyProducts = data.data || [];

    // Filter if specific product IDs provided
    const productsToSync = productIds && productIds.length > 0
      ? printifyProducts.filter(p => productIds.includes(p.id))
      : printifyProducts;

    const syncedProducts = [];
    const errors = [];

    for (const printifyProduct of productsToSync) {
      try {
        // Determine category based on tags/title
        let category = 'merch';
        const tags = printifyProduct.tags || [];
        const title = printifyProduct.title?.toLowerCase() || '';
        
        if (tags.includes('supplements') || title.includes('supplement') || title.includes('vitamin')) {
          category = 'accessories';
        } else if (tags.includes('supplies') || title.includes('supplies') || title.includes('packaging') || title.includes('bag')) {
          category = 'supplies';
        } else if (tags.includes('merch') || title.includes('shirt') || title.includes('hoodie') || title.includes('mug') || title.includes('hat')) {
          category = 'merch';
        }

        // Map variants
        const variants = printifyProduct.variants?.map(v => ({
          name: v.title || 'Default',
          price: v.price / 100, // Convert cents to dollars
          stock_quantity: 999 // Printify handles inventory
        })) || [];

        // Base price from first variant or default
        const basePrice = variants.length > 0 ? variants[0].price : 0;

        // Create product data
        const productData = {
          name: printifyProduct.title,
          description: printifyProduct.description || '',
          category: category,
          price: basePrice,
          variants: variants,
          image_url: printifyProduct.images?.[0]?.src || '',
          in_stock: true,
          stock_quantity: 999,
          published: printifyProduct.is_published || false,
          sku: `PRINTIFY-${printifyProduct.id}`,
          // Store Printify metadata
          printify_product_id: printifyProduct.id.toString(),
          printify_shop_id: shopId.toString()
        };

        // Check if product already exists
        const existingProducts = await base44.asServiceRole.entities.Product.list();
        const existing = existingProducts.find(p => p.sku === productData.sku);

        let savedProduct;
        if (existing) {
          // Update existing
          savedProduct = await base44.asServiceRole.entities.Product.update(existing.id, productData);
        } else {
          // Create new
          savedProduct = await base44.asServiceRole.entities.Product.create(productData);
        }

        syncedProducts.push(savedProduct);
      } catch (error) {
        errors.push({
          product: printifyProduct.title,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      synced: syncedProducts.length,
      errors: errors.length,
      products: syncedProducts,
      errorDetails: errors
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});