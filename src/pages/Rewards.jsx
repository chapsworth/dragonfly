import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Gift, History, Award, TrendingUp, Crown } from 'lucide-react';
import LoyaltyCard from '@/components/loyalty/LoyaltyCard';
import RewardCard from '@/components/loyalty/RewardCard';
import PointsHistory from '@/components/loyalty/PointsHistory';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const tierInfo = {
  bronze: { min: 0, color: 'from-amber-500 to-yellow-600', icon: Award },
  silver: { min: 500, color: 'from-slate-400 to-gray-500', icon: Award },
  gold: { min: 1500, color: 'from-yellow-500 to-amber-600', icon: Crown },
  platinum: { min: 5000, color: 'from-purple-500 to-indigo-600', icon: Crown }
};

export default function Rewards() {
  const [activeTab, setActiveTab] = useState('rewards');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: rewards = [], isLoading: loadingRewards } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.filter({ is_active: true })
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['pointsTransactions', user?.email],
    queryFn: () => base44.entities.PointsTransaction.filter(
      { user_email: user.email },
      '-created_date',
      50
    ),
    enabled: !!user?.email
  });

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      const currentUser = await base44.auth.me();
      const userPoints = currentUser.loyalty_points || 0;

      if (userPoints < reward.points_cost) {
        throw new Error('Not enough points');
      }

      // Deduct points
      const newBalance = userPoints - reward.points_cost;
      await base44.auth.updateMe({ loyalty_points: newBalance });

      // Create transaction record
      await base44.entities.PointsTransaction.create({
        user_email: currentUser.email,
        points: -reward.points_cost,
        transaction_type: 'redeemed',
        description: `Redeemed: ${reward.name}`,
        reward_id: reward.id,
        balance_after: newBalance
      });

      return newBalance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['pointsTransactions'] });
      toast.success('Reward redeemed successfully!', {
        description: 'Check your email for your reward code'
      });
    },
    onError: (error) => {
      toast.error('Failed to redeem reward', {
        description: error.message
      });
    }
  });

  const userPoints = user?.loyalty_points || 0;
  const userTier = user?.loyalty_tier || 'bronze';
  const totalEarned = user?.total_points_earned || 0;

  // Calculate next tier progress
  const currentTierIndex = Object.keys(tierInfo).indexOf(userTier);
  const nextTierKey = Object.keys(tierInfo)[currentTierIndex + 1];
  const nextTierMin = nextTierKey ? tierInfo[nextTierKey].min : null;
  const progress = nextTierMin 
    ? Math.min(((totalEarned - tierInfo[userTier].min) / (nextTierMin - tierInfo[userTier].min)) * 100, 100)
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-emerald-900">Rewards</h1>
          </div>
          <p className="text-emerald-600">Earn points and unlock exclusive rewards</p>
        </motion.div>

        {/* Loyalty Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <LoyaltyCard user={user} points={userPoints} />
        </motion.div>

        {/* Tier Progress */}
        {nextTierMin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-6 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-900">
                  Next Tier: {nextTierKey.charAt(0).toUpperCase() + nextTierKey.slice(1)}
                </span>
              </div>
              <span className="text-sm text-emerald-600">
                {nextTierMin - totalEarned} points to go
              </span>
            </div>
            <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
              />
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40">
            <p className="text-sm text-emerald-600 mb-1">Lifetime Points</p>
            <p className="text-2xl font-bold text-emerald-900">{totalEarned.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/40">
            <p className="text-sm text-emerald-600 mb-1">Member Since</p>
            <p className="text-2xl font-bold text-emerald-900">
              {user?.created_date ? new Date(user.created_date).getFullYear() : new Date().getFullYear()}
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-white/60 backdrop-blur-xl border border-white/40 mb-6">
            <TabsTrigger value="rewards" className="flex-1">
              <Gift className="w-4 h-4 mr-2" />
              Available Rewards
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards">
            {loadingRewards ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-emerald-600">No rewards available at the moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rewards.map((reward, index) => (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RewardCard
                      reward={reward}
                      userPoints={userPoints}
                      userTier={userTier}
                      onRedeem={(reward) => redeemMutation.mutate(reward)}
                      isRedeeming={redeemMutation.isPending}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : (
              <PointsHistory transactions={transactions} />
            )}
          </TabsContent>
        </Tabs>

        {/* How to Earn */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white"
        >
          <h3 className="text-xl font-bold mb-4">How to Earn Points</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'Make Purchases', desc: '$1 = 1 point', icon: '🛍️' },
              { title: 'Referrals', desc: 'Earn 100 bonus points', icon: '👥' },
              { title: 'Special Promos', desc: 'Double points events', icon: '🎉' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-semibold mb-1">{item.title}</p>
                <p className="text-sm text-emerald-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}