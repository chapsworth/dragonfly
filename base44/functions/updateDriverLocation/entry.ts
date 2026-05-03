import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Calculate ETA based on distance (assuming 30 km/h average speed)
function calculateETA(distanceKm) {
    const speedKmh = 30;
    const hours = distanceKm / speedKmh;
    return Math.ceil(hours * 60); // Return minutes
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate the user
        const user = await base44.auth.me();
        
        // Only admins and drivers can update driver locations
        if (!user || (user.role !== 'admin' && user.role !== 'driver')) {
            return Response.json({ error: 'Unauthorized - Admin or Driver access required' }, { status: 403 });
        }
        
        const { orderId, driverLat, driverLng, driverName, driverPhone } = await req.json();

        if (!orderId || !driverLat || !driverLng) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the order
        const orders = await base44.asServiceRole.entities.Order.list();
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return Response.json({ error: 'Order not found' }, { status: 404 });
        }

        // If driver role, verify they can only update orders assigned to them
        // Admins can update any order without restrictions
        if (user.role === 'driver' && order.driver_email !== user.email) {
            return Response.json({ error: 'Unauthorized - Can only update your own orders' }, { status: 403 });
        }

        // Calculate distance and ETA if delivery location exists
        let eta = null;
        let newStatus = order.status;

        if (order.delivery_lat && order.delivery_lng) {
            const distance = calculateDistance(
                driverLat,
                driverLng,
                order.delivery_lat,
                order.delivery_lng
            );

            eta = calculateETA(distance);

            // Auto-update status based on proximity
            if (distance < 0.05 && order.status === 'out_for_delivery') {
                // Within 50 meters - mark as delivered
                newStatus = 'delivered';
                
                // Send delivery confirmation email
                try {
                    await base44.asServiceRole.functions.invoke('sendOrderEmail', {
                        orderId: order.id,
                        status: 'delivered',
                        customerEmail: order.customer_email,
                        customerName: order.customer_name
                    });
                } catch (emailError) {
                    console.error('Email error:', emailError);
                }
            }
        }

        // Update order with driver location and ETA
        const updateData = {
            driver_lat: driverLat,
            driver_lng: driverLng,
            status: newStatus
        };

        if (eta !== null) {
            updateData.eta_minutes = eta;
        }

        if (driverName) {
            updateData.driver_name = driverName;
        }

        if (driverPhone) {
            updateData.driver_phone = driverPhone;
        }

        await base44.asServiceRole.entities.Order.update(orderId, updateData);

        return Response.json({
            success: true,
            distance: order.delivery_lat ? calculateDistance(driverLat, driverLng, order.delivery_lat, order.delivery_lng) : null,
            eta,
            statusUpdated: newStatus !== order.status,
            newStatus
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});