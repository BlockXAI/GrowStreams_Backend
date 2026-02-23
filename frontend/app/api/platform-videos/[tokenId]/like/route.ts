import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params
    const walletAddress = request.headers.get('x-wallet-address')

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 401 }
      )
    }

    console.log('❤️ Platform Video Like API: Processing like for token', { tokenId, walletAddress })

    // Get the platform video by token ID
    const platformVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    if (!platformVideo) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // For now, directly update the likes count in platform_videos table
    // since the video_likes table doesn't exist yet
    const { createClient } = await import('@/utils/supabase/server')
    const { cookies } = await import('next/headers')
    
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    // For now, always increment likes since we can't track individual user likes
    // In production, you'd want to check the video_likes table to toggle likes
    const currentLikes = platformVideo.likes_count || 0
    const newLikeCount = currentLikes + 1
    
    // Increment likes count
    const { error: updateError } = await supabase
      .from('platform_videos')
      .update({ 
        likes_count: newLikeCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', platformVideo.id)
    
    if (updateError) {
      console.error('Error updating likes count:', updateError)
      throw new Error('Failed to update likes count')
    }
    
    const result = { liked: true }
    const updatedStats = {
      views: platformVideo.views_count || 0,
      likes: newLikeCount,
      shares: platformVideo.shares_count || 0,
      tips: platformVideo.tips_count || 0
    }

    return NextResponse.json({
      success: true,
      isLiked: result.liked,
      likeCount: updatedStats?.likes || 0,
      message: result.liked ? 'Video liked successfully' : 'Video unliked successfully'
    })

  } catch (error) {
    console.error('❌ Platform Video Like API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process like' },
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
    const walletAddress = request.headers.get('x-wallet-address')

    // Get the platform video by token ID
    const platformVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    if (!platformVideo) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // Check if user has liked this video
    let isLiked = false
    if (walletAddress) {
      isLiked = await PlatformVideoService.hasUserLikedVideo(platformVideo.id, walletAddress)
    }

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount: platformVideo.likes_count
    })

  } catch (error) {
    console.error('❌ Platform Video Like API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get like status' },
      { status: 500 }
    )
  }
}
