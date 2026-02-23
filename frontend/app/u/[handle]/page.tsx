"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnBadge } from "@/components/provn/badge"
import { useAuth } from "@campnetwork/origin/react"
import { useProfile } from "@/hooks/useProfile"
import { useFollow } from "@/hooks/useFollow"
import { useAnalytics } from "@/hooks/useAnalytics"
import { useProfileVideos } from "@/hooks/useProfileVideos"
import { toast } from "sonner"
import { Profile } from "@/lib/supabase"
import { Copy, ExternalLink, Edit } from "lucide-react"
import { ProfileLoadingState, ErrorState, EmptyState } from "@/components/provn/loading-states"
import { ProfileSkeleton } from "@/components/provn/profile-skeleton"
import { AnimatedBackground } from "@/components/provn/animated-background"
import { ProfileEditModal } from "@/components/provn/profile-edit-modal"
import { ProfileVideoGrid } from "@/components/profile/ProfileVideoGrid"
import { motion } from "framer-motion"

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { walletAddress: currentUserAddress } = useAuth()
  const handle = params?.handle as string

  const { profile, loading, error } = useProfile(handle)
  const { followers, following, isFollowing, loading: followLoading, followUser, unfollowUser } = useFollow(handle)
  const { data: analytics, loading: analyticsLoading, error: analyticsError } = useAnalytics(handle)
  const { videos, stats: videoStats, loading: videosLoading, error: videosError, refetch: refetchVideos } = useProfileVideos(handle)
  const [activeTab, setActiveTab] = useState<'videos' | 'about' | 'analytics'>('videos')
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedHandle, setCopiedHandle] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Check if this is the current user's profile
  const isOwnProfile = currentUserAddress && 
    profile && 
    currentUserAddress.toLowerCase() === profile.wallet_address.toLowerCase()

  useEffect(() => {
    if (error && !loading) {
      toast.error('Profile not found')
      router.push('/')
    }
  }, [error, loading, router])

    const handleCopyAddress = async () => {
    if (!profile) return

    try {
      await navigator.clipboard.writeText(profile.wallet_address)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
      toast.success('Address copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy address')
    }
  }

  const handleCopyHandle = async () => {
    if (!profile) return

    try {
      await navigator.clipboard.writeText(`@${profile.handle}`)
      setCopiedHandle(true)
      setTimeout(() => setCopiedHandle(false), 2000)
      toast.success('Username copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy username')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleSaveProfile = async (updatedProfile: any) => {
    try {
      const response = await fetch(`/api/profile/${profile?.handle}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': currentUserAddress!
        },
        body: JSON.stringify({
          handle: updatedProfile.handle.startsWith('@') ? updatedProfile.handle.slice(1) : updatedProfile.handle,
          display_name: updatedProfile.displayName || null,
          bio: updatedProfile.bio || null,
          avatar_url: updatedProfile.avatarUrl || null
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile')
      }

      // Refresh the profile data
      window.location.reload()
      
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  if (loading) {
    return <ProfileLoadingState />
  }

  if (!profile) {
    return (
      <ErrorState 
        title="Profile Not Found"
        message="The requested profile could not be found."
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <>
      <Navigation currentPage="profile" />
      
      <div className="min-h-screen bg-provn-bg">
        {/* Profile Header */}
        <div className="relative">
          {/* Clean, minimal header with subtle background */}
          <div className="h-32 sm:h-40 bg-gradient-to-br from-provn-surface via-provn-surface/80 to-provn-surface/60 relative overflow-hidden">
            {/* Subtle animated background */}
            <AnimatedBackground />
          </div>
          
          {/* Profile Content Container */}
          <div className="max-w-4xl mx-auto px-4">
            {/* Profile Header */}
            <div className="relative -mt-16 sm:-mt-20">
              <div className="flex flex-col sm:flex-row items-start gap-8">
                {/* Avatar */}
                <div className="relative group">
                  {profile.avatar_url ? (
                    <>
                      <img
                        src={profile.avatar_url}
                        alt={profile.handle}
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-2 border-provn-border/30 object-cover bg-provn-surface relative z-10 transition-all duration-300 group-hover:scale-105 shadow-lg"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      {/* Subtle glow effect */}
                      <div className="absolute inset-0 w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-provn-accent/10 to-transparent blur-md scale-105 group-hover:scale-110 transition-all duration-500" />
                    </>
                  ) : null}
                  {/* Fallback initials - hidden if image loads successfully */}
                  <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-2 border-provn-border/30 bg-gradient-to-br from-provn-accent to-provn-accent/80 flex items-center justify-center relative z-10 transition-all duration-300 group-hover:scale-105 shadow-lg ${profile.avatar_url ? 'hidden' : ''}`}>
                    <span className="text-3xl sm:text-4xl font-bold text-provn-bg font-headline">
                      {profile.display_name?.[0]?.toUpperCase() || profile.handle[0]?.toUpperCase()}
                    </span>
                  </div>
                  {/* Glow for fallback too */}
                  {!profile.avatar_url && (
                    <div className="absolute inset-0 w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-provn-accent/10 to-transparent blur-md scale-105 group-hover:scale-110 transition-all duration-500" />
                  )}
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-3">
                    <h1 className="text-3xl sm:text-4xl font-bold text-provn-text font-headline">
                      {profile.display_name || profile.handle}
                    </h1>
                    {profile.display_name && (
                      <div className="flex items-center gap-2 group">
                        <p className="text-xl text-provn-muted font-headline">@{profile.handle}</p>
                        <button
                          onClick={handleCopyHandle}
                          className="p-1.5 hover:bg-provn-surface rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          {copiedHandle ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <Copy className="w-4 h-4 text-provn-muted" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Wallet Address */}
                  <div className="flex items-center gap-3 group">
                    <span className="text-sm text-provn-muted font-mono bg-provn-surface px-3 py-1.5 rounded-lg border border-provn-border/30">
                      {formatAddress(profile.wallet_address)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyAddress}
                        className="p-2 hover:bg-provn-surface rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {copiedAddress ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <Copy className="w-4 h-4 text-provn-muted" />
                        )}
                      </button>
                      <a
                        href={`https://basecamp.cloud.blockscout.com/address/${profile.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-provn-surface rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ExternalLink className="w-4 h-4 text-provn-muted" />
                      </a>
                    </div>
                  </div>

                  {/* Followers and Following Stats */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-provn-text font-headline">
                        {followLoading ? '...' : followers.toLocaleString()}
                      </span>
                      <span className="text-sm text-provn-muted font-headline">Followers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-provn-text font-headline">
                        {followLoading ? '...' : following.toLocaleString()}
                      </span>
                      <span className="text-sm text-provn-muted font-headline">Following</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 self-start">
                  {isOwnProfile ? (
                    <>
                      <ProvnButton 
                        variant="secondary"
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-6 py-3"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </ProvnButton>
                      <ProvnButton 
                        variant="secondary"
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3"
                      >
                        Dashboard
                      </ProvnButton>
                    </>
                  ) : (
                    <ProvnButton 
                      variant={isFollowing ? "secondary" : "primary"}
                      onClick={isFollowing ? unfollowUser : followUser}
                      disabled={followLoading}
                      className={`px-4 py-2 transition-all duration-200 hover:scale-105 ${
                        followLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                      }`}
                    >
                      {followLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading...</span>
                        </div>
                      ) : isFollowing ? (
                        'Following'
                      ) : (
                        'Follow'
                      )}
                    </ProvnButton>
                  )}
                </div>
              </div>
              
                            {/* Bio and Meta Info */}
              <div className="mt-8 pt-6 border-t border-provn-border/20">
                {profile.bio && (
                  <div className="mb-6">
                    <p className="text-provn-text leading-relaxed font-headline text-lg">{profile.bio}</p>
                  </div>
                )}
                
                {/* Joined Date */}
                <div className="flex items-center gap-3 text-sm text-provn-muted font-headline">
                  <div className="w-8 h-8 bg-provn-surface rounded-lg flex items-center justify-center border border-provn-border/30">
                    <span className="text-xs">🗓️</span>
                  </div>
                  <span className="font-semibold text-provn-text">Joined {formatDate(profile.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Tabs */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Tab Navigation */}
          <div className="flex border-b border-provn-border mb-6 relative">
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-6 py-3 font-medium transition-all duration-300 font-headline relative ${
                activeTab === 'videos'
                  ? 'text-provn-accent'
                  : 'text-provn-muted hover:text-provn-text'
              }`}
            >
              Videos
              {activeTab === 'videos' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-provn-accent rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-3 font-medium transition-all duration-300 font-headline relative ${
                activeTab === 'about'
                  ? 'text-provn-accent'
                  : 'text-provn-muted hover:text-provn-text'
              }`}
            >
              About
              {activeTab === 'about' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-provn-accent rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium transition-all duration-300 font-headline relative ${
                activeTab === 'analytics'
                  ? 'text-provn-accent'
                  : 'text-provn-muted hover:text-provn-text'
              }`}
            >
              Analytics
              {activeTab === 'analytics' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-provn-accent rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'videos' && (
            <ProfileVideoGrid 
              videos={videos}
              loading={videosLoading}
              isOwnProfile={!!isOwnProfile}
              onUploadClick={() => router.push('/upload')}
              onRefreshVideos={refetchVideos}
              userHandle={handle}
              profileInfo={profile ? {
                handle: profile.handle,
                displayName: profile.display_name || undefined,
                avatarUrl: profile.avatar_url || undefined,
                followers: followers || 0,
                joinedDate: profile.created_at
              } : undefined}
            />
          )}

                                {activeTab === 'about' && (
                        <div className="space-y-6">
                          <div className="bg-provn-surface rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-provn-text font-headline">Profile Information</h3>
                              {isOwnProfile && (
                                <ProvnButton 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => setIsEditModalOpen(true)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </ProvnButton>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-provn-muted font-headline">Handle</label>
                                <p className="text-provn-text font-headline">@{profile.handle}</p>
                              </div>

                              {profile.display_name && (
                                <div>
                                  <label className="text-sm font-medium text-provn-muted font-headline">Display Name</label>
                                  <p className="text-provn-text font-headline">{profile.display_name}</p>
                                </div>
                              )}

                              <div>
                                <label className="text-sm font-medium text-provn-muted font-headline">Profile Picture</label>
                                <div className="flex items-center gap-3">
                                  {profile.avatar_url ? (
                                    <img
                                      src={profile.avatar_url}
                                      alt={profile.handle}
                                      className="w-16 h-16 rounded-full object-cover bg-provn-surface border border-provn-border"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded-full bg-provn-accent flex items-center justify-center">
                                      <span className="text-xl font-bold text-provn-bg font-headline">
                                        {profile.display_name?.[0]?.toUpperCase() || profile.handle[0]?.toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <span className="text-provn-muted text-sm font-headline">
                                    {profile.avatar_url ? 'Custom avatar uploaded' : 'No avatar set'}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-provn-muted font-headline">Wallet Address</label>
                                <div className="flex items-center gap-2 group">
                                  <p className="text-provn-text font-mono font-headline">{profile.wallet_address}</p>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={handleCopyAddress}
                                      className="p-1.5 hover:bg-provn-surface-2 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      {copiedAddress ? (
                                        <span className="text-green-500">✓</span>
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-provn-muted" />
                                      )}
                                    </button>
                                    <a
                                      href={`https://basecamp.cloud.blockscout.com/address/${profile.wallet_address}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 hover:bg-provn-surface-2 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-provn-muted" />
                                    </a>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-provn-muted font-headline">Member Since</label>
                                <p className="text-provn-text font-headline">{formatDate(profile.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'analytics' && (
                        <div className="space-y-6">
                          {analyticsLoading ? (
                            <div className="text-center py-12">
                              <div className="text-provn-muted font-headline">Loading analytics...</div>
                            </div>
                          ) : analyticsError ? (
                            <div className="text-center py-12">
                              <div className="text-red-500 font-headline">Failed to load analytics</div>
                              <button 
                                onClick={() => window.location.reload()} 
                                className="mt-2 text-provn-accent hover:underline font-headline"
                              >
                                Try again
                              </button>
                            </div>
                          ) : analytics ? (
                            <>
                              {/* Stats Overview */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div className="bg-provn-surface rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-provn-text font-headline">
                                    {videoStats?.total.toLocaleString() || analytics?.ipnfts.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-provn-muted font-headline">IP-NFTs</div>
                                </div>
                                <div className="bg-provn-surface rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-provn-text font-headline">
                                    {videoStats?.totalViews.toLocaleString() || analytics?.views.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-provn-muted font-headline">Views</div>
                                </div>
                                <div className="bg-provn-surface rounded-lg p-4 text-center">
                                  <div className="text-2xl font-bold text-provn-text font-headline">
                                    {videoStats?.totalTips.toLocaleString() || analytics?.wCAMP.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-provn-muted font-headline">Tips</div>
                                </div>
                                
                              </div>

                              {/* Content Performance & Revenue */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-provn-surface rounded-lg p-6">
                                  <h3 className="text-lg font-semibold text-provn-text mb-4 font-headline">Content Performance</h3>
                                  <div className="space-y-3">
                                    <div className="flex justify-between">
                                      <span className="text-provn-muted font-headline">Average Views per Video</span>
                                      <span className="text-provn-text font-headline font-semibold">
                                        {analytics.avgViewsPerVideo.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-provn-muted font-headline">Tips per Video</span>
                                      <span className="text-provn-text font-headline font-semibold">
                                        {analytics.avgTipsPerVideo}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-provn-muted font-headline">License Conversion Rate</span>
                                      <span className="text-provn-text font-headline font-semibold">
                                        {analytics.licenseConversionRate}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-provn-muted font-headline">Earnings per Video</span>
                                      <span className="text-provn-text font-headline font-semibold">
                                        {analytics.avgEarningsPerVideo} PROVN
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-provn-surface rounded-lg p-6">
                                  <h3 className="text-lg font-semibold text-provn-text mb-4 font-headline">Content Performance</h3>
                                  <div className="space-y-3">
                                    <div className="flex justify-between">
                                      <span className="text-provn-muted font-headline">Average Views per IP-NFT</span>
                                      <span className="text-blue-500 font-headline font-semibold">
                                        {analytics.avgViewsPerVideo}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-provn-muted font-headline">Average Tips per IP-NFT</span>
                                      <span className="text-green-500 font-headline font-semibold">
                                        {analytics.avgTipsPerVideo}
                                      </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-provn-border/30">
                                      <span className="text-provn-text font-headline font-semibold">Total Tips Received</span>
                                      <span className="text-provn-accent font-headline font-semibold">
                                        {analytics.tips}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Top Performing Provs */}
                              <div className="bg-provn-surface rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-provn-text mb-4 font-headline">Top Performing Provs</h3>
                                <div className="space-y-3">
                                  {analytics.topVideos.length > 0 ? (
                                    analytics.topVideos.map((video, index) => (
                                      <div key={index} className="flex items-center gap-4 p-3 bg-provn-bg rounded-lg">
                                        <div className="w-8 h-8 bg-provn-accent rounded-full flex items-center justify-center text-provn-bg font-bold font-headline text-sm">
                                          {video.rank}
                                        </div>
                                        <div className="flex-1">
                                          <div className="font-medium text-provn-text font-headline">{video.title}</div>
                                          <div className="text-sm text-provn-muted font-headline">{video.type} • {video.date}</div>
                                        </div>
                                        <div className="text-right space-y-1">
                                          <div className="text-sm text-provn-text font-headline">{video.views} views</div>
                                          <div className="text-xs text-provn-muted font-headline">{video.tips} tips • {video.licenses} licenses</div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-8 text-provn-muted font-headline">
                                      No provs yet
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-12">
                              <div className="text-provn-muted font-headline">No analytics data available</div>
                            </div>
                          )}
                        </div>
                      )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {isOwnProfile && profile && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={{
            walletAddress: profile.wallet_address,
            handle: profile.handle,
            displayName: profile.display_name || '',
            bio: profile.bio || '',
            avatarUrl: profile.avatar_url || '',
            bannerUrl: '' // Add banner support later if needed
          }}
          onSave={handleSaveProfile}
        />
      )}
    </>
  )
}
