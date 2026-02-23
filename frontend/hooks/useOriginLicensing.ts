import { useState } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { toast } from 'sonner'
import { LicenseTerms } from '@/types/explore'

export function useOriginLicensing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { origin, isAuthenticated, walletAddress } = useAuth()

  const buyLicense = async (tokenId: string, periods: number): Promise<boolean> => {
    if (!isAuthenticated || !origin) {
      setError('Please connect your wallet first')
      return false
    }

    if (periods <= 0) {
      setError('Number of periods must be greater than 0')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      console.log('💳 Purchasing license:', {
        tokenId,
        periods,
        wallet: walletAddress
      })

      // Get license terms from Origin Protocol
      const terms = await origin.getTerms(BigInt(tokenId))
      console.log('📋 License terms:', terms)

      // Calculate total cost
      const totalCost = terms.price * BigInt(periods)
      
      // Buy access using Origin Protocol
      const result = await origin.buyAccessSmart(BigInt(tokenId), periods)
      console.log('✅ License purchase result:', result)

      toast.success(`Successfully purchased ${periods} period(s) license!`)
      
      // Track purchase in our backend
      await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          periods,
          totalCost: totalCost.toString(),
          purchaser: walletAddress,
          timestamp: new Date().toISOString()
        })
      })

      return true
    } catch (err) {
      console.error('Failed to buy license:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to purchase license'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const hasAccess = async (tokenId: string, userAddress?: string): Promise<boolean> => {
    if (!origin) return false

    try {
      const address = userAddress || walletAddress
      if (!address) return false

      const hasAccessResult = await (origin as any).hasAccess(BigInt(tokenId), address)
      return hasAccessResult
    } catch (error) {
      console.error('Failed to check access:', error)
      return false
    }
  }

  const getLicenseTerms = async (tokenId: string): Promise<LicenseTerms | null> => {
    if (!origin) return null

    try {
      const terms = await origin.getTerms(BigInt(tokenId))
      return {
        price: terms.price,
        duration: terms.duration,
        royaltyBps: terms.royaltyBps,
        paymentToken: terms.paymentToken
      }
    } catch (error) {
      console.error('Failed to get license terms:', error)
      return null
    }
  }

  const getSubscriptionExpiry = async (tokenId: string, userAddress?: string): Promise<Date | null> => {
    if (!origin) return null

    try {
      const address = userAddress || walletAddress
      if (!address) return null

      const expiry = await (origin as any).subscriptionExpiry(BigInt(tokenId), address)
      return new Date(Number(expiry) * 1000)
    } catch (error) {
      console.error('Failed to get subscription expiry:', error)
      return null
    }
  }

  const renewAccess = async (tokenId: string, periods: number): Promise<boolean> => {
    if (!isAuthenticated || !origin) {
      setError('Please connect your wallet first')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const result = await (origin as any).renewAccess(BigInt(tokenId), periods, walletAddress)
      console.log('✅ License renewal result:', result)

      toast.success(`Successfully renewed license for ${periods} period(s)!`)
      return true
    } catch (err) {
      console.error('Failed to renew license:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to renew license'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    buyLicense,
    hasAccess,
    getLicenseTerms,
    getSubscriptionExpiry,
    renewAccess,
    loading,
    error,
    clearError: () => setError(null)
  }
}