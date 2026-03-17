/**
 * Application configuration for IPFS and media handling
 */

export const config = {
  // IPFS Configuration
  ipfs: {
    // Whether to use proxy service for IPFS content (recommended to avoid CORS issues)
    useProxy: true,
    
    // Whether to load thumbnails (set to false to avoid CORS issues temporarily)
    enableThumbnails: false,
    
    // Maximum retries for IPFS gateway requests
    maxRetries: 3,
    
    // Default timeout for IPFS requests (in milliseconds)
    requestTimeout: 15000,
    
    // Cache TTL for IPFS URLs (in milliseconds)
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  },
  
  // Video Player Configuration
  video: {
    // Whether to auto-play videos when they come into view
    autoPlay: true,
    
    // Whether to start videos muted (required for autoplay in most browsers)
    startMuted: true,
    
    // Preload strategy: 'none', 'metadata', 'auto'
    preload: 'metadata' as const,
    
    // Enable video controls
    showControls: true,
  },
  
  // Performance Configuration
  performance: {
    // Maximum number of videos to load in a single request
    videosPerPage: 20,
    
    // Enable lazy loading for off-screen videos
    lazyLoading: true,
    
    // Intersection observer threshold for lazy loading
    intersectionThreshold: 0.1,
  },
  
  // Development Configuration
  dev: {
    // Enable verbose logging in development
    enableLogging: process.env.NODE_ENV === 'development',
    
    // Use mock data when APIs are unavailable
    useMockData: false,
    
    // Enable IPFS gateway health monitoring
    monitorGateways: process.env.NODE_ENV === 'development',
  }
}

export type AppConfig = typeof config