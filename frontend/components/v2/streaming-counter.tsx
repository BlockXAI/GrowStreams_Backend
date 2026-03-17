"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"

interface StreamingCounterProps {
  startValue?: number
  ratePerSecond?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  highlight?: boolean
}

export function StreamingCounter({
  startValue = 0,
  ratePerSecond = 0.000274,
  prefix = "$",
  suffix = "",
  decimals = 6,
  className = "",
  highlight = true,
}: StreamingCounterProps) {
  const [value, setValue] = useState(startValue)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: false, margin: "-50px" })
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isInView) return

    startTimeRef.current = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - (startTimeRef.current || Date.now())) / 1000
      setValue(startValue + elapsed * ratePerSecond)
    }, 50)

    return () => clearInterval(interval)
  }, [isInView, startValue, ratePerSecond])

  const formatted = value.toFixed(decimals)
  const [whole, decimal] = formatted.split(".")

  return (
    <motion.span
      ref={ref}
      className={`font-mono tabular-nums ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      {whole}
      {decimal && (
        <>
          <span className="text-provn-muted">.</span>
          <span className={highlight ? "text-provn-accent" : ""}>{decimal}</span>
        </>
      )}
      {suffix}
    </motion.span>
  )
}
