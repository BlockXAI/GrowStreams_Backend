"use client"

import React from "react"

interface ShinyTextProps {
  text: string
  className?: string
  shimmerWidth?: number
  speed?: number
  color?: string
}

export function ShinyText({
  text,
  className = "",
  shimmerWidth = 100,
  speed = 3,
  color = "#10b981",
}: ShinyTextProps) {
  return (
    <span
      className={`relative inline-block ${className}`}
      style={{
        backgroundImage: `linear-gradient(
          120deg,
          rgba(255, 255, 255, 0) 30%,
          ${color}44 50%,
          rgba(255, 255, 255, 0) 70%
        )`,
        backgroundSize: `${shimmerWidth}% 100%`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "inherit",
        animation: `shiny-text-slide ${speed}s linear infinite`,
      }}
    >
      {text}
      <style jsx>{`
        @keyframes shiny-text-slide {
          0% {
            background-position: -${shimmerWidth}% 0;
          }
          100% {
            background-position: ${shimmerWidth + 100}% 0;
          }
        }
      `}</style>
    </span>
  )
}
