"use client"

import { motion } from "framer-motion"
import { Navigation } from "./navigation"

export function ProfileSkeleton() {
  return (
    <>
      <Navigation currentPage="profile" />
      
      <div className="min-h-screen bg-provn-bg">
        {/* Skeleton Header */}
        <div className="relative">
                  {/* Header Skeleton */}
        <div className="h-32 sm:h-40 bg-gradient-to-br from-provn-surface via-provn-surface/80 to-provn-surface/60 animate-pulse" />
          
          {/* Profile Content Container */}
          <div className="max-w-4xl mx-auto px-4">
            {/* Profile Header Skeleton */}
            <div className="relative -mt-16 sm:-mt-20">
              <div className="flex flex-col sm:flex-row items-start gap-8">
                {/* Avatar Skeleton */}
                <motion.div 
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-provn-surface animate-pulse"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
                
                {/* Profile Info Skeleton */}
                <div className="flex-1 space-y-4 sm:mb-6">
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                  >
                    <div className="h-8 sm:h-10 bg-provn-surface rounded-lg w-48 sm:w-64 animate-pulse" />
                    <div className="h-5 bg-provn-surface rounded w-32 animate-pulse" />
                  </motion.div>
                  
                  {/* Wallet Address Skeleton */}
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  >
                    <div className="h-4 bg-provn-surface rounded w-32 animate-pulse" />
                    <div className="flex gap-1">
                      <div className="w-6 h-6 bg-provn-surface rounded animate-pulse" />
                      <div className="w-6 h-6 bg-provn-surface rounded animate-pulse" />
                    </div>
                  </motion.div>
                </div>
                
                {/* Action Button Skeleton */}
                <motion.div 
                  className="flex gap-2 self-start sm:self-end"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                >
                  <div className="h-10 bg-provn-surface rounded-lg w-24 animate-pulse" />
                </motion.div>
              </div>
              
              {/* Bio Skeleton */}
              <motion.div 
                className="mt-4 sm:mt-6 space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
              >
                <div className="h-4 bg-provn-surface rounded w-full animate-pulse" />
                <div className="h-4 bg-provn-surface rounded w-3/4 animate-pulse" />
              </motion.div>
              
              {/* Stats Row Skeleton */}
              <motion.div 
                className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
              >
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="text-center space-y-2">
                    <div className="h-6 sm:h-8 bg-provn-surface rounded w-12 mx-auto animate-pulse" />
                    <div className="h-4 bg-provn-surface rounded w-16 mx-auto animate-pulse" />
                  </div>
                ))}
              </motion.div>
              
              {/* Joined Date Skeleton */}
              <motion.div 
                className="mt-6 flex items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
              >
                <div className="w-4 h-4 bg-provn-surface rounded animate-pulse" />
                <div className="h-4 bg-provn-surface rounded w-32 animate-pulse" />
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Content Tabs Skeleton */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Tab Navigation Skeleton */}
          <motion.div 
            className="flex border-b border-provn-border mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
          >
            <div className="px-4 py-2">
              <div className="h-5 bg-provn-surface rounded w-16 animate-pulse" />
            </div>
            <div className="px-4 py-2">
              <div className="h-5 bg-provn-surface rounded w-16 animate-pulse" />
            </div>
            <div className="px-4 py-2">
              <div className="h-5 bg-provn-surface rounded w-20 animate-pulse" />
            </div>
          </motion.div>

          {/* Tab Content Skeleton */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
          >
            <div className="text-center py-12 space-y-4">
              <div className="h-6 bg-provn-surface rounded w-32 mx-auto animate-pulse" />
              <div className="h-10 bg-provn-surface rounded w-40 mx-auto animate-pulse" />
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
