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

    // For single destination, just get directions
    if (destinations.length === 1) {
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destinations[0].lat},${destinations[0].lng}&key=${apiKey}`;
      
      const response = await fetch(directionsUrl);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        return Response.json({ error: data.error_message || 'Directions API error' }, { status: 400 });
      }

      const route = data.routes[0];
      const leg = route.legs[0];
      
      return Response.json({
        status: 'success',
        optimizedOrder: [0],
        routes: [{
          orderId: destinations[0].orderId,
          polyline: route.overview_polyline.points,
          distance: leg.distance.value,
          duration: leg.duration.value,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.text,
            duration: step.duration.text,
            maneuver: step.maneuver || 'straight'
          }))
        }],
        totalDistance: leg.distance.value,
        totalDuration: leg.duration.value
      });
    }

    // For multiple destinations, optimize the route
    const waypoints = destinations.map(d => `${d.lat},${d.lng}`).join('|');
    const optimize = optimizeBy === 'distance' ? 'true' : 'false';
    
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${origin.lat},${origin.lng}&waypoints=optimize:${optimize}|${waypoints}&key=${apiKey}`;
    
    const response = await fetch(directionsUrl);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      return Response.json({ error: data.error_message || 'Directions API error' }, { status: 400 });
    }

    const route = data.routes[0];
    const waypointOrder = data.routes[0].waypoint_order || destinations.map((_, i) => i);
    
    // Build individual route segments
    const routes = [];
    let totalDistance = 0;
    let totalDuration = 0;
    
    for (let i = 0; i < route.legs.length; i++) {
      const leg = route.legs[i];
      const destIndex = i < waypointOrder.length ? waypointOrder[i] : destinations.length - 1;
      
      routes.push({
        orderId: destinations[destIndex].orderId,
        destination: destinations[destIndex],
        distance: leg.distance.value,
        duration: leg.duration.value,
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.text,
          duration: step.duration.text,
          maneuver: step.maneuver || 'straight',
          startLocation: step.start_location,
          endLocation: step.end_location
        }))
      });
      
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;
    }

    return Response.json({
      status: 'success',
      optimizedOrder: waypointOrder,
      polyline: route.overview_polyline.points,
      routes,
      totalDistance,
      totalDuration
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});