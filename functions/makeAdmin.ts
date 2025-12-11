import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { email } = await req.json();
    
    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Find the user by email
    const users = await base44.asServiceRole.entities.User.list();
    const targetUser = users.find(u => u.email === email);
    
    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user role to admin
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      role: 'admin'
    });

    return Response.json({ 
      success: true, 
      message: `User ${email} is now an admin` 
    });

  } catch (error) {
    console.error('Error making admin:', error);
    return Response.json({ 
      error: error.message || 'Failed to make user admin' 
    }, { status: 500 });
  }
});