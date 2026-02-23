"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/provn/navigation"
import { VideoFeed } from "@/components/explore/VideoFeed"
import { VideoDetailsModal } from "@/components/explore/VideoDetailsModal"
// Auth removed for public mode
import { ExploreVideo } from "@/types/explore"
import "@/styles/explore.css"

export default function ExplorePage() {
  const [selectedVideo, setSelectedVideo] = useState<ExploreVideo | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  // Always use platform data source for real videos; public mode auth disabled
  const isAuthenticated = true
  const walletAddress: string | undefined = undefined

  const handleVideoDetails = (video: ExploreVideo) => {
    setSelectedVideo(video)
    setIsDetailsModalOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false)
    setSelectedVideo(null)
  }

  // Store wallet address in localStorage for API calls
  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem('userWallet', walletAddress)
    } else {
      localStorage.removeItem('userWallet')
    }
  }, [walletAddress])

  // Prevent body scroll when in explore mode
  useEffect(() => {
    document.body.classList.add('explore-mode')
    return () => {
      document.body.classList.remove('explore-mode')
    }
  }, [])

  // Handle keyboard navigation and video controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDetailsModalOpen) return
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        // The VideoFeed component will handle the actual navigation
        const event = new CustomEvent('keyboardNavigation', {
          detail: { direction: e.key === 'ArrowUp' ? 'up' : 'down' }
        })
        window.dispatchEvent(event)
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        // Dispatch spacebar event for video play/pause
        const event = new CustomEvent('videoTogglePlayPause')
        window.dispatchEvent(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDetailsModalOpen])

  return (
    <>
      <Navigation currentPage="explore" />
      
      {/* Full screen video feed */}
      <div className="fixed inset-x-0 top-16 bottom-0 bg-black video-container">
        <VideoFeed 
          onVideoDetails={handleVideoDetails}
          isAuthenticated={isAuthenticated}
          dataSource="platform"
        />
      </div>


      {/* Video Details Modal */}
      {selectedVideo && (
        <VideoDetailsModal
          video={selectedVideo}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetails}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  )
}