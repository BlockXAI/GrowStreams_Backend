import { NextRequest, NextResponse } from 'next/server'
import { BlockscoutService } from '@/services/blockscout'
import { PlatformVideoService, VideoWithCreator } from '@/services/platformVideos'
import { ExploreVideo } from '@/types/explore'

// Mock data for development fallback
const MOCK_VIDEOS = [
  {
    tokenId: "1001",
    title: "Street Dance Revolution",
    description: "Original choreography inspired by street dance culture. Protected on-chain for IP rights. This routine combines elements from various dance styles including breakdancing, popping, and locking.",
    tags: ["dance", "original", "street", "choreography", "breakdancing"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&h=400&fit=crop",
    creator: {
      handle: "dancemaster",
      displayName: "Dance Master",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
      walletAddress: "0x1234567890123456789012345678901234567890",
      followers: 12500,
      joinedDate: "2024-01-15T00:00:00Z"
    },
    ipInfo: {
      ipnftId: "ipnft_001",
      status: "verified" as const,
      type: "original" as const,
      mintDate: "2024-02-01T00:00:00Z"
    },
    licensing: {
      price: 10,
      duration: 2629800,
      royalty: 5,
      paymentToken: "0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b"
    },
    metrics: {
      views: 45720,
      likes: 3892,
      tips: 127,
      shares: 256
    },
    isLiked: false
  },
  {
    tokenId: "1002", 
    title: "Cooking Magic",
    description: "Traditional Italian pasta recipe passed down through generations. Now immortalized as an IP-NFT with licensing for culinary schools and restaurants.",
    tags: ["cooking", "recipe", "italian", "traditional", "pasta"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=400&fit=crop",
    creator: {
      handle: "chefnonno",
      displayName: "Chef Nonno",
      avatarUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=100&h=100&fit=crop&crop=face",
      walletAddress: "0x2345678901234567890123456789012345678901",
      followers: 8340,
      joinedDate: "2024-01-20T00:00:00Z"
    },
    ipInfo: {
      ipnftId: "ipnft_002",
      status: "verified" as const,
      type: "original" as const,
      mintDate: "2024-02-05T00:00:00Z"
    },
    licensing: {
      price: 25,
      duration: 2629800,
      royalty: 10,
      paymentToken: "0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b"
    },
    metrics: {
      views: 23456,
      likes: 1892,
      tips: 89,
      shares: 143
    },
    isLiked: false
  },
  {
    tokenId: "1003",
    title: "Digital Art Process",
    description: "Step-by-step creation of a cyberpunk cityscape. This tutorial shows advanced digital painting techniques for creating atmospheric sci-fi environments.",
    tags: ["art", "digital", "tutorial", "cyberpunk", "painting"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1561736778-92e52a7769ef?w=300&h=400&fit=crop",
    creator: {
      handle: "cyberartist",
      displayName: "Cyber Artist",
      avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616c5e0e3ca?w=100&h=100&fit=crop&crop=face",
      walletAddress: "0x3456789012345678901234567890123456789012",
      followers: 15670,
      joinedDate: "2024-01-10T00:00:00Z"
    },
    ipInfo: {
      ipnftId: "ipnft_003",
      status: "verified" as const,
      type: "original" as const,
      mintDate: "2024-02-10T00:00:00Z"
    },
    licensing: {
      price: 15,
      duration: 2629800,
      royalty: 7,
      paymentToken: "0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b"
    },
    metrics: {
      views: 67890,
      likes: 5234,
      tips: 203,
      shares: 445
    },
    isLiked: false
  },
  {
    tokenId: "1004",
    title: "Music Production Beats",
    description: "Creating Lo-fi hip hop beats from scratch. This is a derivative work based on classic jazz samples, licensed for educational and commercial use.",
    tags: ["music", "lofi", "beats", "hiphop", "production"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=400&fit=crop",
    creator: {
      handle: "beatmaker_pro",
      displayName: "Beat Maker Pro",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      walletAddress: "0x4567890123456789012345678901234567890123",
      followers: 9876,
      joinedDate: "2024-01-25T00:00:00Z"
    },
    ipInfo: {
      ipnftId: "ipnft_004",
      status: "verified" as const,
      type: "derivative" as const,
      mintDate: "2024-02-15T00:00:00Z",
      parentId: "ipnft_jazz_001"
    },
    licensing: {
      price: 5,
      duration: 2629800,
      royalty: 12,
      paymentToken: "0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b"
    },
    metrics: {
      views: 34567,
      likes: 2987,
      tips: 156,
      shares: 289
    },
    isLiked: false
  },
  {
    tokenId: "1005",
    title: "Skateboard Trick Tutorial",
    description: "Perfect kickflip technique breakdown. Learn the fundamentals of this essential skateboarding trick with slow-motion analysis and pro tips.",
    tags: ["skateboarding", "tricks", "tutorial", "kickflip", "sports"],
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=300&h=400&fit=crop",
    creator: {
      handle: "skate_sensei",
      displayName: "Skate Sensei",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      walletAddress: "0x5678901234567890123456789012345678901234",
      followers: 18934,
      joinedDate: "2024-01-12T00:00:00Z"
    },
    ipInfo: {
      ipnftId: "ipnft_005",
      status: "verified" as const,
      type: "original" as const,
      mintDate: "2024-02-20T00:00:00Z"
    },
    licensing: {
      price: 8,
      duration: 2629800,
      royalty: 6,
      paymentToken: "0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b"
    },
    metrics: {
      views: 89123,
      likes: 7234,
      tips: 298,
      shares: 567
    },
    isLiked: false
  }
]

// Helper function to convert PlatformVideo to ExploreVideo format
function convertPlatformVideoToExploreVideo(platformVideo: VideoWithCreator): ExploreVideo {
  return {
    tokenId: platformVideo.token_id,
    title: platformVideo.title,
    description: platformVideo.description || 'Platform video content',
    tags: platformVideo.tags,
    videoUrl: platformVideo.video_url,
    thumbnailUrl: platformVideo.thumbnail_url || `https://picsum.photos/400/600?random=${platformVideo.token_id}`,
    creator: {
      handle: platformVideo.creator.handle,
      displayName: platformVideo.creator.display_name || platformVideo.creator.handle,
      avatarUrl: platformVideo.creator.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${platformVideo.creator.wallet_address}`,
      walletAddress: platformVideo.creator.wallet_address,
      followers: 0, // Followers count not available in current schema
      joinedDate: platformVideo.uploaded_at
    },
    ipInfo: {
      ipnftId: `ipnft_${platformVideo.token_id}`,
      status: 'verified' as const,
      type: 'original' as const,
      mintDate: platformVideo.mint_timestamp || platformVideo.uploaded_at,
      platformOrigin: true, // Mark as platform video
      transactionHash: platformVideo.transaction_hash
    },
    licensing: {
      price: platformVideo.price_per_period || 10,
      duration: platformVideo.license_duration || 2629800,
      royalty: platformVideo.royalty_percentage || 5,
      paymentToken: platformVideo.payment_token_address || "0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b"
    },
    metrics: {
      views: platformVideo.views_count,
      likes: platformVideo.likes_count,
      tips: platformVideo.tips_count,
      shares: platformVideo.shares_count
    },
    isLiked: false // Will be set based on user context
  }
}

// Helper function to convert external blockchain ProcessedVideo to ExploreVideo format
function convertBlockchainVideoToExploreVideo(processedVideo: any): ExploreVideo {
  return {
    tokenId: processedVideo.tokenId,
    title: processedVideo.metadata.name || `IP-NFT #${processedVideo.tokenId}`,
    description: processedVideo.metadata.description || 'Blockchain-verified intellectual property content',
    tags: processedVideo.metadata.attributes?.map((attr: any) => attr.value.toString()) || ['ip-nft', 'blockchain'],
    videoUrl: processedVideo.videoUrl || processedVideo.metadata.animation_url,
    thumbnailUrl: processedVideo.thumbnailUrl || processedVideo.metadata.image,
    creator: {
      handle: `creator_${processedVideo.creator.slice(-8)}`,
      displayName: processedVideo.metadata.creator || `Creator ${processedVideo.creator.slice(0, 6)}...`,
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${processedVideo.creator}`,
      walletAddress: processedVideo.creator,
      followers: Math.floor(Math.random() * 10000) + 1000,
      joinedDate: processedVideo.timestamp
    },
    ipInfo: {
      ipnftId: `ipnft_${processedVideo.tokenId}`,
      status: 'verified' as const,
      type: 'original' as const,
      mintDate: processedVideo.timestamp,
      platformOrigin: false // Mark as external blockchain video
    },
    licensing: {
      price: parseFloat(processedVideo.metadata.license_terms?.price_per_period || '10'),
      duration: 2629800, // 30 days in seconds
      royalty: 5,
      paymentToken: "0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b"
    },
    metrics: {
      views: Math.floor(Math.random() * 100000) + 1000,
      likes: Math.floor(Math.random() * 5000) + 100,
      tips: Math.floor(Math.random() * 500) + 10,
      shares: Math.floor(Math.random() * 1000) + 50
    },
    isLiked: false
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '10')
    const tag = searchParams.get('tag')
    const creator = searchParams.get('creator')
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') as 'latest' | 'popular' | 'trending' || 'latest'
    const source = searchParams.get('source') || 'platform' // 'platform', 'blockchain', 'mock', 'hybrid'
    const userWallet = searchParams.get('userWallet') // For personalized content

    console.log('🔍 Explore Feed API: Fetching videos', { 
      page, limit, tag, creator, category, sortBy, source, userWallet 
    })

    let videos: ExploreVideo[] = []
    let hasMore = false
    let actualSource = source

    switch (source) {
      case 'platform':
        try {
          console.log('🏢 Fetching platform videos from Supabase...')
          // For explore feed, include both approved and pending videos to show all platform content
          const platformData = await PlatformVideoService.getPlatformVideoFeed({
            limit,
            offset: page * limit,
            category: category || undefined,
            creatorWallet: creator || undefined,
            tags: tag ? [tag] : undefined,
            sortBy,
            includePending: true // Include pending videos in explore feed
          })

          videos = platformData.videos.map(convertPlatformVideoToExploreVideo)
          hasMore = platformData.hasMore

          // If user is authenticated, check their like status for each video
          if (userWallet) {
            for (const video of videos) {
              const platformVideo = platformData.videos.find(pv => pv.token_id === video.tokenId)
              if (platformVideo) {
                video.isLiked = await PlatformVideoService.hasUserLikedVideo(platformVideo.id, userWallet)
              }
            }
          }

          actualSource = 'platform'
          console.log('✅ Successfully fetched platform videos', {
            count: videos.length,
            hasMore
          })
        } catch (error) {
          console.error('❌ Platform video fetch failed:', error)
          // Don't fallback to mock data for platform source - return error instead
          throw new Error(`Failed to fetch platform videos: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        break

      case 'blockchain':
        try {
          console.log('🔗 Fetching external blockchain videos from BaseCAMP...')
          const blockchainData = await BlockscoutService.getVideoFeed(page, limit)
          
          if (blockchainData.videos.length > 0) {
            videos = blockchainData.videos.map(convertBlockchainVideoToExploreVideo)
            hasMore = blockchainData.hasMore
            actualSource = 'blockchain'
            
            console.log('✅ Successfully fetched blockchain videos', {
              count: videos.length,
              hasMore
            })
          } else {
            console.log('⚠️ No blockchain videos found, falling back to mock data')
            actualSource = 'mock'
            videos = [...MOCK_VIDEOS].slice(page * limit, (page + 1) * limit) as ExploreVideo[]
            hasMore = (page + 1) * limit < MOCK_VIDEOS.length
          }
        } catch (error) {
          console.error('❌ Blockchain video fetch failed:', error)
          actualSource = 'mock'
          videos = [...MOCK_VIDEOS].slice(page * limit, (page + 1) * limit) as ExploreVideo[]
          hasMore = (page + 1) * limit < MOCK_VIDEOS.length
        }
        break

      case 'hybrid':
        try {
          console.log('🔄 Fetching hybrid feed (platform + blockchain)...')
          const halfLimit = Math.ceil(limit / 2)
          
          // Fetch platform videos
          const platformData = await PlatformVideoService.getPlatformVideoFeed({
            limit: halfLimit,
            offset: page * halfLimit,
            category: category || undefined,
            creatorWallet: creator || undefined,
            tags: tag ? [tag] : undefined,
            sortBy
          })

          // Fetch external blockchain videos
          const blockchainData = await BlockscoutService.getVideoFeed(page, halfLimit)

          // Combine and shuffle
          const platformVideos = platformData.videos.map(convertPlatformVideoToExploreVideo)
          const blockchainVideos = blockchainData.videos.map(convertBlockchainVideoToExploreVideo)
          
          videos = [...platformVideos, ...blockchainVideos]
            .sort(() => Math.random() - 0.5) // Shuffle for variety
            .slice(0, limit)

          hasMore = platformData.hasMore || blockchainData.hasMore
          actualSource = 'hybrid'

          console.log('✅ Successfully fetched hybrid feed', {
            platformCount: platformVideos.length,
            blockchainCount: blockchainVideos.length,
            totalCount: videos.length,
            hasMore
          })
        } catch (error) {
          console.error('❌ Hybrid feed fetch failed:', error)
          actualSource = 'mock'
          videos = [...MOCK_VIDEOS].slice(page * limit, (page + 1) * limit) as ExploreVideo[]
          hasMore = (page + 1) * limit < MOCK_VIDEOS.length
        }
        break

      case 'mock':
      default:
        console.log('📝 Using mock data for development')
        let filteredVideos = [...MOCK_VIDEOS]

        if (tag) {
          filteredVideos = filteredVideos.filter(video => 
            video.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
          )
        }

        if (creator) {
          filteredVideos = filteredVideos.filter(video => 
            video.creator.handle.toLowerCase().includes(creator.toLowerCase()) ||
            video.creator.displayName.toLowerCase().includes(creator.toLowerCase())
          )
        }

        // Simulate pagination
        const startIndex = page * limit
        const endIndex = startIndex + limit
        const paginatedVideos = filteredVideos.slice(startIndex, endIndex)
        hasMore = endIndex < filteredVideos.length

        // Simulate some randomization for demo purposes
        videos = [...paginatedVideos].sort(() => Math.random() - 0.5) as ExploreVideo[]
        actualSource = 'mock'
        break
    }

    console.log('✅ Explore Feed API: Returning videos', {
      count: videos.length,
      hasMore,
      source: actualSource
    })

    return NextResponse.json({
      success: true,
      videos,
      hasMore,
      totalCount: videos.length,
      page,
      limit,
      source: actualSource
    })

  } catch (error) {
    console.error('❌ Explore Feed API: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}