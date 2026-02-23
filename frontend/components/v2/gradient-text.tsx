"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GradientTextProps {
  children: React.ReactNode
  className?: string
  from?: string
  to?: string
  animate?: boolean
}

export function GradientText({
  children,
  className = "",
  from = "from-emerald-400",
  to = "to-cyan-400",
  animate = false,
}: GradientTextProps) {
  if (animate) {
    return (
      <motion.span
        className={cn(
          "text-transparent bg-clip-text bg-gradient-to-r",
          from,
          to,
          className
        )}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 200%" }}
      >
        {children}
      </motion.span>
    )
  }

  return (
    <span
      className={cn(
        "text-transparent bg-clip-text bg-gradient-to-r",
        from,
        to,
        className
      )}
    >
      {children}
    </span>
  )
}
