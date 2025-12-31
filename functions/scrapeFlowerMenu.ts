import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as cheerio from 'npm:cheerio';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { url, vendor_name, category, default_price } = await req.json();

    if (!url || !vendor_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const products = [];

    // Strategy 1: Look for strain variation buttons (like on LA Bulk Flower)
    $('button, .variation-option, input[type="radio"], label').each((i, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      
      // Match patterns like "ALPINE WHITE 1 LB", "GAS MASK 1 LB", etc.
      if (text.match(/1\s*LB/i) && text.length > 5 && text.length < 100) {
        // Clean up the name (remove "1 LB" suffix)
        const cleanName = text.replace(/\s*1\s*LB/i, '').trim();
        
        if (cleanName) {
          products.push({
            product_name: cleanName,
            category: category || 'flower',
            vendor_name,
            price: default_price || 0,
            image_url: null,
            is_active: true
          });
        }
      }
    });

    // Strategy 2: Look for standard product items if no strains found
    if (products.length === 0) {
      $('.product, .product-item, .woocommerce-loop-product__title, li.product').each((i, element) => {
        const $el = $(element);
        
        // Try to extract product name
        let productName = $el.find('h2, h3, .product-title, .woocommerce-loop-product__title, a.woocommerce-LoopProduct-link').first().text().trim();
        
        if (!productName) {
          productName = $el.find('a').first().text().trim();
        }

        // Try to extract image
        let imageUrl = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
        
        // Try to extract price
        let priceText = $el.find('.price, .woocommerce-Price-amount, .amount').first().text().trim();
        let price = default_price || 0;
        
        if (priceText) {
          const priceMatch = priceText.match(/[\d,.]+/);
          if (priceMatch) {
            price = parseFloat(priceMatch[0].replace(',', ''));
          }
        }

        // Only add if we found a product name
        if (productName && productName.length > 2) {
          products.push({
            product_name: productName,
            category: category || 'flower',
            vendor_name,
            price: price,
            image_url: imageUrl || null,
            is_active: true
          });
        }
      });
    }

    // Strategy 3: Try h2/h3 elements as last resort
    if (products.length === 0) {
      $('h2, h3').each((i, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 3 && text.length < 200) {
          const $parent = $(element).closest('div, li, article');
          const imageUrl = $parent.find('img').first().attr('src') || $parent.find('img').first().attr('data-src');
          
          products.push({
            product_name: text,
            category: category || 'flower',
            vendor_name,
            price: default_price || 0,
            image_url: imageUrl || null,
            is_active: true
          });
        }
      });
    }

    // Import products to database
    const imported = [];
    const updated = [];
    for (const product of products) {
      try {
        // Check if product already exists
        const existing = await base44.asServiceRole.entities.VendorProduct.filter({
          vendor_name: product.vendor_name,
          product_name: product.product_name
        });

        if (existing.length === 0) {
          const created = await base44.asServiceRole.entities.VendorProduct.create(product);
          imported.push(created);
        } else {
          // Update existing product with new image and price if available
          const existingProduct = existing[0];
          const updateData = {};
          
          if (product.image_url && !existingProduct.image_url) {
            updateData.image_url = product.image_url;
          }
          if (product.price && product.price !== existingProduct.price) {
            updateData.price = product.price;
          }
          
          if (Object.keys(updateData).length > 0) {
            await base44.asServiceRole.entities.VendorProduct.update(existingProduct.id, updateData);
            updated.push({ ...existingProduct, ...updateData });
          }
        }
      } catch (error) {
        console.error('Error importing product:', error);
      }
    }

    return Response.json({
      success: true,
      scraped: products.length,
      imported: imported.length,
      updated: updated.length,
      products: imported,
      updatedProducts: updated
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});