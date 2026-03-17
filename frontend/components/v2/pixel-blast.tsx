"use client"

import React, { useRef, useEffect, useCallback } from "react"

interface Pixel {
  x: number
  y: number
  originX: number
  originY: number
  size: number
  color: string
  vx: number
  vy: number
  blasted: boolean
  opacity: number
  returnSpeed: number
}

interface PixelBlastProps {
  color?: string
  secondaryColor?: string
  gridGap?: number
  pixelSize?: number
  blastRadius?: number
  blastForce?: number
  className?: string
}

export function PixelBlast({
  color = "#0061ff",
  secondaryColor = "#10b981",
  gridGap = 6,
  pixelSize = 3,
  blastRadius = 150,
  blastForce = 15,
  className = "",
}: PixelBlastProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pixelsRef = useRef<Pixel[]>([])
  const animRef = useRef<number>(0)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const prevMouseRef = useRef({ x: -9999, y: -9999 })
  const isClickedRef = useRef(false)

  const hexToRgb = useCallback((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }, [])

  const buildGrid = useCallback(
    (w: number, h: number): Pixel[] => {
      const pixels: Pixel[] = []
      const step = pixelSize + gridGap
      const colors = [color, secondaryColor]

      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          const c = colors[Math.floor(Math.random() * colors.length)]
          pixels.push({
            x,
            y,
            originX: x,
            originY: y,
            size: pixelSize,
            color: c,
            vx: 0,
            vy: 0,
            blasted: false,
            opacity: Math.random() * 0.15 + 0.05,
            returnSpeed: Math.random() * 0.02 + 0.03,
          })
        }
      }
      return pixels
    },
    [color, secondaryColor, gridGap, pixelSize]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = parent.offsetWidth * dpr
      canvas.height = parent.offsetHeight * dpr
      canvas.style.width = `${parent.offsetWidth}px`
      canvas.style.height = `${parent.offsetHeight}px`
      ctx.scale(dpr, dpr)
      pixelsRef.current = buildGrid(parent.offsetWidth, parent.offsetHeight)
    }
    resize()

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      prevMouseRef.current = { ...mouseRef.current }
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }

      // Blast on fast mouse movement
      const dx = mouseRef.current.x - prevMouseRef.current.x
      const dy = mouseRef.current.y - prevMouseRef.current.y
      const speed = Math.sqrt(dx * dx + dy * dy)
      if (speed > 8) {
        blast(mouseRef.current.x, mouseRef.current.y, Math.min(speed * 0.8, blastForce))
      }
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      isClickedRef.current = true
      blast(mx, my, blastForce)
      setTimeout(() => { isClickedRef.current = false }, 100)
    }

    const blast = (mx: number, my: number, force: number) => {
      pixelsRef.current.forEach((p) => {
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < blastRadius && dist > 0) {
          const power = (1 - dist / blastRadius) * force
          const angle = Math.atan2(dy, dx)
          p.vx += Math.cos(angle) * power * (0.8 + Math.random() * 0.4)
          p.vy += Math.sin(angle) * power * (0.8 + Math.random() * 0.4)
          p.blasted = true
          p.opacity = Math.min(p.opacity + 0.4, 1)
        }
      })
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("click", handleClick)
    window.addEventListener("resize", resize)

    const animate = () => {
      if (!ctx || !canvas) return
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.offsetWidth
      const h = parent.offsetHeight
      ctx.clearRect(0, 0, w, h)

      pixelsRef.current.forEach((p) => {
        // Spring back to origin
        const dx = p.originX - p.x
        const dy = p.originY - p.y
        p.vx += dx * p.returnSpeed
        p.vy += dy * p.returnSpeed

        // Friction
        p.vx *= 0.92
        p.vy *= 0.92

        p.x += p.vx
        p.y += p.vy

        // Fade opacity back to base
        const distFromOrigin = Math.sqrt(
          (p.x - p.originX) ** 2 + (p.y - p.originY) ** 2
        )
        if (distFromOrigin < 1) {
          p.blasted = false
          p.opacity = Math.max(p.opacity - 0.005, Math.random() * 0.15 + 0.05)
        } else {
          // Brighter when displaced
          p.opacity = Math.min(0.3 + distFromOrigin * 0.005, 0.9)
        }

        const { r, g, b } = hexToRgb(p.color)

        // Glow for blasted pixels
        if (p.blasted && distFromOrigin > 3) {
          ctx.shadowBlur = 8
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.6})`
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size)

        ctx.shadowBlur = 0
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("click", handleClick)
      window.removeEventListener("resize", resize)
    }
  }, [buildGrid, hexToRgb, blastRadius, blastForce])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-auto ${className}`}
      style={{ mixBlendMode: "screen" }}
    />
  )
}
