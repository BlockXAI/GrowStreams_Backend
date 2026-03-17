"use client"

import { useEffect, useState, useRef } from "react"
import { useInView } from "framer-motion"

interface CodeTypingProps {
  code: string
  className?: string
  speed?: number
  delay?: number
}

export function CodeTyping({ code, className = "", speed = 20, delay = 200 }: CodeTypingProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [displayedChars, setDisplayedChars] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!isInView || started) return
    const timeout = setTimeout(() => {
      setStarted(true)
    }, delay)
    return () => clearTimeout(timeout)
  }, [isInView, started, delay])

  useEffect(() => {
    if (!started) return
    if (displayedChars >= code.length) return
    const timer = setTimeout(() => {
      setDisplayedChars((prev) => Math.min(prev + 1, code.length))
    }, speed)
    return () => clearTimeout(timer)
  }, [started, displayedChars, code.length, speed])

  return (
    <pre ref={ref} className={className}>
      <code className="text-emerald-400 font-mono">
        {code.slice(0, displayedChars)}
        {displayedChars < code.length && started && (
          <span className="inline-block w-[6px] h-[14px] bg-emerald-400 animate-pulse ml-px align-middle" />
        )}
      </code>
    </pre>
  )
}
