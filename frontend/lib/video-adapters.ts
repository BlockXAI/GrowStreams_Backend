import { ProfileVideo } from '@/hooks/useProfileVideos'
import { ExploreVideo } from '@/types/explore'

/**
 * Convert ProfileVideo to ExploreVideo format for unified modal display
 */
export function profileVideoToExploreVideo(
  profileVideo: ProfileVideo,
  profileInfo?: {
    handle: string
    displayName?: string
    avatarUrl?: string
    followers?: number
    joinedDate?: string
  }
): ExploreVideo {
  const now = new Date().toISOString()
  
  return {
    tokenId: profileVideo.tokenId || profileVideo.id,
    title: profileVideo.title,
    description: profileVideo.description,
    tags: extractTagsFromDescription(profileVideo.description),
    videoUrl: profileVideo.videoUrl,
    thumbnailUrl: profileVideo.thumbnailUrl || undefined,
    creator: {
      handle: profileInfo?.handle || profileVideo.creator.handle || 'anonymous',
      displayName: profileInfo?.displayName || profileInfo?.handle || profileVideo.creator.handle || 'Anonymous Creator',
      avatarUrl: profileInfo?.avatarUrl,
      walletAddress: profileVideo.creator.wallet,
      followers: profileInfo?.followers || 0,
      joinedDate: profileInfo?.joinedDate || now
    },
    ipInfo: {
      ipnftId: profileVideo.tokenId || profileVideo.id,
      status: profileVideo.type === 'platform' ? 'verified' : 'pending',
      type: 'original', // Assume original unless we have parent info
      mintDate: profileVideo.createdAt,
      platformOrigin: profileVideo.type === 'platform'
    },
    licensing: {
      price: profileVideo.license.price || 0,
      duration: profileVideo.license.duration || 86400 * 30, // 30 days default
      royalty: profileVideo.license.royalty || 10, // 10% default
      paymentToken: profileVideo.license.paymentToken || 'wCAMP'
    },
    metrics: {
      views: profileVideo.views,
      likes: profileVideo.likes,
      tips: profileVideo.tips,
      shares: 0 // Profile videos don't track shares yet
    },
    isLiked: false, // We'll need to check this separately if needed
    hasAccess: true // Assume access for profile videos
  }
}

/**
 * Extract potential tags from video description using simple heuristics
 */
function extractTagsFromDescription(description: string): string[] {
  const hashtagRegex = /#(\w+)/g
  const tags = []
  let match
  
  while ((match = hashtagRegex.exec(description)) !== null) {
    tags.push(match[1].toLowerCase())
  }
  
  // If no hashtags found, generate some generic tags based on content
  if (tags.length === 0) {
    const words = description.toLowerCase().split(/\s+/)
    const commonKeywords = ['video', 'content', 'original', 'creative', 'art', 'music', 'entertainment']
    
    for (const keyword of commonKeywords) {
      if (words.some(word => word.includes(keyword))) {
        tags.push(keyword)
        if (tags.length >= 3) break
      }
    }
    
    // Fallback tags
    if (tags.length === 0) {
      tags.push('video', 'content')
    }
  }
  
  return tags.slice(0, 5) // Max 5 tags
}

/**
 * Batch convert multiple profile videos to explore videos
 */
export function batchProfileVideosToExploreVideos(
  profileVideos: ProfileVideo[],
  profileInfo?: {
    handle: string
    displayName?: string
    avatarUrl?: string
    followers?: number
    joinedDate?: string
  }
): ExploreVideo[] {
  return profileVideos.map(video => 
    profileVideoToExploreVideo(video, profileInfo)
  )
}

/**
 * Create a minimal ExploreVideo from basic video data
 * Useful for quick modal opens with minimal data
 */
export function createMinimalExploreVideo(data: {
  tokenId: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  creatorWallet: string
  creatorHandle?: string
}): ExploreVideo {
  const now = new Date().toISOString()
  
  return {
    tokenId: data.tokenId,
    title: data.title,
    description: data.description || '',
    tags: data.description ? extractTagsFromDescription(data.description) : ['video'],
    videoUrl: data.videoUrl,
    thumbnailUrl: data.thumbnailUrl,
    creator: {
      handle: data.creatorHandle || 'anonymous',
      displayName: data.creatorHandle || 'Anonymous Creator',
      walletAddress: data.creatorWallet,
      followers: 0,
      joinedDate: now
    },
    ipInfo: {
      ipnftId: data.tokenId,
      status: 'pending',
      type: 'original',
      mintDate: now,
      platformOrigin: false
    },
    licensing: {
      price: 0,
      duration: 86400 * 30,
      royalty: 10,
      paymentToken: 'wCAMP'
    },
    metrics: {
      views: 0,
      likes: 0,
      tips: 0,
      shares: 0
    },
    isLiked: false,
    hasAccess: true
  }
}

/**
 * Update ExploreVideo with fresh data from API
 * Useful for refreshing modal data after interactions
 */
export function updateExploreVideoWithFreshData(
  existingVideo: ExploreVideo,
  freshData: Partial<ExploreVideo>
): ExploreVideo {
  return {
    ...existingVideo,
    ...freshData,
    creator: {
      ...existingVideo.creator,
      ...(freshData.creator || {})
    },
    ipInfo: {
      ...existingVideo.ipInfo,
      ...(freshData.ipInfo || {})
    },
    licensing: {
      ...existingVideo.licensing,
      ...(freshData.licensing || {})
    },
    metrics: {
      ...existingVideo.metrics,
      ...(freshData.metrics || {})
    }
  }
}