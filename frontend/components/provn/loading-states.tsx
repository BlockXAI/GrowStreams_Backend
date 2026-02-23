"use client"

import { motion } from "framer-motion"
import { Loader2, User, Sparkles } from "lucide-react"

// Professional loading spinner with brand colors
export function LoadingSpinner({ size = "default", text = "Loading..." }: { size?: "sm" | "default" | "lg", text?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} text-provn-accent`}
      >
        <Loader2 className="w-full h-full" />
      </motion.div>
      {text && (
        <motion.p 
          className="text-provn-muted font-headline text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

// Profile loading state with elegant, minimal design
export function ProfileLoadingState() {
  return (
    <div className="min-h-screen bg-provn-bg flex items-center justify-center">
      <div className="text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Elegant avatar placeholder */}
          <div className="relative mx-auto">
            <div className="w-20 h-20 mx-auto rounded-full bg-provn-surface border-2 border-provn-border/50 flex items-center justify-center">
              <User className="w-10 h-10 text-provn-muted" />
            </div>
            {/* Subtle ring animation */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-provn-accent/20"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </div>
          
          {/* Clean loading text */}
          <div className="space-y-3">
            <motion.h2 
              className="text-lg font-medium text-provn-text font-headline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Loading Profile
            </motion.h2>
            
            {/* Elegant loading indicator */}
            <div className="flex justify-center">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-provn-accent rounded-full"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 1, 0.4]
                    }}
                    transition={{ 
                      duration: 1.2, 
                      repeat: Infinity, 
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// Error state with retry functionality
export function ErrorState({ 
  title = "Something went wrong", 
  message = "We couldn't load the profile. Please try again.",
  onRetry 
}: { 
  title?: string
  message?: string
  onRetry?: () => void 
}) {
  return (
    <div className="min-h-screen bg-provn-bg flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="space-y-4"
        >
          {/* Error icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <div className="w-10 h-10 text-red-500">⚠️</div>
          </div>
          
          {/* Error text */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-provn-text font-headline">
              {title}
            </h2>
            <p className="text-provn-muted font-headline">
              {message}
            </p>
          </div>
          
          {/* Retry button */}
          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              className="px-6 py-3 bg-provn-accent hover:bg-provn-accent-press text-provn-bg rounded-lg font-medium font-headline transition-colors"
            >
              Try Again
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// Empty state for when no content exists
export function EmptyState({ 
  icon = <Sparkles className="w-12 h-12" />,
  title = "No content yet",
  message = "This profile doesn't have any content to display.",
  action 
}: { 
  icon?: React.ReactNode
  title?: string
  message?: string
  action?: React.ReactNode 
}) {
  return (
    <div className="text-center py-16 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="space-y-4"
      >
        {/* Icon */}
        <div className="text-provn-muted">
          {icon}
        </div>
        
        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-provn-text font-headline">
            {title}
          </h3>
          <p className="text-provn-muted font-headline text-sm">
            {message}
          </p>
        </div>
        
        {/* Action button */}
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {action}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
