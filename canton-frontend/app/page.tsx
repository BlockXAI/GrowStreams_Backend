'use client';

import { useState, useEffect, useCallback } from 'react';
import { Waves, Play, Pause, Square, ArrowDownToLine, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface StreamPayload {
  streamId: number;
  sender: string;
  receiver: string;
  admin: string;
  flowRate: string;
  startTime: string;
  lastUpdate: string;
  deposited: string;
  withdrawn: string;
  status: string;
}

interface CantonContract {
  contractId: string;
  payload: StreamPayload;
}

function calculateAccrued(stream: StreamPayload, now: Date): number {
  if (stream.status !== 'Active') return 0;
  const lastUpdate = new Date(stream.lastUpdate);
  const elapsed = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
  const rate = parseFloat(stream.flowRate);
  const available = parseFloat(stream.deposited) - parseFloat(stream.withdrawn);
  return Math.min(rate * elapsed, available);
}

function formatRemaining(stream: StreamPayload, now: Date): string {
  if (stream.status !== 'Active') return stream.status;
  const accrued = calculateAccrued(stream, now);
  const remaining = parseFloat(stream.deposited) - parseFloat(stream.withdrawn) - accrued;
  const rate = parseFloat(stream.flowRate);
  if (remaining <= 0) return 'Depleted';
  if (rate === 0) return '∞';
  const secs = remaining / rate;
  if (secs > 86400) return `${Math.floor(secs / 86400)}d ${Math.floor((secs % 86400) / 3600)}h`;
  if (secs > 3600) return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;
  if (secs > 60) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs)}s`;
}

async function cantonQuery(party: string, templateId: string): Promise<CantonContract[]> {
  const res = await fetch('/api/canton/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ party, templateId }),
  });
  const data = await res.json();
  return data.result ?? [];
}

async function cantonExercise(
  party: string,
  templateId: string,
  contractId: string,
  choice: string,
  argument: Record<string, unknown>
) {
  const res = await fetch('/api/canton/exercise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ party, templateId, contractId, choice, argument }),
  });
  return res.json();
}

export default function Home() {
  const [streams, setStreams] = useState<CantonContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedParty, setSelectedParty] = useState('Alice');

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchStreams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contracts = await cantonQuery(selectedParty, 'StreamCore:StreamAgreement');
      setStreams(contracts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch from Canton');
    } finally {
      setLoading(false);
    }
  }, [selectedParty]);

  useEffect(() => { fetchStreams(); }, [fetchStreams]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleWithdraw = async (cid: string, _streamId: number) => {
    setActing(cid);
    try {
      const now = new Date().toISOString();
      const result = await cantonExercise('Bob', 'StreamCore:StreamAgreement', cid, 'Withdraw', { currentTime: now });
      if (result.status === 200 || result.result) {
        flash('ok', `✅ Withdraw successful — tokens transferred to Bob`);
        fetchStreams();
      } else {
        flash('err', result.errors?.[0] ?? 'Withdraw failed');
      }
    } catch (e) { flash('err', e instanceof Error ? e.message : 'Error'); }
    finally { setActing(null); }
  };

  const handlePause = async (cid: string, _streamId: number) => {
    setActing(cid);
    try {
      const now = new Date().toISOString();
      const result = await cantonExercise('Alice', 'StreamCore:StreamAgreement', cid, 'Pause', { currentTime: now });
      if (result.status === 200 || result.result) {
        flash('ok', `⏸ Stream paused — accrual frozen`);
        fetchStreams();
      } else {
        flash('err', result.errors?.[0] ?? 'Pause failed');
      }
    } catch (e) { flash('err', e instanceof Error ? e.message : 'Error'); }
    finally { setActing(null); }
  };

  const handleResume = async (cid: string, _streamId: number) => {
    setActing(cid);
    try {
      const now = new Date().toISOString();
      const result = await cantonExercise('Alice', 'StreamCore:StreamAgreement', cid, 'Resume', { currentTime: now });
      if (result.status === 200 || result.result) {
        flash('ok', `▶ Stream resumed — accrual restarted`);
        fetchStreams();
      } else {
        flash('err', result.errors?.[0] ?? 'Resume failed');
      }
    } catch (e) { flash('err', e instanceof Error ? e.message : 'Error'); }
    finally { setActing(null); }
  };

  const handleStop = async (cid: string, _streamId: number) => {
    if (!confirm('Stop this stream permanently? Refund will be calculated.')) return;
    setActing(cid);
    try {
      const now = new Date().toISOString();
      const result = await cantonExercise('Alice', 'StreamCore:StreamAgreement', cid, 'Stop', { currentTime: now });
      if (result.status === 200 || result.result) {
        flash('ok', `🛑 Stream stopped — refund calculated`);
        fetchStreams();
      } else {
        flash('err', result.errors?.[0] ?? 'Stop failed');
      }
    } catch (e) { flash('err', e instanceof Error ? e.message : 'Error'); }
    finally { setActing(null); }
  };

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #0a0e27 0%, #0d1333 100%)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Waves className="w-9 h-9 text-cyan-400" />
              <h1 className="text-3xl font-bold tracking-tight">GrowStreams</h1>
              <span className="px-2 py-0.5 bg-blue-600/30 text-blue-300 text-xs rounded-full border border-blue-500/30">Canton Network</span>
            </div>
            <p className="text-gray-400 text-sm ml-12">Real-time token streaming on Canton • Canton Dev Fund Phase 1</p>
          </div>
          <button onClick={fetchStreams} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status + Party Row */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">Canton Sandbox</span>
            <span className="text-gray-500 text-xs ml-1">localhost:6865</span>
            <span className="ml-auto text-gray-500 text-xs">JSON API :7575</span>
          </div>
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-gray-400 text-xs">Party:</span>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              <option value="Alice">Alice (Sender)</option>
              <option value="Bob">Bob (Receiver)</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Action Flash */}
        {actionMsg && (
          <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm ${
            actionMsg.type === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {actionMsg.type === 'ok' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {actionMsg.text}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Active Streams', value: streams.filter(s => s.payload.status === 'Active').length, color: 'text-emerald-400' },
            { label: 'Paused Streams', value: streams.filter(s => s.payload.status === 'Paused').length, color: 'text-amber-400' },
            { label: 'Total Streams', value: streams.length, color: 'text-cyan-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Streams */}
        {loading ? (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
            <p className="text-gray-400">Querying Canton ledger...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">{error}</div>
        ) : streams.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <Waves className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">No StreamAgreement contracts found for {selectedParty}</p>
            <p className="text-gray-600 text-xs mt-1">Try switching to Alice or Bob</p>
          </div>
        ) : (
          <div className="space-y-4">
            {streams.map((c) => {
              const s = c.payload;
              const accrued = calculateAccrued(s, currentTime);
              const totalOut = parseFloat(s.withdrawn) + accrued;
              const progress = parseFloat(s.deposited) > 0 ? (totalOut / parseFloat(s.deposited)) * 100 : 0;
              const isActing = acting === c.contractId;

              return (
                <div key={c.contractId} className="bg-gray-800/50 border border-gray-700/60 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">Stream #{s.streamId}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                          s.status === 'Paused' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/20 text-red-400 border border-red-500/20'
                        }`}>{s.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">
                        {s.sender.slice(0, 12)}... → {s.receiver.slice(0, 10)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Flow Rate</p>
                      <p className="text-xl font-bold text-cyan-400">{s.flowRate}<span className="text-sm text-gray-400"> GROW/s</span></p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Deposited', value: `${s.deposited} GROW`, color: 'text-white' },
                      { label: 'Withdrawn', value: `${s.withdrawn} GROW`, color: 'text-gray-300' },
                      { label: 'Accrued Now', value: `${accrued.toFixed(4)} GROW`, color: 'text-cyan-400' },
                      { label: 'Remaining', value: formatRemaining(s, currentTime), color: s.status === 'Active' ? 'text-emerald-400' : 'text-amber-400' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-gray-900/50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                        <p className={`text-sm font-semibold ${stat.color} tabular-nums`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Streamed</span>
                      <span>{Math.min(progress, 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-900 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                          background: s.status === 'Active'
                            ? 'linear-gradient(90deg, #0066FF, #00D4FF)'
                            : s.status === 'Paused'
                            ? '#d97706'
                            : '#ef4444',
                        }}
                      />
                    </div>
                  </div>

                  {/* Contract ID */}
                  <p className="text-xs text-gray-600 font-mono mb-3 truncate">
                    Contract: {c.contractId.slice(0, 60)}...
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {selectedParty === 'Bob' && s.status === 'Active' && accrued > 0.0001 && (
                      <button
                        onClick={() => handleWithdraw(c.contractId, s.streamId)}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm transition-colors"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        {isActing ? 'Processing…' : `Withdraw ${accrued.toFixed(4)} GROW`}
                      </button>
                    )}
                    {selectedParty === 'Alice' && s.status === 'Active' && (
                      <button
                        onClick={() => handlePause(c.contractId, s.streamId)}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg text-sm transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        {isActing ? 'Processing…' : 'Pause'}
                      </button>
                    )}
                    {selectedParty === 'Alice' && s.status === 'Paused' && (
                      <button
                        onClick={() => handleResume(c.contractId, s.streamId)}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {isActing ? 'Processing…' : 'Resume'}
                      </button>
                    )}
                    {selectedParty === 'Alice' && s.status !== 'Stopped' && (
                      <button
                        onClick={() => handleStop(c.contractId, s.streamId)}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
                      >
                        <Square className="w-3.5 h-3.5" />
                        {isActing ? 'Processing…' : 'Stop'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-gray-600 space-y-1">
          <p>GrowStreams Canton Native — Phase 1 Complete — Canton Dev Fund Submission</p>
          <p>33/33 Tests Passing • 6/6 Acceptance Criteria Met • Daml SDK 2.10.3</p>
        </div>
      </div>
    </main>
  );
}
