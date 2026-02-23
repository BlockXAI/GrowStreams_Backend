import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'
import { BlockscoutService } from '@/services/blockscout'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Debug Manual Sync: Starting...')

    // Test 1: Check if profile exists for sattaman
    const profileResponse = await fetch(`${request.nextUrl.origin}/api/profile/sattaman`)
    const profileData = await profileResponse.json()
    
    if (!profileData.success || !profileData.profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found',
        step: 'profile_lookup'
      })
    }
    
    const walletAddress = profileData.profile.wallet_address.toLowerCase()
    console.log('✅ Debug Manual Sync: Found profile with wallet:', walletAddress)

    // Test 2: Check hasProfile function
    try {
      const hasProfile = await PlatformVideoService.hasProfile(walletAddress)
      console.log('✅ Debug Manual Sync: hasProfile result:', hasProfile)
      
      if (!hasProfile) {
        return NextResponse.json({
          success: false,
          error: 'hasProfile returned false',
          step: 'has_profile_check',
          wallet: walletAddress
        })
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'hasProfile function failed',
        step: 'has_profile_check',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: Try getVideosByCreator
    try {
      console.log('🔄 Debug Manual Sync: Testing getVideosByCreator...')
      const existingVideosResult = await PlatformVideoService.getVideosByCreator(walletAddress, {
        includePrivate: true,
        limit: 100
      })
      
      console.log('✅ Debug Manual Sync: getVideosByCreator result type:', typeof existingVideosResult)
      console.log('✅ Debug Manual Sync: getVideosByCreator result:', existingVideosResult)
      
      const existingVideos = Array.isArray(existingVideosResult) 
        ? existingVideosResult 
        : existingVideosResult.videos || []
      
      console.log('✅ Debug Manual Sync: Processed existing videos count:', existingVideos.length)
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'getVideosByCreator failed',
        step: 'get_videos_by_creator',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    }

    // Test 4: Try BlockscoutService
    try {
      console.log('🔄 Debug Manual Sync: Testing BlockscoutService...')
      const blockchainVideos = await BlockscoutService.getTokensByOwner(walletAddress)
      console.log('✅ Debug Manual Sync: BlockscoutService result:', blockchainVideos)
      
      const potentialVideos = blockchainVideos.items || []
      console.log('✅ Debug Manual Sync: Potential videos count:', potentialVideos.length)
      
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'BlockscoutService failed',
        step: 'blockscout_service',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    }

    return NextResponse.json({
      success: true,
      message: 'All debug tests passed!',
      wallet: walletAddress,
      next_step: 'Try actual manual sync'
    })

  } catch (error) {
    console.error('❌ Debug Manual Sync Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown debug error',
      stack: error instanceof Error ? error.stack : undefined,
      step: 'main_try_catch'
    })
  }
}