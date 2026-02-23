'use client';

import { useEffect, useState } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api, type HealthData, type StreamConfig } from '@/lib/growstreams-api';
import { Waves, Vault, GitFork, Trophy, Activity, TrendingUp } from 'lucide-react';
import Link from 'next/link';

function StatCard({ label, value, icon: Icon, href, color }: {
  label: string; value: string; icon: React.ElementType; href: string; color: string;
}) {
  return (
    <Link href={href} className="bg-provn-surface border border-provn-border rounded-xl p-5 hover:border-emerald-500/30 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs text-provn-muted group-hover:text-emerald-400 transition-colors">View →</span>
      </div>
      <p className="text-2xl font-bold text-provn-text">{value}</p>
      <p className="text-sm text-provn-muted mt-1">{label}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { account } = useAccount();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [config, setConfig] = useState<StreamConfig | null>(null);
  const [stats, setStats] = useState({ streams: '—', active: '—', groups: '—', bounties: '—' });
  const [myStreams, setMyStreams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [h, c, st, act, gr, bo] = await Promise.all([
          api.health(),
          api.streams.config(),
          api.streams.total(),
          api.streams.active(),
          api.splits.total(),
          api.bounty.total(),
        ]);
        setHealth(h);
        setConfig(c);
        setStats({
          streams: st.total,
          active: act.active,
          groups: gr.total,
          bounties: bo.total,
        });

        if (account?.decodedAddress) {
          const hex = account.decodedAddress;
          try {
            const s = await api.streams.bySender(hex);
            setMyStreams(s.streamIds || []);
          } catch { /* no streams */ }
        }
      } catch (err) {
        console.error('Dashboard load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [account]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-provn-muted text-sm mt-1">
          Overview of the GrowStreams protocol on Vara Testnet
        </p>
      </div>

      {health && (
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-provn-muted">Status:</span>
            <span className="text-emerald-400 font-medium">{health.status}</span>
          </div>
          <div className="text-provn-muted">|</div>
          <div>
            <span className="text-provn-muted">Network:</span>{' '}
            <span className="text-provn-text">{health.network}</span>
          </div>
          <div className="text-provn-muted">|</div>
          <div>
            <span className="text-provn-muted">Balance:</span>{' '}
            <span className="text-provn-text">{health.balance}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Streams" value={stats.streams} icon={Waves} href="/app/streams" color="bg-blue-500/10 text-blue-400" />
        <StatCard label="Active Streams" value={stats.active} icon={Activity} href="/app/streams" color="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="Split Groups" value={stats.groups} icon={GitFork} href="/app/splits" color="bg-purple-500/10 text-purple-400" />
        <StatCard label="Bounties" value={stats.bounties} icon={Trophy} href="/app/bounties" color="bg-amber-500/10 text-amber-400" />
      </div>

      {myStreams.length > 0 && (
        <div className="bg-provn-surface border border-provn-border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            My Streams ({myStreams.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {myStreams.slice(0, 10).map((id) => (
              <Link
                key={id}
                href={`/app/streams?id=${id}`}
                className="px-3 py-2 rounded-lg bg-provn-bg/50 border border-provn-border text-sm font-mono text-center hover:border-emerald-500/30 transition-colors"
              >
                Stream #{id}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Link href="/app/streams" className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6 hover:border-emerald-500/40 transition-colors">
          <Waves className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Create a Stream</h3>
          <p className="text-sm text-provn-muted">Start streaming tokens per-second to any address on Vara</p>
        </Link>
        <Link href="/app/vault" className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition-colors">
          <Vault className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-lg font-semibold mb-1">Manage Vault</h3>
          <p className="text-sm text-provn-muted">Deposit or withdraw tokens from the escrow vault</p>
        </Link>
      </div>
    </div>
  );
}
