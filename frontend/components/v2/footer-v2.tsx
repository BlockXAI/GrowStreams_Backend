"use client"

import Link from "next/link"
import Image from "next/image"
import { Github, Twitter, ArrowUpRight, Mail, MessageCircle, Shield, Zap } from "lucide-react"
import { MagnetButton } from "@/components/v2/magnet-button"

const footerLinks: Record<string, { label: string; href: string; external?: boolean }[]> = {
  Protocol: [
    { label: "How It Works", href: "/protocol" },
    { label: "Security", href: "/protocol#security" },
    { label: "Supported Tokens", href: "/protocol#tokens" },
  ],
  "Use Cases": [
    { label: "Streaming Payroll", href: "/use-cases#streaming-payroll" },
    { label: "Bounties & Gigs", href: "/use-cases#bounties-&-gigs" },
    { label: "Subscriptions", href: "/use-cases#subscriptions" },
    { label: "Revenue Share", href: "/use-cases#revenue-share" },
    { label: "Vesting", href: "/use-cases#vesting-streams" },
  ],
  Developers: [
    { label: "Documentation", href: "/developers" },
    { label: "SDK Reference", href: "/developers#sdk" },
    { label: "Contract Addresses", href: "/developers#contracts" },
    { label: "Quickstart", href: "/developers#quickstart" },
  ],
  Community: [
    { label: "Twitter / X", href: "https://twitter.com/growstreams", external: true },
    { label: "GitHub", href: "https://github.com/growstreams", external: true },
    { label: "Telegram", href: "https://t.me/growstreams", external: true },
    { label: "Contact Us", href: "mailto:hello@growstreams.io", external: true },
  ],
}

export function FooterV2() {
  return (
    <footer className="relative border-t border-provn-border/50 bg-provn-bg">
      {/* Trust strip */}
      <div className="border-b border-provn-border/30 bg-provn-surface/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Zap, label: "Built on Vara", desc: "Substrate-based, Wasm-native" },
              { icon: Shield, label: "Audit-Ready", desc: "Threat model + comprehensive tests" },
              { icon: Github, label: "Open Source", desc: "Contracts & SDK on GitHub" },
              { icon: MessageCircle, label: "Pilot Slots Open", desc: "3 integration slots for builders" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-provn-bg/40 border border-provn-border/20">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-300">{item.label}</div>
                  <div className="text-[11px] text-provn-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Image src="/logo.png" alt="GrowStreams" width={140} height={32} className="h-8 w-auto mb-4" />
            <p className="text-sm text-gray-400 leading-relaxed">
              The money streaming protocol on Vara. Stream tokens by the second.
            </p>
            <div className="flex gap-3 mt-4">
              <MagnetButton strength={0.2} radius={100}>
                <a
                  href="https://twitter.com/growstreams"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-provn-surface hover:bg-provn-surface-2 text-provn-muted hover:text-provn-text transition-colors block"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </MagnetButton>
              <MagnetButton strength={0.2} radius={100}>
                <a
                  href="https://github.com/growstreams"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-provn-surface hover:bg-provn-surface-2 text-provn-muted hover:text-provn-text transition-colors block"
                >
                  <Github className="w-4 h-4" />
                </a>
              </MagnetButton>
              <MagnetButton strength={0.2} radius={100}>
                <a
                  href="mailto:hello@growstreams.io"
                  className="p-2.5 rounded-lg bg-provn-surface hover:bg-provn-surface-2 text-provn-muted hover:text-provn-text transition-colors block"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </MagnetButton>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-provn-text mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-provn-muted hover:text-provn-text transition-colors"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-provn-muted hover:text-provn-text transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-provn-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            <p className="text-xs text-provn-muted">
              &copy; {new Date().getFullYear()} GrowStreams. Built on Vara Network.
            </p>
            <div className="flex items-center gap-4 text-xs text-provn-muted">
              <Link href="/protocol#security" className="hover:text-provn-text transition-colors">Security</Link>
              <span className="text-provn-border">·</span>
              <a href="mailto:hello@growstreams.io" className="hover:text-provn-text transition-colors">Contact</a>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-provn-muted">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  )
}
