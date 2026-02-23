import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// POST - Follow a user
// DELETE - Unfollow a user
export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address')
    const { followingAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address header is required' },
        { status: 400 }
      )
    }

    if (!followingAddress) {
      return NextResponse.json(
        { success: false, error: 'Following address is required' },
        { status: 400 }
      )
    }

    // Validate wallet addresses
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress) || !/^0x[a-fA-F0-9]{40}$/.test(followingAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Prevent self-following
    if (walletAddress.toLowerCase() === followingAddress.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_address', walletAddress.toLowerCase())
      .eq('following_address', followingAddress.toLowerCase())
      .single()

    // Handle case where follows table doesn't exist
    if (checkError && checkError.code === 'PGRST205') {
      console.error('Follows table does not exist. Please create it in Supabase dashboard.')
      return NextResponse.json(
        { success: false, error: 'Follow functionality is not yet set up. Please contact administrator.' },
        { status: 503 }
      )
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing follow:', checkError)
      return NextResponse.json(
        { success: false, error: 'Failed to check existing follow' },
        { status: 500 }
      )
    }

    if (existingFollow) {
      return NextResponse.json(
        { success: false, error: 'Already following this user' },
        { status: 409 }
      )
    }

    // Create follow relationship
    const { data: follow, error: insertError } = await supabaseAdmin
      .from('follows')
      .insert({
        follower_address: walletAddress.toLowerCase(),
        following_address: followingAddress.toLowerCase(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating follow:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create follow relationship' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      follow: {
        id: follow.id,
        follower_address: follow.follower_address,
        following_address: follow.following_address,
        created_at: follow.created_at,
      }
    })

  } catch (error) {
    console.error('Failed to follow user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const walletAddress = request.headers.get('x-wallet-address')
    const { followingAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address header is required' },
        { status: 400 }
      )
    }

    if (!followingAddress) {
      return NextResponse.json(
        { success: false, error: 'Following address is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // Delete follow relationship
    const { error: deleteError } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_address', walletAddress.toLowerCase())
      .eq('following_address', followingAddress.toLowerCase())

    if (deleteError) {
      console.error('Error deleting follow:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to unfollow user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed user'
    })

  } catch (error) {
    console.error('Failed to unfollow user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
