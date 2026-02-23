import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { createMockSupabaseClient } from '@/utils/supabase/mock'
import { cookies } from 'next/headers'

// GET - Fetch analytics data for a profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Profile identifier is required' },
        { status: 400 }
      )
    }

    // Use admin client to ensure full database access
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : (createMockSupabaseClient() as any)
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Failed to create database client' },
        { status: 500 }
      )
    }

    let profileAddress: string

    // Check if id is a wallet address (0x...)
    if (id.startsWith('0x') && id.length === 42) {
      profileAddress = id.toLowerCase()
    } else {
      // Assume it's a handle, get the wallet address
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('handle', id.toLowerCase())
        .single()

      if (profileError) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        )
      }
      profileAddress = profile.wallet_address
    }

    // Get videos count from platform_videos table
    const { count: videosCount, error: videosError } = await supabase
      .from('platform_videos')
      .select('*', { count: 'exact', head: true })
      .eq('creator_wallet', profileAddress)

    if (videosError) {
      console.error('Error fetching videos count:', videosError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch videos count' },
        { status: 500 }
      )
    }

    // Get total views from platform_videos table
    const { data: videosData, error: videosDataError } = await supabase
      .from('platform_videos')
      .select('views_count, likes_count, tips_count, tips_total_amount')
      .eq('creator_wallet', profileAddress)

    if (videosDataError) {
      console.error('Error fetching videos data:', videosDataError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch videos data' },
        { status: 500 }
      )
    }

  const totalViews = (videosData as any[])?.reduce((sum: number, video: any) => sum + (video.views_count || 0), 0) || 0
  const totalLikes = (videosData as any[])?.reduce((sum: number, video: any) => sum + (video.likes_count || 0), 0) || 0
  const totalTips = (videosData as any[])?.reduce((sum: number, video: any) => sum + (video.tips_count || 0), 0) || 0
  const totalTipsAmount = (videosData as any[])?.reduce((sum: number, video: any) => sum + parseFloat(video.tips_total_amount || '0'), 0) || 0

    // For now, set total earnings to tips amount since that's what we track
    const totalEarnings = totalTipsAmount

    // Get total licenses (not available in current schema, set to 0)
    const licensesCount = 0

    // Get content performance metrics
    const { data: performanceData, error: performanceError } = await supabase
      .from('platform_videos')
      .select('views_count, tips_count')
      .eq('creator_wallet', profileAddress)

    if (performanceError) {
      console.error('Error fetching performance data:', performanceError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch performance data' },
        { status: 500 }
      )
    }

    const videoCount = videosCount || 0
    const avgViewsPerVideo = videoCount > 0 ? Math.round(totalViews / videoCount) : 0
    const avgTipsPerVideo = videoCount > 0 ? Math.round(totalTips / videoCount) : 0
    const avgEarningsPerVideo = videoCount > 0 ? Math.round(totalEarnings / videoCount) : 0

    // Get top performing videos
    const { data: topVideos, error: topVideosError } = await supabase
      .from('platform_videos')
      .select('id, title, uploaded_at, views_count, tips_count, tips_total_amount')
      .eq('creator_wallet', profileAddress)
      .order('views_count', { ascending: false })
      .limit(4)

    if (topVideosError) {
      console.error('Error fetching top videos:', topVideosError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch top videos' },
        { status: 500 }
      )
    }

    // Format top videos data
  const formattedTopVideos = (topVideos as any[])?.map((video: any, index: number) => ({
      rank: index + 1,
      title: video.title,
      type: 'Video',
      date: new Date(video.uploaded_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      views: video.views_count?.toLocaleString() || '0',
      tips: video.tips_count?.toString() || '0',
      licenses: '0' // Not tracked in current schema
    })) || []

    console.log(`📊 Analytics for ${profileAddress}:`, {
      videoCount,
      totalViews,
      totalLikes,
      totalTips,
      totalTipsAmount,
      avgTipsPerVideo
    })

    return NextResponse.json({
      success: true,
      data: {
        // Overview stats
        ipnfts: videoCount, // All videos are IP-NFTs
        views: totalViews,
        likes: totalLikes,
        tips: totalTips,
        wCAMP: totalTipsAmount, // Use tips amount as wCAMP earnings
        licenses: 0, // Not tracked in current schema
        
        // Content performance
        avgViewsPerVideo,
        avgTipsPerVideo,
        licenseConversionRate: 0, // Not tracked in current schema
        avgEarningsPerVideo,
        
        // Top performing videos
        topVideos: formattedTopVideos
      }
    })

  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
