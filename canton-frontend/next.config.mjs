/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    CANTON_JSON_API_URL: process.env.CANTON_JSON_API_URL || 'http://localhost:7575',
    CANTON_LEDGER_HOST: process.env.CANTON_LEDGER_HOST || 'localhost',
    CANTON_LEDGER_PORT: process.env.CANTON_LEDGER_PORT || '6865',
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
