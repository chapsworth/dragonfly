import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Copy, Check, Share2, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ReferralCard({ user }) {
  const [copied, setCopied] = useState(false);
  
  const referralCode = user?.referral_code || '';
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;
  const totalReferrals = user?.total_referrals || 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join GreenLeaf',
          text: 'Use my referral code to get started and we both earn rewards!',
          url: referralUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xl overflow-hidden relative"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-6 h-6" />
              <h3 className="text-xl font-bold">Refer Friends</h3>
            </div>
            <p className="text-purple-100 text-sm">
              Share your code and earn <span className="font-bold">100 points</span> for each friend who makes their first purchase
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur">
            <Gift className="w-6 h-6" />
          </div>
        </div>

        {/* Referral Stats */}
        <div className="mb-4 p-4 rounded-xl bg-white/10 backdrop-blur">
          <p className="text-purple-100 text-xs mb-1">Total Referrals</p>
          <p className="text-3xl font-bold">{totalReferrals}</p>
        </div>

        {/* Referral Code */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-purple-100 mb-1 block">Your Referral Code</label>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="bg-white/20 backdrop-blur border-white/30 text-white placeholder:text-purple-200 h-12 text-lg font-bold"
              />
              <Button
                onClick={handleCopy}
                className="h-12 px-4 bg-white text-purple-600 hover:bg-purple-50"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs text-purple-100 mb-1 block">Share Link</label>
            <div className="flex gap-2">
              <Input
                value={referralUrl}
                readOnly
                className="bg-white/20 backdrop-blur border-white/30 text-white placeholder:text-purple-200 text-sm"
              />
              <Button
                onClick={handleShare}
                className="px-4 bg-white text-purple-600 hover:bg-purple-50"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-purple-100">
            <strong>How it works:</strong> Share your code with friends. When they sign up and make their first purchase, you both get 100 bonus points!
          </p>
        </div>
      </div>
    </motion.div>
  );
}