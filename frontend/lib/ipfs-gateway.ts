/**
 * Enhanced IPFS Gateway Service with Rate Limiting and Fallbacks
 * Prevents 429 errors and provides reliable content access
 */

// Request throttling and rate limiting
class RequestThrottler {
  private requestCounts = new Map<string, { count: number; resetTime: number }>()
  private readonly maxRequests = 10 // Max requests per minute per gateway
  private readonly windowMs = 60 * 1000 // 1 minute window

  canMakeRequest(gateway: string): boolean {
    const now = Date.now()
    const data = this.requestCounts.get(gateway)

    if (!data || now > data.resetTime) {
      this.requestCounts.set(gateway, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    if (data.count < this.maxRequests) {
      data.count++
      return true
    }

    return false
  }

  getNextAvailableTime(gateway: string): number {
    const data = this.requestCounts.get(gateway)
    return data ? data.resetTime : Date.now()
  }

  reset(gateway: string): void {
    this.requestCounts.delete(gateway)
  }
}

// Enhanced IPFS Gateway service
export class IPFSGatewayService {
  private throttler = new RequestThrottler()
  private cache = new Map<string, { url: string; timestamp: number }>()
  private readonly cacheTTL = 5 * 60 * 1000 // 5 minutes

  // Prioritized gateway list - fastest and most reliable first
  private readonly gateways = [
    { url: 'https://dweb.link', priority: 1, name: 'IPFS.tech' },
    { url: 'https://ipfs.io', priority: 2, name: 'IPFS.io' },
    { url: 'https://cloudflare-ipfs.com', priority: 3, name: 'CloudFlare' },
    { url: 'https://gateway.pinata.cloud', priority: 4, name: 'Pinata' },
  ]

  /**
   * Get the best available IPFS URL with automatic fallbacks
   * Uses proxy service to bypass CORS/CORB restrictions
   */
  async getOptimalUrl(ipfsHashOrUrl: string, useProxy = true): Promise<string> {
    const hash = this.extractIPFSHash(ipfsHashOrUrl)
    if (!hash) return ipfsHashOrUrl

    const cacheKey = `optimal:${hash}:${useProxy ? 'proxy' : 'direct'}`
    const cached = this.cache.get(cacheKey)

    // Return cached URL if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.url
    }

    // Find first available gateway
    for (const gateway of this.gateways) {
      if (this.throttler.canMakeRequest(gateway.url)) {
        const directUrl = `${gateway.url}/ipfs/${hash}`
        
        // Use proxy service to bypass CORS/CORB issues
        const url = useProxy 
          ? `/api/proxy/video?url=${encodeURIComponent(directUrl)}`
          : directUrl
        
        // Cache the successful URL
        this.cache.set(cacheKey, { url, timestamp: Date.now() })
        
        console.log(`🌐 Using ${gateway.name} gateway${useProxy ? ' via proxy' : ''} for IPFS content`)
        return url
      }
    }

    // If all gateways are throttled, use the highest priority one
    const fallbackGateway = this.gateways[0]
    const directUrl = `${fallbackGateway.url}/ipfs/${hash}`
    const fallbackUrl = useProxy 
      ? `/api/proxy/video?url=${encodeURIComponent(directUrl)}`
      : directUrl
    
    console.warn(`⚠️ All gateways throttled, using ${fallbackGateway.name}${useProxy ? ' via proxy' : ''} as fallback`)
    return fallbackUrl
  }

  /**
   * Get multiple fallback URLs for error handling
   * Includes both direct and proxied URLs
   */
  getFallbackUrls(ipfsHashOrUrl: string, includeProxy = true): string[] {
    const hash = this.extractIPFSHash(ipfsHashOrUrl)
    if (!hash) return [ipfsHashOrUrl]

    const directUrls = this.gateways.map(gateway => `${gateway.url}/ipfs/${hash}`)
    
    if (!includeProxy) {
      return directUrls
    }

    // Include proxied versions for better CORS handling
    const proxiedUrls = directUrls.map(url => `/api/proxy/video?url=${encodeURIComponent(url)}`)
    
    // Interleave direct and proxied URLs (try proxy first for better reliability)
    const fallbacks: string[] = []
    for (let i = 0; i < directUrls.length; i++) {
      fallbacks.push(proxiedUrls[i]) // Proxy first
      fallbacks.push(directUrls[i])  // Then direct
    }
    
    return fallbacks
  }

  /**
   * Create an error handler that cycles through fallback gateways
   */
  createErrorHandler(originalUrl: string) {
    const fallbacks = this.getFallbackUrls(originalUrl)
    let currentIndex = 0

    return (element: HTMLVideoElement | HTMLImageElement) => {
      currentIndex++
      if (currentIndex < fallbacks.length) {
        const nextUrl = fallbacks[currentIndex]
        const gatewayName = this.gateways[currentIndex]?.name || 'Unknown'
        
        console.log(`🔄 IPFS: Switching to ${gatewayName} gateway`)
        element.src = nextUrl
        
        // Reset throttling for failed gateway
        const failedGateway = this.gateways[currentIndex - 1]
        if (failedGateway) {
          this.throttler.reset(failedGateway.url)
        }
      } else {
        console.error('❌ IPFS: All gateways failed for:', originalUrl)
        element.onerror = null // Prevent infinite retry loop
      }
    }
  }

  /**
   * Preload IPFS content to warm up gateways
   */
  async preloadContent(ipfsHashOrUrl: string): Promise<boolean> {
    try {
      const url = await this.getOptimalUrl(ipfsHashOrUrl)
      
      // Create a hidden image/video element to preload
      const element = document.createElement('img')
      element.style.display = 'none'
      
      return new Promise((resolve) => {
        element.onload = () => {
          document.body.removeChild(element)
          resolve(true)
        }
        element.onerror = () => {
          document.body.removeChild(element)
          resolve(false)
        }
        
        element.src = url
        document.body.appendChild(element)
      })
    } catch (error) {
      console.warn('Failed to preload IPFS content:', error)
      return false
    }
  }

  /**
   * Extract IPFS hash from various URL formats
   */
  private extractIPFSHash(input: string): string | null {
    if (!input) return null

    // Direct hash
    if (input.match(/^(Qm[a-zA-Z0-9]{44}|bafy[a-zA-Z0-9]+)$/)) {
      return input
    }

    // Extract from URL
    const hashMatch = input.match(/\/ipfs\/([a-zA-Z0-9]+)/)
    return hashMatch ? hashMatch[1] : null
  }

  /**
   * Check gateway health and update priorities
   */
  async checkGatewayHealth(): Promise<{ [gateway: string]: boolean }> {
    const healthStatus: { [gateway: string]: boolean } = {}
    const testHash = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG' // IPFS logo

    for (const gateway of this.gateways) {
      try {
        const testUrl = `${gateway.url}/ipfs/${testHash}`
        const response = await fetch(testUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })
        
        healthStatus[gateway.name] = response.ok
        
        if (!response.ok) {
          console.warn(`🔥 Gateway ${gateway.name} is unhealthy: ${response.status}`)
        }
      } catch (error) {
        healthStatus[gateway.name] = false
        console.warn(`🔥 Gateway ${gateway.name} failed health check:`, error)
      }
    }

    return healthStatus
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    const now = Date.now()
    let cleared = 0

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.cacheTTL) {
        this.cache.delete(key)
        cleared++
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired IPFS cache entries`)
    }

    return cleared
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheTTL: this.cacheTTL,
      gatewayCount: this.gateways.length,
      throttledGateways: Array.from(this.throttler['requestCounts'].keys()).length
    }
  }
}

// Export singleton instance
export const ipfsGateway = new IPFSGatewayService()

// Backward compatibility exports - Default to using proxy to avoid CORS issues
export const getReliableIPFSUrl = async (url: string) => {
  try {
    return await ipfsGateway.getOptimalUrl(url, true) // Use proxy by default
  } catch (error) {
    console.warn('Failed to get optimal URL, using fallback:', error)
    return url
  }
}

export const getIPFSFallbacks = (url: string) => ipfsGateway.getFallbackUrls(url)
export const createIPFSErrorHandler = (url: string) => ipfsGateway.createErrorHandler(url)

// Background cache cleanup
setInterval(() => {
  ipfsGateway.clearExpiredCache()
}, 60 * 1000) // Every minute