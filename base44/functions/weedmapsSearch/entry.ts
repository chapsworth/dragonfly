import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchType, query, latitude, longitude, limit = 200, page = 1 } = await req.json();
    const apiKey = Deno.env.get('WEEDMAPS_API_KEY');

    if (!apiKey) {
      return Response.json({ error: 'WeedMaps API key not configured' }, { status: 500 });
    }

    let url;
    const headers = {
      'Accept': 'application/json',
      'X-API-Key': apiKey
    };

    // WeedMaps API endpoints
    if (searchType === 'dispensaries') {
      // Search for dispensaries
      url = `https://api-g.weedmaps.com/discovery/v1/listings?filter[region_path]=${encodeURIComponent(query)}&filter[type]=dispensary&page_size=${limit}`;
      if (latitude && longitude) {
        url += `&latlng=${latitude},${longitude}`;
      }
    } else if (searchType === 'deliveries') {
      // Search for delivery services
      url = `https://api-g.weedmaps.com/discovery/v1/listings?filter[region_path]=${encodeURIComponent(query)}&filter[type]=delivery&page_size=${limit}`;
      if (latitude && longitude) {
        url += `&latlng=${latitude},${longitude}`;
      }
    } else if (searchType === 'brands') {
      // Search for brands
      url = `https://api-g.weedmaps.com/discovery/v1/brands?filter[name]=${encodeURIComponent(query)}&page_size=${limit}`;
    } else if (searchType === 'products') {
      // Search for products - if query is empty, get all products, otherwise search by name
      if (query && query.trim()) {
        url = `https://api-g.weedmaps.com/discovery/v1/products?filter[name]=${encodeURIComponent(query)}&page_size=${limit}&page=${page}`;
      } else {
        url = `https://api-g.weedmaps.com/discovery/v1/products?page_size=${limit}&page=${page}`;
      }
    } else if (searchType === 'strains') {
      // Search for strains - if query is empty, get all strains, otherwise search by name
      if (query && query.trim()) {
        url = `https://api-g.weedmaps.com/discovery/v1/strains?filter[name]=${encodeURIComponent(query)}&page_size=${limit}&page=${page}`;
      } else {
        url = `https://api-g.weedmaps.com/discovery/v1/strains?page_size=${limit}&page=${page}`;
      }
    } else if (searchType === 'menu') {
      // Get menu for a specific dispensary by ID
      url = `https://api-g.weedmaps.com/discovery/v1/listings/${query}/menu_items?page_size=${limit}`;
    } else if (searchType === 'categories') {
      // Get product categories
      url = `https://api-g.weedmaps.com/discovery/v1/categories`;
    } else {
      return Response.json({ error: 'Invalid search type' }, { status: 400 });
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        return Response.json({ 
          error: 'Rate limit exceeded', 
          details: 'WeedMaps API rate limit reached. Please wait a moment and try again.',
          status: 429
        }, { status: 429 });
      }
      
      return Response.json({ 
        error: 'WeedMaps API error', 
        details: errorText,
        status: response.status 
      }, { status: response.status });
    }

    const data = await response.json();

    // Transform the data to a more usable format
    let results = [];
    
    if ((searchType === 'dispensaries' || searchType === 'deliveries') && data.data?.listings) {
      results = data.data.listings.map(listing => ({
        id: listing.id,
        name: listing.name,
        address: listing.address,
        city: listing.city,
        state: listing.state,
        latitude: listing.latitude,
        longitude: listing.longitude,
        rating: listing.rating,
        image: listing.avatar_image?.small_url || listing.avatar_image?.original_url || listing.image || listing.photos?.[0],
        phone: listing.phone_number,
        website: listing.web_url
      }));
    } else if (searchType === 'products' && data.data?.products) {
      results = data.data.products.map(product => {
        const img = product.avatar_image?.small_url || 
                    product.avatar_image?.original_url || 
                    product.image?.small_url ||
                    product.image?.url ||
                    product.image ||
                    product.photos?.[0]?.url ||
                    product.photos?.[0];
        return {
          id: product.id,
          name: product.name,
          brand: product.brand?.name,
          category: product.category?.name,
          price: product.price_range?.min,
          thc: product.thc_percent?.min,
          cbd: product.cbd_percent?.min,
          description: product.description,
          image: img,
          strain_type: product.strain_type
        };
      });
    } else if (searchType === 'strains' && data.data?.strains) {
      results = data.data.strains.map(strain => {
        const img = strain.avatar_image?.small_url || 
                    strain.avatar_image?.original_url || 
                    strain.image?.small_url ||
                    strain.image?.url ||
                    strain.image ||
                    strain.photos?.[0]?.url ||
                    strain.photos?.[0];
        return {
          id: strain.id,
          name: strain.name,
          type: strain.category,
          description: strain.description,
          effects: strain.effects || [],
          flavors: strain.flavors || [],
          thc_min: strain.thc?.min,
          thc_max: strain.thc?.max,
          cbd_min: strain.cbd?.min,
          cbd_max: strain.cbd?.max,
          image: img,
          genetics: strain.genetics
        };
      });
    } else if (searchType === 'menu' && data.data?.menu_items) {
      results = data.data.menu_items.map(item => ({
        id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        price: item.price,
        thc: item.thc_percent,
        cbd: item.cbd_percent,
        description: item.description,
        image: item.avatar_image?.small_url || item.avatar_image?.original_url || item.image || item.photos?.[0],
        strain_type: item.strain_type,
        in_stock: item.in_stock
      }));
    } else if (searchType === 'categories' && data.data?.categories) {
      results = data.data.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      }));
    } else if (searchType === 'brands' && data.data?.brands) {
      results = data.data.brands.map(brand => ({
        id: brand.id,
        name: brand.name,
        description: brand.description,
        image: brand.avatar_image?.small_url || brand.avatar_image?.original_url || brand.image?.small_url || brand.image || brand.logo?.small_url || brand.logo,
        website: brand.website
      }));
    }

    return Response.json({
      success: true,
      count: results.length,
      results,
      rawData: data
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});