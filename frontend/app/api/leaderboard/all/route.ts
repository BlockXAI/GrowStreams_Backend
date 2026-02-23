import { NextRequest, NextResponse } from 'next/server';

// Get all scorecards (leaderboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sort') || 'score'; // score | date
    const order = searchParams.get('order') || 'desc'; // asc | desc

    // TODO: Query from database
    // const { data, error } = await supabase
    //   .from('campaign_results')
    //   .select('*')
    //   .order(sortBy, { ascending: order === 'asc' })
    //   .range((page - 1) * limit, page * limit - 1);

    // Mock data for now
    const mockLeaderboard = [
      {
        rank: 1,
        username: 'Adityaakr',
        actor_id: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        score: 44,
        tier: 'Emerging',
        commits: 73,
        repos: 13,
        analyzed_at: '2025-11-07T03:00:00Z',
      },
      {
        rank: 2,
        username: 'Satyam-10124',
        actor_id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        score: 35,
        tier: 'Emerging',
        commits: 120,
        repos: 25,
        analyzed_at: '2025-11-07T02:30:00Z',
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        items: mockLeaderboard,
        pagination: {
          page,
          limit,
          total: mockLeaderboard.length,
          total_pages: Math.ceil(mockLeaderboard.length / limit),
        },
        sort: {
          by: sortBy,
          order,
        },
      },
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch leaderboard' 
      },
      { status: 500 }
    );
  }
}
