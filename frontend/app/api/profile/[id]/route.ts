import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// GET - Fetch profile by ID, handle, or wallet address
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Profile identifier is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Profile Fetch API: Fetching profile for ID:', id)
    
    // Fetch profile from Supabase
    const supabase = createAdminClient()
    
    let query = supabase
      .from('profiles')
      .select('*')

    // Check if id is a wallet address (0x...)
    if (id.startsWith('0x') && id.length === 42) {
      console.log('🔍 Profile Fetch API: Querying by wallet address:', id.toLowerCase())
      query = query.eq('wallet_address', id.toLowerCase())
    } else {
      console.log('🔍 Profile Fetch API: Querying by handle:', id.toLowerCase())
      query = query.eq('handle', id.toLowerCase())
    }

    console.log('🔍 Profile Fetch API: Executing query...')
    const { data: profile, error } = await query.single()
    
    console.log('🔍 Profile Fetch API: Query result:', { 
      hasProfile: !!profile, 
      error: error?.message,
      errorCode: error?.code,
      fullError: error
    })
    
    // Additional logging for debugging
    if (error) {
      console.error('🔍 Profile Fetch API: Full error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    }

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log('🔍 Profile Fetch API: Profile not found (404)')
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        )
      }
      
      console.error('❌ Profile Fetch API: Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    console.log('🔍 Profile Fetch API: Profile found:', {
      id: profile.id,
      handle: profile.handle,
      wallet_address: profile.wallet_address
    })
    
    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        wallet_address: profile.wallet_address,
        handle: profile.handle,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }
    })

  } catch (error) {
    console.error('❌ Profile Fetch API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const walletAddress = request.headers.get('x-wallet-address')
    
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { handle, display_name, bio, avatar_url } = body

    console.log('🔄 Profile Update API: Updating profile for ID:', id)
    console.log('🔄 Profile Update API: Wallet address:', walletAddress)
    console.log('🔄 Profile Update API: Update data:', { handle, display_name, bio, avatar_url })

    const supabase = createAdminClient()

    // First, verify the profile belongs to the requesting wallet
    let verifyQuery = supabase
      .from('profiles')
      .select('id, wallet_address')

    // Check if id is a wallet address (0x...) or handle
    if (id.startsWith('0x') && id.length === 42) {
      verifyQuery = verifyQuery.eq('wallet_address', id.toLowerCase())
    } else {
      verifyQuery = verifyQuery.eq('handle', id.toLowerCase())
    }

    const { data: existingProfile, error: verifyError } = await verifyQuery.single()

    if (verifyError || !existingProfile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (existingProfile.wallet_address.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - you can only update your own profile' },
        { status: 403 }
      )
    }

    // Check if new handle is already taken (if handle is being changed)
    if (handle && handle !== id) {
      const { data: handleCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', handle.toLowerCase())
        .single()

      if (handleCheck) {
        return NextResponse.json(
          { success: false, error: 'Handle is already taken' },
          { status: 409 }
        )
      }
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        handle: handle?.toLowerCase(),
        display_name,
        bio,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProfile.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Profile Update API: Supabase error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    console.log('✅ Profile Update API: Profile updated successfully')

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        wallet_address: updatedProfile.wallet_address,
        handle: updatedProfile.handle,
        display_name: updatedProfile.display_name,
        bio: updatedProfile.bio,
        avatar_url: updatedProfile.avatar_url,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
      }
    })

  } catch (error) {
    console.error('❌ Profile Update API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
