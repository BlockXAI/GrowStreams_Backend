'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import Link from 'next/link';
import { api } from '@/lib/growstreams-api';
import { useGrowTokenActions, useVaultActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import {
  Coins, Wallet, ArrowRightLeft, CheckCircle, ArrowUpFromLine,
  ArrowDownToLine, Copy, RefreshCw, Zap, Shield, Waves,
  TrendingUp, Lock, ChevronRight, Settings, UserPlus, Trash2,
} from 'lucide-react';

const GROW_TOKEN_ID = '0x05a2a482f1a1a7ebf74643f3cc2099597dac81ff92535cbd647948febee8fe36';
const VAULT_ID = '0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b';
const DECIMALS = 12;
const ONE_GROW = 1_000_000_000_000;

function toBaseUnits(growAmount: string): string {
  const num = parseFloat(growAmount);
  if (isNaN(num) || num <= 0) return '0';
  return BigInt(Math.round(num * ONE_GROW)).toString();
}

function toGrow(raw: string | number): number {
  const n = Number(raw);
  if (isNaN(n)) return 0;
  return n / ONE_GROW;
}

function formatGrow(raw: string | number): string {
  const g = toGrow(raw);
  if (g === 0) return '0 GROW';
  if (g >= 1_000_000) return g.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' GROW';
  if (g >= 1) return g.toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' GROW';
  if (g >= 0.0001) return g.toFixed(6) + ' GROW';
  return '< 0.0001 GROW';
}

function formatGrowShort(raw: string | number): string {
  const g = toGrow(raw);
  if (g === 0) return '0';
  if (g >= 1_000_000) return (g / 1_000_000).toFixed(1) + 'M';
  if (g >= 1_000) return (g / 1_000).toFixed(1) + 'K';
  if (g >= 1) return g.toFixed(2);
  return g.toFixed(6);
}

function truncAddr(addr: string): string {
  if (!addr || addr.length < 16) return addr || '\u2014';
  return addr.slice(0, 10) + '\u2026' + addr.slice(-6);
}

export default function GrowTokenPage() {
  const { account } = useAccount();
  const tokenActions = useGrowTokenActions();
  const vaultActions = useVaultActions();

  const [balance, setBalance] = useState('0');
  const [vaultBalance, setVaultBalance] = useState({ available: '0', allocated: '0', deposited: '0' });
  const [allowance, setAllowance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'faucet' | 'approve' | 'vault' | 'transfer' | 'admin'>('faucet');

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAddress, setAdminAddress] = useState<string | null>(null);
  const [faucetMode, setFaucetMode] = useState('public');
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newWhitelistAddr, setNewWhitelistAddr] = useState('');

  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const loadBalances = useCallback(async () => {
    if (!account?.decodedAddress) return;
    setLoading(true);
    try {
      const hex = account.decodedAddress;
      const [bal, supply, allow, vaultRaw] = await Promise.all([
        api.growToken.balance(hex).catch(() => ({ balance: '0' })),
        api.growToken.totalSupply().catch(() => ({ totalSupply: '0' })),
        api.growToken.allowance(hex, VAULT_ID).catch(() => ({ allowance: '0' })),
        api.vault.balance(hex, GROW_TOKEN_ID).catch(() => null),
      ]);
      setBalance(bal.balance);
      setTotalSupply(supply.totalSupply);
      setAllowance(allow.allowance);
      const v = vaultRaw as Record<string, string> | null;
      setVaultBalance({
        available: v?.available || '0',
        allocated: v?.total_allocated || '0',
        deposited: v?.total_deposited || '0',
      });
    } catch (err) {
      console.error('Failed to load balances:', err);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => { loadBalances(); }, [loadBalances]);

  useEffect(() => {
    Promise.all([
      api.growToken.meta().catch(() => null),
      api.growToken.adminInfo().catch(() => null),
    ]).then(([meta, info]) => {
      const contractAdmin = meta?.admin?.toLowerCase();
      const userHex = account?.decodedAddress?.toLowerCase();
      if (contractAdmin && userHex) {
        setIsAdmin(contractAdmin === userHex);
      }
      if (info) {
        setAdminAddress(info.adminAddress);
        setFaucetMode(info.faucetMode);
      }
    });
  }, [account]);

  const loadAdminData = useCallback(async () => {
    try {
      const data = await api.growToken.getWhitelist();
      setWhitelist(data.whitelist);
      setFaucetMode(data.mode);
    } catch { /* not admin or API down */ }
  }, []);

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) return;
    const base = toBaseUnits(transferAmount);
    if (base === '0') { toast.error('Enter a valid amount'); return; }
    setBusy('transfer');
    try {
      await tokenActions.transfer(transferTo, base);
      toast.success(`Sent ${transferAmount} GROW to ${truncAddr(transferTo)}`);
      setTransferTo(''); setTransferAmount('');
      setTimeout(loadBalances, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed');
    } finally { setBusy(null); }
  };

  const handleApprove = async () => {
    if (!approveAmount) return;
    const base = toBaseUnits(approveAmount);
    if (base === '0') { toast.error('Enter a valid amount'); return; }
    setBusy('approve');
    try {
      await tokenActions.approve(VAULT_ID, base);
      toast.success(`Approved ${approveAmount} GROW for vault`);
      setApproveAmount('');
      setTimeout(loadBalances, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Approve failed');
    } finally { setBusy(null); }
  };

  const handleDeposit = async () => {
    if (!depositAmount) return;
    const base = toBaseUnits(depositAmount);
    if (base === '0') { toast.error('Enter a valid amount'); return; }
    setBusy('deposit');
    try {
      await vaultActions.depositTokens(GROW_TOKEN_ID, base);
      toast.success(`Deposited ${depositAmount} GROW to vault`);
      setDepositAmount('');
      setTimeout(loadBalances, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Deposit failed');
    } finally { setBusy(null); }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) return;
    const base = toBaseUnits(withdrawAmount);
    if (base === '0') { toast.error('Enter a valid amount'); return; }
    setBusy('withdraw');
    try {
      await vaultActions.withdrawTokens(GROW_TOKEN_ID, base);
      toast.success(`Withdrew ${withdrawAmount} GROW from vault`);
      setWithdrawAmount('');
      setTimeout(loadBalances, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Withdraw failed');
    } finally { setBusy(null); }
  };

  const handleFaucet = async () => {
    if (!account?.decodedAddress) return;
    setBusy('faucet');
    try {
      await api.growToken.faucet(account.decodedAddress);
      toast.success('Minted 1,000 GROW to your wallet!');
      setTimeout(loadBalances, 5000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Faucet request failed');
    } finally { setBusy(null); }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelistAddr) return;
    try {
      await api.growToken.addToWhitelist(newWhitelistAddr);
      toast.success('Address whitelisted');
      setNewWhitelistAddr('');
      loadAdminData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleRemoveWhitelist = async (addr: string) => {
    try {
      await api.growToken.removeFromWhitelist(addr);
      toast.success('Address removed');
      loadAdminData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleToggleFaucetMode = async () => {
    const newMode = faucetMode === 'public' ? 'whitelist' : 'public';
    try {
      await api.growToken.setFaucetMode(newMode);
      setFaucetMode(newMode);
      toast.success(`Faucet mode: ${newMode}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(GROW_TOKEN_ID);
    toast.success('Token address copied');
  };

  const walletGrow = toGrow(balance);
  const hasTokens = walletGrow > 0;
  const hasAllowance = Number(allowance) > 0;
  const hasVaultDeposit = Number(vaultBalance.available) > 0 || Number(vaultBalance.allocated) > 0;
  const flowStep = hasVaultDeposit ? 4 : hasAllowance ? 3 : hasTokens ? 2 : 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-400" /> GROW Token
          </h1>
          <p className="text-provn-muted text-sm mt-1">
            Stream-enabled token for real-time payments on Vara
          </p>
        </div>
        <button onClick={loadBalances} disabled={loading}
          className="p-2 rounded-lg border border-provn-border hover:bg-provn-surface transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Balance Overview */}
      <div className="bg-provn-surface border border-provn-border rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-transparent px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-lg">GROW</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">VFT</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Testnet</span>
              </div>
              <button onClick={copyAddress}
                className="flex items-center gap-1 text-xs text-provn-muted hover:text-provn-text transition-colors">
                <Copy className="w-3 h-3" />
                <span className="font-mono">{truncAddr(GROW_TOKEN_ID)}</span>
              </button>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-provn-muted uppercase tracking-wider">Total Supply</p>
              <p className="font-mono font-bold text-amber-400">{formatGrowShort(totalSupply)} GROW</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-provn-border/50">
          {[
            { icon: Wallet, label: 'Wallet Balance', value: balance, color: 'text-emerald-400', sub: 'in your wallet' },
            { icon: Shield, label: 'Vault Allowance', value: allowance, color: 'text-blue-400', sub: 'approved to vault' },
            { icon: ArrowUpFromLine, label: 'Vault Available', value: vaultBalance.available, color: 'text-purple-400', sub: 'ready for streams' },
            { icon: Lock, label: 'Vault Locked', value: vaultBalance.allocated, color: 'text-orange-400', sub: 'in active streams' },
          ].map(({ icon: Icon, label, value, color, sub }) => (
            <div key={label} className="bg-provn-surface px-4 py-3.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className="text-[10px] text-provn-muted uppercase tracking-wider">{label}</span>
              </div>
              <p className={`text-lg font-bold font-mono ${color}`}>{formatGrowShort(value)}</p>
              <p className="text-[10px] text-provn-muted">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Tracker */}
      <div className="bg-provn-surface border border-provn-border rounded-xl p-5">
        <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" /> Getting Started
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { step: 1, title: 'Get GROW', desc: 'Mint from faucet', done: hasTokens, tab: 'faucet' as const },
            { step: 2, title: 'Approve', desc: 'Allow vault access', done: hasAllowance, tab: 'approve' as const },
            { step: 3, title: 'Deposit', desc: 'Fund your vault', done: hasVaultDeposit, tab: 'vault' as const },
            { step: 4, title: 'Stream', desc: 'Start streaming', done: false, tab: null },
          ].map(({ step, title, desc, done, tab }) => (
            <button
              key={step}
              onClick={() => tab ? setActiveTab(tab) : undefined}
              className={`text-left rounded-lg p-3 border transition-all ${
                step === flowStep && !done
                  ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                  : done ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-provn-border/50 bg-provn-bg/30'
              } ${tab ? 'hover:border-emerald-500/30 cursor-pointer' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  done ? 'bg-emerald-500 text-white' : step === flowStep ? 'bg-emerald-500/20 text-emerald-400' : 'bg-provn-border/50 text-provn-muted'
                }`}>
                  {done ? <CheckCircle className="w-3 h-3" /> : step}
                </span>
                <span className={`text-xs font-medium ${done ? 'text-emerald-400' : ''}`}>{title}</span>
              </div>
              <p className="text-[11px] text-provn-muted pl-7">{desc}</p>
              {step === 4 && (
                <Link href="/app/streams" className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 pl-7 hover:underline">
                  Go to Streams <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Actions Panel */}
      <div className="bg-provn-surface border border-provn-border rounded-xl overflow-hidden">
        <div className="flex border-b border-provn-border overflow-x-auto">
          {[
            { id: 'faucet' as const, label: 'Faucet', icon: Coins },
            { id: 'approve' as const, label: 'Approve', icon: CheckCircle },
            { id: 'vault' as const, label: 'Vault', icon: ArrowUpFromLine },
            { id: 'transfer' as const, label: 'Transfer', icon: ArrowRightLeft },
            ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin', icon: Settings }] : []),
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === id
                  ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5'
                  : 'text-provn-muted border-transparent hover:text-provn-text hover:bg-provn-bg/30'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'faucet' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Testnet Faucet</h3>
                <p className="text-sm text-provn-muted">
                  Get free GROW tokens on Vara testnet to try streaming. Each click mints 1,000 GROW.
                </p>
              </div>
              <div className="bg-provn-bg/50 rounded-lg p-4 border border-provn-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-provn-muted">Your wallet balance</span>
                  <span className="font-mono font-bold text-emerald-400">{formatGrow(balance)}</span>
                </div>
                <button onClick={handleFaucet} disabled={busy === 'faucet' || !account}
                  className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium transition-colors flex items-center justify-center gap-2">
                  {busy === 'faucet' ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Minting...</>
                  ) : (
                    <><Coins className="w-4 h-4" /> Mint 1,000 GROW</>
                  )}
                </button>
              </div>
              {!account && (
                <p className="text-xs text-amber-400">Connect your Vara wallet first.</p>
              )}
              {faucetMode === 'whitelist' && (
                <p className="text-xs text-amber-400/80 bg-amber-500/5 rounded-lg px-3 py-2 border border-amber-500/10">
                  Faucet is in whitelist mode. Only whitelisted addresses can mint.
                </p>
              )}
            </div>
          )}

          {activeTab === 'approve' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Approve Vault</h3>
                <p className="text-sm text-provn-muted">
                  Allow the vault contract to move GROW from your wallet. Required before depositing.
                </p>
              </div>
              <div className="bg-provn-bg/50 rounded-lg p-4 border border-provn-border/50 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-provn-muted">Current allowance</span>
                  <span className="font-mono text-blue-400">{formatGrow(allowance)}</span>
                </div>
                <div>
                  <label className="block text-xs text-provn-muted mb-1.5">Amount (GROW)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input value={approveAmount} onChange={e => setApproveAmount(e.target.value)}
                        type="number" step="any" min="0" placeholder="e.g. 1000"
                        className="w-full px-3 py-2.5 pr-16 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-blue-500/50 focus:outline-none" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-provn-muted">GROW</span>
                    </div>
                    <button onClick={handleApprove} disabled={busy === 'approve' || !approveAmount}
                      className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                      {busy === 'approve' ? 'Signing...' : 'Approve'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[
                    { label: '1,000', val: '1000' },
                    { label: '10,000', val: '10000' },
                    { label: '100,000', val: '100000' },
                    { label: 'Max (wallet)', val: String(toGrow(balance)) },
                  ].map(({ label, val }) => (
                    <button key={label} onClick={() => setApproveAmount(val)}
                      className="px-2.5 py-1 rounded-md text-[11px] border border-provn-border/50 text-provn-muted hover:text-blue-400 hover:border-blue-500/30 transition-colors">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Vault Deposit & Withdraw</h3>
                <p className="text-sm text-provn-muted">
                  Deposit GROW into the vault to fund streams. Withdraw available (unallocated) GROW anytime.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-provn-bg/50 rounded-lg p-4 border border-provn-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-1.5">
                      <ArrowUpFromLine className="w-3.5 h-3.5 text-emerald-400" /> Deposit
                    </h4>
                    <span className="text-[11px] text-provn-muted">Wallet: {formatGrowShort(balance)} GROW</span>
                  </div>
                  <div>
                    <div className="relative">
                      <input value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                        type="number" step="any" min="0" placeholder="e.g. 500"
                        className="w-full px-3 py-2.5 pr-16 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-emerald-500/50 focus:outline-none" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-provn-muted">GROW</span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {['100', '500', '1000'].map(v => (
                        <button key={v} onClick={() => setDepositAmount(v)}
                          className="px-2 py-0.5 rounded text-[11px] border border-provn-border/50 text-provn-muted hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
                          {v}
                        </button>
                      ))}
                      <button onClick={() => setDepositAmount(String(toGrow(balance)))}
                        className="px-2 py-0.5 rounded text-[11px] border border-provn-border/50 text-provn-muted hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
                        Max
                      </button>
                    </div>
                  </div>
                  <button onClick={handleDeposit} disabled={busy === 'deposit' || !depositAmount}
                    className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                    {busy === 'deposit' ? 'Signing...' : 'Deposit to Vault'}
                  </button>
                </div>

                <div className="bg-provn-bg/50 rounded-lg p-4 border border-provn-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-1.5">
                      <ArrowDownToLine className="w-3.5 h-3.5 text-amber-400" /> Withdraw
                    </h4>
                    <span className="text-[11px] text-provn-muted">Available: {formatGrowShort(vaultBalance.available)} GROW</span>
                  </div>
                  <div>
                    <div className="relative">
                      <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                        type="number" step="any" min="0" placeholder="e.g. 250"
                        className="w-full px-3 py-2.5 pr-16 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-amber-500/50 focus:outline-none" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-provn-muted">GROW</span>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {['100', '250', '500'].map(v => (
                        <button key={v} onClick={() => setWithdrawAmount(v)}
                          className="px-2 py-0.5 rounded text-[11px] border border-provn-border/50 text-provn-muted hover:text-amber-400 hover:border-amber-500/30 transition-colors">
                          {v}
                        </button>
                      ))}
                      <button onClick={() => setWithdrawAmount(String(toGrow(vaultBalance.available)))}
                        className="px-2 py-0.5 rounded text-[11px] border border-provn-border/50 text-provn-muted hover:text-amber-400 hover:border-amber-500/30 transition-colors">
                        Max
                      </button>
                    </div>
                  </div>
                  <button onClick={handleWithdraw} disabled={busy === 'withdraw' || !withdrawAmount}
                    className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                    {busy === 'withdraw' ? 'Signing...' : 'Withdraw from Vault'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Transfer GROW</h3>
                <p className="text-sm text-provn-muted">
                  Send GROW directly from your wallet to another address. For continuous payments, use Streams instead.
                </p>
              </div>
              <div className="bg-provn-bg/50 rounded-lg p-4 border border-provn-border/50 space-y-3">
                <div>
                  <label className="block text-xs text-provn-muted mb-1.5">Recipient</label>
                  <input value={transferTo} onChange={e => setTransferTo(e.target.value)}
                    placeholder="kGk... or 0x..."
                    className="w-full px-3 py-2.5 bg-provn-bg border border-provn-border rounded-lg text-sm font-mono focus:border-purple-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-provn-muted mb-1.5">Amount (GROW)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input value={transferAmount} onChange={e => setTransferAmount(e.target.value)}
                        type="number" step="any" min="0" placeholder="e.g. 100"
                        className="w-full px-3 py-2.5 pr-16 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-purple-500/50 focus:outline-none" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-provn-muted">GROW</span>
                    </div>
                    <button onClick={handleTransfer} disabled={busy === 'transfer' || !transferTo || !transferAmount}
                      className="px-5 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                      {busy === 'transfer' ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" /> Admin Panel
                </h3>
                <p className="text-sm text-provn-muted">
                  Manage faucet access and whitelist. Only visible to the token admin.
                </p>
              </div>

              <div className="bg-provn-bg/50 rounded-lg p-4 border border-provn-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Faucet Mode</h4>
                    <p className="text-xs text-provn-muted mt-0.5">
                      {faucetMode === 'public'
                        ? 'Anyone can mint from the faucet (rate limited)'
                        : 'Only whitelisted addresses can mint'}
                    </p>
                  </div>
                  <button onClick={handleToggleFaucetMode}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors border ${
                      faucetMode === 'public'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                    {faucetMode === 'public' ? 'Public' : 'Whitelist Only'}
                  </button>
                </div>
              </div>

              <div className="bg-provn-bg/50 rounded-lg p-4 border border-provn-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Whitelist ({whitelist.length} addresses)</h4>
                  <button onClick={loadAdminData} className="text-xs text-provn-muted hover:text-provn-text transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input value={newWhitelistAddr} onChange={e => setNewWhitelistAddr(e.target.value)}
                    placeholder="0x... address to whitelist"
                    className="flex-1 px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm font-mono focus:border-amber-500/50 focus:outline-none" />
                  <button onClick={handleAddWhitelist} disabled={!newWhitelistAddr}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {whitelist.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {whitelist.map(addr => (
                      <div key={addr} className="flex items-center justify-between bg-provn-bg rounded-lg px-3 py-2">
                        <span className="font-mono text-xs text-provn-muted truncate flex-1 mr-2">{addr}</span>
                        <button onClick={() => handleRemoveWhitelist(addr)}
                          className="p-1 rounded hover:bg-red-500/10 text-provn-muted hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-provn-muted text-center py-2">No addresses whitelisted yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Token Info */}
      <div className="bg-provn-surface border border-provn-border rounded-xl p-5">
        <h3 className="font-semibold mb-3 text-sm">Token Info</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          {[
            ['Standard', 'VFT (Vara Fungible Token)'],
            ['Decimals', String(DECIMALS)],
            ['Network', 'Vara Testnet'],
            ['Total Supply', formatGrow(totalSupply)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-provn-border/20">
              <span className="text-provn-muted">{k}</span>
              <span className="font-mono text-provn-text">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {hasVaultDeposit && (
        <Link href="/app/streams"
          className="flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5 hover:border-emerald-500/40 transition-colors group">
          <div className="flex items-center gap-3">
            <Waves className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="font-semibold text-sm">Ready to stream!</p>
              <p className="text-xs text-provn-muted">You have {formatGrow(vaultBalance.available)} in the vault. Create a per-second stream.</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}
