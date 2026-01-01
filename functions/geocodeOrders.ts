import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all orders
    const orders = await base44.asServiceRole.entities.Order.list();
    
    // Filter orders missing coordinates but have address
    const ordersToGeocode = orders.filter(o => 
      o.delivery_address && 
      (!o.delivery_lat || !o.delivery_lng)
    );

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const order of ordersToGeocode) {
      try {
        // Geocode address
        const response = await base44.asServiceRole.functions.invoke('googlePlacesAutocomplete', {
          input: order.delivery_address,
          types: 'address'
        });

        if (response.data.status === 'success' && response.data.predictions?.[0]) {
          const detailsResponse = await base44.asServiceRole.functions.invoke('googlePlaceDetails', {
            place_id: response.data.predictions[0].place_id
          });

          if (detailsResponse.data.status === 'success') {
            await base44.asServiceRole.entities.Order.update(order.id, {
              delivery_lat: detailsResponse.data.details.lat,
              delivery_lng: detailsResponse.data.details.lng
            });
            successCount++;
            results.push({
              orderId: order.id.slice(0, 8),
              address: order.delivery_address,
              status: 'success'
            });
          } else {
            failCount++;
            results.push({
              orderId: order.id.slice(0, 8),
              address: order.delivery_address,
              status: 'failed - no details'
            });
          }
        } else {
          failCount++;
          results.push({
            orderId: order.id.slice(0, 8),
            address: order.delivery_address,
            status: 'failed - no predictions'
          });
        }
      } catch (error) {
        failCount++;
        results.push({
          orderId: order.id.slice(0, 8),
          address: order.delivery_address,
          status: `error: ${error.message}`
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return Response.json({
      message: `Geocoded ${successCount} orders, ${failCount} failed`,
      totalProcessed: ordersToGeocode.length,
      successCount,
      failCount,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});