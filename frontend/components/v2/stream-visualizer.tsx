"use client"

import { motion } from "framer-motion"

interface StreamVisualizerProps {
  sender?: string
  receiver?: string
  token?: string
  flowRate?: string
  className?: string
}

export function StreamVisualizer({
  sender = "0xAlice",
  receiver = "0xBob",
  token = "USDC",
  flowRate = "0.00027/sec",
  className = "",
}: StreamVisualizerProps) {
  return (
    <div className={`relative flex items-center justify-center gap-4 ${className}`}>
      {/* Sender */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center">
          <span className="text-emerald-400 text-xl font-bold">S</span>
        </div>
        <span className="mt-2 text-xs text-provn-muted font-mono">{sender}</span>
      </motion.div>

      {/* Stream Flow */}
      <div className="relative flex-1 h-12 mx-4">
        {/* Flow Line */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/40 via-emerald-400/60 to-emerald-500/40 -translate-y-1/2" />

        {/* Animated Dots */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400"
            style={{ filter: "blur(0.5px)", boxShadow: "0 0 8px rgba(16,185,129,0.6)" }}
            animate={{
              x: ["0%", "100%"],
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1, 1, 0.5],
            }}
            transition={{
              duration: 2,
              delay: i * 0.33,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}

        {/* Token Label */}
        <motion.div
          className="absolute -top-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-provn-surface border border-provn-border text-[10px] font-mono text-emerald-400"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {token} {flowRate}
        </motion.div>
      </div>

      {/* Receiver */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 flex items-center justify-center">
          <span className="text-blue-400 text-xl font-bold">R</span>
        </div>
        <span className="mt-2 text-xs text-provn-muted font-mono">{receiver}</span>
      </motion.div>
    </div>
  )
}

export function StreamVisualizerLarge({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 rounded-3xl" />

      <div className="relative p-8 rounded-3xl border border-provn-border/50 bg-provn-surface/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-provn-muted uppercase tracking-wider">Live Stream</h3>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-400 font-medium">Active</span>
          </div>
        </div>

        <StreamVisualizer
          sender="alice.vara"
          receiver="bob.vara"
          token="USDC"
          flowRate="$0.00027/sec"
        />

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-provn-muted mb-1">Total Streamed</div>
            <div className="text-sm font-mono text-provn-text">$1,247.83</div>
          </div>
          <div>
            <div className="text-xs text-provn-muted mb-1">Flow Rate</div>
            <div className="text-sm font-mono text-emerald-400">$23.72/hr</div>
          </div>
          <div>
            <div className="text-xs text-provn-muted mb-1">Buffer</div>
            <div className="text-sm font-mono text-provn-text">4h remaining</div>
          </div>
        </div>
      </div>
    </div>
  )
}
