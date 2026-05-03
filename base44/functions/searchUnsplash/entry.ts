import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();
    
    if (!query) {
      return Response.json({ error: 'Query required' }, { status: 400 });
    }

    const accessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    
    if (!accessKey) {
      return Response.json({ error: 'Unsplash API key not configured' }, { status: 500 });
    }

    // Search Unsplash
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' cannabis marijuana')}&per_page=12&orientation=squarish`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    
    const images = data.results.map(photo => ({
      url: photo.urls.regular,
      thumb: photo.urls.thumb,
      alt: photo.alt_description || photo.description || query,
      photographer: photo.user.name,
      photographer_url: photo.user.links.html
    }));

    return Response.json({ 
      images,
      count: images.length
    });

  } catch (error) {
    console.error('Unsplash search error:', error);
    return Response.json({ 
      error: error.message,
      images: []
    }, { status: 500 });
  }
});