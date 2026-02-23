import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let step = 'initialization'
  let body: any = {} // Initialize body variable at function scope
  
  try {
    console.log('🔄 Video Sync API: Starting post-mint video sync...')
    
    // Check content length before parsing
    const contentLength = request.headers.get('content-length')
    const MAX_CONTENT_SIZE = 10 * 1024 * 1024 // 10MB limit
    
    if (contentLength && parseInt(contentLength) > MAX_CONTENT_SIZE) {
      console.error('❌ Video Sync API: Request too large:', contentLength)
      return NextResponse.json(
        { 
          success: false, 
          error: `Request too large: ${contentLength} bytes. Maximum allowed: ${MAX_CONTENT_SIZE} bytes`,
          step: 'content_size_check'
        },
        { status: 413 }
      )
    }
    
    step = 'parsing_request_body'
    body = await request.json()
    const { 
      tokenId, 
      transactionHash, 
      creatorWallet, 
      title, 
      description, 
      tags, 
      videoUrl, 
      thumbnailUrl,
      metadataUri,
      license,
      blockNumber,
      mintTimestamp
    } = body

    // Validate and truncate large fields to prevent payload issues
    const MAX_URL_LENGTH = 2000 // URLs longer than 2KB are suspicious
    const MAX_DESCRIPTION_LENGTH = 5000 // 5KB max for description
    const MAX_TITLE_LENGTH = 200 // 200 chars max for title
    
    // Check for suspicious data URLs that might be too large
    if (videoUrl && videoUrl.startsWith('data:') && videoUrl.length > MAX_URL_LENGTH) {
      console.error('❌ Video Sync API: Video URL too large (data URL):', videoUrl.length)
      return NextResponse.json(
        { 
          success: false, 
          error: `Video URL too large: ${videoUrl.length} characters. Data URLs not supported for sync.`,
          step: 'data_validation'
        },
        { status: 413 }
      )
    }
    
    if (thumbnailUrl && thumbnailUrl.startsWith('data:') && thumbnailUrl.length > MAX_URL_LENGTH) {
      console.error('❌ Video Sync API: Thumbnail URL too large (data URL):', thumbnailUrl.length)
      return NextResponse.json(
        { 
          success: false, 
          error: `Thumbnail URL too large: ${thumbnailUrl.length} characters. Data URLs not supported for sync.`,
          step: 'data_validation'
        },
        { status: 413 }
      )
    }
    
    // Truncate large fields
    const truncatedTitle = title && title.length > MAX_TITLE_LENGTH ? title.substring(0, MAX_TITLE_LENGTH) : title
    const truncatedDescription = description && description.length > MAX_DESCRIPTION_LENGTH ? description.substring(0, MAX_DESCRIPTION_LENGTH) : description
    
    console.log('📋 Video Sync API: Received data:', {
      tokenId,
      transactionHash,
      creatorWallet: creatorWallet?.toLowerCase(),
      title: truncatedTitle?.substring(0, 50) + (truncatedTitle?.length > 50 ? '...' : ''),
      description: truncatedDescription?.substring(0, 100) + (truncatedDescription?.length > 100 ? '...' : ''),
      videoUrl: videoUrl?.substring(0, 50) + (videoUrl?.length > 50 ? '...' : ''),
      thumbnailUrl: thumbnailUrl?.substring(0, 50) + (thumbnailUrl?.length > 50 ? '...' : ''),
      metadataUri: metadataUri?.substring(0, 50) + (metadataUri?.length > 50 ? '...' : ''),
      hasLicense: !!license,
      tagsCount: Array.isArray(tags) ? tags.length : (tags ? 1 : 0),
      blockNumber,
      mintTimestamp,
      originalTitleLength: title?.length || 0,
      originalDescriptionLength: description?.length || 0,
      videoUrlLength: videoUrl?.length || 0,
      thumbnailUrlLength: thumbnailUrl?.length || 0
    })

    // Validate required fields
    step = 'validating_required_fields'
    const missingFields = []
    if (!tokenId) missingFields.push('tokenId')
    if (!creatorWallet) missingFields.push('creatorWallet')
    if (!truncatedTitle) missingFields.push('title')
    if (!videoUrl) missingFields.push('videoUrl')
    
    if (missingFields.length > 0) {
      console.error('❌ Video Sync API: Missing required fields:', missingFields)
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
    console.log('🔍 Video Sync API: Normalized wallet address:', normalizedWallet)

    // Check if creator has a platform profile
    step = 'checking_profile_exists'
    console.log('🔍 Video Sync API: Checking if profile exists for wallet:', normalizedWallet)
    const hasProfile = await PlatformVideoService.hasProfile(normalizedWallet)
    
    console.log('🔍 Video Sync API: Profile check result:', { hasProfile, wallet: normalizedWallet })
    
    if (!hasProfile) {
      console.warn('⚠️ Video Sync API: Creator has no platform profile')
      console.warn('⚠️ Video Sync API: This means the user needs to create a profile first')
      console.warn('⚠️ Video Sync API: Skipping platform sync but video was minted successfully')
      return NextResponse.json({
        success: true,
        message: 'Video minted successfully but not synced to platform (no profile found)',
        synced: false,
        step,
        action_required: 'User must create a platform profile to sync videos',
        wallet_checked: normalizedWallet
      })
    }

    // Check if video already exists to avoid duplicates
    step = 'checking_duplicate_video'
    console.log('🔍 Video Sync API: Checking for existing video with token ID:', tokenId)
    const existingVideo = await PlatformVideoService.getVideoByTokenId(tokenId)
    
    console.log('🔍 Video Sync API: Existing video check result:', { existingVideo: !!existingVideo })
    
    if (existingVideo) {
      console.log('ℹ️ Video Sync API: Video already exists in platform, skipping creation')
      console.log('ℹ️ Video Sync API: Existing video details:', {
        id: existingVideo.id,
        title: existingVideo.title,
        creator: existingVideo.creator_wallet
      })
      return NextResponse.json({
        success: true,
        message: 'Video already synced to platform',
        synced: true,
        video: existingVideo,
        step
      })
    }

    // Create platform video record
    step = 'creating_platform_video'
    console.log('🏢 Video Sync API: Creating platform video record...')
    console.log('🏢 Video Sync API: Video data to create:', {
      creatorWallet: normalizedWallet,
      tokenId,
      transactionHash: transactionHash || 'unknown',
      title: truncatedTitle,
      description: truncatedDescription || 'No description provided',
      tagsCount: Array.isArray(tags) ? tags.length : (tags ? 1 : 0)
    })
    
    const platformVideo = await PlatformVideoService.createPlatformVideo({
      creatorWallet: normalizedWallet,
      tokenId,
      transactionHash: transactionHash || 'unknown',
      contractAddress: '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1',
      blockNumber,
      mintTimestamp,
      metadataUri,
      title: truncatedTitle,
      description: truncatedDescription || 'No description provided',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : []),
      videoUrl,
      thumbnailUrl,
      pricePerPeriod: license?.price ? parseFloat(license.price) : undefined,
      licenseDuration: license?.duration ? parseInt(license.duration) : undefined,
      royaltyPercentage: license?.royalty ? parseInt(license.royalty) : undefined,
      paymentTokenAddress: license?.paymentToken,
      commercialRights: true,
      derivativeRights: false
    })

    const duration = Date.now() - startTime
    console.log('✅ Video Sync API: Platform video created successfully!')
    console.log('✅ Video Sync API: Created video details:', {
      id: platformVideo.id,
      title: platformVideo.title,
      creator: platformVideo.creator_wallet,
      tokenId: platformVideo.token_id,
      duration: `${duration}ms`
    })

    return NextResponse.json({
      success: true,
      message: 'Video successfully synced to platform',
      synced: true,
      video: platformVideo,
      step,
      duration: `${duration}ms`
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ Video Sync API: Error at step:', step)
    console.error('❌ Video Sync API: Error details:', error)
    console.error('❌ Video Sync API: Error occurred after:', `${duration}ms`)
    
    if (error instanceof Error) {
      console.error('❌ Video Sync API: Error message:', error.message)
      console.error('❌ Video Sync API: Error stack:', error.stack)
      
      // Special handling for payload too large errors
      if (error.message.includes('413') || error.message.includes('Request too large') || error.message.includes('Content Too Large')) {
        console.error('❌ Video Sync API: Payload size error detected')
        return NextResponse.json({
          success: true,
          message: 'Video minted successfully but sync failed due to large payload',
          synced: false,
          error: 'Request payload too large - data URLs or large descriptions not supported',
          step,
          duration: `${duration}ms`,
          action_required: 'Use manual sync with minimal data',
          manual_sync_endpoint: '/api/manual-sync-video',
          manual_sync_payload: {
            tokenId: body?.tokenId,
            transactionHash: body?.transactionHash,
            creatorWallet: body?.creatorWallet
          }
        }, { status: 200 })
      }
    }
    
    // Don't fail the response if sync fails - the video was still minted successfully
    return NextResponse.json({
      success: true,
      message: 'Video minted successfully but platform sync failed',
      synced: false,
      error: error instanceof Error ? error.message : 'Unknown sync error',
      step,
      duration: `${duration}ms`,
      action_required: 'Try manual sync in your profile or contact support',
      manual_sync_endpoint: '/api/manual-sync-video',
      manual_sync_payload: {
        tokenId: body.tokenId,
        transactionHash: body.transactionHash,
        creatorWallet: body.creatorWallet
      }
    }, { status: 200 }) // Still return 200 since minting succeeded
  }
}