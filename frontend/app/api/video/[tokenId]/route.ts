import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params
    
    if (!tokenId) {
      return NextResponse.json(
        { success: false, error: 'Token ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Video API: Fetching video for token ID:', tokenId)

    // Check if database service is available
    const hasDatabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!hasDatabase) {
      console.log('⚠️ Video API: Database not configured, returning mock data')
      
      // Return mock video data for development
      const mockVideoData = {
        id: `mock_${tokenId}`,
        type: 'platform' as const,
        tokenId: tokenId,
        title: `Video ${tokenId.slice(0, 8)}...`,
        description: 'This is a mock video for development purposes',
        videoUrl: `https://dweb.link/ipfs/QmNS1cycqGoFPjfW1ZEZWe5m9A7RMYmP28sv8TJQkyG5Ae`,
        thumbnailUrl: null,
        creator: {
          wallet: '0x' + tokenId.slice(0, 40),
          handle: 'mock_creator'
        },
        blockchain: {
          transactionHash: '0x' + tokenId.slice(0, 64),
          contractAddress: '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1'
        },
        stats: {
          views: 42,
          likes: 7,
          tips: 0
        },
        metadata: {
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          visibility: 'public',
          status: 'approved'
        }
      }

      return NextResponse.json({
        success: true,
        video: mockVideoData
      })
    }

    // Try to import and use the platform video service
    try {
      const { PlatformVideoService } = await import('@/services/platformVideos')
      const platformVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    
      if (platformVideo) {
        console.log('✅ Video API: Found platform video:', platformVideo.id)
        
        const videoData = {
          id: `platform_${platformVideo.id}`,
          type: 'platform' as const,
          tokenId: platformVideo.token_id,
          title: platformVideo.title,
          description: platformVideo.description || 'No description available',
          videoUrl: platformVideo.video_url,
          thumbnailUrl: platformVideo.thumbnail_url,
          creator: {
            wallet: platformVideo.creator_wallet,
            handle: platformVideo.creator?.handle
          },
          blockchain: {
            transactionHash: platformVideo.transaction_hash,
            contractAddress: platformVideo.contract_address
          },
          stats: {
            views: platformVideo.views_count || 0,
            likes: platformVideo.likes_count || 0,
            tips: platformVideo.tips_count || 0
          },
          metadata: {
            createdAt: platformVideo.uploaded_at,
            publishedAt: platformVideo.published_at,
            visibility: platformVideo.visibility,
            status: platformVideo.moderation_status
          }
        }

        return NextResponse.json({
          success: true,
          video: videoData
        })
      }

      // If not found in platform, return mock data for development
      console.log('⚠️ Video API: Video not found in database, returning mock data for token ID:', tokenId)
      
      const mockVideoData = {
        id: `mock_${tokenId}`,
        type: 'platform' as const,
        tokenId: tokenId,
        title: `Mock Video ${tokenId.slice(0, 8)}...`,
        description: 'This is a mock video for development purposes - video not found in database',
        videoUrl: `https://dweb.link/ipfs/QmNS1cycqGoFPjfW1ZEZWe5m9A7RMYmP28sv8TJQkyG5Ae`,
        thumbnailUrl: null,
        creator: {
          wallet: '0x' + tokenId.slice(0, 40),
          handle: 'mock_creator'
        },
        blockchain: {
          transactionHash: '0x' + tokenId.slice(0, 64),
          contractAddress: '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1'
        },
        stats: {
          views: 42,
          likes: 7,
          tips: 0
        },
        metadata: {
          createdAt: new Date().toISOString(),
          publishedAt: new Date().toISOString(),
          visibility: 'public',
          status: 'approved'
        }
      }

      return NextResponse.json({
        success: true,
        video: mockVideoData
      })
    } catch (dbError) {
      console.error('❌ Database service error:', dbError)
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      )
    }

  } catch (error) {
    console.error('❌ Video API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch video' 
      },
      { status: 500 }
    )
  }
}