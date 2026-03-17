'use client';

import {
  ApiProvider as GearApiProvider,
  AlertProvider as GearAlertProvider,
  AccountProvider as GearAccountProvider,
} from '@gear-js/react-hooks';
import type { AlertTemplateProps } from '@gear-js/react-hooks';
import { ReactNode } from 'react';

const VARA_NODE_ENDPOINT = process.env.NEXT_PUBLIC_VARA_NODE_ADDRESS || 'wss://testnet.vara.network';
const APP_NAME = 'GrowStreams';

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
  return (
    <GearApiProvider initialArgs={{ endpoint: VARA_NODE_ENDPOINT }}>
      <GearAlertProvider template={SimpleAlert} containerClassName="">
        <GearAccountProvider appName={APP_NAME}>
          {children}
        </GearAccountProvider>
      </GearAlertProvider>
    </GearApiProvider>
  );
}
