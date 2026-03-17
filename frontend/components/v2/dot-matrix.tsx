"use client"

import React, { useRef, useEffect } from "react"

interface DotMatrixProps {
  color?: string
  dotSize?: number
  gap?: number
  fadeEdge?: boolean
  className?: string
}

export function DotMatrix({
  color = "#0061ff",
  dotSize = 2,
  gap = 8,
  fadeEdge = true,
  className = "",
}: DotMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = parent.offsetWidth
      const h = parent.offsetHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)

      const step = dotSize + gap
      const cx = w / 2
      const cy = h / 2
      const maxDist = Math.sqrt(cx * cx + cy * cy)

      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)

      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          const dx = x - cx
          const dy = y - cy
          const dist = Math.sqrt(dx * dx + dy * dy)

          // Create organic shape — denser toward center-right
          const normalizedDist = dist / maxDist
          const shapeNoise = Math.sin(x * 0.008) * Math.cos(y * 0.006) * 0.5 + 0.5
          const rightBias = (x / w) * 0.4

          let opacity = 0
          if (normalizedDist < 0.7) {
            opacity = (1 - normalizedDist / 0.7) * 0.35
            opacity *= shapeNoise
            opacity += rightBias * 0.15
          } else {
            opacity = shapeNoise * 0.08
          }

          if (fadeEdge) {
            const edgeFadeX = Math.min(x / (w * 0.15), (w - x) / (w * 0.15), 1)
            const edgeFadeY = Math.min(y / (h * 0.15), (h - y) / (h * 0.15), 1)
            opacity *= Math.min(edgeFadeX, edgeFadeY)
          }

          if (opacity > 0.01) {
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`
            ctx.beginPath()
            ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }

    draw()
    window.addEventListener("resize", draw)
    return () => window.removeEventListener("resize", draw)
  }, [color, dotSize, gap, fadeEdge])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  )
}
