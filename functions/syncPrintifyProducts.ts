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

    const { shopId, productIds, newOnly = false } = await req.json();

    const headers = {
      "Authorization": `Bearer ${PRINTIFY_API_KEY}`,
      "Content-Type": "application/json"
    };

    // Get all products from Printify
    const response = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/products.json`, { headers });
    const data = await response.json();
    const printifyProducts = data.data || [];

    // Get existing products from database to check for new ones
    const existingProducts = await base44.asServiceRole.entities.Product.list();
    const existingSkus = new Set(existingProducts.map(p => p.sku));

    // Filter if specific product IDs provided
    let productsToSync = productIds && productIds.length > 0
      ? printifyProducts.filter(p => productIds.includes(p.id))
      : printifyProducts;

    // If newOnly flag is set, filter out products that already exist
    if (newOnly) {
      productsToSync = productsToSync.filter(p => !existingSkus.has(`PRINTIFY-${p.id}`));
    }

    const syncedProducts = [];
    const errors = [];

    for (const printifyProduct of productsToSync) {
      try {
        const tags = printifyProduct.tags || [];
        const title = printifyProduct.title?.toLowerCase() || '';
        const description = printifyProduct.description?.toLowerCase() || '';
        
        // Use AI to determine the best category
        let category = 'merch';
        try {
          const categoryResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Analyze this product and determine the best category for a cannabis dispensary shop.

Product Details:
Title: ${printifyProduct.title}
Description: ${printifyProduct.description || 'N/A'}
Tags: ${tags.join(', ') || 'N/A'}

Available Categories:
- flower (cannabis flower/buds)
- pre-rolls (pre-rolled joints)
- edibles (food products with cannabis)
- concentrates (wax, shatter, oils)
- vapes (vape cartridges, pens)
- tinctures (liquid drops, sublingual oils)
- topicals (creams, lotions, balms)
- accessories (supplements, vitamins, tools)
- merch (clothing, hats, mugs, promotional items)
- supplies (packaging, bags, storage, papers)

Return ONLY the category name, nothing else.`,
            add_context_from_internet: false
          });
          
          const suggestedCategory = categoryResult.trim().toLowerCase();
          const validCategories = ['flower', 'pre-rolls', 'edibles', 'concentrates', 'vapes', 'tinctures', 'topicals', 'accessories', 'merch', 'supplies'];
          
          if (validCategories.includes(suggestedCategory)) {
            category = suggestedCategory;
          }
        } catch (aiError) {
          console.error('AI categorization failed, using fallback:', aiError);
          // Fallback to manual categorization
          if (tags.includes('flower') || title.includes('flower') || title.includes('bud')) {
            category = 'flower';
          } else if (tags.includes('pre-roll') || title.includes('pre-roll') || title.includes('joint')) {
            category = 'pre-rolls';
          } else if (tags.includes('edible') || title.includes('edible') || title.includes('gummy') || title.includes('chocolate')) {
            category = 'edibles';
          } else if (tags.includes('concentrate') || title.includes('concentrate') || title.includes('wax') || title.includes('shatter')) {
            category = 'concentrates';
          } else if (tags.includes('vape') || title.includes('vape') || title.includes('cartridge')) {
            category = 'vapes';
          } else if (tags.includes('tincture') || title.includes('tincture') || title.includes('oil') || title.includes('drops')) {
            category = 'tinctures';
          } else if (tags.includes('topical') || title.includes('topical') || title.includes('cream') || title.includes('lotion')) {
            category = 'topicals';
          } else if (tags.includes('supplements') || title.includes('supplement') || title.includes('vitamin')) {
            category = 'accessories';
          } else if (tags.includes('supplies') || title.includes('supplies') || title.includes('packaging') || title.includes('bag')) {
            category = 'supplies';
          }
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