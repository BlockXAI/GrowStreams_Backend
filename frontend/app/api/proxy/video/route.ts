import { NextRequest, NextResponse } from 'next/server'

/**
 * Video Proxy API to bypass CORS restrictions for IPFS content
 * This fixes CORB (Cross-Origin Read Blocking) errors
 */

// Cache for successful proxy responses
const proxyCache = new Map<string, { data: ArrayBuffer; headers: Record<string, string>; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// IPFS gateways with CORS support
const CORS_FRIENDLY_GATEWAYS = [
  'https://ipfs.io',
  'https://dweb.link',
  'https://cloudflare-ipfs.com',
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
    const cached = proxyCache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📦 Serving cached video content')
      return new NextResponse(cached.data, {
        status: 200,
        headers: {
          ...cached.headers,
          'Cache-Control': 'public, max-age=600', // 10 minutes
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Type'
        }
      })
    }

    console.log('🌐 Proxying video request:', url)

    // Fetch from IPFS gateway with proper headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Provn-Video-Proxy/1.0',
        'Accept': 'video/*, application/octet-stream, */*',
        'Range': request.headers.get('range') || 'bytes=0-',
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      console.error('❌ Failed to fetch from IPFS gateway:', response.status, response.statusText)
      return NextResponse.json({ 
        error: `Gateway error: ${response.status} ${response.statusText}` 
      }, { status: response.status })
    }

    // Get response data
    const data = await response.arrayBuffer()
    
    // Extract important headers
    const contentType = response.headers.get('content-type') || 'video/mp4'
    const contentLength = response.headers.get('content-length')
    const acceptRanges = response.headers.get('accept-ranges') || 'bytes'
    const contentRange = response.headers.get('content-range')

    // Prepare response headers with CORS support
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Accept-Ranges': acceptRanges,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Authorization',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
      'Cache-Control': 'public, max-age=600', // 10 minutes
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
    }

    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange
    }

    // Cache successful responses (only for smaller files to avoid memory issues)
    if (data.byteLength < 50 * 1024 * 1024) { // Cache files smaller than 50MB
      proxyCache.set(url, {
        data,
        headers: responseHeaders,
        timestamp: Date.now()
      })
    }

    console.log('✅ Successfully proxied video content:', {
      size: data.byteLength,
      contentType,
      cached: data.byteLength < 50 * 1024 * 1024
    })

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('❌ Proxy error:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to proxy video content',
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
      'Access-Control-Allow-Headers': 'Range, Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    }
  })
}

// Clean up cache periodically
setInterval(() => {
  const now = Date.now()
  let cleaned = 0
  
  for (const [url, cached] of proxyCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      proxyCache.delete(url)
      cleaned++
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired proxy cache entries`)
  }
}, 5 * 60 * 1000) // Every 5 minutes