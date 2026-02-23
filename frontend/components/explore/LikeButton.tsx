"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedCounter } from "./AnimatedCounter"

interface LikeButtonProps {
  isLiked: boolean
  likeCount: number
  onLike: () => Promise<void>
  isAuthenticated: boolean
}

export function LikeButton({ isLiked, likeCount, onLike, isAuthenticated }: LikeButtonProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  const handleLikeClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isAuthenticated) return

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newRipple = { id: Date.now(), x, y }
    
    setRipples(prev => [...prev, newRipple])
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)

    // Call the like function
    await onLike()
  }

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      onClick={handleLikeClick}
      disabled={!isAuthenticated}
      className={`flex flex-col items-center gap-1 relative overflow-hidden transition-all duration-200 ${
        !isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'
      }`}
    >
      <motion.div 
        className={`p-3 rounded-full transition-all duration-300 relative ${
          isLiked 
            ? 'bg-red-500/20 border-2 border-red-500' 
            : 'bg-black/20 border-2 border-white/20 hover:bg-black/40'
        }`}
        animate={{
          scale: isLiked ? [1, 1.2, 1] : 1,
          rotate: isLiked ? [0, -10, 10, 0] : 0
        }}
        transition={{
          duration: 0.6,
          ease: "easeInOut"
        }}
      >
        {/* Ripple effects */}
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              className="absolute w-12 h-12 bg-red-400/20 rounded-full pointer-events-none"
              style={{
                left: ripple.x - 24,
                top: ripple.y - 24,
              }}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>

        <motion.div
          animate={{
            scale: isLiked ? [1, 1.3, 1] : 1,
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
          className="relative"
        >
          <Heart 
            className={`w-6 h-6 transition-all duration-300 ${
              isLiked ? 'text-red-500 fill-red-500' : 'text-white'
            }`} 
          />
        </motion.div>
        
        {/* Floating hearts animation when liked */}
        {isLiked && (
          <>
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2 text-red-400"
              initial={{ opacity: 0, y: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], y: -15, scale: [0, 1, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              ❤️
            </motion.div>
            <motion.div
              className="absolute -top-1 -left-1 w-2 h-2 text-red-300"
              initial={{ opacity: 0, y: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], y: -12, scale: [0, 1, 0] }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
            >
              ❤️
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -right-1 w-2 h-2 text-red-200"
              initial={{ opacity: 0, y: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], y: 12, scale: [0, 1, 0] }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              ❤️
            </motion.div>
          </>
        )}
      </motion.div>
      
      <motion.div
        animate={{
          scale: isLiked ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
        className="text-white text-xs font-medium font-headline"
      >
        <AnimatedCounter 
          value={likeCount} 
          className={isLiked ? "text-red-500" : "text-white"}
        />
      </motion.div>
    </motion.button>
  )
}
