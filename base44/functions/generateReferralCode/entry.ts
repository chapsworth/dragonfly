import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a referral code
    if (user.referral_code) {
      return Response.json({ 
        referralCode: user.referral_code 
      });
    }

    // Generate unique referral code
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let referralCode;
    let isUnique = false;
    const allUsers = await base44.asServiceRole.entities.User.list();

    // Keep generating until we get a unique code
    while (!isUnique) {
      referralCode = generateCode();
      isUnique = !allUsers.some(u => u.referral_code === referralCode);
    }

    // Update user with referral code
    await base44.auth.updateMe({ referral_code: referralCode });

    return Response.json({ referralCode });
  } catch (error) {
    console.error('Referral code generation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});