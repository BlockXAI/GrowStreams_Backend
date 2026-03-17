'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Coins, Waves, Vault } from 'lucide-react';
import Link from 'next/link';

const quickLinks = [
  { title: 'GROW Token', desc: 'Mint & manage tokens', href: '/app/grow', icon: Coins, color: 'text-emerald-400' },
  { title: 'Streams', desc: 'Create per-second streams', href: '/app/streams', icon: Waves, color: 'text-blue-400' },
  { title: 'Vault', desc: 'Deposit & withdraw', href: '/app/vault', icon: Vault, color: 'text-purple-400' },
];

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
    <div className="max-w-3xl mx-auto w-full">
      <div className="mb-12 sm:mb-16">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-sm font-medium text-amber-400">Coming Soon</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-4 mb-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-provn-border/20 flex items-center justify-center">
            <Icon className="w-7 h-7 text-provn-muted" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-provn-muted text-sm sm:text-base leading-relaxed max-w-lg"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6"
        >
          <Link href="/app"
            className="inline-flex px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors">
            Back to Dashboard
          </Link>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-xs text-provn-muted uppercase tracking-wider mb-4"
      >
        Explore what's live
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickLinks.map((link, i) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
          >
            <Link href={link.href}
              className="group block bg-provn-surface border border-provn-border rounded-2xl p-5 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-center w-full h-24 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-provn-bg/50 flex items-center justify-center">
                  <link.icon className={`w-8 h-8 ${link.color}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{link.title}</span>
                  <p className="text-[10px] text-provn-muted mt-0.5">{link.desc}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-provn-bg flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
