import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)
    
    // Check if profiles table exists
    let profilesTableExists = false
    try {
      const { data: profilesCheck, error: profilesError } = await supabase
        .from('profiles')
        .select('count(*)', { count: 'exact', head: true })
      
      profilesTableExists = !profilesError
    } catch (e) {
      profilesTableExists = false
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      supabase: {
        connected: true,
        profilesTableExists
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
