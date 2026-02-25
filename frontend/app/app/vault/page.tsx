'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api, type VaultBalance } from '@/lib/growstreams-api';
import { useVaultActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import { Vault, ArrowUpFromLine, ArrowDownToLine, RefreshCw, Coins, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const ZERO_TOKEN = '0x0000000000000000000000000000000000000000000000000000000000000000';

function formatGrow(raw: string | number): string {
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '0 GROW';
  if (n >= 1e12) return (n / 1e12).toFixed(4) + ' GROW';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' mGROW';
  return n.toLocaleString() + ' units';
}

export default function VaultPage() {
  const { account } = useAccount();
  const { depositNative, withdrawNative, loading: signing } = useVaultActions();
  const [balance, setBalance] = useState<VaultBalance | null>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');

  const loadData = async () => {
    if (!account?.decodedAddress) return;
    setLoading(true);
    try {
      const hex = account.decodedAddress;
      const [bal, p] = await Promise.all([
        api.vault.balance(hex, ZERO_TOKEN).catch(() => null),
        api.vault.paused(),
      ]);
      setBalance(bal);
      setPaused(p.paused);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [account]);

  const deposited = Number(balance?.deposited || 0);
  const allocated = Number(balance?.allocated || 0);
  const available = Number(balance?.available || 0);
  const usagePercent = deposited > 0 ? (allocated / deposited) * 100 : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      const planck = BigInt(Math.floor(parsed * 1e12)).toString();
      if (mode === 'deposit') {
        await depositNative(planck);
        toast.success(`Deposited ${parsed} GROW into your vault`);
      } else {
        await withdrawNative(planck);
        toast.success(`Withdrew ${parsed} GROW from your vault`);
      }
      setAmount('');
      setTimeout(loadData, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Vault className="w-6 h-6 text-emerald-400" /> GROW Vault
          </h1>
          <p className="text-provn-muted text-sm mt-1">
            Deposit GROW tokens to fund your streams
          </p>
        </div>
        <button onClick={loadData} className="p-2 rounded-lg border border-provn-border hover:bg-provn-surface transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
        <p className="text-sm text-emerald-300 font-medium mb-2">How it works</p>
        <div className="flex items-center gap-3 text-xs text-provn-muted">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-provn-surface rounded-lg border border-provn-border">
            <Coins className="w-3 h-3 text-emerald-400" /> 1. Deposit GROW
          </span>
          <ArrowRight className="w-3 h-3 text-provn-muted/50" />
          <Link href="/app/streams" className="flex items-center gap-1.5 px-2.5 py-1 bg-provn-surface rounded-lg border border-provn-border hover:border-emerald-500/30 transition-colors">
            <ArrowUpFromLine className="w-3 h-3 text-blue-400" /> 2. Create a Stream
          </Link>
          <ArrowRight className="w-3 h-3 text-provn-muted/50" />
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-provn-surface rounded-lg border border-provn-border">
            <ArrowDownToLine className="w-3 h-3 text-amber-400" /> 3. Receiver Withdraws
          </span>
        </div>
      </div>

      {paused && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          Vault is currently paused by the admin. Deposits and withdrawals are disabled.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
        </div>
      ) : (
        <>
          <div className="bg-provn-surface border border-provn-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-provn-muted">Your GROW Balance</h2>
              <span className="text-xs text-provn-muted font-mono">{deposited > 0 ? `${usagePercent.toFixed(0)}% allocated` : 'No deposits yet'}</span>
            </div>

            {deposited > 0 && (
              <div className="mb-5">
                <div className="h-3 bg-provn-bg rounded-full overflow-hidden flex">
                  <div className="h-full bg-amber-500/70 rounded-l-full transition-all" style={{ width: `${usagePercent}%` }} />
                  <div className="h-full bg-emerald-500/70 rounded-r-full transition-all" style={{ width: `${100 - usagePercent}%` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-provn-muted">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500/70 inline-block" /> Locked in streams</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/70 inline-block" /> Available</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-provn-muted mb-1">Total Deposited</p>
                <p className="text-xl font-bold text-provn-text">{formatGrow(deposited)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-provn-muted mb-1">In Streams</p>
                <p className="text-xl font-bold text-amber-400">{formatGrow(allocated)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-provn-muted mb-1">Available</p>
                <p className="text-xl font-bold text-emerald-400">{formatGrow(available)}</p>
              </div>
            </div>
          </div>

          <div className="bg-provn-surface border border-provn-border rounded-xl p-5">
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setMode('deposit')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'deposit' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-provn-muted hover:text-provn-text border border-provn-border'
                }`}
              >
                <ArrowUpFromLine className="w-4 h-4" /> Deposit GROW
              </button>
              <button
                onClick={() => setMode('withdraw')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'withdraw' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'text-provn-muted hover:text-provn-text border border-provn-border'
                }`}
              >
                <ArrowDownToLine className="w-4 h-4" /> Withdraw GROW
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-provn-muted mb-1">Amount (GROW)</label>
                <div className="relative">
                  <input
                    value={amount} onChange={e => setAmount(e.target.value)}
                    required type="number" min="0.001" step="0.001"
                    className="w-full px-3 py-2.5 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-emerald-500/50 focus:outline-none pr-16"
                    placeholder="e.g. 5.0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-provn-muted font-medium">GROW</span>
                </div>
                <p className="text-xs text-provn-muted mt-1.5">
                  {mode === 'deposit'
                    ? 'Deposit GROW into the vault to fund streams. Minimum 1 GROW recommended.'
                    : `Available to withdraw: ${formatGrow(available)}`}
                </p>
              </div>
              <button
                type="submit" disabled={signing || paused}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  mode === 'deposit'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {signing ? 'Signing transaction...' : mode === 'deposit' ? 'Deposit GROW' : 'Withdraw GROW'}
              </button>
            </form>
          </div>

          {deposited > 0 && available > 0 && (
            <Link href="/app/streams"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/15 transition-colors">
              You have {formatGrow(available)} available — Create a Stream <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </>
      )}
    </div>
  );
}
