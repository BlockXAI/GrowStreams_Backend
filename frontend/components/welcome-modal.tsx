'use client';

import { useState, useEffect } from 'react';
import { X, Coins, CheckCircle, ArrowUpFromLine, Waves, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'growstreams_welcome_seen';

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-provn-surface border border-provn-border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-transparent px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Welcome to GrowStreams</h2>
                <p className="text-xs text-provn-muted">Real-time token streaming on Vara</p>
              </div>
            </div>
            <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-provn-border/30 transition-colors">
              <X className="w-4 h-4 text-provn-muted" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-provn-muted leading-relaxed">
            Stream GROW tokens per-second to any address. Here's how to get started in 4 simple steps:
          </p>

          <div className="space-y-2.5">
            {[
              { icon: Coins, step: '1', title: 'Mint GROW Tokens', desc: 'Get free testnet tokens from the faucet', color: 'text-emerald-400 bg-emerald-500/15', href: '/app/grow' },
              { icon: CheckCircle, step: '2', title: 'Approve & Deposit', desc: 'Approve the vault, then deposit GROW', color: 'text-blue-400 bg-blue-500/15', href: '/app/grow' },
              { icon: ArrowUpFromLine, step: '3', title: 'Fund Your Vault', desc: 'Move GROW into the streaming vault', color: 'text-purple-400 bg-purple-500/15', href: '/app/vault' },
              { icon: Waves, step: '4', title: 'Create a Stream', desc: 'Set a receiver, flow rate, and go!', color: 'text-amber-400 bg-amber-500/15', href: '/app/streams' },
            ].map(({ icon: Icon, step, title, desc, color, href }) => (
              <Link key={step} href={href} onClick={dismiss}
                className="flex items-center gap-3 p-3 rounded-lg bg-provn-bg/50 border border-provn-border/50 hover:border-emerald-500/30 transition-colors group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{title}</p>
                  <p className="text-[10px] text-provn-muted">{desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-provn-muted group-hover:text-emerald-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-provn-border/50 flex items-center justify-between">
          <p className="text-[10px] text-provn-muted">Vara Testnet</p>
          <Link href="/app/grow" onClick={dismiss}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors flex items-center gap-2">
            Get Started <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
