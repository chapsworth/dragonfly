import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId, status, customerEmail, customerName } = await req.json();

        const orderUrl = `https://mydragonfly.club/Orders?orderId=${orderId}`;
        
        const statusMessages = {
            pending: {
                subject: '🌿 Order Confirmed - Dragonfly Delivery',
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #10b981;">🌿 Order Confirmed</h1>
                        <p>Hi ${customerName},</p>
                        <p>Thank you for your order! We've received your order and it's being processed.</p>
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> Pending</p>
                        </div>
                        <p>We'll notify you as soon as your order is confirmed and being prepared.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${orderUrl}" style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Order</a>
                        </div>
                        <p>Best regards,<br>Dragonfly Team</p>
                    </div>
                `
            },
            confirmed: {
                subject: '✅ Order Confirmed - Being Prepared',
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #10b981;">✅ Order Confirmed</h1>
                        <p>Hi ${customerName},</p>
                        <p>Great news! Your order has been confirmed and is now being prepared.</p>
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> Confirmed</p>
                        </div>
                        <p>Our team is carefully preparing your items for delivery.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${orderUrl}" style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Order</a>
                        </div>
                        <p>Best regards,<br>Dragonfly Team</p>
                    </div>
                `
            },
            preparing: {
                subject: '📦 Order Being Prepared',
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #10b981;">📦 Order Being Prepared</h1>
                        <p>Hi ${customerName},</p>
                        <p>Your order is currently being prepared by our team.</p>
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> Preparing</p>
                        </div>
                        <p>We're making sure everything is perfect for you!</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${orderUrl}" style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Order</a>
                        </div>
                        <p>Best regards,<br>Dragonfly Team</p>
                    </div>
                `
            },
            out_for_delivery: {
                subject: '🚚 Order Out for Delivery!',
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #10b981;">🚚 Order Out for Delivery</h1>
                        <p>Hi ${customerName},</p>
                        <p>Your order is on its way!</p>
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> Out for Delivery</p>
                        </div>
                        <p>Our driver will arrive at your location soon. Please ensure someone is available to receive the delivery.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${orderUrl}" style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Order</a>
                        </div>
                        <p>Best regards,<br>Dragonfly Team</p>
                    </div>
                `
            },
            delivered: {
                subject: '✨ Order Delivered - Enjoy!',
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #10b981;">✨ Order Delivered</h1>
                        <p>Hi ${customerName},</p>
                        <p>Your order has been successfully delivered!</p>
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> Delivered</p>
                        </div>
                        <p>Thank you for choosing Dragonfly. We hope you enjoy your products!</p>
                        <p>If you have any concerns, please don't hesitate to contact us.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${orderUrl}" style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Order</a>
                        </div>
                        <p>Best regards,<br>Dragonfly Team</p>
                    </div>
                `
            },
            cancelled: {
                subject: '❌ Order Cancelled',
                body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #ef4444;">❌ Order Cancelled</h1>
                        <p>Hi ${customerName},</p>
                        <p>Your order has been cancelled.</p>
                        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> Cancelled</p>
                        </div>
                        <p>If you have any questions about this cancellation, please contact us.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${orderUrl}" style="display: inline-block; background: linear-gradient(to right, #10b981, #059669); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Order</a>
                        </div>
                        <p>Best regards,<br>Dragonfly Team</p>
                    </div>
                `
            }
        };

        const emailContent = statusMessages[status];
        
        if (!emailContent) {
            return Response.json({ error: 'Invalid status' }, { status: 400 });
        }

        await base44.integrations.Core.SendEmail({
            from_name: 'Dragonfly',
            to: customerEmail,
            subject: emailContent.subject,
            body: emailContent.body
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});