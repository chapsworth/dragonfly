import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productName, productNames, mode, count, allowFictional } = await req.json();

    // Handle batch discovery
    if (mode === 'surprise' || mode === 'teachme') {
      const requestCount = count || 10;
      const existingProducts = await base44.entities.Product.list();
      const existingNames = existingProducts.map(p => p.name.toLowerCase());
      
      const prompt = mode === 'surprise' 
        ? `Suggest ${requestCount} interesting cannabis concentrate products that dispensaries should offer. Focus ONLY on concentrates and derivatives: oils, diamonds, sugar, crumble, shatter, sauce, live resin, rosin, hash, extracts, tinctures, topicals. Include a diverse mix. NO flower products.`
        : `Suggest ${requestCount} educational cannabis concentrate and derivative products that would be great for teaching people about extraction methods and concentrate varieties. Include products with unique characteristics or production methods. NO flower products.`;
      
      const suggestions = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompt} Return ONLY a JSON array of product names: ["Product1", "Product2", ...]`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            products: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      const namesToDiscover = (suggestions.products || [])
        .filter(name => !existingNames.includes(name.toLowerCase()))
        .slice(0, requestCount);
      
      return Response.json({ success: true, productNames: namesToDiscover, mode });
    }

    // Handle multiple products
    const names = productNames || (productName ? [productName] : []);
    
    if (names.length === 0) {
      return Response.json({ error: 'Product name(s) required' }, { status: 400 });
    }

    // Process multiple products
    const results = [];
    const existingProducts = await base44.entities.Product.list();
    
    for (const name of names) {
      try {
        // Check if product already exists
        const existing = existingProducts.find(p => 
          p.name.toLowerCase() === name.toLowerCase()
        );

        if (existing) {
          results.push({ 
            success: true, 
            product: existing,
            isNew: false,
            productName: name
          });
          continue;
        }

        // Verify product exists if not allowing fictional
        if (!allowFictional) {
          const verifyProduct = await base44.integrations.Core.InvokeLLM({
            prompt: `Search online and verify if the cannabis concentrate/derivative product "${name}" is a REAL product that exists. Check dispensary menus, product databases, or manufacturer websites.

CRITICAL: You MUST return {"exists": false} if:
- The product is not found in any reputable cannabis product database
- You cannot verify its existence with credible sources
- It appears to be made up or fictional

Only return {"exists": true} if you can confirm it's a real, documented product.

Return ONLY valid JSON:
{
  "exists": boolean (true ONLY if product is verified to exist),
  "sources": "list of sources where found or empty if not found"
}`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                exists: { type: "boolean" },
                sources: { type: "string" }
              }
            }
          });

          if (!verifyProduct.exists) {
            results.push({ 
              success: false, 
              error: `Product "${name}" not found in online databases. Sources checked: ${verifyProduct.sources || 'None'}`,
              productName: name,
              needsConfirmation: true
            });
            continue;
          }
        }

        // Use AI to research the product
        const productData = await base44.integrations.Core.InvokeLLM({
          prompt: `You're a cannabis concentrate expert with deep knowledge of extraction methods and concentrate products. Research the cannabis concentrate/derivative product "${name}" and write about it in an engaging way.

Write a compelling 2-3 sentence description that:
- Describes the concentrate type and extraction method
- Highlights what makes this product special
- Uses engaging language that educates consumers
- Feels natural and conversational

Return ONLY valid JSON (no markdown, no code blocks):
{
  "name": "exact product name",
  "category": "concentrates, tinctures, topicals, or vapes (choose the most appropriate)",
  "price": number (reasonable retail price in USD),
  "description": "your engaging 2-3 sentence description",
  "thc_level": number (THC percentage if applicable),
  "cbd_level": number (CBD percentage if applicable),
  "strain_type": "indica, sativa, hybrid, cbd, or n/a",
  "weight": "product size/weight like '1g', '3.5g', '500mg', etc",
  "in_stock": true,
  "stock_quantity": 50,
  "published": true
}

Be accurate and research-based. If the product doesn't exist or isn't a concentrate/derivative, return: {"error": "Product not found or not a concentrate"}`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: { type: "string" },
              price: { type: "number" },
              description: { type: "string" },
              thc_level: { type: "number" },
              cbd_level: { type: "number" },
              strain_type: { type: "string" },
              weight: { type: "string" },
              in_stock: { type: "boolean" },
              stock_quantity: { type: "number" },
              published: { type: "boolean" },
              error: { type: "string" }
            }
          }
        });

        if (productData.error) {
          results.push({ 
            success: false, 
            error: productData.error,
            productName: name
          });
          continue;
        }

        // Try to find an image using multiple sources
        let imageUrl = '';
        
        // Try Google Images first
        try {
          const googleSearchResponse = await base44.asServiceRole.functions.invoke('searchGoogleImages', {
            query: `${productData.name} cannabis concentrate product photography`
          });
          
          if (googleSearchResponse.data?.results?.length > 0) {
            imageUrl = googleSearchResponse.data.results[0];
          }
        } catch (e) {
          console.log('Google search failed:', e.message);
        }

        // Try Unsplash if Google failed
        if (!imageUrl) {
          try {
            const unsplashResponse = await base44.asServiceRole.functions.invoke('searchUnsplash', {
              query: `${productData.name} cannabis concentrate product`
            });
            
            if (unsplashResponse.data?.results?.length > 0) {
              imageUrl = unsplashResponse.data.results[0].urls.regular;
            }
          } catch (e) {
            console.log('Unsplash search failed:', e.message);
          }
        }

        // Fallback to AI generation
        if (!imageUrl) {
          try {
            const aiImage = await base44.integrations.Core.GenerateImage({
              prompt: `Professional product photography of ${productData.name} cannabis concentrate, high quality product shot, clean packaging, studio lighting, white background, commercial product photography style`
            });
            imageUrl = aiImage.url;
          } catch (e) {
            console.log('AI image generation failed:', e.message);
            imageUrl = 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400';
          }
        }

        // Save the product to the database
        const newProduct = await base44.entities.Product.create({
          ...productData,
          image_url: imageUrl
        });

        results.push({ 
          success: true, 
          product: newProduct,
          isNew: true,
          productName: name
        });
      } catch (err) {
        console.error(`Error processing product ${name}:`, err);
        results.push({ 
          success: false, 
          error: err.message,
          productName: name
        });
      }
    }

    const needsConfirmation = results.filter(r => r.needsConfirmation);
    
    return Response.json({ 
      success: needsConfirmation.length === 0,
      results,
      total: results.length,
      new: results.filter(r => r.isNew).length,
      existing: results.filter(r => !r.isNew && r.success).length,
      failed: results.filter(r => !r.success && !r.needsConfirmation).length,
      needsConfirmation: needsConfirmation.map(r => r.productName)
    });

  } catch (error) {
    console.error('Error discovering product:', error);
    return Response.json({ 
      error: error.message || 'Failed to discover product' 
    }, { status: 500 });
  }
});