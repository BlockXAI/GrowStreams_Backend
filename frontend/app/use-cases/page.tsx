"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  Briefcase,
  Clock,
  CreditCard,
  GitBranch,
  Lock,
  Trophy,
  Gauge,
  Gamepad2,
  Heart,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react"
import { NavigationV2 } from "@/components/v2/navigation-v2"
import { FooterV2 } from "@/components/v2/footer-v2"
import { GradientText } from "@/components/v2/gradient-text"
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

const fadeFromSide = {
  hidden: (isEven: boolean) => ({ opacity: 0, x: isEven ? -30 : 30 }),
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
}

const useCases = [
  {
    id: "bounties",
    icon: Briefcase,
    title: "Bounties & Gigs",
    tagline: "AI-verified work triggers instant streams",
    description: "Submit code, pass AI verification, and get paid per-second. GrowStreams' flagship use case combines quality verification with real-time streaming payouts for developer bounties.",
    features: [
      "AI-powered code quality verification (~95% accuracy)",
      "Instant stream activation on approval",
      "Adjustable flow rate based on complexity",
      "Automatic stream stop on completion",
    ],
    color: "from-emerald-500",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    id: "payroll",
    icon: Clock,
    title: "Streaming Payroll",
    tagline: "Per-second salary for the modern workforce",
    description: "Replace monthly payday with continuous per-second salary payments. Employees earn every second they work, with built-in pause, resume, and clawback capabilities.",
    features: [
      "Per-second salary streaming",
      "Pause / resume for leave management",
      "Configurable clawback rules",
      "Multi-token support (USDC, VARA)",
    ],
    color: "from-blue-500",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    id: "subscriptions",
    icon: CreditCard,
    title: "Subscriptions",
    tagline: "Pay-as-you-use, cancel instantly",
    description: "Fair billing by the second. Users stream payments only while using the service. Cancel anytime — the stream stops, and so does the charge. No refund disputes.",
    features: [
      "Per-second billing granularity",
      "Instant cancellation, no refund needed",
      "Usage-based pricing support",
      "Transparent on-chain billing history",
    ],
    color: "from-purple-500",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    id: "revenue-share",
    icon: GitBranch,
    title: "Revenue Share & Splits",
    tagline: "Route funds to teams automatically",
    description: "Incoming payments automatically split to contributors, referrers, and team members by configurable weights. Perfect for DAOs, marketplaces, and collaborative projects.",
    features: [
      "Weighted fund distribution (e.g., 60/30/10)",
      "Dynamic weight updates",
      "Nested splits (split of splits)",
      "On-chain transparency for all parties",
    ],
    color: "from-amber-500",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    id: "vesting",
    icon: Lock,
    title: "Vesting Streams",
    tagline: "Linear token unlock with control",
    description: "Replace cliff-and-vest with smooth linear streaming. Token holders see their balance grow every second. Configurable stoppability gives both parties flexibility.",
    features: [
      "Linear per-second vesting",
      "Configurable cliff period",
      "Optional stoppability for founders",
      "Transparent on-chain vesting schedule",
    ],
    color: "from-rose-500",
    borderColor: "border-rose-500/30",
    bgColor: "bg-rose-500/5",
    iconColor: "text-rose-400",
  },
  {
    id: "grants",
    icon: Trophy,
    title: "Grants & Milestones",
    tagline: "Transparent runway for grant recipients",
    description: "Fund projects with milestone-based streams. Grant providers stream continuously, with the ability to adjust or stop based on deliverables. Full on-chain transparency.",
    features: [
      "Milestone-based flow rate adjustments",
      "Transparent fund tracking",
      "DAO governance integration",
      "Automated reporting via events",
    ],
    color: "from-cyan-500",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-500/5",
    iconColor: "text-cyan-400",
  },
  {
    id: "api-metering",
    icon: Gauge,
    title: "API Metering",
    tagline: "Pay per request, per compute second",
    description: "Real-time billing for API and infrastructure usage. Stream payments based on actual consumption — per request, per compute second, or per GB transferred.",
    features: [
      "Usage-based streaming payments",
      "Per-request or per-second billing",
      "Automatic scaling with demand",
      "Instant settlement, no invoicing",
    ],
    color: "from-orange-500",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/5",
    iconColor: "text-orange-400",
  },
  {
    id: "gaming",
    icon: Gamepad2,
    title: "Gaming Rewards",
    tagline: "Real-time in-game economies",
    description: "Stream rewards to players in real-time. Battle passes, tournament prizes, and in-game economies powered by per-second token flows. Players see earnings tick up live.",
    features: [
      "Real-time reward streaming",
      "Battle-pass style progressive unlocks",
      "Tournament payout automation",
      "Cross-game token interop on Vara",
    ],
    color: "from-indigo-500",
    borderColor: "border-indigo-500/30",
    bgColor: "bg-indigo-500/5",
    iconColor: "text-indigo-400",
  },
  {
    id: "donations",
    icon: Heart,
    title: "Donations & Patronage",
    tagline: "Continuous creator support",
    description: "Support creators with recurring per-second streams. Patrons set a monthly budget and creators earn continuously. Cancel anytime, add splits for collaborators.",
    features: [
      "Recurring per-second donations",
      "Creator splits for collaborators",
      "Transparent supporter leaderboards",
      "Tax-receipt-friendly on-chain records",
    ],
    color: "from-pink-500",
    borderColor: "border-pink-500/30",
    bgColor: "bg-pink-500/5",
    iconColor: "text-pink-400",
  },
]

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-provn-bg text-provn-text">
      <NavigationV2 currentPage="use-cases" />
      <ScrollProgress />

      {/* Hero */}
      <AuroraBackground theme="purple" className="pt-32 pb-20">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-provn-surface border border-provn-border text-xs font-medium text-provn-muted mb-6">
              USE CASES
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            One protocol,{" "}
            <GradientText from="from-purple-400" to="to-pink-400">
              endless possibilities
            </GradientText>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-provn-muted max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            From payroll to gaming rewards — stream money for any use case.
            Here are the apps you can build with GrowStreams.
          </motion.p>
        </div>
      </AuroraBackground>

      {/* Use Cases Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          {useCases.map((uc, i) => {
            const Icon = uc.icon
            const isEven = i % 2 === 0
            return (
              <motion.div
                key={uc.id}
                id={uc.id}
                className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${!isEven ? "md:direction-rtl" : ""}`}
                custom={isEven}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeFromSide}
              >
                {/* Content */}
                <div className={`space-y-4 ${!isEven ? "md:order-2" : ""}`}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${uc.bgColor} border ${uc.borderColor} text-xs font-medium ${uc.iconColor}`}>
                    <Icon className="w-3 h-3" />
                    {uc.tagline}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold">{uc.title}</h3>
                  <p className="text-provn-muted leading-relaxed">{uc.description}</p>
                  <ul className="space-y-2 pt-2">
                    {uc.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-provn-muted">
                        <CheckCircle2 className={`w-4 h-4 ${uc.iconColor} flex-shrink-0 mt-0.5`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual Card */}
                <div className={`${!isEven ? "md:order-1" : ""}`}>
                  <div className={`p-8 rounded-3xl bg-gradient-to-br ${uc.color}/5 to-transparent border ${uc.borderColor} relative overflow-hidden`}>
                    <div className="absolute top-4 right-4">
                      <Icon className={`w-24 h-24 ${uc.iconColor} opacity-[0.07]`} />
                    </div>
                    <div className="relative z-10">
                      <Icon className={`w-12 h-12 ${uc.iconColor} mb-4`} />
                      <div className="text-4xl font-bold mb-2">{uc.title}</div>
                      <div className="text-sm text-provn-muted">Powered by GrowStreams Protocol</div>
                      <div className="mt-6 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-provn-border overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full bg-gradient-to-r ${uc.color} to-transparent`}
                            initial={{ width: "0%" }}
                            whileInView={{ width: "75%" }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: 0.3 }}
                          />
                        </div>
                        <span className="text-xs text-provn-muted">75% streamed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
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
              Have a use case in mind?
            </h2>
            <p className="text-lg text-provn-muted mb-8">
              GrowStreams is composable. If you can define a flow rate, you can stream it.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/developers"
                className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 text-base font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                Start Building
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/ecosystem"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-provn-text border border-provn-border rounded-xl hover:border-provn-muted transition-all"
              >
                Partner with Us
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <FooterV2 />
    </div>
  )
}
