import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'
import { BlockscoutService } from '@/services/blockscout'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: identifier } = await params
    console.log('🎥 Profile Videos API: Fetching videos for:', identifier)

    // Determine if identifier is wallet address or handle
    const isWalletAddress = identifier.startsWith('0x') && identifier.length === 42
    let walletAddress: string

    if (isWalletAddress) {
      walletAddress = identifier
    } else {
      // Get wallet address from handle
      try {
        const profileResponse = await fetch(`${request.nextUrl.origin}/api/profile/${identifier}`)
        const profileData = await profileResponse.json()
        
        if (!profileData.success || !profileData.profile) {
          return NextResponse.json({
            success: false,
            error: 'Profile not found'
          }, { status: 404 })
        }
        
        walletAddress = profileData.profile.wallet_address
      } catch (error) {
        console.error('Failed to get profile for handle:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to resolve profile'
        }, { status: 500 })
      }
    }

    console.log('📋 Profile Videos API: Resolved wallet address:', walletAddress)

    // Fetch videos from both sources in parallel
    const [platformVideos, blockchainVideos] = await Promise.allSettled([
      PlatformVideoService.getVideosByCreator(walletAddress),
      BlockscoutService.getTokensByOwner(walletAddress)
    ])

    const videos: any[] = []

    // Add platform videos
    if (platformVideos.status === 'fulfilled' && platformVideos.value) {
      console.log('🔍 Raw platform videos result:', JSON.stringify(platformVideos.value, null, 2))
      
      // The service returns { videos: VideoWithCreator[], hasMore: boolean }
      const platformVideoList = platformVideos.value.videos || []
      
      console.log('🔍 Processed platform video list:', platformVideoList.length, 'videos')
      
      for (const video of platformVideoList) {
        console.log('🔍 Processing video:', {
          id: video.id,
          token_id: video.token_id,
          title: video.title,
          creator: video.creator
        })
        
        videos.push({
          id: `platform_${video.id}`,
          type: 'platform',
          tokenId: video.token_id,
          title: video.title,
          description: video.description,
          videoUrl: video.video_url,
          thumbnailUrl: video.thumbnail_url,
          createdAt: video.uploaded_at,
          views: video.views_count || 0,
          likes: video.likes_count || 0,
          tips: video.tips_count || 0,
          creator: {
            wallet: video.creator_wallet,
            handle: video.creator?.handle || null
          },
          license: {
            price: video.price_per_period,
            duration: video.license_duration,
            royalty: video.royalty_percentage,
            paymentToken: video.payment_token_address
          },
          blockchain: {
            contractAddress: video.contract_address,
            transactionHash: video.transaction_hash,
            blockNumber: video.block_number,
            metadataUri: video.metadata_uri
          }
        })
      }
    } else {
      console.warn('Platform videos fetch failed:', platformVideos.status === 'rejected' ? platformVideos.reason : 'Unknown error')
    }

    // Add blockchain videos that aren't already in platform
    if (blockchainVideos.status === 'fulfilled' && blockchainVideos.value) {
      for (const nft of blockchainVideos.value.items || []) {
        // Check if this token is already in platform videos
        const existsInPlatform = videos.some(v => v.tokenId === nft.id)
        
        if (!existsInPlatform && nft.metadata) {
          videos.push({
            id: `blockchain_${nft.id}`,
            type: 'blockchain',
            tokenId: nft.id,
            title: nft.metadata.name || `Video #${nft.id}`,
            description: nft.metadata.description || 'No description available',
            videoUrl: nft.metadata.animation_url || nft.metadata.image,
            thumbnailUrl: nft.metadata.image,
            createdAt: nft.timestamp || new Date().toISOString(),
            views: 0, // Blockchain videos don't have view counts
            likes: 0,
            tips: 0,
            creator: {
              wallet: walletAddress,
              handle: null
            },
            license: {
              price: null,
              duration: null,
              royalty: null,
              paymentToken: null
            },
            blockchain: {
              contractAddress: nft.token?.address,
              transactionHash: nft.transaction_hash,
              blockNumber: nft.block_number,
              metadataUri: nft.token_uri
            }
          })
        }
      }
    } else {
      console.warn('Blockchain videos fetch failed:', blockchainVideos.status === 'rejected' ? blockchainVideos.reason : 'Unknown error')
    }

    // Sort videos by creation date (newest first)
    videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    console.log(`✅ Profile Videos API: Found ${videos.length} total videos (${videos.filter(v => v.type === 'platform').length} platform, ${videos.filter(v => v.type === 'blockchain').length} blockchain-only)`)

    return NextResponse.json({
      success: true,
      videos,
      stats: {
        total: videos.length,
        platform: videos.filter(v => v.type === 'platform').length,
        blockchainOnly: videos.filter(v => v.type === 'blockchain').length,
        totalViews: videos.reduce((sum, v) => sum + (v.views || 0), 0),
        totalLikes: videos.reduce((sum, v) => sum + (v.likes || 0), 0),
        totalTips: videos.reduce((sum, v) => sum + (v.tips || 0), 0)
      }
    })

  } catch (error) {
    console.error('❌ Profile Videos API Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile videos'
    }, { status: 500 })
  }
}