"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Network, AlertCircle, CheckCircle } from 'lucide-react'
// Auth removed for public mode
import { ensureEthersAvailable, createProvider } from '@/utils/ethers-utils'
import { switchToBaseCampNetwork, BASE_CAMP_CHAIN_ID, isMobileDevice } from '@/utils/network-utils'

interface NetworkStatusProps {
  className?: string
}

export function NetworkStatus({ className = "" }: NetworkStatusProps) {
  // Public mode: show a static "Demo Mode" status
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 text-sm text-green-500 ${className}`}
    >
      <CheckCircle className="w-4 h-4" />
      <span>Demo Mode</span>
    </motion.div>
  )
}
