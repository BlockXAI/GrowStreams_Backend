import { useState, useEffect, useCallback } from 'react'

interface AnalyticsData {
  // Overview stats
  ipnfts: number
  views: number
  likes: number
  tips: number
  wCAMP: number
  licenses: number
  
  // Content performance
  avgViewsPerVideo: number
  avgTipsPerVideo: number
  licenseConversionRate: number
  avgEarningsPerVideo: number
  
  // Top performing videos
  topVideos: Array<{
    rank: number
    title: string
    type: string
    date: string
    views: string
    tips: string
    licenses: string
  }>
}

interface UseAnalyticsReturn {
  data: AnalyticsData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAnalytics(profileIdentifier: string): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    if (!profileIdentifier) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/profile/${profileIdentifier}/analytics`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [profileIdentifier])

  const refetch = useCallback(async () => {
    await fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    data,
    loading,
    error,
    refetch
  }
}
