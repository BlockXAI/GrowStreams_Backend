'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api } from '@/lib/growstreams-api';
import { useSplitsActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import { GitFork, Plus, Trash2, Send, RefreshCw } from 'lucide-react';

const ZERO_TOKEN = '0x0000000000000000000000000000000000000000000000000000000000000000';

export default function SplitsPage() {
  const { account } = useAccount();
  const { createGroup, distribute, loading: signing } = useSplitsActions();
  const [groups, setGroups] = useState<{ id: number; recipients: { address: string; weight: number }[]; total_weight: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [recipients, setRecipients] = useState([{ address: '', weight: '' }]);
  const [distAmount, setDistAmount] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const loadGroups = async () => {
    if (!account?.decodedAddress) return;
    setLoading(true);
    try {
      const hex = account.decodedAddress;
      const owned = await api.splits.byOwner(hex).catch(() => ({ groupIds: [] }));
      const details = await Promise.all(
        (owned.groupIds || []).map(id => api.splits.get(Number(id)).catch(() => null))
      );
      setGroups(details.filter(Boolean) as typeof groups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGroups(); }, [account]);

  const addRecipient = () => setRecipients([...recipients, { address: '', weight: '' }]);
  const removeRecipient = (i: number) => setRecipients(recipients.filter((_, idx) => idx !== i));

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setBusy(-1);
      const mapped = recipients.map(r => ({ address: r.address, weight: Number(r.weight) }));
      await createGroup(mapped);
      toast.success('Split group created!');
      setShowCreate(false);
      setRecipients([{ address: '', weight: '' }]);
      setTimeout(loadGroups, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(null);
    }
  };

  const handleDistribute = async (id: number) => {
    const amt = distAmount[id];
    if (!amt) return toast.error('Enter an amount');
    setBusy(id);
    try {
      await distribute(id, ZERO_TOKEN, amt);
      toast.success(`Distributed ${amt} to group #${id}`);
      setDistAmount(prev => ({ ...prev, [id]: '' }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitFork className="w-6 h-6 text-purple-400" /> Revenue Splits
          </h1>
          <p className="text-provn-muted text-sm mt-1">Split payments across multiple recipients</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadGroups} className="p-2 rounded-lg border border-provn-border hover:bg-provn-surface transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Group
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-provn-surface border border-provn-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold">Create Split Group</h2>
          {recipients.map((r, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs text-provn-muted mb-1">Address</label>
                <input value={r.address} onChange={e => {
                  const up = [...recipients]; up[i].address = e.target.value; setRecipients(up);
                }} required className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm font-mono focus:border-purple-500/50 focus:outline-none" placeholder="0x..." />
              </div>
              <div className="w-24">
                <label className="block text-xs text-provn-muted mb-1">Weight</label>
                <input value={r.weight} onChange={e => {
                  const up = [...recipients]; up[i].weight = e.target.value; setRecipients(up);
                }} required type="number" className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-purple-500/50 focus:outline-none" placeholder="50" />
              </div>
              {recipients.length > 1 && (
                <button type="button" onClick={() => removeRecipient(i)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addRecipient} className="text-sm text-purple-400 hover:text-purple-300">+ Add recipient</button>
          <button type="submit" disabled={busy === -1}
            className="px-6 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {busy === -1 ? 'Signing...' : 'Create Group'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" /></div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-provn-muted">
          <GitFork className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No split groups found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(g => (
            <div key={g.id} className="bg-provn-surface border border-provn-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Group #{g.id}</h3>
                <span className="text-xs text-provn-muted">{g.recipients.length} recipients • weight {g.total_weight}</span>
              </div>
              <div className="space-y-1 mb-4">
                {g.recipients.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-provn-bg/50 rounded-lg px-3 py-2">
                    <span className="font-mono truncate flex-1">{r.address}</span>
                    <span className="ml-2 text-purple-400 font-medium">{r.weight} ({Math.round(r.weight / g.total_weight * 100)}%)</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={distAmount[g.id] || ''} onChange={e => setDistAmount(prev => ({ ...prev, [g.id]: e.target.value }))}
                  type="number" placeholder="Amount to distribute"
                  className="flex-1 px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-purple-500/50 focus:outline-none"
                />
                <button onClick={() => handleDistribute(g.id)} disabled={busy === g.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                  <Send className="w-3.5 h-3.5" /> {busy === g.id ? 'Signing...' : 'Distribute'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
