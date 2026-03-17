'use client';

import { useAccount } from '@gear-js/react-hooks';
import AppLayout from '@/components/app-layout';
import WalletConnect from '@/components/wallet-connect';

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  const { account } = useAccount();

  if (!account) {
    return <WalletConnect />;
  }

  return <AppLayout>{children}</AppLayout>;
}
