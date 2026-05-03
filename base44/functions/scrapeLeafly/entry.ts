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

    // Fetch the Leafly strains list page
    const response = await fetch('https://www.leafly.com/strains/lists');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Leafly: ${response.status}`);
    }

    const html = await response.text();
    
    // Use LLM to extract strain data matching the query
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `From this HTML content, find strains that match or are similar to "${query}". 
      
Extract the strain name and image URL for each match. Look for img tags with src attributes.
Return up to 12 matching strains with their images.`,
      file_urls: [],
      response_json_schema: {
        type: "object",
        properties: {
          strains: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                image_url: { type: "string" },
                strain_type: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json({ 
      strains: result.strains || [],
      count: result.strains?.length || 0
    });

  } catch (error) {
    console.error('Leafly scrape error:', error);
    return Response.json({ 
      error: error.message,
      strains: []
    }, { status: 500 });
  }
});