"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { ExploreVideo } from '@/types/explore'
import { VideoDetailsModal } from '@/components/explore/VideoDetailsModal'

interface VideoModalState {
  isOpen: boolean
  video: ExploreVideo | null
}

interface VideoModalContextType {
  state: VideoModalState
  openVideoModal: (video: ExploreVideo) => void
  closeVideoModal: () => void
  updateVideo: (updates: Partial<ExploreVideo>) => void
}

const VideoModalContext = createContext<VideoModalContextType | undefined>(undefined)

interface VideoModalProviderProps {
  children: React.ReactNode
}

export function VideoModalProvider({ children }: VideoModalProviderProps) {
  const [state, setState] = useState<VideoModalState>({
    isOpen: false,
    video: null
  })
  
  // Public mode: treat as authenticated for viewing details
  const isAuthenticated = true

  const openVideoModal = useCallback((video: ExploreVideo) => {
    setState({
      isOpen: true,
      video
    })
  }, [])

  const closeVideoModal = useCallback(() => {
    setState({
      isOpen: false,
      video: null
    })
  }, [])

  const updateVideo = useCallback((updates: Partial<ExploreVideo>) => {
    setState(prev => ({
      ...prev,
      video: prev.video ? { ...prev.video, ...updates } : null
    }))
  }, [])

  const contextValue: VideoModalContextType = {
    state,
    openVideoModal,
    closeVideoModal,
    updateVideo
  }

  return (
    <VideoModalContext.Provider value={contextValue}>
      {children}
      
      {/* Global Video Modal */}
      {state.video && (
        <VideoDetailsModal
          video={state.video}
          isOpen={state.isOpen}
          onClose={closeVideoModal}
          isAuthenticated={isAuthenticated}
        />
      )}
    </VideoModalContext.Provider>
  )
}

export function useVideoModal() {
  const context = useContext(VideoModalContext)
  if (context === undefined) {
    throw new Error('useVideoModal must be used within a VideoModalProvider')
  }
  return context
}

// Convenience hook for just opening videos
export function useGlobalVideoModal() {
  const { openVideoModal } = useVideoModal()
  return { openVideoModal }
}