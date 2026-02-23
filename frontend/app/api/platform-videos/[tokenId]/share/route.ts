import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params
    const body = await request.json()
    const { platform, sharerAddress, timestamp } = body

    console.log('🔗 Platform Video Share API: Processing share for token', { tokenId, platform, sharerAddress })

    // Get the platform video by token ID
    const platformVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    if (!platformVideo) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // For now, directly update the shares count in platform_videos table
    // since the video_shares table doesn't exist yet
    const { createClient } = await import('@/utils/supabase/server')
    const { cookies } = await import('next/headers')
    
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    // Increment shares count
    const { error: updateError } = await supabase
      .from('platform_videos')
      .update({ 
        shares_count: (platformVideo.shares_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', platformVideo.id)
    
    if (updateError) {
      console.error('Error updating shares count:', updateError)
    }
    
    const updatedStats = {
      views: platformVideo.views_count || 0,
      likes: platformVideo.likes_count || 0,
      shares: (platformVideo.shares_count || 0) + 1,
      tips: platformVideo.tips_count || 0
    }

    return NextResponse.json({
      success: true,
      shareCount: updatedStats?.shares || 0,
      platform,
      message: `Share to ${platform} tracked successfully`
    })

  } catch (error) {
    console.error('❌ Platform Video Share API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track share' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params
    
    // Get the platform video by token ID
    const platformVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    if (!platformVideo) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      shareCount: platformVideo.shares_count
    })

  } catch (error) {
    console.error('❌ Platform Video Share API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get share count' },
      { status: 500 }
    )
  }
}
