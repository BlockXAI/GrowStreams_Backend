import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params
    const walletAddress = request.headers.get('x-wallet-address')

    console.log('📊 Platform Video Stats API: Fetching stats for token', { tokenId, walletAddress })

    // Get the platform video by token ID
    const platformVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    if (!platformVideo) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      )
    }

    // For now, we can't check if user has liked this video since video_likes table doesn't exist
    // In production, you'd want to check the video_likes table
    let isLiked = false

    const stats = {
      views: platformVideo.views_count,
      likes: platformVideo.likes_count,
      shares: platformVideo.shares_count,
      tips: platformVideo.tips_count,
      isLiked
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('❌ Platform Video Stats API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch video stats' },
      { status: 500 }
    )
  }
}
