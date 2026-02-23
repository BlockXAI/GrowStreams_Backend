// Real Pinata IPFS service implementation

export interface IPFSUploadResult {
  hash: string
  url: string
  size: number
  gatewayUrl: string
  ipfsHash: string
}

export interface VideoMetadata {
  title: string
  description: string
  creator: string
  tags: string[]
  duration: number
  resolution: string
  format: string
  thumbnail?: string
}

export interface PinataUploadOptions {
  name?: string
  keyValues?: Record<string, any>
}

export class PinataIPFSService {
  private pinataJWT: string | undefined
  private apiUrl = 'https://api.pinata.cloud'
  private gatewayUrl = 'https://gateway.pinata.cloud'
  private isInitialized: boolean = false

  constructor() {
    this.pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT_TOKEN || process.env.PINATA_JWT
    this.isInitialized = !!this.pinataJWT
    
    if (!this.pinataJWT) {
      console.error('❌ Pinata JWT not found in environment variables')
      console.log('Please set NEXT_PUBLIC_PINATA_JWT in your .env.local file')
      console.log('Get your JWT from: https://app.pinata.cloud/keys')
    } else {
      console.log('✅ Pinata IPFS service initialized')
    }
  }

  async uploadFile(file: File, options?: PinataUploadOptions): Promise<IPFSUploadResult> {
    if (!this.pinataJWT) {
      throw new Error('Pinata JWT not configured')
    }

    console.log('📤 Uploading file to Pinata IPFS:', { 
      fileName: file.name, 
      fileSize: file.size,
      options 
    })

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (options) {
        const metadata = {
          name: options.name || file.name,
          keyvalues: options.keyValues || {}
        }
        formData.append('pinataMetadata', JSON.stringify(metadata))
      }

      const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.pinataJWT}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Pinata upload failed:', errorText)
        throw new Error(`Pinata upload failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ File uploaded to IPFS:', result)

      return {
        hash: result.IpfsHash,
        ipfsHash: result.IpfsHash,
        url: `ipfs://${result.IpfsHash}`,
        size: file.size,
        gatewayUrl: `${this.gatewayUrl}/ipfs/${result.IpfsHash}`
      }
    } catch (error) {
      console.error('❌ IPFS upload error:', error)
      throw error
    }
  }

  async uploadVideo(file: File, metadata: VideoMetadata): Promise<IPFSUploadResult> {
    const options: PinataUploadOptions = {
      name: `${metadata.title}-video.${file.name.split('.').pop()}`,
      keyValues: {
        title: metadata.title,
        creator: metadata.creator,
        contentType: 'video',
        tags: metadata.tags.join(','),
        duration: metadata.duration.toString(),
        resolution: metadata.resolution,
        format: metadata.format
      }
    }

    return this.uploadFile(file, options)
  }

  async uploadJSON(data: any, options?: PinataUploadOptions): Promise<IPFSUploadResult> {
    if (!this.pinataJWT) {
      throw new Error('Pinata JWT not configured')
    }

    console.log('📤 Uploading JSON to Pinata IPFS:', { data, options })

    try {
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const file = new File([blob], options?.name || 'metadata.json', { type: 'application/json' })

      return this.uploadFile(file, options)
    } catch (error) {
      console.error('❌ JSON upload error:', error)
      throw error
    }
  }

  async uploadMetadata(metadata: any, options?: PinataUploadOptions): Promise<IPFSUploadResult> {
    const uploadOptions: PinataUploadOptions = {
      name: options?.name || 'metadata.json',
      keyValues: {
        contentType: 'metadata',
        ...options?.keyValues
      }
    }

    return this.uploadJSON(metadata, uploadOptions)
  }

  getGatewayUrl(hash: string): string {
    return `${this.gatewayUrl}/ipfs/${hash}`
  }

  get isReady(): boolean {
    return this.isInitialized
  }

  get initialized(): boolean {
    return this.isInitialized
  }

  getIPFSUrl(hash: string): string {
    return `${this.gatewayUrl}/ipfs/${hash}`
  }

  isValidIPFSHash(hash: string): boolean {
    return /^[a-zA-Z0-9]{46,59}$/.test(hash)
  }
}

// Export real IPFS service
export const ipfsService = new PinataIPFSService()

// Export the class for compatibility
export { PinataIPFSService as IPFSService }

/**
 * IPFS Gateway utilities for reliable content access
 * Now using enhanced gateway service with rate limiting
 */

// Re-export enhanced gateway functions for backward compatibility
export { 
  getReliableIPFSUrl, 
  getIPFSFallbacks, 
  createIPFSErrorHandler 
} from './ipfs-gateway'
