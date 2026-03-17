'use client';

import { Wallet } from '@gear-js/wallet-connect';
import { useAccount, useApi } from '@gear-js/react-hooks';

export function VaraWallet() {
  const { account } = useAccount();
  const { isApiReady } = useApi();

  return (
    <div className="flex items-center gap-3">
      {isApiReady && (
        <div className="flex items-center gap-2">
          <Wallet />
          {account && (
            <div className="text-sm text-provn-muted">
              {account.meta.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
