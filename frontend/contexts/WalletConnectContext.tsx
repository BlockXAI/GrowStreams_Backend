'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAccount, useApi } from '@gear-js/react-hooks';
import { decodeAddress } from '@gear-js/api';
import type { Signer, SignerResult } from '@polkadot/types/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WCState {
  /** Whether a WalletConnect session is active */
  isConnected: boolean;
  /** True while the QR modal is open / waiting for approval */
  isConnecting: boolean;
  /** Start WalletConnect flow (shows QR modal) */
  connect: () => Promise<void>;
  /** Tear down the WC session */
  disconnect: () => Promise<void>;
  /** Error from last attempt, if any */
  error: string | null;
}

const WalletConnectContext = createContext<WCState>({
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: async () => {},
  error: null,
});

export const useWalletConnect = () => useContext(WalletConnectContext);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

const METADATA = {
  name: 'GrowStreams',
  description: 'Real-time money streaming on Vara Network',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://growstreams.xyz',
  icons: ['https://growstreams.xyz/logo.png'],
};

// Vara Testnet genesis hash (first 32 hex chars, no 0x prefix)
// We'll fetch this dynamically from the connected API
const POLKADOT_NAMESPACE = 'polkadot';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function WalletConnectProvider({ children }: { children: ReactNode }) {
  const { login, logout: gearLogout } = useAccount();
  const { api, isApiReady } = useApi();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep references to provider & modal so we can clean up
  const providerRef = useRef<any>(null);
  const modalRef = useRef<any>(null);
  const sessionRef = useRef<any>(null);

  // ------------------------------------------------------------------
  // Get the Vara chain CAIP-13 id from the live API genesis hash
  // ------------------------------------------------------------------
  const getChainId = useCallback(() => {
    if (!api || !isApiReady) return null;
    const genesisHex = api.genesisHash.toHex(); // 0x...
    // CAIP-13: polkadot:<first 32 hex chars of genesis hash without 0x>
    const trimmed = genesisHex.replace('0x', '').slice(0, 32);
    return `${POLKADOT_NAMESPACE}:${trimmed}`;
  }, [api, isApiReady]);

  // ------------------------------------------------------------------
  // Build a Signer that forwards sign requests over WalletConnect
  // ------------------------------------------------------------------
  const buildWCSigner = useCallback(
    (wcProvider: any, chainId: string): Signer => {
      let id = 0;
      return {
        signPayload: async (payload: any): Promise<SignerResult> => {
          const result = await wcProvider.client.request({
            topic: sessionRef.current.topic,
            chainId,
            request: {
              method: 'polkadot_signTransaction',
              params: { address: payload.address, transactionPayload: payload },
            },
          });
          return { id: ++id, signature: result.signature };
        },
        signRaw: async (raw: any): Promise<SignerResult> => {
          const result = await wcProvider.client.request({
            topic: sessionRef.current.topic,
            chainId,
            request: {
              method: 'polkadot_signMessage',
              params: { address: raw.address, message: raw.data },
            },
          });
          return { id: ++id, signature: result.signature };
        },
      };
    },
    [],
  );

  // ------------------------------------------------------------------
  // Connect
  // ------------------------------------------------------------------
  const connect = useCallback(async () => {
    if (!WC_PROJECT_ID) {
      setError('WalletConnect Project ID not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.');
      return;
    }
    if (!isApiReady) {
      setError('Vara API not ready yet. Please wait a moment.');
      return;
    }

    const chainId = getChainId();
    if (!chainId) {
      setError('Could not determine Vara chain ID.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Dynamic imports so we don't bloat the initial bundle
      const { default: UniversalProvider } = await import(
        '@walletconnect/universal-provider'
      );
      const { WalletConnectModal } = await import('@walletconnect/modal');

      // Init provider
      const provider = await UniversalProvider.init({
        projectId: WC_PROJECT_ID,
        relayUrl: 'wss://relay.walletconnect.com',
        metadata: METADATA,
      });
      providerRef.current = provider;

      // Create modal
      const modal = new WalletConnectModal({
        projectId: WC_PROJECT_ID,
        chains: [chainId],
        // Only show wallets that support Polkadot namespace
        enableExplorer: true,
        explorerRecommendedWalletIds: [
          // Nova Wallet
          '43fd1a0aeb175b6a4dc6d7ff1eae375851283db95ef8fa2e2e21cc81fdb69e78',
          // SubWallet
          '9ce87712b99b3eb57396cc8621db8900ac983c712236f48fb70ad28760be3f6a',
        ],
      });
      modalRef.current = modal;

      // Request session
      const { uri, approval } = await provider.client.connect({
        requiredNamespaces: {
          [POLKADOT_NAMESPACE]: {
            methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
            chains: [chainId],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      });

      // Open QR modal
      if (uri) {
        modal.openModal({ uri });
      }

      // Wait for wallet approval
      const session = await approval();
      sessionRef.current = session;
      modal.closeModal();

      // Extract accounts from session
      const wcAccounts = Object.values(session.namespaces)
        .flatMap((ns: any) => ns.accounts || []);

      if (wcAccounts.length === 0) {
        throw new Error('No accounts returned from wallet.');
      }

      // Parse CAIP-10 account string: polkadot:<chain>:<address>
      const address = wcAccounts[0].split(':')[2];
      if (!address) {
        throw new Error('Invalid account format from WalletConnect.');
      }

      // Build a signer that routes signing through WC
      const signer = buildWCSigner(provider, chainId);

      // Decode to hex for Gear.js compatibility
      const decodedAddress = decodeAddress(address);

      // Login to Gear.js account system
      login({
        address,
        meta: { name: 'WalletConnect', source: 'walletconnect' },
        type: 'sr25519',
        decodedAddress,
        signer,
      } as any);

      setIsConnected(true);
      setIsConnecting(false);

      // Handle session disconnect from wallet side
      provider.on('session_delete', () => {
        setIsConnected(false);
        sessionRef.current = null;
        gearLogout();
      });
    } catch (err: any) {
      // User rejected or closed modal
      if (modalRef.current) {
        try { modalRef.current.closeModal(); } catch {}
      }
      const msg = err?.message || 'WalletConnect connection failed';
      if (!msg.includes('User rejected') && !msg.includes('dismissed')) {
        setError(msg);
      }
      setIsConnecting(false);
    }
  }, [isApiReady, getChainId, buildWCSigner, login, gearLogout]);

  // ------------------------------------------------------------------
  // Disconnect
  // ------------------------------------------------------------------
  const disconnect = useCallback(async () => {
    try {
      if (providerRef.current && sessionRef.current) {
        await providerRef.current.client.disconnect({
          topic: sessionRef.current.topic,
          reason: { code: 6000, message: 'User disconnected' },
        });
      }
    } catch {
      // ignore disconnect errors
    }
    providerRef.current = null;
    sessionRef.current = null;
    setIsConnected(false);
    gearLogout();
  }, [gearLogout]);

  return (
    <WalletConnectContext.Provider
      value={{ isConnected, isConnecting, connect, disconnect, error }}
    >
      {children}
    </WalletConnectContext.Provider>
  );
}
