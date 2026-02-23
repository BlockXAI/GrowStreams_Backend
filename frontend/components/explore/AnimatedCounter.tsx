"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  className?: string
}

export function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const motionValue = useMotionValue(value)
  const rounded = useTransform(motionValue, (latest) => Math.round(latest))

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.5,
      ease: "easeOut"
    })

    return controls.stop
  }, [value, motionValue])

  useEffect(() => {
    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest)
    })

    return unsubscribe
  }, [rounded])

  return (
    <motion.span 
      className={className}
      key={value} // Force re-render when value changes
      initial={{ scale: 1.2, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {displayValue.toLocaleString()}
    </motion.span>
  )
}
