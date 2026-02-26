'use client';

import ComingSoon from '@/components/coming-soon';
import { Trophy } from 'lucide-react';

export default function BountiesPage() {
  return (
    <ComingSoon
      title="Bounty Streams"
      description="Fund milestone-based tasks with conditional token releases. AI-scored bounties with automated streaming payments."
      icon={Trophy}
    />
  );
}
