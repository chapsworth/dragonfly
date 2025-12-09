import React from 'react';
import { Gift, Percent, Truck, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const rewardIcons = {
  discount: Percent,
  free_product: Gift,
  free_delivery: Truck,
  special_item: Sparkles
};

const tierColors = {
  bronze: 'from-amber-500 to-yellow-600',
  silver: 'from-slate-400 to-gray-500',
  gold: 'from-yellow-500 to-amber-600',
  platinum: 'from-purple-500 to-indigo-600'
};

export default function RewardCard({ reward, userPoints, userTier, onRedeem, isRedeeming }) {
  const Icon = rewardIcons[reward.reward_type] || Gift;
  const canAfford = userPoints >= reward.points_cost;
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  const hasRequiredTier = tierOrder.indexOf(userTier) >= tierOrder.indexOf(reward.tier_required);
  const canRedeem = canAfford && hasRequiredTier && reward.is_active;

  return (
    <motion.div
      whileHover={{ y: canRedeem ? -4 : 0 }}
      className={cn(
        "p-5 rounded-2xl border-2 transition-all",
        canRedeem 
          ? "bg-white/80 backdrop-blur-xl border-emerald-200 shadow-lg hover:shadow-xl"
          : "bg-white/40 backdrop-blur-sm border-gray-200"
      )}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
          canRedeem 
            ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/30"
            : "bg-gray-200"
        )}>
          <Icon className={cn("w-7 h-7", canRedeem ? "text-white" : "text-gray-400")} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className={cn(
                "font-bold text-lg mb-1",
                canRedeem ? "text-emerald-900" : "text-gray-500"
              )}>
                {reward.name}
              </h3>
              {!hasRequiredTier && (
                <Badge variant="outline" className={cn(
                  "mb-2 border-2",
                  `bg-gradient-to-r ${tierColors[reward.tier_required]}`,
                  "text-white border-white/20"
                )}>
                  <Lock className="w-3 h-3 mr-1" />
                  {reward.tier_required.charAt(0).toUpperCase() + reward.tier_required.slice(1)} Required
                </Badge>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className={cn(
                "text-2xl font-bold",
                canAfford ? "text-emerald-700" : "text-gray-400"
              )}>
                {reward.points_cost}
              </div>
              <div className="text-xs text-gray-500">points</div>
            </div>
          </div>

          <p className={cn(
            "text-sm mb-4",
            canRedeem ? "text-emerald-600" : "text-gray-400"
          )}>
            {reward.description}
          </p>

          {/* Reward Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {reward.discount_amount && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  ${reward.discount_amount} OFF
                </Badge>
              )}
              {reward.discount_percentage && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {reward.discount_percentage}% OFF
                </Badge>
              )}
            </div>

            <Button
              onClick={() => onRedeem(reward)}
              disabled={!canRedeem || isRedeeming}
              className={cn(
                "rounded-xl font-semibold",
                canRedeem
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {isRedeeming ? 'Redeeming...' : canRedeem ? 'Redeem' : !canAfford ? 'Not Enough Points' : 'Locked'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}