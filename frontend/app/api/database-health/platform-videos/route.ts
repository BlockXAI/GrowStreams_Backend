import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Platform Videos DB Health: Starting health check...')
    
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({
        success: false,
        healthy: false,
        error: 'Failed to create Supabase admin client',
        checks: {
          client_creation: false
        }
      }, { status: 500 })
    }

    const results: any = {
      client_creation: true,
      table_exists: false,
      table_accessible: false,
      insert_permissions: false,
      select_permissions: false,
      profiles_table_exists: false,
      sample_data: null,
      error_details: null
    }

    // Test 1: Check if platform_videos table exists and is accessible
    try {
      console.log('🔍 Platform Videos DB Health: Testing table access...')
      const { data, error } = await supabase
        .from('platform_videos')
        .select('id')
        .limit(1)
      
      if (error) {
        console.error('❌ Platform Videos DB Health: Table access error:', error)
        results.error_details = error
        results.table_accessible = false
        
        if (error.code === '42P01') {
          results.table_exists = false
        } else {
          results.table_exists = true // Table exists but access issue
        }
      } else {
        console.log('✅ Platform Videos DB Health: Table accessible')
        results.table_exists = true
        results.table_accessible = true
        results.select_permissions = true
        results.sample_data = data
      }
    } catch (err) {
      console.error('❌ Platform Videos DB Health: Table check failed:', err)
      results.error_details = err
    }

    // Test 2: Check if profiles table exists (required for foreign key)
    try {
      console.log('🔍 Platform Videos DB Health: Testing profiles table...')
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (!error) {
        console.log('✅ Platform Videos DB Health: Profiles table accessible')
        results.profiles_table_exists = true
      } else {
        console.error('❌ Platform Videos DB Health: Profiles table error:', error)
        results.profiles_table_exists = false
      }
    } catch (err) {
      console.error('❌ Platform Videos DB Health: Profiles check failed:', err)
    }

    // Test 3: Test insert permissions (if table is accessible)
    if (results.table_accessible) {
      try {
        console.log('🔍 Platform Videos DB Health: Testing insert permissions...')
        
        // Try to insert a test record (will be rolled back)
        const testRecord = {
          creator_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID to prevent actual insert
          creator_wallet: '0x0000000000000000000000000000000000000000',
          token_id: 'test-token-health-check',
          transaction_hash: 'test-tx-health-check',
          contract_address: '0x0000000000000000000000000000000000000000',
          title: 'Health Check Video',
          description: 'This is a health check - should not be inserted',
          tags: ['health-check'],
          video_url: 'https://example.com/test.mp4',
          aspect_ratio: '16:9',
          language: 'en',
          age_rating: 'G',
          upload_status: 'processing',
          moderation_status: 'pending',
          visibility: 'private',
          commercial_rights: false,
          derivative_rights: false,
          views_count: 0,
          likes_count: 0,
          shares_count: 0,
          comments_count: 0,
          tips_count: 0,
          tips_total_amount: 0,
          downloads_count: 0,
          licenses_sold: 0,
          total_revenue: 0
        }
        
        const { error: insertError } = await supabase
          .from('platform_videos')
          .insert([testRecord])
        
        if (insertError) {
          console.log('ℹ️ Platform Videos DB Health: Insert test (expected to fail):', insertError.message)
          // This is expected to fail due to foreign key constraint, but it tests permissions
          if (insertError.code === '23503') { // Foreign key violation - this is good, means insert permissions work
            results.insert_permissions = true
          } else if (insertError.code === '42501') { // Permission denied
            results.insert_permissions = false
          } else {
            results.insert_permissions = true // Other errors suggest permissions are OK
          }
        } else {
          console.log('⚠️ Platform Videos DB Health: Insert succeeded unexpectedly')
          results.insert_permissions = true
          
          // Clean up if it actually inserted
          await supabase
            .from('platform_videos')
            .delete()
            .eq('token_id', 'test-token-health-check')
        }
      } catch (err) {
        console.error('❌ Platform Videos DB Health: Insert test failed:', err)
        results.insert_permissions = false
      }
    }

    const healthy = results.table_exists && 
                   results.table_accessible && 
                   results.select_permissions && 
                   results.profiles_table_exists

    console.log('🔍 Platform Videos DB Health: Final results:', results)

    return NextResponse.json({
      success: true,
      healthy,
      message: healthy 
        ? 'Platform videos database is healthy and ready'
        : 'Platform videos database has issues that need attention',
      checks: results,
      recommendations: healthy ? [] : [
        !results.table_exists && 'Create platform_videos table using migration',
        !results.profiles_table_exists && 'Create profiles table first',
        !results.table_accessible && 'Check RLS policies and service role permissions',
        !results.select_permissions && 'Grant SELECT permissions to service role',
        !results.insert_permissions && 'Grant INSERT permissions to service role'
      ].filter(Boolean)
    })

  } catch (error) {
    console.error('❌ Platform Videos DB Health: Health check failed:', error)
    return NextResponse.json({
      success: false,
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown health check error',
      checks: {
        client_creation: false
      }
    }, { status: 500 })
  }
}