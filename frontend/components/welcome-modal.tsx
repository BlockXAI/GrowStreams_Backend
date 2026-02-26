'use client';

import { useState, useEffect } from 'react';
import { X, Coins, CheckCircle, ArrowUpFromLine, Waves, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const CardSwap = dynamic(() => import('@/components/ui/CardSwap').then(m => m.default), { ssr: false });
const CardItem = dynamic(() => import('@/components/ui/CardSwap').then(m => {
  const C = m.Card;
  return { default: C };
}), { ssr: false });

const STORAGE_KEY = 'growstreams_welcome_seen';

const steps = [
  {
    icon: Coins,
    step: '1',
    title: 'Mint GROW Tokens',
    desc: 'Head to the GROW Token page and tap the faucet to get 1,000 free testnet tokens instantly.',
    color: 'from-emerald-500/20 to-emerald-600/5',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/20',
    href: '/app/grow',
  },
  {
    icon: CheckCircle,
    step: '2',
    title: 'Approve & Deposit',
    desc: 'Approve the TokenVault to spend your GROW, then deposit tokens into your vault escrow balance.',
    color: 'from-blue-500/20 to-blue-600/5',
    accent: 'text-blue-400',
    border: 'border-blue-500/20',
    href: '/app/grow',
  },
  {
    icon: ArrowUpFromLine,
    step: '3',
    title: 'Fund Your Vault',
    desc: 'Your vault holds tokens in escrow. Deposited funds are available for streaming to any address.',
    color: 'from-purple-500/20 to-purple-600/5',
    accent: 'text-purple-400',
    border: 'border-purple-500/20',
    href: '/app/vault',
  },
  {
    icon: Waves,
    step: '4',
    title: 'Create a Stream',
    desc: 'Pick a receiver, set a flow rate (tokens per second), and start streaming. Tokens flow in real-time on-chain.',
    color: 'from-amber-500/20 to-amber-600/5',
    accent: 'text-amber-400',
    border: 'border-amber-500/20',
    href: '/app/streams',
  },
];

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

      <div className="relative bg-provn-surface border border-provn-border rounded-2xl max-w-[720px] w-full shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-transparent px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Welcome to GrowStreams</h2>
                <p className="text-xs text-provn-muted">Real-time per-second token streaming on Vara Network</p>
              </div>
            </div>
            <button onClick={dismiss} className="p-1.5 rounded-lg hover:bg-provn-border/30 transition-colors">
              <X className="w-4 h-4 text-provn-muted" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 px-6 py-6">
          <div className="flex-1 space-y-4">
            <p className="text-sm text-provn-muted leading-relaxed">
              Stream GROW tokens per-second to any address on Vara. Get started in 4 steps:
            </p>

            <div className="space-y-2">
              {steps.map(({ icon: Icon, step, title, desc, accent, border, href }) => (
                <Link
                  key={step}
                  href={href}
                  onClick={dismiss}
                  className={`flex items-start gap-3 p-3 rounded-xl bg-provn-bg/40 border ${border} hover:bg-provn-bg/70 transition-colors group`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-provn-surface flex items-center justify-center flex-shrink-0 ${accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold flex items-center gap-1.5">
                      <span className={`text-[10px] ${accent}`}>Step {step}</span>
                      {title}
                    </p>
                    <p className="text-[10px] text-provn-muted mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 mt-1 text-provn-muted group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center w-[260px] flex-shrink-0">
            <div className="relative" style={{ width: 220, height: 300 }}>
              <CardSwap
                width={180}
                height={220}
                cardDistance={30}
                verticalDistance={40}
                delay={3500}
                pauseOnHover
                skewAmount={3}
                easing="elastic"
              >
                {steps.map(({ icon: Icon, step, title, desc, color, accent }) => (
                  <CardItem key={step}>
                    <div className={`w-full h-full bg-gradient-to-br ${color} p-5 flex flex-col justify-between`}>
                      <div>
                        <div className={`w-10 h-10 rounded-xl bg-provn-surface/80 flex items-center justify-center mb-3 ${accent}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${accent}`}>
                          Step {step}
                        </p>
                        <h3 className="text-sm font-bold text-white">{title}</h3>
                      </div>
                      <p className="text-[10px] text-provn-muted leading-relaxed">{desc}</p>
                    </div>
                  </CardItem>
                ))}
              </CardSwap>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-provn-border/50 flex items-center justify-between">
          <p className="text-[10px] text-provn-muted">Vara Testnet</p>
          <Link
            href="/app/grow"
            onClick={dismiss}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            Get Started <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
