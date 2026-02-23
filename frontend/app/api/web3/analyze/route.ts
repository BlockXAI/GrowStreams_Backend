import { NextRequest, NextResponse } from 'next/server';
import { analyzeGitHubUser } from '@/lib/github-analyzer';

// In-memory cache (5 minutes TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { github_username, window_days = 180 } = body;

    if (!github_username) {
      return NextResponse.json(
        { error: 'github_username is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${github_username}_${window_days}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cache_age_seconds: Math.round((Date.now() - cached.timestamp) / 1000),
      });
    }

    // Analyze user
    const result = await analyzeGitHubUser(github_username, window_days);

    // Update cache
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }

    return NextResponse.json({
      ...result,
      cached: false,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze GitHub user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method with { github_username: string, window_days?: number }',
    example: {
      github_username: 'octocat',
      window_days: 180,
    }
  });
}
