'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api, type VaultBalance } from '@/lib/growstreams-api';
import { useVaultActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import {
  Vault, ArrowUpFromLine, ArrowDownToLine, RefreshCw, Coins,
  TrendingUp, Clock, Lock, AlertTriangle, Percent, Info,
} from 'lucide-react';

const ZERO_TOKEN = '0x' + '0'.repeat(64);
const GROW_TOKEN = '0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36';
const ONE = 1_000_000_000_000;

function fmtShort(raw: string | number): string {
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '0';
  const v = n / ONE;
  if (v >= 1_000) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (v >= 1) return v.toFixed(4);
  if (v >= 0.0001) return v.toFixed(6);
  return '< 0.0001';
}

function pctOf(total: string, part: string): number {
  const d = Number(total), p = Number(part);
  return d > 0 ? Math.min((p / d) * 100, 100) : 0;
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('Insufficient available')) return 'Nothing available to withdraw. Funds may be allocated to streams.';
  if (msg.includes('Vault is paused')) return 'Vault is paused by the admin. Try again later.';
  if (msg.includes('Amount must be > 0') || msg.includes('Value must be > 0')) return 'Enter an amount greater than zero.';
  if (msg.includes('deposit_native')) return 'Switch to the VARA tab for native deposits.';
  if (msg.includes('withdraw_native')) return 'Switch to the VARA tab for native withdrawals.';
  if (msg.includes('Cancelled') || msg.includes('Rejected')) return 'Transaction cancelled.';
  if (msg.includes('Program terminated') || msg.includes('Panic')) {
    const m = msg.match(/panicked with '([^']+)'/);
    return m ? m[1] : 'Contract rejected this operation.';
  }
  if (msg.includes('ExtrinsicFailed')) return 'Transaction failed on-chain. Check your balance.';
  return msg.length > 100 ? msg.slice(0, 100) + '...' : msg;
}

export default function VaultPage() {
  const { account } = useAccount();
  const { depositTokens, withdrawTokens, depositNative, withdrawNative } = useVaultActions();

  const [varaBal, setVaraBal] = useState<VaultBalance | null>(null);
  const [growBal, setGrowBal] = useState<VaultBalance | null>(null);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [tokenMode, setTokenMode] = useState<'vara' | 'grow'>('vara');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    if (!account?.decodedAddress) return;
    setLoading(true);
    try {
      const hex = account.decodedAddress;
      const [vb, gb, p] = await Promise.all([
        api.vault.balance(hex, ZERO_TOKEN).catch(() => null),
        api.vault.balance(hex, GROW_TOKEN).catch(() => null),
        api.vault.paused().catch(() => ({ paused: false })),
      ]);
      setVaraBal(vb);
      setGrowBal(gb);
      setPaused(p.paused);
    } catch (err) {
      console.error('Vault load error:', err);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => { loadData(); }, [loadData]);

  const sym = tokenMode === 'vara' ? 'VARA' : 'GROW';
  const bal = tokenMode === 'vara' ? varaBal : growBal;
  const available = Number(bal?.available || '0');
  const allocated = Number(bal?.total_allocated || '0');
  const currentBalance = allocated + available;
  const currentBalanceStr = String(currentBalance);
  const pctAlloc = pctOf(currentBalanceStr, bal?.total_allocated || '0');
  const pctAvail = pctOf(currentBalanceStr, bal?.available || '0');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const raw = parseFloat(amount);
    if (isNaN(raw) || raw <= 0) { toast.error('Enter a valid amount.'); return; }
    if (mode === 'withdraw') {
      if (available <= 0) { toast.error('Nothing available to withdraw.'); return; }
      const units = Math.floor(raw * ONE);
      if (units > available) { toast.error(`Max: ${fmtShort(String(available))} ${sym}.`); return; }
    }
    setBusy(true);
    try {
      if (tokenMode === 'vara') {
        const planck = BigInt(Math.floor(raw * ONE)).toString();
        if (mode === 'deposit') { await depositNative(planck); toast.success(`Deposited ${raw} VARA`); }
        else { await withdrawNative(planck); toast.success(`Withdrew ${raw} VARA`); }
      } else {
        const units = BigInt(Math.floor(raw * ONE)).toString();
        if (mode === 'deposit') { await depositTokens(GROW_TOKEN, units); toast.success(`Deposited ${raw} GROW`); }
        else { await withdrawTokens(GROW_TOKEN, units); toast.success(`Withdrew ${raw} GROW`); }
      }
      setAmount('');
      setTimeout(loadData, 4000);
    } catch (err: unknown) { toast.error(friendlyError(err)); }
    finally { setBusy(false); }
  };

  const setMax = () => {
    if (available <= 0) { toast.error('No available balance.'); return; }
    setAmount(String(Math.floor((available / ONE) * 10000) / 10000));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Vault className="w-6 h-6 text-purple-400" /> Token Vault
          </h1>
          <p className="text-provn-muted text-sm mt-1">Manage VARA & GROW escrow for streaming</p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="p-2 rounded-lg border border-provn-border hover:bg-provn-surface transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {paused && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Vault Paused</p>
            <p className="text-xs text-red-400/70 mt-0.5">Deposits and withdrawals temporarily disabled.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
        </div>
      ) : (
        <>
          {/* Token selector cards */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setTokenMode('vara')} className={`text-left bg-provn-surface border rounded-xl p-4 transition-all ${
              tokenMode === 'vara' ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-provn-border hover:border-emerald-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm font-semibold">VARA</span>
                {tokenMode === 'vara' && <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">Selected</span>}
              </div>
              <p className="text-lg font-bold font-mono text-emerald-400">{fmtShort(String(Number(varaBal?.total_allocated || '0') + Number(varaBal?.available || '0')))}</p>
              <p className="text-[10px] text-provn-muted">in vault &middot; {fmtShort(varaBal?.available || '0')} available</p>
            </button>
            <button onClick={() => setTokenMode('grow')} className={`text-left bg-provn-surface border rounded-xl p-4 transition-all ${
              tokenMode === 'grow' ? 'border-blue-500/40 ring-1 ring-blue-500/20' : 'border-provn-border hover:border-blue-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-semibold">GROW</span>
                {tokenMode === 'grow' && <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">Selected</span>}
              </div>
              <p className="text-lg font-bold font-mono text-blue-400">{fmtShort(String(Number(growBal?.total_allocated || '0') + Number(growBal?.available || '0')))}</p>
              <p className="text-[10px] text-provn-muted">in vault &middot; {fmtShort(growBal?.available || '0')} available</p>
            </button>
          </div>

          {/* Balance breakdown with allocation bar */}
          <div className="bg-provn-surface border border-provn-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-provn-border/50">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-400" /> {sym} Vault Breakdown
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-px bg-provn-border/50">
              <div className="bg-provn-surface p-4 text-center">
                <p className="text-[10px] text-provn-muted uppercase tracking-wider mb-1">Current Balance</p>
                <p className="text-xl font-bold font-mono">{fmtShort(currentBalanceStr)}</p>
                <p className="text-[10px] text-provn-muted">{sym}</p>
              </div>
              <div className="bg-provn-surface p-4 text-center">
                <p className="text-[10px] text-provn-muted uppercase tracking-wider mb-1">In Streams</p>
                <p className="text-xl font-bold font-mono text-amber-400">{fmtShort(bal?.total_allocated || '0')}</p>
                <p className="text-[10px] text-amber-400/70">{pctAlloc.toFixed(1)}% allocated</p>
              </div>
              <div className="bg-provn-surface p-4 text-center">
                <p className="text-[10px] text-provn-muted uppercase tracking-wider mb-1">Available</p>
                <p className={`text-xl font-bold font-mono ${tokenMode === 'vara' ? 'text-emerald-400' : 'text-blue-400'}`}>{fmtShort(bal?.available || '0')}</p>
                <p className="text-[10px] text-provn-muted">{pctAvail.toFixed(1)}% withdrawable</p>
              </div>
            </div>
            {currentBalance > 0 && (
              <div className="px-5 py-3 border-t border-provn-border/30">
                <div className="flex items-center gap-2 text-[10px] text-provn-muted mb-1.5">
                  <span>Allocation</span>
                  <span className="ml-auto">{pctAlloc.toFixed(1)}% in streams &middot; {pctAvail.toFixed(1)}% free</span>
                </div>
                <div className="h-2 rounded-full bg-provn-bg overflow-hidden flex">
                  <div className="h-full bg-amber-500/60 transition-all" style={{ width: `${pctAlloc}%` }} />
                  <div className={`h-full transition-all ${tokenMode === 'vara' ? 'bg-emerald-500/60' : 'bg-blue-500/60'}`} style={{ width: `${pctAvail}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Deposit / Withdraw form */}
          <div className="bg-provn-surface border border-provn-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setMode('deposit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'deposit'
                    ? tokenMode === 'vara'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    : 'text-provn-muted hover:text-provn-text border border-provn-border'}`}>
                <ArrowUpFromLine className="w-4 h-4" /> Deposit
              </button>
              <button onClick={() => setMode('withdraw')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'withdraw' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-provn-muted hover:text-provn-text border border-provn-border'}`}>
                <ArrowDownToLine className="w-4 h-4" /> Withdraw
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-provn-muted mb-1">Amount ({sym})</label>
                <div className="relative">
                  <input value={amount} onChange={e => setAmount(e.target.value)}
                    required type="number" min="0.0001" step="any"
                    className="w-full px-3 py-2.5 pr-24 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-purple-500/50 focus:outline-none"
                    placeholder={`e.g. ${tokenMode === 'vara' ? '2.0' : '500'}`} />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {mode === 'withdraw' && (
                      <button type="button" onClick={setMax}
                        className="px-2 py-1 rounded text-[10px] bg-provn-border/40 text-provn-muted hover:text-provn-text transition-colors">
                        Max
                      </button>
                    )}
                    <span className="text-xs text-provn-muted px-1">{sym}</span>
                  </div>
                </div>
                {tokenMode === 'vara' && mode === 'deposit' && (
                  <p className="text-[10px] text-provn-muted mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> VARA is sent as msg.value with the transaction
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {(tokenMode === 'vara' ? ['0.5', '1', '5', '10'] : ['100', '500', '1000', '5000']).map(v => (
                  <button key={v} type="button" onClick={() => setAmount(v)}
                    className="px-2.5 py-1 rounded text-[11px] border border-provn-border/50 text-provn-muted hover:text-purple-400 hover:border-purple-500/30 transition-colors">
                    {v}
                  </button>
                ))}
              </div>
              <button type="submit" disabled={busy || paused || !amount}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  mode === 'deposit'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                {busy ? 'Signing...' : mode === 'deposit' ? `Deposit ${sym}` : `Withdraw ${sym}`}
              </button>
            </form>
          </div>

          {/* Info panels: Lockup/Cooldown + APY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-provn-surface border border-provn-border rounded-xl p-5">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-400" /> Lockup & Cooldown
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-provn-bg/40 rounded-lg p-3">
                  <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Stream Lock Period</p>
                    <p className="text-[10px] text-provn-muted mt-0.5">
                      Funds allocated to active streams are locked until the stream ends or is stopped.
                      You cannot withdraw allocated tokens.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-provn-bg/40 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Withdrawal Cooldown</p>
                    <p className="text-[10px] text-provn-muted mt-0.5">
                      No cooldown period on available funds. Withdraw your unallocated balance anytime.
                      Transactions confirm in ~6 seconds on Vara.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-provn-bg/40 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Emergency Pause</p>
                    <p className="text-[10px] text-provn-muted mt-0.5">
                      The admin can pause the vault in emergencies. During a pause all
                      deposits and withdrawals are blocked until unpaused.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-provn-surface border border-provn-border rounded-xl p-5">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Estimated APY
              </h3>
              <div className="bg-gradient-to-br from-emerald-500/10 to-purple-500/10 rounded-xl p-4 text-center mb-3">
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
                  8 &ndash; 12%
                </p>
                <p className="text-[10px] text-provn-muted mt-1">Annualized yield range</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-provn-muted">Base streaming yield</span>
                  <span className="font-mono text-emerald-400">~8%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-provn-muted">Active allocation bonus</span>
                  <span className="font-mono text-purple-400">+2-4%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-provn-muted">Network staking (VARA)</span>
                  <span className="font-mono text-blue-400">variable</span>
                </div>
              </div>
              <div className="mt-3 bg-provn-bg/40 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-provn-muted flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-provn-muted leading-relaxed">
                  APY is estimated based on streaming activity and network conditions.
                  Actual returns depend on stream utilization and token demand. Past
                  performance does not guarantee future results.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
