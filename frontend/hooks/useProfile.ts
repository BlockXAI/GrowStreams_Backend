import { useState, useEffect, useCallback } from 'react'
import { Profile } from '@/lib/supabase'

interface UseProfileReturn {
  profile: Profile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createProfile: (data: any) => Promise<boolean>
}

// Profile cache for instant recognition
const profileCache = new Map<string, { profile: Profile | null, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useProfile(identifier?: string): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize with cached profile if available
  useEffect(() => {
    if (!identifier) return

    // Check localStorage for profile cache
    try {
      const cached = localStorage.getItem(`profile_${identifier}`)
      if (cached) {
        const { profile: cachedProfile, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log('🚀 useProfile: Using cached profile for instant recognition')
          setProfile(cachedProfile)
        }
      }
    } catch (err) {
      console.warn('Failed to load cached profile:', err)
    }
  }, [identifier])

  const fetchProfile = useCallback(async () => {
    if (!identifier) {
      console.log('🔍 useProfile: No identifier provided')
      setProfile(null)
      setError(null)
      return
    }

    console.log('🔍 useProfile: Fetching profile for identifier:', identifier)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profile/${identifier}`)
      const data = await response.json()
      
      console.log('🔍 useProfile: API response:', {
        status: response.status,
        success: data.success,
        profile: data.profile,
        error: data.error
      })

      if (data.success) {
        console.log('✅ useProfile: Profile found:', data.profile)
        setProfile(data.profile)
        
        // Cache the profile for instant recognition
        try {
          localStorage.setItem(`profile_${identifier}`, JSON.stringify({
            profile: data.profile,
            timestamp: Date.now()
          }))
          profileCache.set(identifier, { profile: data.profile, timestamp: Date.now() })
        } catch (err) {
          console.warn('Failed to cache profile:', err)
        }
      } else {
        if (response.status === 404) {
          console.log('❌ useProfile: Profile not found (404)')
          setProfile(null)
          setError(null)
          
          // Cache null result to avoid repeated API calls
          try {
            localStorage.setItem(`profile_${identifier}`, JSON.stringify({
              profile: null,
              timestamp: Date.now()
            }))
            profileCache.set(identifier, { profile: null, timestamp: Date.now() })
          } catch (err) {
            console.warn('Failed to cache null profile:', err)
          }
        } else {
          console.log('❌ useProfile: API error:', data.error)
          setError(data.error || 'Failed to fetch profile')
        }
      }
    } catch (err) {
      console.error('❌ useProfile: Network error:', err)
      setError('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [identifier])

  const createProfile = useCallback(async (profileData: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': profileData.walletAddress
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (data.success) {
        // Clear cache for this identifier and refetch
        try {
          if (identifier) {
            localStorage.removeItem(`profile_${identifier}`)
            profileCache.delete(identifier)
          }
        } catch (err) {
          console.warn('Failed to clear profile cache:', err)
        }
        
        // Optimistically set the profile to show immediate feedback
        setProfile(data.profile)
        
        // Cache the new profile
        try {
          if (identifier) {
            localStorage.setItem(`profile_${identifier}`, JSON.stringify({
              profile: data.profile,
              timestamp: Date.now()
            }))
            profileCache.set(identifier, { profile: data.profile, timestamp: Date.now() })
          }
        } catch (err) {
          console.warn('Failed to cache new profile:', err)
        }
        
        // Trigger a background refetch to ensure consistency
        setTimeout(() => fetchProfile(), 1000)
        
        return true
      } else {
        throw new Error(data.error || 'Failed to create profile')
      }
    } catch (err) {
      console.error('Error creating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to create profile')
      return false
    }
  }, [fetchProfile])

  const refetch = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    refetch,
    createProfile
  }
}
