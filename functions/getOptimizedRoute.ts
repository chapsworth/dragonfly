import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { origin, destinations } = await req.json();
    
    if (!origin || !destinations || destinations.length === 0) {
      return Response.json({ error: 'Origin and destinations are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Build waypoints string for multiple destinations
    const waypoints = destinations.length > 1 
      ? `&waypoints=optimize:true|${destinations.slice(0, -1).join('|')}`
      : '';
    
    const destination = destinations[destinations.length - 1];
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      return Response.json({ error: 'Failed to get directions', details: data }, { status: 500 });
    }

    // Extract routes with polyline data
    const routes = data.routes.map(route => ({
      overview_polyline: route.overview_polyline.points,
      legs: route.legs.map(leg => ({
        distance: leg.distance,
        duration: leg.duration,
        start_address: leg.start_address,
        end_address: leg.end_address,
        steps: leg.steps
      })),
      waypoint_order: route.waypoint_order || []
    }));

    return Response.json({ 
      routes,
      status: data.status
    });
    
  } catch (error) {
    console.error('Route optimization error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});