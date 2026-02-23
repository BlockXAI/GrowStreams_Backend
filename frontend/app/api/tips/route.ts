import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

// POST - Record a new tip
export async function POST(request: NextRequest) {
  try {
    const { creatorAddress, videoId, amount, message, timestamp, transactionHash, tokenType } = await request.json()

    if (!creatorAddress || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid tip data' },
        { status: 400 }
      )
    }

    // Use admin client to avoid schema cache issues
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Failed to create database client' },
        { status: 500 }
      )
    }

    // Look up the video_id UUID from the token_id in platform_videos table
    let video_id = null;
    let videoData = null;
    if (videoId) {
      try {
        const { data: video, error: videoLookupError } = await supabase
          .from('platform_videos')
          .select('id, tips_count, tips_total_amount')
          .eq('token_id', videoId)
          .single()

        if (videoLookupError) {
          console.log(`ℹ️ Video lookup failed for token_id ${videoId}:`, videoLookupError.message)
          // Don't fail the tip - just log it and continue without video association
          video_id = null;
        } else {
          video_id = video.id
          videoData = video
          console.log(`✅ Found video for token_id ${videoId}: ${video_id}`)
        }
      } catch (error) {
        console.log(`ℹ️ Video lookup error for token_id ${videoId}:`, error)
        video_id = null;
      }
    }

    // Look up recipient_id UUID from creator wallet address
    const { data: recipientData, error: recipientLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_address', creatorAddress.toLowerCase())
      .single()

    if (recipientLookupError) {
      console.error('Error looking up recipient profile:', recipientLookupError)
      return NextResponse.json(
        { success: false, error: 'Creator profile not found' },
        { status: 404 }
      )
    }

    // Update the video's tip counts if a video was found
    if (video_id && videoData) {
      const newTipsCount = (videoData.tips_count || 0) + 1
      const newTipsTotal = (videoData.tips_total_amount || 0) + parseFloat(amount)
      
      const { error: updateError } = await supabase
        .from('platform_videos')
        .update({
          tips_count: newTipsCount,
          tips_total_amount: newTipsTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', video_id)

      if (updateError) {
        console.error('Error updating video tip counts:', updateError)
        // Don't fail the tip - just log the error
      } else {
        console.log(`✅ Updated video tip counts: ${newTipsCount} tips, ${newTipsTotal} total`)
      }
    }

    // Update the creator's profile timestamp
    await supabase
      .from('profiles')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', recipientData.id)

    console.log(`💰 Tip recorded: ${amount} PROVN to ${creatorAddress}${videoId ? ` for video ${videoId}` : ''}`)

    return NextResponse.json({
      success: true,
      tip: {
        id: 'tip_' + Date.now(),
        amount,
        message,
        transactionHash,
        timestamp,
        videoId,
        videoAssociated: !!video_id,
        videoUpdated: !!video_id
      }
    })

  } catch (error) {
    console.error('Failed to record tip:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Get tip history for a creator (simplified since we don't have a tips table)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorAddress = searchParams.get('creator')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!creatorAddress) {
      return NextResponse.json(
        { success: false, error: 'Creator address required' },
        { status: 400 }
      )
    }

    // Use admin client for GET as well
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Failed to create database client' },
        { status: 500 }
      )
    }

    // Get videos by creator with tip information
    const { data: videos, error } = await supabase
      .from('platform_videos')
      .select(`
        id,
        token_id,
        title,
        tips_count,
        tips_total_amount,
        created_at
      `)
      .eq('creator_wallet', creatorAddress.toLowerCase())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching videos:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch videos' },
        { status: 500 }
      )
    }

    // Convert to tip-like format for compatibility
    const tips = (videos as any[])?.map((video: any) => ({
      id: video.id,
      video_id: video.id,
      amount: video.tips_total_amount || 0,
      tips_count: video.tips_count || 0,
      created_at: video.created_at,
      video: {
        token_id: video.token_id,
        title: video.title
      }
    })) || []

    return NextResponse.json({
      success: true,
      tips: tips,
      hasMore: videos && videos.length === limit
    })

  } catch (error) {
    console.error('Failed to fetch tips:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}