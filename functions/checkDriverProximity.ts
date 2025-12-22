import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Haversine formula to calculate distance between two coordinates in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all orders that are out for delivery
    const orders = await base44.asServiceRole.entities.Order.filter({
      status: 'out_for_delivery'
    });

    const notifications = [];
    const orderUpdates = [];

    for (const order of orders) {
      // Skip if notification already sent or missing coordinates
      if (order.proximity_notification_sent || 
          !order.driver_lat || !order.driver_lng || 
          !order.delivery_lat || !order.delivery_lng) {
        continue;
      }

      // Calculate distance between driver and customer
      const distance = calculateDistance(
        order.driver_lat,
        order.driver_lng,
        order.delivery_lat,
        order.delivery_lng
      );

      // If within 100 meters, send notification
      if (distance <= 100) {
        // Create notification for customer
        const notification = {
          title: '🚗 Driver Arriving Soon!',
          message: `Your driver ${order.driver_name || 'is'} arriving at your location. Please have your phone and payment ready.`,
          type: 'order',
          link_type: 'order',
          link_value: order.id,
          recipient_type: 'individual',
          recipient_email: order.customer_email,
          priority: 'high',
          icon: 'Truck'
        };

        notifications.push(notification);

        // Mark notification as sent
        orderUpdates.push({
          id: order.id,
          data: { proximity_notification_sent: true }
        });
      }
    }

    // Create all notifications
    if (notifications.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    }

    // Update all orders
    for (const update of orderUpdates) {
      await base44.asServiceRole.entities.Order.update(update.id, update.data);
    }

    return Response.json({
      success: true,
      checked: orders.length,
      notificationsSent: notifications.length,
      message: `Checked ${orders.length} orders, sent ${notifications.length} proximity notifications`
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});