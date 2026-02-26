'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAccount, useApi } from '@gear-js/react-hooks';
import { Wallet as GearWallet } from '@gear-js/wallet-connect';
import {
  LayoutDashboard, Waves, Vault, GitFork, Shield,
  Trophy, Fingerprint, Wallet, LogOut, Menu, X, Coins,
} from 'lucide-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const PixelBlast = dynamic(() => import('@/components/ui/PixelBlast'), { ssr: false });

const navItems = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/streams', label: 'Streams', icon: Waves },
  { href: '/app/grow', label: 'GROW Token', icon: Coins },
  { href: '/app/vault', label: 'Vault', icon: Vault },
  { href: '/app/splits', label: 'Splits', icon: GitFork, soon: true },
  { href: '/app/bounties', label: 'Bounties', icon: Trophy, soon: true },
  { href: '/app/identity', label: 'Identity', icon: Fingerprint, soon: true },
  { href: '/app/permissions', label: 'Permissions', icon: Shield, soon: true },
];

function shortenAddress(addr: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { account, logout } = useAccount();
  const { isApiReady } = useApi();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-provn-bg text-provn-text overflow-hidden relative">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#10b981"
          patternScale={2}
          patternDensity={1}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          speed={0.3}
          edgeFade={0.25}
          transparent
          globalMouseTracking
        />
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-provn-surface/95 backdrop-blur-sm border-r border-provn-border flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-provn-border">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="GrowStreams"
              width={130}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, soon }) => {
            const active = pathname === href || (href !== '/app' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : soon
                    ? 'text-provn-muted/50 hover:text-provn-muted hover:bg-provn-border/20'
                    : 'text-provn-muted hover:text-provn-text hover:bg-provn-border/30'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${soon ? 'opacity-50' : ''}`} />
                <span className="flex-1">{label}</span>
                {soon && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-provn-border/40 text-provn-muted/70">Soon</span>
                )}
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
        <header className="h-14 border-b border-provn-border flex items-center px-4 lg:px-6 bg-provn-surface/80 backdrop-blur-sm flex-shrink-0 relative z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-provn-border/30"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {isApiReady && <GearWallet theme="vara" displayBalance />}
            <div className="flex items-center gap-2 text-xs text-provn-muted">
              <span className="hidden sm:inline">Vara Testnet</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
