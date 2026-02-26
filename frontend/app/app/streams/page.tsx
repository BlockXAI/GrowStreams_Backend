'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import Link from 'next/link';
import { api, type StreamData, type StreamConfig } from '@/lib/growstreams-api';
import { useStreamActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import {
  Waves, Play, Pause, Square, Plus, RefreshCw, ArrowDownToLine,
  ArrowUpFromLine, AlertTriangle, Zap, Clock, TrendingDown, TrendingUp,
} from 'lucide-react';

const ZERO_TOKEN = '0x0000000000000000000000000000000000000000000000000000000000000000';
const GROW_TOKEN = '0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36';
const MIN_BUFFER_SECONDS = 3600;
const ONE_GROW = 1_000_000_000_000;

function toBaseUnits(growAmount: string): string {
  const num = parseFloat(growAmount);
  if (isNaN(num) || num <= 0) return '0';
  return BigInt(Math.round(num * ONE_GROW)).toString();
}

function toGrowNum(raw: string | number): number {
  const n = Number(raw);
  if (isNaN(n)) return 0;
  return n / ONE_GROW;
}

function formatTokenAmount(raw: string | number, token?: string): string {
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '0';
  const symbol = token === ZERO_TOKEN ? 'VARA' : 'GROW';
  const g = n / 1e12;
  if (g >= 1_000_000) return g.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' ' + symbol;
  if (g >= 1) return g.toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' ' + symbol;
  if (g >= 0.000001) return g.toFixed(6) + ' ' + symbol;
  return '< 0.000001 ' + symbol;
}

function formatFlowRate(raw: string | number, token?: string): string {
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '0/s';
  const symbol = token === ZERO_TOKEN ? 'VARA' : 'GROW';
  const g = n / 1e12;
  if (g >= 1) return g.toFixed(2) + ' ' + symbol + '/s';
  if (g >= 0.001) return g.toFixed(4) + ' ' + symbol + '/s';
  if (g >= 0.000001) return g.toFixed(6) + ' ' + symbol + '/s';
  return '< 0.000001 ' + symbol + '/s';
}

function isDepleted(s: StreamData, nowSec: number): boolean {
  const rt = computeRealtime(s, nowSec);
  return s.status === 'Active' && rt.remaining <= 0 && Number(s.deposited) > 0;
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
  const isDep = deposited > 0 && remaining <= 0;
  const isCritical = s.status === 'Active' && remaining < bufferThreshold && flowRate > 0 && !isDep;
  const progress = deposited > 0 ? (totalStreamed / deposited) * 100 : 0;

  return { totalStreamed, remaining, withdrawable, timeToDepletion, isCritical, isDepleted: isDep, progress };
}

function StreamCard({
  s, account, busy, onAction, depositAmounts, setDepositAmounts, nowSec, streamName, onNameChange,
}: {
  s: StreamData;
  account: string;
  busy: number | null;
  onAction: (id: number, action: string) => void;
  depositAmounts: Record<number, string>;
  setDepositAmounts: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  nowSec: number;
  streamName?: string;
  onNameChange?: (id: number, name: string) => void;
}) {
  const rt = computeRealtime(s, nowSec);
  const isSender = s.sender?.toLowerCase() === account?.toLowerCase();
  const isReceiver = s.receiver?.toLowerCase() === account?.toLowerCase();

  return (
    <div className={`bg-provn-surface border rounded-xl p-5 transition-colors ${
      rt.isDepleted ? 'border-provn-border/50 opacity-70' : rt.isCritical ? 'border-red-500/50 shadow-red-500/5 shadow-lg' : 'border-provn-border'
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
            {streamName ? (
              <span className="text-xs text-provn-muted font-medium truncate max-w-[120px]" title={streamName}>{streamName}</span>
            ) : onNameChange ? (
              <button onClick={() => { const n = prompt('Name this stream (optional):'); if (n) onNameChange(s.id, n); }}
                className="text-[10px] text-provn-muted/50 hover:text-provn-muted transition-colors">+ name</button>
            ) : null}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rt.isDepleted ? 'text-provn-muted bg-provn-border/30' : statusColor(s.status)}`}>
              {rt.isDepleted ? 'Depleted' : s.status}
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
            {formatTokenAmount(rt.totalStreamed, s.token)}
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
          <p className="font-mono mt-0.5">{formatFlowRate(s.flow_rate, s.token)}</p>
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
          <p className="font-mono mt-0.5 font-medium">{formatTokenAmount(s.deposited, s.token)}</p>
        </div>
        <div className="bg-provn-bg/50 rounded-lg px-3 py-2">
          <span className="text-provn-muted">Remaining</span>
          <p className={`font-mono mt-0.5 font-medium ${rt.isCritical ? 'text-red-400' : ''}`}>
            {formatTokenAmount(rt.remaining, s.token)}
          </p>
        </div>
        <div className="bg-provn-bg/50 rounded-lg px-3 py-2">
          <span className="text-provn-muted">Withdrawn</span>
          <p className="font-mono mt-0.5 font-medium">{formatTokenAmount(s.withdrawn, s.token)}</p>
        </div>
      </div>

      {(s.status === 'Active' || s.status === 'Paused') && isSender && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-provn-border/50">
          <input
            value={depositAmounts[s.id] || ''}
            onChange={e => setDepositAmounts(prev => ({ ...prev, [s.id]: e.target.value }))}
            type="number" step="any" placeholder="Amount (GROW)"
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
  const [useGrow, setUseGrow] = useState(true);
  const [streamName, setStreamName] = useState('');
  const [streamNames, setStreamNames] = useState<Record<number, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('growstreams_names');
      if (saved) setStreamNames(JSON.parse(saved));
    } catch {}
  }, []);

  const saveStreamName = (id: number, name: string) => {
    const updated = { ...streamNames, [id]: name };
    setStreamNames(updated);
    try { localStorage.setItem('growstreams_names', JSON.stringify(updated)); } catch {}
  };

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
      const valid = details.filter(Boolean) as StreamData[];
      valid.sort((a, b) => b.id - a.id);
      setStreams(valid);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStreams(); }, [account]);

  const accountHex = account?.decodedAddress?.toLowerCase() || '';
  const activeStreams = streams.filter(s => s.status === 'Active' && !isDepleted(s, nowSec));
  const outflowRate = activeStreams
    .filter(s => s.sender?.toLowerCase() === accountHex)
    .reduce((sum, s) => sum + Number(s.flow_rate), 0);
  const inflowRate = activeStreams
    .filter(s => s.receiver?.toLowerCase() === accountHex)
    .reduce((sum, s) => sum + Number(s.flow_rate), 0);
  const netFlow = inflowRate - outflowRate;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setBusy(-1);
      const baseFlowRate = useGrow ? toBaseUnits(flowRate) : flowRate;
      const baseDeposit = useGrow ? toBaseUnits(deposit) : deposit;
      if (baseFlowRate === '0' || baseDeposit === '0') {
        toast.error('Enter valid flow rate and deposit amounts');
        return;
      }
      await actions.createStream(receiver, useGrow ? GROW_TOKEN : ZERO_TOKEN, baseFlowRate, baseDeposit);
      toast.success('Stream created!');
      if (streamName) {
        const total = await api.streams.total().catch(() => ({ total: '0' }));
        const newId = Number(total.total);
        if (newId > 0) saveStreamName(newId, streamName);
      }
      setShowCreate(false);
      setReceiver(''); setFlowRate(''); setDeposit(''); setStreamName('');
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
    ? (useGrow ? parseFloat(deposit) / parseFloat(flowRate) : Number(deposit) / Number(flowRate)) : 0;
  const estFlowRatePerDay = useGrow && flowRate ? parseFloat(flowRate) * 86400 : 0;

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
            <p className="text-lg font-bold text-red-400 font-mono">-{formatFlowRate(outflowRate)}</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-provn-muted">Inflow</span>
            </div>
            <p className="text-lg font-bold text-emerald-400 font-mono">+{formatFlowRate(inflowRate)}</p>
          </div>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-provn-muted">Net Flow</span>
            </div>
            <p className={`text-lg font-bold font-mono ${netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netFlow >= 0 ? '+' : ''}{formatFlowRate(Math.abs(netFlow))}
            </p>
          </div>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-provn-surface border border-provn-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">New Stream</h2>
          <div className="flex items-center gap-3">
            <label className="text-xs text-provn-muted">Token:</label>
            <button
              type="button" onClick={() => setUseGrow(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                useGrow ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'border-provn-border text-provn-muted hover:bg-provn-bg'
              }`}
            >
              GROW Token
            </button>
            <button
              type="button" onClick={() => setUseGrow(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                !useGrow ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'border-provn-border text-provn-muted hover:bg-provn-bg'
              }`}
            >
              Native VARA
            </button>
          </div>
          {useGrow && (
            <p className="text-xs text-emerald-400/70 bg-emerald-500/5 rounded-lg px-3 py-2 border border-emerald-500/10">
              Deposit GROW into the vault first via the <Link href="/app/grow" className="underline font-medium">GROW Token</Link> page.
            </p>
          )}
          <div>
            <label className="block text-xs text-provn-muted mb-1">Stream Name (optional)</label>
            <input
              value={streamName} onChange={e => setStreamName(e.target.value)}
              className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-emerald-500/50 focus:outline-none"
              placeholder="e.g. Salary to Alice, Dev bounty payout"
            />
          </div>
          <div>
            <label className="block text-xs text-provn-muted mb-1">Receiver Address</label>
            <input
              value={receiver} onChange={e => setReceiver(e.target.value)} required
              className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm font-mono focus:border-emerald-500/50 focus:outline-none"
              placeholder="kGk... or 0x..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-provn-muted mb-1">
                Flow Rate ({useGrow ? 'GROW' : 'units'} per second)
              </label>
              <div className="relative">
                <input
                  value={flowRate} onChange={e => setFlowRate(e.target.value)} required type="number" step="any" min="0"
                  className="w-full px-3 py-2 pr-16 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-emerald-500/50 focus:outline-none"
                  placeholder={useGrow ? 'e.g. 0.001' : 'e.g. 1000000'}
                />
                {useGrow && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-provn-muted">/sec</span>}
              </div>
              {useGrow && (
                <div className="flex gap-1.5 mt-1.5">
                  {[
                    { label: '0.001/s', val: '0.001' },
                    { label: '0.01/s', val: '0.01' },
                    { label: '0.1/s', val: '0.1' },
                  ].map(({ label, val }) => (
                    <button key={val} type="button" onClick={() => setFlowRate(val)}
                      className="px-2 py-0.5 rounded text-[10px] border border-provn-border/50 text-provn-muted hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-provn-muted mb-1">
                Initial Deposit ({useGrow ? 'GROW' : 'units'})
              </label>
              <div className="relative">
                <input
                  value={deposit} onChange={e => setDeposit(e.target.value)} required type="number" step="any" min="0"
                  className="w-full px-3 py-2 pr-16 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-emerald-500/50 focus:outline-none"
                  placeholder={useGrow ? 'e.g. 10' : 'e.g. 3601000000'}
                />
                {useGrow && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-provn-muted">GROW</span>}
              </div>
              {useGrow && (
                <div className="flex gap-1.5 mt-1.5">
                  {['10', '50', '100', '500'].map(v => (
                    <button key={v} type="button" onClick={() => setDeposit(v)}
                      className="px-2 py-0.5 rounded text-[10px] border border-provn-border/50 text-provn-muted hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {flowRate && deposit && (
            <div className="bg-provn-bg/70 rounded-lg p-3 text-xs space-y-1.5 border border-provn-border/50">
              <div className="flex justify-between">
                <span className="text-provn-muted">Stream duration</span>
                <span className="font-mono font-medium">{formatDuration(estDuration)}</span>
              </div>
              {useGrow && estFlowRatePerDay > 0 && (
                <div className="flex justify-between">
                  <span className="text-provn-muted">Daily outflow</span>
                  <span className="font-mono">{estFlowRatePerDay.toFixed(4)} GROW/day</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-provn-muted">Min buffer ({MIN_BUFFER_SECONDS / 3600}h)</span>
                <span className="font-mono">
                  {useGrow
                    ? (parseFloat(flowRate) * MIN_BUFFER_SECONDS).toFixed(4) + ' GROW'
                    : formatTokenAmount(Number(flowRate) * MIN_BUFFER_SECONDS)}
                </span>
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
              streamName={streamNames[s.id]}
              onNameChange={saveStreamName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
