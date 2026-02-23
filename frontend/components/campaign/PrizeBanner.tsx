'use client';

import { Trophy, Award, Gift, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

interface Prize {
  place: string;
  amount: string;
  icon: React.ReactNode;
  color: string;
}

interface PrizeBannerProps {
  totalPool?: string;
  prizes?: Prize[];
  compact?: boolean;
}

const DEFAULT_PRIZES: Prize[] = [
  {
    place: '1st Place',
    amount: '$1,000',
    icon: <Trophy className="w-6 h-6" />,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    place: '2nd Place',
    amount: '$750',
    icon: <Award className="w-6 h-6" />,
    color: 'from-gray-300 to-gray-400',
  },
  {
    place: '3rd Place',
    amount: '$500',
    icon: <Gift className="w-6 h-6" />,
    color: 'from-orange-600 to-orange-700',
  },
  {
    place: 'Top 10',
    amount: '$250',
    icon: <Coins className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
  },
];

export function PrizeBanner({ 
  totalPool = '$2,500', 
  prizes = DEFAULT_PRIZES,
  compact = false 
}: PrizeBannerProps) {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-provn-accent/20 to-purple-600/20 border border-provn-accent/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm text-provn-muted">Total Prize Pool</div>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                {totalPool}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-provn-muted">Grand Prize</div>
            <div className="text-xl font-bold text-provn-accent">$1,000</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-provn-surface/90 to-provn-surface-2/90 border-2 border-provn-accent/30 rounded-2xl p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-provn-accent/5 to-purple-500/5"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-provn-accent/10 rounded-full blur-3xl"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-provn-text mb-2">Prize Pool</h2>
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500">
            {totalPool}
          </div>
          <p className="text-provn-muted mt-2">in USDT prizes</p>
        </div>

        {/* Prize Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {prizes.map((prize, index) => (
            <motion.div
              key={prize.place}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-provn-surface border border-provn-border rounded-xl p-6 text-center hover:border-provn-accent/50 transition-all group"
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br ${prize.color} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white`}>
                {prize.icon}
              </div>
              <div className="text-sm text-provn-muted mb-1">{prize.place}</div>
              <div className="text-2xl font-bold text-provn-text">{prize.amount}</div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-6 border-t border-provn-border text-center">
          <p className="text-sm text-provn-muted">
            Winners determined by overall Web3 score. Final rankings locked at campaign end.
          </p>
        </div>
      </div>
    </div>
  );
}
