"use client"

import React, { useRef, useEffect } from "react"

interface AnimatedGridProps {
  className?: string
  gridSize?: number
  color?: string
  pulseSpeed?: number
}

export function AnimatedGrid({
  className = "",
  gridSize = 40,
  color = "#10b981",
  pulseSpeed = 2,
}: AnimatedGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.offsetWidth
      canvas.height = parent.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return { r, g, b }
    }

    let time = 0
    const { r, g, b } = hexToRgb(color)

    const animate = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      time += 0.01 * pulseSpeed

      const cols = Math.ceil(canvas.width / gridSize) + 1
      const rows = Math.ceil(canvas.height / gridSize) + 1

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gridSize
          const y = j * gridSize

          // Ripple effect from center
          const cx = canvas.width / 2
          const cy = canvas.height / 2
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
          const wave = Math.sin(dist * 0.01 - time) * 0.5 + 0.5
          const alpha = wave * 0.08

          // Draw intersection dot
          ctx.beginPath()
          ctx.arc(x, y, 1.5 + wave * 1, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha + 0.02})`
          ctx.fill()
        }
      }

      // Draw grid lines
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.03)`
      ctx.lineWidth = 0.5

      for (let i = 0; i <= cols; i++) {
        ctx.beginPath()
        ctx.moveTo(i * gridSize, 0)
        ctx.lineTo(i * gridSize, canvas.height)
        ctx.stroke()
      }
      for (let j = 0; j <= rows; j++) {
        ctx.beginPath()
        ctx.moveTo(0, j * gridSize)
        ctx.lineTo(canvas.width, j * gridSize)
        ctx.stroke()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [gridSize, color, pulseSpeed])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  )
}
