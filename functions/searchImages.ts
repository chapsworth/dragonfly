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
      prompt: `Search Google Images for: "${query} cannabis strain marijuana"
      
Find 6 direct image URLs. Look for actual image file URLs (ending in .jpg, .png, .webp) from sites like Leafly, Weedmaps, seed banks, or dispensaries.
Return the direct image URLs you find.`,
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

    // Download each image and re-upload to our storage
    const uploadedImages = [];
    
    for (const img of (searchResult.images || [])) {
      try {
        // Fetch the image
        const imageResponse = await fetch(img.url);
        if (!imageResponse.ok) continue;
        
        const blob = await imageResponse.blob();
        
        // Re-upload to Base44 storage
        const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({
          file: blob
        });
        
        uploadedImages.push({
          url: uploadResult.file_url,
          alt: img.alt
        });
      } catch (error) {
        console.error(`Failed to process ${img.url}:`, error.message);
      }
    }

    return Response.json({ 
      images: uploadedImages,
      count: uploadedImages.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ 
      error: error.message,
      images: []
    }, { status: 500 });
  }
});