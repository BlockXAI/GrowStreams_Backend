"use client"

import React from "react"
import { motion, useInView } from "framer-motion"

interface SplitTextProps {
  text: string
  className?: string
  delay?: number
  staggerDelay?: number
  animationType?: "fade-up" | "fade-down" | "blur" | "spring"
  once?: boolean
}

export function SplitText({
  text,
  className = "",
  delay = 0,
  staggerDelay = 0.03,
  animationType = "fade-up",
  once = true,
}: SplitTextProps) {
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once, margin: "-50px" })

  const getVariants = () => {
    switch (animationType) {
      case "fade-up":
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }
      case "fade-down":
        return {
          hidden: { opacity: 0, y: -20 },
          visible: { opacity: 1, y: 0 },
        }
      case "blur":
        return {
          hidden: { opacity: 0, filter: "blur(8px)" },
          visible: { opacity: 1, filter: "blur(0px)" },
        }
      case "spring":
        return {
          hidden: { opacity: 0, y: 40, scale: 0.8 },
          visible: { opacity: 1, y: 0, scale: 1 },
        }
      default:
        return {
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }
    }
  }

  const variants = getVariants()
  const words = text.split(" ")

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-flex mr-[0.25em]">
          {word.split("").map((char, ci) => {
            const index = words.slice(0, wi).join(" ").length + ci
            return (
              <motion.span
                key={`${wi}-${ci}`}
                className="inline-block"
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={variants}
                transition={{
                  duration: 0.4,
                  delay: delay + index * staggerDelay,
                  ease: animationType === "spring" ? [0.22, 1, 0.36, 1] : "easeOut",
                }}
              >
                {char}
              </motion.span>
            )
          })}
        </span>
      ))}
    </span>
  )
}
