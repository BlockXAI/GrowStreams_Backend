'use client';

import ComingSoon from '@/components/coming-soon';
import { GitFork } from 'lucide-react';

export default function SplitsPage() {
  return (
    <ComingSoon
      title="Revenue Splits"
      description="Automatically distribute incoming tokens across multiple recipients with configurable shares. Perfect for DAOs, teams, and revenue sharing."
      icon={GitFork}
    />
  );
}
