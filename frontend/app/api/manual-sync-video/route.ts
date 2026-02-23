import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let step = 'initialization'
  
  try {
    console.log('🔧 Manual Video Sync API: Starting manual video sync...')
    
    step = 'parsing_request_body'
    const body = await request.json()
    const { 
      tokenId, 
      transactionHash, 
      creatorWallet
    } = body

    console.log('📋 Manual Video Sync API: Received data:', {
      tokenId,
      transactionHash,
      creatorWallet: creatorWallet?.toLowerCase()
    })

    // Validate required fields
    step = 'validating_required_fields'
    const missingFields = []
    if (!tokenId) missingFields.push('tokenId')
    if (!creatorWallet) missingFields.push('creatorWallet')
    
    if (missingFields.length > 0) {
      console.error('❌ Manual Video Sync API: Missing required fields:', missingFields)
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          step,
          receivedFields: Object.keys(body)
        },
        { status: 400 }
      )
    }

    // Normalize wallet address
    const normalizedWallet = creatorWallet.toLowerCase()
    console.log('🔍 Manual Video Sync API: Normalized wallet address:', normalizedWallet)

    // Check if creator has a platform profile
    step = 'checking_profile_exists'
    console.log('🔍 Manual Video Sync API: Checking if profile exists for wallet:', normalizedWallet)
    const hasProfile = await PlatformVideoService.hasProfile(normalizedWallet)
    
    console.log('🔍 Manual Video Sync API: Profile check result:', { hasProfile, wallet: normalizedWallet })
    
    if (!hasProfile) {
      console.warn('⚠️ Manual Video Sync API: Creator has no platform profile')
      return NextResponse.json({
        success: false,
        message: 'Creator must create a platform profile first before syncing videos',
        synced: false,
        step,
        action_required: 'Create a platform profile at /profile',
        wallet_checked: normalizedWallet
      }, { status: 400 })
    }

    // Check if video already exists to avoid duplicates
    step = 'checking_duplicate_video'
    console.log('🔍 Manual Video Sync API: Checking for existing video with token ID:', tokenId)
    const existingVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    
    console.log('🔍 Manual Video Sync API: Existing video check result:', { existingVideo: !!existingVideo })
    
    if (existingVideo) {
      console.log('ℹ️ Manual Video Sync API: Video already exists in platform')
      return NextResponse.json({
        success: true,
        message: 'Video already synced to platform',
        synced: true,
        video: existingVideo,
        step
      })
    }

    // Try to fetch video metadata from blockchain/IPFS
    step = 'fetching_video_metadata'
    console.log('🔗 Manual Video Sync API: Fetching video metadata for token ID:', tokenId)
    
    try {
      // For manual sync, we'll create a basic video record with minimal data
      // The user can update it later through the platform
      const platformVideo = await PlatformVideoService.createPlatformVideo({
        creatorWallet: normalizedWallet,
        tokenId,
        transactionHash: transactionHash || 'manual-sync',
        contractAddress: '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1',
        title: `Video #${tokenId.slice(-8)}`, // Use last 8 chars of token ID as temp title
        description: 'Video synced manually - please update title and description',
        tags: ['manual-sync'],
        videoUrl: '', // To be updated by user
        thumbnailUrl: '', // To be updated by user
        commercialRights: true,
        derivativeRights: false
      })

      const duration = Date.now() - startTime
      console.log('✅ Manual Video Sync API: Platform video created successfully!')
      console.log('✅ Manual Video Sync API: Created video details:', {
        id: platformVideo.id,
        title: platformVideo.title,
        creator: platformVideo.creator_wallet,
        tokenId: platformVideo.token_id,
        duration: `${duration}ms`
      })

      return NextResponse.json({
        success: true,
        message: 'Video successfully synced to platform (manual). Please update title, description, and media URLs.',
        synced: true,
        video: platformVideo,
        step,
        duration: `${duration}ms`,
        action_required: 'Update video details in your profile'
      })
    } catch (dbError) {
      console.error('❌ Manual Video Sync API: Database error:', dbError)
      throw dbError
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ Manual Video Sync API: Error at step:', step)
    console.error('❌ Manual Video Sync API: Error details:', error)
    console.error('❌ Manual Video Sync API: Error occurred after:', `${duration}ms`)
    
    if (error instanceof Error) {
      console.error('❌ Manual Video Sync API: Error message:', error.message)
      console.error('❌ Manual Video Sync API: Error stack:', error.stack)
    }
    
    return NextResponse.json({
      success: false,
      message: 'Manual video sync failed',
      synced: false,
      error: error instanceof Error ? error.message : 'Unknown sync error',
      step,
      duration: `${duration}ms`
    }, { status: 500 })
  }
}