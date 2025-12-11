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
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_SEARCH_API');
    const searchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');

    if (!apiKey) {
      return Response.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    // Use a default search engine ID if not provided
    const cx = searchEngineId || '017576662512468239146:omuauf_lfve';

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=10`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.error?.message || 'Search failed' }, { status: response.status });
    }

    const images = data.items?.map(item => item.link) || [];

    return Response.json({ results: images });
  } catch (error) {
    console.error('Google Image search error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});