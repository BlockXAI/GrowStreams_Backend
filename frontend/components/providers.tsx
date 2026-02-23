'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';

const VaraProviders = dynamic(
  () => import('@/contexts/VaraContext').then((mod) => mod.VaraProviders),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex items-center justify-center min-h-screen bg-provn-bg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-provn-muted">Connecting to Vara...</p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <VaraProviders>
        {children}
        <Toaster position="top-right" richColors />
      </VaraProviders>
    </QueryClientProvider>
  );
} 