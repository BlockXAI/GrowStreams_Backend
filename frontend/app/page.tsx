"use client"

import React, { useRef, useState } from "react"
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Zap,
  Shield,
  Code2,
  Layers,
  Clock,
  DollarSign,
  Users,
  Briefcase,
  CreditCard,
  GitBranch,
  Lock,
  Gauge,
  Gamepad2,
  Heart,
  Trophy,
  CheckCircle2,
  Radio,
  FileCode,
  Mail,
  Send,
} from "lucide-react"
import { NavigationV2 } from "@/components/v2/navigation-v2"
import { FooterV2 } from "@/components/v2/footer-v2"
import { StreamingCounter } from "@/components/v2/streaming-counter"
import { StreamVisualizer } from "@/components/v2/stream-visualizer"
import { GradientText } from "@/components/v2/gradient-text"
import { DotMatrix } from "@/components/v2/dot-matrix"
import GradientBlinds from "@/components/v2/gradient-blinds"
import { InfiniteMarquee } from "@/components/v2/infinite-marquee"
import { NumberTicker } from "@/components/v2/number-ticker"
import { FloatingNetwork } from "@/components/v2/floating-network"
import { ScrollProgress } from "@/components/v2/scroll-progress"
import { TextScramble } from "@/components/v2/text-scramble"
import { SpotlightCard } from "@/components/v2/spotlight-card"
import { WordRotate } from "@/components/v2/word-rotate"
import { CodeTyping } from "@/components/v2/code-typing"
import { MagnetButton } from "@/components/v2/magnet-button"
import { TrueFocus } from "@/components/v2/true-focus"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
}

const useCases = [
  { icon: Briefcase, title: "Bounties & Gigs", description: "AI-verified work triggers instant streams. Pay developers per-second as they deliver.", accent: "#10b981", tags: ["Work-triggered", "Instant stop", "AI-verified"] },
  { icon: Clock, title: "Streaming Payroll", description: "Per-second salary with pause/resume and clawback rules. No more waiting for payday.", accent: "#3b82f6", tags: ["HR", "Recurring", "Pause/Resume"] },
  { icon: CreditCard, title: "Subscriptions", description: "Pay-as-you-use billing. Cancel anytime, stop paying instantly. Fair by design.", accent: "#8b5cf6", tags: ["Pay-as-you-use", "Cancel anytime"] },
  { icon: GitBranch, title: "Revenue Share", description: "Route incoming funds to teams, contributors, and referrers automatically via splits.", accent: "#f59e0b", tags: ["Routing", "Teams", "Referrals"] },
  { icon: Lock, title: "Vesting Streams", description: "Linear token unlock with configurable stoppability. Transparent on-chain vesting.", accent: "#f43f5e", tags: ["Linear unlock", "Configurable"] },
  { icon: Trophy, title: "Grants & Milestones", description: "Milestone-based streams with transparent runway tracking for grant recipients.", accent: "#06b6d4", tags: ["Milestone-based", "Transparent"] },
  { icon: Gauge, title: "API Metering", description: "Pay per request or compute time. Real-time billing for infrastructure usage.", accent: "#f97316", tags: ["Per-request", "Compute-time"] },
  { icon: Gamepad2, title: "Gaming Rewards", description: "Real-time in-game rewards. Battle-pass style streams and tournament payouts.", accent: "#6366f1", tags: ["In-game", "Tournaments"] },
  { icon: Heart, title: "Donations & Patronage", description: "Support creators via recurring streams. Transparent, continuous patronage.", accent: "#ec4899", tags: ["Recurring", "Creators"] },
]

const demoScenarios: Record<string, { sender: string; receiver: string; rate: string; ratePerSec: number; buffer: string; label: string; statusColor: string }> = {
  Payroll: { sender: "company.vara", receiver: "alice.vara", rate: "$0.00027/sec", ratePerSec: 0.00027, buffer: "8h remaining", label: "Streaming", statusColor: "#10b981" },
  Subscriptions: { sender: "user.vara", receiver: "service.vara", rate: "$0.00008/sec", ratePerSec: 0.00008, buffer: "24h remaining", label: "Active", statusColor: "#8b5cf6" },
  Bounties: { sender: "dao.vara", receiver: "dev.vara", rate: "$0.00019/sec", ratePerSec: 0.00019, buffer: "4h remaining", label: "Streaming", statusColor: "#10b981" },
  Splits: { sender: "protocol.vara", receiver: "team.vara", rate: "$0.00031/sec", ratePerSec: 0.00031, buffer: "12h remaining", label: "Routing", statusColor: "#f59e0b" },
}

const protocolStatus = [
  { icon: Radio, label: "Status", value: "Vara Testnet (Live)", color: "text-emerald-400", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5" },
  { icon: FileCode, label: "Contracts", value: "StreamCore + TokenVault", color: "text-cyan-400", borderColor: "border-cyan-500/20", bgColor: "bg-cyan-500/5" },
  { icon: Shield, label: "Security", value: "Tests + threat model (audit planned)", color: "text-purple-400", borderColor: "border-purple-500/20", bgColor: "bg-purple-500/5" },
  { icon: Users, label: "Pilots", value: "3 integration slots open", color: "text-amber-400", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5" },
]

const protocolFeatures = [
  { icon: Layers, title: "Token Agnostic", description: "Stream USDC, VARA, or any token. One protocol, all tokens." },
  { icon: Shield, title: "Buffer & Solvency", description: "Deposit-based model ensures streams never go negative. Transparent liquidation rules." },
  { icon: Code2, title: "Composable", description: "Plug into any app. StreamCore + Vault + SplitsRouter — modular by design." },
  { icon: Zap, title: "Per-Second Settlement", description: "Powered by Vara's low-cost execution. Real-time payments at scale." },
]

const steps = [
  { step: "00", title: "Install SDK", description: "Install the GrowStreams SDK and initialize the client for Vara testnet.", code: `npm i @growstreams/sdk\n\nimport { GrowStreams } from '@growstreams/sdk';\nconst client = new GrowStreams({\n  network: "vara-testnet"\n});` },
  { step: "01", title: "Deposit & Buffer", description: "Deposit tokens into the vault. Set a buffer to guarantee stream solvency.", code: `await client.vault.deposit({\n  token: "USDC",\n  amount: "1000",\n  buffer: "4h"\n});` },
  { step: "02", title: "Create Stream", description: "Define sender, receiver, token, and flow rate. Stream starts immediately.", code: `await client.stream.create({\n  receiver: "0xBob",\n  token: "USDC",\n  flowRate: "0.00027/sec"\n});` },
  { step: "03", title: "Withdraw Anytime", description: "Receivers claim their balance at any time. No lockups, no delays.", code: `await client.stream.withdraw({\n  streamId: "0x..abc",\n  amount: "max"\n});` },
]

export default function HomeV2() {
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })
  const { scrollYProgress } = useScroll()
  const heroParallax = useTransform(scrollYProgress, [0, 0.3], [0, -60])
  const [activeDemo, setActiveDemo] = useState<string>("Payroll")
  const scenario = demoScenarios[activeDemo]

  return (
    <div className="min-h-screen bg-provn-bg text-provn-text">
      <NavigationV2 currentPage="home" />
      <ScrollProgress />

      {/* ============ HERO ============ */}
      <div className="min-h-screen flex items-center relative overflow-hidden">
        {/* WebGL Gradient Blinds background */}
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
          <GradientBlinds
            gradientColors={['#10b981', '#06b6d4', '#0a0a0a', '#8b5cf6', '#10b981']}
            angle={15}
            noise={0.25}
            blindCount={14}
            blindMinWidth={50}
            spotlightRadius={0.6}
            spotlightSoftness={1.2}
            spotlightOpacity={0.9}
            mouseDampening={0.12}
            distortAmount={0}
            shineDirection="left"
            mixBlendMode="screen"
          />
        </div>
        {/* Subtle radial glow accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] right-[5%] w-[600px] h-[600px] rounded-full bg-emerald-500/[0.03] blur-[150px]" />
          <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-cyan-500/[0.02] blur-[120px]" />
        </div>

        <motion.div
          ref={heroRef}
          className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-16"
          style={{ y: heroParallax }}
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 text-emerald-400 text-xs font-medium tracking-wider uppercase">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <TextScramble text="Live on Vara Testnet" speed={25} scrambleDuration={1200} />
                </div>
              </motion.div>

              <motion.div
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold leading-[1.08] tracking-tight"
                initial={{ opacity: 0, y: 24 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.08 }}
              >
                <TrueFocus
                  sentence="Per-Second Money Streaming"
                  manualMode={false}
                  blurAmount={4}
                  borderColor="#10b981"
                  glowColor="rgba(16, 185, 129, 0.5)"
                  animationDuration={0.5}
                  pauseBetweenAnimations={1.5}
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-bold leading-[1.08] tracking-tight text-provn-text"
                />
              </motion.div>

              <motion.p
                className="text-base sm:text-lg text-gray-300 leading-[1.7] max-w-md"
                initial={{ opacity: 0, y: 16 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.18 }}
              >
                Real-time token streaming on Vara. Composable smart contracts
                for payroll, subscriptions, bounties, grants, and revenue sharing.
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center gap-3 pt-1"
                initial={{ opacity: 0, y: 16 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.26 }}
              >
                <button
                  onClick={() => document.getElementById("developers-cta")?.scrollIntoView({ behavior: "smooth" })}
                  className="btn-shimmer group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 focus-glow"
                >
                  Integrate (10 min)
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-provn-text border border-provn-border rounded-lg hover:border-provn-muted/60 transition-all active:scale-[0.98] focus-glow"
                >
                  Launch App
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={isHeroInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.34 }}
              >
                <Link href="/ecosystem" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors mt-1">
                  Join Pilot <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>

              {/* Protocol Status Bento Cards */}
              <motion.div
                className="grid grid-cols-2 gap-2.5 pt-6"
                initial={{ opacity: 0, y: 16 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {protocolStatus.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className={`group relative p-3 rounded-xl ${item.bgColor} border ${item.borderColor} hover:border-opacity-40 transition-all duration-300 overflow-hidden`}
                    >
                      <div className="flex items-start gap-2.5">
                        <Icon className={`w-4 h-4 ${item.color} mt-0.5 flex-shrink-0`} />
                        <div className="min-w-0">
                          <div className="text-[10px] text-provn-muted uppercase tracking-wider font-medium">{item.label}</div>
                          <div className="text-xs text-gray-300 font-medium mt-0.5 leading-snug">{item.value}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            </div>

            {/* Right: Live Stream Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="relative rounded-2xl bg-provn-surface/40 backdrop-blur-sm border border-provn-border/40 overflow-hidden shadow-2xl shadow-black/20">
                {/* Window chrome */}
                <div className="flex items-center justify-between px-4 py-3 bg-provn-surface/60 border-b border-provn-border/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    <span className="ml-2 text-[10px] text-provn-muted font-mono">stream-preview</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${scenario.statusColor}15`, color: scenario.statusColor, border: `1px solid ${scenario.statusColor}30` }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: scenario.statusColor }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: scenario.statusColor }} />
                    </span>
                    {scenario.label}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Stream flow visual */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 rounded-lg bg-provn-bg/60 border border-provn-border/30">
                      <div className="text-[10px] text-provn-muted mb-1">Sender</div>
                      <div className="text-sm font-mono font-medium text-gray-300">{scenario.sender}</div>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <motion.div
                        className="text-emerald-400"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.div>
                      <div className="text-[9px] text-provn-muted font-mono whitespace-nowrap">{scenario.rate}</div>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-provn-bg/60 border border-provn-border/30">
                      <div className="text-[10px] text-provn-muted mb-1">Receiver</div>
                      <div className="text-sm font-mono font-medium text-gray-300">{scenario.receiver}</div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-lg bg-provn-bg/60 border border-provn-border/30">
                      <div className="text-[10px] text-provn-muted mb-1 uppercase tracking-wider">Withdrawable</div>
                      <StreamingCounter
                        startValue={1247.81}
                        ratePerSecond={scenario.ratePerSec}
                        decimals={4}
                        prefix="$"
                        className="text-base font-bold text-emerald-400 tabular-nums font-mono"
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-provn-bg/60 border border-provn-border/30">
                      <div className="text-[10px] text-provn-muted mb-1 uppercase tracking-wider">Buffer</div>
                      <div className="text-base font-bold text-gray-300 font-mono tabular-nums">{scenario.buffer}</div>
                    </div>
                  </div>

                  {/* Simulated label */}
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-provn-muted/60">
                    <CheckCircle2 className="w-3 h-3" />
                    Simulated preview · Testnet data
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ============ WHAT IS GROWSTREAMS ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-provn-surface border border-provn-border text-xs font-medium text-provn-muted mb-4">
              PROTOCOL
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Money streaming, <GradientText>simplified</GradientText>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              A generalized streaming smart-contract system on Vara.
              Token-agnostic, composable, and production-ready.
            </p>
          </motion.div>

          {/* Bento Grid Layout: 1 large feature + 3 smaller — with SpotlightCard */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {protocolFeatures.map((feature, i) => {
              const Icon = feature.icon
              const isLarge = i === 0
              return (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className={isLarge ? "md:col-span-2 lg:col-span-2 lg:row-span-2" : ""}
                >
                  <SpotlightCard
                    className={`${isLarge ? "p-8 lg:p-10" : "p-6"} rounded-2xl bg-provn-surface/50 border border-provn-border/30 hover:border-emerald-500/20 transition-all duration-300 h-full`}
                    spotlightColor="rgba(16, 185, 129, 0.08)"
                  >
                    {/* Mesh gradient for large card */}
                    {isLarge && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                        <div className="absolute top-[20%] left-[10%] w-[200px] h-[200px] rounded-full bg-emerald-500/[0.06] blur-[80px] animate-pulse" style={{ animationDuration: "6s" }} />
                        <div className="absolute bottom-[15%] right-[15%] w-[180px] h-[180px] rounded-full bg-cyan-500/[0.05] blur-[70px] animate-pulse" style={{ animationDuration: "8s", animationDelay: "2s" }} />
                        <div className="absolute top-[50%] right-[30%] w-[150px] h-[150px] rounded-full bg-purple-500/[0.04] blur-[60px] animate-pulse" style={{ animationDuration: "7s", animationDelay: "4s" }} />
                      </div>
                    )}
                    <div className={`${isLarge ? "w-14 h-14" : "w-12 h-12"} rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4`}>
                      <Icon className={`${isLarge ? "w-7 h-7" : "w-6 h-6"} text-emerald-400`} />
                    </div>
                    <h3 className={`${isLarge ? "text-2xl" : "text-lg"} font-semibold mb-2`}>{feature.title}</h3>
                    <p className={`${isLarge ? "text-base" : "text-sm"} text-gray-400 leading-relaxed`}>
                      {feature.description}
                    </p>
                    {isLarge && (
                      <div className="mt-6 flex items-center gap-4 text-sm text-provn-muted">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> USDC</div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> VARA</div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Any ERC-20</div>
                      </div>
                    )}
                  </SpotlightCard>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            className="mt-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={4}
          >
            <Link
              href="/protocol"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Learn how streams work
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============ HOW IT WORKS — Vertical Timeline ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-y border-provn-border/20 relative overflow-hidden">
        {/* Subtle dot grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, rgba(16,185,129,0.4) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Integrate in <GradientText>10 minutes</GradientText>
            </h2>
            <p className="text-base text-gray-400 leading-relaxed">Four steps to start streaming payments on Vara.</p>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-8">
            {/* Left: Steps timeline */}
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/40 via-emerald-500/20 to-transparent" />
              {/* Pulse dot traveling down the line */}
              <motion.div
                className="absolute left-[21px] w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] z-20"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />

              <div className="space-y-10">
                {steps.map((item, i) => (
                  <motion.div
                    key={item.step}
                    className="relative pl-16"
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                  >
                    {/* Step circle */}
                    <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-provn-surface border border-provn-border/50 flex items-center justify-center text-sm font-bold text-emerald-400 z-10">
                      {item.step}
                    </div>

                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">{item.description}</p>
                    <div className="relative rounded-xl bg-provn-bg border border-provn-border/50 p-4 overflow-hidden">
                      <CodeTyping code={item.code} className="text-xs whitespace-pre overflow-x-auto" speed={25} delay={300 + i * 600} />
                      <button className="absolute top-2.5 right-2.5 text-[10px] text-provn-muted hover:text-provn-text px-2 py-1 rounded bg-provn-surface border border-provn-border/50 transition-colors">
                        Copy
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mt-8 pl-16"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={5}
              >
                <Link href="/developers#quickstart" className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  View full Quickstart <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            </div>

            {/* Right: Contract info sidebar */}
            <motion.div
              className="hidden lg:block"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={2}
            >
              <div className="sticky top-28 space-y-4">
                <div className="p-4 rounded-xl bg-provn-surface/40 border border-provn-border/30">
                  <h4 className="text-xs text-provn-muted uppercase tracking-wider font-medium mb-3">Contract Addresses</h4>
                  <div className="space-y-2.5">
                    {[
                      { name: "StreamCore", addr: "0x7f3a...b2c1" },
                      { name: "TokenVault", addr: "0x4d2e...a8f3" },
                      { name: "SplitsRouter", addr: "0x9c1b...d4e7" },
                    ].map((c) => (
                      <div key={c.name} className="flex items-center justify-between">
                        <span className="text-xs text-gray-300 font-medium">{c.name}</span>
                        <code className="text-[10px] text-provn-muted font-mono">{c.addr}</code>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-provn-border/30">
                    <div className="text-[10px] text-provn-muted">Network</div>
                    <div className="text-xs text-gray-300 font-medium mt-0.5">Vara Testnet</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-provn-surface/40 border border-provn-border/30">
                  <h4 className="text-xs text-provn-muted uppercase tracking-wider font-medium mb-2">Supported Tokens</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {["USDC", "VARA", "DOT"].map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-provn-bg/60 border border-provn-border/30 text-[10px] font-mono text-gray-300">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ USE CASES ============ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-provn-surface border border-provn-border text-xs font-medium text-provn-muted mb-4">
              USE CASES
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              One protocol, <GradientText from="from-purple-400" to="to-pink-400">endless possibilities</GradientText>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              From payroll to gaming rewards — stream money for any use case.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {useCases.map((useCase, i) => {
              const Icon = useCase.icon
              return (
                <motion.div
                  key={useCase.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <Link href={`/use-cases#${useCase.title.toLowerCase().replace(/\s+/g, "-")}`} className="block h-full">
                    <div className="group relative p-6 rounded-2xl bg-provn-surface/40 border border-provn-border/30 hover:border-provn-border/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 transition-all duration-300 h-full overflow-hidden">
                      {/* Colored top accent bar */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-300 group-hover:h-[3px]" style={{ backgroundColor: useCase.accent }} />
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${useCase.accent}15` }}>
                        <Icon className="w-5 h-5" style={{ color: useCase.accent }} />
                      </div>
                      <h3 className="text-base font-semibold mb-1.5">{useCase.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed mb-3">{useCase.description}</p>
                      {/* Micro-tags */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {useCase.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium border" style={{ color: useCase.accent, borderColor: `${useCase.accent}30`, backgroundColor: `${useCase.accent}08` }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      {/* Hover reveal learn more */}
                      <div className="flex items-center gap-1 text-xs font-medium opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" style={{ color: useCase.accent }}>
                        Learn more <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            className="mt-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={9}
          >
            <Link
              href="/use-cases"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold border border-provn-border rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
            >
              View all use cases
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============ STREAM DEMO ============ */}
      <section id="demo" className="py-24 px-4 sm:px-6 lg:px-8 border-y border-provn-border/20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[120px]" />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-[100px]"
            animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.07, 0.04] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              See it in <GradientText from="from-emerald-400" to="to-teal-400">action</GradientText>
            </h2>
            <p className="text-base text-gray-400 leading-relaxed">Watch money flow in real-time between wallets.</p>
          </motion.div>

          {/* Scenario tabs */}
          <motion.div
            className="flex justify-center mb-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex p-1 rounded-xl bg-provn-surface/50 border border-provn-border/30">
              {Object.keys(demoScenarios).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveDemo(key)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeDemo === key ? "text-provn-text" : "text-provn-muted hover:text-provn-text"
                  }`}
                >
                  {activeDemo === key && (
                    <motion.div
                      layoutId="demo-tab"
                      className="absolute inset-0 rounded-lg bg-provn-bg border border-provn-border/50"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{key}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <div className="relative rounded-2xl bg-provn-surface/30 backdrop-blur-xl border border-provn-border/40 shadow-2xl shadow-black/10 overflow-hidden">
              <div className="p-6 md:p-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Active Stream</h3>
                    <p className="text-xs text-provn-muted font-mono">0x7f3a...b2c1</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${scenario.statusColor}15`, border: `1px solid ${scenario.statusColor}30` }}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: scenario.statusColor }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: scenario.statusColor }} />
                    </span>
                    <span className="text-xs font-medium" style={{ color: scenario.statusColor }}>{scenario.label}</span>
                  </div>
                </div>

                <StreamVisualizer sender={scenario.sender} receiver={scenario.receiver} token="USDC" flowRate={scenario.rate} className="mb-6" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Sender Balance", content: <StreamingCounter key={`s-${activeDemo}`} startValue={8752.19} ratePerSecond={-scenario.ratePerSec} decimals={4} prefix="$" className="text-base font-bold tabular-nums" /> },
                    { label: "Receiver Balance", content: <StreamingCounter key={`r-${activeDemo}`} startValue={1247.81} ratePerSecond={scenario.ratePerSec} decimals={4} prefix="$" className="text-base font-bold text-emerald-400 tabular-nums" /> },
                    { label: "Flow Rate", content: <div className="text-base font-bold font-mono tabular-nums">{scenario.rate}</div> },
                    { label: "Buffer", content: <div className="text-base font-bold font-mono tabular-nums">{scenario.buffer}</div> },
                  ].map((item) => (
                    <div key={item.label} className="p-3.5 rounded-xl bg-provn-bg/60 border border-provn-border/30">
                      <div className="text-[10px] text-provn-muted mb-1 uppercase tracking-wider">{item.label}</div>
                      {item.content}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ DEVELOPER CTA ============ */}
      <section id="developers-cta" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <DotMatrix color="#10b981" dotSize={1.5} gap={12} />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            className="relative rounded-3xl overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 rounded-3xl animated-border opacity-60" />
            <div className="absolute inset-[2px] rounded-[22px] bg-provn-bg" />

            <div className="relative p-8 md:p-16 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-cyan-500/[0.06] rounded-3xl" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium tracking-wider uppercase mb-6">
                  <Code2 className="w-3 h-3" />
                  For Developers
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                  Build with{" "}
                  <GradientText animate>GrowStreams</GradientText>
                </h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                  SDK, contract addresses, quickstart guides, and examples.
                  Go from zero to first stream in under 10 minutes.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/developers"
                    className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 text-base font-semibold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 focus-glow"
                  >
                    Read the Docs
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/ecosystem"
                    className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-provn-text border border-provn-border rounded-xl hover:border-provn-muted transition-all active:scale-[0.98] focus-glow"
                  >
                    Partner with Us
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ ECOSYSTEM LOGOS — Infinite Marquee ============ */}
      <section className="py-16 border-t border-provn-border/30 overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <p className="text-sm text-provn-muted mb-8 text-center">Built on & integrated with</p>
          <InfiniteMarquee speed={25} pauseOnHover>
            {["Vara Network", "Gear Protocol", "Polkadot", "USDC", "Substrate", "ink!", "Wasm", "OpenZeppelin"].map((name) => (
              <div
                key={name}
                className="px-8 py-3.5 rounded-xl bg-provn-surface border border-provn-border/50 text-sm font-medium text-provn-muted hover:text-provn-text hover:border-emerald-500/30 transition-all duration-300 whitespace-nowrap"
              >
                {name}
              </div>
            ))}
          </InfiniteMarquee>
        </motion.div>
      </section>

      <FooterV2 />
    </div>
  )
}
