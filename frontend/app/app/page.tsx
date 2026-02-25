'use client';

import { useEffect, useState } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api, type HealthData, type StreamConfig, type StreamData } from '@/lib/growstreams-api';
import { Waves, Vault, GitFork, Trophy, Activity, TrendingUp, TrendingDown, Zap, Shield, Layers } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

function formatVara(raw: string | number): string {
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '0';
  if (n >= 1e12) return (n / 1e12).toFixed(4) + ' VARA';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M units';
  return n.toLocaleString() + ' units';
}

const ShaderCard = dynamic(() => import('@/components/ui/shader-card'), { ssr: false });
const DepthCard = dynamic(() => import('@/components/ui/depth-card'), { ssr: false });

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
  const [outflowRate, setOutflowRate] = useState(0);
  const [inflowRate, setInflowRate] = useState(0);

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
            const [sent, recv] = await Promise.all([
              api.streams.bySender(hex).catch(() => ({ streamIds: [] })),
              api.streams.byReceiver(hex).catch(() => ({ streamIds: [] })),
            ]);
            const sentIds = sent.streamIds || [];
            const recvIds = recv.streamIds || [];
            setMyStreams(sentIds);

            const allIds = [...new Set([...sentIds, ...recvIds])];
            if (allIds.length > 0) {
              const details = await Promise.all(
                allIds.slice(0, 30).map(id => api.streams.get(Number(id)).catch(() => null))
              );
              const active = details.filter(Boolean) as StreamData[];
              const hexLower = hex.toLowerCase();
              setOutflowRate(
                active.filter(s => s.status === 'Active' && s.sender?.toLowerCase() === hexLower)
                  .reduce((sum, s) => sum + Number(s.flow_rate), 0)
              );
              setInflowRate(
                active.filter(s => s.status === 'Active' && s.receiver?.toLowerCase() === hexLower)
                  .reduce((sum, s) => sum + Number(s.flow_rate), 0)
              );
            }
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

      {(outflowRate > 0 || inflowRate > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-provn-muted">Your Outflow</span>
            </div>
            <p className="text-lg font-bold text-red-400 font-mono">-{formatVara(outflowRate)}/s</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-provn-muted">Your Inflow</span>
            </div>
            <p className="text-lg font-bold text-emerald-400 font-mono">+{formatVara(inflowRate)}/s</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-provn-muted">Net Flow</span>
            </div>
            <p className={`text-lg font-bold font-mono ${(inflowRate - outflowRate) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(inflowRate - outflowRate) >= 0 ? '+' : ''}{formatVara(inflowRate - outflowRate)}/s
            </p>
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
        <Link href="/app/streams" className="block">
          <ShaderCard
            width={undefined as unknown as number}
            height={220}
            color="#10b981"
            positionY={0.15}
            scale={4}
            branchIntensity={1.5}
            verticalExtent={1.5}
            horizontalExtent={1.5}
            blur={4}
            opacity={0.85}
            className="!w-full rounded-2xl hover:shadow-emerald-500/10 hover:shadow-xl transition-shadow"
          >
            <div className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Waves className="w-7 h-7 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Create a Stream</h3>
                </div>
                <p className="text-sm text-white/60">
                  Start streaming tokens per-second to any address on Vara
                </p>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Per-second flow</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>On-chain escrow</span>
                </div>
              </div>
            </div>
          </ShaderCard>
        </Link>

        <Link href="/app/vault" className="block">
          <ShaderCard
            width={undefined as unknown as number}
            height={220}
            color="#3b82f6"
            positionY={0.15}
            scale={4}
            branchIntensity={1.2}
            verticalExtent={1.5}
            horizontalExtent={1.5}
            blur={4}
            opacity={0.85}
            className="!w-full rounded-2xl hover:shadow-blue-500/10 hover:shadow-xl transition-shadow"
          >
            <div className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Vault className="w-7 h-7 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Manage Vault</h3>
                </div>
                <p className="text-sm text-white/60">
                  Deposit or withdraw tokens from the escrow vault
                </p>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Multi-token</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>Non-custodial</span>
                </div>
              </div>
            </div>
          </ShaderCard>
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Protocol Features</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <DepthCard
            image="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&q=80"
            title="Revenue Splits"
            description="Automatically distribute incoming tokens across multiple recipients"
            width={240}
            height={320}
            onClick={() => window.location.href = '/app/splits'}
          />
          <DepthCard
            image="https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400&q=80"
            title="Bounty Streams"
            description="Fund milestone-based tasks with conditional token releases"
            width={240}
            height={320}
            onClick={() => window.location.href = '/app/bounties'}
          />
          <DepthCard
            image="https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&q=80"
            title="Identity Registry"
            description="On-chain identity for verified participants and reputation"
            width={240}
            height={320}
            onClick={() => window.location.href = '/app/identity'}
          />
          <DepthCard
            image="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80"
            title="Permissions"
            description="Granular access control for stream operations and roles"
            width={240}
            height={320}
            onClick={() => window.location.href = '/app/permissions'}
          />
        </div>
      </div>
    </div>
  );
}
