'use client';

import { Wallet } from '@gear-js/wallet-connect';
import { useApi } from '@gear-js/react-hooks';
import { Waves, Smartphone, Monitor, ExternalLink, ChevronRight, Download, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const DAPP_URL = 'https://growstreams.xyz/app';

const WALLETS = [
  {
    name: 'SubWallet',
    description: 'Full-featured Polkadot & Vara wallet',
    icon: '/wallets/subwallet.svg',
    fallbackEmoji: '🔵',
    deepLink: `subwallet://browser?url=${encodeURIComponent(DAPP_URL)}`,
    downloadIOS: 'https://apps.apple.com/app/subwallet-polkadot-wallet/id1633050285',
    downloadAndroid: 'https://play.google.com/store/apps/details?id=app.subwallet.mobile',
    color: 'from-[#004BFF] to-[#0066FF]',
  },
  {
    name: 'Nova Wallet',
    description: 'Leading Polkadot mobile wallet',
    icon: '/wallets/nova.svg',
    fallbackEmoji: '🟣',
    deepLink: `novawallet://open?url=${encodeURIComponent(DAPP_URL)}`,
    downloadIOS: 'https://apps.apple.com/app/nova-polkadot-kusama-wallet/id1597119355',
    downloadAndroid: 'https://play.google.com/store/apps/details?id=io.novafoundation.nova.market',
    color: 'from-[#7B3FE4] to-[#A855F7]',
  },
];

function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isInWalletBrowser() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('subwallet') || ua.includes('nova');
}

function getOS() {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'unknown';
}

export default function WalletConnect() {
  const { isApiReady } = useApi();
  const [isMobile, setIsMobile] = useState(false);
  const [inWallet, setInWallet] = useState(false);
  const [os, setOS] = useState<'ios' | 'android' | 'unknown'>('unknown');
  const [showDesktop, setShowDesktop] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setInWallet(isInWalletBrowser());
    setOS(getOS() as 'ios' | 'android' | 'unknown');
  }, []);

  // If user is in a wallet browser (SubWallet/Nova in-app), show the standard connect
  if (inWallet) {
    return (
      <div className="min-h-screen bg-provn-bg flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Waves className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-provn-text mb-1">GrowStreams</h1>
            <p className="text-provn-muted text-sm">
              Tap below to connect your wallet
            </p>
          </div>
          <div className="flex justify-center">
            {isApiReady ? (
              <Wallet theme="vara" displayBalance />
            ) : (
              <div className="flex items-center gap-2 text-provn-muted text-sm">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                Connecting to Vara...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile browser (not inside wallet app)
  if (isMobile && !showDesktop) {
    return (
      <div className="min-h-[100dvh] bg-provn-bg flex flex-col p-5 safe-area-inset">
        {/* Header */}
        <div className="text-center pt-8 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-provn-text mb-1">GrowStreams</h1>
          <p className="text-provn-muted text-sm">
            Real-time token streaming on Vara
          </p>
        </div>

        {/* Wallet options */}
        <div className="flex-1 space-y-3">
          <p className="text-xs font-medium text-provn-muted uppercase tracking-wider px-1 mb-3">
            Open in Wallet App
          </p>

          {WALLETS.map((wallet) => (
            <a
              key={wallet.name}
              href={wallet.deepLink}
              className="flex items-center gap-4 p-4 rounded-xl bg-provn-surface border border-provn-border/50 hover:border-emerald-500/30 active:scale-[0.98] transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${wallet.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                <span className="text-2xl">{wallet.fallbackEmoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-provn-text">{wallet.name}</h3>
                <p className="text-xs text-provn-muted mt-0.5">{wallet.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-provn-muted flex-shrink-0" />
            </a>
          ))}

          {/* Download section */}
          <div className="pt-4">
            <p className="text-xs font-medium text-provn-muted uppercase tracking-wider px-1 mb-3">
              Don&apos;t have a wallet?
            </p>

            {WALLETS.map((wallet) => {
              const downloadLink = os === 'ios' ? wallet.downloadIOS : wallet.downloadAndroid;
              const storeName = os === 'ios' ? 'App Store' : 'Play Store';
              return (
                <a
                  key={`dl-${wallet.name}`}
                  href={downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-provn-surface/50 transition-colors mb-1"
                >
                  <Download className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-provn-text">
                    Get <span className="font-medium">{wallet.name}</span>
                  </span>
                  <span className="text-xs text-provn-muted ml-auto">{storeName}</span>
                  <ExternalLink className="w-3 h-3 text-provn-muted flex-shrink-0" />
                </a>
              );
            })}
          </div>

          {/* How it works */}
          <div className="pt-4 pb-2">
            <div className="bg-provn-surface/50 rounded-xl p-4 border border-provn-border/30">
              <p className="text-xs font-medium text-provn-muted uppercase tracking-wider mb-3">
                How it works
              </p>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Download SubWallet or Nova Wallet' },
                  { step: '2', text: 'Create a wallet & back up your seed phrase' },
                  { step: '3', text: 'Tap a wallet above to open GrowStreams' },
                  { step: '4', text: 'Connect & start streaming tokens' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-400">{item.step}</span>
                    </div>
                    <p className="text-sm text-provn-text/80 pt-0.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 pb-2 space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-provn-muted">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Vara Testnet
          </div>
          <button
            onClick={() => setShowDesktop(true)}
            className="w-full text-center text-xs text-provn-muted/60 hover:text-provn-muted py-2 transition-colors"
          >
            Use desktop wallet extensions instead
          </button>
        </div>
      </div>
    );
  }

  // Desktop / fallback view
  return (
    <div className="min-h-screen bg-provn-bg flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-provn-text mb-2">GrowStreams</h1>
          <p className="text-provn-muted text-sm">
            Connect your Vara wallet to start streaming tokens
          </p>
        </div>

        <div className="flex justify-center">
          {isApiReady ? (
            <Wallet theme="vara" displayBalance />
          ) : (
            <div className="flex items-center gap-2 text-provn-muted text-sm">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              Connecting to Vara network...
            </div>
          )}
        </div>

        {isMobile && showDesktop && (
          <button
            onClick={() => setShowDesktop(false)}
            className="w-full text-center text-xs text-emerald-400 hover:text-emerald-300 mt-6 py-2 transition-colors flex items-center justify-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Back to mobile wallet options
          </button>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-provn-muted mt-6">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Connected to Vara Testnet
        </div>
      </div>
    </div>
  );
}
