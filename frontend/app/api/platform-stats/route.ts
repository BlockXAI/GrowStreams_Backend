import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMockSupabaseClient } from '@/utils/supabase/mock'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : (createMockSupabaseClient() as any)

export async function GET(request: NextRequest) {
  try {
    // Get total videos count
    const { count: videosCount, error: videosError } = await supabase
      .from('platform_videos')
      .select('*', { count: 'exact', head: true })
      .eq('upload_status', 'ready')
      .eq('visibility', 'public')

    if (videosError) {
      console.error('Error fetching videos count:', videosError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch videos count' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      videosCount: videosCount || 0
    })

  } catch (error) {
    console.error('Failed to fetch platform stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}