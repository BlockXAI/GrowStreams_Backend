import { NextRequest, NextResponse } from 'next/server';
import { analyzeGitHubUser } from '@/lib/github-analyzer';

// Public scorecard endpoint - anyone can view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const windowDays = parseInt(searchParams.get('window_days') || '180');

    // Get fresh analysis
    const analysis = await analyzeGitHubUser(username, windowDays);

    return NextResponse.json({
      success: true,
      data: analysis,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Scorecard error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate scorecard',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
