// GrowStreams Camp Network Integration

// Helper function to get Camp Network SDK instance
export const getCampNetworkSDK = (): any | null => {
  if (typeof window !== 'undefined') {
    return (window as any).__CAMP_NETWORK_INSTANCE__ || null;
  }
  return null;
};

// Helper function to initialize Camp Network SDK
export const initializeCampNetworkSDK = (config: any): void => {
  if (typeof window !== 'undefined') {
    (window as any).__CAMP_NETWORK_CONFIG__ = config;
  }
};

// Mock Camp Network service for API routes (server-side)
// Since Camp Network SDK is client-side only, this is a placeholder
export const campNetworkService = {
  initialized: false,
  
  async initialize() {
    console.log('🔧 GrowStreams Camp Network service initialized (server-side mock)');
    this.initialized = true;
  },
  
  async createIPNFT(params: any): Promise<{ tokenId: string; contractAddress?: string; transactionHash?: string; blockNumber?: number }> {
    console.log('🔧 GrowStreams createIPNFT called (server-side mock)', params);
    throw new Error('Camp Network SDK createIPNFT should be called from client-side only');
  },
  
  async createPost(params: any): Promise<{ postId: string; id?: string; transactionHash?: string }> {
    console.log('🔧 GrowStreams createPost called (server-side mock)', params);
    throw new Error('Camp Network SDK createPost should be called from client-side only');
  }
};

// Legacy exports for backward compatibility
export const getOriginSDK = getCampNetworkSDK;
export const initializeOriginSDK = initializeCampNetworkSDK;
export const originService = campNetworkService;

// Export default for backward compatibility
export default { getCampNetworkSDK, initializeCampNetworkSDK, campNetworkService, getOriginSDK, initializeOriginSDK, originService };