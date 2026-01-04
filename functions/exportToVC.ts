import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// This function should be installed on the SOURCE app (the one you want to export FROM)
// It reads ComponentBlueprint entities and returns them for import

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Check authentication - only if INCOMING_API_SECRET is configured
    const authHeader = req.headers.get('Authorization');
    const secretKey = Deno.env.get('INCOMING_API_SECRET');
    
    // Only check auth if a secret is configured
    if (secretKey) {
      const isValidSecret = authHeader && 
        (authHeader === `Bearer ${secretKey}` || authHeader.replace('Bearer ', '') === secretKey);
      
      if (!isValidSecret) {
        return Response.json({ error: 'Invalid API key' }, { status: 401 });
      }
    }
    
    // Fetch all ComponentBlueprints
    const components = await base44.asServiceRole.entities.ComponentBlueprint.list();
    
    return Response.json({
      success: true,
      count: components.length,
      components: components.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        description: c.description,
        category: c.category,
        default_props: c.default_props,
        editable_fields_schema: c.editable_fields_schema,
        preview_image_url: c.preview_image_url,
        tags: c.tags,
        version: c.version
      }))
    });
    
  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});