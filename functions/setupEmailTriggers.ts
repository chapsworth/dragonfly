import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6937d9495caf111699370601/6d84e9958_IMG_0305.jpeg';
    
    // Create default email templates
    const templates = [
      {
        name: 'Order Confirmation',
        subject: '🌿 Order Confirmed - Dragonfly Delivery',
        body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <img src="${logoUrl}" alt="Dragonfly" style="width: 80px; height: 80px; margin-bottom: 15px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Dragonfly</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Premium Cannabis Delivery</p>
          </div>
          <div style="padding: 30px 25px;">
            <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 22px;">🌿 Order Confirmed!</h2>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Hi there,</p>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Thank you for your order! We've received your order and it's being processed.</p>
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0;">
              <p style="margin: 0; color: #065f46;"><strong>Status:</strong> <span style="background: #fef3c7; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; color: #92400e;">⏳ CONFIRMED</span></p>
            </div>
            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">We'll notify you as soon as your order is on its way!</p>
          </div>
          <div style="background: #f9fafb; padding: 25px; border-radius: 0 0 10px 10px; margin-top: 30px; border-top: 3px solid #10b981;">
            <p style="text-align: center; color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">© 2025 Dragonfly Delivery. All rights reserved.</p>
          </div>
        </div>`,
        category: 'transactional'
      },
      {
        name: 'Order Status Update',
        subject: '📦 Order Status Update - Dragonfly',
        body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <img src="${logoUrl}" alt="Dragonfly" style="width: 80px; height: 80px; margin-bottom: 15px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Dragonfly</h1>
          </div>
          <div style="padding: 30px 25px;">
            <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 22px;">📦 Order Status Update</h2>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Hi there,</p>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Your order status has been updated! Check your order tracking for the latest information.</p>
          </div>
          <div style="background: #f9fafb; padding: 25px; border-top: 3px solid #10b981;">
            <p style="text-align: center; color: #9ca3af; font-size: 11px;">© 2025 Dragonfly Delivery. All rights reserved.</p>
          </div>
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
        subject: '🎉 New Order Received - Action Required',
        body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
            <img src="${logoUrl}" alt="Dragonfly" style="width: 80px; height: 80px; margin-bottom: 15px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 New Order Alert!</h1>
          </div>
          <div style="padding: 30px 25px;">
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 10px; margin: 0 0 25px 0; border-left: 5px solid #10b981;">
              <p style="margin: 0 0 10px 0; color: #065f46;"><strong>Customer:</strong> [Customer Name]</p>
              <p style="margin: 0 0 10px 0; color: #065f46;"><strong>Total:</strong> <span style="color: #10b981; font-size: 24px; font-weight: bold;">[Order Total]</span></p>
              <p style="margin: 0; color: #065f46;"><strong>Items:</strong> [Order Items]</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://mydragonfly.club/AdminOrders" style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px;">📦 View Order</a>
            </div>
          </div>
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