'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount, WALLET_STATUS } from '@gear-js/react-hooks';
import { web3Enable } from '@polkadot/extension-dapp';
import { Wallet, Waves } from 'lucide-react';

export default function WalletConnect() {
  const { wallets, isAnyWallet, login } = useAccount();
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isExtensionInjected, setIsExtensionInjected] = useState<boolean | null>(null);

  const { injectedWallets, connectedWallets, accounts } = useMemo(() => {
    const list = wallets ? Object.values(wallets) : [];
    const injected = list.filter((w) => w.status === WALLET_STATUS.INJECTED);
    const connected = list.filter((w) => w.status === WALLET_STATUS.CONNECTED);
    const accs = connected.flatMap((w) => w.accounts || []);

    return { injectedWallets: injected, connectedWallets: connected, accounts: accs };
  }, [wallets]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as { injectedWeb3?: Record<string, unknown> };
    const injected = !!win.injectedWeb3 && Object.keys(win.injectedWeb3).length > 0;
    setIsExtensionInjected(injected);
  }, []);

  const connectAll = async () => {
    setConnectError(null);
    try {
      await Promise.all(injectedWallets.map((w) => w.connect()));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to connect wallet extension';
      setConnectError(msg);
    }
  };

  const requestAccess = async () => {
    setConnectError(null);
    try {
      await web3Enable('GrowStreams');
      window.location.reload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to enable wallet extension';
      setConnectError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-provn-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-provn-text mb-2">GrowStreams</h1>
          <p className="text-provn-muted text-sm">
            Connect your Vara wallet to start streaming tokens
          </p>
        </div>

        <div className="bg-provn-surface border border-provn-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-provn-text mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            Select Account
          </h2>

          {accounts.length > 0 ? (
            <div className="space-y-2">
              {accounts.map((acc) => (
                <button
                  key={acc.address}
                  onClick={() => login(acc)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-provn-bg/50 border border-provn-border hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                    <span className="text-xs font-bold text-emerald-400">
                      {(acc.meta.name || 'A')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-provn-text truncate">
                      {acc.meta.name || 'Account'}
                    </p>
                    <p className="text-xs font-mono text-provn-muted truncate">
                      {acc.address}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    Connect →
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              {!wallets ? (
                <p className="text-provn-muted text-sm">Detecting wallet extensions…</p>
              ) : !isAnyWallet && isExtensionInjected ? (
                <>
                  <p className="text-provn-muted text-sm mb-4">
                    Wallet extension detected, but access has not been granted yet.
                  </p>

                  {connectError && (
                    <p className="text-red-400 text-xs mb-3 break-words">{connectError}</p>
                  )}

                  <button
                    onClick={requestAccess}
                    className="w-full mb-3 py-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:border-emerald-500/60 text-sm text-provn-text transition-colors"
                  >
                    Request Access / Retry
                  </button>

                  <div className="text-xs text-provn-muted leading-relaxed">
                    Approve the prompt in your wallet extension, then the page will refresh.
                  </div>
                </>
              ) : !isAnyWallet ? (
                <>
                  <p className="text-provn-muted text-sm mb-4">
                    No Vara wallets detected. Install one of these extensions:
                  </p>
                  <div className="space-y-2">
                    <a
                      href="https://www.subwallet.app/download.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2.5 px-4 rounded-xl bg-provn-bg/50 border border-provn-border hover:border-emerald-500/40 text-sm text-provn-text transition-colors"
                    >
                      SubWallet
                    </a>
                    <a
                      href="https://polkadot.js.org/extension/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2.5 px-4 rounded-xl bg-provn-bg/50 border border-provn-border hover:border-emerald-500/40 text-sm text-provn-text transition-colors"
                    >
                      Polkadot.js Extension
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-provn-muted text-sm mb-4">
                    Wallet extension detected, but no accounts available yet.
                  </p>

                  {connectError && (
                    <p className="text-red-400 text-xs mb-3 break-words">{connectError}</p>
                  )}

                  {injectedWallets.length > 0 && (
                    <button
                      onClick={connectAll}
                      className="w-full mb-3 py-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:border-emerald-500/60 text-sm text-provn-text transition-colors"
                    >
                      Request Access / Retry
                    </button>
                  )}

                  <div className="space-y-2 text-left">
                    {connectedWallets.length > 0 && (
                      <div className="text-xs text-provn-muted">
                        Connected: {connectedWallets.map((w) => w.id).join(', ')}
                      </div>
                    )}
                    {injectedWallets.length > 0 && (
                      <div className="text-xs text-provn-muted">
                        Detected: {injectedWallets.map((w) => w.id).join(', ')}
                      </div>
                    )}
                    <div className="text-xs text-provn-muted leading-relaxed">
                      Make sure the extension has at least 1 account and that you approved access for this site.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-provn-muted mt-4">
          Connected to Vara Testnet
        </p>
      </div>
    </div>
  );
}
