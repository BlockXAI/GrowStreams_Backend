"use client"

import React, { useRef, useState } from "react"
import { motion } from "framer-motion"

interface MagnetButtonProps {
  children: React.ReactNode
  className?: string
  strength?: number
  radius?: number
}

export function MagnetButton({
  children,
  className = "",
  strength = 0.3,
  radius = 200,
}: MagnetButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < radius) {
      setPosition({
        x: dx * strength,
        y: dy * strength,
      })
    }
  }

  const handleLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  )
}
