import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create default email templates
    const templates = [
      {
        name: 'Order Confirmation',
        subject: '✅ Order Confirmed - Thank You!',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Order Confirmed!</h2>
          <p>Hi there,</p>
          <p>Thank you for your order! We're excited to get your items to you.</p>
          <p><strong>Order Details:</strong></p>
          <p>Your order has been confirmed and is being prepared for delivery.</p>
          <p>You'll receive another email when your order is on its way.</p>
          <p style="margin-top: 30px;">Thanks for shopping with us!</p>
          <p style="color: #6b7280; font-size: 12px;">Need help? Reply to this email or contact our support team.</p>
        </div>`,
        category: 'transactional'
      },
      {
        name: 'Order Status Update',
        subject: '📦 Your Order Status Has Been Updated',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Order Status Update</h2>
          <p>Hi there,</p>
          <p>Your order status has been updated!</p>
          <p>You can track your order and see the latest updates anytime.</p>
          <p style="margin-top: 30px;">Thank you for your patience!</p>
        </div>`,
        category: 'transactional'
      },
      {
        name: 'Welcome Email',
        subject: '🎉 Welcome to Our Store!',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">Welcome!</h2>
          <p>Hi there,</p>
          <p>We're thrilled to have you join our community! 🎉</p>
          <p>Here's what you can expect:</p>
          <ul>
            <li>Quality products delivered to your door</li>
            <li>Exclusive member deals and promotions</li>
            <li>Loyalty rewards on every purchase</li>
          </ul>
          <p style="margin-top: 30px;">Ready to start shopping? Browse our latest products!</p>
          <p style="color: #6b7280; font-size: 12px;">Questions? We're here to help!</p>
        </div>`,
        category: 'marketing'
      },
      {
        name: 'Points Earned',
        subject: '⭐ You Earned Loyalty Points!',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Congratulations!</h2>
          <p>Hi there,</p>
          <p>You just earned loyalty points! 🎊</p>
          <p>Your points are adding up, and you're getting closer to awesome rewards.</p>
          <p>Keep shopping to unlock even more benefits!</p>
          <p style="margin-top: 30px;">Happy shopping!</p>
        </div>`,
        category: 'notification'
      },
      {
        name: 'New Order - Admin Notification',
        subject: '🔔 New Order Received',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">New Order Alert</h2>
          <p>A new order has been placed!</p>
          <p><strong>Customer:</strong> [Customer Name]</p>
          <p><strong>Order Total:</strong> [Order Total]</p>
          <p><strong>Items:</strong> [Order Items]</p>
          <p style="margin-top: 20px;">Please review and process this order in the admin dashboard.</p>
        </div>`,
        category: 'notification'
      },
      {
        name: 'Reward Redeemed',
        subject: '🎁 Reward Redeemed Successfully!',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ec4899;">Reward Redeemed!</h2>
          <p>Hi there,</p>
          <p>Great choice! Your reward has been successfully redeemed. 🎁</p>
          <p>Your reward will be applied to your next order or account.</p>
          <p style="margin-top: 30px;">Enjoy your reward!</p>
        </div>`,
        category: 'transactional'
      },
      {
        name: 'Promotional Newsletter',
        subject: '🔥 Special Offer Just for You!',
        body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4;">Exclusive Deal Inside! 🔥</h2>
          <p>Hi there,</p>
          <p>We have an amazing offer that we think you'll love!</p>
          <p style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong style="font-size: 18px;">Get 20% OFF your next order!</strong><br/>
            Use code: <strong>SAVE20</strong> at checkout
          </p>
          <p>This exclusive offer is available for a limited time only.</p>
          <p style="margin-top: 30px;">Don't miss out - shop now!</p>
        </div>`,
        category: 'marketing'
      }
    ];

    const createdTemplates = [];
    for (const template of templates) {
      const existing = await base44.asServiceRole.entities.EmailTemplate.list();
      if (!existing.find(t => t.name === template.name)) {
        const created = await base44.asServiceRole.entities.EmailTemplate.create(template);
        createdTemplates.push(created);
      }
    }

    // Create default email triggers
    const triggers = [
      {
        name: 'Order Placed - Customer Email',
        description: 'Sends order confirmation email to customer when order is placed',
        trigger_type: 'order_placed',
        recipient_type: 'customer',
        is_active: true
      },
      {
        name: 'Order Placed - Admin Notification',
        description: 'Notifies admins when a new order is placed',
        trigger_type: 'order_placed',
        recipient_type: 'admin',
        is_active: true
      },
      {
        name: 'Order Status Changed',
        description: 'Notifies customer when order status changes',
        trigger_type: 'order_status_change',
        recipient_type: 'customer',
        is_active: true
      },
      {
        name: 'User Registration Welcome',
        description: 'Sends welcome email when new user registers',
        trigger_type: 'user_registered',
        recipient_type: 'customer',
        is_active: true
      },
      {
        name: 'Points Earned Notification',
        description: 'Notifies customer when they earn loyalty points',
        trigger_type: 'points_earned',
        recipient_type: 'customer',
        is_active: false
      },
      {
        name: 'Reward Redeemed Confirmation',
        description: 'Confirms when customer redeems a reward',
        trigger_type: 'reward_redeemed',
        recipient_type: 'customer',
        is_active: true
      }
    ];

    const createdTriggers = [];
    for (const trigger of triggers) {
      const existing = await base44.asServiceRole.entities.EmailTrigger.list();
      if (!existing.find(t => t.name === trigger.name)) {
        // Find matching template
        const template = createdTemplates.find(t => 
          t.name.toLowerCase().includes(trigger.name.toLowerCase().split(' ')[0])
        );
        
        const created = await base44.asServiceRole.entities.EmailTrigger.create({
          ...trigger,
          template_id: template?.id || null
        });
        createdTriggers.push(created);
      }
    }

    return Response.json({
      success: true,
      templates_created: createdTemplates.length,
      triggers_created: createdTriggers.length,
      message: 'Email system setup complete'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});