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

    // Use LLM to find image URLs from the web  
    const searchResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Search for "${query} cannabis strain" images on Google Images.
      
CRITICAL: Find 8 DIRECT image URLs that:
- End in .jpg, .jpeg, .png, or .webp
- Are actual image files, not HTML pages
- Load without authentication
- Are from cannabis sites like Leafly, Weedmaps, AllBud, I Love Growing Marijuana, seed banks
- Are high quality product photos

Return URLs that will work in an <img> tag.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string" },
                alt: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({ 
      images: searchResult.images || [],
      count: searchResult.images?.length || 0
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ 
      error: error.message,
      images: []
    }, { status: 500 });
  }
});