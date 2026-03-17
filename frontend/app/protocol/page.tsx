"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  Shield,
  Layers,
  Zap,
  Lock,
  Database,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Pause,
  Timer,
  Coins,
} from "lucide-react"
import { NavigationV2 } from "@/components/v2/navigation-v2"
import { FooterV2 } from "@/components/v2/footer-v2"
import { GradientText } from "@/components/v2/gradient-text"
import { StreamVisualizer } from "@/components/v2/stream-visualizer"
import { FlowingParticles } from "@/components/v2/flowing-particles"
import { AuroraBackground } from "@/components/v2/aurora-background"
import { ScrollProgress } from "@/components/v2/scroll-progress"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
}

const contractModules = [
  {
    icon: Database,
    name: "StreamCore",
    description: "State + accounting for streams (flowRate, start, lastUpdate). The heart of the protocol.",
    color: "border-emerald-500/30 bg-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Lock,
    name: "TokenVault",
    description: "Deposits, buffers, safe ERC-20 handling, emergency pause. Ensures solvency.",
    color: "border-blue-500/30 bg-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    icon: GitBranch,
    name: "SplitsRouter",
    description: "Weighted routing of incoming funds to N recipients. Revenue sharing made simple.",
    color: "border-purple-500/30 bg-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    icon: Shield,
    name: "PermissionManager",
    description: "Delegates and roles. Allow apps to act on behalf of users securely.",
    color: "border-amber-500/30 bg-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    icon: Layers,
    name: "AppAdapters",
    description: "Small contracts that translate app events into StreamCore calls (e.g., BountyAdapter).",
    color: "border-rose-500/30 bg-rose-500/5",
    iconColor: "text-rose-400",
  },
]

const securityFeatures = [
  {
    icon: Shield,
    title: "Buffer Model",
    description: "Every stream requires a deposit buffer. Streams cannot go negative — ever. If buffer depletes, the stream auto-pauses.",
  },
  {
    icon: AlertTriangle,
    title: "Liquidation Rules",
    description: "Clear, transparent liquidation rules. If a sender's buffer runs out, the stream stops gracefully with no loss to the receiver.",
  },
  {
    icon: Lock,
    title: "Emergency Pause",
    description: "TokenVault includes an emergency pause mechanism. Admin can freeze all operations if a critical issue is detected.",
  },
  {
    icon: CheckCircle2,
    title: "Invariant Checks",
    description: "Explicit on-chain invariants ensure solvency at every state transition. Mathematically verified.",
  },
]

const events = [
  "StreamCreated",
  "StreamUpdated",
  "StreamStopped",
  "FundsWithdrawn",
  "SplitsUpdated",
  "BufferDeposited",
  "LiquidationTriggered",
]

export default function ProtocolPage() {
  return (
    <div className="min-h-screen bg-provn-bg text-provn-text">
      <NavigationV2 currentPage="protocol" />
      <ScrollProgress />

      {/* Hero */}
      <AuroraBackground theme="cyan" className="pt-32 pb-20 relative overflow-hidden">
        <FlowingParticles color="#10b981" particleCount={25} speed={0.5} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-provn-surface border border-provn-border text-xs font-medium text-provn-muted mb-6">
              PROTOCOL
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            How <GradientText>streams</GradientText> work
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-provn-muted max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            A generalized streaming smart-contract system on Vara. Token-agnostic,
            composable, and designed for per-second settlement.
          </motion.p>

          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <StreamVisualizer
              sender="alice.vara"
              receiver="bob.vara"
              token="USDC"
              flowRate="$0.00027/sec"
            />
          </motion.div>
        </div>
      </AuroraBackground>

      {/* Stream Lifecycle */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Stream <GradientText>lifecycle</GradientText>
            </h2>
            <p className="text-lg text-provn-muted max-w-2xl mx-auto">
              From deposit to withdrawal — every step is transparent and on-chain.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent" />

            <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-16 md:gap-y-12">
              {[
                {
                  icon: ArrowDownToLine,
                  title: "1. Deposit & Buffer",
                  description: "Sender deposits tokens into the TokenVault with a required buffer amount. Buffer guarantees the stream won't go negative.",
                  side: "left",
                },
                {
                  icon: Zap,
                  title: "2. Create Stream",
                  description: "Define receiver, token, and flowRate. StreamCore records the stream and starts accounting per-second immediately.",
                  side: "right",
                },
                {
                  icon: Timer,
                  title: "3. Real-time Accrual",
                  description: "Every second, the receiver's withdrawable balance increases by flowRate. No transactions needed — it's computed on-chain.",
                  side: "left",
                },
                {
                  icon: ArrowUpFromLine,
                  title: "4. Withdraw Anytime",
                  description: "Receivers can claim their accrued balance at any time. No lockups, no approval needed, no delays.",
                  side: "right",
                },
                {
                  icon: Pause,
                  title: "5. Update or Stop",
                  description: "Senders can update the flowRate, pause, or stop a stream. Remaining buffer is returned on stop.",
                  side: "left",
                },
                {
                  icon: Coins,
                  title: "6. Liquidation Safety",
                  description: "If buffer depletes, the stream auto-stops. Liquidation bots can trigger cleanup to return remaining funds.",
                  side: "right",
                },
              ].map((step, i) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.title}
                    className={`relative ${step.side === "right" ? "md:col-start-2" : "md:col-start-1"}`}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                  >
                    {/* Connector dot */}
                    <div className="hidden md:block absolute top-6 w-3 h-3 rounded-full bg-emerald-500 border-2 border-provn-bg"
                      style={{ [step.side === "left" ? "right" : "left"]: "-2rem", transform: "translateX(50%)" }}
                    />

                    <div className="p-6 rounded-2xl bg-provn-surface/50 border border-provn-border/50 hover:border-emerald-500/30 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                          <p className="text-sm text-provn-muted leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contract Architecture */}
      <section id="architecture" className="py-24 px-4 sm:px-6 lg:px-8 bg-provn-surface/20 border-y border-provn-border/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Contract <GradientText from="from-blue-400" to="to-purple-400">architecture</GradientText>
            </h2>
            <p className="text-lg text-provn-muted max-w-2xl mx-auto">
              Modular, auditable contracts. Each module has a single responsibility.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractModules.map((mod, i) => {
              const Icon = mod.icon
              return (
                <motion.div
                  key={mod.name}
                  className={`p-6 rounded-2xl border ${mod.color} transition-all duration-300 hover:-translate-y-1`}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <Icon className={`w-8 h-8 ${mod.iconColor} mb-4`} />
                  <h3 className="text-lg font-semibold mb-2 font-mono">{mod.name}</h3>
                  <p className="text-sm text-provn-muted leading-relaxed">{mod.description}</p>
                </motion.div>
              )
            })}
          </div>

          {/* Architecture diagram (simplified) */}
          <motion.div
            className="mt-16 p-8 rounded-2xl bg-provn-bg border border-provn-border/50"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={5}
          >
            <h3 className="text-center text-sm font-medium text-provn-muted uppercase tracking-wider mb-8">
              Module Interaction Flow
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
              {["App / SDK", "AppAdapter", "StreamCore", "TokenVault"].map((mod, i) => (
                <React.Fragment key={mod}>
                  <div className="px-6 py-4 rounded-xl bg-provn-surface border border-provn-border text-sm font-mono font-medium">
                    {mod}
                  </div>
                  {i < 3 && (
                    <ArrowRight className="w-5 h-5 text-emerald-400 hidden md:block" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-400">
                SplitsRouter
              </div>
              <span className="text-provn-muted text-xs">routes funds from</span>
              <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
                StreamCore
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Security <GradientText from="from-amber-400" to="to-red-400">model</GradientText>
            </h2>
            <p className="text-lg text-provn-muted max-w-2xl mx-auto">
              Streams never go negative. Explicit invariants guarantee solvency at every state change.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  className="p-6 rounded-2xl bg-provn-surface/50 border border-provn-border/50 hover:border-amber-500/30 transition-all duration-300"
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-provn-muted leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Supported Tokens */}
      <section id="tokens" className="py-24 px-4 sm:px-6 lg:px-8 bg-provn-surface/20 border-y border-provn-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Supported <GradientText>tokens</GradientText>
            </h2>
            <p className="text-lg text-provn-muted mb-12">
              Start streaming with these tokens. More coming soon.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-6">
            {[
              { name: "USDC", status: "Live", color: "border-blue-500/30" },
              { name: "VARA", status: "Live", color: "border-emerald-500/30" },
              { name: "wETH", status: "Coming Soon", color: "border-provn-border/50" },
              { name: "DAI", status: "Coming Soon", color: "border-provn-border/50" },
            ].map((token, i) => (
              <motion.div
                key={token.name}
                className={`px-8 py-6 rounded-2xl bg-provn-surface border ${token.color} min-w-[140px]`}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className="text-2xl font-bold font-mono mb-1">{token.name}</div>
                <div className={`text-xs font-medium ${token.status === "Live" ? "text-emerald-400" : "text-provn-muted"}`}>
                  {token.status === "Live" && (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {token.status}
                    </span>
                  )}
                  {token.status !== "Live" && token.status}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Events for Indexers */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Events for <GradientText from="from-cyan-400" to="to-blue-400">indexers</GradientText>
            </h2>
            <p className="text-lg text-provn-muted">
              Rich on-chain events power real-time UIs and subgraphs.
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl bg-provn-bg border border-provn-border p-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {events.map((event) => (
                <div
                  key={event}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-provn-surface/50 border border-provn-border/30 font-mono text-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-400">event</span>
                  <span className="text-provn-text">{event}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-provn-surface/20 border-t border-provn-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to build?
            </h2>
            <p className="text-lg text-provn-muted mb-8">
              Check out the developer docs, grab the SDK, and deploy your first stream.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/developers"
                className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 text-base font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                Developer Docs
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/use-cases"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-provn-text border border-provn-border rounded-xl hover:border-provn-muted transition-all"
              >
                Explore Use Cases
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterV2 />
    </div>
  )
}
