"use client"

import React from "react"
import { motion } from "framer-motion"
import { DollarSign, Shield, Zap, Wallet, ArrowLeftRight, Lock } from "lucide-react"

const nodes = [
  { icon: Wallet, label: "Sender", x: "8%", y: "18%", color: "#10b981", delay: 0 },
  { icon: ArrowLeftRight, label: "Stream", x: "45%", y: "8%", color: "#06b6d4", delay: 0.2 },
  { icon: DollarSign, label: "USDC", x: "78%", y: "22%", color: "#3b82f6", delay: 0.4 },
  { icon: Shield, label: "Vault", x: "20%", y: "55%", color: "#8b5cf6", delay: 0.6 },
  { icon: Zap, label: "Per-Sec", x: "55%", y: "50%", color: "#10b981", delay: 0.3 },
  { icon: Lock, label: "Buffer", x: "82%", y: "60%", color: "#f59e0b", delay: 0.5 },
  { icon: Wallet, label: "Receiver", x: "38%", y: "82%", color: "#10b981", delay: 0.7 },
]

const connections = [
  [0, 1], [1, 2], [0, 3], [3, 4], [4, 5], [4, 1], [3, 6], [4, 6], [2, 5],
]

export function FloatingNetwork({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full h-full min-h-[400px] ${className}`}>
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {connections.map(([from, to], i) => (
          <motion.line
            key={i}
            x1={nodes[from].x}
            y1={nodes[from].y}
            x2={nodes[to].x}
            y2={nodes[to].y}
            stroke="rgba(16, 185, 129, 0.12)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 + i * 0.1, ease: "easeOut" }}
          />
        ))}
        {/* Animated pulse dots along connections */}
        {connections.slice(0, 4).map(([from, to], i) => (
          <motion.circle
            key={`pulse-${i}`}
            r="2"
            fill="#10b981"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              cx: [nodes[from].x, nodes[to].x],
              cy: [nodes[from].y, nodes[to].y],
            }}
            transition={{
              duration: 3,
              delay: 1 + i * 0.8,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "linear",
            }}
          />
        ))}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => {
        const Icon = node.icon
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + node.delay, ease: [0.22, 1, 0.36, 1] as const }}
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: `${node.color}15`, border: `1px solid ${node.color}20` }}
              animate={{ scale: [1, 1.8, 1.8], opacity: [0.5, 0, 0] }}
              transition={{ duration: 3, delay: 1 + node.delay, repeat: Infinity, repeatDelay: 2 }}
            />
            {/* Node */}
            <div
              className="relative w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm will-change-transform"
              style={{
                backgroundColor: `${node.color}15`,
                border: `1px solid ${node.color}30`,
                boxShadow: `0 0 20px ${node.color}10`,
              }}
            >
              <Icon className="w-4 h-4" style={{ color: node.color }} />
            </div>
            {/* Label */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-provn-muted whitespace-nowrap font-medium">
              {node.label}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
