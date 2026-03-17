import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'GrowStreams GitHub AI On-Chain Engine',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: {
      github_analysis: true,
      web3_scoring: true,
      reclaim_verification: true,
      vara_nft_minting: true,
      ecosystem_detection: true,
      maintainer_bonus: true,
      cross_ecosystem_bonus: true,
    },
    endpoints: {
      health: '/api/web3/health',
      analyze: '/api/web3/analyze',
      leaderboard: '/api/leaderboard',
      stats: '/api/platform-stats',
    }
  });
}
