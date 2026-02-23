import { useState, useEffect } from 'react'
import { useAuth, useAuthState } from '@campnetwork/origin/react'
import { type Address } from 'viem'
import { ipfsService } from '@/lib/ipfs'

export function useVideoMinting() {
  const auth = useAuth()
  const { authenticated: isConnected } = useAuthState()
  const { origin, jwt, recoverProvider } = auth
  const address = auth.walletAddress

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Clear messages after some time
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  async function fetchTransactionHash(walletAddress: string): Promise<string | null> {
    try {
      // Fetch recent transactions from BaseCAMP API
      const response = await fetch(
        `https://basecamp.cloud.blockscout.com/api/v2/addresses/${walletAddress}/transactions?filter=validated&type=contract_call`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 BaseCAMP API response:', data);
        
        // Get the most recent transaction
        if (data.items && data.items.length > 0) {
          const recentTx = data.items[0];
          return recentTx.hash;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch transaction hash:', error);
    }
    return null;
  }

  async function fetchMetadata(tokenId: string, walletAddress: string): Promise<{ videoUrl: string; metadataHash: string; transactionHash?: string } | null> {
    try {
      if (!origin) return null;
      
      // Get token URI from Origin SDK
      const tokenURI = await (origin as any).tokenURI(BigInt(tokenId));
      console.log('🔍 Token URI:', tokenURI);
      
      // Fetch transaction hash separately
      const transactionHash = await fetchTransactionHash(walletAddress);
      
      if (tokenURI) {
        // Extract IPFS hash from URI
        const metadataHash = tokenURI.replace('https://ivory-total-ox-210.mypinata.cloud/ipfs/', '').replace('https://gateway.pinata.cloud/ipfs/', '');
        
        // Fetch metadata
        const response = await fetch(tokenURI);
        const metadata = await response.json();
        console.log('🔍 Metadata:', metadata);
        
        return {
          videoUrl: metadata.animation_url || '',
          metadataHash,
          transactionHash: transactionHash || undefined
        };
      }
    } catch (error) {
      console.warn('Failed to fetch metadata:', error);
    }
    return null;
  }

  async function uploadToIPFS(file: File): Promise<string> {
    try {
      // Use the existing IPFS service instead of direct API calls
      const result = await ipfsService.uploadFile(file, {
        name: file.name,
        keyValues: {
          contentType: 'video',
          uploadedAt: new Date().toISOString()
        }
      });
      
      if (!result.hash) {
        throw new Error("Failed to get IPFS hash after upload");
      }

      // Return the gateway URL for the uploaded file
      return result.gatewayUrl;
    } catch (error) {
      console.error("IPFS upload error:", error);
      setError("Failed to upload video to IPFS");
      throw error;
    }
  } 

  const mintVideoWithOrigin = async (
    file: File,
    metadata: any,
    license: {
      price: string
      duration: string
      royalty: string
      paymentToken: string
    },
    parentId: string
  ) => {
    // Enhanced connection recovery with retries
    console.log('🔍 Checking wallet connection...')
    
    try {
      await recoverProvider()
    } catch (err) {
      console.warn('First connection attempt failed, retrying...', err)
      try {
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 1000))
        await recoverProvider()
      } catch (retryErr) {
        console.error('Connection retry failed:', retryErr)
        setError('Failed to connect to wallet. Please try refreshing the page and connecting again.')
        return null
      }
    }

    // Validate connection state with retries
    let connectionAttempts = 0
    const maxAttempts = 3
    
    while ((!origin || !jwt || !address) && connectionAttempts < maxAttempts) {
      connectionAttempts++
      console.log(`🔄 Connection attempt ${connectionAttempts}/${maxAttempts}...`)
      
      try {
        await recoverProvider()
        await new Promise(resolve => setTimeout(resolve, 500)) // Give time for state to update
      } catch (err) {
        console.warn(`Connection attempt ${connectionAttempts} failed:`, err)
      }
    }

    if (!origin || !jwt) {
      setError('Wallet connection lost. Please reconnect your wallet and try again.')
      return null
    }
    
    if (!address) {
      setError('Wallet address not found. Please ensure your wallet is connected to BaseCAMP network.')
      return null
    }
    
    console.log('✅ Wallet connection verified:', { hasOrigin: !!origin, hasJWT: !!jwt, address })
    
    // Validate file size (blockchain has limits)
    const maxFileSize = 100 * 1024 * 1024; // 100MB limit
    if (file.size > maxFileSize) {
      setError('File size too large. Maximum size is 100MB.')
      return null
    }
    setLoading(true)
    setError(null)
    
    try {
      // Step 1: Upload to IPFS
      setSuccess("📤 Uploading video to IPFS...");
      let ipfsUrl = "";
      try {
        const rest = await uploadToIPFS(file);
        if (!rest) {
          throw new Error('Failed to upload video to IPFS')
        }
        ipfsUrl = rest;
        setSuccess("✅ Video uploaded to IPFS successfully!");
      } catch (error) {
        console.error('IPFS upload failed:', error);
        setError('Failed to upload video to IPFS. Please try again.');
        return null; 
      }
      
      // Validate metadata to prevent signature errors
      if (!metadata || typeof metadata !== 'object') {
        setError('Invalid metadata format. Please check your video details.');
        return null;
      }
      
      // Ensure required metadata fields exist
      const validatedMetadata = {
        name: metadata.name || file.name || 'Untitled Video',
        description: metadata.description || 'No description provided',
        ...metadata
      };
      
      // Step 2: Prepare for minting
      setSuccess("⛓️ Preparing blockchain transaction...");
      
      // Validate and fix license parameters to prevent signature errors
      const price = parseFloat(license.price || '0');
      const duration = parseInt(license.duration || '2629800');
      const royalty = parseInt(license.royalty || '0');
      
      // Ensure minimum valid values
      const validPrice = Math.max(price, 0.001); // Minimum 0.001 wCAMP
      const validDuration = Math.max(duration, 86400); // Minimum 1 day
      const validRoyalty = Math.min(Math.max(royalty, 0), 50); // 0-50% royalty
      
      const licenseTerms = {
        price: BigInt(Math.floor(validPrice * 1e18)),
        duration: validDuration,
        royaltyBps: validRoyalty * 100,
        paymentToken: (license.paymentToken || '0x0000000000000000000000000000000000000000') as Address,
      }

      const parentTokenId = parentId === '' ? BigInt(0) : BigInt(parentId)
      
      // Debug logging before minting
      console.log('🔍 Debug info before minting:', {
        origin: !!origin,
        jwt: !!jwt,
        address,
        fileSize: file.size,
        fileType: file.type,
        ipfsUrl,
        licenseTerms: {
          price: licenseTerms.price.toString(),
          duration: licenseTerms.duration,
          royaltyBps: licenseTerms.royaltyBps,
          paymentToken: licenseTerms.paymentToken
        },
        metadata,
        parentTokenId: parentTokenId.toString()
      });
      
      const tokenId = await origin.mintFile(
        file,
        {
          ...validatedMetadata,
          animation_url: ipfsUrl, // Use animation_url for videos instead of image
          owner: address,
          price: validPrice.toString(), // Use validated price
          mimeType: file.type,
          size: file.size,
        },
        licenseTerms,
        parentTokenId
      )

      setSuccess(`🎉 IP-NFT minted successfully on BaseCAMP! Token ID: ${tokenId}`)
      return { tokenId, ipfsUrl }
    } catch (err) {
      console.error('Video minting error:', err)
      setError(err instanceof Error ? err.message : 'Failed to mint video IP NFT')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    // State
    loading,
    error,
    success,
    isConnected,
    address,

    // Functions
    mintVideoWithOrigin,
    fetchMetadata,

    // Clear functions
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null),
  }
}