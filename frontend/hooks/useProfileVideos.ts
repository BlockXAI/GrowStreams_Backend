import { useState, useEffect, useCallback } from 'react'

export interface ProfileVideo {
  id: string
  type: 'platform' | 'blockchain'
  tokenId: string | null
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string | null
  createdAt: string
  views: number
  likes: number
  tips: number
  creator: {
    wallet: string
    handle: string | null
  }
  license: {
    price: number | null
    duration: number | null
    royalty: number | null
    paymentToken: string | null
  }
  blockchain: {
    contractAddress: string | null
    transactionHash: string | null
    blockNumber: number | null
    metadataUri: string | null
  }
}

export interface ProfileVideosStats {
  total: number
  platform: number
  blockchainOnly: number
  totalViews: number
  totalLikes: number
  totalTips: number
}

interface UseProfileVideosReturn {
  videos: ProfileVideo[]
  stats: ProfileVideosStats | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProfileVideos(identifier?: string): UseProfileVideosReturn {
  const [videos, setVideos] = useState<ProfileVideo[]>([])
  const [stats, setStats] = useState<ProfileVideosStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    if (!identifier) {
      console.log('🎥 useProfileVideos: No identifier provided')
      setVideos([])
      setStats(null)
      setError(null)
      return
    }

    console.log('🎥 useProfileVideos: Fetching videos for identifier:', identifier)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profile/${identifier}/videos`)
      const data = await response.json()
      
      console.log('🎥 useProfileVideos: API response:', {
        status: response.status,
        success: data.success,
        videoCount: data.videos?.length,
        stats: data.stats,
        error: data.error
      })

      if (data.success) {
        console.log('✅ useProfileVideos: Videos loaded:', data.videos.length)
        setVideos(data.videos || [])
        setStats(data.stats || null)
      } else {
        if (response.status === 404) {
          console.log('❌ useProfileVideos: Profile not found (404)')
          setVideos([])
          setStats(null)
          setError(null) // Don't treat 404 as an error for videos
        } else {
          console.log('❌ useProfileVideos: API error:', data.error)
          setError(data.error || 'Failed to fetch profile videos')
        }
      }
    } catch (err) {
      console.error('❌ useProfileVideos: Network error:', err)
      setError('Failed to fetch profile videos')
    } finally {
      setLoading(false)
    }
  }, [identifier])

  const refetch = useCallback(async () => {
    await fetchVideos()
  }, [fetchVideos])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  return {
    videos,
    stats,
    loading,
    error,
    refetch
  }
}