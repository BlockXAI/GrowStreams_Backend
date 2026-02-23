import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    '@gear-js/api', '@gear-js/react-hooks', '@gear-js/vara-ui', '@gear-js/wallet-connect',
    '@polkadot/api', '@polkadot/extension-dapp', '@polkadot/react-identicon',
    'sails-js',
  ],

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Force all packages to share a single React instance
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    };

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
