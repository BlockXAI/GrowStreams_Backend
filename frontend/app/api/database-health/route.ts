import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Database Health: Starting comprehensive health check...')
    
    // Environment check
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20),
    }
    
    console.log('🌍 Environment Status:', envStatus)
    
    // Try to create Supabase client
    let supabaseAdmin
    try {
      supabaseAdmin = createAdminClient()
      console.log('✅ Supabase client created successfully')
    } catch (clientError) {
      console.error('❌ Failed to create Supabase client:', clientError)
      return NextResponse.json({
        success: false,
        status: {
          client_creation: false,
          client_error: clientError instanceof Error ? clientError.message : 'Unknown error',
          environment: envStatus,
          timestamp: new Date().toISOString()
        },
        message: 'Failed to create Supabase client'
      }, { status: 500 })
    }
    
    // Test basic Supabase connection
    const startTime = Date.now()
    
    // Check profiles table access
    const { data: profilesTest, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true })
    
    const responseTime = Date.now() - startTime
    
    // Try to get actual profile count if table is accessible
    let profileCount = 0
    let profileSampleError = null
    if (!profilesError) {
      try {
        const { count, error: countError } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        profileCount = count || 0
        profileSampleError = countError
      } catch (err) {
        profileSampleError = err
      }
    }
    
    // Test table insertion permissions
    let insertTestError = null
    let insertTestSuccess = false
    try {
      const testHandle = `test_${Date.now()}`
      const { data: testInsert, error: testError } = await supabaseAdmin
        .from('profiles')
        .insert({
          wallet_address: '0x0000000000000000000000000000000000000000',
          handle: testHandle,
          display_name: 'Test User'
        })
        .select()
        .single()
      
      if (!testError && testInsert) {
        // Clean up test record
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', testInsert.id)
        insertTestSuccess = true
      } else {
        insertTestError = testError
      }
    } catch (err) {
      insertTestError = err
    }
    
    const status = {
      client_creation: true,
      connection: true,
      response_time_ms: responseTime,
      environment: envStatus,
      profiles_table: {
        exists: !profilesError,
        accessible: !profilesError,
        count: profileCount,
        error: profilesError ? {
          message: profilesError.message,
          code: profilesError.code,
          details: profilesError.details,
          hint: profilesError.hint
        } : null,
        count_error: profileSampleError ? {
          message: profileSampleError instanceof Error ? profileSampleError.message : 'Unknown error',
          code: (profileSampleError as any)?.code || 'UNKNOWN'
        } : null
      },
      permissions: {
        can_insert: insertTestSuccess,
        insert_error: insertTestError ? {
          message: insertTestError instanceof Error ? insertTestError.message : 'Unknown error',
          code: (insertTestError as any)?.code || 'UNKNOWN',
          details: (insertTestError as any)?.details || null,
          hint: (insertTestError as any)?.hint || null
        } : null
      },
      timestamp: new Date().toISOString()
    }
    
    console.log('📊 Comprehensive Database Health Status:', status)
    
    const isHealthy = !profilesError && insertTestSuccess
    
    return NextResponse.json({
      success: true,
      healthy: isHealthy,
      status,
      message: isHealthy 
        ? 'Database is healthy and ready for profile creation' 
        : 'Database has issues that need to be resolved'
    })
    
  } catch (error) {
    console.error('❌ Database Health Check Failed:', error)
    
    return NextResponse.json({
      success: false,
      healthy: false,
      status: {
        connection: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      message: 'Database health check failed'
    }, { status: 500 })
  }
}