import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo (use database in production)
const videoViews = new Map<string, Set<string>>()
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
    const { viewerAddress, timestamp } = body

    console.log('👁️ View API: Processing view for video', { videoId, viewerAddress })

    // Get current views for video
    if (!videoViews.has(videoId)) {
      videoViews.set(videoId, new Set())
    }

    const views = videoViews.get(videoId)!
    const stats = videoStats.get(videoId) || { views: 0, likes: 0, shares: 0, tips: 0 }

    // Create a unique view identifier
    const viewId = viewerAddress || `anonymous_${Date.now()}_${Math.random()}`
    
    // Only increment if this viewer hasn't viewed recently (prevent spam)
    const hasRecentView = views.has(viewId)
    
    if (!hasRecentView) {
      views.add(viewId)
      const newViewCount = stats.views + 1
      
      // Update stats
      videoStats.set(videoId, { ...stats, views: newViewCount })

      console.log('👁️ View API: View counted', { newViewCount })

      // In production, save to database with rate limiting
      // await db.videoViews.create({
      //   data: {
      //     videoId,
      //     viewerAddress: viewerAddress || null,
      //     timestamp: new Date(timestamp),
      //     ipAddress: request.ip,
      //     userAgent: request.headers.get('user-agent')
      //   }
      // })

      return NextResponse.json({
        success: true,
        viewCount: newViewCount,
        message: 'View tracked successfully'
      })
    } else {
      return NextResponse.json({
        success: true,
        viewCount: stats.views,
        message: 'View already tracked recently'
      })
    }

  } catch (error) {
    console.error('❌ View API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track view' },
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
      viewCount: stats.views
    })

  } catch (error) {
    console.error('❌ View API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get view count' },
      { status: 500 }
    )
  }
}