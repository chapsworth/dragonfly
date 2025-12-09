import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orderId, status, customerEmail, customerName } = await req.json();

        const statusMessages = {
            pending: {
                subject: '🌿 Order Confirmed - GreenLeaf Delivery',
                body: `Hi ${customerName},\n\nThank you for your order! We've received your order and it's being processed.\n\nOrder ID: ${orderId}\nStatus: Pending\n\nYou can track your order status at any time by visiting your Orders page.\n\nWe'll notify you as soon as your order is confirmed and being prepared.\n\nBest regards,\nGreenLeaf Team`
            },
            confirmed: {
                subject: '✅ Order Confirmed - Being Prepared',
                body: `Hi ${customerName},\n\nGreat news! Your order has been confirmed and is now being prepared.\n\nOrder ID: ${orderId}\nStatus: Confirmed\n\nOur team is carefully preparing your items for delivery.\n\nBest regards,\nGreenLeaf Team`
            },
            preparing: {
                subject: '📦 Order Being Prepared',
                body: `Hi ${customerName},\n\nYour order is currently being prepared by our team.\n\nOrder ID: ${orderId}\nStatus: Preparing\n\nWe're making sure everything is perfect for you!\n\nBest regards,\nGreenLeaf Team`
            },
            out_for_delivery: {
                subject: '🚚 Order Out for Delivery!',
                body: `Hi ${customerName},\n\nYour order is on its way!\n\nOrder ID: ${orderId}\nStatus: Out for Delivery\n\nOur driver will arrive at your location soon. Please ensure someone is available to receive the delivery.\n\nBest regards,\nGreenLeaf Team`
            },
            delivered: {
                subject: '✨ Order Delivered - Enjoy!',
                body: `Hi ${customerName},\n\nYour order has been successfully delivered!\n\nOrder ID: ${orderId}\nStatus: Delivered\n\nThank you for choosing GreenLeaf. We hope you enjoy your products!\n\nIf you have any concerns, please don't hesitate to contact us.\n\nBest regards,\nGreenLeaf Team`
            },
            cancelled: {
                subject: '❌ Order Cancelled',
                body: `Hi ${customerName},\n\nYour order has been cancelled.\n\nOrder ID: ${orderId}\nStatus: Cancelled\n\nIf you have any questions about this cancellation, please contact us.\n\nBest regards,\nGreenLeaf Team`
            }
        };

        const emailContent = statusMessages[status];
        
        if (!emailContent) {
            return Response.json({ error: 'Invalid status' }, { status: 400 });
        }

        await base44.integrations.Core.SendEmail({
            from_name: 'GreenLeaf Delivery',
            to: customerEmail,
            subject: emailContent.subject,
            body: emailContent.body
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});