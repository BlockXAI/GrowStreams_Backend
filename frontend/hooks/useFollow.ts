import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { toast } from 'sonner'
import { useFollowState } from '@/contexts/FollowStateContext'

interface UseFollowReturn {
  followers: number
  following: number
  isFollowing: boolean
  loading: boolean
  followUser: () => Promise<void>
  unfollowUser: () => Promise<void>
  refetch: () => Promise<void>
}

export function useFollow(profileIdentifier: string): UseFollowReturn {
  const { walletAddress } = useAuth()
  const { getFollowState, updateFollowState } = useFollowState()
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileAddress, setProfileAddress] = useState<string>('')

  const fetchFollowData = useCallback(async () => {
    if (!profileIdentifier) return

    // Check if we have cached state first
    const cachedState = getFollowState(profileIdentifier)
    if (cachedState) {
      setIsFollowing(cachedState.isFollowing)
      setFollowers(cachedState.followers)
      return
    }

    setLoading(true)
    try {
      const currentUser = walletAddress || ''
      const response = await fetch(`/api/profile/${profileIdentifier}/follows?currentUser=${currentUser}`)
      const data = await response.json()

      if (data.success) {
        const newFollowers = data.data.followers
        const newIsFollowing = data.data.isFollowing
        
        setFollowers(newFollowers)
        setFollowing(data.data.following)
        setIsFollowing(newIsFollowing)
        setProfileAddress(data.data.profileAddress)
        
        // Update global state
        updateFollowState(profileIdentifier, newIsFollowing, newFollowers)
      }
    } catch (error) {
      console.error('Error fetching follow data:', error)
    } finally {
      setLoading(false)
    }
  }, [profileIdentifier, walletAddress, getFollowState, updateFollowState])

  const followUser = useCallback(async () => {
    if (!walletAddress || !profileAddress) {
      toast.error('Wallet not connected')
      return
    }

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify({
          followingAddress: profileAddress
        })
      })

      const data = await response.json()

      if (data.success) {
        const newFollowers = followers + 1
        setIsFollowing(true)
        setFollowers(newFollowers)
        // Update global state
        updateFollowState(profileIdentifier, true, newFollowers)
      } else {
        throw new Error(data.error || 'Failed to follow user')
      }
    } catch (error: any) {
      console.error('Failed to follow user:', error)
      toast.error(error.message || 'Failed to follow user')
    }
  }, [walletAddress, profileAddress, profileIdentifier, updateFollowState, followers])

  const unfollowUser = useCallback(async () => {
    if (!walletAddress || !profileAddress) {
      toast.error('Wallet not connected')
      return
    }

    try {
      const response = await fetch('/api/follow', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify({
          followingAddress: profileAddress
        })
      })

      const data = await response.json()

      if (data.success) {
        const newFollowers = Math.max(0, followers - 1)
        setIsFollowing(false)
        setFollowers(newFollowers)
        // Update global state
        updateFollowState(profileIdentifier, false, newFollowers)
      } else {
        throw new Error(data.error || 'Failed to unfollow user')
      }
    } catch (error: any) {
      console.error('Failed to unfollow user:', error)
      toast.error(error.message || 'Failed to unfollow user')
    }
  }, [walletAddress, profileAddress, profileIdentifier, updateFollowState, followers])

  const refetch = useCallback(async () => {
    await fetchFollowData()
  }, [fetchFollowData])

  useEffect(() => {
    fetchFollowData()
  }, [fetchFollowData])

  return {
    followers,
    following,
    isFollowing,
    loading,
    followUser,
    unfollowUser,
    refetch
  }
}
