import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not set' }, { status: 500 });
    }

    const { origin, destinations, optimizeBy = 'distance' } = await req.json();
    
    if (!origin || !destinations || destinations.length === 0) {
      return Response.json({ error: 'Missing origin or destinations' }, { status: 400 });
    }

    // Google Directions API with waypoint optimization
    const waypoints = destinations.map(d => `${d.lat},${d.lng}`).join('|');
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destinations[destinations.length - 1].lat},${destinations[destinations.length - 1].lng}`,
      waypoints: destinations.length > 1 ? `optimize:true|${waypoints.slice(0, -1)}` : waypoints,
      key: apiKey,
      mode: 'driving',
      departure_time: 'now',
      traffic_model: 'best_guess'
    });

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return Response.json({ 
        error: data.error_message || 'Failed to optimize route',
        status: data.status 
      }, { status: 400 });
    }

    const route = data.routes[0];
    const optimizedOrder = route.waypoint_order || [];
    
    // Extract turn-by-turn directions
    const directions = route.legs.map((leg, index) => ({
      legIndex: index,
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      distance: leg.distance.text,
      duration: leg.duration.text,
      durationValue: leg.duration.value,
      steps: leg.steps.map(step => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance.text,
        duration: step.duration.text,
        maneuver: step.maneuver || 'straight'
      }))
    }));

    // Extract polyline for map display
    const polyline = route.overview_polyline.points;

    return Response.json({
      status: 'success',
      optimizedOrder,
      directions,
      polyline,
      totalDistance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
      totalDuration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0),
      bounds: route.bounds
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});