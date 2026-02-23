import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params
    const body = await request.json()
    const { viewerAddress, timestamp } = body

    console.log('👁️ Platform Video View API: Processing view for token', { tokenId, viewerAddress })

    // Get the platform video by token ID
    const platformVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    if (!platformVideo) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // For now, directly update the views count in platform_videos table
    // since the video_views table doesn't exist yet
    const { createClient } = await import('@/utils/supabase/server')
    const { cookies } = await import('next/headers')
    
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    // Increment views count
    const { error: updateError } = await supabase
      .from('platform_videos')
      .update({ 
        views_count: (platformVideo.views_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', platformVideo.id)
    
    if (updateError) {
      console.error('Error updating views count:', updateError)
    }
    
    // Get updated stats
    const updatedStats = {
      views: (platformVideo.views_count || 0) + 1,
      likes: platformVideo.likes_count || 0,
      shares: platformVideo.shares_count || 0,
      tips: platformVideo.tips_count || 0
    }

    return NextResponse.json({
      success: true,
      viewCount: updatedStats?.views || 0,
      message: 'View tracked successfully'
    })

  } catch (error) {
    console.error('❌ Platform Video View API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track view' },
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
      viewCount: platformVideo.views_count
    })

  } catch (error) {
    console.error('❌ Platform Video View API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get view count' },
      { status: 500 }
    )
  }
}
