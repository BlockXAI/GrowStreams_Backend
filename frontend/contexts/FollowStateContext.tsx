"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface FollowState {
  [walletAddress: string]: {
    isFollowing: boolean
    followers: number
  }
}

interface FollowStateContextType {
  followStates: FollowState
  updateFollowState: (walletAddress: string, isFollowing: boolean, followers: number) => void
  getFollowState: (walletAddress: string) => { isFollowing: boolean; followers: number } | null
}

const FollowStateContext = createContext<FollowStateContextType | undefined>(undefined)

interface FollowStateProviderProps {
  children: ReactNode
}

export function FollowStateProvider({ children }: FollowStateProviderProps) {
  const [followStates, setFollowStates] = useState<FollowState>({})

  const updateFollowState = useCallback((walletAddress: string, isFollowing: boolean, followers: number) => {
    setFollowStates(prev => ({
      ...prev,
      [walletAddress.toLowerCase()]: {
        isFollowing,
        followers
      }
    }))
  }, [])

  const getFollowState = useCallback((walletAddress: string) => {
    const normalizedAddress = walletAddress.toLowerCase()
    return followStates[normalizedAddress] || null
  }, [followStates])

  return (
    <FollowStateContext.Provider value={{
      followStates,
      updateFollowState,
      getFollowState
    }}>
      {children}
    </FollowStateContext.Provider>
  )
}

export function useFollowState() {
  const context = useContext(FollowStateContext)
  if (context === undefined) {
    throw new Error('useFollowState must be used within a FollowStateProvider')
  }
  return context
}