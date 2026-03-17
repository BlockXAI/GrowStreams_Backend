"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Users,
  Handshake,
  Mail,
  Globe,
  CheckCircle2,
  Zap,
  Building2,
  Send,
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

const partnerTypes = [
  {
    icon: Building2,
    title: "DAOs & Ecosystems",
    description: "Distribute rewards, grants, and contributor payments continuously via streams.",
    benefits: [
      "Continuous contributor payments",
      "Transparent grant distribution",
      "On-chain governance integration",
    ],
  },
  {
    icon: Globe,
    title: "Marketplaces & Platforms",
    description: "Pay creators and developers in real-time. Integrate streaming payments into your app.",
    benefits: [
      "Real-time creator payouts",
      "Revenue share via splits",
      "Reduced payment disputes",
    ],
  },
  {
    icon: Zap,
    title: "DeFi Protocols",
    description: "Compose with GrowStreams for yield streaming, liquidity rewards, and more.",
    benefits: [
      "Composable stream primitives",
      "Yield distribution streams",
      "Liquidity mining automation",
    ],
  },
  {
    icon: Users,
    title: "Developer Tools",
    description: "Build on top of GrowStreams SDK. Create new apps, dashboards, and integrations.",
    benefits: [
      "Full SDK + API access",
      "Co-marketing opportunities",
      "Technical support & grants",
    ],
  },
]

const ecosystemPartners = [
  { name: "Vara Network", category: "Infrastructure", status: "Live" },
  { name: "Gear Protocol", category: "Infrastructure", status: "Live" },
  { name: "Polkadot", category: "Ecosystem", status: "Integrated" },
  { name: "USDC", category: "Token", status: "Supported" },
]

export default function EcosystemPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    project: "",
    type: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    alert("Thank you! We'll be in touch soon.")
    setFormData({ name: "", email: "", project: "", type: "", message: "" })
  }

  return (
    <div className="min-h-screen bg-provn-bg text-provn-text">
      <NavigationV2 currentPage="ecosystem" />
      <ScrollProgress />

      {/* Hero */}
      <AuroraBackground theme="amber" className="pt-32 pb-20">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-provn-surface border border-provn-border text-xs font-medium text-provn-muted mb-6">
              <Handshake className="w-3 h-3" />
              ECOSYSTEM
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Join the <GradientText from="from-amber-400" to="to-orange-400">ecosystem</GradientText>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-provn-muted max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Partner with GrowStreams to bring real-time payments to your users.
            Integrate, co-build, and grow together.
          </motion.p>
        </div>
      </AuroraBackground>

      {/* Partner Types */}
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Who we work with
            </h2>
            <p className="text-lg text-provn-muted max-w-2xl mx-auto">
              GrowStreams is designed for composability. Here&apos;s how different partners integrate.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {partnerTypes.map((partner, i) => {
              const Icon = partner.icon
              return (
                <motion.div
                  key={partner.title}
                  className="p-8 rounded-2xl bg-provn-surface/50 border border-provn-border/50 hover:border-emerald-500/30 transition-all duration-300"
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                >
                  <Icon className="w-10 h-10 text-emerald-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{partner.title}</h3>
                  <p className="text-provn-muted mb-4 leading-relaxed">{partner.description}</p>
                  <ul className="space-y-2">
                    {partner.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-provn-muted">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Current Ecosystem */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-provn-surface/20 border-y border-provn-border/30">
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
              Current <GradientText>partners</GradientText>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {ecosystemPartners.map((p, i) => (
              <motion.div
                key={p.name}
                className="p-6 rounded-2xl bg-provn-bg border border-provn-border text-center"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className="text-lg font-bold mb-1">{p.name}</div>
                <div className="text-xs text-provn-muted mb-2">{p.category}</div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  {p.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Let&apos;s <GradientText>connect</GradientText>
            </h2>
            <p className="text-lg text-provn-muted">
              Interested in integrating or partnering? Drop us a line.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-provn-muted mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-provn-surface border border-provn-border text-provn-text placeholder:text-provn-muted/50 focus:outline-none focus:border-emerald-500/50 focus-glow transition-colors"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-provn-muted mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-provn-surface border border-provn-border text-provn-text placeholder:text-provn-muted/50 focus:outline-none focus:border-emerald-500/50 focus-glow transition-colors"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-provn-muted mb-2">Project</label>
                <input
                  type="text"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-provn-surface border border-provn-border text-provn-text placeholder:text-provn-muted/50 focus:outline-none focus:border-emerald-500/50 focus-glow transition-colors"
                  placeholder="Project or company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-provn-muted mb-2">Partner Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-provn-surface border border-provn-border text-provn-text focus:outline-none focus:border-emerald-500/50 focus-glow transition-colors"
                >
                  <option value="">Select type</option>
                  <option value="dao">DAO / Ecosystem</option>
                  <option value="marketplace">Marketplace / Platform</option>
                  <option value="defi">DeFi Protocol</option>
                  <option value="devtools">Developer Tools</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-provn-muted mb-2">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-provn-surface border border-provn-border text-provn-text placeholder:text-provn-muted/50 focus:outline-none focus:border-emerald-500/50 focus-glow transition-colors resize-none"
                placeholder="Tell us about your integration idea or partnership interest..."
              />
            </div>

            <button
              type="submit"
              className="btn-shimmer w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              Send Message
            </button>
          </motion.form>

          <motion.div
            className="mt-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
          >
            <p className="text-sm text-provn-muted">
              Or reach us directly at{" "}
              <a href="mailto:partners@growstreams.app" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                partners@growstreams.app
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      <FooterV2 />
    </div>
  )
}
