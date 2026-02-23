"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExploreVideo } from "@/types/explore"
import { 
  X, 
  ExternalLink, 
  Flag, 
  Users, 
  Calendar, 
  Shield, 
  Coins,
  Eye,
  Heart,
  Share2,
  DollarSign,
  Copy,
  CheckCircle,
  AlertTriangle,
  Play,
  Award,
  Clock,
  Hash,
  Info
} from "lucide-react"
import { ProvnButton } from "@/components/provn/button"
import { useOriginLicensing } from "@/hooks/useOriginLicensing"
import { toast } from "sonner"

interface VideoDetailsModalProps {
  video: ExploreVideo
  isOpen: boolean
  onClose: () => void
  isAuthenticated: boolean
}

export function VideoDetailsModal({ video, isOpen, onClose, isAuthenticated }: VideoDetailsModalProps) {
  const [licensePeriods, setLicensePeriods] = useState(1)
  
  const { buyLicense, loading: licenseLoading } = useOriginLicensing()

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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleBuyLicense = async () => {
    if (!isAuthenticated) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      const success = await buyLicense(video.tokenId, licensePeriods)
      if (success) {
        toast.success('License purchased successfully!')
        onClose()
      }
    } catch (error) {
      console.error('Failed to buy license:', error)
    }
  }

  const totalLicenseCost = 0.1 * licensePeriods // Fixed cost of 0.1 CAMP per period

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
            className="bg-provn-surface border border-provn-border rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-provn-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-provn-accent/20 rounded-lg">
                  <Info className="w-5 h-5 text-provn-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-provn-text font-headline">IP-NFT Details & Licensing</h2>
                  <p className="text-sm text-provn-muted font-headline">Intellectual property information and licensing options</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-provn-surface-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-provn-muted" />
              </button>
            </div>

            {/* Content - Combined IP Information and Licensing */}
            <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
              {/* Video Information Card */}
              <div className="bg-provn-surface-2 rounded-lg p-4">
                <div className="flex gap-4">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-provn-accent/20 flex items-center justify-center">
                      <span className="text-provn-accent font-bold">#{video.tokenId.slice(-4)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-provn-text text-lg font-headline">{video.title}</h3>
                    <p className="text-provn-muted font-headline">by @{video.creator.handle}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-provn-muted font-headline">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {video.metrics.views.toLocaleString()} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {video.metrics.likes.toLocaleString()} likes
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* IP-NFT Information Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-provn-text font-headline flex items-center gap-2">
                  <Shield className="w-5 h-5 text-provn-accent" />
                  IP-NFT Information
                </h3>
                
                {/* IP Status and Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-provn-surface-2 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-provn-text font-headline">Token ID</h4>
                      <button
                        onClick={() => copyToClipboard(video.tokenId, 'Token ID')}
                        className="p-1 hover:bg-provn-surface rounded transition-colors"
                        title="Copy token ID"
                      >
                        <Copy className="w-3 h-3 text-provn-muted" />
                      </button>
                    </div>
                    <p className="text-provn-muted font-mono text-sm break-all font-headline">
                      #{video.tokenId.length > 20 
                        ? `${video.tokenId.slice(0, 8)}...${video.tokenId.slice(-8)}`
                        : video.tokenId
                      }
                    </p>
                    <div className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      video.ipInfo.status === 'verified'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {video.ipInfo.status === 'verified' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Pending
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-provn-surface-2 rounded-lg p-4">
                    <h4 className="font-semibold text-provn-text mb-2 font-headline">Content Type</h4>
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      video.ipInfo.type === 'original'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      <Shield className="w-3 h-3" />
                      {video.ipInfo.type === 'original' ? 'Original' : 'Derivative'}
                    </div>
                    <p className="text-provn-muted text-sm mt-2 font-headline">Minted on {formatDate(video.ipInfo.mintDate)}</p>
                  </div>
                </div>

                {/* Parent Info (if derivative) */}
                {video.ipInfo.parentId && (
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-provn-text mb-2 font-headline">Parent IP-NFT</h4>
                    <p className="text-provn-muted font-headline">This is a derivative work based on IP-NFT #{video.ipInfo.parentId?.slice(0, 6)}...{video.ipInfo.parentId?.slice(-4)}</p>
                  </div>
                )}
              </div>

              {/* Licensing Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-provn-text font-headline flex items-center gap-2">
                  <Coins className="w-5 h-5 text-provn-accent" />
                  Licensing Information
                </h3>
                
                {/* License Info */}
                <div className="bg-provn-surface-2 rounded-lg p-4">
                  <h4 className="font-semibold text-provn-text mb-4 font-headline">Remix License Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-provn-muted font-headline">Price per period</p>
                      <p className="font-bold text-provn-text font-headline">0.1 CAMP</p>
                    </div>
                    <div>
                      <p className="text-sm text-provn-muted font-headline">Duration</p>
                      <p className="font-bold text-provn-text font-headline">{Math.floor(video.licensing.duration / 86400)} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-provn-muted font-headline">Royalty</p>
                      <p className="font-bold text-provn-text font-headline">{video.licensing.royalty}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-provn-muted font-headline">Payment Token</p>
                      <p className="font-bold text-provn-text font-headline">CAMP</p>
                    </div>
                  </div>
                </div>

                {/* License Purchase */}
                <div className="bg-gradient-to-br from-provn-accent/5 to-provn-success/5 border border-provn-accent/20 rounded-lg p-6">
                  <h4 className="font-semibold text-provn-text mb-4 font-headline">Purchase License</h4>
                  <p className="text-provn-muted mb-4 font-headline">
                    Purchase a license to create derivative works based on this content.
                  </p>
                  
                  {/* Period Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-provn-text mb-2 font-headline">
                      License Periods
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={licensePeriods}
                        onChange={(e) => setLicensePeriods(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 bg-provn-surface border border-provn-border rounded-lg text-provn-text focus:outline-none focus:ring-2 focus:ring-provn-accent"
                      />
                      <span className="text-provn-muted font-headline">
                        × {Math.floor(video.licensing.duration / 86400)} days each
                      </span>
                    </div>
                  </div>

                  {/* Total Cost */}
                  <div className="bg-provn-surface rounded-lg p-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-provn-muted font-headline">Total Cost:</span>
                      <span className="font-bold text-provn-accent font-headline">{totalLicenseCost} CAMP</span>
                    </div>
                  </div>

                  <ProvnButton
                    onClick={handleBuyLicense}
                    disabled={!isAuthenticated || licenseLoading}
                    className="w-full"
                  >
                    {licenseLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        <Coins className="w-4 h-4 mr-2" />
                        Get License ({totalLicenseCost} CAMP)
                      </>
                    )}
                  </ProvnButton>

                  {!isAuthenticated && (
                    <p className="text-sm text-provn-muted text-center mt-2 font-headline">
                      Connect your wallet to purchase a license
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 p-6 border-t border-provn-border">
              {video.ipInfo.transactionHash ? (
                <ProvnButton
                  variant="secondary"
                  onClick={() => window.open(`https://basecamp.cloud.blockscout.com/tx/${video.ipInfo.transactionHash}`, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Blockscout
                </ProvnButton>
              ) : (
                <ProvnButton
                  variant="secondary"
                  disabled
                  className="flex-1 opacity-50"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  No Transaction Hash
                </ProvnButton>
              )}
              
              <ProvnButton
                variant="secondary"
                onClick={() => {
                  // TODO: Implement report functionality
                  toast.info('Report functionality coming soon')
                }}
                className="px-6"
              >
                <Flag className="w-4 h-4 mr-2" />
                Report
              </ProvnButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}