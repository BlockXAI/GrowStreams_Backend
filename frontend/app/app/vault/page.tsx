'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api, type VaultBalance } from '@/lib/growstreams-api';
import { useVaultActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import { Vault, ArrowUpFromLine, ArrowDownToLine, RefreshCw, Coins } from 'lucide-react';

const ZERO_TOKEN = '0x0000000000000000000000000000000000000000000000000000000000000000';

function formatVara(raw: string | number): string {
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '0';
  if (n >= 1e12) return (n / 1e12).toFixed(4) + ' VARA';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M units';
  return n.toLocaleString() + ' units';
}

export default function VaultPage() {
  const { account } = useAccount();
  const { depositTokens, withdrawTokens, depositNative, withdrawNative, loading: signing } = useVaultActions();
  const [balance, setBalance] = useState<VaultBalance | null>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [tokenMode, setTokenMode] = useState<'native' | 'vft'>('native');
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (tokenMode === 'native') {
        const planck = BigInt(Math.floor(parseFloat(amount) * 1e12)).toString();
        if (mode === 'deposit') {
          await depositNative(planck);
          toast.success(`Deposited ${amount} VARA`);
        } else {
          await withdrawNative(planck);
          toast.success(`Withdrew ${amount} VARA`);
        }
      } else {
        if (mode === 'deposit') {
          await depositTokens(ZERO_TOKEN, amount);
          toast.success(`Deposited ${amount} tokens`);
        } else {
          await withdrawTokens(ZERO_TOKEN, amount);
          toast.success(`Withdrew ${amount} tokens`);
        }
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
            <Vault className="w-6 h-6 text-blue-400" /> Token Vault
          </h1>
          <p className="text-provn-muted text-sm mt-1">Manage your escrow deposits</p>
        </div>
        <button onClick={loadData} className="p-2 rounded-lg border border-provn-border hover:bg-provn-surface transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {paused && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          Vault is currently paused. Deposits and withdrawals are disabled.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-provn-surface border border-provn-border rounded-xl p-5 text-center">
              <p className="text-xs text-provn-muted mb-1">Deposited</p>
              <p className="text-xl font-bold text-provn-text">{formatVara(balance?.total_deposited || '0')}</p>
              <p className="text-[10px] text-provn-muted mt-1 font-mono">{balance?.total_deposited || '0'} units</p>
            </div>
            <div className="bg-provn-surface border border-provn-border rounded-xl p-5 text-center">
              <p className="text-xs text-provn-muted mb-1">Allocated to Streams</p>
              <p className="text-xl font-bold text-amber-400">{formatVara(balance?.total_allocated || '0')}</p>
              <p className="text-[10px] text-provn-muted mt-1 font-mono">{balance?.total_allocated || '0'} units</p>
            </div>
            <div className="bg-provn-surface border border-provn-border rounded-xl p-5 text-center">
              <p className="text-xs text-provn-muted mb-1">Available to Withdraw</p>
              <p className="text-xl font-bold text-emerald-400">{formatVara(balance?.available || '0')}</p>
              <p className="text-[10px] text-provn-muted mt-1 font-mono">{balance?.available || '0'} units</p>
            </div>
          </div>

          <div className="bg-provn-surface border border-provn-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('deposit')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'deposit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-provn-muted hover:text-provn-text border border-provn-border'
                  }`}
                >
                  <ArrowUpFromLine className="w-4 h-4" /> Deposit
                </button>
                <button
                  onClick={() => setMode('withdraw')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'withdraw' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'text-provn-muted hover:text-provn-text border border-provn-border'
                  }`}
                >
                  <ArrowDownToLine className="w-4 h-4" /> Withdraw
                </button>
              </div>
              <div className="flex gap-1 bg-provn-bg rounded-lg p-0.5">
                <button
                  onClick={() => setTokenMode('native')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tokenMode === 'native' ? 'bg-emerald-500/15 text-emerald-400' : 'text-provn-muted hover:text-provn-text'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" /> VARA
                </button>
                <button
                  onClick={() => setTokenMode('vft')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    tokenMode === 'vft' ? 'bg-blue-500/15 text-blue-400' : 'text-provn-muted hover:text-provn-text'
                  }`}
                >
                  VFT Token
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-provn-muted mb-1">
                  {tokenMode === 'native' ? 'Amount (VARA)' : 'Amount (smallest units)'}
                </label>
                <input
                  value={amount} onChange={e => setAmount(e.target.value)}
                  required type="number" min={tokenMode === 'native' ? '0.001' : '1'}
                  step={tokenMode === 'native' ? '0.001' : '1'}
                  className="w-full px-3 py-2.5 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-emerald-500/50 focus:outline-none"
                  placeholder={tokenMode === 'native' ? 'e.g. 2.0 VARA' : 'Enter amount...'}
                />
                {tokenMode === 'native' && (
                  <p className="text-xs text-provn-muted mt-1">Minimum deposit: 1 VARA for stream buffer requirements</p>
                )}
              </div>
              <button
                type="submit" disabled={signing || paused}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  mode === 'deposit'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {signing ? 'Signing...' : mode === 'deposit'
                  ? `Deposit ${tokenMode === 'native' ? 'VARA' : 'Tokens'}`
                  : `Withdraw ${tokenMode === 'native' ? 'VARA' : 'Tokens'}`}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
