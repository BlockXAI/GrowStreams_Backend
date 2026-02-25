'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api, type BountyData } from '@/lib/growstreams-api';
import { useBountyActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import { Trophy, Plus, RefreshCw, CheckCircle, Hand } from 'lucide-react';

const ZERO_TOKEN = '0x0000000000000000000000000000000000000000000000000000000000000000';

function formatVara(raw: string | number): string {
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '0';
  if (n >= 1e12) return (n / 1e12).toFixed(4) + ' VARA';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M units';
  return n.toLocaleString() + ' units';
}

function truncAddr(addr: string): string {
  if (!addr || addr.length < 16) return addr || '—';
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Open: 'text-emerald-400 bg-emerald-500/10',
    Claimed: 'text-blue-400 bg-blue-500/10',
    Active: 'text-amber-400 bg-amber-500/10',
    Completed: 'text-purple-400 bg-purple-500/10',
    Cancelled: 'text-red-400 bg-red-500/10',
  };
  return map[s] || 'text-provn-muted bg-provn-surface';
}

export default function BountiesPage() {
  const { account } = useAccount();
  const actions = useBountyActions();
  const [bounties, setBounties] = useState<BountyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [maxFlowRate, setMaxFlowRate] = useState('');
  const [minScore, setMinScore] = useState('');
  const [totalBudget, setTotalBudget] = useState('');

  const loadBounties = async () => {
    setLoading(true);
    try {
      const open = await api.bounty.open().catch(() => ({ bountyIds: [] }));
      let ids = open.bountyIds || [];

      if (account?.decodedAddress) {
        const hex = account.decodedAddress;
        const created = await api.bounty.byCreator(hex).catch(() => ({ bountyIds: [] }));
        ids = [...new Set([...ids, ...(created.bountyIds || [])])];
      }

      const details = await Promise.all(
        ids.slice(0, 20).map((id) => api.bounty.get(Number(id)).catch(() => null))
      );
      setBounties(details.filter(Boolean) as BountyData[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBounties();
  }, [account]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setBusy(-1);
      await actions.createBounty(title, ZERO_TOKEN, maxFlowRate, Number(minScore), totalBudget);
      toast.success('Bounty created!');
      setShowCreate(false);
      setTitle('');
      setMaxFlowRate('');
      setMinScore('');
      setTotalBudget('');
      setTimeout(loadBounties, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create bounty');
    } finally {
      setBusy(null);
    }
  };

  const handleClaim = async (id: number) => {
    setBusy(id);
    try {
      await actions.claimBounty(id);
      toast.success(`Claimed bounty #${id}`);
      setTimeout(loadBounties, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Claim failed');
    } finally {
      setBusy(null);
    }
  };

  const handleComplete = async (id: number) => {
    setBusy(id);
    try {
      await actions.completeBounty(id);
      toast.success(`Completed bounty #${id}`);
      setTimeout(loadBounties, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Complete failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" /> Bounties
          </h1>
          <p className="text-provn-muted text-sm mt-1">Create and claim AI-scored bounties</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadBounties} className="p-2 rounded-lg border border-provn-border hover:bg-provn-surface transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Bounty
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-provn-surface border border-provn-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Create Bounty</h2>
          <div>
            <label className="block text-xs text-provn-muted mb-1">Title</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-amber-500/50 focus:outline-none"
              placeholder="Fix login bug on staging"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-provn-muted mb-1">Max Flow Rate</label>
              <input
                value={maxFlowRate} onChange={(e) => setMaxFlowRate(e.target.value)} required type="number"
                className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-amber-500/50 focus:outline-none"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-xs text-provn-muted mb-1">Min Score (0-100)</label>
              <input
                value={minScore} onChange={(e) => setMinScore(e.target.value)} required type="number" min="0" max="100"
                className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-amber-500/50 focus:outline-none"
                placeholder="70"
              />
            </div>
            <div>
              <label className="block text-xs text-provn-muted mb-1">Total Budget</label>
              <input
                value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} required type="number"
                className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-amber-500/50 focus:outline-none"
                placeholder="50000"
              />
            </div>
          </div>
          <button
            type="submit" disabled={busy === -1}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {busy === -1 ? 'Signing...' : 'Create Bounty'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
        </div>
      ) : bounties.length === 0 ? (
        <div className="text-center py-16 text-provn-muted">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No bounties found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bounties.map((b) => (
            <div key={b.id} className="bg-provn-surface border border-provn-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold">#{b.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(b.status)}`}>
                      {b.status}
                    </span>
                  </div>
                  <h3 className="font-medium">{b.title}</h3>
                </div>
                <div className="flex gap-1.5">
                  {b.status === 'Open' && (
                    <button onClick={() => handleClaim(b.id)} disabled={busy === b.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-xs font-medium transition-colors">
                      <Hand className="w-3.5 h-3.5" /> {busy === b.id ? 'Signing...' : 'Claim'}
                    </button>
                  )}
                  {(b.status === 'Claimed' || b.status === 'Active') && (
                    <button onClick={() => handleComplete(b.id)} disabled={busy === b.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 text-xs font-medium transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> {busy === b.id ? 'Signing...' : 'Complete'}
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-provn-muted">Creator</span>
                  <p className="font-mono mt-0.5" title={b.creator}>{truncAddr(b.creator)}</p>
                </div>
                <div>
                  <span className="text-provn-muted">Max Flow Rate</span>
                  <p className="font-mono mt-0.5">{formatVara(b.max_flow_rate)}/s</p>
                </div>
                <div>
                  <span className="text-provn-muted">Min Score</span>
                  <p className="font-mono mt-0.5">{b.min_score}/100</p>
                </div>
                <div>
                  <span className="text-provn-muted">Budget</span>
                  <p className="font-mono mt-0.5">{formatVara(b.total_budget)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
