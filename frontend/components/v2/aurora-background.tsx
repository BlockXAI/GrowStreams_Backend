"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type AuroraTheme = "default" | "cyan" | "amber" | "purple"

const auroraThemes: Record<AuroraTheme, [string, string, string]> = {
  default: ["#10b981", "#06b6d4", "#8b5cf6"],
  cyan: ["#06b6d4", "#3b82f6", "#10b981"],
  amber: ["#f59e0b", "#ef4444", "#10b981"],
  purple: ["#8b5cf6", "#ec4899", "#06b6d4"],
}

interface AuroraBackgroundProps {
  children?: React.ReactNode
  className?: string
  showRadialGradient?: boolean
  theme?: AuroraTheme
}

export function AuroraBackground({
  children,
  className = "",
  showRadialGradient = true,
  theme = "default",
}: AuroraBackgroundProps) {
  const [c1, c2, c3] = auroraThemes[theme]

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Aurora blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full opacity-[0.03] will-change-transform"
          style={{
            background: `radial-gradient(circle, ${c1} 0%, transparent 70%)`,
          }}
          animate={{
            x: [0, 100, 50, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-[30%] -right-[20%] w-[70%] h-[70%] rounded-full opacity-[0.03] will-change-transform"
          style={{
            background: `radial-gradient(circle, ${c2} 0%, transparent 70%)`,
          }}
          animate={{
            x: [0, -80, -20, 0],
            y: [0, 60, -40, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[20%] right-[10%] w-[50%] h-[50%] rounded-full opacity-[0.02] will-change-transform"
          style={{
            background: `radial-gradient(circle, ${c3} 0%, transparent 70%)`,
          }}
          animate={{
            x: [0, -60, 30, 0],
            y: [0, 40, -60, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {showRadialGradient && (
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-provn-bg/50 to-provn-bg" />
      )}

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
