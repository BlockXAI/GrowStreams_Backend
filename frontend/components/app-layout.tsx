'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from '@gear-js/react-hooks';
import {
  LayoutDashboard, Waves, Vault, GitFork, Shield,
  Trophy, Fingerprint, Wallet, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/streams', label: 'Streams', icon: Waves },
  { href: '/app/vault', label: 'Vault', icon: Vault },
  { href: '/app/splits', label: 'Splits', icon: GitFork },
  { href: '/app/bounties', label: 'Bounties', icon: Trophy },
  { href: '/app/identity', label: 'Identity', icon: Fingerprint },
  { href: '/app/permissions', label: 'Permissions', icon: Shield },
];

function shortenAddress(addr: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { account, logout } = useAccount();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-provn-bg text-provn-text overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-provn-surface border-r border-provn-border flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-provn-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">GrowStreams</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/app' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-provn-muted hover:text-provn-text hover:bg-provn-border/30'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {account && (
          <div className="p-3 border-t border-provn-border">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-provn-bg/50">
              <Wallet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-xs font-mono text-provn-muted truncate">
                {shortenAddress(account.address)}
              </span>
              <button
                onClick={logout}
                className="ml-auto text-provn-muted hover:text-red-400 transition-colors"
                title="Disconnect"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-provn-border flex items-center px-4 lg:px-6 bg-provn-surface/50 backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-provn-border/30"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-xs text-provn-muted">
            <span className="hidden sm:inline">Vara Testnet</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
