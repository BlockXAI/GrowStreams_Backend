"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
// Auth removed for public mode

interface CreatorRanking {
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

interface LeaderboardData {
  leaderboard: CreatorRanking[]
  userRank: number | null
  stats: {
    total_creators: number
    avg_score: number
    highest_score: number
  }
}

interface CategoryData {
  category: string
  total_creators: number
  total_videos: number
  total_views: number
  total_tips: number
  total_licenses: number
  total_revenue: number
  avg_views_per_video: number
  competition_level: 'low' | 'medium' | 'high' | 'intense'
  growth_rate: number
  emoji: string
}

const tierColors = {
  legendary: 'from-yellow-400 to-yellow-600',
  diamond: 'from-blue-400 to-blue-600', 
  platinum: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-300 to-yellow-500',
  silver: 'from-gray-300 to-gray-500',
  bronze: 'from-orange-400 to-orange-600',
  rising: 'from-green-400 to-green-600'
}

const tierLabels = {
  legendary: 'Legendary',
  diamond: 'Diamond', 
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  rising: 'Rising Star'
}


export default function LeaderboardPage() {
  const walletAddress: string | undefined = undefined
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('all-time')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true)
        
        const offset = (currentPage - 1) * pageSize
        const params = new URLSearchParams({
          timeframe,
          limit: pageSize.toString(),
          offset: offset.toString()
        })
        
        if (selectedCategory) params.append('category', selectedCategory)
        if (selectedTier) params.append('tier', selectedTier)
        if (walletAddress) params.append('userWallet', walletAddress)

        const response = await fetch(`/api/leaderboard?${params}`)
        if (response.ok) {
          const data = await response.json()
          setLeaderboardData(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboardData()
  }, [timeframe, selectedCategory, selectedTier, walletAddress, currentPage, pageSize])

  // Fetch categories data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/leaderboard/categories')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.data.categories)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getRankChange = (change: number) => {
    if (change > 0) return { icon: '↗', color: 'text-green-500', text: `+${change}` }
    if (change < 0) return { icon: '↘', color: 'text-red-500', text: `${change}` }
    return { icon: '→', color: 'text-provn-muted', text: '0' }
  }

  const getCompetitionLevel = (totalCreators: number) => {
    if (totalCreators >= 20) return { level: 'Intense', color: 'text-red-400', dotColor: 'bg-red-500' }
    if (totalCreators >= 10) return { level: 'High', color: 'text-orange-400', dotColor: 'bg-orange-500' }
    if (totalCreators >= 5) return { level: 'Medium', color: 'text-yellow-400', dotColor: 'bg-yellow-500' }
    return { level: 'Low', color: 'text-green-400', dotColor: 'bg-green-500' }
  }


  const filteredLeaderboard = leaderboardData?.leaderboard.filter(creator =>
    creator.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.handle.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [timeframe, selectedCategory, selectedTier, searchQuery])

  if (loading) {
    return (
      <div className="min-h-screen font-headline bg-provn-bg">
        <Navigation currentPage="dashboard" />
        <div className="pt-16 pb-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-8">
              {/* Header Skeleton */}
              <div className="text-center font-headline space-y-4 py-16">
                <div className="h-16 bg-provn-surface rounded-xl w-96 mx-auto animate-pulse"></div>
                <div className="h-6 bg-provn-surface rounded-xl w-80 mx-auto animate-pulse"></div>
              </div>
              
              {/* Stats Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-provn-surface rounded-xl animate-pulse"></div>
                ))}
              </div>
              
              {/* Top 3 Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 bg-provn-surface rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const topThree = leaderboardData?.leaderboard.slice(0, 3) || []

  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation currentPage="dashboard" />

      {/* Hero Section - Clean and Simple */}
      <div className="pt-20 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Minimalist Header */}
          <div className="text-center py-12">
            <h1 className="font-headline text-4xl font-bold text-provn-text mb-4">
              Creator Leaderboard
            </h1>
            <p className="text-provn-muted max-w-xl mx-auto">
              Compete with the best creators and climb your way to the top
            </p>
          </div>

          {/* Key Metrics */}
          {leaderboardData && (
            <ProvnCard className="mb-8">
              <ProvnCardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-provn-text">{formatNumber(leaderboardData.stats.total_creators)}</div>
                    <div className="text-sm text-provn-muted mt-1">Total Creators</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-provn-text">{formatNumber(leaderboardData.stats.avg_score)}</div>
                    <div className="text-sm text-provn-muted mt-1">Average Score</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-provn-text">{formatNumber(leaderboardData.stats.highest_score)}</div>
                    <div className="text-sm text-provn-muted mt-1">Top Score</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const competition = getCompetitionLevel(leaderboardData.stats.total_creators)
                        return (
                          <>
                            <div className={`text-3xl font-bold ${competition.color}`}>{competition.level}</div>
                            <div className={`w-2 h-2 ${competition.dotColor} rounded-full animate-pulse`}></div>
                          </>
                        )
                      })()}
                    </div>
                    <div className="text-sm text-provn-muted mt-1">Competition Level</div>
                  </div>
                </div>
              </ProvnCardContent>
            </ProvnCard>
          )}

          {/* Top Performers - Simple List - Commented out for now */}
          {/* {topThree.length >= 3 && (
            <div className="mb-8">
              <h2 className="font-headline text-xl font-bold text-provn-text mb-4">Top 3 This Month</h2>
              
              <ProvnCard>
                <ProvnCardContent className="p-0">
                  {topThree.map((creator, index) => (
                    <div key={creator.profile_id} className={`p-4 flex items-center justify-between ${index < topThree.length - 1 ? 'border-b border-provn-border' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-provn-accent">#{index + 1}</div>
                        <img
                          src={creator.avatar_url && creator.avatar_url.trim() !== '' ? creator.avatar_url : '/diverse-profile-avatars.png'}
                          alt={creator.display_name || creator.handle}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-provn-text">{creator.display_name || creator.handle}</div>
                          <div className="text-sm text-provn-muted">@{creator.handle}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-provn-text">{formatNumber(creator.total_score)}</div>
                        <div className="text-xs text-provn-muted">points</div>
                      </div>
                    </div>
                  ))}
                </ProvnCardContent>
              </ProvnCard>
            </div>
          )} */}

          {/* Filters - Simplified */}
          <ProvnCard className="mb-6">
            <ProvnCardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Timeframe */}
                <div>
                  <label className="block text-sm text-provn-muted mb-2">Time Period</label>
                  <div className="flex bg-provn-surface-2 rounded-lg p-1">
                    {[
                      { value: 'all-time', label: 'All' },
                      { value: 'monthly', label: 'Month' },
                      { value: 'weekly', label: 'Week' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setTimeframe(option.value as any)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                          timeframe === option.value
                            ? 'bg-provn-accent text-provn-bg'
                            : 'text-provn-muted hover:text-provn-text'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm text-provn-muted mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:ring-2 focus:ring-provn-accent focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm text-provn-muted mb-2">Category</label>
                  <select 
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="w-full px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text focus:ring-2 focus:ring-provn-accent focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tier */}
                <div>
                  <label className="block text-sm text-provn-muted mb-2">Tier</label>
                  <select 
                    value={selectedTier || ''}
                    onChange={(e) => setSelectedTier(e.target.value || null)}
                    className="w-full px-3 py-2 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text focus:ring-2 focus:ring-provn-accent focus:border-transparent transition-all text-sm"
                  >
                    <option value="">All Tiers</option>
                    {Object.entries(tierLabels).map(([tier, label]) => (
                      <option key={tier} value={tier}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Rankings Table - Clean and Organized */}
          {leaderboardData && (
            <ProvnCard className="mb-6">
              <ProvnCardContent className="p-0">
                <div className="px-5 py-4 border-b border-provn-border">
                  <h2 className="font-headline text-xl font-bold text-provn-text">Full Rankings</h2>
                </div>
                
                <div className="divide-y divide-provn-border">
                  {filteredLeaderboard.map((creator) => {
                    const rankChange = getRankChange(creator.rank_change)
                    const isCurrentUser = false
                    
                    return (
                      <div
                        key={creator.profile_id}
                        className={`p-4 hover:bg-provn-surface/30 transition-colors ${
                          isCurrentUser ? 'bg-provn-accent/5 border-l-2 border-l-provn-accent' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className="flex-shrink-0 text-center w-12">
                            <div className="text-lg font-bold text-provn-text">#{creator.rank}</div>
                            <div className={`text-xs ${rankChange.color}`}>
                              {rankChange.icon}{rankChange.text}
                            </div>
                          </div>

                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <img
                              src={creator.avatar_url && creator.avatar_url.trim() !== '' ? creator.avatar_url : '/diverse-profile-avatars.png'}
                              alt={creator.display_name || creator.handle}
                              className="w-12 h-12 rounded-full object-cover border border-provn-border"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${tierColors[creator.tier]} flex items-center justify-center`}>
                              {tierLabels[creator.tier].charAt(0)}
                            </div>
                          </div>
                          
                          {/* Creator Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-provn-text truncate">
                                {creator.display_name || creator.handle}
                              </h3>
                              {isCurrentUser && (
                                <span className="text-xs bg-provn-accent text-provn-bg px-2 py-1 rounded font-medium">You</span>
                              )}
                            </div>
                            <p className="text-provn-muted text-sm truncate">@{creator.handle}</p>
                          </div>

                          {/* Stats - Desktop */}
                          <div className="hidden md:flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-provn-text">
                                {formatNumber(creator.total_score)}
                              </div>
                              <div className="text-xs text-provn-muted">Points</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="font-semibold text-provn-text">
                                {formatNumber(creator.total_views)}
                              </div>
                              <div className="text-xs text-provn-muted">Views</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="font-semibold text-provn-text">
                                {formatNumber(creator.total_tips)}
                              </div>
                              <div className="text-xs text-provn-muted">Tips</div>
                            </div>
                          </div>

                          {/* Action */}
                          <div className="flex-shrink-0">
                            <ProvnButton
                              variant="secondary"
                              size="sm"
                              onClick={() => window.location.href = `/u/${creator.handle}`}
                              className="text-xs px-3 py-1"
                            >
                              View
                            </ProvnButton>
                          </div>
                        </div>

                        {/* Mobile Stats */}
                        <div className="md:hidden mt-3 pt-3 border-t border-provn-border">
                          <div className="grid grid-cols-3 gap-3 text-center text-sm">
                            <div>
                              <div className="font-bold text-provn-text">
                                {formatNumber(creator.total_score)}
                              </div>
                              <div className="text-xs text-provn-muted">Points</div>
                            </div>
                            <div>
                              <div className="font-semibold text-provn-text">
                                {formatNumber(creator.total_views)}
                              </div>
                              <div className="text-xs text-provn-muted">Views</div>
                            </div>
                            <div>
                              <div className="font-semibold text-provn-text">
                                {formatNumber(creator.total_tips)}
                              </div>
                              <div className="text-xs text-provn-muted">Tips</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ProvnCardContent>
            </ProvnCard>
          )}

          {/* Pagination Controls */}
          {leaderboardData && leaderboardData.stats.total_creators > pageSize && (
            <div className="flex justify-center items-center gap-4 py-6">
              <ProvnButton
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2"
              >
                Previous
              </ProvnButton>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-provn-muted">
                  Page {currentPage} of {Math.ceil(leaderboardData.stats.total_creators / pageSize)}
                </span>
              </div>
              
              <ProvnButton
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= Math.ceil(leaderboardData.stats.total_creators / pageSize)}
                className="px-4 py-2"
              >
                Next
              </ProvnButton>
            </div>
          )}

          {/* Call to Action - Minimal */}
          <div className="mt-12 mb-8">
            <ProvnCard className="border-provn-accent/30">
              <ProvnCardContent className="p-8 text-center">
                <h2 className="font-headline text-2xl font-bold text-provn-text mb-3">
                  Ready to Climb the Ranks?
                </h2>
                <p className="text-provn-muted mb-6 max-w-lg mx-auto">
                  Create amazing content and compete with the best creators on Provn.
                </p>
                <div className="flex gap-3 justify-center">
                  <ProvnButton 
                    onClick={() => window.location.href = '/upload'}
                    className="px-6 py-2"
                  >
                    Create Content
                  </ProvnButton>
                  <ProvnButton 
                    variant="secondary" 
                    onClick={() => window.location.href = '/explore'}
                    className="px-6 py-2"
                  >
                    Explore
                  </ProvnButton>
                </div>
              </ProvnCardContent>
            </ProvnCard>
          </div>
        </div>
      </div>
    </div>
  )
}