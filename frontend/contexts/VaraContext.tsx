'use client';

import {
  ApiProvider as GearApiProvider,
  AlertProvider as GearAlertProvider,
  AccountProvider as GearAccountProvider,
} from '@gear-js/react-hooks';
import type { AlertTemplateProps } from '@gear-js/react-hooks';
import { ReactNode, useEffect, useState } from 'react';
import { decodeAddress } from '@gear-js/api';

const VARA_NODE_ENDPOINT = process.env.NEXT_PUBLIC_VARA_NODE_ADDRESS || 'wss://testnet.vara.network';
const APP_NAME = 'GrowStreams';

/**
 * Patch all injected wallet extensions so their `accounts.get()` method
 * filters out EVM / non-Substrate accounts whose keys cannot be encoded
 * to SS58. Without this, @gear-js/react-hooks crashes with:
 *   "Expected a valid key to convert, with length 1, 2, 4, 8, 32, 33"
 */
function patchInjectedAccounts() {
  const injectedWeb3 = (window as unknown as Record<string, unknown>).injectedWeb3 as
    Record<string, { enable?: (...args: unknown[]) => Promise<Record<string, unknown>> }> | undefined;

  if (!injectedWeb3) return;

  for (const name of Object.keys(injectedWeb3)) {
    const ext = injectedWeb3[name];
    if (!ext?.enable) continue;

    const originalEnable = ext.enable.bind(ext);

    ext.enable = async (...args: unknown[]) => {
      const injected = await originalEnable(...args);

      const accts = injected.accounts as Record<string, unknown> | undefined;

      const isSubstrateAccount = (acc: unknown): boolean => {
        try {
          const { address } = acc as { address: string };
          decodeAddress(address);
          return true;
        } catch {
          return false;
        }
      };

      if (accts && typeof accts.get === 'function') {
        const originalGet = (accts.get as (...a: unknown[]) => Promise<unknown[]>).bind(accts);
        accts.get = async (...a: unknown[]) => {
          const accounts = await originalGet(...a);
          return accounts.filter(isSubstrateAccount);
        };
      }

      if (accts && typeof accts.subscribe === 'function') {
        const originalSubscribe = (accts.subscribe as (cb: (accounts: unknown[]) => void) => unknown).bind(accts);
        accts.subscribe = (cb: (accounts: unknown[]) => void) => {
          return originalSubscribe((accounts: unknown[]) => {
            cb(accounts.filter(isSubstrateAccount));
          });
        };
      }

      return injected;
    };
  }
}

function SimpleAlert({ alert, close }: AlertTemplateProps) {
  const colors: Record<string, string> = {
    error: 'bg-red-500/90 border-red-400',
    success: 'bg-emerald-500/90 border-emerald-400',
    info: 'bg-blue-500/90 border-blue-400',
    loading: 'bg-yellow-500/90 border-yellow-400',
  };

  const type = alert.options.type;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg border text-white text-sm shadow-lg ${colors[type] || colors.info}`}
      onClick={close}
    >
      {alert.content}
    </div>
  );
}

interface VaraProvidersProps {
  children: ReactNode;
}

export function VaraProviders({ children }: VaraProvidersProps) {
  const [patched, setPatched] = useState(false);

  useEffect(() => {
    patchInjectedAccounts();
    setPatched(true);
  }, []);

  return (
    <GearApiProvider initialArgs={{ endpoint: VARA_NODE_ENDPOINT }}>
      <GearAlertProvider template={SimpleAlert} containerClassName="">
        {patched ? (
          <GearAccountProvider appName={APP_NAME}>
            {children}
          </GearAccountProvider>
        ) : (
          children
        )}
      </GearAlertProvider>
    </GearApiProvider>
  );
}
