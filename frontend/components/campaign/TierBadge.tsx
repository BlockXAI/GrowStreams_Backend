'use client';

import { Trophy, Award, Star, Zap, Sparkles } from 'lucide-react';

interface TierBadgeProps {
  tier: string;
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_CONFIG = {
  'Elite': {
    color: 'from-yellow-500 to-orange-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-500',
    icon: Trophy,
    description: 'Master Web3 Developer',
  },
  'Expert': {
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-500',
    icon: Award,
    description: 'Expert Web3 Developer',
  },
  'Advanced': {
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-500',
    icon: Star,
    description: 'Advanced Web3 Developer',
  },
  'Intermediate': {
    color: 'from-orange-500 to-yellow-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-500',
    icon: Zap,
    description: 'Emerging Web3 Developer',
  },
  'Beginner': {
    color: 'from-gray-500 to-gray-600',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-500',
    icon: Sparkles,
    description: 'Beginner Web3 Developer',
  },
};

export function TierBadge({ tier, score, size = 'md' }: TierBadgeProps) {
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.Beginner;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border ${config.bg} ${config.border} ${sizeClasses[size]}`}>
      <Icon className={`${iconSizes[size]} ${config.text}`} />
      <span className={`font-bold ${config.text}`}>{tier}</span>
      <span className="text-provn-muted">·</span>
      <span className="font-semibold text-provn-text">{score}/100</span>
    </div>
  );
}
