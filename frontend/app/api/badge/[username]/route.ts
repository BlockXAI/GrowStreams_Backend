import { NextRequest, NextResponse } from 'next/server';
import { analyzeGitHubUser } from '@/lib/github-analyzer';

// Generate SVG badge for embedding
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style') || 'flat';
    const windowDays = parseInt(searchParams.get('window_days') || '180');

    // Get analysis (with cache)
    const analysis = await analyzeGitHubUser(username, windowDays);
    const score = analysis.scores.overall_web3;
    const tier = analysis.tier;

    // Tier colors
    const tierColors: Record<string, string> = {
      'Elite': '#FFD700',      // Gold
      'Expert': '#3B82F6',     // Blue
      'Advanced': '#8B5CF6',   // Purple
      'Intermediate': '#F59E0B', // Orange
      'Beginner': '#6B7280',   // Gray
    };

    const color = tierColors[tier] || '#6B7280';

    // Generate SVG badge
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="35">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:${color};stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="200" height="35" rx="5" fill="#1F2937"/>
        
        <!-- Label -->
        <rect x="0" y="0" width="100" height="35" rx="5" fill="#374151"/>
        <text x="50" y="22" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
          Web3 Score
        </text>
        
        <!-- Score -->
        <rect x="100" y="0" width="100" height="35" rx="5" fill="url(#grad)"/>
        <text x="150" y="22" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">
          ${score}/100
        </text>
      </svg>
    `.trim();

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // 5 minutes
      },
    });

  } catch (error) {
    // Return error badge
    const errorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="35">
        <rect width="200" height="35" rx="5" fill="#EF4444"/>
        <text x="100" y="22" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
          Error Loading Score
        </text>
      </svg>
    `.trim();

    return new NextResponse(errorSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
}
