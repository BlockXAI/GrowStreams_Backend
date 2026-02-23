import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo (use database in production)
const videoLikes = new Map<string, Set<string>>()
const videoStats = new Map<string, { views: number; likes: number; shares: number; tips: number }>()

// Initialize some demo stats
videoStats.set('1001', { views: 45720, likes: 3892, shares: 256, tips: 127 })
videoStats.set('1002', { views: 23456, likes: 1892, shares: 143, tips: 89 })
videoStats.set('1003', { views: 67890, likes: 5234, shares: 445, tips: 203 })
videoStats.set('1004', { views: 34567, likes: 2987, shares: 289, tips: 156 })
videoStats.set('1005', { views: 89123, likes: 7234, shares: 567, tips: 298 })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const walletAddress = request.headers.get('x-wallet-address')

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 401 }
      )
    }

    console.log('❤️ Like API: Processing like for video', { videoId, walletAddress })

    // Get current likes for video
    if (!videoLikes.has(videoId)) {
      videoLikes.set(videoId, new Set())
    }

    const likes = videoLikes.get(videoId)!
    const stats = videoStats.get(videoId) || { views: 0, likes: 0, shares: 0, tips: 0 }

    let isLiked: boolean
    let newLikeCount: number

    if (likes.has(walletAddress)) {
      // Unlike the video
      likes.delete(walletAddress)
      newLikeCount = Math.max(0, stats.likes - 1)
      isLiked = false
      console.log('💔 Like API: Video unliked')
    } else {
      // Like the video
      likes.add(walletAddress)
      newLikeCount = stats.likes + 1
      isLiked = true
      console.log('❤️ Like API: Video liked')
    }

    // Update stats
    videoStats.set(videoId, { ...stats, likes: newLikeCount })

    // In production, save to database
    // await db.videoInteractions.upsert({
    //   where: { videoId_walletAddress: { videoId, walletAddress } },
    //   update: { liked: isLiked, updatedAt: new Date() },
    //   create: { videoId, walletAddress, liked: isLiked }
    // })

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount: newLikeCount,
      message: isLiked ? 'Video liked successfully' : 'Video unliked successfully'
    })

  } catch (error) {
    console.error('❌ Like API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process like' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const walletAddress = request.headers.get('x-wallet-address')

    const likes = videoLikes.get(videoId) || new Set()
    const stats = videoStats.get(videoId) || { views: 0, likes: 0, shares: 0, tips: 0 }
    const isLiked = walletAddress ? likes.has(walletAddress) : false

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount: stats.likes
    })

  } catch (error) {
    console.error('❌ Like API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get like status' },
      { status: 500 }
    )
  }
}