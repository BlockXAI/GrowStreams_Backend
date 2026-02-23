import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// GET - Fetch follow counts for a profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const currentUserAddress = searchParams.get('currentUser')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Profile identifier is required' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = await createClient(cookieStore)

    let profileAddress: string

    // Check if id is a wallet address (0x...)
    if (id.startsWith('0x') && id.length === 42) {
      profileAddress = id.toLowerCase()
    } else {
      // Assume it's a handle, get the wallet address
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('handle', id.toLowerCase())
        .single()

      if (profileError) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        )
      }
      profileAddress = profile.wallet_address
    }

    // Get follower count
    const { count: followersCount, error: followersError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_address', profileAddress)

    // Handle case where follows table doesn't exist
    if (followersError && followersError.code === 'PGRST205') {
      console.log('Follows table does not exist, returning default values')
      return NextResponse.json({
        success: true,
        data: {
          followers: 0,
          following: 0,
          isFollowing: false,
          profileAddress
        }
      })
    }

    if (followersError) {
      console.error('Error fetching followers count:', followersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch followers count' },
        { status: 500 }
      )
    }

    // Get following count
    const { count: followingCount, error: followingError } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_address', profileAddress)

    if (followingError) {
      console.error('Error fetching following count:', followingError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch following count' },
        { status: 500 }
      )
    }

    // Check if current user is following this profile
    let isFollowing = false
    if (currentUserAddress && currentUserAddress !== profileAddress) {
      const { data: followCheck, error: followCheckError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_address', currentUserAddress.toLowerCase())
        .eq('following_address', profileAddress)
        .single()

      if (!followCheckError) {
        isFollowing = true
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        followers: followersCount || 0,
        following: followingCount || 0,
        isFollowing,
        profileAddress
      }
    })

  } catch (error) {
    console.error('Failed to fetch follow counts:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
