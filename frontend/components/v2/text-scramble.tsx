"use client"

import React, { useEffect, useState, useRef } from "react"
import { useInView } from "framer-motion"

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"

interface TextScrambleProps {
  text: string
  className?: string
  speed?: number
  scrambleDuration?: number
  delay?: number
  once?: boolean
}

export function TextScramble({
  text,
  className = "",
  speed = 30,
  scrambleDuration = 1500,
  delay = 0,
  once = true,
}: TextScrambleProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once })
  const [display, setDisplay] = useState("")
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!isInView || started) return

    const timeout = setTimeout(() => {
      setStarted(true)
      const chars = text.split("")
      const resolveAt = chars.map(
        (_, i) => delay + (scrambleDuration * (i / chars.length)) + Math.random() * 200
      )
      const startTime = Date.now()

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        let result = ""
        let allDone = true

        for (let i = 0; i < chars.length; i++) {
          if (chars[i] === " ") {
            result += " "
          } else if (elapsed >= resolveAt[i]) {
            result += chars[i]
          } else {
            result += CHARS[Math.floor(Math.random() * CHARS.length)]
            allDone = false
          }
        }

        setDisplay(result)
        if (allDone) clearInterval(interval)
      }, speed)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timeout)
  }, [isInView, started, text, speed, scrambleDuration, delay])

  useEffect(() => {
    if (!started) {
      setDisplay(text.replace(/[^ ]/g, " "))
    }
  }, [text, started])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
