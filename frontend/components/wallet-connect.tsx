'use client';

import { Wallet } from '@gear-js/wallet-connect';
import { useApi } from '@gear-js/react-hooks';
import { Waves } from 'lucide-react';

export default function WalletConnect() {
  const { isApiReady } = useApi();

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

        <div className="flex justify-center">
          {isApiReady ? (
            <Wallet theme="vara" displayBalance />
          ) : (
            <p className="text-provn-muted text-sm animate-pulse">
              Connecting to Vara network...
            </p>
          )}
        </div>

        <p className="text-center text-xs text-provn-muted mt-6">
          Connected to Vara Testnet
        </p>
      </div>
    </div>
  );
}
