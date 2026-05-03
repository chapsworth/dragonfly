import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { device_token, platform } = await req.json();

    if (!device_token || !platform) {
      return Response.json({ error: 'Missing device_token or platform' }, { status: 400 });
    }

    // Check if token already exists for this user
    const existingTokens = await base44.entities.DeviceToken.filter({
      user_email: user.email,
      device_token: device_token
    });

    if (existingTokens.length > 0) {
      // Update existing token
      await base44.entities.DeviceToken.update(existingTokens[0].id, {
        is_active: true,
        last_used: new Date().toISOString()
      });
      return Response.json({ success: true, message: 'Token updated' });
    }

    // Create new token
    await base44.entities.DeviceToken.create({
      user_email: user.email,
      device_token,
      platform,
      is_active: true,
      last_used: new Date().toISOString()
    });

    return Response.json({ success: true, message: 'Token registered' });
  } catch (error) {
    console.error('Error registering device token:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});