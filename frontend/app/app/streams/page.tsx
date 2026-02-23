'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api, type StreamData } from '@/lib/growstreams-api';
import { useStreamActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import { Waves, Play, Pause, Square, Plus, RefreshCw, DollarSign, ArrowDownToLine } from 'lucide-react';

const ZERO_TOKEN = '0x0000000000000000000000000000000000000000000000000000000000000000';

function statusColor(s: string) {
  if (s === 'Active') return 'text-emerald-400 bg-emerald-500/10';
  if (s === 'Paused') return 'text-amber-400 bg-amber-500/10';
  return 'text-red-400 bg-red-500/10';
}

export default function StreamsPage() {
  const { account } = useAccount();
  const actions = useStreamActions();
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [streamIds, setStreamIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const [receiver, setReceiver] = useState('');
  const [flowRate, setFlowRate] = useState('');
  const [deposit, setDeposit] = useState('');

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
      setStreamIds(allIds);
      const details = await Promise.all(
        allIds.slice(0, 20).map(id => api.streams.get(Number(id)).catch(() => null))
      );
      setStreams(details.filter(Boolean) as StreamData[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStreams(); }, [account]);

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
      }
      toast.success(`${action} succeeded for stream #${id}`);
      setTimeout(loadStreams, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Waves className="w-6 h-6 text-emerald-400" /> Streams
          </h1>
          <p className="text-provn-muted text-sm mt-1">Create and manage token streams</p>
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

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-provn-surface border border-provn-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">New Stream</h2>
          <div>
            <label className="block text-xs text-provn-muted mb-1">Receiver Address (0x...)</label>
            <input
              value={receiver} onChange={e => setReceiver(e.target.value)} required
              className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm font-mono focus:border-emerald-500/50 focus:outline-none"
              placeholder="0x0000...0001"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-provn-muted mb-1">Flow Rate (per second)</label>
              <input
                value={flowRate} onChange={e => setFlowRate(e.target.value)} required type="number"
                className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-emerald-500/50 focus:outline-none"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-xs text-provn-muted mb-1">Initial Deposit</label>
              <input
                value={deposit} onChange={e => setDeposit(e.target.value)} required type="number"
                className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-emerald-500/50 focus:outline-none"
                placeholder="3600000"
              />
            </div>
          </div>
          <button
            type="submit" disabled={busy === -1}
            className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {busy === -1 ? 'Signing...' : 'Create Stream'}
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
          <p>No streams found. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {streams.map((s) => (
            <div key={s.id} className="bg-provn-surface border border-provn-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">#{s.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(s.status)}`}>
                    {s.status}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {s.status === 'Active' && (
                    <button onClick={() => handleAction(s.id, 'pause')} disabled={busy === s.id}
                      className="p-1.5 rounded-lg border border-provn-border hover:bg-amber-500/10 hover:border-amber-500/30 transition-colors" title="Pause">
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {s.status === 'Paused' && (
                    <button onClick={() => handleAction(s.id, 'resume')} disabled={busy === s.id}
                      className="p-1.5 rounded-lg border border-provn-border hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors" title="Resume">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(s.status === 'Active' || s.status === 'Paused') && (
                    <>
                      <button onClick={() => handleAction(s.id, 'withdraw')} disabled={busy === s.id}
                        className="p-1.5 rounded-lg border border-provn-border hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors" title="Withdraw">
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleAction(s.id, 'stop')} disabled={busy === s.id}
                        className="p-1.5 rounded-lg border border-provn-border hover:bg-red-500/10 hover:border-red-500/30 transition-colors" title="Stop">
                        <Square className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-provn-muted">Sender</span>
                  <p className="font-mono truncate mt-0.5">{s.sender}</p>
                </div>
                <div>
                  <span className="text-provn-muted">Receiver</span>
                  <p className="font-mono truncate mt-0.5">{s.receiver}</p>
                </div>
                <div>
                  <span className="text-provn-muted">Flow Rate</span>
                  <p className="font-mono mt-0.5">{s.flow_rate}/s</p>
                </div>
                <div>
                  <span className="text-provn-muted">Deposit</span>
                  <p className="font-mono mt-0.5">{s.deposit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
