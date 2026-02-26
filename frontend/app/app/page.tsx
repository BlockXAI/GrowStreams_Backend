'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api, type StreamData } from '@/lib/growstreams-api';
import {
  Waves, Vault, Coins, Activity, ArrowRight, RefreshCw,
  TrendingUp, TrendingDown, Zap, ChevronRight, Wallet,
} from 'lucide-react';
import Link from 'next/link';
import WelcomeModal from '@/components/welcome-modal';

const GROW_TOKEN = '0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36';
const ONE_GROW = 1_000_000_000_000;

function fmtGrow(raw: string | number): string {
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '0';
  const g = n / ONE_GROW;
  if (g >= 1_000_000) return g.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (g >= 1_000) return (g / 1_000).toFixed(1) + 'K';
  if (g >= 1) return g.toFixed(2);
  if (g >= 0.0001) return g.toFixed(4);
  return '< 0.0001';
}

function fmtFlowRate(raw: number): string {
  if (raw === 0) return '0';
  const g = raw / ONE_GROW;
  if (g >= 1) return g.toFixed(2) + ' GROW/s';
  if (g >= 0.001) return g.toFixed(4) + ' GROW/s';
  return g.toFixed(6) + ' GROW/s';
}

export default function DashboardPage() {
  const { account } = useAccount();
  const [growBalance, setGrowBalance] = useState('0');
  const [vaultAvailable, setVaultAvailable] = useState('0');
  const [vaultAllocated, setVaultAllocated] = useState('0');
  const [totalStreams, setTotalStreams] = useState('0');
  const [activeCount, setActiveCount] = useState(0);
  const [recentStreams, setRecentStreams] = useState<StreamData[]>([]);
  const [outflow, setOutflow] = useState(0);
  const [inflow, setInflow] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!account?.decodedAddress) return;
    setLoading(true);
    const hex = account.decodedAddress;
    try {
      const [bal, vault, total, sent, recv] = await Promise.all([
        api.growToken.balance(hex).catch(() => ({ balance: '0' })),
        api.vault.balance(hex, GROW_TOKEN).catch(() => null),
        api.streams.total().catch(() => ({ total: '0' })),
        api.streams.bySender(hex).catch(() => ({ streamIds: [] })),
        api.streams.byReceiver(hex).catch(() => ({ streamIds: [] })),
      ]);

      setGrowBalance(bal.balance);
      const v = vault as Record<string, string> | null;
      setVaultAvailable(v?.available || '0');
      setVaultAllocated(v?.total_allocated || '0');
      setTotalStreams(total.total);

      const allIds = [...new Set([...(sent.streamIds || []), ...(recv.streamIds || [])])];
      if (allIds.length > 0) {
        const details = await Promise.all(
          allIds.slice(0, 20).map(id => api.streams.get(Number(id)).catch(() => null))
        );
        const valid = details.filter(Boolean) as StreamData[];
        valid.sort((a, b) => b.id - a.id);
        setRecentStreams(valid.slice(0, 5));

        const hexLower = hex.toLowerCase();
        const active = valid.filter(s => s.status === 'Active' && Number(s.deposited) > Number(s.streamed));
        setActiveCount(active.length);
        setOutflow(active.filter(s => s.sender?.toLowerCase() === hexLower).reduce((s, x) => s + Number(x.flow_rate), 0));
        setInflow(active.filter(s => s.receiver?.toLowerCase() === hexLower).reduce((s, x) => s + Number(x.flow_rate), 0));
      }
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const netFlow = inflow - outflow;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <WelcomeModal />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-provn-muted text-sm mt-1">Your GrowStreams overview</p>
        </div>
        <button onClick={loadDashboard} className="p-2 rounded-lg border border-provn-border hover:bg-provn-surface transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/app/grow" className="bg-provn-surface border border-provn-border rounded-xl p-4 hover:border-emerald-500/30 transition-colors group">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] text-provn-muted uppercase tracking-wider">GROW Balance</span>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">{fmtGrow(growBalance)}</p>
          <p className="text-[10px] text-provn-muted mt-1">in wallet</p>
        </Link>
        <Link href="/app/vault" className="bg-provn-surface border border-provn-border rounded-xl p-4 hover:border-purple-500/30 transition-colors group">
          <div className="flex items-center gap-2 mb-2">
            <Vault className="w-4 h-4 text-purple-400" />
            <span className="text-[11px] text-provn-muted uppercase tracking-wider">Vault</span>
          </div>
          <p className="text-2xl font-bold font-mono text-purple-400">{fmtGrow(vaultAvailable)}</p>
          <p className="text-[10px] text-provn-muted mt-1">available GROW</p>
        </Link>
        <Link href="/app/streams" className="bg-provn-surface border border-provn-border rounded-xl p-4 hover:border-blue-500/30 transition-colors group">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] text-provn-muted uppercase tracking-wider">Active Streams</span>
          </div>
          <p className="text-2xl font-bold font-mono text-blue-400">{activeCount}</p>
          <p className="text-[10px] text-provn-muted mt-1">of {totalStreams} total</p>
        </Link>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-orange-400" />
            <span className="text-[11px] text-provn-muted uppercase tracking-wider">Streaming</span>
          </div>
          <p className="text-2xl font-bold font-mono text-orange-400">{fmtGrow(vaultAllocated)}</p>
          <p className="text-[10px] text-provn-muted mt-1">GROW locked in streams</p>
        </div>
      </div>

      {(outflow > 0 || inflow > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] text-provn-muted uppercase tracking-wider">Outflow</span>
            </div>
            <p className="text-sm font-bold text-red-400 font-mono">-{fmtFlowRate(outflow)}</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-provn-muted uppercase tracking-wider">Inflow</span>
            </div>
            <p className="text-sm font-bold text-emerald-400 font-mono">+{fmtFlowRate(inflow)}</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] text-provn-muted uppercase tracking-wider">Net</span>
            </div>
            <p className={`text-sm font-bold font-mono ${netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netFlow >= 0 ? '+' : '-'}{fmtFlowRate(Math.abs(netFlow))}
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-3">
        <Link href="/app/grow" className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5 hover:border-emerald-500/40 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Get GROW Tokens</h3>
              <p className="text-[11px] text-provn-muted">Mint, approve & deposit</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-3 group-hover:gap-2 transition-all">
            Go to GROW Token <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
        <Link href="/app/streams" className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Waves className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Create a Stream</h3>
              <p className="text-[11px] text-provn-muted">Stream GROW per-second</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-400 mt-3 group-hover:gap-2 transition-all">
            Go to Streams <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
        <Link href="/app/vault" className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-colors group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Vault className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Manage Vault</h3>
              <p className="text-[11px] text-provn-muted">Deposit & withdraw</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-400 mt-3 group-hover:gap-2 transition-all">
            Go to Vault <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {recentStreams.length > 0 && (
        <div className="bg-provn-surface border border-provn-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-provn-border">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Waves className="w-4 h-4 text-emerald-400" /> Recent Streams
            </h2>
            <Link href="/app/streams" className="text-xs text-provn-muted hover:text-emerald-400 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-provn-border/50">
            {recentStreams.map(s => {
              const isSender = s.sender?.toLowerCase() === account?.decodedAddress?.toLowerCase();
              const deposited = Number(s.deposited) / ONE_GROW;
              const streamed = Number(s.streamed) / ONE_GROW;
              const pct = deposited > 0 ? Math.min((streamed / deposited) * 100, 100) : 0;
              const isDepleted = s.status === 'Active' && pct >= 99.9;
              return (
                <Link key={s.id} href="/app/streams" className="flex items-center gap-4 px-5 py-3 hover:bg-provn-bg/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-provn-bg flex items-center justify-center text-xs font-bold text-provn-muted">
                    #{s.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        isDepleted ? 'bg-provn-border/30 text-provn-muted' :
                        s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                        s.status === 'Paused' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {isDepleted ? 'Depleted' : s.status}
                      </span>
                      <span className="text-[10px] text-provn-muted">
                        {isSender ? 'Sending' : 'Receiving'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-provn-border/30 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isDepleted ? 'bg-provn-muted' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-provn-muted font-mono">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-medium">{deposited.toFixed(2)} GROW</p>
                    <p className="text-[10px] text-provn-muted">{(Number(s.flow_rate) / ONE_GROW).toFixed(4)}/s</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-provn-surface border border-provn-border rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { step: '1', title: 'Get GROW', desc: 'Mint tokens from faucet', color: 'text-emerald-400 bg-emerald-500/15' },
            { step: '2', title: 'Approve & Deposit', desc: 'Fund your vault', color: 'text-blue-400 bg-blue-500/15' },
            { step: '3', title: 'Create Stream', desc: 'Set flow rate & receiver', color: 'text-purple-400 bg-purple-500/15' },
            { step: '4', title: 'Tokens Flow', desc: 'Real-time per-second', color: 'text-amber-400 bg-amber-500/15' },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex items-center gap-3 p-3 rounded-lg bg-provn-bg/30">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${color}`}>{step}</div>
              <div>
                <p className="text-xs font-medium">{title}</p>
                <p className="text-[10px] text-provn-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
