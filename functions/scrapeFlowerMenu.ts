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

    // Look for product items - adjust selectors based on actual HTML structure
    $('.product, .product-item, .woocommerce-loop-product__title, li.product').each((i, element) => {
      const $el = $(element);
      
      // Try to extract product name
      let productName = $el.find('h2, h3, .product-title, .woocommerce-loop-product__title, a.woocommerce-LoopProduct-link').first().text().trim();
      
      if (!productName) {
        productName = $el.find('a').first().text().trim();
      }

      // Try to extract image
      let imageUrl = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
      
      // Try to extract price - multiple strategies
      let price = default_price || 0;
      
      // Strategy 1: Look for price in standard elements
      let priceText = $el.find('.price, .woocommerce-Price-amount, .amount, bdi, .product-price, ins .amount').first().text().trim();
      
      // Strategy 2: Look in the entire element text
      if (!priceText || !priceText.match(/\$/)) {
        priceText = $el.text();
      }
      
      // Extract price from text
      if (priceText) {
        // Look for price patterns like $100, $1,000, $99.99
        const priceMatch = priceText.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1].replace(',', ''));
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

    // If no products found with above selectors, try alternative parsing
    if (products.length === 0) {
      // Try to find any h2/h3 elements with product-like text
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
        }
      } catch (error) {
        console.error('Error importing product:', error);
      }
    }

    return Response.json({
      success: true,
      scraped: products.length,
      imported: imported.length,
      products: imported
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});