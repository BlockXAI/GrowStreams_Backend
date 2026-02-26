'use client';

import { Clock } from 'lucide-react';
import Link from 'next/link';

export default function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-provn-border/30 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-provn-muted" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-provn-muted text-sm mb-6 max-w-sm leading-relaxed">{description}</p>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
        <Clock className="w-3.5 h-3.5" />
        Coming Soon
      </div>
      <Link href="/app" className="mt-8 text-xs text-provn-muted hover:text-emerald-400 transition-colors">
        Back to Dashboard
      </Link>
    </div>
  );
}
