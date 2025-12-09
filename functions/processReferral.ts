import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has already claimed referral bonus
    if (user.referral_bonus_claimed) {
      return Response.json({ 
        success: false, 
        message: 'Referral bonus already claimed' 
      });
    }

    // Check if user was referred
    if (!user.referred_by) {
      return Response.json({ 
        success: false, 
        message: 'No referrer found' 
      });
    }

    // Get the referrer
    const users = await base44.asServiceRole.entities.User.list();
    const referrer = users.find(u => u.email === user.referred_by);

    if (!referrer) {
      return Response.json({ 
        success: false, 
        message: 'Referrer not found' 
      });
    }

    const REFERRAL_BONUS = 100;

    // Award points to both users
    const userNewPoints = (user.loyalty_points || 0) + REFERRAL_BONUS;
    const userNewTotal = (user.total_points_earned || 0) + REFERRAL_BONUS;
    const referrerNewPoints = (referrer.loyalty_points || 0) + REFERRAL_BONUS;
    const referrerNewTotal = (referrer.total_points_earned || 0) + REFERRAL_BONUS;

    // Calculate new tiers
    const calculateTier = (totalEarned) => {
      if (totalEarned >= 5000) return 'platinum';
      if (totalEarned >= 1500) return 'gold';
      if (totalEarned >= 500) return 'silver';
      return 'bronze';
    };

    // Update referred user
    await base44.asServiceRole.entities.User.update(user.id, {
      loyalty_points: userNewPoints,
      total_points_earned: userNewTotal,
      loyalty_tier: calculateTier(userNewTotal),
      referral_bonus_claimed: true
    });

    // Update referrer
    await base44.asServiceRole.entities.User.update(referrer.id, {
      loyalty_points: referrerNewPoints,
      total_points_earned: referrerNewTotal,
      loyalty_tier: calculateTier(referrerNewTotal),
      total_referrals: (referrer.total_referrals || 0) + 1
    });

    // Create transaction records
    await base44.asServiceRole.entities.PointsTransaction.bulkCreate([
      {
        user_email: user.email,
        points: REFERRAL_BONUS,
        transaction_type: 'bonus',
        description: `Referral bonus from ${referrer.full_name}`,
        balance_after: userNewPoints
      },
      {
        user_email: referrer.email,
        points: REFERRAL_BONUS,
        transaction_type: 'bonus',
        description: `Referral reward - ${user.full_name} joined`,
        balance_after: referrerNewPoints
      }
    ]);

    return Response.json({ 
      success: true,
      message: 'Referral bonus awarded',
      pointsEarned: REFERRAL_BONUS
    });
  } catch (error) {
    console.error('Referral processing error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});