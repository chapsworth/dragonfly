import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import jwt from 'npm:jsonwebtoken@9.0.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { user_email, title, body, data } = await req.json();

    if (!user_email || !title || !body) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's device tokens
    const deviceTokens = await base44.asServiceRole.entities.DeviceToken.filter({
      user_email,
      is_active: true
    });

    if (deviceTokens.length === 0) {
      return Response.json({ error: 'No active device tokens found for user' }, { status: 404 });
    }

    // Get APNs credentials
    const APNS_KEY_ID = Deno.env.get('APNS_KEY_ID');
    const APNS_TEAM_ID = Deno.env.get('APNS_TEAM_ID');
    const APNS_BUNDLE_ID = Deno.env.get('APNS_BUNDLE_ID');
    const APNS_PRIVATE_KEY = Deno.env.get('APNS_PRIVATE_KEY');

    if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_BUNDLE_ID || !APNS_PRIVATE_KEY) {
      return Response.json({ error: 'APNs credentials not configured' }, { status: 500 });
    }

    const results = [];

    // Send to each device token
    for (const deviceToken of deviceTokens) {
      try {
        if (deviceToken.platform === 'ios') {
          // Generate JWT token for APNs
          const token = jwt.sign(
            {
              iss: APNS_TEAM_ID,
              iat: Math.floor(Date.now() / 1000)
            },
            APNS_PRIVATE_KEY,
            {
              algorithm: 'ES256',
              header: {
                alg: 'ES256',
                kid: APNS_KEY_ID
              }
            }
          );

          // Prepare APNs payload
          const payload = {
            aps: {
              alert: {
                title,
                body
              },
              sound: 'default',
              badge: 1
            },
            ...(data || {})
          };

          // Send to APNs (production)
          const apnsUrl = `https://api.push.apple.com/3/device/${deviceToken.device_token}`;
          
          const response = await fetch(apnsUrl, {
            method: 'POST',
            headers: {
              'authorization': `bearer ${token}`,
              'apns-topic': APNS_BUNDLE_ID,
              'apns-push-type': 'alert',
              'apns-priority': '10'
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            results.push({ device_token: deviceToken.device_token, status: 'sent' });
            
            // Log successful notification
            await base44.asServiceRole.entities.NotificationHistory.create({
              user_email,
              title,
              body,
              platform: 'ios',
              status: 'sent',
              data
            });

            // Update last_used
            await base44.asServiceRole.entities.DeviceToken.update(deviceToken.id, {
              last_used: new Date().toISOString()
            });
          } else {
            const errorText = await response.text();
            results.push({ device_token: deviceToken.device_token, status: 'failed', error: errorText });
            
            // Log failed notification
            await base44.asServiceRole.entities.NotificationHistory.create({
              user_email,
              title,
              body,
              platform: 'ios',
              status: 'failed',
              error_message: errorText,
              data
            });

            // Deactivate token if it's invalid
            if (response.status === 410) {
              await base44.asServiceRole.entities.DeviceToken.update(deviceToken.id, {
                is_active: false
              });
            }
          }
        } else if (deviceToken.platform === 'android') {
          // Android FCM support can be added here
          results.push({ device_token: deviceToken.device_token, status: 'skipped', reason: 'Android not yet supported' });
        }
      } catch (error) {
        results.push({ device_token: deviceToken.device_token, status: 'error', error: error.message });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});