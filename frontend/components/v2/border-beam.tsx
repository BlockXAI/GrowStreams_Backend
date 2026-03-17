"use client"

import React from "react"

interface BorderBeamProps {
  children: React.ReactNode
  className?: string
  duration?: number
  borderWidth?: number
  colorFrom?: string
  colorTo?: string
}

export function BorderBeam({
  children,
  className = "",
  duration = 4,
  borderWidth = 1.5,
  colorFrom = "#10b981",
  colorTo = "#0061ff",
}: BorderBeamProps) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 rounded-[inherit] overflow-hidden"
        style={{ padding: borderWidth }}
      >
        <div
          className="absolute inset-[-200%] animate-border-beam"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, transparent 70%, ${colorFrom} 80%, ${colorTo} 90%, transparent 100%)`,
            animationDuration: `${duration}s`,
          }}
        />
        <div className="absolute inset-[1.5px] rounded-[inherit] bg-provn-bg/95 backdrop-blur-sm" />
      </div>
      <div className="relative z-10">{children}</div>
      <style jsx>{`
        @keyframes border-beam {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-border-beam {
          animation: border-beam linear infinite;
        }
      `}</style>
    </div>
  )
}
