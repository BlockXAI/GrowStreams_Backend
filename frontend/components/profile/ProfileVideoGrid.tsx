"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { ProfileVideo } from '@/hooks/useProfileVideos'
import { ProvnButton } from '@/components/provn/button'
import { ProvnBadge } from '@/components/provn/badge'
import { Play, Eye, Heart, DollarSign, ExternalLink, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGlobalVideoModal } from '@/contexts/VideoModalContext'
import { profileVideoToExploreVideo } from '@/lib/video-adapters'

interface ProfileVideoGridProps {
  videos: ProfileVideo[]
  loading?: boolean
  isOwnProfile?: boolean
  onUploadClick?: () => void
  onRefreshVideos?: () => void
  userHandle?: string
  profileInfo?: {
    handle: string
    displayName?: string
    avatarUrl?: string
    followers?: number
    joinedDate?: string
  }
}

export function ProfileVideoGrid({ 
  videos, 
  loading = false, 
  isOwnProfile = false, 
  onUploadClick,
  onRefreshVideos,
  userHandle,
  profileInfo
}: ProfileVideoGridProps) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const { openVideoModal } = useGlobalVideoModal()

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months > 1 ? 's' : ''} ago`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years} year${years > 1 ? 's' : ''} ago`
    }
  }

  const handleVideoClick = (video: ProfileVideo) => {
    try {
      // Convert ProfileVideo to ExploreVideo format
      const exploreVideo = profileVideoToExploreVideo(video, profileInfo)
      
      // Open in unified video modal
      openVideoModal(exploreVideo)
      
      console.log('📺 Opening video in modal:', {
        title: video.title,
        tokenId: video.tokenId,
        type: video.type
      })
    } catch (error) {
      console.error('Failed to open video modal:', error)
      toast.error('Failed to open video. Please try again.')
      
      // Fallback to navigation for now
      if (video.tokenId) {
        router.push(`/video/${video.tokenId}`)
      }
    }
  }

  const handleBlockchainLink = (video: ProfileVideo, e: React.MouseEvent) => {
    e.stopPropagation()
    if (video.blockchain.transactionHash) {
      window.open(`https://basecamp.cloud.blockscout.com/tx/${video.blockchain.transactionHash}`, '_blank')
    } else if (video.tokenId) {
      window.open(`https://basecamp.cloud.blockscout.com/token/0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1/instance/${video.tokenId}`, '_blank')
    }
  }

  const handleManualSync = async () => {
    if (!userHandle || syncing) return
    
    setSyncing(true)
    try {
      console.log('🔄 ProfileVideoGrid: Starting manual video sync for:', userHandle)
      
      const response = await fetch(`/api/profile/${userHandle}/sync-videos`, {
        method: 'POST'
      })
      
      const data = await response.json()
      console.log('🔄 ProfileVideoGrid: Manual sync response:', data)
      
      if (data.success) {
        const { newly_synced, errors, skipped } = data.results
        
        if (newly_synced > 0) {
          toast.success(`Successfully synced ${newly_synced} new video${newly_synced > 1 ? 's' : ''}!`)
          // Trigger a refresh of the videos
          if (onRefreshVideos) {
            onRefreshVideos()
          }
        } else if (errors > 0) {
          toast.warning(`Found videos but ${errors} failed to sync. Check console for details.`)
        } else {
          toast.info('All videos are already synced!')
        }
      } else {
        if (data.action_required === 'create_profile') {
          toast.error('Please create a profile first to sync videos')
        } else {
          toast.error(data.error || 'Manual sync failed')
        }
      }
    } catch (error) {
      console.error('❌ ProfileVideoGrid: Manual sync error:', error)
      toast.error('Failed to sync videos. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-provn-surface rounded-lg overflow-hidden animate-pulse">
            <div className="aspect-video bg-provn-surface-2"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-provn-surface-2 rounded"></div>
              <div className="h-3 bg-provn-surface-2 rounded w-3/4"></div>
              <div className="flex gap-2">
                <div className="h-3 bg-provn-surface-2 rounded w-12"></div>
                <div className="h-3 bg-provn-surface-2 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <div className="w-24 h-24 bg-provn-surface rounded-full flex items-center justify-center mx-auto">
            <Play className="w-8 h-8 text-provn-muted" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-provn-text font-headline">
              {isOwnProfile ? 'No provs yet' : 'No provs found'}
            </h3>
            <p className="text-provn-muted font-headline">
              {isOwnProfile 
                ? 'Upload your first prov to get started!'
                : 'This profile hasn\'t uploaded any provs yet.'
              }
            </p>
          </div>
          {isOwnProfile && (
            <div className="flex gap-3 justify-center mt-4">
              {onUploadClick && (
                <ProvnButton onClick={onUploadClick}>
                  Upload Your First Video
                </ProvnButton>
              )}
              {userHandle && (
                <ProvnButton 
                  variant="secondary" 
                  onClick={handleManualSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Provs
                    </>
                  )}
                </ProvnButton>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      {isOwnProfile && userHandle && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-provn-text font-headline">
            Your Provs
          </h3>
          <ProvnButton 
            variant="secondary" 
            size="sm"
            onClick={handleManualSync}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Provs
              </>
            )}
          </ProvnButton>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-provn-surface rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-provn-text font-headline">
            {videos.length}
          </div>
          <div className="text-sm text-provn-muted font-headline">IP-NFTs</div>
        </div>
        <div className="bg-provn-surface rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-provn-text font-headline">
            {formatNumber(videos.reduce((sum, v) => sum + v.views, 0))}
          </div>
          <div className="text-sm text-provn-muted font-headline">Views</div>
        </div>
        <div className="bg-provn-surface rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-provn-text font-headline">
            {formatNumber(videos.reduce((sum, v) => sum + v.likes, 0))}
          </div>
          <div className="text-sm text-provn-muted font-headline">Likes</div>
        </div>
        <div className="bg-provn-surface rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-provn-text font-headline">
            {formatNumber(videos.reduce((sum, v) => sum + v.tips, 0))}
          </div>
          <div className="text-sm text-provn-muted font-headline">Tips</div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-provn-surface rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => handleVideoClick(video)}
          >
            {/* Video Thumbnail - Clean placeholder */}
            <div className="relative aspect-video bg-provn-surface-2 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-provn-accent/20 to-provn-accent/10 flex items-center justify-center">
                <Play className="w-12 h-12 text-provn-accent/60" />
              </div>
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-provn-bg ml-0.5" />
                </div>
              </div>

              {/* Type badge */}
              <div className="absolute top-2 left-2">
                <ProvnBadge 
                  variant={video.type === 'platform' ? 'default' : 'warning'}
                  className="text-xs px-2 py-1"
                >
                  {video.type === 'platform' ? 'Platform' : 'IP-NFT'}
                </ProvnBadge>
              </div>

              {/* Blockchain link */}
              {(video.blockchain.transactionHash || video.tokenId) && (
                <button
                  onClick={(e) => handleBlockchainLink(video, e)}
                  className="absolute top-2 right-2 p-1.5 bg-black/20 hover:bg-black/40 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="View on blockchain"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <h3 className="font-semibold text-provn-text font-headline line-clamp-2 group-hover:text-provn-accent transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-provn-muted font-headline line-clamp-2">
                  {video.description}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-provn-muted">
                {video.views > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{formatNumber(video.views)}</span>
                  </div>
                )}
                {video.likes > 0 && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{formatNumber(video.likes)}</span>
                  </div>
                )}
                {video.tips > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{formatNumber(video.tips)}</span>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="text-xs text-provn-muted font-headline">
                {formatDate(video.createdAt)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}