'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api } from '@/lib/growstreams-api';
import {
  Trophy, Medal, TrendingUp, TrendingDown, Minus,
  Users, Zap, DollarSign, GitBranch, Twitter,
  ChevronLeft, ChevronRight, Search, Filter,
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName: string;
  track: string;
  totalXP: number;
  contributions: number;
  estimatedUSDC: number;
  rankChange: number;
}

interface LeaderboardData {
  totalParticipants: number;
  totalXP: number;
  poolUSDC: number;
  campaignEndsIn: number | null;
  page: number;
  limit: number;
  entries: LeaderboardEntry[];
}

interface StatsData {
  totalParticipants: number;
  totalXP: number;
  totalContributions: number;
  ossContributions: number;
  contentContributions: number;
  topContributor: { wallet: string; displayName: string; totalXP: number; track: string } | null;
  campaignDaysRemaining: number | null;
  poolUSDC: number;
}

function shortenWallet(w: string) {
  if (!w || w.length < 12) return w;
  return w.slice(0, 6) + '...' + w.slice(-4);
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center"><Medal className="w-4 h-4 text-amber-400" /></div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gray-400/20 flex items-center justify-center"><Medal className="w-4 h-4 text-gray-300" /></div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center"><Medal className="w-4 h-4 text-orange-400" /></div>;
  return <div className="w-8 h-8 rounded-full bg-provn-bg flex items-center justify-center text-xs font-bold text-provn-muted">#{rank}</div>;
}

function RankChange({ change }: { change: number }) {
  if (change > 0) return <span className="flex items-center gap-0.5 text-emerald-400 text-xs"><TrendingUp className="w-3 h-3" />+{change}</span>;
  if (change < 0) return <span className="flex items-center gap-0.5 text-red-400 text-xs"><TrendingDown className="w-3 h-3" />{change}</span>;
  return <span className="flex items-center gap-0.5 text-provn-muted text-xs"><Minus className="w-3 h-3" /></span>;
}

function TrackBadge({ track }: { track: string }) {
  if (track === 'OSS') return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><GitBranch className="w-2.5 h-2.5" />OSS</span>;
  if (track === 'CONTENT') return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 flex items-center gap-1"><Twitter className="w-2.5 h-2.5" />Content</span>;
  return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400">Both</span>;
}

export default function LeaderboardPage() {
  const { account } = useAccount();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [trackFilter, setTrackFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; track?: string } = { page, limit };
      if (trackFilter) params.track = trackFilter;

      const [lb, st] = await Promise.all([
        api.campaign.leaderboard(params),
        api.campaign.leaderboardStats(),
      ]);

      setData(lb as unknown as LeaderboardData);
      setStats(st as unknown as StatsData);
    } catch (err) {
      console.error('Leaderboard load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [page, trackFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPages = data ? Math.ceil((data.totalParticipants || 1) / limit) : 1;
  const myWallet = account?.decodedAddress?.toLowerCase() || '';

  const filteredEntries = data?.entries?.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.displayName.toLowerCase().includes(q) || e.wallet.toLowerCase().includes(q);
  }) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" /> Leaderboard
          </h1>
          <p className="text-provn-muted text-sm mt-1">Campaign rankings and XP standings</p>
        </div>
        {stats?.campaignDaysRemaining != null && (
          <div className="bg-provn-surface border border-provn-border rounded-xl px-4 py-2 text-center">
            <p className="text-lg font-bold text-amber-400">{stats.campaignDaysRemaining}</p>
            <p className="text-[10px] text-provn-muted uppercase tracking-wider">Days Left</p>
          </div>
        )}
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-provn-surface border border-provn-border rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{stats.totalParticipants}</p>
            <p className="text-[10px] text-provn-muted">Participants</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-3 text-center">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-bold font-mono">{(stats.totalXP || 0).toLocaleString()}</p>
            <p className="text-[10px] text-provn-muted">Total XP</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-3 text-center">
            <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-400">${stats.poolUSDC}</p>
            <p className="text-[10px] text-provn-muted">Prize Pool</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-3 text-center">
            <GitBranch className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{stats.ossContributions}</p>
            <p className="text-[10px] text-provn-muted">OSS PRs</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-3 text-center">
            <Twitter className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{stats.contentContributions}</p>
            <p className="text-[10px] text-provn-muted">Content Posts</p>
          </div>
        </div>
      )}

      {/* Top Contributor Callout */}
      {stats?.topContributor && (
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <Medal className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm">
              <span className="font-semibold text-amber-400">{stats.topContributor.displayName}</span>
              {' '}is leading with{' '}
              <span className="font-bold">{stats.topContributor.totalXP.toLocaleString()} XP</span>
            </p>
          </div>
          <TrackBadge track={stats.topContributor.track} />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-provn-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or wallet..."
            className="w-full bg-provn-surface border border-provn-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-provn-muted/50"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-provn-surface border border-provn-border rounded-lg p-1">
          <Filter className="w-3.5 h-3.5 text-provn-muted ml-2" />
          {(['', 'OSS', 'CONTENT'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTrackFilter(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                trackFilter === t
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-provn-muted hover:text-provn-text'
              }`}
            >
              {t || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
        </div>
      ) : (
        <div className="bg-provn-surface border border-provn-border rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[3rem_1fr_5rem_6rem_4rem_5rem_3rem] gap-2 px-5 py-3 border-b border-provn-border text-[10px] text-provn-muted uppercase tracking-wider font-medium">
            <div>Rank</div>
            <div>Participant</div>
            <div>Track</div>
            <div className="text-right">XP</div>
            <div className="text-right">PRs</div>
            <div className="text-right">USDC</div>
            <div className="text-right">24h</div>
          </div>

          {/* Rows */}
          {filteredEntries.length === 0 ? (
            <div className="px-5 py-10 text-center text-provn-muted text-sm">
              No participants found. Be the first to register!
            </div>
          ) : (
            <div className="divide-y divide-provn-border/50">
              {filteredEntries.map(entry => {
                const isMe = entry.wallet.toLowerCase() === myWallet;
                return (
                  <div
                    key={entry.wallet}
                    className={`grid grid-cols-[3rem_1fr_5rem_6rem_4rem_5rem_3rem] gap-2 px-5 py-3 items-center transition-colors ${
                      isMe ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : 'hover:bg-provn-bg/30'
                    }`}
                  >
                    <div><RankBadge rank={entry.rank} /></div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {entry.displayName}
                        {isMe && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/15 text-emerald-400">You</span>}
                      </p>
                      <p className="text-[10px] text-provn-muted font-mono">{shortenWallet(entry.wallet)}</p>
                    </div>
                    <div><TrackBadge track={entry.track} /></div>
                    <div className="text-right">
                      <p className="font-bold font-mono text-sm">{entry.totalXP.toLocaleString()}</p>
                    </div>
                    <div className="text-right text-sm text-provn-muted">{entry.contributions}</div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-400">${entry.estimatedUSDC}</p>
                    </div>
                    <div className="text-right"><RankChange change={entry.rankChange} /></div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-provn-border">
              <p className="text-xs text-provn-muted">
                Page {page} of {totalPages} ({data?.totalParticipants} participants)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-provn-border hover:bg-provn-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-provn-border hover:bg-provn-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
