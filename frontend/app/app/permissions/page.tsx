'use client';

import ComingSoon from '@/components/coming-soon';
import { Shield } from 'lucide-react';

export default function PermissionsPage() {
  return (
    <ComingSoon
      title="Permissions"
      description="Granular on-chain access control for stream operations. Delegate permissions to other accounts with scoped roles."
      icon={Shield}
    />
  );
}
