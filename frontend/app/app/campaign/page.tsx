'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api } from '@/lib/growstreams-api';
import {
  Trophy, GitBranch, Twitter, Zap, ArrowRight, CheckCircle,
  AlertCircle, Loader2, DollarSign, Users, Calendar, Star,
} from 'lucide-react';
import Link from 'next/link';

type Track = 'OSS' | 'CONTENT' | 'BOTH';

interface CampaignConfig {
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  poolUSDC: number;
  scoreThreshold: number;
  xpTiers: {
    oss: { initial: Record<string, number>; daily: Record<string, number>; mergeBonus: number };
    content: { initial: Record<string, number>; threadBonus: string; viralBonus: number; reshareBonus: number };
  };
}

export default function CampaignPage() {
  const { account } = useAccount();
  const [config, setConfig] = useState<CampaignConfig | null>(null);
  const [participant, setParticipant] = useState<Record<string, unknown> | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [track, setTrack] = useState<Track>('OSS');
  const [githubHandle, setGithubHandle] = useState('');
  const [xHandle, setXHandle] = useState('');

  const wallet = account?.decodedAddress || '';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, stats] = await Promise.all([
        api.campaign.config().catch(() => null),
        wallet ? api.campaign.participant(wallet).catch(() => null) : null,
      ]);
      if (cfg) setConfig(cfg as unknown as CampaignConfig);
      if (stats && (stats as Record<string, unknown>).participant) {
        setParticipant(stats as Record<string, unknown>);
        setIsRegistered(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRegister = async () => {
    if (!wallet) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const params: { wallet: string; github_handle?: string; x_handle?: string; track: string } = {
        wallet,
        track,
      };
      if (track === 'OSS' || track === 'BOTH') {
        if (!githubHandle.trim()) {
          setError('GitHub handle is required for OSS track');
          setSubmitting(false);
          return;
        }
        params.github_handle = githubHandle.trim();
      }
      if (track === 'CONTENT' || track === 'BOTH') {
        if (!xHandle.trim()) {
          setError('X/Twitter handle is required for Content track');
          setSubmitting(false);
          return;
        }
        params.x_handle = xHandle.trim().replace(/^@/, '');
      }

      await api.campaign.register(params);
      setSuccess('Successfully registered! You can now start earning XP.');
      setIsRegistered(true);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const daysRemaining = config?.campaignEndDate
    ? Math.max(0, Math.ceil((new Date(config.campaignEndDate).getTime() - Date.now()) / 86400000))
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">GrowStreams Campaign</h1>
        <p className="text-provn-muted max-w-lg mx-auto">
          Earn XP and USDC rewards by contributing code or creating content about GrowStreams.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-400">${config?.poolUSDC || 500}</p>
          <p className="text-[10px] text-provn-muted uppercase tracking-wider">Prize Pool</p>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-400">{config?.scoreThreshold || 70}</p>
          <p className="text-[10px] text-provn-muted uppercase tracking-wider">Min Score</p>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <Calendar className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue-400">{daysRemaining ?? '--'}</p>
          <p className="text-[10px] text-provn-muted uppercase tracking-wider">Days Left</p>
        </div>
        <Link href="/app/leaderboard" className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center hover:border-purple-500/30 transition-colors">
          <Users className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-400">View</p>
          <p className="text-[10px] text-provn-muted uppercase tracking-wider">Leaderboard</p>
        </Link>
      </div>

      {/* Already Registered */}
      {isRegistered && participant ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-lg font-semibold text-emerald-400">You&apos;re Registered!</h2>
              <p className="text-sm text-provn-muted">Start contributing to earn XP.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-provn-bg/50 rounded-lg p-3">
              <p className="text-[10px] text-provn-muted uppercase tracking-wider">Total XP</p>
              <p className="text-xl font-bold font-mono text-emerald-400">
                {((participant as Record<string, unknown>).participant as Record<string, unknown>)?.total_xp as number || 0}
              </p>
            </div>
            <div className="bg-provn-bg/50 rounded-lg p-3">
              <p className="text-[10px] text-provn-muted uppercase tracking-wider">Rank</p>
              <p className="text-xl font-bold font-mono text-amber-400">
                #{(participant as Record<string, unknown>).rank as number || '--'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/app/leaderboard" className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg px-4 py-2.5 text-sm font-medium text-center transition-colors">
              View Leaderboard
            </Link>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <div className="bg-provn-surface border border-provn-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Register for the Campaign
          </h2>

          {/* Track Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-provn-muted">Choose Your Track</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'OSS' as Track, label: 'OSS', desc: 'GitHub PRs', icon: GitBranch, color: 'emerald' },
                { value: 'CONTENT' as Track, label: 'Content', desc: 'X/Twitter', icon: Twitter, color: 'blue' },
                { value: 'BOTH' as Track, label: 'Both', desc: 'PR + Content', icon: Zap, color: 'purple' },
              ]).map(({ value, label, desc, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setTrack(value)}
                  className={`rounded-xl p-4 text-left transition-all border ${
                    track === value
                      ? `bg-${color}-500/10 border-${color}-500/40 ring-1 ring-${color}-500/30`
                      : 'bg-provn-bg/30 border-provn-border hover:border-provn-border/80'
                  }`}
                  style={track === value ? {
                    backgroundColor: color === 'emerald' ? 'rgba(16,185,129,0.1)' : color === 'blue' ? 'rgba(59,130,246,0.1)' : 'rgba(168,85,247,0.1)',
                    borderColor: color === 'emerald' ? 'rgba(16,185,129,0.4)' : color === 'blue' ? 'rgba(59,130,246,0.4)' : 'rgba(168,85,247,0.4)',
                  } : {}}
                >
                  <Icon className={`w-5 h-5 mb-2 ${track === value ? (color === 'emerald' ? 'text-emerald-400' : color === 'blue' ? 'text-blue-400' : 'text-purple-400') : 'text-provn-muted'}`} />
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-[11px] text-provn-muted">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Handle Inputs */}
          {(track === 'OSS' || track === 'BOTH') && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-provn-muted flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" /> GitHub Username
              </label>
              <input
                type="text"
                value={githubHandle}
                onChange={e => setGithubHandle(e.target.value)}
                placeholder="e.g. octocat"
                className="w-full bg-provn-bg border border-provn-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-provn-muted/50"
              />
            </div>
          )}
          {(track === 'CONTENT' || track === 'BOTH') && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-provn-muted flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5" /> X/Twitter Handle
              </label>
              <input
                type="text"
                value={xHandle}
                onChange={e => setXHandle(e.target.value)}
                placeholder="e.g. @growstreams"
                className="w-full bg-provn-bg border border-provn-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500/50 placeholder:text-provn-muted/50"
              />
            </div>
          )}

          {/* Wallet */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-provn-muted">Wallet Address</label>
            <div className="bg-provn-bg border border-provn-border rounded-lg px-4 py-2.5 text-sm font-mono text-provn-muted truncate">
              {wallet || 'Connect wallet first'}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={submitting || !wallet}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
            ) : (
              <>Register & Start Earning <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}

      {/* How XP Works */}
      <div className="bg-provn-surface border border-provn-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">How XP Works</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* OSS Track */}
          <div className="bg-provn-bg/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-emerald-400">OSS Track (GitHub)</h3>
            </div>
            <ul className="space-y-2 text-sm text-provn-muted">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">1.</span>
                Submit a PR to GrowStreams repo
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">2.</span>
                AI scores your code (0-100)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">3.</span>
                Score &ge;70 = instant XP (700-2000)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">4.</span>
                Daily XP accrual for 14 days (100-200/day)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">5.</span>
                Merge bonus: +500 XP
              </li>
            </ul>
          </div>
          {/* Content Track */}
          <div className="bg-provn-bg/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Twitter className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-blue-400">Content Track (X/Twitter)</h3>
            </div>
            <ul className="space-y-2 text-sm text-provn-muted">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">1.</span>
                Post about GrowStreams (@GrowStreams / #GrowStreams)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">2.</span>
                AI scores quality + engagement
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">3.</span>
                Score &ge;70 = instant XP (500-1200)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">4.</span>
                Thread bonus: +30% for 5+ tweets
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">5.</span>
                Viral bonus: +800 XP at 500+ engagements
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payout Formula */}
      <div className="bg-provn-surface border border-provn-border rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">Payout Formula</h2>
        <div className="bg-provn-bg/50 rounded-xl p-4 text-center">
          <p className="text-lg font-mono text-emerald-400">
            Your USDC = (Your XP / Total XP) &times; ${config?.poolUSDC || 500} Pool
          </p>
        </div>
        <p className="text-sm text-provn-muted text-center">
          Payouts are distributed proportionally based on your share of the total XP pool.
        </p>
      </div>
    </div>
  );
}
