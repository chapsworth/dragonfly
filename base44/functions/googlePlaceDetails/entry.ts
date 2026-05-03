import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({
        status: 'error',
        details: 'Google Maps API key not set.',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { place_id } = await req.json().catch(() => ({}));
    if (!place_id) {
      return new Response(JSON.stringify({
        status: 'error',
        details: 'Missing place_id.',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const params = new URLSearchParams({
      place_id,
      key: apiKey,
      fields: 'formatted_address,geometry,address_components'
    });

    const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
    const resp = await fetch(url);
    
    if (!resp.ok) {
      return new Response(JSON.stringify({
        status: 'error',
        details: `Upstream error: ${resp.status}`,
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await resp.json();
    
    if (data.status !== 'OK' || !data.result) {
      return new Response(JSON.stringify({
        status: 'error',
        details: data.error_message || 'Failed to get place details',
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const result = data.result;
    const details = {
      address: result.formatted_address,
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
      place_id,
      city: result.address_components?.find(c => c.types.includes('locality'))?.long_name || '',
      state: result.address_components?.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '',
      zip: result.address_components?.find(c => c.types.includes('postal_code'))?.long_name || '',
      country: result.address_components?.find(c => c.types.includes('country'))?.long_name || ''
    };

    return new Response(JSON.stringify({
      status: 'success',
      details
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({
      status: 'error',
      details: err?.message || 'Unexpected error.',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});