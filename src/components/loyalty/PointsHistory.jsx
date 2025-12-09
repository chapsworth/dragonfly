import React from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Gift, ShoppingBag, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const transactionIcons = {
  earned: ShoppingBag,
  redeemed: Gift,
  bonus: Award,
  expired: TrendingDown
};

export default function PointsHistory({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-emerald-600">No transaction history yet</p>
        <p className="text-sm text-emerald-500 mt-1">Start shopping to earn points!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction, index) => {
        const Icon = transactionIcons[transaction.transaction_type] || ShoppingBag;
        const isPositive = transaction.points > 0;

        return (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/60 backdrop-blur border border-white/40"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              isPositive 
                ? "bg-emerald-100 text-emerald-600"
                : "bg-red-100 text-red-600"
            )}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-900 text-sm truncate">
                {transaction.description}
              </p>
              <p className="text-xs text-emerald-500">
                {format(new Date(transaction.created_date), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <div className={cn(
                "text-lg font-bold",
                isPositive ? "text-emerald-600" : "text-red-600"
              )}>
                {isPositive ? '+' : ''}{transaction.points}
              </div>
              <div className="text-xs text-emerald-500">
                Balance: {transaction.balance_after}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}