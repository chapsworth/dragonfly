import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const { email, credentialId } = await req.json();

    if (!email || !credentialId) {
      return Response.json({ error: 'Email and credentialId required' }, { status: 400 });
    }

    // Initialize Base44 client
    const base44 = createClientFromRequest(req);

    // Verify the user exists and has biometric enabled
    const users = await base44.asServiceRole.entities.User.list();
    const user = users.find(u => u.email === email);

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.biometric_enabled) {
      return Response.json({ error: 'Biometric not enabled for this user' }, { status: 400 });
    }

    // Verify the credential ID matches
    if (user.biometric_credential_id !== credentialId) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create a session by logging the user in
    // Note: This requires the password, so we'll use a different approach
    // We'll mark the session as authenticated in localStorage on frontend
    
    return Response.json({ 
      success: true,
      user: {
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Biometric login error:', error);
    return Response.json({ 
      error: error.message || 'Biometric login failed' 
    }, { status: 500 });
  }
});