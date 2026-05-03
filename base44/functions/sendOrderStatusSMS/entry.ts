import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, new_status } = await req.json();

    if (!order_id || !new_status) {
      return Response.json({ error: 'Missing order_id or new_status' }, { status: 400 });
    }

    // Get order details
    const orders = await base44.entities.Order.filter({ id: order_id });
    const order = orders[0];

    if (!order || !order.customer_phone) {
      return Response.json({ error: 'Order not found or no phone number' }, { status: 404 });
    }

    // Create status message
    const statusMessages = {
      confirmed: `Your Dragonfly order #${order_id.slice(-6)} has been confirmed! We're preparing your items. 🌿`,
      preparing: `Good news! Your order #${order_id.slice(-6)} is being prepared right now. 📦`,
      out_for_delivery: `Your order #${order_id.slice(-6)} is out for delivery! ${order.driver_name ? `Driver: ${order.driver_name}` : ''} ${order.eta_minutes ? `ETA: ${order.eta_minutes} min` : ''} 🚗`,
      delivered: `Your order #${order_id.slice(-6)} has been delivered! Thank you for choosing Dragonfly. We hope you enjoy! 🎉`,
      cancelled: `Your order #${order_id.slice(-6)} has been cancelled. Please contact us if you have questions.`
    };

    const message = statusMessages[new_status];

    if (!message) {
      return Response.json({ error: 'Invalid status' }, { status: 400 });
    }

    // In production, integrate with Twilio or similar
    // For now, return the message that would be sent
    return Response.json({
      success: true,
      message: 'SMS notification prepared',
      to: order.customer_phone,
      text: message,
      order_id,
      new_status
    });

  } catch (error) {
    console.error('Send order status SMS error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});