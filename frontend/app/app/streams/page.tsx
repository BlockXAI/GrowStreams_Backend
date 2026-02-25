'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api, type StreamData, type StreamConfig } from '@/lib/growstreams-api';
import { useStreamActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import {
  Waves, Play, Pause, Square, Plus, RefreshCw, ArrowDownToLine,
  ArrowUpFromLine, AlertTriangle, Zap, Clock, TrendingDown, TrendingUp,
} from 'lucide-react';

const ZERO_TOKEN = '0x0000000000000000000000000000000000000000000000000000000000000000';
const MIN_BUFFER_SECONDS = 3600;

function formatVara(raw: string | number): string {
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '0';
  if (n >= 1e12) return (n / 1e12).toFixed(4) + ' VARA';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M units';
  return n.toLocaleString() + ' units';
}

function formatVaraPrecise(raw: number): string {
  if (raw === 0) return '0.000000000000';
  if (raw >= 1e12) return (raw / 1e12).toFixed(12);
  return raw.toFixed(0);
}

function truncAddr(addr: string): string {
  if (!addr || addr.length < 16) return addr || '\u2014';
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'Depleted';
  if (seconds === Infinity) return '\u221e';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(seconds)}s`;
}

function statusColor(s: string) {
  if (s === 'Active') return 'text-emerald-400 bg-emerald-500/10';
  if (s === 'Paused') return 'text-amber-400 bg-amber-500/10';
  return 'text-red-400 bg-red-500/10';
}

function computeRealtime(s: StreamData, nowSec: number) {
  const flowRate = Number(s.flow_rate);
  const deposited = Number(s.deposited);
  const withdrawn = Number(s.withdrawn);
  const lastStreamed = Number(s.streamed);
  const lastUpdate = Number(s.last_update);

  let totalStreamed = lastStreamed;
  if (s.status === 'Active' && nowSec > lastUpdate) {
    totalStreamed += flowRate * (nowSec - lastUpdate);
  }
  if (totalStreamed > deposited) totalStreamed = deposited;

  const remaining = deposited - totalStreamed;
  const withdrawable = Math.min(totalStreamed, deposited) - withdrawn;
  const timeToDepletion = flowRate > 0 && s.status === 'Active'
    ? remaining / flowRate : Infinity;
  const bufferThreshold = flowRate * MIN_BUFFER_SECONDS;
  const isCritical = s.status === 'Active' && remaining < bufferThreshold && flowRate > 0;
  const progress = deposited > 0 ? (totalStreamed / deposited) * 100 : 0;

  return { totalStreamed, remaining, withdrawable, timeToDepletion, isCritical, progress };
}

function StreamCard({
  s, account, busy, onAction, depositAmounts, setDepositAmounts, nowSec,
}: {
  s: StreamData;
  account: string;
  busy: number | null;
  onAction: (id: number, action: string) => void;
  depositAmounts: Record<number, string>;
  setDepositAmounts: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  nowSec: number;
}) {
  const rt = computeRealtime(s, nowSec);
  const isSender = s.sender?.toLowerCase() === account?.toLowerCase();
  const isReceiver = s.receiver?.toLowerCase() === account?.toLowerCase();

  return (
    <div className={`bg-provn-surface border rounded-xl p-5 transition-colors ${
      rt.isCritical ? 'border-red-500/50 shadow-red-500/5 shadow-lg' : 'border-provn-border'
    }`}>
      {rt.isCritical && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Critical: Buffer below minimum. This stream can be liquidated.</span>
          <button onClick={() => onAction(s.id, 'liquidate')} disabled={busy === s.id}
            className="ml-auto px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-colors">
            Liquidate
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">#{s.id}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s.status)}`}>
              {s.status}
            </span>
          </div>
          <div className="flex gap-1">
            {isSender && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400">Sending</span>
            )}
            {isReceiver && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">Receiving</span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5">
          {s.status === 'Active' && isSender && (
            <button onClick={() => onAction(s.id, 'pause')} disabled={busy === s.id}
              className="p-1.5 rounded-lg border border-provn-border hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors" title="Pause">
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          {s.status === 'Paused' && isSender && (
            <button onClick={() => onAction(s.id, 'resume')} disabled={busy === s.id}
              className="p-1.5 rounded-lg border border-provn-border hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors" title="Resume">
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          {(s.status === 'Active' || s.status === 'Paused') && isReceiver && (
            <button onClick={() => onAction(s.id, 'withdraw')} disabled={busy === s.id}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-blue-400 text-xs font-medium" title="Withdraw">
              <ArrowDownToLine className="w-3 h-3" /> Withdraw
            </button>
          )}
          {(s.status === 'Active' || s.status === 'Paused') && isSender && (
            <button onClick={() => onAction(s.id, 'stop')} disabled={busy === s.id}
              className="p-1.5 rounded-lg border border-provn-border hover:bg-red-500/10 hover:border-red-500/30 transition-colors" title="Stop">
              <Square className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {s.status === 'Active' && (
        <div className="mb-4 p-3 rounded-lg bg-provn-bg/70 border border-provn-border/50">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs text-provn-muted">Total Streamed</span>
            <span className="text-xs text-provn-muted">
              {rt.progress.toFixed(1)}% of deposit
            </span>
          </div>
          <p className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
            {formatVaraPrecise(rt.totalStreamed)}
            {rt.totalStreamed >= 1e12 && <span className="text-sm ml-1 text-emerald-400/60">VARA</span>}
          </p>
          <div className="mt-2 h-1.5 bg-provn-border/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                rt.isCritical ? 'bg-red-500' : rt.progress > 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(rt.progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-provn-muted">Sender</span>
          <p className="font-mono mt-0.5" title={s.sender}>{truncAddr(s.sender)}</p>
        </div>
        <div>
          <span className="text-provn-muted">Receiver</span>
          <p className="font-mono mt-0.5" title={s.receiver}>{truncAddr(s.receiver)}</p>
        </div>
        <div>
          <span className="text-provn-muted flex items-center gap-1"><Zap className="w-3 h-3" /> Flow Rate</span>
          <p className="font-mono mt-0.5">{formatVara(s.flow_rate)}/s</p>
        </div>
        <div>
          <span className="text-provn-muted flex items-center gap-1"><Clock className="w-3 h-3" /> Time Left</span>
          <p className={`font-mono mt-0.5 ${rt.isCritical ? 'text-red-400' : ''}`}>
            {s.status === 'Active' ? formatDuration(rt.timeToDepletion) : '\u2014'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
        <div className="bg-provn-bg/50 rounded-lg px-3 py-2">
          <span className="text-provn-muted">Deposited</span>
          <p className="font-mono mt-0.5 font-medium">{formatVara(s.deposited)}</p>
        </div>
        <div className="bg-provn-bg/50 rounded-lg px-3 py-2">
          <span className="text-provn-muted">Remaining</span>
          <p className={`font-mono mt-0.5 font-medium ${rt.isCritical ? 'text-red-400' : ''}`}>
            {formatVara(rt.remaining)}
          </p>
        </div>
        <div className="bg-provn-bg/50 rounded-lg px-3 py-2">
          <span className="text-provn-muted">Withdrawn</span>
          <p className="font-mono mt-0.5 font-medium">{formatVara(s.withdrawn)}</p>
        </div>
      </div>

      {(s.status === 'Active' || s.status === 'Paused') && isSender && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-provn-border/50">
          <input
            value={depositAmounts[s.id] || ''}
            onChange={e => setDepositAmounts(prev => ({ ...prev, [s.id]: e.target.value }))}
            type="number" placeholder="Top up deposit (units)"
            className="flex-1 px-3 py-1.5 bg-provn-bg border border-provn-border rounded-lg text-xs focus:border-emerald-500/50 focus:outline-none"
          />
          <button onClick={() => onAction(s.id, 'deposit')} disabled={busy === s.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-medium transition-colors">
            <ArrowUpFromLine className="w-3 h-3" /> Top Up
          </button>
        </div>
      )}
    </div>
  );
}

export default function StreamsPage() {
  const { account } = useAccount();
  const actions = useStreamActions();
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [nowSec, setNowSec] = useState(Math.floor(Date.now() / 1000));
  const [configLoaded, setConfigLoaded] = useState(false);

  const [receiver, setReceiver] = useState('');
  const [flowRate, setFlowRate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [depositAmounts, setDepositAmounts] = useState<Record<number, string>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStreams = async () => {
    if (!account?.decodedAddress) return;
    setLoading(true);
    try {
      const hex = account.decodedAddress;
      const [sent, received] = await Promise.all([
        api.streams.bySender(hex).catch(() => ({ streamIds: [] })),
        api.streams.byReceiver(hex).catch(() => ({ streamIds: [] })),
      ]);
      const allIds = [...new Set([...(sent.streamIds || []), ...(received.streamIds || [])])];
      const details = await Promise.all(
        allIds.slice(0, 30).map(id => api.streams.get(Number(id)).catch(() => null))
      );
      setStreams(details.filter(Boolean) as StreamData[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStreams(); }, [account]);

  const accountHex = account?.decodedAddress?.toLowerCase() || '';
  const outflowRate = streams
    .filter(s => s.status === 'Active' && s.sender?.toLowerCase() === accountHex)
    .reduce((sum, s) => sum + Number(s.flow_rate), 0);
  const inflowRate = streams
    .filter(s => s.status === 'Active' && s.receiver?.toLowerCase() === accountHex)
    .reduce((sum, s) => sum + Number(s.flow_rate), 0);
  const netFlow = inflowRate - outflowRate;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setBusy(-1);
      await actions.createStream(receiver, ZERO_TOKEN, flowRate, deposit);
      toast.success('Stream created!');
      setShowCreate(false);
      setReceiver(''); setFlowRate(''); setDeposit('');
      setTimeout(loadStreams, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(null);
    }
  };

  const handleAction = async (id: number, action: string) => {
    setBusy(id);
    try {
      switch (action) {
        case 'pause': await actions.pauseStream(id); break;
        case 'resume': await actions.resumeStream(id); break;
        case 'stop': await actions.stopStream(id); break;
        case 'withdraw': await actions.withdrawFromStream(id); break;
        case 'liquidate': await actions.liquidateStream(id); break;
        case 'deposit': {
          const amt = depositAmounts[id];
          if (!amt) { toast.error('Enter an amount'); return; }
          await actions.depositToStream(id, amt);
          setDepositAmounts(prev => ({ ...prev, [id]: '' }));
          break;
        }
      }
      toast.success(`${action} succeeded for stream #${id}`);
      setTimeout(loadStreams, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const estDuration = flowRate && deposit
    ? Number(deposit) / Number(flowRate) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Waves className="w-6 h-6 text-emerald-400" /> Money Streams
          </h1>
          <p className="text-provn-muted text-sm mt-1">
            Stream tokens per-second to any address on Vara
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadStreams} className="p-2 rounded-lg border border-provn-border hover:bg-provn-surface transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Stream
          </button>
        </div>
      </div>

      {streams.length > 0 && (outflowRate > 0 || inflowRate > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-provn-muted">Outflow</span>
            </div>
            <p className="text-lg font-bold text-red-400 font-mono">-{formatVara(outflowRate)}/s</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-provn-muted">Inflow</span>
            </div>
            <p className="text-lg font-bold text-emerald-400 font-mono">+{formatVara(inflowRate)}/s</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-provn-muted">Net Flow</span>
            </div>
            <p className={`text-lg font-bold font-mono ${netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netFlow >= 0 ? '+' : ''}{formatVara(netFlow)}/s
            </p>
          </div>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-provn-surface border border-provn-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">New Stream</h2>
          <div>
            <label className="block text-xs text-provn-muted mb-1">Receiver Address</label>
            <input
              value={receiver} onChange={e => setReceiver(e.target.value)} required
              className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm font-mono focus:border-emerald-500/50 focus:outline-none"
              placeholder="kGk... or 0x..."
            />
            <p className="text-xs text-provn-muted mt-1">Accepts Vara SS58 or hex address</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-provn-muted mb-1">Flow Rate (units per second)</label>
              <input
                value={flowRate} onChange={e => setFlowRate(e.target.value)} required type="number"
                className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-emerald-500/50 focus:outline-none"
                placeholder="e.g. 1000000"
              />
              <p className="text-xs text-provn-muted mt-1">1 VARA = 10\u00b9\u00b2 units</p>
            </div>
            <div>
              <label className="block text-xs text-provn-muted mb-1">Initial Deposit (units)</label>
              <input
                value={deposit} onChange={e => setDeposit(e.target.value)} required type="number"
                className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-emerald-500/50 focus:outline-none"
                placeholder="e.g. 3601000000"
              />
              <p className="text-xs text-provn-muted mt-1">Must cover buffer (flow_rate \u00d7 3600s minimum)</p>
            </div>
          </div>
          {flowRate && deposit && (
            <div className="bg-provn-bg/70 rounded-lg p-3 text-xs space-y-1 border border-provn-border/50">
              <div className="flex justify-between">
                <span className="text-provn-muted">Estimated duration</span>
                <span className="font-mono font-medium">{formatDuration(estDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-provn-muted">Min buffer required</span>
                <span className="font-mono">{formatVara(Number(flowRate) * MIN_BUFFER_SECONDS)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-provn-muted">Flow rate</span>
                <span className="font-mono">{formatVara(flowRate)}/s</span>
              </div>
            </div>
          )}
          <button
            type="submit" disabled={busy === -1}
            className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {busy === -1 ? 'Signing transaction...' : 'Create Stream'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
        </div>
      ) : streams.length === 0 ? (
        <div className="text-center py-16 text-provn-muted">
          <Waves className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="mb-1">No streams found</p>
          <p className="text-sm">Create a stream to start sending tokens per-second</p>
        </div>
      ) : (
        <div className="space-y-4">
          {streams.map((s) => (
            <StreamCard
              key={s.id}
              s={s}
              account={accountHex}
              busy={busy}
              onAction={handleAction}
              depositAmounts={depositAmounts}
              setDepositAmounts={setDepositAmounts}
              nowSec={nowSec}
            />
          ))}
        </div>
      )}
    </div>
  );
}
