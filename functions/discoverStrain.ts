import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { strainName, strainNames, mode, count } = await req.json();

    // Handle batch discovery
    if (mode === 'surprise' || mode === 'teachme') {
      const requestCount = count || 10;
      const existingStrains = await base44.entities.Strain.list();
      const existingNames = existingStrains.map(s => s.name.toLowerCase());
      
      const prompt = mode === 'surprise' 
        ? `Suggest ${requestCount} interesting and diverse cannabis strains that users should know about. Include a mix of indica, sativa, hybrid, and CBD strains. Make them popular and well-documented strains.`
        : `Suggest ${requestCount} educational cannabis strains that would be great for teaching people about cannabis diversity. Include strains with unique characteristics, interesting histories, or medical benefits.`;
      
      const suggestions = await base44.integrations.Core.InvokeLLM({
        prompt: `${prompt} Return ONLY a JSON array of strain names: ["Strain1", "Strain2", ...]`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            strains: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      const namesToDiscover = (suggestions.strains || [])
        .filter(name => !existingNames.includes(name.toLowerCase()))
        .slice(0, requestCount);
      
      return Response.json({ success: true, strainNames: namesToDiscover, mode });
    }

    // Handle multiple strains
    const names = strainNames || (strainName ? [strainName] : []);
    
    if (names.length === 0) {
      return Response.json({ error: 'Strain name(s) required' }, { status: 400 });
    }

    // Process multiple strains
    const results = [];
    const existingStrains = await base44.entities.Strain.list();
    
    for (const name of names) {
      try {
        // Check if strain already exists
        const existing = existingStrains.find(s => 
          s.name.toLowerCase() === name.toLowerCase()
        );

        if (existing) {
          results.push({ 
            success: true, 
            strain: existing,
            isNew: false,
            strainName: name
          });
          continue;
        }

        // Use AI to research the strain
        const strainData = await base44.integrations.Core.InvokeLLM({
          prompt: `Research the cannabis strain "${name}" and provide comprehensive information. Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
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
          results.push({ 
            success: false, 
            error: strainData.error,
            strainName: name
          });
          continue;
        }

        // Try to find an image using Google Images first
        let imageUrl = '';
        try {
          const googleSearchResponse = await base44.functions.invoke('searchGoogleImages', {
            query: `${name} cannabis strain nugg`
          });
          
          if (googleSearchResponse.data?.results?.length > 0) {
            imageUrl = googleSearchResponse.data.results[0];
            console.log('Found image via Google:', imageUrl);
          }
        } catch (e) {
          console.log('Google search failed:', e.message);
        }

        // Fallback to Unsplash
        if (!imageUrl) {
          try {
            const unsplashKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
            if (unsplashKey) {
              const unsplashResponse = await fetch(
                `https://api.unsplash.com/search/photos?query=cannabis+${encodeURIComponent(name)}&per_page=1`,
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
            console.log('Unsplash search failed:', e.message);
          }
        }

        // Final fallback: AI generation
        if (!imageUrl) {
          try {
            const aiImage = await base44.integrations.Core.GenerateImage({
              prompt: `Professional macro photography of ${name} cannabis strain, high quality cannabis buds with visible trichomes, detailed close-up, studio lighting, clean white background, product photography style`
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

        results.push({ 
          success: true, 
          strain: newStrain,
          isNew: true,
          strainName: name
        });
      } catch (err) {
        console.error(`Error processing strain ${name}:`, err);
        results.push({ 
          success: false, 
          error: err.message,
          strainName: name
        });
      }
    }

    return Response.json({ 
      success: true, 
      results,
      total: results.length,
      new: results.filter(r => r.isNew).length,
      existing: results.filter(r => !r.isNew && r.success).length,
      failed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Error discovering strain:', error);
    return Response.json({ 
      error: error.message || 'Failed to discover strain' 
    }, { status: 500 });
  }
});