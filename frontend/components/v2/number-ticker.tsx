"use client"

import React, { useEffect, useRef, useState } from "react"
import { useInView, motion, AnimatePresence } from "framer-motion"

interface NumberTickerProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  duration?: number
}

export function NumberTicker({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
  duration = 2,
}: NumberTickerProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const startTime = Date.now()
    const step = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(value * eased)
      if (progress < 1) requestAnimationFrame(step)
      else setDisplayValue(value)
    }
    requestAnimationFrame(step)
  }, [isInView, value, duration])

  const formatted = displayValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  const digits = `${prefix}${formatted}${suffix}`.split("")

  return (
    <span ref={ref} className={`inline-flex overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout">
        {digits.map((char, i) => (
          <motion.span
            key={`${i}-${char}`}
            initial={{ y: 12, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -12, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="inline-block"
          >
            {char}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  )
}
