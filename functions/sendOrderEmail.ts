import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const { orderId, status, customerEmail, customerName } = await req.json();

        // Always use customer order tracking page
        const orderUrl = `https://mydragonfly.club/CustomerOrderTracking?id=${orderId}`;
        const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6937d9495caf111699370601/6d84e9958_IMG_0305.jpeg';
        
        const emailHeader = `
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <img src="${logoUrl}" alt="Dragonfly" style="width: 80px; height: 80px; margin-bottom: 15px;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Dragonfly</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Premium Cannabis Delivery</p>
            </div>
        `;
        
        const emailFooter = `
            <div style="background: #f9fafb; padding: 25px; border-radius: 0 0 10px 10px; margin-top: 30px; border-top: 3px solid #10b981;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${logoUrl}" alt="Dragonfly" style="width: 40px; height: 40px; opacity: 0.8;">
                </div>
                <p style="text-align: center; color: #374151; font-size: 14px; margin: 10px 0;">
                    <strong>Dragonfly Delivery</strong><br>
                    Premium Cannabis • Fast & Discreet • Quality Guaranteed
                </p>
                <p style="text-align: center; color: #6b7280; font-size: 13px; margin: 15px 0;">
                    📍 Visit us: <a href="https://mydragonfly.club" style="color: #10b981; text-decoration: none;">mydragonfly.club</a><br>
                    📧 Email: <a href="mailto:support@mydragonfly.club" style="color: #10b981; text-decoration: none;">support@mydragonfly.club</a><br>
                    📞 Phone: (555) 420-1234
                </p>
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${orderUrl}" style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold;">Track Your Order</a>
                </div>
                <p style="text-align: center; color: #9ca3af; font-size: 11px; margin: 15px 0 0 0;">
                    © 2025 Dragonfly Delivery. All rights reserved.<br>
                    This email was sent because you placed an order with us.
                </p>
            </div>
        `;
        
        const statusMessages = {
            pending: {
                subject: '🌿 Order Confirmed - Dragonfly Delivery',
                body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        ${emailHeader}
                        <div style="padding: 30px 25px;">
                            <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 22px;">🌿 Order Confirmed!</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Hi ${customerName},</p>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Thank you for your order! We've received your order and it's being processed.</p>
                            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0;">
                                <p style="margin: 0 0 10px 0; color: #065f46;"><strong>Order ID:</strong> <span style="color: #10b981; font-family: monospace;">${orderId.slice(0, 8).toUpperCase()}</span></p>
                                <p style="margin: 0; color: #065f46;"><strong>Status:</strong> <span style="background: #fef3c7; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; color: #92400e;">⏳ PENDING</span></p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">We'll notify you as soon as your order is confirmed and being prepared. You can track your order status anytime using the link below.</p>
                        </div>
                        ${emailFooter}
                    </div>
                `
            },
            confirmed: {
                subject: '✅ Order Confirmed - Being Prepared',
                body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        ${emailHeader}
                        <div style="padding: 30px 25px;">
                            <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 22px;">✅ Order Confirmed!</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Hi ${customerName},</p>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Great news! Your order has been confirmed and is now being prepared.</p>
                            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
                                <p style="margin: 0 0 10px 0; color: #1e40af;"><strong>Order ID:</strong> <span style="color: #3b82f6; font-family: monospace;">${orderId.slice(0, 8).toUpperCase()}</span></p>
                                <p style="margin: 0; color: #1e40af;"><strong>Status:</strong> <span style="background: #dbeafe; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; color: #1e40af;">✅ CONFIRMED</span></p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">Our team is carefully preparing your items for delivery. You'll receive another update once your order is out for delivery.</p>
                        </div>
                        ${emailFooter}
                    </div>
                `
            },
            preparing: {
                subject: '📦 Order Being Prepared',
                body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        ${emailHeader}
                        <div style="padding: 30px 25px;">
                            <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 22px;">📦 Order Being Prepared</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Hi ${customerName},</p>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Your order is currently being prepared by our expert team.</p>
                            <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #a855f7; margin: 25px 0;">
                                <p style="margin: 0 0 10px 0; color: #6b21a8;"><strong>Order ID:</strong> <span style="color: #a855f7; font-family: monospace;">${orderId.slice(0, 8).toUpperCase()}</span></p>
                                <p style="margin: 0; color: #6b21a8;"><strong>Status:</strong> <span style="background: #f3e8ff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; color: #6b21a8;">📦 PREPARING</span></p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">We're making sure everything is perfect for you! Your order will be out for delivery soon.</p>
                        </div>
                        ${emailFooter}
                    </div>
                `
            },
            out_for_delivery: {
                subject: '🚚 Order Out for Delivery!',
                body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        ${emailHeader}
                        <div style="padding: 30px 25px;">
                            <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 22px;">🚚 Your Order is On The Way!</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Hi ${customerName},</p>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Great news! Your order is now out for delivery and will arrive soon.</p>
                            <div style="background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #06b6d4; margin: 25px 0;">
                                <p style="margin: 0 0 10px 0; color: #0e7490;"><strong>Order ID:</strong> <span style="color: #06b6d4; font-family: monospace;">${orderId.slice(0, 8).toUpperCase()}</span></p>
                                <p style="margin: 0; color: #0e7490;"><strong>Status:</strong> <span style="background: #cffafe; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; color: #0e7490;">🚚 OUT FOR DELIVERY</span></p>
                            </div>
                            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>⚠️ Important:</strong> Please ensure someone is available to receive the delivery. Our driver will contact you when nearby.</p>
                            </div>
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="${orderUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                    📍 Track Live Location
                                </a>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0; text-align: center; font-size: 13px;">Click the button above to see your driver's real-time location on the map!</p>
                        </div>
                        ${emailFooter}
                    </div>
                `
            },
            delivered: {
                subject: '✨ Order Delivered - Enjoy!',
                body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        ${emailHeader}
                        <div style="padding: 30px 25px;">
                            <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 22px;">✨ Order Delivered Successfully!</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Hi ${customerName},</p>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Your order has been successfully delivered. We hope everything arrived in perfect condition!</p>
                            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0;">
                                <p style="margin: 0 0 10px 0; color: #065f46;"><strong>Order ID:</strong> <span style="color: #10b981; font-family: monospace;">${orderId.slice(0, 8).toUpperCase()}</span></p>
                                <p style="margin: 0; color: #065f46;"><strong>Status:</strong> <span style="background: #d1fae5; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; color: #065f46;">✅ DELIVERED</span></p>
                            </div>
                            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                                <p style="color: #059669; font-size: 18px; margin: 0 0 10px 0; font-weight: bold;">Thank you for choosing Dragonfly! 🎉</p>
                                <p style="color: #065f46; margin: 0; font-size: 14px;">We hope you enjoy your premium products.</p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">If you have any concerns or feedback, please don't hesitate to contact us. We're here to help!</p>
                        </div>
                        ${emailFooter}
                    </div>
                `
            },
            cancelled: {
                subject: '❌ Order Cancelled',
                body: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        ${emailHeader}
                        <div style="padding: 30px 25px;">
                            <h2 style="color: #ef4444; margin: 0 0 15px 0; font-size: 22px;">❌ Order Cancelled</h2>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Hi ${customerName},</p>
                            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">Your order has been cancelled.</p>
                            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 25px 0;">
                                <p style="margin: 0 0 10px 0; color: #991b1b;"><strong>Order ID:</strong> <span style="color: #ef4444; font-family: monospace;">${orderId.slice(0, 8).toUpperCase()}</span></p>
                                <p style="margin: 0; color: #991b1b;"><strong>Status:</strong> <span style="background: #fee2e2; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; color: #991b1b;">❌ CANCELLED</span></p>
                            </div>
                            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">If you have any questions about this cancellation or need assistance, please don't hesitate to contact us. We're here to help!</p>
                        </div>
                        ${emailFooter}
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