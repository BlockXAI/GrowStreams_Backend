import { useState } from 'react'
import { useAuth } from '@campnetwork/origin/react'

export function useVideoInteractions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, walletAddress } = useAuth()

  const likeVideo = async (videoId: string, isPlatformVideo: boolean = false): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please connect your wallet first')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Use platform video API for platform videos, regular API for others
      const endpoint = isPlatformVideo ? `/api/platform-videos/${videoId}/like` : `/api/videos/${videoId}/like`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress!
        }
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to like video')
      }

      return true
    } catch (err) {
      console.error('Failed to like video:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to like video'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const viewVideo = async (videoId: string, isPlatformVideo: boolean = false): Promise<boolean> => {
    try {
      // Use platform video API for platform videos, regular API for others
      const endpoint = isPlatformVideo ? `/api/platform-videos/${videoId}/view` : `/api/videos/${videoId}/view`
      
      // Track view (doesn't require authentication)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          viewerAddress: walletAddress || null,
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()
      return data.success
    } catch (err) {
      console.error('Failed to track view:', err)
      return false
    }
  }

  const shareVideo = async (videoId: string, platform: 'twitter' | 'instagram', isPlatformVideo: boolean = false): Promise<boolean> => {
    try {
      // Use platform video API for platform videos, regular API for others
      const endpoint = isPlatformVideo ? `/api/platform-videos/${videoId}/share` : `/api/videos/${videoId}/share`
      
      // Track share
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform,
          sharerAddress: walletAddress || null,
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()
      return data.success
    } catch (err) {
      console.error('Failed to track share:', err)
      return false
    }
  }

  const getVideoStats = async (videoId: string, isPlatformVideo: boolean = false) => {
    try {
      // Use platform video API for platform videos, regular API for others
      const endpoint = isPlatformVideo ? `/api/platform-videos/${videoId}/stats` : `/api/videos/${videoId}/stats`
      
      const response = await fetch(endpoint)
      const data = await response.json()
      
      if (data.success) {
        return {
          views: data.stats.views,
          likes: data.stats.likes,
          shares: data.stats.shares,
          tips: data.stats.tips,
          isLiked: data.stats.isLiked
        }
      }
      return null
    } catch (error) {
      console.error('Failed to fetch video stats:', error)
      return null
    }
  }

  const getUserLikedVideos = async (): Promise<string[]> => {
    if (!isAuthenticated || !walletAddress) return []

    try {
      const response = await fetch(`/api/users/${walletAddress}/liked-videos`)
      const data = await response.json()
      
      return data.success ? data.likedVideos : []
    } catch (error) {
      console.error('Failed to fetch liked videos:', error)
      return []
    }
  }

  return {
    likeVideo,
    viewVideo,
    shareVideo,
    getVideoStats,
    getUserLikedVideos,
    loading,
    error,
    clearError: () => setError(null)
  }
}