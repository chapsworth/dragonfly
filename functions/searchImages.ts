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

    // Use LLM with internet access to find actual working image URLs
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Search Google Images for: "${query} cannabis strain marijuana"
      
CRITICAL REQUIREMENTS:
1. Return ONLY direct image URLs that end in .jpg, .jpeg, .png, or .webp
2. URLs must be publicly accessible (no authentication required)
3. URLs should be from reputable sources like Leafly, Weedmaps, or seed banks
4. Test that URLs are actual image files, not webpage links
5. Prefer high-resolution images (at least 500px wide)
6. Return exactly 8 different images

Return the image URLs in the exact format specified in the schema.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string", description: "Direct image URL ending in .jpg, .png, or .webp" },
                alt: { type: "string", description: "Alt text describing the image" },
                source: { type: "string", description: "Source website name" }
              },
              required: ["url", "alt"]
            }
          }
        },
        required: ["images"]
      }
    });

    return Response.json({ 
      images: result.images || [],
      count: result.images?.length || 0
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ 
      error: error.message,
      images: []
    }, { status: 500 });
  }
});