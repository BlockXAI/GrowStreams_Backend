import { NextRequest, NextResponse } from 'next/server'

/**
 * Image Proxy API to bypass CORS restrictions for IPFS images/thumbnails
 * This fixes CORB (Cross-Origin Read Blocking) errors for images
 */

// Cache for successful image responses
const imageCache = new Map<string, { data: ArrayBuffer; headers: Record<string, string>; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes for images

// IPFS gateways with CORS support
const CORS_FRIENDLY_GATEWAYS = [
  'https://ipfs.io',
  'https://cf-ipfs.com',
  'https://dweb.link',
  'https://gateway.pinata.cloud'
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Validate URL is from a trusted IPFS gateway
    const isValidGateway = CORS_FRIENDLY_GATEWAYS.some(gateway => url.startsWith(gateway))
    if (!isValidGateway) {
      return NextResponse.json({ error: 'Invalid gateway' }, { status: 400 })
    }

    // Check cache first
    const cached = imageCache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 Serving cached image content')
      return new NextResponse(cached.data, {
        status: 200,
        headers: {
          ...cached.headers,
          'Cache-Control': 'public, max-age=1800', // 30 minutes
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    console.log('🖼️ Proxying image request:', url)

    // Fetch from IPFS gateway with proper headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Provn-Image-Proxy/1.0',
        'Accept': 'image/*, application/octet-stream, */*',
      },
      signal: AbortSignal.timeout(15000) // 15 second timeout for images
    })

    if (!response.ok) {
      console.error('❌ Failed to fetch image from IPFS gateway:', response.status, response.statusText)
      return NextResponse.json({ 
        error: `Gateway error: ${response.status} ${response.statusText}` 
      }, { status: response.status })
    }

    // Get response data
    const data = await response.arrayBuffer()
    
    // Extract important headers
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const contentLength = response.headers.get('content-length')

    // Prepare response headers with CORS support
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Expose-Headers': 'Content-Length',
      'Cache-Control': 'public, max-age=1800', // 30 minutes
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
    }

    // Cache successful responses (only for smaller images to avoid memory issues)
    if (data.byteLength < 10 * 1024 * 1024) { // Cache images smaller than 10MB
      imageCache.set(url, {
        data,
        headers: responseHeaders,
        timestamp: Date.now()
      })
    }

    console.log('✅ Successfully proxied image content:', {
      size: data.byteLength,
      contentType,
      cached: data.byteLength < 10 * 1024 * 1024
    })

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('❌ Image proxy error:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to proxy image content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    }
  })
}

// Clean up cache periodically
setInterval(() => {
  const now = Date.now()
  let cleaned = 0
  
  for (const [url, cached] of imageCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      imageCache.delete(url)
      cleaned++
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired image cache entries`)
  }
}, 5 * 60 * 1000) // Every 5 minutes