/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Handle ES modules and external packages
  serverExternalPackages: [
    'viem', 'wagmi',
    '@gear-js/api', '@gear-js/react-hooks', '@gear-js/vara-ui', '@gear-js/wallet-connect', '@gear-js/ui',
    '@polkadot/api', '@polkadot/extension-dapp', '@polkadot/react-identicon',
    'sails-js',
  ],

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle viem and other ESM packages
    config.externals = config.externals || []
    if (isServer) {
      config.externals.push({
        'viem': 'commonjs viem',
        'wagmi': 'commonjs wagmi'
      })
    }

    // Only warn about missing env vars instead of throwing
    if (isServer && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      console.warn('⚠️ Warning: Missing Supabase environment variables. Using mock data for development.')
    }
    
    return config;
  },
};

export default nextConfig;
