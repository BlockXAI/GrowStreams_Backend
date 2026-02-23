import { NextRequest, NextResponse } from 'next/server';
import { analyzeGitHubUser } from '@/lib/github-analyzer';

// Generate tier badge SVG
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const windowDays = parseInt(searchParams.get('window_days') || '180');

    // Get analysis
    const analysis = await analyzeGitHubUser(username, windowDays);
    const tier = analysis.tier;
    const score = analysis.scores.overall_web3;

    // Tier config
    const tierConfig: Record<string, { color: string; icon: string }> = {
      'Elite': { color: '#FFD700', icon: '👑' },
      'Expert': { color: '#3B82F6', icon: '🏆' },
      'Advanced': { color: '#8B5CF6', icon: '⭐' },
      'Intermediate': { color: '#F59E0B', icon: '⚡' },
      'Beginner': { color: '#6B7280', icon: '✨' },
    };

    const config = tierConfig[tier] || tierConfig['Beginner'];

    // Generate shield-style badge
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="180" height="40" role="img">
        <title>${tier} Tier - ${score}/100</title>
        <defs>
          <linearGradient id="tierGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${config.color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${config.color};stop-opacity:0.8" />
          </linearGradient>
        </defs>
        
        <!-- Shadow -->
        <rect x="2" y="2" width="176" height="36" rx="6" fill="black" opacity="0.1"/>
        
        <!-- Background -->
        <rect width="180" height="40" rx="6" fill="url(#tierGrad)"/>
        
        <!-- Border -->
        <rect width="180" height="40" rx="6" fill="none" stroke="white" stroke-width="1" opacity="0.3"/>
        
        <!-- Icon -->
        <text x="20" y="28" font-size="20">${config.icon}</text>
        
        <!-- Tier Text -->
        <text x="50" y="20" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white" opacity="0.9">
          ${tier.toUpperCase()}
        </text>
        
        <!-- Score -->
        <text x="50" y="32" font-family="Arial, sans-serif" font-size="9" fill="white" opacity="0.8">
          Score: ${score}/100
        </text>
      </svg>
    `.trim();

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300',
      },
    });

  } catch (error) {
    const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="180" height="40">
        <rect width="180" height="40" rx="6" fill="#EF4444"/>
        <text x="90" y="25" font-family="Arial" font-size="12" fill="white" text-anchor="middle">Error</text>
      </svg>
    `.trim();

    return new NextResponse(errorSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  }
}
