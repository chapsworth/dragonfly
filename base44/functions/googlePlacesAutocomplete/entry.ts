import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({
        status: 'error',
        details: 'Google Maps API key not set (GOOGLE_MAPS_API_KEY).',
        code: 'missing_api_key'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { input, sessiontoken, types = 'address', language = 'en' } = await req.json().catch(() => ({}));
    if (!input || typeof input !== 'string') {
      return new Response(JSON.stringify({
        status: 'error',
        details: 'Invalid or missing input.',
        code: 'invalid_input'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const params = new URLSearchParams({
      input,
      key: apiKey,
      language,
      types
    });
    if (sessiontoken) params.set('sessiontoken', sessiontoken);

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      return new Response(JSON.stringify({
        status: 'error',
        details: `Upstream error: ${resp.status} ${resp.statusText}`,
        code: 'upstream_error'
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await resp.json();
    
    if (data.status === 'ZERO_RESULTS' || !Array.isArray(data.predictions)) {
      return new Response(JSON.stringify({
        status: 'success',
        predictions: []
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (data.status !== 'OK') {
      return new Response(JSON.stringify({
        status: 'error',
        details: data.error_message || data.status || 'API error',
        code: 'api_error',
        raw_status: data.status,
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const predictions = data.predictions.map(p => ({
      description: p.description,
      place_id: p.place_id,
      types: p.types || []
    }));

    return new Response(JSON.stringify({
      status: 'success',
      predictions
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({
      status: 'error',
      details: err?.message || 'Unexpected error during autocomplete.',
      code: 'exception'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});