import React from 'react';
import { Sparkles, Award, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const tierConfig = {
  bronze: {
    gradient: 'from-amber-600 via-amber-500 to-yellow-600',
    icon: Sparkles,
    name: 'Bronze',
    shimmer: 'from-amber-400/0 via-amber-200/40 to-amber-400/0'
  },
  silver: {
    gradient: 'from-slate-400 via-gray-300 to-slate-500',
    icon: Award,
    name: 'Silver',
    shimmer: 'from-slate-300/0 via-white/60 to-slate-300/0'
  },
  gold: {
    gradient: 'from-yellow-500 via-amber-400 to-yellow-600',
    icon: Crown,
    name: 'Gold',
    shimmer: 'from-yellow-300/0 via-yellow-100/50 to-yellow-300/0'
  },
  platinum: {
    gradient: 'from-purple-600 via-violet-500 to-indigo-600',
    icon: Crown,
    name: 'Platinum',
    shimmer: 'from-purple-400/0 via-white/40 to-purple-400/0'
  }
};

export default function LoyaltyCard({ user, points }) {
  const tier = user?.loyalty_tier || 'bronze';
  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative w-full max-w-md mx-auto"
      style={{ perspective: 1000 }}
    >
      {/* Card Shadow */}
      <div className="absolute inset-0 bg-black/20 blur-2xl scale-95 translate-y-4" />
      
      {/* Main Card */}
      <motion.div
        whileHover={{ scale: 1.02, rotateY: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={cn(
          "relative rounded-3xl overflow-hidden shadow-2xl",
          "aspect-[1.586/1]" // Credit card aspect ratio
        )}
      >
        {/* Card Background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br",
          config.gradient
        )} />

        {/* Animated Shimmer Effect */}
        <motion.div
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 1
          }}
          className={cn(
            "absolute inset-0 bg-gradient-to-r",
            config.shimmer,
            "skew-x-12"
          )}
        />

        {/* Dragonfly Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 250">
            {/* Dragonfly silhouettes */}
            <g transform="translate(300, 50)">
              <ellipse cx="0" cy="0" rx="25" ry="8" fill="white" opacity="0.3" />
              <ellipse cx="0" cy="0" rx="8" ry="25" fill="white" opacity="0.3" />
              <ellipse cx="0" cy="15" rx="6" ry="15" fill="white" opacity="0.4" />
            </g>
            <g transform="translate(100, 180) scale(0.8)">
              <ellipse cx="0" cy="0" rx="20" ry="6" fill="white" opacity="0.2" />
              <ellipse cx="0" cy="0" rx="6" ry="20" fill="white" opacity="0.2" />
            </g>
            <g transform="translate(320, 200) scale(0.6)">
              <ellipse cx="0" cy="0" rx="15" ry="5" fill="white" opacity="0.25" />
              <ellipse cx="0" cy="0" rx="5" ry="15" fill="white" opacity="0.25" />
            </g>
          </svg>
        </div>

        {/* Cannabis leaf pattern */}
        <div className="absolute top-4 right-4 opacity-20">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C12 2 8 6 8 10C8 12 9 14 12 14C15 14 16 12 16 10C16 6 12 2 12 2Z" />
            <path d="M12 22C12 22 8 18 8 14C8 12 9 10 12 10C15 10 16 12 16 14C16 18 12 22 12 22Z" />
            <path d="M2 12C2 12 6 8 10 8C12 8 14 9 14 12C14 15 12 16 10 16C6 16 2 12 2 12Z" />
            <path d="M22 12C22 12 18 8 14 8C12 8 10 9 10 12C10 15 12 16 14 16C18 16 22 12 22 12Z" />
          </svg>
        </div>

        {/* Card Content */}
        <div className="relative h-full p-6 flex flex-col justify-between text-white">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium opacity-90">{config.name} Member</span>
              </div>
              <h3 className="text-2xl font-bold tracking-wide">
                DRAGONFLY
              </h3>
              <p className="text-xs opacity-75 tracking-wider">REWARDS CLUB</p>
            </div>
            
            {/* Chip */}
            <div className="w-12 h-10 rounded bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-200/50 to-amber-400/30" />
            </div>
          </div>

          {/* Points Display */}
          <div className="space-y-2">
            <div>
              <p className="text-xs opacity-75 tracking-wider uppercase">Points Balance</p>
              <div className="flex items-baseline gap-2">
                <motion.p
                  key={points}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl font-bold tracking-tight"
                >
                  {points?.toLocaleString() || '0'}
                </motion.p>
                <span className="text-sm opacity-75">PTS</span>
              </div>
            </div>
            
            {/* Member Info */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs opacity-75">Member</p>
                <p className="text-sm font-medium tracking-wide">
                  {user?.full_name || 'Guest'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75">Since</p>
                <p className="text-sm font-medium">
                  {user?.created_date ? new Date(user.created_date).getFullYear() : new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Holographic Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" />
      </motion.div>
    </motion.div>
  );
}