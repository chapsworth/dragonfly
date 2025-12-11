import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { strainName } = await req.json();

    if (!strainName) {
      return Response.json({ error: 'Strain name is required' }, { status: 400 });
    }

    // Check if strain already exists
    const existingStrains = await base44.entities.Strain.list();
    const existing = existingStrains.find(s => 
      s.name.toLowerCase() === strainName.toLowerCase()
    );

    if (existing) {
      return Response.json({ 
        success: true, 
        strain: existing,
        isNew: false,
        message: 'Strain already exists in library'
      });
    }

    // Use AI to research the strain
    const strainData = await base44.integrations.Core.InvokeLLM({
      prompt: `Research the cannabis strain "${strainName}" and provide comprehensive information. Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "name": "exact strain name",
  "type": "indica, sativa, hybrid, or cbd",
  "thc_min": number (min THC %),
  "thc_max": number (max THC %),
  "cbd_min": number (min CBD %),
  "cbd_max": number (max CBD %),
  "description": "detailed description 2-3 sentences",
  "effects": ["array", "of", "effects"],
  "flavors": ["array", "of", "flavors"],
  "medical_uses": ["array", "of", "medical", "uses"],
  "genetics": "parent strains or lineage",
  "growing_difficulty": "easy, moderate, or difficult",
  "flowering_time": "time range like 8-9 weeks",
  "popular": false
}

Be accurate and research-based. If the strain doesn't exist or you're not sure, return: {"error": "Strain not found or verified"}`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          thc_min: { type: "number" },
          thc_max: { type: "number" },
          cbd_min: { type: "number" },
          cbd_max: { type: "number" },
          description: { type: "string" },
          effects: { type: "array", items: { type: "string" } },
          flavors: { type: "array", items: { type: "string" } },
          medical_uses: { type: "array", items: { type: "string" } },
          genetics: { type: "string" },
          growing_difficulty: { type: "string" },
          flowering_time: { type: "string" },
          popular: { type: "boolean" },
          error: { type: "string" }
        }
      }
    });

    if (strainData.error) {
      return Response.json({ 
        success: false, 
        error: strainData.error 
      }, { status: 404 });
    }

    // Try to find an image using Unsplash
    let imageUrl = '';
    try {
      const unsplashKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
      if (unsplashKey) {
        const unsplashResponse = await fetch(
          `https://api.unsplash.com/search/photos?query=cannabis+${encodeURIComponent(strainName)}&per_page=1`,
          {
            headers: {
              'Authorization': `Client-ID ${unsplashKey}`
            }
          }
        );
        const unsplashData = await unsplashResponse.json();
        if (unsplashData.results && unsplashData.results.length > 0) {
          imageUrl = unsplashData.results[0].urls.regular;
        }
      }
    } catch (e) {
      console.log('Unsplash search failed, will use AI generation:', e.message);
    }

    // If no image found, generate one with AI
    if (!imageUrl) {
      try {
        const aiImage = await base44.integrations.Core.GenerateImage({
          prompt: `Professional macro photography of ${strainName} cannabis strain, high quality cannabis buds with visible trichomes, detailed close-up, studio lighting, clean white background, product photography style`
        });
        imageUrl = aiImage.url;
      } catch (e) {
        console.log('AI image generation failed:', e.message);
        imageUrl = 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400';
      }
    }

    // Save the strain to the database
    const newStrain = await base44.entities.Strain.create({
      ...strainData,
      image_url: imageUrl
    });

    return Response.json({ 
      success: true, 
      strain: newStrain,
      isNew: true,
      message: 'New strain discovered and added to library'
    });

  } catch (error) {
    console.error('Error discovering strain:', error);
    return Response.json({ 
      error: error.message || 'Failed to discover strain' 
    }, { status: 500 });
  }
});