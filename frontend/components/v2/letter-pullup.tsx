"use client"

import React from "react"
import { motion, useInView } from "framer-motion"

interface LetterPullupProps {
  text: string
  className?: string
  delay?: number
}

export function LetterPullup({
  text,
  className = "",
  delay = 0,
}: LetterPullupProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true })
  const letters = text.split("")

  return (
    <span ref={ref} className={`inline-flex ${className}`}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: 100, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.04,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </span>
  )
}
