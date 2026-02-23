"use client"

import React from "react"

interface MeteorLinesProps {
  count?: number
  className?: string
}

export function MeteorLines({ count = 12, className = "" }: MeteorLinesProps) {
  const meteors = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${Math.random() * 3 + 2}s`,
    size: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.3 + 0.1,
  }))

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {meteors.map((m) => (
        <div
          key={m.id}
          className="absolute animate-meteor"
          style={{
            left: m.left,
            top: "-5%",
            width: `${m.size}px`,
            height: `${m.size * 80}px`,
            animationDelay: m.delay,
            animationDuration: m.duration,
            opacity: m.opacity,
            background: `linear-gradient(180deg, rgba(16, 185, 129, 0.8), rgba(6, 182, 212, 0.4), transparent)`,
            borderRadius: "9999px",
            transform: "rotate(215deg)",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes meteor {
          0% {
            transform: rotate(215deg) translateX(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(215deg) translateX(-600px);
            opacity: 0;
          }
        }
        .animate-meteor {
          animation: meteor linear infinite;
        }
      `}</style>
    </div>
  )
}
