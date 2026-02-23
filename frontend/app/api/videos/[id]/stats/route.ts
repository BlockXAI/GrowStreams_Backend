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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params
    const walletAddress = request.headers.get('x-wallet-address')

    console.log('📊 Stats API: Fetching stats for video', { videoId, walletAddress })

    const stats = videoStats.get(videoId) || { views: 0, likes: 0, shares: 0, tips: 0 }
    const likes = videoLikes.get(videoId) || new Set()
    const isLiked = walletAddress ? likes.has(walletAddress) : false

    // In production, query from database
    // const stats = await db.videoStats.findUnique({
    //   where: { videoId },
    //   include: {
    //     likes: walletAddress ? { where: { walletAddress } } : false,
    //     _count: {
    //       select: {
    //         views: true,
    //         likes: true,
    //         shares: true,
    //         tips: true
    //       }
    //     }
    //   }
    // })

    return NextResponse.json({
      success: true,
      stats: {
        views: stats.views,
        likes: stats.likes,
        shares: stats.shares,
        tips: stats.tips,
        isLiked
      }
    })

  } catch (error) {
    console.error('❌ Stats API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch video stats' },
      { status: 500 }
    )
  }
}