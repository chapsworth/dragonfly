import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: 'Missing order_id' }, { status: 400 });
    }

    // Get order details
    const orders = await base44.asServiceRole.entities.Order.filter({ id: order_id });
    const order = orders[0];

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.customer_email) {
      return Response.json({ error: 'No customer email' }, { status: 400 });
    }

    // Calculate points (1 point per dollar spent)
    const points = Math.floor(order.total);

    // Check if points already awarded
    const existing = await base44.asServiceRole.entities.PointsTransaction.filter({
      order_id: order_id
    });

    if (existing.length > 0) {
      return Response.json({
        success: false,
        message: 'Points already awarded for this order'
      });
    }

    // Award points
    await base44.asServiceRole.entities.PointsTransaction.create({
      user_email: order.customer_email,
      points: points,
      transaction_type: 'earned',
      description: `Order #${order_id.slice(-6)}`,
      order_id: order_id
    });

    return Response.json({
      success: true,
      points_awarded: points,
      customer_email: order.customer_email,
      order_id
    });

  } catch (error) {
    console.error('Award order points error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});