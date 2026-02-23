'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to campaign page
    router.push('/campaign');
  }, [router]);

  return (
    <div className="min-h-screen bg-provn-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-provn-accent mx-auto mb-4"></div>
        <p className="text-provn-muted">Redirecting to challenge...</p>
      </div>
    </div>
  );
}
