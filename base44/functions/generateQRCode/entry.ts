import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, size = 200 } = await req.json();
    
    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    // Use Google Charts API to generate QR code
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(text)}`;
    
    return Response.json({ 
      qr_url: qrUrl,
      success: true 
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});