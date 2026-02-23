"use client"

import { useState, useEffect } from "react"
import { ExploreVideo, ShareOptions } from "@/types/explore"
import { Share2, DollarSign, Info, Eye, MessageCircle, UserPlus, UserCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import TipModal from "./TipModal"
import { ShareModal } from "./ShareModal"
import { LikeButton } from "./LikeButton"
import { useFollow } from "@/hooks/useFollow"

interface VideoOverlayProps {
  video: ExploreVideo
  isAuthenticated: boolean
  onLike: () => Promise<void>
  onShare: (video: ExploreVideo, platform: 'twitter' | 'instagram') => void
  onDetails: () => void
}

export function VideoOverlay({ 
  video, 
  isAuthenticated, 
  onLike, 
  onShare, 
  onDetails 
}: VideoOverlayProps) {
  const [showTipModal, setShowTipModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  
  // Follow functionality for the creator
  const { 
    isFollowing, 
    followers,
    followUser, 
    unfollowUser 
  } = useFollow(video.creator.walletAddress)

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const handleShareClick = () => {
    setShowShareModal(true)
  }

  const handleShareSelect = (platform: 'twitter' | 'instagram') => {
    onShare(video, platform)
    setShowShareModal(false)
  }

  // Reset modals when video changes to prevent persistence issue
  useEffect(() => {
    // Immediately close all modals when video changes
    setShowShareModal(false)
    setShowTipModal(false)
  }, [video.tokenId])

  // Additional cleanup on component mount to ensure clean state
  useEffect(() => {
    setShowShareModal(false)
    setShowTipModal(false)
  }, [])

  // Listen for force close events from navigation
  useEffect(() => {
    const handleForceClose = () => {
      setShowShareModal(false)
      setShowTipModal(false)
    }

    window.addEventListener('forceCloseModals', handleForceClose)
    return () => window.removeEventListener('forceCloseModals', handleForceClose)
  }, [])

  return (
    <>
      <div className="video-overlay absolute inset-0 pointer-events-none">
        {/* Left Side - Creator Info and Description */}
        <div className="absolute bottom-20 left-4 max-w-[65%] pointer-events-auto">
          {/* Creator Info */}
          <div className="mb-4">
            <div className="flex items-start gap-3 mb-3">
              {/* Creator Avatar */}
              <div className="relative flex-shrink-0">
                {video.creator.avatarUrl ? (
                  <img
                    src={video.creator.avatarUrl}
                    alt={video.creator.handle}
                    className="w-12 h-12 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-br from-provn-accent to-provn-accent/80 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {video.creator.displayName?.[0]?.toUpperCase() || video.creator.handle[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Verification Badge */}
                {video.ipInfo.status === 'verified' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>

              {/* Creator Name, Handle and Follow Button Container */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => window.location.href = `/u/${video.creator.handle}`}
                    className="text-white font-bold text-lg leading-tight truncate hover:text-provn-accent transition-colors cursor-pointer font-headline"
                  >
                    {video.creator.displayName || video.creator.handle}
                  </button>
                  
                  {/* Follow Button - Integrated next to name */}
                  {isAuthenticated && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={isFollowing ? unfollowUser : followUser}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 flex-shrink-0 font-headline ${
                        isFollowing
                          ? 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                          : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3 h-3 mr-1 inline" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1 inline" />
                          Follow
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
                <button
                  onClick={() => window.location.href = `/u/${video.creator.handle}`}
                  className="text-white/80 text-sm hover:text-white transition-colors cursor-pointer text-left font-headline"
                >
                  @{video.creator.handle}
                </button>
              </div>
            </div>

            {/* Video Title */}
            <h2 className="text-white font-semibold text-lg mb-2 leading-tight font-headline">
              {video.title}
            </h2>

            {/* Description */}
            <p className="text-white/90 text-sm leading-relaxed mb-2 line-clamp-3 font-headline">
              {video.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {video.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-white/80 text-sm bg-black/30 px-2 py-1 rounded-full font-headline"
                >
                  #{tag}
                </span>
              ))}
              {video.tags.length > 3 && (
                <span className="text-white/60 text-sm font-headline">
                  +{video.tags.length - 3} more
                </span>
              )}
            </div>

            {/* View Count */}
            <div className="flex items-center gap-4 text-white/80 text-sm font-headline">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{formatCount(video.metrics.views)} views</span>
              </div>
              
              {video.ipInfo.type === 'original' && (
                <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium font-headline">
                  Original
                </div>
              )}
              
              {video.ipInfo.type === 'derivative' && (
                <div className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-medium font-headline">
                  Remix
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="absolute bottom-20 right-4 flex flex-col gap-4 pointer-events-auto">
          {/* Like Button */}
          <LikeButton
            isLiked={video.isLiked || false}
            likeCount={video.metrics.likes}
            onLike={onLike}
            isAuthenticated={isAuthenticated}
          />

          {/* Share Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShareClick}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/30 hover:bg-black/50 transition-colors">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium font-headline">
              {formatCount(video.metrics.shares)}
            </span>
          </motion.button>

          {/* Tip Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowTipModal(true)}
            disabled={!isAuthenticated}
            className={`flex flex-col items-center gap-1 ${
              !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="p-3 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-2 border-yellow-500/50 hover:from-yellow-500/30 hover:to-orange-500/30 transition-colors">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-white text-xs font-medium font-headline">
              {formatCount(video.metrics.tips)}
            </span>
          </motion.button>

          {/* Details Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDetails}
            className="flex flex-col items-center gap-1"
          >
            <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/30 hover:bg-black/50 transition-colors">
              <Info className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium font-headline">Details</span>
          </motion.button>
        </div>

        {/* License Info Badge */}
        {video.licensing.price > 0 && (
          <div className="absolute top-20 right-4 pointer-events-auto">
            <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-lg px-3 py-2">
              <div className="text-green-400 text-xs font-medium text-center font-headline">
                <div>Remix License</div>
                <div className="font-bold">{video.licensing.price} PROVN</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tip Modal */}
      <TipModal
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        creatorAddress={video.creator.walletAddress}
        creatorName={video.creator.displayName || video.creator.handle}
        videoId={video.tokenId}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        video={video}
        onShare={handleShareSelect}
      />
    </>
  )
}