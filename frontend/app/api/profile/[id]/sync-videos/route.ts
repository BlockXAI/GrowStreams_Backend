import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'
import { BlockscoutService } from '@/services/blockscout'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: identifier } = await params
    console.log('🔄 Manual Video Sync: Starting sync for identifier:', identifier)

    // Determine if identifier is wallet address or handle
    const isWalletAddress = identifier.startsWith('0x') && identifier.length === 42
    let walletAddress: string
    let profileExists = false

    if (isWalletAddress) {
      walletAddress = identifier.toLowerCase()
      profileExists = await PlatformVideoService.hasProfile(walletAddress)
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
        
        walletAddress = profileData.profile.wallet_address.toLowerCase()
        profileExists = true // If we found the profile, it exists
      } catch (error) {
        console.error('Failed to get profile for handle:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to resolve profile'
        }, { status: 500 })
      }
    }

    if (!profileExists) {
      return NextResponse.json({
        success: false,
        error: 'Cannot sync videos: Profile does not exist. Please create a profile first.',
        action_required: 'create_profile'
      }, { status: 400 })
    }

    console.log('🔄 Manual Video Sync: Profile confirmed for wallet:', walletAddress)

    // Get existing platform videos for this creator
    const existingVideosResult = await PlatformVideoService.getVideosByCreator(walletAddress, {
      includePrivate: true,
      limit: 100
    })
    
    const existingVideos = Array.isArray(existingVideosResult) 
      ? existingVideosResult 
      : existingVideosResult.videos || []
    
    const existingTokenIds = new Set(
      existingVideos.map((v: any) => v.token_id).filter(Boolean)
    )
    
    console.log('🔄 Manual Video Sync: Found existing platform videos:', existingTokenIds.size)

    // Get blockchain videos for this wallet
    const blockchainVideos = await BlockscoutService.getTokensByOwner(walletAddress)
    const potentialVideos = blockchainVideos.items || []
    
    console.log('🔄 Manual Video Sync: Found blockchain NFTs:', potentialVideos.length)

    const syncResults = []
    let syncedCount = 0
    let skippedCount = 0
    let errorCount = 0

    // Try to sync each blockchain video that's not already in platform
    for (const nft of potentialVideos) {
      try {
        if (!nft.id || existingTokenIds.has(nft.id)) {
          console.log('⏭️ Manual Video Sync: Skipping existing token:', nft.id)
          skippedCount++
          continue
        }

        // Only try to sync if it looks like a video NFT
        if (!nft.metadata?.animation_url && !nft.metadata?.image) {
          console.log('⏭️ Manual Video Sync: Skipping non-video NFT:', nft.id)
          skippedCount++
          continue
        }

        console.log('🔄 Manual Video Sync: Attempting to sync token:', nft.id)

        // Create platform video record
        const platformVideo = await PlatformVideoService.createPlatformVideo({
          creatorWallet: walletAddress,
          tokenId: nft.id,
          transactionHash: nft.transaction_hash || 'unknown',
          contractAddress: nft.token?.address || '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1',
          blockNumber: nft.block_number ? parseInt(nft.block_number) : undefined,
          mintTimestamp: nft.timestamp || new Date().toISOString(),
          metadataUri: nft.token_uri,
          title: nft.metadata?.name || `Video #${nft.id}`,
          description: nft.metadata?.description || 'Synced from blockchain',
          tags: [],
          videoUrl: nft.metadata?.animation_url || nft.metadata?.image || '',
          thumbnailUrl: nft.metadata?.image,
          commercialRights: true,
          derivativeRights: false
        })

        syncResults.push({
          tokenId: nft.id,
          status: 'synced',
          platformVideoId: platformVideo.id,
          title: platformVideo.title
        })
        
        syncedCount++
        console.log('✅ Manual Video Sync: Successfully synced token:', nft.id)

      } catch (error) {
        console.error('❌ Manual Video Sync: Failed to sync token:', nft.id, error)
        syncResults.push({
          tokenId: nft.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        errorCount++
      }
    }

    console.log('🔄 Manual Video Sync: Completed sync process:', {
      total: potentialVideos.length,
      synced: syncedCount,
      skipped: skippedCount,
      errors: errorCount
    })

    return NextResponse.json({
      success: true,
      message: `Manual sync completed: ${syncedCount} videos synced, ${skippedCount} skipped, ${errorCount} errors`,
      results: {
        total_nfts_found: potentialVideos.length,
        existing_videos: existingTokenIds.size,
        newly_synced: syncedCount,
        skipped: skippedCount,
        errors: errorCount,
        sync_details: syncResults
      }
    })

  } catch (error) {
    console.error('❌ Manual Video Sync Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Manual sync failed'
    }, { status: 500 })
  }
}