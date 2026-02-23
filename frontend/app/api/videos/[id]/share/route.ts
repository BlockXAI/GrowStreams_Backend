import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo (use database in production)
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
    const body = await request.json()
    const { platform, sharerAddress, timestamp } = body

    console.log('🔗 Share API: Processing share for video', { videoId, platform, sharerAddress })

    const stats = videoStats.get(videoId) || { views: 0, likes: 0, shares: 0, tips: 0 }
    const newShareCount = stats.shares + 1

    // Update stats
    videoStats.set(videoId, { ...stats, shares: newShareCount })

    console.log('🔗 Share API: Share tracked', { newShareCount, platform })

    // In production, save to database
    // await db.videoShares.create({
    //   data: {
    //     videoId,
    //     platform,
    //     sharerAddress: sharerAddress || null,
    //     timestamp: new Date(timestamp),
    //     ipAddress: request.ip
    //   }
    // })

    return NextResponse.json({
      success: true,
      shareCount: newShareCount,
      platform,
      message: `Share to ${platform} tracked successfully`
    })

  } catch (error) {
    console.error('❌ Share API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track share' },
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
    
    const stats = videoStats.get(videoId) || { views: 0, likes: 0, shares: 0, tips: 0 }

    return NextResponse.json({
      success: true,
      shareCount: stats.shares
    })

  } catch (error) {
    console.error('❌ Share API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get share count' },
      { status: 500 }
    )
  }
}