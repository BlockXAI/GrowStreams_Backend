"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ExploreVideo } from "@/types/explore"
import { X, Twitter, Instagram, Copy, ExternalLink, Share2, Eye, Heart } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ProvnButton } from "@/components/provn/button"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  video: ExploreVideo
  onShare: (platform: 'twitter' | 'instagram') => void
}

export function ShareModal({ isOpen, onClose, video, onShare }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const videoUrl = `${window.location.origin}/video/${video.tokenId}`
  
  const shareText = `Check out this amazing prov by @${video.creator.handle} on Provn! 🎥✨\n\n"${video.title}"\n\n#Provn #IPNFT #Web3Creator`

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(videoUrl)}`
    window.open(twitterUrl, '_blank')
    onShare('twitter')
  }

  const handleInstagramShare = () => {
    // Instagram doesn't have a direct web share API, so we copy the link and provide instructions
    copyToClipboard()
    toast.info('Link copied! Paste it in your Instagram story or bio')
    onShare('instagram')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl)
      setCopied(true)
      toast.success('Prov link copied successfully')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-provn-surface border border-provn-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-provn-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-provn-accent/20 rounded-lg">
                  <Share2 className="w-5 h-5 text-provn-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-provn-text font-headline">Share Prov</h2>
                  <p className="text-sm text-provn-muted font-headline">Share with your audience</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-provn-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Video Preview Card */}
              <div className="flex gap-3 p-3 bg-provn-surface-2 rounded-lg">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-provn-accent/20 flex items-center justify-center">
                    <span className="text-provn-accent font-bold">#{video.tokenId.slice(-4)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-provn-text truncate font-headline">{video.title}</h3>
                  <p className="text-sm text-provn-muted font-headline">by @{video.creator.handle}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-provn-muted font-headline">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {video.metrics.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {video.metrics.likes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share Options - Redesigned to match elite website standards */}
              <div className="space-y-3">
                {/* Twitter - Clean and professional */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTwitterShare}
                  className="w-full flex items-center gap-4 p-4 bg-provn-surface-2 hover:bg-provn-surface border border-provn-border hover:border-provn-accent/30 rounded-xl transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-[#1DA1F2] rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#1DA1F2]/25 transition-all duration-200">
                    <Twitter className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-provn-text font-headline group-hover:text-provn-accent transition-colors">Twitter</h4>
                    <p className="text-sm text-provn-muted font-headline">Share with your followers</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-provn-muted group-hover:text-provn-accent transition-colors" />
                </motion.button>

                {/* Instagram - Elegant gradient approach */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleInstagramShare}
                  className="w-full flex items-center gap-4 p-4 bg-provn-surface-2 hover:bg-provn-surface border border-provn-border hover:border-provn-accent/30 rounded-xl transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#E4405F] via-[#F56040] to-[#FFDC80] rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#E4405F]/25 transition-all duration-200">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-provn-text font-headline group-hover:text-provn-accent transition-colors">Instagram</h4>
                    <p className="text-sm text-provn-muted font-headline">Copy link for stories</p>
                  </div>
                  <Copy className="w-5 h-5 text-provn-muted group-hover:text-provn-accent transition-colors" />
                </motion.button>

                {/* Copy Link - Premium feel with provn brand colors */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-4 p-4 bg-provn-surface-2 hover:bg-provn-surface border border-provn-border hover:border-provn-accent/30 rounded-xl transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-provn-accent rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-provn-accent/25 transition-all duration-200">
                    <Copy className="w-6 h-6 text-provn-bg" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-provn-text font-headline group-hover:text-provn-accent transition-colors">Copy Link</h4>
                    <p className="text-sm text-provn-muted font-headline">Direct URL to prov</p>
                  </div>
                  {copied ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 text-provn-accent text-sm font-medium font-headline"
                    >
                      <div className="w-2 h-2 bg-provn-accent rounded-full"></div>
                      Copied
                    </motion.div>
                  ) : (
                    <div className="w-5 h-5"></div>
                  )}
                </motion.button>
              </div>

              {/* Share Stats - Elegant and minimal */}
              <div className="flex items-center justify-center gap-2 p-4 bg-provn-surface-2 rounded-xl border border-provn-border">
                <div className="w-2 h-2 bg-provn-accent rounded-full animate-pulse"></div>
                <p className="text-sm text-provn-muted font-headline">
                  <span className="font-bold text-provn-text">{video.metrics.shares.toLocaleString()}</span> shares on Provn
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}