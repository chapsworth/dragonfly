import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const result = await base44.integrations.Core.GenerateImage({ 
      prompt: 'Purple cannabis bud, macro photography' 
    });
    
    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});