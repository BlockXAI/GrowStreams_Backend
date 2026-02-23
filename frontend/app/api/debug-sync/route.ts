import { NextRequest, NextResponse } from 'next/server'
import { PlatformVideoService } from '@/services/platformVideos'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Sync: Starting debug...')
    
    // Test 1: Check if we can connect to database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('🔍 Debug Sync: Environment check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })
    
    // Test 2: Check if platform_videos table exists
    const { data: tables, error: tablesError } = await supabase
      .from('platform_videos')
      .select('id')
      .limit(1)
    
    if (tablesError) {
      return NextResponse.json({
        success: false,
        error: 'platform_videos table issue',
        details: tablesError
      })
    }
    
    // Test 3: Check if profile exists for sattaman
    const hasProfile = await PlatformVideoService.hasProfile('0x1234567890123456789012345678901234567890') // dummy wallet
    console.log('🔍 Debug Sync: Profile check (dummy wallet):', hasProfile)
    
    // Test 4: Try to get actual profile for sattaman handle
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('handle', 'sattaman')
      .single()
    
    if (profileError) {
      return NextResponse.json({
        success: false,
        error: 'Profile lookup failed',
        details: profileError,
        message: 'No profile found with handle "sattaman"'
      })
    }
    
    console.log('🔍 Debug Sync: Found profile:', {
      id: profileData.id,
      handle: profileData.handle,
      wallet: profileData.wallet_address
    })
    
    // Test 5: Try a minimal platform video insert (will fail but show exact error)
    try {
      const testVideo = {
        creator_id: profileData.id,
        creator_wallet: profileData.wallet_address,
        token_id: 'test-debug-' + Date.now(),
        transaction_hash: 'test-tx-debug',
        contract_address: '0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1',
        title: 'Debug Test Video',
        description: 'This is a test',
        tags: ['debug'],
        video_url: 'https://example.com/test.mp4',
        upload_status: 'ready',
        moderation_status: 'pending',
        visibility: 'public'
      }
      
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('platform_videos')
        .insert([testVideo])
        .select('*')
        .single()
      
      if (insertError) {
        return NextResponse.json({
          success: false,
          error: 'Insert failed',
          details: insertError,
          testData: testVideo
        })
      }
      
      // Clean up test record
      await supabaseAdmin
        .from('platform_videos')
        .delete()
        .eq('id', insertData.id)
      
      return NextResponse.json({
        success: true,
        message: 'All tests passed!',
        profile: profileData,
        insertTest: 'SUCCESS'
      })
      
    } catch (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Insert test failed',
        details: insertError
      })
    }
    
  } catch (error) {
    console.error('❌ Debug Sync Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown debug error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}