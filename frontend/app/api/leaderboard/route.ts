import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMockSupabaseClient } from '@/utils/supabase/mock'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : (createMockSupabaseClient() as any)

interface CreatorScore {
  rank: number
  profile_id: string
  wallet_address: string
  handle: string
  display_name?: string
  avatar_url?: string
  total_score: number
  views_score: number
  tips_score: number
  licenses_score: number
  engagement_score: number
  consistency_score: number
  quality_score: number
  videos_count: number
  total_views: number
  total_tips: number
  total_licenses: number
  total_earnings: number
  rank_change: number
  streak_days: number
  tier: 'legendary' | 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'rising'
  achievements: string[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const timeframe = searchParams.get('timeframe') as 'weekly' | 'monthly' | 'all-time' || 'all-time'
    const tier = searchParams.get('tier')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userWallet = searchParams.get('userWallet')

    // Calculate timeframe filter
    const now = new Date()
    const timeframeDays = timeframe === 'weekly' ? 7 : timeframe === 'monthly' ? 30 : 365
    const cutoffDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000))

    // Build base query for creator metrics
    let videosQuery = supabase
      .from('platform_videos')
      .select(`
        creator_id,
        creator_wallet,
        views_count,
        likes_count,
        tips_count,
        tips_total_amount,
        licenses_sold,
        total_revenue,
        published_at,
        category
      `)
      .eq('upload_status', 'ready')
      .in('moderation_status', ['approved', 'pending'])
      .eq('visibility', 'public')

    // Apply timeframe filter
    if (timeframe !== 'all-time') {
      videosQuery = videosQuery.gte('published_at', cutoffDate.toISOString())
    }

    // Apply category filter
    if (category) {
      videosQuery = videosQuery.eq('category', category)
    }

    const { data: videosData, error: videosError } = await videosQuery

    if (videosError) {
      console.error('Error fetching videos data:', videosError)
      throw new Error(`Failed to fetch videos data: ${videosError.message}`)
    }

    // Get all profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')

    if (profilesError) {
      console.error('Error fetching profiles data:', profilesError)
      throw new Error(`Failed to fetch profiles data: ${profilesError.message}`)
    }

    // Calculate creator scores
    const creatorMetrics = new Map<string, any>()

    // Group videos by creator
    ;(videosData as any[]).forEach((video: any) => {
      const creatorId = video.creator_id
      if (!creatorMetrics.has(creatorId)) {
        creatorMetrics.set(creatorId, {
          creator_id: creatorId,
          creator_wallet: video.creator_wallet,
          videos_count: 0,
          total_views: 0,
          total_likes: 0,
          total_tips: 0,
          total_tips_amount: 0,
          total_licenses: 0,
          total_revenue: 0,
          last_published: null
        })
      }

      const metrics = creatorMetrics.get(creatorId)
      metrics.videos_count += 1
      metrics.total_views += video.views_count || 0
      metrics.total_likes += video.likes_count || 0
      metrics.total_tips += video.tips_count || 0
      metrics.total_tips_amount += parseFloat(video.tips_total_amount || '0')
      metrics.total_licenses += video.licenses_sold || 0
      metrics.total_revenue += parseFloat(video.total_revenue || '0')
      
      if (!metrics.last_published || new Date(video.published_at) > new Date(metrics.last_published)) {
        metrics.last_published = video.published_at
      }
    })

    // Calculate scores and create leaderboard
    const leaderboard: CreatorScore[] = []

    ;(profilesData as any[]).forEach((profile: any) => {
      const metrics = creatorMetrics.get(profile.id) || {
        videos_count: 0,
        total_views: 0,
        total_likes: 0,
        total_tips: 0,
        total_tips_amount: 0,
        total_licenses: 0,
        total_revenue: 0,
        last_published: null
      }

      // Include all creators, even those with no videos (for debugging/admin view)

      // Calculate individual scores
      const views_score = metrics.total_views * 1.0
      const tips_score = metrics.total_tips * 10.0
      const licenses_score = metrics.total_licenses * 50.0
      
      // Engagement rate calculation
      const engagement_rate = metrics.total_views > 0 
        ? (metrics.total_likes / metrics.total_views) * 100 
        : 0
      const engagement_score = engagement_rate * 25.0

      // Consistency score based on recent activity
      const daysSinceLastUpload = metrics.last_published 
        ? Math.floor((now.getTime() - new Date(metrics.last_published).getTime()) / (1000 * 60 * 60 * 24))
        : 999
      let consistency_score = 0
      if (daysSinceLastUpload <= 2) consistency_score = 100
      else if (daysSinceLastUpload <= 7) consistency_score = 75
      else if (daysSinceLastUpload <= 14) consistency_score = 50
      else if (daysSinceLastUpload <= 30) consistency_score = 25

      // Quality score based on average views per video
      const quality_score = metrics.videos_count > 0 
        ? Math.min((metrics.total_views / metrics.videos_count) * 0.1, 100)
        : 0

      // Calculate total score
      const total_score = views_score + tips_score + licenses_score + engagement_score + consistency_score + quality_score

      // Determine tier
      let tier: CreatorScore['tier'] = 'rising'
      if (total_score >= 10000) tier = 'legendary'
      else if (total_score >= 5000) tier = 'diamond'
      else if (total_score >= 2500) tier = 'platinum'
      else if (total_score >= 1000) tier = 'gold'
      else if (total_score >= 500) tier = 'silver'
      else if (total_score >= 100) tier = 'bronze'

      // Calculate streak days
      const streak_days = daysSinceLastUpload <= 2 ? Math.max(1, 7 - daysSinceLastUpload) : 0

      // Generate achievements
      const achievements = generateAchievements({
        total_views: metrics.total_views,
        total_earnings: metrics.total_revenue,
        streak_days,
        avg_engagement_rate: engagement_rate,
        total_licenses: metrics.total_licenses,
        rank: 0 // Will be set later
      })

      const creatorScore: CreatorScore = {
        rank: 0, // Will be set after sorting
        profile_id: profile.id,
        wallet_address: profile.wallet_address,
        handle: profile.handle,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        total_score: Math.round(total_score),
        views_score: Math.round(views_score),
        tips_score: Math.round(tips_score),
        licenses_score: Math.round(licenses_score),
        engagement_score: Math.round(engagement_score),
        consistency_score: Math.round(consistency_score),
        quality_score: Math.round(quality_score),
        videos_count: metrics.videos_count,
        total_views: metrics.total_views,
        total_tips: metrics.total_tips,
        total_licenses: metrics.total_licenses,
        total_earnings: metrics.total_revenue,
        rank_change: 0, // TODO: Implement rank change tracking
        streak_days,
        tier,
        achievements
      }

      leaderboard.push(creatorScore)
    })

    // Sort by total score
    leaderboard.sort((a, b) => b.total_score - a.total_score)

    // Set ranks and update achievements for top performers
    leaderboard.forEach((creator, index) => {
      creator.rank = index + 1
      
      // Add rank-based achievements
      if (creator.rank === 1) creator.achievements.push('Champion')
      else if (creator.rank <= 3) creator.achievements.push('Podium Finisher')
      else if (creator.rank <= 10) creator.achievements.push('Top 10')
    })

    // Apply tier filter if specified
    let filteredLeaderboard = leaderboard
    if (tier) {
      filteredLeaderboard = leaderboard.filter(creator => creator.tier === tier)
    }

    // Apply pagination
    const paginatedLeaderboard = filteredLeaderboard.slice(offset, offset + limit)

    // Find user rank if wallet provided
    let userRank = null
    if (userWallet) {
      const userIndex = leaderboard.findIndex(
        creator => creator.wallet_address.toLowerCase() === userWallet.toLowerCase()
      )
      userRank = userIndex >= 0 ? userIndex + 1 : null
    }

    // Calculate stats
    const stats = {
      total_creators: leaderboard.length,
      avg_score: leaderboard.length > 0 
        ? Math.round(leaderboard.reduce((sum, c) => sum + c.total_score, 0) / leaderboard.length)
        : 0,
      highest_score: leaderboard.length > 0 ? leaderboard[0].total_score : 0
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: paginatedLeaderboard,
        userRank,
        stats,
        filters: {
          category,
          timeframe,
          tier,
          limit,
          offset
        }
      }
    })

  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateAchievements(creator: {
  total_views: number
  total_earnings: number
  streak_days: number
  avg_engagement_rate: number
  total_licenses: number
  rank: number
}): string[] {
  const achievements: string[] = []

  // View-based achievements
  if (creator.total_views >= 100000) achievements.push('Viral Creator')
  else if (creator.total_views >= 50000) achievements.push('View Master')
  else if (creator.total_views >= 10000) achievements.push('Rising Star')

  // Earning achievements
  if (creator.total_earnings >= 1000) achievements.push('wCAMP Millionaire')
  else if (creator.total_earnings >= 500) achievements.push('Revenue Generator')
  else if (creator.total_earnings >= 100) achievements.push('First Earnings')

  // Consistency achievements
  if (creator.streak_days >= 30) achievements.push('Monthly Consistent')
  else if (creator.streak_days >= 7) achievements.push('Weekly Warrior')
  else if (creator.streak_days >= 3) achievements.push('Consistent Creator')

  // Quality achievements
  if (creator.avg_engagement_rate >= 10) achievements.push('Engagement Expert')
  else if (creator.avg_engagement_rate >= 5) achievements.push('Community Favorite')

  // Licensing achievements
  if (creator.total_licenses >= 10) achievements.push('License Legend')
  else if (creator.total_licenses >= 5) achievements.push('IP Pioneer')
  else if (creator.total_licenses >= 1) achievements.push('First License')

  return achievements
}

