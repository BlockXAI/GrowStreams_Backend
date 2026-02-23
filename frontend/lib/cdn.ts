// CDN and streaming service for Provn platform
// Handles video delivery, caching, and HLS streaming

import { ipfsService } from './ipfs'

export interface StreamingConfig {
  baseUrl: string
  cacheTTL: number
  enableHLS: boolean
  thumbnailSizes: number[]
  videoQualities: string[]
}

export interface VideoStream {
  playlistUrl: string
  thumbnailUrl: string
  posterUrl: string
  duration: number
  qualities: StreamQuality[]
  captions?: Caption[]
}

export interface StreamQuality {
  resolution: string
  bitrate: number
  url: string
  bandwidth: number
}

export interface Caption {
  language: string
  label: string
  url: string
}

export interface CDNResponse {
  success: boolean
  data?: any
  error?: string
  cached?: boolean
  cacheExpiry?: string
}

class CDNService {
  private config: StreamingConfig
  private cache: Map<string, { data: any; expiry: number }> = new Map()

  constructor() {
    this.config = {
      baseUrl: process.env.CDN_BASE_URL || 'https://cdn.provn.app',
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
      enableHLS: true,
      thumbnailSizes: [160, 320, 480, 720, 1080],
      videoQualities: ['360p', '480p', '720p', '1080p']
    }
  }

  // Get streaming URLs for video
  async getVideoStream(videoId: string, ipfsHash: string): Promise<VideoStream | null> {
    try {
      const cacheKey = `stream:${videoId}`
      const cached = this.getFromCache(cacheKey)
      
      if (cached) {
        console.log(`📦 Returning cached stream for ${videoId}`)
        return cached
      }

      // Generate streaming URLs
      const baseStreamUrl = `${this.config.baseUrl}/stream/${ipfsHash}`
      const baseThumbnailUrl = `${this.config.baseUrl}/thumbnail/${ipfsHash}`

      const stream: VideoStream = {
        playlistUrl: `${baseStreamUrl}/playlist.m3u8`,
        thumbnailUrl: `${baseThumbnailUrl}/thumb_720.jpg`,
        posterUrl: `${baseThumbnailUrl}/poster_1080.jpg`,
        duration: 0, // Will be populated from video metadata
        qualities: this.generateQualityVariants(baseStreamUrl),
        captions: [] // Future: Add caption support
      }

      // Cache the result
      this.setCache(cacheKey, stream)
      
      console.log(`✅ Generated streaming URLs for video ${videoId}`)
      return stream

    } catch (error) {
      console.error(`❌ Failed to generate stream for video ${videoId}:`, error)
      return null
    }
  }

  // Get IPFS content via CDN gateway
  async getIPFSContent(ipfsHash: string, fileName?: string): Promise<CDNResponse> {
    try {
      const cacheKey = `ipfs:${ipfsHash}:${fileName || 'content'}`
      const cached = this.getFromCache(cacheKey)
      
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          cacheExpiry: new Date(Date.now() + this.config.cacheTTL).toISOString()
        }
      }

      // Get content from IPFS via optimized gateway
      const contentUrl = await this.getOptimizedIPFSUrl(ipfsHash, fileName)
      
      // For now, just return the URL
      // In production, you'd fetch and cache the actual content
      const result = {
        url: contentUrl,
        ipfsHash,
        fileName,
        gateway: 'cdn-optimized'
      }

      this.setCache(cacheKey, result)

      return {
        success: true,
        data: result,
        cached: false
      }

    } catch (error) {
      console.error(`❌ Failed to get IPFS content via CDN:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CDN fetch failed'
      }
    }
  }

  // Generate optimized thumbnail URLs
  generateThumbnailUrls(ipfsHash: string): { [size: string]: string } {
    const thumbnails: { [size: string]: string } = {}
    
    for (const size of this.config.thumbnailSizes) {
      thumbnails[`${size}p`] = `${this.config.baseUrl}/thumbnail/${ipfsHash}/thumb_${size}.jpg`
    }

    // Add special sizes
    thumbnails.poster = `${this.config.baseUrl}/thumbnail/${ipfsHash}/poster_1080.jpg`
    thumbnails.preview = `${this.config.baseUrl}/thumbnail/${ipfsHash}/preview_320.jpg`
    
    return thumbnails
  }

  // Get optimized IPFS gateway URL using enhanced gateway service
  async getOptimizedIPFSUrl(ipfsHash: string, fileName?: string): Promise<string> {
    try {
      // Import the enhanced gateway service
      const { ipfsGateway } = await import('./ipfs-gateway')
      
      const baseUrl = await ipfsGateway.getOptimalUrl(ipfsHash)
      return fileName ? `${baseUrl}/${fileName}` : baseUrl
    } catch (error) {
      console.warn('Failed to get optimal IPFS URL, using fallback:', error)
      
      // Fallback to CloudFlare if gateway service fails
      const fallbackUrl = `https://cf-ipfs.com/ipfs/${ipfsHash}`
      return fileName ? `${fallbackUrl}/${fileName}` : fallbackUrl
    }
  }

  // Generate HLS quality variants
  private generateQualityVariants(baseUrl: string): StreamQuality[] {
    const qualities: StreamQuality[] = [
      {
        resolution: '360p',
        bitrate: 800,
        bandwidth: 1000000,
        url: `${baseUrl}/360p/playlist.m3u8`
      },
      {
        resolution: '480p',
        bitrate: 1200,
        bandwidth: 1500000,
        url: `${baseUrl}/480p/playlist.m3u8`
      },
      {
        resolution: '720p',
        bitrate: 2000,
        bandwidth: 2500000,
        url: `${baseUrl}/720p/playlist.m3u8`
      },
      {
        resolution: '1080p',
        bitrate: 4000,
        bandwidth: 5000000,
        url: `${baseUrl}/1080p/playlist.m3u8`
      }
    ]

    return qualities
  }

  // Cache management
  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    
    if (!cached) {
      return null
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.config.cacheTTL
    })
  }

  // Clear expired cache entries
  clearExpiredCache(): number {
    const now = Date.now()
    let cleared = 0

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiry) {
        this.cache.delete(key)
        cleared++
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`)
    }

    return cleared
  }

  // Get cache statistics
  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: 1000, // Configurable max cache size
      hitRate: 0 // Would track this in production
    }
  }

  // Health check for CDN service
  async healthCheck(): Promise<{ status: string; cache: any; config: any }> {
    try {
      const cacheStats = this.getCacheStats()
      
      return {
        status: 'healthy',
        cache: {
          entries: cacheStats.size,
          maxSize: cacheStats.maxSize,
          hitRate: cacheStats.hitRate
        },
        config: {
          baseUrl: this.config.baseUrl,
          cacheTTL: this.config.cacheTTL,
          enableHLS: this.config.enableHLS
        }
      }
    } catch (error) {
      console.error('CDN health check failed:', error)
      return {
        status: 'unhealthy',
        cache: {},
        config: {}
      }
    }
  }
}

// Export singleton instance
export const cdnService = new CDNService()

// Utility functions for video streaming
export const streamingUtils = {
  // Generate video.js compatible source object
  generateVideoJSConfig: (stream: VideoStream) => ({
    sources: stream.qualities.map(quality => ({
      src: quality.url,
      type: 'application/x-mpegURL',
      label: quality.resolution,
      res: parseInt(quality.resolution)
    })),
    poster: stream.posterUrl,
    preload: 'metadata',
    responsive: true,
    fluid: true,
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    plugins: {
      hotkeys: true
    }
  }),

  // Generate HLS.js compatible config
  generateHLSConfig: (stream: VideoStream) => ({
    autoStartLoad: true,
    startPosition: -1,
    debug: process.env.NODE_ENV === 'development',
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 90
  }),

  // Parse HLS manifest (basic)
  parseM3U8: (manifest: string) => {
    const lines = manifest.split('\n').filter(line => line.trim())
    const segments: string[] = []
    
    for (const line of lines) {
      if (!line.startsWith('#')) {
        segments.push(line.trim())
      }
    }
    
    return segments
  },

  // Validate streaming URL
  isValidStreamUrl: (url: string): boolean => {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.pathname.endsWith('.m3u8') || parsedUrl.pathname.endsWith('.mpd')
    } catch {
      return false
    }
  }
}

// Background cache cleanup
setInterval(() => {
  cdnService.clearExpiredCache()
}, 60 * 60 * 1000) // Every hour