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
        
        // Use AI to determine the best category for apparel/merch
        let category = 'other';
        const blueprintTitle = printifyProduct.blueprint?.title?.toLowerCase() || '';
        
        try {
          const categoryResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Analyze this Printify product and determine the best category.

Product Details:
Title: ${printifyProduct.title}
Description: ${printifyProduct.description || 'N/A'}
Tags: ${tags.join(', ') || 'N/A'}
Blueprint: ${blueprintTitle || 'N/A'}

Available Categories:
- apparel (t-shirts, hoodies, sweatshirts, tank tops, jerseys)
- accessories (hats, caps, socks, scarves, gloves, bandanas)
- home_living (pillows, blankets, posters, canvas prints, towels, shower curtains)
- drinkware (mugs, cups, bottles, tumblers, wine glasses)
- stickers (stickers, decals, labels)
- office (notebooks, journals, pens, mouse pads, desk accessories)
- kids_babies (kids clothing, baby onesies, bibs, kids accessories)
- bags (tote bags, backpacks, drawstring bags, pouches)
- jewelry (necklaces, bracelets, earrings)
- other (anything that doesn't fit above)

Return ONLY the category name, nothing else.`,
            add_context_from_internet: false
          });
          
          const suggestedCategory = categoryResult.trim().toLowerCase();
          const validCategories = ['apparel', 'accessories', 'home_living', 'drinkware', 'stickers', 'office', 'kids_babies', 'bags', 'jewelry', 'other'];
          
          if (validCategories.includes(suggestedCategory)) {
            category = suggestedCategory;
          }
        } catch (aiError) {
          console.error('AI categorization failed, using fallback:', aiError);
          // Fallback to manual categorization
          if (title.includes('shirt') || title.includes('hoodie') || title.includes('sweater') || blueprintTitle.includes('shirt')) {
            category = 'apparel';
          } else if (title.includes('hat') || title.includes('cap') || title.includes('sock') || blueprintTitle.includes('hat')) {
            category = 'accessories';
          } else if (title.includes('pillow') || title.includes('blanket') || title.includes('poster') || blueprintTitle.includes('pillow')) {
            category = 'home_living';
          } else if (title.includes('mug') || title.includes('cup') || title.includes('bottle') || blueprintTitle.includes('mug')) {
            category = 'drinkware';
          } else if (title.includes('sticker') || blueprintTitle.includes('sticker')) {
            category = 'stickers';
          } else if (title.includes('notebook') || title.includes('journal') || blueprintTitle.includes('notebook')) {
            category = 'office';
          } else if (title.includes('kids') || title.includes('baby') || blueprintTitle.includes('baby')) {
            category = 'kids_babies';
          } else if (title.includes('tote') || title.includes('bag') || blueprintTitle.includes('bag')) {
            category = 'bags';
          } else if (title.includes('jewelry') || title.includes('necklace')) {
            category = 'jewelry';
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