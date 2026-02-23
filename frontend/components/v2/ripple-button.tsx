"use client"

import React, { useState } from "react"

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

interface RippleButtonProps {
  children: React.ReactNode
  className?: string
  rippleColor?: string
  onClick?: () => void
}

export function RippleButton({
  children,
  className = "",
  rippleColor = "rgba(255, 255, 255, 0.3)",
  onClick,
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    const id = Date.now()

    setRipples((prev) => [...prev, { id, x, y, size }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)

    onClick?.()
  }

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple-expand pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple-expand {
          0% {
            transform: scale(0);
            opacity: 0.6;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        .animate-ripple-expand {
          animation: ripple-expand 0.6s ease-out forwards;
        }
      `}</style>
    </button>
  )
}
