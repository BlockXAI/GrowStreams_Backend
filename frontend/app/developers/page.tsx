"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Copy,
  Check,
  BookOpen,
  Code2,
  Terminal,
  Package,
  Zap,
  Shield,
  FileCode,
  MessageSquare,
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

const rustCode = `use growstreams::prelude::*;

// Initialize client
let client = GrowStreams::new(
    Network::VaraTestnet,
    &signer,
);

// Deposit tokens
client.vault().deposit(
    Token::USDC,
    Amount::new("1000"),
    Buffer::Hours(4),
).await?;

// Create stream
let stream = client.stream().create(
    receiver: "0xBob",
    token: Token::USDC,
    flow_rate: "0.000277",
).await?;`

const cliCode = `# Install CLI
$ npm install -g @growstreams/cli

# Deposit tokens
$ growstreams vault deposit \\
    --token USDC \\
    --amount 1000 \\
    --buffer 4h

# Create a stream
$ growstreams stream create \\
    --receiver 0xBob...addr \\
    --token USDC \\
    --rate 0.000277

# Check stream status
$ growstreams stream status 0x...abc`

const contractAddresses = [
  { name: "StreamCore", address: "0x7f3a...b2c1", network: "Vara Testnet" },
  { name: "TokenVault", address: "0x4d2e...a8f3", network: "Vara Testnet" },
  { name: "SplitsRouter", address: "0x9c1b...d4e7", network: "Vara Testnet" },
  { name: "PermissionManager", address: "0x2a5f...c6b9", network: "Vara Testnet" },
  { name: "BountyAdapter", address: "0x6e8d...f1a2", network: "Vara Testnet" },
]

const quickstartCode = `import { GrowStreams } from '@growstreams/sdk';

// Initialize the SDK
const gs = new GrowStreams({
  network: 'vara-testnet',
  signer: walletSigner,
});

// Step 1: Deposit tokens into vault
await gs.vault.deposit({
  token: 'USDC',
  amount: '1000',
  buffer: '4h',
});

// Step 2: Create a stream
const stream = await gs.stream.create({
  receiver: '0xBob...address',
  token: 'USDC',
  flowRate: '0.000277', // ~$1/hr
});

console.log('Stream created:', stream.id);
// Stream is now live — Bob earns every second!

// Step 3: Receiver withdraws anytime
await gs.stream.withdraw({
  streamId: stream.id,
  amount: 'max', // or specific amount
});`

const sdkMethods = [
  {
    category: "Vault",
    methods: [
      { name: "vault.deposit()", desc: "Deposit tokens + set buffer" },
      { name: "vault.withdraw()", desc: "Withdraw unused deposit" },
      { name: "vault.getBalance()", desc: "Check vault balance" },
    ],
  },
  {
    category: "Streams",
    methods: [
      { name: "stream.create()", desc: "Start a new stream" },
      { name: "stream.update()", desc: "Change flow rate" },
      { name: "stream.stop()", desc: "Stop and close stream" },
      { name: "stream.withdraw()", desc: "Receiver claims funds" },
      { name: "stream.getActive()", desc: "List active streams" },
      { name: "stream.getBalance()", desc: "Real-time balance" },
    ],
  },
  {
    category: "Splits",
    methods: [
      { name: "splits.create()", desc: "Create a split config" },
      { name: "splits.update()", desc: "Update weights" },
      { name: "splits.distribute()", desc: "Trigger distribution" },
    ],
  },
]

const faqs = [
  {
    q: "What tokens are supported?",
    a: "Currently USDC and VARA on Vara Testnet. More tokens will be added progressively. The protocol is token-agnostic — any ERC-20 compatible token can be streamed.",
  },
  {
    q: "How does the buffer model work?",
    a: "When creating a stream, the sender must deposit a buffer (e.g., 4 hours of flow). This guarantees the receiver will be paid. If the buffer depletes, the stream auto-pauses.",
  },
  {
    q: "Can I stream to multiple receivers?",
    a: "Yes! Use the SplitsRouter to define weighted distributions. One incoming stream can be split to N receivers (e.g., 60% developer, 30% reviewer, 10% platform).",
  },
  {
    q: "Is there a minimum stream amount?",
    a: "No hard minimum, but gas costs on Vara are extremely low (~$0.001). Practically, any amount above $0.01/hour is viable.",
  },
  {
    q: "How do I integrate with my existing app?",
    a: "Install the SDK (`npm i @growstreams/sdk`), connect a signer, and call `stream.create()`. Most integrations take under 10 minutes.",
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-provn-muted hover:text-provn-text bg-provn-surface border border-provn-border rounded-lg transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

const codeTabs = [
  { id: "typescript", label: "TypeScript", code: quickstartCode, file: "quickstart.ts" },
  { id: "rust", label: "Rust", code: rustCode, file: "quickstart.rs" },
  { id: "cli", label: "CLI", code: cliCode, file: "terminal" },
]

export default function DevelopersPage() {
  const [activeTab, setActiveTab] = useState("typescript")
  const activeCode = codeTabs.find((t) => t.id === activeTab) || codeTabs[0]

  return (
    <div className="min-h-screen bg-provn-bg text-provn-text">
      <NavigationV2 currentPage="developers" />
      <ScrollProgress />

      {/* Hero */}
      <AuroraBackground className="pt-32 pb-20">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
              <Code2 className="w-3 h-3" />
              DEVELOPERS
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Build with <GradientText>GrowStreams</GradientText>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-provn-muted max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            SDK, contract addresses, quickstart guides, and examples.
            Go from zero to first stream in under 10 minutes.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <a
              href="#quickstart"
              className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
            >
              <Terminal className="w-4 h-4" />
              Quickstart
            </a>
            <a
              href="#sdk"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-provn-text border border-provn-border rounded-xl hover:border-provn-muted transition-all"
            >
              <Package className="w-4 h-4" />
              SDK Reference
            </a>
            <a
              href="https://github.com/growstreams"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-provn-text border border-provn-border rounded-xl hover:border-provn-muted transition-all"
            >
              GitHub
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </AuroraBackground>

      {/* Quick Install */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-provn-border/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="flex items-center justify-between p-4 rounded-2xl bg-provn-surface border border-provn-border"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <code className="text-sm font-mono text-provn-text">
                npm install @growstreams/sdk
              </code>
            </div>
            <CopyButton text="npm install @growstreams/sdk" />
          </motion.div>
        </div>
      </section>

      {/* Quickstart */}
      <section id="quickstart" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <GradientText>Quickstart</GradientText>: Your first stream
            </h2>
            <p className="text-lg text-provn-muted">
              Three calls. Under 30 lines. Live in minutes.
            </p>
          </motion.div>

          <motion.div
            className="relative rounded-2xl bg-provn-bg border border-provn-border overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-provn-surface border-b border-provn-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                {/* Tab switcher */}
                <div className="ml-3 flex items-center gap-1">
                  {codeTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? "text-provn-text"
                          : "text-provn-muted hover:text-provn-text"
                      }`}
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="code-tab"
                          className="absolute inset-0 rounded-md bg-provn-bg border border-provn-border/50"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <CopyButton text={activeCode.code} />
            </div>
            <AnimatePresence mode="wait">
              <motion.pre
                key={activeTab}
                className="p-6 overflow-x-auto text-sm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <code className="text-provn-text font-mono">
                  {activeCode.code.split("\n").map((line, i) => (
                    <div key={i} className="leading-6">
                      <span className="text-provn-muted/50 select-none mr-4 inline-block w-6 text-right text-xs">
                        {i + 1}
                      </span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: line
                            .replace(/(\/\/.*|#.*)/g, '<span class="text-provn-muted">$1</span>')
                            .replace(/(import|from|const|await|new|let|use|pub|fn|async|mut)/g, '<span class="text-purple-400">$1</span>')
                            .replace(/('.*?'|".*?")/g, '<span class="text-emerald-400">$1</span>')
                            .replace(/(console\.log|\$)/g, '<span class="text-blue-400">$1</span>')
                            .replace(/(Token|Amount|Buffer|Network|GrowStreams)/g, '<span class="text-cyan-400">$1</span>'),
                        }}
                      />
                    </div>
                  ))}
                </code>
              </motion.pre>
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* SDK Reference */}
      <section id="sdk" className="py-24 px-4 sm:px-6 lg:px-8 bg-provn-surface/20 border-y border-provn-border/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              SDK <GradientText from="from-blue-400" to="to-purple-400">reference</GradientText>
            </h2>
            <p className="text-lg text-provn-muted">
              All methods available in <code className="text-sm bg-provn-surface px-2 py-0.5 rounded">@growstreams/sdk</code>
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {sdkMethods.map((cat, ci) => (
              <motion.div
                key={cat.category}
                className="rounded-2xl bg-provn-bg border border-provn-border overflow-hidden"
                custom={ci}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <div className="px-6 py-4 bg-provn-surface border-b border-provn-border">
                  <h3 className="font-semibold text-lg">{cat.category}</h3>
                </div>
                <div className="p-4 space-y-2">
                  {cat.methods.map((m) => (
                    <div key={m.name} className="flex items-start gap-3 p-3 rounded-xl hover:bg-provn-surface/50 transition-colors">
                      <code className="text-sm font-mono text-emerald-400 flex-shrink-0">{m.name}</code>
                      <span className="text-xs text-provn-muted">{m.desc}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contract Addresses */}
      <section id="contracts" className="py-24 px-4 sm:px-6 lg:px-8">
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
              Contract <GradientText>addresses</GradientText>
            </h2>
            <p className="text-lg text-provn-muted">
              Deployed on Vara Testnet. Mainnet addresses coming soon.
            </p>
          </motion.div>

          <motion.div
            className="rounded-2xl bg-provn-bg border border-provn-border overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-provn-border bg-provn-surface">
                    <th className="text-left px-6 py-4 text-sm font-medium text-provn-muted">Contract</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-provn-muted">Address</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-provn-muted">Network</th>
                  </tr>
                </thead>
                <tbody>
                  {contractAddresses.map((c) => (
                    <tr key={c.name} className="border-b border-provn-border/50 hover:bg-provn-surface/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono font-medium">{c.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-emerald-400">{c.address}</code>
                          <CopyButton text={c.address} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {c.network}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-provn-surface/20 border-y border-provn-border/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Frequently asked <GradientText>questions</GradientText>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="p-6 rounded-2xl bg-provn-bg border border-provn-border"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <h3 className="text-base font-semibold mb-2 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-sm text-provn-muted leading-relaxed pl-6">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Full Documentation",
                description: "Complete API reference, architecture docs, and integration guides.",
                href: "#",
                cta: "Read Docs",
              },
              {
                icon: FileCode,
                title: "Example Projects",
                description: "Starter templates for payroll, bounties, subscriptions, and more.",
                href: "https://github.com/growstreams",
                cta: "View on GitHub",
              },
              {
                icon: Shield,
                title: "Security & Audits",
                description: "Security review notes, threat model, and invariant documentation.",
                href: "/protocol#security",
                cta: "View Security",
              },
            ].map((resource, i) => {
              const Icon = resource.icon
              return (
                <motion.a
                  key={resource.title}
                  href={resource.href}
                  target={resource.href.startsWith("http") ? "_blank" : undefined}
                  rel={resource.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group p-6 rounded-2xl bg-provn-surface/50 border border-provn-border/50 hover:border-emerald-500/30 transition-all duration-300"
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                >
                  <Icon className="w-8 h-8 text-emerald-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                  <p className="text-sm text-provn-muted mb-4 leading-relaxed">{resource.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400 group-hover:gap-2 transition-all">
                    {resource.cta}
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </motion.a>
              )
            })}
          </div>
        </div>
      </section>

      <FooterV2 />
    </div>
  )
}
