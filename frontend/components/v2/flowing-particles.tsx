"use client"

import { useEffect, useRef, useCallback } from "react"

interface FlowingParticlesProps {
  particleCount?: number
  color?: string
  speed?: number
  className?: string
}

export function FlowingParticles({
  particleCount = 60,
  color = "#10b981",
  speed = 1,
  className = "",
}: FlowingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<
    {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      life: number
      maxLife: number
    }[]
  >([])

  const initParticles = useCallback(
    (width: number, height: number) => {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.3) * speed * 1.5,
        vy: (Math.random() - 0.5) * speed * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 100,
      }))
    },
    [particleCount, speed]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }

    resize()
    initParticles(canvas.width, canvas.height)

    const animate = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.life++

        if (p.life > p.maxLife || p.x > canvas.width + 10 || p.x < -10) {
          p.x = -5
          p.y = Math.random() * canvas.height
          p.life = 0
          p.opacity = Math.random() * 0.5 + 0.1
        }

        const fadeIn = Math.min(p.life / 30, 1)
        const fadeOut = Math.max(0, 1 - (p.life - p.maxLife + 30) / 30)
        const alpha = p.opacity * fadeIn * fadeOut

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, "0")
        ctx.fill()

        // Draw faint trail
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * 8, p.y - p.vy * 8)
        ctx.strokeStyle = color + Math.floor(alpha * 0.3 * 255).toString(16).padStart(2, "0")
        ctx.lineWidth = p.size * 0.5
        ctx.stroke()
      })

      // Draw connections between nearby particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i]
          const b = particlesRef.current[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 80) {
            const alpha = (1 - dist / 80) * 0.1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, "0")
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    const observer = new ResizeObserver(resize)
    observer.observe(canvas.parentElement || canvas)

    return () => {
      cancelAnimationFrame(animationRef.current)
      observer.disconnect()
    }
  }, [color, initParticles])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  )
}
